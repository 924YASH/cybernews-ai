export type ContentType = 'news' | 'image' | 'video' | 'website';

export type RiskLevel = 'low' | 'medium' | 'high' | 'unknown';

export type EvidenceStrength = 'strong' | 'moderate' | 'limited' | 'insufficient';

export type NewsClassification =
  | 'LIKELY RELIABLE'
  | 'SUSPICIOUS'
  | 'UNVERIFIED'
  | 'INSUFFICIENT EVIDENCE';

export interface SourceReference {
  title: string;
  url: string;
  domain?: string;
  note?: string;
}

export interface ClaimBreakdown {
  statement: string;
  type: 'factual' | 'opinion' | 'unverified_assertion';
  assessment: string;
}

export interface ImageMetadataSummary {
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  width?: number;
  height?: number;
  exifPresent: boolean;
  cameraMake?: string;
  cameraModel?: string;
  software?: string;
  dateTimeOriginal?: string;
  colorSpace?: string;
  gpsDetected: boolean;
  privacyNote: string;
}

export interface VideoFrameObservation {
  frameIndex: number;
  timestampSec: number;
  observation: string;
  notableSignals: string[];
}

export interface RedirectHop {
  from: string;
  to: string;
  statusCode: number;
}

export interface ThreatFeedCheckResult {
  provider: string;
  status: 'clean' | 'flagged' | 'unavailable';
  details: string;
  checkedAt: string;
}

export interface WebsiteInspectionDetails {
  submittedUrl: string;
  finalUrl: string;
  hostname: string;
  protocol: string;
  usesHttps: boolean;
  httpStatus?: number;
  redirectChain: RedirectHop[];
  suspiciousPatterns: string[];
  securityHeaders: {
    strictTransportSecurity: boolean;
    contentSecurityPolicy: boolean;
    xFrameOptions: boolean;
    xContentTypeOptions: boolean;
  };
  threatFeedResults: ThreatFeedCheckResult[];
  pageTitle?: string;
}

export interface TrustReport {
  id: string;
  status: 'success';
  createdAt: string;
  contentType: ContentType;
  submittedLabel: string;
  submittedContentPreview: string;
  riskLevel: RiskLevel;
  classification: string;
  evidenceStrength: EvidenceStrength;
  mainClaim?: string;
  summary: string;
  findings: string[];
  supportingEvidence: string[];
  contradictoryEvidence: string[];
  missingInformation?: string[];
  sources: SourceReference[];
  limitations: string[];
  recommendations: string[];
  // Content-type specific optional fields
  claimBreakdown?: ClaimBreakdown[];
  imageMetadata?: ImageMetadataSummary;
  imagePreviewDataUrl?: string;
  videoDetails?: {
    fileName: string;
    durationSec: number;
    framesSampled: number;
    screeningMode: string;
    frameObservations: VideoFrameObservation[];
  };
  websiteDetails?: WebsiteInspectionDetails;
  groundingUsed?: boolean;
}

export interface ThreatFeedStatus {
  id: string;
  name: string;
  category: string;
  connected: boolean;
  statusLabel: string;
  description: string;
  lastChecked: string;
  docsUrl: string;
}

export interface HealthStatus {
  status: 'ok';
  timestamp: string;
  services: {
    geminiApi: {
      configured: boolean;
      model: string;
      groundingEnabled: boolean;
    };
    googleSafeBrowsing: {
      configured: boolean;
    };
    urlhaus: {
      configured: boolean;
    };
    firebase: {
      configured: boolean;
      storageMode: 'browser_local_and_session';
    };
  };
  threatFeeds: ThreatFeedStatus[];
}

export interface DashboardStatsResponse {
  hasRealData: boolean;
  totalAnalyses: number;
  byCategory: {
    news: number;
    image: number;
    video: number;
    website: number;
  };
  byRisk: {
    low: number;
    medium: number;
    high: number;
    unknown: number;
  };
  recentReports: TrustReport[];
}

export type AppView =
  | 'landing'
  | 'overview'
  | 'news'
  | 'image'
  | 'video'
  | 'website'
  | 'reports'
  | 'intelligence'
  | 'history'
  | 'settings';
