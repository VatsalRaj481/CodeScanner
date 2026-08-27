export interface Vulnerability {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  category: string;
  line_numbers: number[];
  description: string;
  why_risky: string;
  fix_code: string;
  fix_explanation: string;
  cwe_id: string;
  filename?: string;
}

export interface FileItem {
  filename: string;
  code: string;
  language: string;
}

export interface FileScanResult {
  filename: string;
  score: number;
  risk_level: 'critical' | 'high' | 'medium' | 'low' | 'secure';
  vulnerabilities: Vulnerability[];
}

export interface ScanResponse {
  score: number;
  risk_level: 'critical' | 'high' | 'medium' | 'low' | 'secure';
  vulnerabilities: Vulnerability[];
  error?: string;
  total_files?: number;
  file_results?: FileScanResult[];
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Fire-and-forget wake ping to warm up backend on frontend mount.
 */
export function wakePingApi(): void {
  fetch(`${API_BASE_URL}/health`, { cache: 'no-store' }).catch(() => {
    // Silently ignore errors - wake ping is fire-and-forget
  });
}

/**
 * Retry wrapper with backoff (3 retries, ~3s delay) to gracefully handle backend cold-starts
 * (e.g., Render free tier 502/503/504 gateway errors or network timeouts).
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3,
  delayMs = 3000
): Promise<Response> {
  let attempt = 0;
  while (true) {
    try {
      const response = await fetch(url, options);
      if (!response.ok && response.status >= 500 && attempt < maxRetries) {
        attempt++;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      return response;
    } catch (err) {
      if (attempt < maxRetries) {
        attempt++;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      throw err;
    }
  }
}

export async function scanCodeApi(code: string, language: string): Promise<ScanResponse> {
  const response = await fetchWithRetry(`${API_BASE_URL}/api/scan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code, language }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Network request failed' }));
    throw new Error(errorData.detail || `Server returned status ${response.status}`);
  }

  return response.json();
}

export async function scanBatchCodeApi(files: FileItem[]): Promise<ScanResponse> {
  const response = await fetchWithRetry(`${API_BASE_URL}/api/scan-batch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ files }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Network request failed' }));
    throw new Error(errorData.detail || `Server returned status ${response.status}`);
  }

  return response.json();
}
