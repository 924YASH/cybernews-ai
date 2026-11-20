export interface ExtractedVideoFrame {
  timestampSec: number;
  mimeType: 'image/jpeg';
  base64Data: string;
  previewDataUrl: string;
}

export interface VideoExtractionResult {
  durationSec: number;
  width: number;
  height: number;
  frames: ExtractedVideoFrame[];
}

export async function extractRepresentativeVideoFrames(
  file: File,
  targetFrameCount = 5,
  onProgress?: (pct: number) => void
): Promise<VideoExtractionResult> {
  const objectUrl = URL.createObjectURL(file);

  try {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    video.src = objectUrl;

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timed out while loading video metadata. Try a standard MP4 or WebM file.'));
      }, 12000);

      video.onloadedmetadata = () => {
        clearTimeout(timeout);
        resolve();
      };
      video.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Browser could not decode this video format. Try MP4 (H.264) or WebM.'));
      };
    });

    const durationSec = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 1;
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 360;

    // Scale down to max 768px width to keep API payload lean and fast
    const maxDim = 768;
    const scale = Math.min(1, maxDim / Math.max(width, height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(160, Math.round(width * scale));
    canvas.height = Math.max(90, Math.round(height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not initialize canvas for video frame extraction.');
    }

    const count = durationSec < 1.5 ? 2 : Math.min(6, Math.max(3, targetFrameCount));
    const timestamps: number[] = [];
    for (let i = 0; i < count; i++) {
      // Sample evenly between 8% and 92% of duration to avoid blank fade-in/out frames
      const ratio = count === 1 ? 0.5 : 0.08 + (0.84 * i) / (count - 1);
      timestamps.push(Math.min(Math.max(0.05, durationSec * ratio), Math.max(0.05, durationSec - 0.05)));
    }

    const frames: ExtractedVideoFrame[] = [];

    for (let i = 0; i < timestamps.length; i++) {
      const ts = timestamps[i];
      await new Promise<void>((resolve, reject) => {
        const seekTimeout = setTimeout(() => reject(new Error('Video seeking timed out.')), 8000);
        const onSeeked = () => {
          clearTimeout(seekTimeout);
          video.removeEventListener('seeked', onSeeked);
          resolve();
        };
        video.addEventListener('seeked', onSeeked);
        video.currentTime = ts;
      });

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      const base64Data = dataUrl.split(',')[1] || '';

      frames.push({
        timestampSec: Number(ts.toFixed(2)),
        mimeType: 'image/jpeg',
        base64Data,
        previewDataUrl: dataUrl,
      });

      if (onProgress) {
        onProgress(Math.round(((i + 1) / timestamps.length) * 100));
      }
    }

    return {
      durationSec: Number(durationSec.toFixed(2)),
      width,
      height,
      frames,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
