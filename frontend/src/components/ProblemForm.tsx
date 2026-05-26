import type { ModelType, ClassicalPayload, AssignmentPayload, TransportPayload } from '../types/api';
import { ClassicalForm } from './ClassicalForm';
import { AssignmentForm } from './AssignmentForm';
import { TransportForm } from './TransportForm';

interface ProblemFormProps {
  modelType: ModelType;
  onSolve: (payload: ClassicalPayload | AssignmentPayload | TransportPayload) => void;
  onBack: () => void;
  disabled?: boolean;
}

export function ProblemForm({ modelType, onSolve, onBack, disabled }: ProblemFormProps) {
  switch (modelType) {
    case 'classical':
      return <ClassicalForm onSubmit={onSolve} onBack={onBack} disabled={disabled} />;
    case 'assignment':
      return <AssignmentForm onSubmit={onSolve} onBack={onBack} disabled={disabled} />;
    case 'transport':
      return <TransportForm onSubmit={onSolve} onBack={onBack} disabled={disabled} />;
  }
}
