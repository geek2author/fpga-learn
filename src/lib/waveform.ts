import type { Bit } from '../data/types';

export interface Run {
  start: number;
  len: number;
}

/** 两个波形逐时间片比对，返回不一致的连续区间 */
export function diffRuns(a: Bit[], b: Bit[]): Run[] {
  const runs: Run[] = [];
  const n = Math.min(a.length, b.length);
  let i = 0;
  while (i < n) {
    if (a[i] !== b[i]) {
      const start = i;
      while (i < n && a[i] !== b[i]) i++;
      runs.push({ start, len: i - start });
    } else {
      i++;
    }
  }
  return runs;
}

/** M1 约定：每周期 2 个时间片。返回不一致的时钟周期序号（1 起，升序） */
export function diffPeriods(a: Bit[], b: Bit[]): number[] {
  const set = new Set<number>();
  for (const r of diffRuns(a, b)) {
    for (let s = r.start; s < r.start + r.len; s++) set.add(Math.floor(s / 2) + 1);
  }
  return [...set].sort((x, y) => x - y);
}
