import { useState } from 'react';
import type { Bit, WaveQuestion } from '../data/types';
import { diffPeriods } from '../lib/waveform';
import WaveEditor from './WaveEditor';

type Status = 'editing' | 'correct' | 'wrong';

interface Props {
  question: WaveQuestion;
  onNext: () => void;
  /** 每次判定回调：wrong（可多次）与 correct（通过时一次） */
  onResult?: (correct: boolean) => void;
}

export default function WaveStepView({ question, onNext, onResult }: Props) {
  const [value, setValue] = useState<Bit[]>(() =>
    question.target.reference.map(() => (question.target.initial ?? 0) as Bit),
  );
  const [status, setStatus] = useState<Status>('editing');

  const check = () => {
    const ok = value.every((v, i) => v === question.target.reference[i]);
    setStatus(ok ? 'correct' : 'wrong');
    onResult?.(ok);
  };

  const badPeriods = status === 'wrong' ? diffPeriods(value, question.target.reference) : [];

  return (
    <>
      <p className="prompt">{question.prompt}</p>

      <WaveEditor
        question={question}
        value={value}
        onChange={setValue}
        checked={status !== 'editing'}
        isCorrect={status === 'correct'}
      />

      {status === 'wrong' && (
        <div className="feedback wrong">
          <strong>还没画对</strong>
          <p>
            不一致的位置集中在第 {badPeriods.join('、')} 个时钟周期，已在波形上标红；灰色虚线是参考答案。
            调整后重新检查。
          </p>
          <p className="explain">{question.explanation}</p>
        </div>
      )}
      {status === 'correct' && (
        <div className="feedback correct">
          <strong>✓ 波形正确！</strong>
          <p className="explain">{question.explanation}</p>
        </div>
      )}

      <div className="actions">
        {status !== 'correct' && (
          <button className="btn primary" onClick={check}>
            检查答案
          </button>
        )}
        {status === 'correct' && (
          <button className="btn primary" onClick={onNext}>
            继续 →
          </button>
        )}
      </div>
    </>
  );
}
