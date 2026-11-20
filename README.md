# CYBERNEWS AI

**Tagline:** *Verify Before You Trust.*

AI-Powered Fake News, Deepfake & Digital Trust Verification Platform built with React, TypeScript, Tailwind CSS, Express, Recharts, and the Google Gemini API (`@google/genai`).

---

## Core Capabilities

1. **Fake News Detector (`/api/analyze/news`)**
   - Evaluates headlines, factual claims, article excerpts, and optional source URLs.
   - Separates factual statements from opinions and flags manipulative or sensationalist phrasing.
   - Uses Google Search Grounding via Gemini to retrieve verifiable source links without inventing citations or URLs.
   - Classifies submissions as `LIKELY RELIABLE`, `SUSPICIOUS`, `UNVERIFIED`, or `INSUFFICIENT EVIDENCE`.

2. **Image Authenticity Checker (`/api/analyze/image`)**
   - Supports drag-and-drop and browse uploads for `JPG`, `JPEG`, `PNG`, and `WEBP` (max 10 MB).
   - Parses real EXIF metadata (`exifr`) on the backend and automatically redacts raw GPS coordinates for user privacy.
   - Screens visual consistency (lighting, shadows, anatomy, reflections, structural artifacts) via Gemini vision.
   - Transparently notes that missing EXIF metadata does not prove manipulation and visual inspection alone does not prove AI generation.

3. **Deepfake Video Investigation (`/api/analyze/video`)**
   - Extracts evenly spaced representative keyframes directly in the browser (`<video>` + `<canvas>`) with progress feedback.
   - Submits sampled keyframes for multi-frame visual consistency screening.
   - Explicitly labeled as **Preliminary Visual Screening** — does not claim audio-lip synchronization or dedicated forensic deepfake neural detection.

4. **Website Safety Checker (`/api/analyze/website`)**
   - SSRF-hardened backend inspection blocking `localhost`, RFC 1918 private IPs, link-local / cloud metadata ranges (`169.254.0.0/16`), and internal hostnames on both initial DNS resolution and every redirect hop.
   - Checks HTTPS transport, redirect chains (max 5 hops), HTTP security headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options), and suspicious URL patterns.
   - Optional live integrations for **Google Safe Browsing API v4** and **Abuse.ch URLhaus**, honestly reporting `"External reputation check unavailable"` when keys are not configured.

5. **Explainable Trust Reports**
   - Assigns unique report IDs (`CN-NEWS-...`, `CN-IMG-...`, `CN-VID-...`, `CN-WEB-...`), risk indicators (`Low`, `Medium`, `High`, `Unknown`), and qualitative evidence strength meters (no fabricated accuracy percentages).
   - Supports **Download as PDF**, **Copy Summary**, and **Print Report**.

6. **Threat Intelligence Dashboard & Local History**
   - Interactive Recharts visualizations for categories, risk distribution, and activity trends (clearly labeled `DEMO DATA` until user analyses exist).
   - Displays real server-side connectivity status for configured threat feeds.
   - Searchable, filterable browser-local Analysis History with delete confirmations (usable without mandatory login when Firebase is not configured).

---

## System Architecture

```text
cybernews-ai/
├── server.ts                       # Express API server + Vite dev middleware / static prod server
├── backend/
│   ├── services/
│   │   ├── geminiService.ts        # Shared server-side @google/genai client (gemini-4-hydrogen)
│   │   ├── newsAnalyzer.ts         # Grounded news claim verification & Zod validation
│   │   ├── imageAnalyzer.ts        # EXIF parsing + Gemini vision authenticity screening
│   │   ├── videoAnalyzer.ts        # Multi-frame preliminary visual screening
│   │   ├── websiteAnalyzer.ts      # SSRF-safe HTTP inspector + Safe Browsing / URLhaus + Gemini
│   │   └── reportStore.ts          # Session report storage & stats aggregation
│   └── utils/
│       └── ssrfGuard.ts            # DNS & CIDR private/internal IP blocking
├── src/
│   ├── components/                 # BrandMark, RiskIndicator, EvidenceMeter, DisclaimerBanner
│   ├── hooks/                      # useReports (browser-local history)
│   ├── pages/                      # Landing, Overview, News, Image, Video, Website, Reports, Intel, History, Settings
│   ├── services/                   # Typed frontend fetch client (never imports @google/genai)
│   ├── types/                      # Shared TypeScript interfaces
│   └── utils/                      # PDF export (jsPDF), browser video frame sampler
├── .env.example
├── LICENSE
└── package.json
```

---

## Installation & Setup

### Prerequisites
- Node.js 20+ and npm

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and add your server-side keys:

```bash
cp .env.example .env
```

Required variable:
- `GEMINI_API_KEY`: Google Gemini API key (server-side only; never exposed to browser code).

Optional threat intelligence variables:
- `GOOGLE_SAFE_BROWSING_API_KEY`: Enables live Google Safe Browsing v4 lookups in Website Safety Checker.
- `URLHAUS_AUTH_KEY`: Enables live Abuse.ch URLhaus malware URL lookups.

