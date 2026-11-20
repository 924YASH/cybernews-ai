import {
  AlertCircle,
  AlertTriangle,
  FileText,
  Film,
  Loader2,
  Trash2,
  Upload,
} from 'lucide-react';
import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { DisclaimerBanner, EvidenceMeter, RiskIndicator } from '../components/RiskIndicator';
import { analyzeVideo } from '../services/api';
import type { TrustReport } from '../types/analysis';
import {
  extractRepresentativeVideoFrames,
  type ExtractedVideoFrame,
} from '../utils/videoFrameExtractor';

const MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB client-side cap

interface VideoCheckerPageProps {
  onReportCreated: (report: TrustReport) => void;
  onOpenFullReport: (reportId: string) => void;
}

export function VideoCheckerPage({ onReportCreated, onOpenFullReport }: VideoCheckerPageProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [sampledFrames, setSampledFrames] = useState<ExtractedVideoFrame[]>([]);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TrustReport | null>(null);

  const handleSelectVideo = (file: File) => {
    setError(null);
    if (!file.type.startsWith('video/')) {
      setError('Unsupported file type. Please upload an MP4, WebM, or MOV video file.');
      return;
    }
    if (file.size > MAX_VIDEO_SIZE_BYTES) {
      setError('Video exceeds the 100 MB browser screening limit. Please upload a shorter clip.');
      return;
    }
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setVideoFile(file);
    setVideoPreviewUrl(URL.createObjectURL(file));
    setSampledFrames([]);
    setResult(null);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleSelectVideo(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleSelectVideo(file);
  };

  const handleRemove = () => {
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setVideoFile(null);
    setVideoPreviewUrl(null);
    setSampledFrames([]);
    setResult(null);
    setError(null);
    setProgress(0);
    setStage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAnalyze = async () => {
    if (!videoFile) {
      setError('Upload a video file first.');
      return;
    }
    setError(null);
    setLoading(true);
    setProgress(10);
    setStage('Extracting representative keyframes from video...');

    try {
      const extracted = await extractRepresentativeVideoFrames(videoFile, 5, (pct) => {
        setProgress(10 + Math.round(pct * 0.45));
      });
      setSampledFrames(extracted.frames);

      setStage(`Screening ${extracted.frames.length} sampled keyframes with Gemini vision...`);
      setProgress(68);

      const report = await analyzeVideo({
        fileName: videoFile.name,
        durationSec: extracted.durationSec,
        fileSizeBytes: videoFile.size,
        frames: extracted.frames.map((f) => ({
          timestampSec: f.timestampSec,
          mimeType: f.mimeType,
          base64Data: f.base64Data,
        })),
      });

      setProgress(100);
      setResult(report);
      onReportCreated(report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Video screening failed.');
    } finally {
      setLoading(false);
      setStage('');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Deepfake Video Investigation
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Extract evenly spaced keyframes from a video clip and screen them for visual artifacts,
          facial boundary irregularities, and lighting inconsistencies.
        </p>
      </div>

      {/* Explicit Transparency Notice */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/8 border border-amber-500/25 text-xs text-amber-200/90 leading-relaxed">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-amber-300">Preliminary Visual Screening Mode: </span>
          No specialized forensic deepfake classifier or audio-lip synchronization model is
          connected. CyberNews AI inspects sampled still frames for observable visual cues and
          should not be treated as definitive deepfake verification.
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Upload & Player Column */}
        <div className="xl:col-span-5 p-6 rounded-xl bg-[#0B1120] border border-slate-800 space-y-5">
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime,video/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {!videoPreviewUrl ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
              }}
              className={`p-10 rounded-xl border-2 border-dashed text-center transition-colors cursor-pointer ${
                isDragging
                  ? 'border-cyan-400 bg-cyan-500/5'
                  : 'border-slate-700 hover:border-slate-500 bg-[#060913]'
              }`}
            >
              <Upload className="w-8 h-8 mx-auto text-cyan-400" />
              <p className="mt-4 text-sm font-semibold text-white">
                Drop a video clip here, or click to browse
              </p>
              <p className="mt-1.5 text-xs text-slate-400">
                Browser-supported MP4, WebM, MOV · Max 100 MB
              </p>
              <p className="mt-3 text-xs text-slate-500">
                Keyframes are sampled locally in your browser; raw video files are never permanently
                stored.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg overflow-hidden border border-slate-800 bg-black">
                <video
                  src={videoPreviewUrl}
                  controls
                  className="w-full max-h-72 mx-auto"
                />
              </div>

              {videoFile && (
                <div className="flex items-center justify-between gap-4 text-xs text-slate-400 font-mono">
                  <span className="truncate">{videoFile.name}</span>
                  <span className="shrink-0 tabular-nums">
                    {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors cursor-pointer disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Screening Frames...</span>
                    </>
                  ) : (
                    <>
                      <Film className="w-4 h-4" />
                      <span>Analyze Video</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-700 hover:border-rose-500/50 hover:text-rose-300 rounded-lg transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Results Dashboard Column */}
        <div className="xl:col-span-7 space-y-5">
          {loading && (
            <div className="p-8 rounded-xl bg-[#0B1120] border border-slate-800 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                  <h2 className="text-base font-semibold text-white">Running Visual Screening</h2>
                </div>
                <span className="text-xs font-mono text-cyan-400 tabular-nums">{progress}%</span>
              </div>
              <p className="text-sm text-slate-300">{stage}</p>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-indigo-400 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {!loading && !result && (
            <div className="p-10 rounded-xl bg-[#0B1120] border border-slate-800 text-center">
              <div className="w-12 h-12 mx-auto rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400">
                <Film className="w-6 h-6" />
              </div>
              <h2 className="mt-4 text-base font-semibold text-white">
                Upload a Video for Preliminary Visual Screening
              </h2>
              <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                CyberNews AI automatically samples representative keyframes across the clip and
                inspects frame-to-frame visual consistency, lighting, and facial boundaries.
              </p>
            </div>
          )}

          {!loading && result && (
            <div className="p-6 rounded-xl bg-[#0B1120] border border-slate-800 space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-slate-800">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono">
                    <span>{result.id}</span>
                    <span aria-hidden="true">·</span>
                    <span>{result.videoDetails?.framesSampled ?? sampledFrames.length} frames sampled</span>
                    <span aria-hidden="true">·</span>
                    <span>{result.videoDetails?.durationSec.toFixed(1)}s duration</span>
                  </div>
                  <h2 className="mt-2 text-lg font-bold text-white">{result.classification}</h2>
                  <div className="mt-2">
                    <EvidenceMeter strength={result.evidenceStrength} />
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <RiskIndicator level={result.riskLevel} />
                  <button
                    type="button"
                    onClick={() => onOpenFullReport(result.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Open Full Trust Report</span>
                  </button>
                </div>
              </div>

              {/* Sampled Keyframe Strip */}
              {sampledFrames.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-slate-400 mb-2.5">
                    Sampled Keyframes ({sampledFrames.length})
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    {sampledFrames.map((frame, i) => (
                      <div
                        key={i}
                        className="rounded-lg overflow-hidden border border-slate-800 bg-[#060913]"
                      >
                        <img
                          src={frame.previewDataUrl}
                          alt={`Sampled frame ${i + 1} at ${frame.timestampSec}s`}
                          referrerPolicy="no-referrer"
                          className="w-full h-20 object-cover"
                        />
                        <div className="px-2 py-1 text-[11px] font-mono text-slate-400 tabular-nums text-center">
                          #{i + 1} · {frame.timestampSec.toFixed(1)}s
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-xs font-semibold text-slate-400 mb-1.5">Screening Summary</h3>
                <p className="text-sm text-slate-300 leading-relaxed">{result.summary}</p>
              </div>

              {/* Frame-by-Frame Observations */}
              {result.videoDetails && result.videoDetails.frameObservations.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-slate-400 mb-2.5">
                    Frame-by-Frame Observations
                  </h3>
                  <div className="divide-y divide-slate-800/80 border border-slate-800/80 rounded-lg bg-[#060913]">
                    {result.videoDetails.frameObservations.map((obs, idx) => (
                      <div key={idx} className="p-3.5 space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-mono text-cyan-400 tabular-nums">
                          <span>Frame {obs.frameIndex}</span>
                          <span>{obs.timestampSec.toFixed(2)}s</span>
                        </div>
                        <p className="text-sm text-slate-200 leading-relaxed">{obs.observation}</p>
                        {obs.notableSignals.length > 0 && (
                          <p className="text-xs text-slate-400">
                            Signals: {obs.notableSignals.join(' · ')}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Technical Limitations & Next Steps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-800/80">
                <div>
                  <h3 className="text-xs font-semibold text-amber-400 mb-2">
                    Technical Limitations
                  </h3>
                  <ul className="space-y-1.5 text-xs text-slate-400 leading-relaxed">
                    {result.limitations.map((lim, i) => (
                      <li key={i}>• {lim}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-slate-300 mb-2">
                    Recommended Verification Steps
                  </h3>
                  <ul className="space-y-1.5 text-xs text-slate-400 leading-relaxed">
                    {result.recommendations.map((rec, i) => (
                      <li key={i}>• {rec}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <DisclaimerBanner />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
