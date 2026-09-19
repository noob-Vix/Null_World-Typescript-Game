export type Difficulty = "easy" | "medium" | "hard";
export interface MissionNeed {
  collect?: number;
  reachTerminal?: boolean;
}
export interface Mission {
  id: string;
  title: string;
  briefing: string;
  difficulty: Difficulty;
  tags: string[];
  grid: string[];
  energy: number;
  allowed: string[];
  starter: string;
  need: MissionNeed;
  hint: string;
  unlock?: string;
  maxSteps?: number;
  viewRadius?: number;
}
export interface TerminalTest {
  args: unknown[];
  expected: unknown;
}
export interface TerminalMission {
  id: string;
  title: string;
  briefing: string;
  difficulty: Difficulty;
  tags: string[];
  hint: string;
  stub: string;
  functionName: string;
  visibleTests: TerminalTest[];
  hiddenTests: TerminalTest[];
  powersText: string;
}
