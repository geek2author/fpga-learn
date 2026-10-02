import { useState } from 'react';
import type { CodeFillStep, ConceptStep, McqStep } from '../data/types';

export function ConceptStepView({ step, onNext }: { step: ConceptStep; onNext: () => void }) {
  return (
    <>
      <h2>{step.title}</h2>
      <p className="prompt">{step.body}</p>
      {step.points && (
        <ul className="points">
          {step.points.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
      )}
      {step.verilog && (
        <pre className="verilog">
          <code>{step.verilog}</code>
        </pre>
      )}
      <div className="actions">
        <button className="btn primary" onClick={onNext}>
          继续 →
        </button>
      </div>
    </>
  );
}

export function McqStepView({
  step,
  onNext,
  onResult,
}: {
  step: McqStep;
  onNext: () => void;
  /** 每次判定回调：wrong（可多次）与 correct（最终通过时一次） */
  onResult?: (correct: boolean) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [phase, setPhase] = useState<'answering' | 'correct' | 'wrong'>('answering');

  const check = () => {
    if (selected === null) return;
    const ok = selected === step.answer;
    setPhase(ok ? 'correct' : 'wrong');
    onResult?.(ok);
  };
  const retry = () => {
    setSelected(null);
    setPhase('answering');
  };

  return (
    <>
      {step.code && (
        <pre className="verilog">
          <code>{step.code}</code>
        </pre>
      )}
      <p className="prompt">{step.question}</p>
      <div className="mcq-options">
        {step.options.map((opt, i) => (
          <button
            key={i}
            className={`option ${
              phase !== 'answering' && i === step.answer
                ? 'right'
                : phase === 'wrong' && i === selected
                  ? 'wrong'
                  : phase === 'answering' && i === selected
                    ? 'selected'
                    : ''
            }`}
            disabled={phase !== 'answering'}
            onClick={() => setSelected(i)}
          >
            {opt}
          </button>
        ))}
      </div>

      {phase === 'correct' && (
        <div className="feedback correct">
          <strong>✓ 答对了！</strong>
          <p className="explain">{step.explanation}</p>
        </div>
      )}
      {phase === 'wrong' && (
        <div className="feedback wrong">
          <strong>答案不对</strong>
          <p>正确答案：{step.options[step.answer]}</p>
          <p className="explain">{step.explanation}</p>
        </div>
      )}

      <div className="actions">
        {phase === 'answering' && (
          <button className="btn primary" disabled={selected === null} onClick={check}>
            检查答案
          </button>
        )}
        {phase === 'wrong' && (
          <button className="btn primary" onClick={retry}>
            重试
          </button>
        )}
        {phase === 'correct' && (
          <button className="btn primary" onClick={onNext}>
            继续 →
          </button>
        )}
      </div>
    </>
  );
}

/** 代码填空：代码里 {{N}} 占位，下方按空位点选候选片段，全程不敲键盘 */
export function CodeFillStepView({
  step,
  onNext,
  onResult,
}: {
  step: CodeFillStep;
  onNext: () => void;
  onResult?: (correct: boolean) => void;
}) {
  const [sel, setSel] = useState<Record<string, number>>({});
  const [phase, setPhase] = useState<'answering' | 'correct' | 'wrong'>('answering');

  const allPicked = step.blanks.every((b) => sel[b.id] !== undefined);
  const allOk = allPicked && step.blanks.every((b) => sel[b.id] === b.answer);

  const check = () => {
    if (!allPicked) return;
    setPhase(allOk ? 'correct' : 'wrong');
    onResult?.(!!allOk);
  };
  const retry = () => {
    setSel({});
    setPhase('answering');
  };
  const pick = (blankId: string, idx: number) => {
    if (phase !== 'answering') return;
    setSel((s) => ({ ...s, [blankId]: idx }));
  };

  // 拆开代码模板：偶数段是文本，奇数段是空位编号
  const parts = step.code.split(/\{\{(\d+)\}\}/g);
  const blankState = (id: string): 'empty' | 'filled' | 'right' | 'wrong' => {
    if (phase === 'correct') return 'right';
    if (phase === 'wrong') return sel[id] === step.blanks.find((b) => b.id === id)?.answer ? 'right' : 'wrong';
    return sel[id] !== undefined ? 'filled' : 'empty';
  };

  return (
    <>
      <p className="prompt">{step.prompt}</p>
      <pre className="verilog codefill-code">
        <code>
          {parts.map((seg, i) =>
            i % 2 === 0 ? (
              <span key={i}>{seg}</span>
            ) : (
              <button
                key={i}
                className={`blank-slot ${blankState(seg)}`}
                onClick={() => {
                  const el = document.getElementById(`cf-${step.id}-${seg}`);
                  el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
                }}
              >
                {sel[seg] !== undefined ? step.blanks.find((b) => b.id === seg)!.options[sel[seg]] : `⬚${seg}`}
              </button>
            ),
          )}
        </code>
      </pre>

      {step.blanks.map((b) => (
        <div className="cf-blank" key={b.id} id={`cf-${step.id}-${b.id}`}>
          <div className="cf-label">
            空 {b.id}
            {b.hint ? ` · ${b.hint}` : ''}
          </div>
          <div className="cf-options">
            {b.options.map((opt, i) => {
              const isPicked = sel[b.id] === i;
              const cls =
                phase !== 'answering' && i === b.answer
                  ? 'right'
                  : phase === 'wrong' && isPicked && i !== b.answer
                    ? 'wrong'
                    : isPicked
                      ? 'selected'
                      : '';
              return (
                <button
                  key={i}
                  className={`cf-chip ${cls}`}
                  disabled={phase !== 'answering'}
                  onClick={() => pick(b.id, i)}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {phase === 'correct' && (
        <div className="feedback correct">
          <strong>✓ 全部填对！</strong>
          <p className="explain">{step.explanation}</p>
        </div>
      )}
      {phase === 'wrong' && (
        <div className="feedback wrong">
          <strong>有空的选错了</strong>
          <p>错误的空位已在代码中用红色标出，正确选项也用绿色描了出来。对照后重新选。</p>
          <p className="explain">{step.explanation}</p>
        </div>
      )}

      <div className="actions">
        {phase === 'answering' && (
          <button className="btn primary" disabled={!allPicked} onClick={check}>
            检查答案
          </button>
        )}
        {phase === 'wrong' && (
          <button className="btn primary" onClick={retry}>
            重试
          </button>
        )}
        {phase === 'correct' && (
          <button className="btn primary" onClick={onNext}>
            继续 →
          </button>
        )}
      </div>
    </>
  );
}
