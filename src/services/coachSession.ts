import type { PatternInsight } from '@services/patternAnalysis';
import type { WorkloadResult } from '@services/workloadAnalysis';
import type { LifeEvent } from '@services/lifeEvents';
import type { ReadinessResult } from '@utils/readiness';
import type { HealthData } from '../types';

export interface CoachSessionContext {
  readiness: ReadinessResult;
  healthData: HealthData;
  rhrBaseline: number;
  hrvBaseline: number;
  patterns: PatternInsight[];
  workload: WorkloadResult | null;
  lifeEvents: LifeEvent[];
}

let currentCoachSession: CoachSessionContext | null = null;

export function setCoachSession(session: CoachSessionContext): void {
  currentCoachSession = session;
}

export function getCoachSession(): CoachSessionContext | null {
  return currentCoachSession;
}

export function clearCoachSession(): void {
  currentCoachSession = null;
}
