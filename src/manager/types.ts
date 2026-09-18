export interface MissionNeed {
  collect?: number;
  reachTerminal?: boolean;
}
export interface Mission {
  id: string;
  title: string;
  briefing: string;
  grid: string[];
  energy: number;
  allowed: string[];
  starter: string;
  need: MissionNeed;
  hint: string;
  unlock?: string;
  maxSteps?: number;
}
