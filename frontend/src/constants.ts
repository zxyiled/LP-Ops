import type { Severity } from './types/api';

export const severityIcon: Record<Severity | string, string> = {
  success: '◆',
  warning: '▲',
  info: '●',
};
