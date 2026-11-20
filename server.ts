import 'dotenv/config';
import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ZodError } from 'zod';
import {
  formatGeminiError,
  GEMINI_MODEL,
  isGeminiConfigured,
} from './backend/services/geminiService.ts';
import { analyzeUploadedImage } from './backend/services/imageAnalyzer.ts';
import { analyzeNewsClaim, NewsInputSchema } from './backend/services/newsAnalyzer.ts';
import { reportStore } from './backend/services/reportStore.ts';
import { analyzeVideoFrames, VideoFramesInputSchema } from './backend/services/videoAnalyzer.ts';
import { analyzeWebsiteSafety, WebsiteInputSchema } from './backend/services/websiteAnalyzer.ts';
import type { HealthStatus, ThreatFeedStatus } from './src/types/analysis.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB max
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Upload a JPG, JPEG, PNG, or WEBP image.'));
    }
  },
});

const analysisLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Rate limit reached. Please wait a minute before submitting additional analyses.',
  },
});

function buildThreatFeeds(): ThreatFeedStatus[] {
  const now = new Date().toISOString();
  const safeBrowsingConnected = Boolean(process.env.GOOGLE_SAFE_BROWSING_API_KEY?.trim());
  const urlhausConnected = Boolean(process.env.URLHAUS_AUTH_KEY?.trim());
  const geminiConnected = isGeminiConfigured();

  return [
    {
      id: 'gemini-search-grounding',
      name: 'Google Search Grounding (via Gemini)',
      category: 'News & Claim Verification',
      connected: geminiConnected,
      statusLabel: geminiConnected ? 'Connected' : 'API Key Required',
      description:
        'Retrieves live web references to corroborate or contradict submitted news claims without inventing URLs.',
      lastChecked: now,
      docsUrl: 'https://ai.google.dev/gemini-api/docs/grounding',
    },
    {
      id: 'google-safe-browsing',
      name: 'Google Safe Browsing API v4',
      category: 'Phishing & Malware URLs',
      connected: safeBrowsingConnected,
      statusLabel: safeBrowsingConnected ? 'Connected' : 'Not Configured',
      description:
        'Checks submitted websites against Google lists of unsafe social engineering, malware, and unwanted software URLs.',
      lastChecked: now,
      docsUrl: 'https://developers.google.com/safe-browsing/v4',
    },
    {
      id: 'abuse-ch-urlhaus',
      name: 'Abuse.ch URLhaus Feed',
      category: 'Malware Distribution Intelligence',
      connected: urlhausConnected,
      statusLabel: urlhausConnected ? 'Connected' : 'Not Configured',
      description:
        'Queries Abuse.ch URLhaus intelligence to identify active malware distribution domains and payloads.',
      lastChecked: now,
      docsUrl: 'https://urlhaus-api.abuse.ch/',
    },
  ];
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.set('trust proxy', 1);
  app.use(cors());
  app.use(express.json({ limit: '16mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Minimal request logger without leaking secrets or media payloads
  app.use((req, _res, next) => {
    if (req.path.startsWith('/api/')) {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    }
    next();
  });

  // GET /api/health
  app.get('/api/health', (_req: Request, res: Response) => {
    const health: HealthStatus = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        geminiApi: {
          configured: isGeminiConfigured(),
          model: GEMINI_MODEL,
          groundingEnabled: true,
        },
        googleSafeBrowsing: {
          configured: Boolean(process.env.GOOGLE_SAFE_BROWSING_API_KEY?.trim()),
        },
        urlhaus: {
          configured: Boolean(process.env.URLHAUS_AUTH_KEY?.trim()),
        },
        firebase: {
          configured: Boolean(process.env.VITE_FIREBASE_PROJECT_ID?.trim()),
          storageMode: 'browser_local_and_session',
        },
      },
      threatFeeds: buildThreatFeeds(),
    };
    res.json(health);
  });

  // POST /api/analyze/news
  app.post('/api/analyze/news', analysisLimiter, async (req: Request, res: Response) => {
    try {
      const parsed = NewsInputSchema.parse(req.body);
      const report = await analyzeNewsClaim(parsed);
      res.status(200).json(report);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          error: error.issues[0]?.message || 'Invalid news verification input.',
        });
        return;
      }
      const formatted = formatGeminiError(error);
      res.status(formatted.statusCode).json({ error: formatted.message });
    }
  });

  // POST /api/analyze/image
  app.post('/api/analyze/image', analysisLimiter, (req: Request, res: Response) => {
    uploadImage.single('image')(req, res, async (uploadErr) => {
      if (uploadErr) {
        const message =
          uploadErr instanceof multer.MulterError && uploadErr.code === 'LIMIT_FILE_SIZE'
            ? 'Image file exceeds the 10 MB upload limit.'
            : uploadErr.message || 'Invalid image upload.';
        res.status(400).json({ error: message });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: 'Please upload a JPG, PNG, or WEBP image file.' });
        return;
      }

      try {
        const report = await analyzeUploadedImage({
          buffer: req.file.buffer,
          fileName: req.file.originalname,
          mimeType: req.file.mimetype === 'image/jpg' ? 'image/jpeg' : req.file.mimetype,
          fileSizeBytes: req.file.size,
        });
        res.status(200).json(report);
      } catch (error) {
        const formatted = formatGeminiError(error);
        res.status(formatted.statusCode).json({ error: formatted.message });
      }
    });
  });

  // POST /api/analyze/video
  app.post('/api/analyze/video', analysisLimiter, async (req: Request, res: Response) => {
    try {
      const parsed = VideoFramesInputSchema.parse(req.body);
      const report = await analyzeVideoFrames(parsed);
      res.status(200).json(report);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          error: error.issues[0]?.message || 'Invalid video screening payload.',
        });
        return;
      }
      const formatted = formatGeminiError(error);
      res.status(formatted.statusCode).json({ error: formatted.message });
    }
  });

  // POST /api/analyze/website
  app.post('/api/analyze/website', analysisLimiter, async (req: Request, res: Response) => {
    try {
      const parsed = WebsiteInputSchema.parse(req.body);
      const report = await analyzeWebsiteSafety(parsed.url);
      res.status(200).json(report);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          error: error.issues[0]?.message || 'Please enter a valid website URL.',
        });
        return;
      }
      const maybeStatus = (error as Error & { statusCode?: number }).statusCode;
      if (maybeStatus === 400 && error instanceof Error) {
        res.status(400).json({ error: error.message });
        return;
      }
      const formatted = formatGeminiError(error);
      res.status(formatted.statusCode).json({ error: formatted.message });
    }
  });

  // GET /api/reports
  app.get('/api/reports', (_req: Request, res: Response) => {
    res.json({ reports: reportStore.list() });
  });

  // GET /api/reports/:id
  app.get('/api/reports/:id', (req: Request, res: Response) => {
    const id = String(req.params.id);
    const found = reportStore.getById(id);
    if (!found) {
      res.status(404).json({ error: 'Trust report not found in the active server session.' });
      return;
    }
    res.json(found);
  });

  // DELETE /api/reports/:id
  app.delete('/api/reports/:id', (req: Request, res: Response) => {
    const id = String(req.params.id);
    const deleted = reportStore.deleteById(id);
    res.json({ deleted });
  });

  // POST /api/reports/:id/export
  app.post('/api/reports/:id/export', (req: Request, res: Response) => {
    const id = String(req.params.id);
    const report = reportStore.getById(id) || req.body?.report;
    if (!report) {
      res.status(404).json({ error: 'Report not available for export.' });
      return;
    }
    const lines = [
      'CYBERNEWS AI — EXPLAINABLE TRUST REPORT',
      'Tagline: Verify Before You Trust.',
      '============================================================',
      `Report ID:          ${report.id}`,
      `Timestamp (UTC):    ${report.createdAt}`,
      `Content Type:       ${String(report.contentType).toUpperCase()}`,
      `Submitted Target:   ${report.submittedLabel}`,
      `Overall Risk:       ${String(report.riskLevel).toUpperCase()}`,
      `Classification:     ${report.classification}`,
      `Evidence Strength:  ${String(report.evidenceStrength).toUpperCase()}`,
      '',
      'EXECUTIVE SUMMARY',
      report.summary,
      '',
      'KEY FINDINGS',
      ...(report.findings?.length ? report.findings.map((f: string) => `- ${f}`) : ['- None recorded']),
      '',
      'SUPPORTING EVIDENCE',
      ...(report.supportingEvidence?.length
        ? report.supportingEvidence.map((e: string) => `- ${e}`)
        : ['- None recorded']),
      '',
      'CONTRADICTORY EVIDENCE',
      ...(report.contradictoryEvidence?.length
        ? report.contradictoryEvidence.map((e: string) => `- ${e}`)
        : ['- None recorded']),
      '',
      'SOURCES',
      ...(report.sources?.length
        ? report.sources.map((s: { title: string; url: string }) => `- ${s.title}: ${s.url}`)
        : ['- No external sources linked']),
      '',
      'LIMITATIONS',
      ...(report.limitations?.length
        ? report.limitations.map((l: string) => `- ${l}`)
        : ['- Standard preliminary AI limitations apply.']),
      '',
      'RECOMMENDED ACTIONS',
      ...(report.recommendations?.length
        ? report.recommendations.map((r: string) => `- ${r}`)
        : ['- Verify independently with authoritative sources.']),
      '',
      'DISCLAIMER',
      'CyberNews AI provides AI-assisted preliminary analysis, not absolute proof of authenticity or falsity. Results should be independently verified using credible sources.',
    ];

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${report.id}.txt"`);
    res.send(lines.join('\n'));
  });

  // GET /api/dashboard/stats
  app.get('/api/dashboard/stats', (_req: Request, res: Response) => {
    res.json(reportStore.getStats());
  });

  // Catch-all for unknown /api routes
  app.use('/api', (_req: Request, res: Response) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  // Global Express error handler (never leaks stack traces)
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[Server Error]', err.message);
    res.status(500).json({ error: 'An unexpected server error occurred. Please try again.' });
  });

  // Vite dev middleware or static production build
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CyberNews AI server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start CyberNews AI server:', err);
  process.exit(1);
});
