/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * QAntum - CyberCody v25.2 Intelligence Filters
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 🧠 Smart Noise Filtering System
 * 
 * Features:
 * • PII Intelligence - Filters placeholders and low-entropy strings
 * • Redirect-Aware Auth - Detects legitimate login redirects
 * • BOLA Validation - Compares response sizes and structures
 * • Entropy Analysis - Identifies real vs fake data
 * 
 * @copyright 2025 Димитър Продромов (Dimitar Prodromov). All Rights Reserved.
 * @license PROPRIETARY AND CONFIDENTIAL
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════════
// PLACEHOLDER DETECTION
// ═══════════════════════════════════════════════════════════════════════════════

/** Known placeholder domains and patterns */
const PLACEHOLDER_DOMAINS = [
  'example.com',
  'example.org',
  'example.net',
  'test.com',
  'test.org',
  'localhost',
  'email.com',
  'mail.com',
  'domain.com',
  'placeholder.com',
  'dummy.com',
  'fake.com',
  'sample.com',
  'demo.com',
  'yoursite.com',
  'yourdomain.com',
  'company.com',
  'acme.com',
  'foo.com',
  'bar.com',
  'abc.com',
  'xyz.com',
];

/** Known placeholder usernames */
const PLACEHOLDER_USERNAMES = [
  'user',
  'test',
  'admin',
  'example',
  'sample',
  'demo',
  'placeholder',
  'your',
  'email',
  'name',
  'john',
  'jane',
  'doe',
  'foo',
  'bar',
  'xxx',
  'abc',
];

/** Known placeholder phone patterns */
const PLACEHOLDER_PHONES = [
  '1234567890',
  '0000000000',
  '1111111111',
  '123-456-7890',
  '(123) 456-7890',
  '+1234567890',
  '555-',  // US fictional
  '0888888888',
  '0899999999',
];

/**
 * Check if a value is a placeholder (fake data)
 */
export function isPlaceholder(value: string): boolean {
  const normalized = value.toLowerCase().trim();

  // Universal placeholder patterns
  if (/example|test|dummy|placeholder|sample|fake|foo|bar|abc|xyz|qwerty|lorem|ipsum|12345|00000|11111|99999/.test(normalized)) {
    return true;
  }

  // Check email placeholders and fake domains
  if (normalized.includes('@')) {
    const [username, domain] = normalized.split('@');

    // Check domain (must be a real TLD)
    if (PLACEHOLDER_DOMAINS.some(d => domain?.includes(d))) {
      return true;
    }
    // Only allow real TLDs (simple check)
    if (!/\.(com|net|org|bg|de|fr|co|io|gov|edu|info|biz|us|uk|ru|jp|cn|es|it|nl|au|ca|ch|se|no|fi|pl|cz|sk|ro|tr|gr|pt|ua|il|in|br|ar|mx|za|kr|sg|hk|id|vn|th|my|ph|nz|at|be|dk|hu|ie|lt|lv|ee|si|hr|rs|ba|me|mk|al|by|ge|kz|md|am|az|kg|tj|tm|uz|ae|sa|qa|kw|om|bh|jo|lb|sy|iq|ye|ma|dz|tn|ly|eg|sd|ss|et|ke|tz|ug|rw|bi|mw|zm|zm|zw|ao|cm|gh|ng|sn|sl|gm|gw|cv|st|sc|mu|mg|ls|sz|bw|na|mz|mw|zm|zw|ao|cm|gh|ng|sn|sl|gm|gw|cv|st|sc|mu|mg|ls|sz|bw|na|mz|mw|zm|zw|ao|cm|gh|ng|sn|sl|gm|gw|cv|st|sc|mu|mg|ls|sz|bw|na|mz|mw|zm|zw)$/i.test(domain)) {
      return true;
    }

    // Check username
    if (PLACEHOLDER_USERNAMES.some(u => username === u || username?.startsWith(u + '.'))) {
      return true;
    }

    // Obvious fake patterns
    if (/^(test|user|admin|example|sample)\d*@/.test(normalized)) {
      return true;
    }
  }

  // Check phone placeholders
  if (PLACEHOLDER_PHONES.some(p => normalized.includes(p.replace(/[-() ]/g, '')))) {
    return true;
  }

  // Check for sequential digits (123456, 111111, etc)
  if (/^(\d)\1{5,}$/.test(normalized.replace(/\D/g, ''))) {
    return true;
  }
  if (/^123456|654321|0123456|9876543/.test(normalized.replace(/\D/g, ''))) {
    return true;
  }

  // Filter out values that look like asset filenames (logo@2x.png, etc)
  if (/\.(webp|png|jpg|jpeg|gif|svg|ico|bmp|pdf|docx?|xlsx?|pptx?|mp3|mp4|wav|avi|mov|mkv|webm|zip|rar|tar|gz|7z|js|ts|css|html|json|xml|yaml|yml|woff2?|ttf|eot|otf|min\.js|min\.css|bundle\.js)$/i.test(normalized)) {
    return true;
  }

  return false;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ENTROPY ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate Shannon entropy of a string
 * Higher entropy = more random/real data
 * Lower entropy = more likely placeholder
 */
export function calculateEntropy(str: string): number {
  const len = str.length;
  if (len === 0) return 0;
  
  const freq: Record<string, number> = {};
  for (const char of str) {
    freq[char] = (freq[char] || 0) + 1;
  }
  
  let entropy = 0;
  for (const count of Object.values(freq)) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }
  
  return entropy;
}

