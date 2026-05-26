import type {
  UnifiedSolveRequest,
  UnifiedSolveResponse,
  ModelsResponse,
  AiPollResponse,
} from '../types/api';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
const REQUEST_TIMEOUT = 30_000;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  const merged = { ...init, signal: init?.signal ?? controller.signal };
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...merged,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `HTTP ${res.status}`);
    }
    return res.json() as Promise<T>;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchModels(): Promise<ModelsResponse> {
  return request<ModelsResponse>('/api/models');
}

export async function solveProblem(
  req: UnifiedSolveRequest,
): Promise<UnifiedSolveResponse> {
  return request<UnifiedSolveResponse>('/api/solve', {
    method: 'POST',
    body: JSON.stringify(req),
  });
}

export async function pollAiInsights(
  solveId: string,
): Promise<AiPollResponse> {
  return request<AiPollResponse>(`/api/solve/${solveId}/ai`);
}

export async function healthCheck(): Promise<{ status: string }> {
  return request<{ status: string }>('/health');
}
