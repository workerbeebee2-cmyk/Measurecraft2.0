export enum LineType {
  REFERENCE = 'Reference (Known)',
  TARGET = 'Target (Unknown)',
}

export interface LineData {
  id: string;
  name: string;
  category: string;
  color: string;
  type: LineType;
  realLength?: number;
  calculatedLength?: number;
  coords: { x1: number; y1: number; x2: number; y2: number };
}

export interface AnalysisResult {
  lines: { id: string; calculatedLength: number; confidence: number }[];
  summary: string;
}
