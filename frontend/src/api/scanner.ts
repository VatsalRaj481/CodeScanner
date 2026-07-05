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
}

export interface ScanResponse {
  score: number;
  risk_level: 'critical' | 'high' | 'medium' | 'low' | 'secure';
  vulnerabilities: Vulnerability[];
  error?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function scanCodeApi(code: string, language: string): Promise<ScanResponse> {
  const response = await fetch(`${API_BASE_URL}/api/scan`, {
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
