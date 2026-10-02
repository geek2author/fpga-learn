import { useCallback, useEffect, useState } from 'react';
import { chapters } from './data/course';
import type { Step } from './data/types';
import { loadProgress, saveProgress } from './lib/db';
import {
  applyAnswer,
  applyLessonCompleted,
  defaultProgress,
  dueReviewIds,
  findStep,
  type StoredProgress,
} from './lib/progress';
import { diffUnlocked } from './lib/badges';
import Home from './components/Home';
import LessonView from './components/LessonView';
import ReviewSession from './components/ReviewSession';
import Toast from './components/Toast';

type Screen = { kind: 'home' } | { kind: 'lesson'; lessonId: string } | { kind: 'review' };

export default function App() {
  const [progress, setProgress] = useState<StoredProgress | null>(null);
  const [screen, setScreen] = useState<Screen>({ kind: 'home' });
  const [reviewQueue, setReviewQueue] = useState<string[]>([]);
  const [toastIds, setToastIds] = useState<string[]>([]);

  useEffect(() => {
    loadProgress().then(setProgress);
  }, []);

  useEffect(() => {
    if (progress) saveProgress(progress);
  }, [progress]);

  const dismissToast = useCallback((id: string) => {
    setToastIds((ids) => ids.filter((x) => x !== id));
  }, []);

  /** 统一的状态更新入口：应用变更 + 记录新达成徽章 + 排队 Toast */
  const applyUpdate = (fn: (p: StoredProgress) => StoredProgress) => {
    if (!progress) return;
    const next = fn(progress);
    const fresh = diffUnlocked(progress, next);
    for (const id of fresh) {
      if (!next.badges[id]) next.badges[id] = Date.now();
    }
    if (fresh.length) setToastIds((ids) => [...ids, ...fresh]);
    setProgress(next);
  };

  if (!progress) {
    return <div className="splash">加载中…</div>;
  }

  const openLesson = (lessonId: string) => {
    applyUpdate((p) =>
      p.lessonStatus[lessonId]
        ? p
        : { ...p, lessonStatus: { ...p.lessonStatus, [lessonId]: { stepIndex: 0, completed: false } } },
    );
    setScreen({ kind: 'lesson', lessonId });
  };

  const startReview = () => {
    const ids = dueReviewIds(progress);
    if (!ids.length) return;
    setReviewQueue(ids);
    setScreen({ kind: 'review' });
  };

  const handleLessonEvent = (lessonId: string, step: Step, correct: boolean) => {
    if (step.type === 'concept') return;
    const type = step.type;
    applyUpdate((p) =>
      applyAnswer(p, {
        stepId: step.id,
        lessonId,
        type,
        correct,
        isReview: false,
      }),
    );
  };

  const handleReviewResult = (stepId: string, correct: boolean) => {
    const found = findStep(stepId);
    if (!found) return;
    const step = found.step;
    if (step.type === 'mcq' || step.type === 'waveform') {
      const type = step.type;
      const lessonId = found.lessonId;
      applyUpdate((p) => applyAnswer(p, { stepId, lessonId, type, correct, isReview: true }));
    }
  };

  if (screen.kind === 'lesson') {
    const lesson = chapters.flatMap((c) => c.lessons).find((l) => l.id === screen.lessonId);
    if (lesson) {
      return (
        <>
          <LessonView
            key={lesson.id}
            lesson={lesson}
            initialStep={progress.lessonStatus[lesson.id]?.stepIndex ?? 0}
            onStepChange={(lessonId, stepIndex) =>
              applyUpdate((p) => ({
                ...p,
                lessonStatus: {
                  ...p.lessonStatus,
                  [lessonId]: { ...(p.lessonStatus[lessonId] ?? { completed: false }), stepIndex },
                },
              }))
            }
            onEvent={handleLessonEvent}
            onComplete={(lessonId, wrongInSession) =>
              applyUpdate((p) => applyLessonCompleted(p, lessonId, wrongInSession))
            }
            onExit={() => setScreen({ kind: 'home' })}
          />
          <Toast toastIds={toastIds} onDismiss={dismissToast} />
        </>
      );
    }
  }

  if (screen.kind === 'review') {
    return (
      <>
        <ReviewSession queue={reviewQueue} onResult={handleReviewResult} onExit={() => setScreen({ kind: 'home' })} />
        <Toast toastIds={toastIds} onDismiss={dismissToast} />
      </>
    );
  }

  return (
    <>
      <Home
        progress={progress}
        onOpen={openLesson}
        onReview={startReview}
        onImport={(p) => applyUpdate(() => p)}
        onReset={() => applyUpdate(() => defaultProgress())}
      />
      <Toast toastIds={toastIds} onDismiss={dismissToast} />
    </>
  );
}