/**
 * Check if string has high enough entropy to be real PII
 * Real emails typically have entropy > 3.5
 * Real phone numbers have entropy > 2.5
 */
export function hasHighEntropy(value: string, type: 'email' | 'phone' | 'generic' = 'generic'): boolean {
  const entropy = calculateEntropy(value);
  
  const thresholds = {
    email: 3.2,    // Real emails have diverse characters
    phone: 2.3,    // Phone numbers are less diverse
    generic: 3.0,
  };
  
  return entropy >= thresholds[type];
}

/** File extensions that look like email domains but aren't */
const FILE_EXTENSIONS = [
  '.webp', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.bmp',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.mp3', '.mp4', '.wav', '.avi', '.mov', '.mkv', '.webm',
  '.zip', '.rar', '.tar', '.gz', '.7z',
  '.js', '.ts', '.css', '.html', '.json', '.xml', '.yaml', '.yml',
  '.woff', '.woff2', '.ttf', '.eot', '.otf',
  '.min.js', '.min.css', '.bundle.js',
];

/**
 * Smart PII validation - combines placeholder check and entropy
 */
export function isRealPII(value: string, type: 'email' | 'phone' | 'generic' = 'generic'): boolean {
  const normalized = value.toLowerCase().trim();
  
  // Check if it's actually a file path/URL mistaken for email
  if (type === 'email') {
    // File extensions that look like domains
    for (const ext of FILE_EXTENSIONS) {
      if (normalized.endsWith(ext)) {
        return false;  // It's a file, not an email
      }
    }
    
    // Image size indicators (e.g., logo@2x.png)
    if (/@\d+x\./i.test(normalized)) {
      return false;  // Retina image naming convention
    }
    
    // Asset paths
    if (/\.(png|jpg|svg|webp|gif|ico)\/?$/i.test(normalized)) {
      return false;
    }
  }
  
  // First, check if it's a known placeholder
  if (isPlaceholder(value)) {
    return false;
  }
  
  // Then, check entropy
  if (!hasHighEntropy(value, type)) {
    return false;
  }
  
  return true;
}

// ═══════════════════════════════════════════════════════════════════════════════
// REDIRECT-AWARE AUTH DETECTION
// ═══════════════════════════════════════════════════════════════════════════════

/** Login/auth URL patterns */
const AUTH_URL_PATTERNS = [
  '/login',
  '/signin',
  '/sign-in',
  '/auth',
  '/authenticate',
  '/oauth',
  '/sso',
  '/signup',
  '/sign-up',
  '/register',
  '/forgot',
  '/reset-password',
  '/2fa',
  '/mfa',
  '/verify',
  '/callback',
];

export interface AuthCheckResult {
  isSecure: boolean;
  redirectedToAuth: boolean;
  finalUrl: string;
  statusCode: number;
  reason: string;
}

/**
 * Check if a URL is an auth-related page
 */
export function isAuthUrl(url: string): boolean {
  const lowerUrl = url.toLowerCase();
  return AUTH_URL_PATTERNS.some(pattern => lowerUrl.includes(pattern));
}

/**
 * Analyze auth bypass attempt result
 */
