const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

export type SolvePayload = {
  title: string;
  context?: string;
  variables: Array<{
    name: string;
    lower_bound: number | null;
    upper_bound: number | null;
    category: "continuous" | "integer" | "binary";
  }>;
  objective: {
    sense: "maximize" | "minimize";
    coefficients: Record<string, number>;
  };
  constraints: Array<{
    name: string;
    coefficients: Record<string, number>;
    operator: "<=" | ">=" | "=";
    rhs: number;
  }>;
};

export type SolveResponse = {
  status: string;
  status_label: string;
  is_optimal: boolean;
  objective_value: number | null;
  variables: Array<{
    name: string;
    value: number;
    objective_coefficient: number;
    contribution: number;
  }>;
  constraints: Array<{
    name: string;
    operator: "<=" | ">=" | "=";
    rhs: number;
    activity: number;
    slack: number;
    is_binding: boolean;
    shadow_price: number | null;
  }>;
  interpretation: string;
  recommendations: Array<{
    title: string;
    description: string;
    severity: "info" | "success" | "warning";
  }>;
};

export async function solveLinearProblem(
  payload: SolvePayload,
): Promise<SolveResponse> {
  const response = await fetch(`${API_BASE_URL}/solver/solve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
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
