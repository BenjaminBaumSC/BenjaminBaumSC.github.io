const STAGES = [10000, 25000, 45000];

// 0 = nothing, 1 = foot tapping, 2 = asleep, 3 = attract mode.
export function idleStage(idleMs) {
  return STAGES.filter((threshold) => idleMs >= threshold).length;
}
