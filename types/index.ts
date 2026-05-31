/** Shared types for CPDiagnose */

export type CFVerdict =
  | 'OK'
  | 'WRONG_ANSWER'
  | 'TIME_LIMIT_EXCEEDED'
  | 'RUNTIME_ERROR'
  | 'COMPILATION_ERROR'
  | string;

export interface CFSubmission {
  id: number;
  contestId: number;
  problemIndex: string;
  problemName: string;
  tags: string[];
  rating?: number;
  verdict: CFVerdict;
  language: string;
  passedTestCount: number;
  timeConsumedMillis: number;
  memoryConsumedBytes: number;
  submittedAt: Date;
}

export type ErrorType =
  | 'logic_error'
  | 'efficiency'
  | 'edge_case'
  | 'algorithm';

export type ErrorSeverity = 'critical' | 'warning' | 'suggestion';

export interface DiagnosisError {
  id: string;
  line_start: number;
  line_end: number;
  col_start: number;
  col_end: number;
  type: ErrorType;
  severity: ErrorSeverity;
  short_description: string;
  full_explanation: string;
  correct_intuition: string;
  visual_hint?: string;
}

export type VerdictType = 'wrong_answer' | 'time_limit' | 'accepted';

export interface DiagnosisAnalysis {
  verdict_type: VerdictType;
  one_line_summary: string;
  errors: DiagnosisError[];
  correct_pattern: string;
  conceptual_gap: string;
  prereq_topics: string[];
  efficiency_note?: string;
}

export interface CompileResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  compile_output?: string;
}
