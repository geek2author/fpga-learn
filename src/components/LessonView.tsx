import { useState } from 'react';
import type { Lesson, Step } from '../data/types';
import { ConceptStepView, CodeFillStepView, McqStepView } from './StepViews';
import WaveStepView from './WaveStepView';

interface Props {
  lesson: Lesson;
  initialStep: number;
  onStepChange: (lessonId: string, stepIndex: number) => void;
  /** 每次选择题/波形题的判定（用于答题记录与错题本） */
  onEvent: (lessonId: string, step: Step, correct: boolean) => void;
  onComplete: (lessonId: string, wrongInSession: number) => void;
  onExit: () => void;
}

export default function LessonView({ lesson, initialStep, onStepChange, onEvent, onComplete, onExit }: Props) {
  const [stepIndex, setStepIndex] = useState(() => Math.min(initialStep, lesson.steps.length - 1));
  const [done, setDone] = useState(false);
  const [sessionWrong, setSessionWrong] = useState(0);
  const total = lesson.steps.length;

  const handleResult = (step: Step, correct: boolean) => {
    onEvent(lesson.id, step, correct);
    if (!correct) setSessionWrong((n) => n + 1);
  };

  const goNext = () => {
    if (stepIndex + 1 >= total) {
      onComplete(lesson.id, sessionWrong);
      setDone(true);
    } else {
      const next = stepIndex + 1;
      setStepIndex(next);
      onStepChange(lesson.id, next);
    }
  };

  if (done) {
    return (
      <div className="app">
        <section className="card lesson-done">
          <h2>🎉 小节完成</h2>
          <p>「{lesson.title}」已通关，课程地图已解锁下一节。</p>
          <button className="btn primary" onClick={onExit}>
            返回课程地图
          </button>
        </section>
      </div>
    );
  }

  const step = lesson.steps[stepIndex];

  return (
    <div className="app">
      <header className="lesson-topbar">
        <button className="back-btn" onClick={onExit} aria-label="返回课程地图">
          ←
        </button>
        <h2>{lesson.title}</h2>
        <div className="step-dots">
          {lesson.steps.map((s, i) => (
            <span
              key={s.id}
              className={`step-dot ${i < stepIndex ? 'done' : ''} ${i === stepIndex ? 'on' : ''}`}
            />
          ))}
        </div>
      </header>

      <section className="card qcard">
        <div className="qmeta">
          第 {stepIndex + 1} 步 / 共 {total} 步
        </div>
        {step.type === 'concept' && <ConceptStepView step={step} onNext={goNext} />}
        {step.type === 'mcq' && (
          <McqStepView key={step.id} step={step} onNext={goNext} onResult={(ok) => handleResult(step, ok)} />
        )}
        {step.type === 'codefill' && (
          <CodeFillStepView key={step.id} step={step} onNext={goNext} onResult={(ok) => handleResult(step, ok)} />
        )}
        {step.type === 'waveform' && (
          <WaveStepView
            key={step.id}
            question={step.question}
            onNext={goNext}
            onResult={(ok) => handleResult(step, ok)}
          />
        )}
      </section>

      <p className="footer">{lesson.title} · 进度自动保存在本地</p>
    </div>
  );
}
