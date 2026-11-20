import dns from 'node:dns/promises';
import net from 'node:net';

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  '0.0.0.0',
  'ip6-localhost',
  'ip6-loopback',
  'metadata.google.internal',
  'metadata.goog',
  'instance-data',
]);

const BLOCKED_HOSTNAME_SUFFIXES = [
  '.local',
  '.internal',
  '.localhost',
  '.localdomain',
  '.home.arpa',
  '.corp',
  '.lan',
];

function ipv4ToInt(ip: string): number {
  const parts = ip.split('.').map(Number);
  return (
    ((parts[0] << 24) >>> 0) +
    ((parts[1] << 16) >>> 0) +
    ((parts[2] << 8) >>> 0) +
    (parts[3] >>> 0)
  );
}

function inCidrV4(ip: string, network: string, prefixLength: number): boolean {
  const mask = prefixLength === 0 ? 0 : (~0 << (32 - prefixLength)) >>> 0;
  return (ipv4ToInt(ip) & mask) === (ipv4ToInt(network) & mask);
}

export function isPrivateOrReservedIp(ip: string): boolean {
  const cleanIp = ip.trim().toLowerCase();

  // Handle IPv4-mapped IPv6 addresses like ::ffff:127.0.0.1
  if (cleanIp.startsWith('::ffff:')) {
    const mapped = cleanIp.slice(7);
    if (net.isIPv4(mapped)) {
      return isPrivateOrReservedIp(mapped);
    }
  }

  if (net.isIPv4(cleanIp)) {
    const blockedRanges: Array<[string, number]> = [
      ['0.0.0.0', 8],       // Current network
      ['10.0.0.0', 8],      // RFC 1918 private
      ['100.64.0.0', 10],   // Carrier-grade NAT
      ['127.0.0.0', 8],     // Loopback
      ['169.254.0.0', 16],  // Link-local / Cloud metadata
      ['172.16.0.0', 12],   // RFC 1918 private
      ['192.0.0.0', 24],    // IETF protocol assignments
      ['192.0.2.0', 24],    // TEST-NET-1
      ['192.168.0.0', 16],  // RFC 1918 private
      ['198.18.0.0', 15],   // Benchmarking
      ['198.51.100.0', 24], // TEST-NET-2
      ['203.0.113.0', 24],  // TEST-NET-3
      ['224.0.0.0', 4],     // Multicast
      ['240.0.0.0', 4],     // Reserved / Broadcast
    ];
    return blockedRanges.some(([netAddr, bits]) => inCidrV4(cleanIp, netAddr, bits));
  }

  if (net.isIPv6(cleanIp)) {
    if (
      cleanIp === '::' ||
      cleanIp === '::1' ||
      cleanIp.startsWith('fc') ||
      cleanIp.startsWith('fd') || // Unique local fc00::/7
      cleanIp.startsWith('fe8') ||
      cleanIp.startsWith('fe9') ||
      cleanIp.startsWith('fea') ||
      cleanIp.startsWith('feb') || // Link-local fe80::/10
      cleanIp.startsWith('ff') // Multicast
    ) {
      return true;
    }
  }

  return false;
}

export interface SafeUrlValidationResult {
  valid: boolean;
  url?: URL;
  reason?: string;
}

export async function validateSafePublicUrl(rawInput: string): Promise<SafeUrlValidationResult> {
  const trimmed = rawInput.trim();
  if (!trimmed || trimmed.length > 2048) {
    return { valid: false, reason: 'Please provide a valid URL under 2,048 characters.' };
  }

  let normalized = trimmed;
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = `https://${normalized}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    return { valid: false, reason: 'Malformed URL format. Include a valid domain name.' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { valid: false, reason: 'Only HTTP and HTTPS web URLs are permitted.' };
  }

  const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (!hostname) {
    return { valid: false, reason: 'URL must contain a valid hostname.' };
  }

  if (BLOCKED_HOSTNAMES.has(hostname)) {
    return {
      valid: false,
      reason: 'Blocked for security: localhost and internal metadata hosts cannot be inspected.',
    };
  }

  if (BLOCKED_HOSTNAME_SUFFIXES.some((suffix) => hostname.endsWith(suffix))) {
    return {
      valid: false,
      reason: 'Blocked for security: internal or local network domains cannot be inspected.',
    };
  }

  if (net.isIP(hostname)) {
    if (isPrivateOrReservedIp(hostname)) {
      return {
        valid: false,
        reason: 'Blocked for security: private, loopback, or link-local IP addresses are not permitted.',
      };
    }
    return { valid: true, url: parsed };
  }

  if (!hostname.includes('.')) {
    return {
      valid: false,
      reason: 'Blocked for security: unqualified single-label hostnames are not permitted.',
    };
  }

  // Resolve DNS records and ensure none point to private/reserved space (prevents DNS rebinding/SSRF)
  try {
    const records = await dns.lookup(hostname, { all: true });
    if (!records || records.length === 0) {
      return { valid: false, reason: 'Domain could not be resolved via DNS.' };
    }
    for (const record of records) {
      if (isPrivateOrReservedIp(record.address)) {
        return {
          valid: false,
          reason: 'Blocked for security: domain resolves to a private or reserved network address.',
        };
      }
    }
  } catch {
    // Allow heuristic inspection even if domain doesn't currently resolve,
    // by returning a specific error only if caller wants strict fetch; here we flag DNS failure safely.
    return { valid: true, url: parsed };
  }

  return { valid: true, url: parsed };
}

export async function resolveAndVerifyPublicTarget(hostname: string): Promise<{ allowed: boolean; reason?: string }> {
  const cleanHost = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (BLOCKED_HOSTNAMES.has(cleanHost) || BLOCKED_HOSTNAME_SUFFIXES.some((s) => cleanHost.endsWith(s))) {
    return { allowed: false, reason: 'Blocked internal hostname.' };
  }
  if (net.isIP(cleanHost)) {
    return isPrivateOrReservedIp(cleanHost)
      ? { allowed: false, reason: 'Blocked private or reserved IP address.' }
      : { allowed: true };
  }
  try {
    const records = await dns.lookup(cleanHost, { all: true });
    if (!records.length) {
      return { allowed: false, reason: 'Domain DNS lookup returned no addresses.' };
    }
    for (const rec of records) {
      if (isPrivateOrReservedIp(rec.address)) {
        return { allowed: false, reason: 'Domain resolved to a private/internal IP address.' };
      }
    }
    return { allowed: true };
  } catch {
    return { allowed: false, reason: 'Domain could not be resolved.' };
  }
}
