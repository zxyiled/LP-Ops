export type ModelType = 'classical' | 'assignment' | 'transport';
export type OptimizationSense = 'maximize' | 'minimize';
export type ConstraintOperator = '<=' | '>=' | '=';
export type VariableCategory = 'continuous' | 'integer' | 'binary';
export type Severity = 'info' | 'success' | 'warning';

export interface UnifiedSolveRequest {
  modelType: ModelType;
  payload: Payload;
}

export interface ClassicalDecisionVariable {
  name: string;
  lowerBound?: number;
  upperBound?: number | null;
  category?: VariableCategory;
}

export interface ClassicalObjective {
  sense: OptimizationSense;
  coefficients: Record<string, number>;
}

export interface ClassicalConstraint {
  name: string;
  coefficients: Record<string, number>;
  operator: ConstraintOperator;
  rhs: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Payload = Record<string, any>;

export interface ClassicalPayload extends Payload {
  title?: string;
  context?: string | null;
  variables: ClassicalDecisionVariable[];
  objective: ClassicalObjective;
  constraints: ClassicalConstraint[];
}

export interface AssignmentPayload extends Payload {
  agents: string[];
  tasks: string[];
  costs: Record<string, number>;
  sense?: OptimizationSense;
}

export interface TransportPayload extends Payload {
  origins: string[];
  destinations: string[];
  costs: Record<string, number>;
  supply: Record<string, number>;
  demand: Record<string, number>;
}

export interface Recommendation {
  title: string;
  description: string;
  severity: Severity;
}

export interface AiInsight {
  title: string;
  description: string;
  severity: Severity;
}

export interface AiPollResponse {
  status: 'pending' | 'done';
  insights: AiInsight[] | null;
}

export interface UnifiedSolveResponse {
  modelType: ModelType;
  status: string;
  status_label: string;
  is_optimal: boolean;
  objective_value: number | null;
  results: Record<string, unknown>;
  variables: Record<string, unknown>[];
  constraints: Record<string, unknown>[];
  interpretation: string;
  recommendations: Recommendation[];
  ai_analysis: AiInsight[] | null;
  visualization: Record<string, unknown> | null;
  solve_id: string | null;
}

export interface ModelsResponse {
  models: ModelType[];
}
