
export enum ControlLevel {
  PPE = 1,
  ADMINISTRATIVE = 2,
  ENGINEERING = 3,
  SUBSTITUTION = 4,
  ELIMINATION = 5
}

export interface Hazard {
  title: string;
  description: string;
}

export interface Choice {
  id: string;
  text: string;
  level: ControlLevel;
  explanation: string;
}

export interface FloorData {
  intro: string;
  choices: Choice[];
}

export interface GameMessage {
  role: 'operator' | 'player';
  text: string;
  timestamp: number;
}

export interface ValidationResult {
  isCorrect: boolean;
  feedback: string;
}