export function analyzeAuthBypass(
  originalUrl: string,
  finalUrl: string,
  statusCode: number,
  responseBody?: string
): AuthCheckResult {
  // 301/302 redirect to auth page = SECURE
  if ((statusCode === 301 || statusCode === 302) && isAuthUrl(finalUrl)) {
    return {
      isSecure: true,
      redirectedToAuth: true,
      finalUrl,
      statusCode,
      reason: `Properly redirected to auth page (${statusCode})`,
    };
  }
  
  // 200 but final URL is auth page = SECURE
  if (statusCode === 200 && isAuthUrl(finalUrl)) {
    return {
      isSecure: true,
      redirectedToAuth: true,
      finalUrl,
      statusCode,
      reason: 'Client-side redirect to auth page',
    };
  }
  
  // 401/403 = SECURE
  if (statusCode === 401 || statusCode === 403) {
    return {
      isSecure: true,
      redirectedToAuth: false,
      finalUrl,
      statusCode,
      reason: `Proper auth error returned (${statusCode})`,
    };
  }
  
  // 200 on protected page without redirect = POTENTIAL VULNERABILITY
  if (statusCode === 200 && !isAuthUrl(finalUrl) && finalUrl !== originalUrl) {
    return {
      isSecure: false,
      redirectedToAuth: false,
      finalUrl,
      statusCode,
      reason: 'Accessed protected resource without authentication',
    };
  }
  
  // Check response body for login form indicators
  if (responseBody) {
    const hasLoginForm = /type\s*=\s*["']password["']|login|sign.?in/i.test(responseBody);
    if (hasLoginForm) {
      return {
        isSecure: true,
        redirectedToAuth: true,
        finalUrl,
        statusCode,
        reason: 'Login form detected in response',
      };
    }
  }
  
  // Default: suspicious
  return {
    isSecure: false,
    redirectedToAuth: false,
    finalUrl,
    statusCode,
    reason: 'No auth protection detected',
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// BOLA/IDOR VALIDATION
// ═══════════════════════════════════════════════════════════════════════════════

export interface BOLAComparisonResult {
  isVulnerable: boolean;
  confidence: 'high' | 'medium' | 'low';
  sizeDifferencePercent: number;
  structureMatch: boolean;
  reason: string;
}

/**
 * Compare two responses to detect BOLA/IDOR
 */
export function compareBOLAResponses(
  userAResponse: { body: string; status: number },
  userBResponse: { body: string; status: number }
): BOLAComparisonResult {
  const sizeA = userAResponse.body.length;
  const sizeB = userBResponse.body.length;
  
  // Calculate size difference
  const avgSize = (sizeA + sizeB) / 2;
  const sizeDiff = Math.abs(sizeA - sizeB);
  const sizeDiffPercent = avgSize > 0 ? (sizeDiff / avgSize) * 100 : 0;
  
  // Different status codes = likely not vulnerable (proper access control)
  if (userAResponse.status !== userBResponse.status) {
    return {
      isVulnerable: false,
      confidence: 'high',
      sizeDifferencePercent: sizeDiffPercent,
      structureMatch: false,
      reason: `Different status codes (${userAResponse.status} vs ${userBResponse.status}) - access control working`,
    };
  }
  
  // Both 403/401 = secure
  if (userAResponse.status === 403 || userAResponse.status === 401) {
    return {
      isVulnerable: false,
      confidence: 'high',
      sizeDifferencePercent: sizeDiffPercent,
      structureMatch: false,
      reason: 'Both requests denied - proper access control',
    };
  }
  
  // Try to parse as JSON and compare structure
  let structureMatch = false;
  try {
    const jsonA = JSON.parse(userAResponse.body);
    const jsonB = JSON.parse(userBResponse.body);
    
    const keysA = Object.keys(jsonA).sort().join(',');
    const keysB = Object.keys(jsonB).sort().join(',');
    structureMatch = keysA === keysB;
  } catch {
    // Not JSON, compare raw
    structureMatch = sizeDiffPercent < 10;
  }
  
  // Size difference > 30% with same status = likely false positive
  if (sizeDiffPercent > 30) {
    return {
      isVulnerable: false,
      confidence: 'medium',
      sizeDifferencePercent: sizeDiffPercent,
      structureMatch,
      reason: `Large response size difference (${sizeDiffPercent.toFixed(1)}%) - likely different content`,
    };
  }
  
  // Same structure, same status, similar size = VULNERABLE
  if (structureMatch && userAResponse.status === 200 && sizeDiffPercent < 30) {
    return {
      isVulnerable: true,
      confidence: sizeDiffPercent < 10 ? 'high' : 'medium',
      sizeDifferencePercent: sizeDiffPercent,
      structureMatch: true,
      reason: `User A accessed User B data - same structure, ${sizeDiffPercent.toFixed(1)}% size diff`,
    };
  }
  
  // Uncertain
  return {
    isVulnerable: false,
    confidence: 'low',
    sizeDifferencePercent: sizeDiffPercent,
    structureMatch,
    reason: 'Inconclusive - needs manual verification',
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const IntelligenceFilters = {
  isPlaceholder,
  calculateEntropy,
  hasHighEntropy,
  isRealPII,
  isAuthUrl,
  analyzeAuthBypass,
  compareBOLAResponses,
};

export default IntelligenceFilters;
