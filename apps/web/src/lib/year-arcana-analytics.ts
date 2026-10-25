import { reachGoal, type Goal } from "./analytics";
import { isAnalyticsReady } from "./analytics-runtime";

type YearGoal = Extract<Goal, `year_arcana_${string}`>;

// Do not replay clicks made before consent or SDK readiness. The offer view waits while mounted.
export function reachYearGoal(goal: YearGoal): boolean {
  return isAnalyticsReady() && reachGoal(goal);
}
