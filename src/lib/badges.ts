import { chapter1, chapter2, chapter3, chapter4 } from '../data/course';
import type { StoredProgress } from './progress';

export interface BadgeDef {
  id: string;
  name: string;
  desc: string;
  icon: string;
  check: (p: StoredProgress) => boolean;
}

const everMistaken = (p: StoredProgress) => Object.values(p.attempts).some((a) => a.wrongCount > 0);
const bookTotal = (p: StoredProgress) => Object.values(p.attempts).filter((a) => a.inBook).length;

export const BADGES: BadgeDef[] = [
  {
    id: 'first-lesson',
    name: '小试牛刀',
    desc: '完成第一个小节',
    icon: '🎓',
    check: (p) => Object.values(p.lessonStatus).some((s) => s.completed),
  },
  {
    id: 'first-wave',
    name: '初画波形',
    desc: '第一次画对波形题',
    icon: '📈',
    check: (p) => p.counters.waveCorrect >= 1,
  },
  {
    id: 'perfect-lesson',
    name: '完美通关',
    desc: '零答错通过一个小节',
    icon: '💎',
    check: (p) => p.counters.perfectLessons >= 1,
  },
  {
    id: 'wave-10',
    name: '波形猎手',
    desc: '累计画对 10 道波形题',
    icon: '🏹',
    check: (p) => p.counters.waveCorrect >= 10,
  },
  {
    id: 'correct-50',
    name: '百发百中',
    desc: '累计答对 50 题',
    icon: '🎯',
    check: (p) => p.counters.correct >= 50,
  },
  {
    id: 'review-10',
    name: '复习大师',
    desc: '完成 10 次错题复习',
    icon: '📖',
    check: (p) => p.counters.reviewsDone >= 10,
  },
  {
    id: 'mistake-clear',
    name: '知错能改',
    desc: '错题本全部毕业清零',
    icon: '🧹',
    check: (p) => everMistaken(p) && bookTotal(p) === 0,
  },
  {
    id: 'chapter1',
    name: '第一章毕业',
    desc: '完成第一章全部 8 个小节',
    icon: '🏆',
    check: (p) => chapter1.lessons.every((l) => p.lessonStatus[l.id]?.completed),
  },
  {
    id: 'chapter-uart',
    name: '串口通',
    desc: '完成第二章 UART 全部小节',
    icon: '📡',
    check: (p) => chapter2.lessons.every((l) => p.lessonStatus[l.id]?.completed),
  },
  {
    id: 'chapter-spi',
    name: '总线通',
    desc: '完成第三章 SPI 全部小节',
    icon: '🔌',
    check: (p) => chapter3.lessons.every((l) => p.lessonStatus[l.id]?.completed),
  },
  {
    id: 'chapter-fsm',
    name: '状态机入门',
    desc: '完成第四章 FSM 全部小节',
    icon: '🧭',
    check: (p) => chapter4.lessons.every((l) => p.lessonStatus[l.id]?.completed),
  },
];

export const badgeById = (id: string) => BADGES.find((b) => b.id === id);

/** 返回本次更新中新达成的徽章 id（用于弹 Toast） */
export function diffUnlocked(prev: StoredProgress, next: StoredProgress): string[] {
  return BADGES.filter((b) => b.check(next) && !b.check(prev)).map((b) => b.id);
}
