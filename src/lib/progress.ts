import { chapters } from '../data/course';
import type { Step } from '../data/types';

export const STORE_VERSION = 2;

/** 错题复习间隔（分钟）：答对一次进一格，走完即毕业移出错题本 */
export const REVIEW_INTERVALS_MIN = [10, 60, 60 * 24, 60 * 24 * 3, 60 * 24 * 7];

export interface LessonStatus {
  stepIndex: number;
  completed: boolean;
}

export interface AttemptRecord {
  stepId: string;
  lessonId: string;
  type: 'mcq' | 'waveform' | 'codefill';
  /** 累计答错次数（>0 即「错过这道题」） */
  wrongCount: number;
  /** 连续复习通过次数，走完间隔表毕业 */
  box: number;
  inBook: boolean;
  /** 下次复习到期时间戳 */
  dueAt: number;
}

export interface Counters {
  correct: number;
  wrong: number;
  waveCorrect: number;
  reviewsDone: number;
  perfectLessons: number;
}

export interface StoredProgress {
  version: number;
  lessonStatus: Record<string, LessonStatus>;
  attempts: Record<string, AttemptRecord>;
  badges: Record<string, number>;
  counters: Counters;
}

export function defaultProgress(): StoredProgress {
  return {
    version: STORE_VERSION,
    lessonStatus: {},
    attempts: {},
    badges: {},
    counters: { correct: 0, wrong: 0, waveCorrect: 0, reviewsDone: 0, perfectLessons: 0 },
  };
}

const num = (v: unknown, d = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : d);

/** 宽松校验 + 合并默认值：兼容 v1（仅 lessonStatus）与损坏数据 */
export function normalizeProgress(raw: unknown): StoredProgress {
  const p = defaultProgress();
  if (!raw || typeof raw !== 'object') return p;
  const r = raw as Record<string, unknown>;

  if (r.lessonStatus && typeof r.lessonStatus === 'object') {
    for (const [k, v] of Object.entries(r.lessonStatus as Record<string, unknown>)) {
      const s = v as Record<string, unknown>;
      if (s && typeof s === 'object' && typeof s.completed === 'boolean') {
        p.lessonStatus[k] = { stepIndex: num(s.stepIndex), completed: !!s.completed };
      }
    }
  }
  if (r.attempts && typeof r.attempts === 'object') {
    for (const [k, v] of Object.entries(r.attempts as Record<string, unknown>)) {
      const a = v as Record<string, unknown>;
      if (a && typeof a === 'object' && typeof a.stepId === 'string') {
        p.attempts[k] = {
          stepId: a.stepId,
          lessonId: typeof a.lessonId === 'string' ? a.lessonId : '',
          type: a.type === 'waveform' ? 'waveform' : a.type === 'codefill' ? 'codefill' : 'mcq',
          wrongCount: num(a.wrongCount),
          box: num(a.box),
          inBook: !!a.inBook,
          dueAt: num(a.dueAt),
        };
      }
    }
  }
  if (r.badges && typeof r.badges === 'object') {
    for (const [k, v] of Object.entries(r.badges as Record<string, unknown>)) {
      if (typeof v === 'number') p.badges[k] = v;
    }
  }
  if (r.counters && typeof r.counters === 'object') {
    const c = r.counters as Record<string, unknown>;
    p.counters = {
      correct: num(c.correct),
      wrong: num(c.wrong),
      waveCorrect: num(c.waveCorrect),
      reviewsDone: num(c.reviewsDone),
      perfectLessons: num(c.perfectLessons),
    };
  }
  return p;
}

export interface AnswerEvent {
  stepId: string;
  lessonId: string;
  type: 'mcq' | 'waveform' | 'codefill';
  correct: boolean;
  /** 复习模式中的作答（影响复习计数） */
  isReview: boolean;
}

export function applyAnswer(p: StoredProgress, e: AnswerEvent): StoredProgress {
  const next: StoredProgress = {
    ...p,
    attempts: { ...p.attempts },
    counters: { ...p.counters },
  };
  const rec: AttemptRecord = { ...(next.attempts[e.stepId] ?? emptyAttempt(e)) };

  if (e.correct) {
    next.counters.correct++;
    if (e.type === 'waveform') next.counters.waveCorrect++;
    if (rec.inBook) {
      rec.box += 1;
      if (e.isReview) next.counters.reviewsDone++;
      if (rec.box > REVIEW_INTERVALS_MIN.length) {
        rec.inBook = false; // 毕业
      } else {
        rec.dueAt = Date.now() + REVIEW_INTERVALS_MIN[rec.box - 1] * 60_000;
      }
    }
  } else {
    next.counters.wrong++;
    rec.wrongCount++;
    rec.inBook = true;
    rec.box = 0;
    rec.dueAt = Date.now();
  }
  next.attempts[e.stepId] = rec;
  return next;
}

function emptyAttempt(e: AnswerEvent): AttemptRecord {
  return { stepId: e.stepId, lessonId: e.lessonId, type: e.type, wrongCount: 0, box: 0, inBook: false, dueAt: 0 };
}

export function applyLessonCompleted(p: StoredProgress, lessonId: string, wrongInSession: number): StoredProgress {
  return {
    ...p,
    counters: {
      ...p.counters,
      perfectLessons: p.counters.perfectLessons + (wrongInSession === 0 ? 1 : 0),
    },
    lessonStatus: { ...p.lessonStatus, [lessonId]: { stepIndex: 0, completed: true } },
  };
}

/** 按 stepId 在全部章节中定位步骤（内容更新后找不到的返回 null） */
export function findStep(stepId: string): { lessonId: string; step: Step } | null {
  for (const chapter of chapters) {
    for (const lesson of chapter.lessons) {
      for (const step of lesson.steps) {
        if (step.id === stepId) return { lessonId: lesson.id, step };
      }
    }
  }
  return null;
}

export function bookStats(p: StoredProgress): { total: number; due: number; nextDueAt: number } {
  const inBook = Object.values(p.attempts).filter((a) => a.inBook);
  const due = inBook.filter((a) => a.dueAt <= Date.now());
  const nextDueAt = inBook.length ? Math.min(...inBook.map((a) => a.dueAt)) : 0;
  return { total: inBook.length, due: due.length, nextDueAt };
}

/** 到期待复习的题目，按到期时间升序 */
export function dueReviewIds(p: StoredProgress): string[] {
  return Object.values(p.attempts)
    .filter((a) => a.inBook && a.dueAt <= Date.now())
    .sort((a, b) => a.dueAt - b.dueAt)
    .map((a) => a.stepId);
}

/** 人性化的时长描述（用于「X 后到期」） */
export function formatGap(ms: number): string {
  const min = Math.max(1, Math.ceil(ms / 60_000));
  if (min < 60) return `${min} 分钟`;
  const h = Math.ceil(min / 60);
  if (h < 24) return `${h} 小时`;
  return `${Math.ceil(h / 24)} 天`;
}
