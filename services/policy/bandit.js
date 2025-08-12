export function pickUCB1(arms) {
  const totalPulls = arms.reduce((s, a) => s + (a.pulls || 0), 0) || 1;
  const scored = arms.map(a => {
    const pulls = Math.max(1, a.pulls || 0);
    const avg = (a.rewards || 0) / pulls;
    const bonus = Math.sqrt((2 * Math.log(totalPulls)) / pulls);
    return { key: a.key, score: avg + bonus };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0].key;
}

export function updateArm(arm, reward) {
  return {
    ...arm,
    pulls: (arm.pulls || 0) + 1,
    rewards: (arm.rewards || 0) + reward
  };
}
