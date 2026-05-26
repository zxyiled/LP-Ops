const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

export type SolvePayload = {
  modelType: "classical" | "assignment" | "transport";
  payload: Record<string, unknown>;
};

export type SolveResponse = {
  modelType: string;
  status: string;
  status_label: string;
  is_optimal: boolean;
  objective_value: number | null;
  results: Record<string, unknown>;
  variables: Array<Record<string, unknown>>;
  constraints: Array<Record<string, unknown>>;
  interpretation: string;
  recommendations: Array<{
    title: string;
    description: string;
    severity: "info" | "success" | "warning";
  }>;
  ai_analysis: Record<string, unknown> | null;
  visualization: Record<string, unknown> | null;
  solve_id: string | null;
};

export async function solveLinearProblem(
  payload: SolvePayload,
): Promise<SolveResponse> {
  const response = await fetch(`${API_BASE_URL}/solve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let message = "No se pudo resolver el modelo.";
    try {
      const error = await response.json();
      message =
        typeof error.detail === "string"
          ? error.detail
          : JSON.stringify(error.detail);
    } catch {
      message = response.statusText;
    }
    throw new Error(message);
  }

  return response.json();
}

export async function fetchModels(): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/models`);
  const data = await response.json();
  return data.models;
}

export async function pollAiAnalysis(
  solveId: string,
): Promise<{ status: string; insights: Record<string, unknown> | null }> {
  const response = await fetch(`${API_BASE_URL}/solve/${solveId}/ai`);
  return response.json();
}
