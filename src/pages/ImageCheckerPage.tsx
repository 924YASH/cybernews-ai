import {
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { DisclaimerBanner, EvidenceMeter, RiskIndicator } from '../components/RiskIndicator';
import { analyzeImage } from '../services/api';
import type { TrustReport } from '../types/analysis';

const SAMPLE_IMAGE_URL = '/src/assets/images/sample_verify_photo_1795069242390.jpg';
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

interface ImageCheckerPageProps {
  onReportCreated: (report: TrustReport) => void;
  onOpenFullReport: (reportId: string) => void;
}

export function ImageCheckerPage({ onReportCreated, onOpenFullReport }: ImageCheckerPageProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TrustReport | null>(null);

  const validateAndSelectFile = (file: File) => {
    setError(null);
    if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
      setError('Unsupported format. Please upload a JPG, JPEG, PNG, or WEBP image.');
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError('File is too large. Maximum supported image size is 10 MB.');
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResult(null);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSelectFile(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndSelectFile(file);
  };

  const handleRemove = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleLoadSampleImage = async () => {
    setError(null);
    try {
      const res = await fetch(SAMPLE_IMAGE_URL);
      if (!res.ok) throw new Error('Could not load sample image.');
      const blob = await res.blob();
      const file = new File([blob], 'sample_transit_station_dusk.jpg', {
        type: blob.type || 'image/jpeg',
      });
      validateAndSelectFile(file);
    } catch {
      setError('Sample image could not be loaded. Please upload a local JPG, PNG, or WEBP image.');
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError('Select or drop an image first.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const report = await analyzeImage(selectedFile);
      setResult(report);
      onReportCreated(report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image authenticity check failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Image Authenticity Checker
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Inspect EXIF metadata alongside visual cues — lighting, shadows, anatomy, and texture
            consistency — for potential manipulation or synthetic indicators.
          </p>
        </div>
        <button
          type="button"
          onClick={handleLoadSampleImage}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-cyan-300 bg-slate-900 border border-slate-700 hover:border-cyan-500/50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Load Sample Image</span>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Upload & Preview Panel */}
        <div className="xl:col-span-5 p-6 rounded-xl bg-[#0B1120] border border-slate-800 space-y-5">
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />

          {!previewUrl ? (
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
                Drop an image here, or click to browse
              </p>
              <p className="mt-1.5 text-xs text-slate-400">
                Supports JPG, JPEG, PNG, WEBP · Max 10 MB
              </p>
              <p className="mt-3 text-xs text-slate-500">
                Uploaded images are processed in memory and not permanently stored on the server.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg overflow-hidden border border-slate-800 bg-[#060913]">
                <img
                  src={previewUrl}
                  alt={selectedFile?.name || 'Uploaded preview'}
                  referrerPolicy="no-referrer"
                  className="w-full max-h-80 object-contain mx-auto"
                />
              </div>

              {selectedFile && (
                <div className="flex items-center justify-between gap-4 text-xs text-slate-400 font-mono">
                  <span className="truncate">{selectedFile.name}</span>
                  <span className="shrink-0 tabular-nums">
                    {(selectedFile.size / 1024).toFixed(1)} KB
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
                      <span>Analyzing Image...</span>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-4 h-4" />
                      <span>Analyze Image</span>
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

        {/* Results Panel */}
        <div className="xl:col-span-7 space-y-5">
          {loading && (
            <div className="p-8 rounded-xl bg-[#0B1120] border border-slate-800 space-y-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                <h2 className="text-base font-semibold text-white">
                  Extracting Metadata &amp; Screening Visual Signals
                </h2>
              </div>
              <p className="text-sm text-slate-400">
                Parsing EXIF tags, stripping private GPS data, and running Gemini multimodal visual
                inspection...
              </p>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full w-3/4 bg-gradient-to-r from-cyan-400 to-indigo-400 rounded-full animate-pulse" />
              </div>
            </div>
          )}

          {!loading && !result && (
            <div className="p-10 rounded-xl bg-[#0B1120] border border-slate-800 text-center">
              <div className="w-12 h-12 mx-auto rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400">
                <ImageIcon className="w-6 h-6" />
              </div>
              <h2 className="mt-4 text-base font-semibold text-white">No Image Screened Yet</h2>
              <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                Upload a photograph or click <span className="text-slate-200 font-medium">Load Sample Image</span>{' '}
                to inspect metadata headers and AI-assisted visual authenticity indicators.
              </p>
            </div>
          )}

          {!loading && result && (
            <div className="p-6 rounded-xl bg-[#0B1120] border border-slate-800 space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                    <span>{result.id}</span>
                    <span aria-hidden="true">·</span>
                    <span>{new Date(result.createdAt).toLocaleString()}</span>
                  </div>
                  <h2 className="mt-2 text-xl font-bold text-white">{result.classification}</h2>
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

              <div>
                <h3 className="text-xs font-semibold text-slate-400 mb-1.5">Assessment Summary</h3>
                <p className="text-sm text-slate-300 leading-relaxed">{result.summary}</p>
              </div>

              {/* Metadata Findings Table */}
              {result.imageMetadata && (
                <div>
                  <h3 className="text-xs font-semibold text-slate-400 mb-2">
                    Extracted File &amp; EXIF Metadata
                  </h3>
                  <div className="rounded-lg border border-slate-800 bg-[#060913] divide-y divide-slate-800/80 text-xs">
                    <div className="grid grid-cols-2 px-4 py-2.5">
                      <span className="text-slate-400">EXIF Metadata Block</span>
                      <span className="font-mono text-slate-200 text-right">
                        {result.imageMetadata.exifPresent ? 'Present' : 'Not Present (Neutral)'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 px-4 py-2.5">
                      <span className="text-slate-400">Camera Make / Model</span>
                      <span className="font-mono text-slate-200 text-right">
                        {[result.imageMetadata.cameraMake, result.imageMetadata.cameraModel]
                          .filter(Boolean)
                          .join(' ') || 'Not recorded'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 px-4 py-2.5">
                      <span className="text-slate-400">Editing Software Tag</span>
                      <span className="font-mono text-slate-200 text-right">
                        {result.imageMetadata.software || 'None declared'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 px-4 py-2.5">
                      <span className="text-slate-400">Original Capture Date</span>
                      <span className="font-mono text-slate-200 text-right">
                        {result.imageMetadata.dateTimeOriginal || 'Not recorded'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 px-4 py-2.5">
                      <span className="text-slate-400">Privacy Protection</span>
                      <span className="text-slate-300 text-right">
                        {result.imageMetadata.privacyNote}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Observed Visual Clues */}
              <div>
                <h3 className="text-xs font-semibold text-slate-400 mb-2">
                  Observed Visual Clues &amp; Signals
                </h3>
                <ul className="space-y-2 text-sm text-slate-300 leading-relaxed">
                  {result.findings.map((finding, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="text-cyan-400 mt-1">•</span>
                      <span>{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Limitations & Recommendations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-800/80">
                <div>
                  <h3 className="text-xs font-semibold text-amber-400 mb-2">
                    Important Limitations
                  </h3>
                  <ul className="space-y-1.5 text-xs text-slate-400 leading-relaxed">
                    {result.limitations.map((lim, idx) => (
                      <li key={idx}>• {lim}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-slate-300 mb-2">
                    Recommended Next Steps
                  </h3>
                  <ul className="space-y-1.5 text-xs text-slate-400 leading-relaxed">
                    {result.recommendations.map((rec, idx) => (
                      <li key={idx}>• {rec}</li>
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
