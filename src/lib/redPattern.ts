export function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function generateRedPattern(count: number) {
  const redCount = Math.max(1, Math.round(count * 0.4));
  const indices = Array.from({ length: count }, (_, i) => i);
  const shuffled = shuffle(indices).slice(0, redCount);
  return shuffled.sort((a, b) => a - b);
}
