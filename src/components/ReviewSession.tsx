import { useState } from 'react';
import { findStep } from '../lib/progress';
import { CodeFillStepView, McqStepView } from './StepViews';
import WaveStepView from './WaveStepView';

interface Props {
  /** 待复习的 stepId 队列 */
  queue: string[];
  onResult: (stepId: string, correct: boolean) => void;
  onExit: () => void;
}

export default function ReviewSession({ queue, onResult, onExit }: Props) {
  const items = queue.map(findStep).filter((x): x is NonNullable<typeof x> => !!x);
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);

  if (!items.length) {
    return (
      <div className="app">
        <section className="card lesson-done">
          <h2>没有到期的错题</h2>
          <p>复习队列已空。</p>
          <button className="btn primary" onClick={onExit}>
            返回课程地图
          </button>
        </section>
      </div>
    );
  }

  const finish = () => {
    setDone(true);
  };

  const advance = () => {
    if (index + 1 >= items.length) finish();
    else setIndex((i) => i + 1);
  };

  if (done) {
    return (
      <div className="app">
        <section className="card lesson-done">
          <h2>🎉 复习完成</h2>
          <p>本轮 {items.length} 道错题已处理，下次复习时间已按遗忘曲线重新排好。</p>
          <button className="btn primary" onClick={onExit}>
            返回课程地图
          </button>
        </section>
      </div>
    );
  }

  const { step } = items[index];

  return (
    <div className="app">
      <header className="lesson-topbar">
        <button className="back-btn" onClick={onExit} aria-label="返回课程地图">
          ←
        </button>
        <h2>错题复习</h2>
        <div className="step-dots">
          {items.map((it, i) => (
            <span key={it.step.id} className={`step-dot ${i < index ? 'done' : ''} ${i === index ? 'on' : ''}`} />
          ))}
        </div>
      </header>

      <section className="card qcard">
        <div className="qmeta">
          第 {index + 1} 题 / 共 {items.length} 题 · 答对可拉长下次复习间隔
        </div>
        {step.type === 'mcq' && (
          <McqStepView key={step.id} step={step} onNext={advance} onResult={(ok) => onResult(step.id, ok)} />
        )}
        {step.type === 'codefill' && (
          <CodeFillStepView key={step.id} step={step} onNext={advance} onResult={(ok) => onResult(step.id, ok)} />
        )}
        {step.type === 'waveform' && (
          <WaveStepView
            key={step.id}
            question={step.question}
            onNext={advance}
            onResult={(ok) => onResult(step.id, ok)}
          />
        )}
      </section>

      <p className="footer">错题复习 · 答对进阶，答错重新排队</p>
    </div>
  );
}