### 3. Run in Development
```bash
npm run dev
```
The full-stack Express + Vite application runs on `http://localhost:3000`.

### 4. Production Build & Start
```bash
npm run build
NODE_ENV=production npm start
```

---

## API Documentation

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Returns backend integration readiness and threat feed connectivity status. |
| `POST` | `/api/analyze/news` | Analyzes `{ headline, claim, articleText, sourceUrl }` using Gemini + Google Search grounding. |
| `POST` | `/api/analyze/image` | Multipart (`image`) EXIF extraction + Gemini vision screening (JPG, PNG, WEBP, max 10 MB). |
| `POST` | `/api/analyze/video` | Analyzes up to 6 extracted keyframes (`{ fileName, durationSec, fileSizeBytes, frames }`). |
| `POST` | `/api/analyze/website` | SSRF-protected inspection of `{ url }` (HTTPS, redirects, headers, patterns, threat feeds). |
| `GET` | `/api/reports` | Lists reports recorded in the active server session. |
| `GET` | `/api/reports/:id` | Retrieves a single session report by ID. |
| `DELETE` | `/api/reports/:id` | Deletes a single report from the active server session. |
| `POST` | `/api/reports/:id/export` | Exports a plain-text summary of a Trust Report. |
| `GET` | `/api/dashboard/stats` | Returns aggregated category and risk metrics for the active session. |

---

## Screenshots

- **Landing Page:** Obsidian cybersecurity hero, live/demo activity snapshot, asymmetric bento feature launcher, and four-stage verification workflow.
- **Fake News Detector:** Structured statement breakdown (factual vs. opinion), grounded clickable source links, and risk/evidence meters.
- **Image & Video Checkers:** Drag-and-drop previews, sanitized EXIF inspection table, and keyframe timeline strip.
- **Explainable Trust Report:** Print-ready and PDF-exportable audit sheet with explicit limitations and Responsible AI disclosure.

---

## Known Limitations

- **Preliminary AI Analysis:** CyberNews AI is an investigative aid, not absolute proof of truth, authenticity, or manipulation.
- **Video Screening Scope:** Without a dedicated forensic neural deepfake detector connected, video analysis performs preliminary visual screening on sampled keyframes only (no audio-lip sync or voice cloning forensics).
- **Optional External Threat Feeds:** Google Safe Browsing and URLhaus require their respective API keys to run live reputation queries.
- **Local History Mode:** Without Firebase credentials configured, analysis history persists in the user's current browser (`localStorage`) rather than syncing across devices.

---

## Future Improvements

- Optional Firebase Authentication & Firestore cloud sync for multi-device investigation workspaces.
- Integration with dedicated forensic deepfake detection models (temporal facial dynamics & audio-lip sync) and C2PA Content Credentials verification.
- Reverse image search API integration and WHOIS/TLS certificate age lookups for newly registered phishing domains.

---

## Hackathon Presentation Guide

### Problem Statement
Viral misinformation, synthetic media, and lookalike phishing domains spread far faster than manual fact-checking. Existing tools are fragmented across separate sites and often present opaque percentage scores without explaining *why* content looks suspicious or what evidence is missing.

### Proposed Solution
**CyberNews AI** unifies four critical digital trust checks — news claims, images, video keyframes, and websites — into one explainable verification console that separates observable evidence from conclusions and exports auditable PDF Trust Reports.

### Innovation
- **Epistemic Honesty by Design:** Refuses to invent citations, never presents arbitrary AI accuracy percentages, and discloses unconfigured external feeds transparently.
- **Defense-in-Depth URL Inspection:** Implements DNS-verified SSRF protection across every redirect hop without executing remote JavaScript.
- **Zero-Friction Client Keyframe Sampling:** Samples representative video frames locally in-browser for fast multimodal visual screening without heavy media storage.

### Live Demo Workflow (3–5 Minutes)
1. Open the **CYBERNEWS AI** landing page and click **Start Verification**.
2. In **Fake News Detector**, click **Load Sample** (viral banking cash-ban rumor) and click **Analyze News** to show grounded evidence, fact-vs-opinion breakdown, and suspicious-language findings.
3. Navigate to **Image Checker**, click **Load Sample Image**, and run **Analyze Image** to demonstrate EXIF extraction, privacy-safe GPS redaction, and visual consistency notes.
4. Open **Website Safety**, test both `https://www.wikipedia.org` and a lookalike URL pattern to demonstrate HTTPS, redirect, security header, and SSRF protections.
5. Open the generated **Explainable Trust Report** and click **Download PDF** to showcase the auditable takeaway artifact.
6. Visit **Threat Intelligence** to show live updated charts switching automatically from `DEMO DATA` to real session metrics.

### Real-World Use Cases
- Newsrooms and student journalists triaging breaking social media tips.
- Educators and digital literacy programs teaching source verification.
- Everyday consumers checking suspicious links or viral forwards before clicking or sharing.

---

## Responsible AI Disclaimer

> CyberNews AI provides AI-assisted preliminary analysis, not absolute proof of authenticity or falsity. Results should be independently verified using credible sources.

## License

Released under the [MIT License](./LICENSE).
