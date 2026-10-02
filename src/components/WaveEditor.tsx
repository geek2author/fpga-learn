import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Bit, WaveQuestion } from '../data/types';
import { diffRuns } from '../lib/waveform';

const LABEL_W = 52;
const EDITOR_HPAD = 8; // .editor 的左右内边距合计
const ROW_H = 44;
const Y_HIGH = 9;
const Y_LOW = 35;
const AXIS_H = 20;

interface Props {
  question: WaveQuestion;
  value: Bit[];
  onChange: (next: Bit[]) => void;
  checked: boolean;
  isCorrect: boolean;
}

/** 二值波形的阶梯路径（时间片粒度） */
function stepPath(wave: Bit[], slotW: number): string {
  let d = `M 0 ${wave[0] ? Y_HIGH : Y_LOW}`;
  for (let i = 0; i < wave.length; i++) {
    const x = (i + 1) * slotW;
    d += ` L ${x} ${wave[i] ? Y_HIGH : Y_LOW}`;
    if (i + 1 < wave.length && wave[i + 1] !== wave[i]) {
      d += ` L ${x} ${wave[i + 1] ? Y_HIGH : Y_LOW}`;
    }
  }
  return d;
}

type RowKind = 'input' | 'target' | 'ref';

export default function WaveEditor({ question, value, onChange, checked, isCorrect }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(320);
  const historyRef = useRef<Bit[][]>([]);
  const [canUndo, setCanUndo] = useState(false);

  // 宽度以容器实际内容宽度为准：首帧布局后测量，再用 ResizeObserver 跟随
  // （不能用 window.innerWidth 估算——工具栏/滚动条会让 SVG 溢出容器被裁剪，右侧时间片点不到）
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const w = el.clientWidth - EDITOR_HPAD;
    if (w > 0) setWidth(w);
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const totalSlots = value.length;
  const slotW = (width - LABEL_W) / totalSlots;

  const rows = useMemo(() => {
    const list = question.inputs.map((s) => ({ name: s.name, wave: s.wave, kind: 'input' as RowKind }));
    list.push({ name: question.target.name, wave: value, kind: 'target' as RowKind });
    if (checked) {
      list.push({ name: '参考', wave: question.target.reference, kind: 'ref' as RowKind });
    }
    return list;
  }, [question, value, checked]);

  const svgH = rows.length * ROW_H + AXIS_H;
  const targetIndex = rows.findIndex((r) => r.kind === 'target');
  const targetTop = targetIndex * ROW_H;
  const locked = checked && isCorrect;

  // value 的实时镜像：连续快速点击时闭包里的 value 可能还没重渲染，
  // 不用 ref 同步会让前面的点击被最后一次覆盖
  const valueRef = useRef(value);
  valueRef.current = value;

  const applyEdit = (next: Bit[]) => {
    historyRef.current.push(valueRef.current);
    valueRef.current = next;
    setCanUndo(true);
    onChange(next);
  };

  // 点击第 i 片：从该处到行尾电平整体翻转，等效于在点击处放置一个边沿
  const tapSlot = (i: number) => {
    if (locked) return;
    const next = valueRef.current.slice();
    for (let k = i; k < next.length; k++) next[k] = (next[k] === 1 ? 0 : 1) as Bit;
    applyEdit(next);
  };

  const undo = () => {
    const prev = historyRef.current.pop();
    if (prev) {
      valueRef.current = prev;
      onChange(prev);
    }
    setCanUndo(historyRef.current.length > 0);
  };

  const clear = () => {
    if (!locked) applyEdit(valueRef.current.map(() => 0 as Bit));
  };

  const runs = checked && !isCorrect ? diffRuns(value, question.target.reference) : [];

  const edgeSlots = useMemo(() => {
    // 匹配 clk / SCLK 等：上升沿（虚线）即采样参考沿
    const clk = question.inputs.find((s) => /clk/i.test(s.name));
    if (!clk) return [];
    const slots: number[] = [];
    for (let i = 1; i < clk.wave.length; i++) {
      if (clk.wave[i] === 1 && clk.wave[i - 1] === 0) slots.push(i);
    }
    return slots;
  }, [question]);

  const waveColor = (kind: RowKind, name: string) => {
    if (kind === 'ref') return '#94a3b8';
    if (kind === 'target') return checked && isCorrect ? '#059669' : '#4f46e5';
    return name === 'clk' ? '#7c3aed' : '#2563eb';
  };

  const labelColor = (kind: RowKind) =>
    kind === 'ref' ? '#94a3b8' : kind === 'target' ? '#4f46e5' : '#334155';

  return (
    <div className="editor" ref={wrapRef}>
      <svg width={width} height={svgH} className="wavesvg" role="img" aria-label="波形图">
        {/* 竖向网格：周期线深、半周期线浅 */}
        {Array.from({ length: totalSlots + 1 }, (_, i) => (
          <line
            key={`g${i}`}
            x1={LABEL_W + i * slotW}
            x2={LABEL_W + i * slotW}
            y1={0}
            y2={svgH - AXIS_H}
            stroke={i % 2 === 0 ? '#e2e8f0' : '#f1f5f9'}
          />
        ))}
        {/* 行分隔线 */}
        {rows.map((_, i) => (
          <line key={`h${i}`} x1={0} x2={width} y1={i * ROW_H} y2={i * ROW_H} stroke="#e2e8f0" />
        ))}
        {/* 上升沿标线 */}
        {edgeSlots.map((s) => (
          <line
            key={`e${s}`}
            x1={LABEL_W + s * slotW}
            x2={LABEL_W + s * slotW}
            y1={0}
            y2={svgH - AXIS_H}
            stroke="#fb7185"
            strokeOpacity={0.35}
            strokeDasharray="3 4"
          />
        ))}
        {/* 目标行底色 */}
        <rect x={0} y={targetTop} width={width} height={ROW_H} fill="#4f46e5" fillOpacity={0.045} />
        {/* 错误区间高亮 */}
        {runs.map((r) => (
          <rect
            key={`w${r.start}`}
            x={LABEL_W + r.start * slotW}
            y={targetTop + 1}
            width={r.len * slotW}
            height={ROW_H - 2}
            fill="#ef4444"
            fillOpacity={0.18}
            rx={2}
          />
        ))}
        {/* 标签与波形 */}
        {rows.map((row, ri) => {
          const top = ri * ROW_H;
          return (
            <g key={`${row.name}-${ri}`}>
              <text
                x={6}
                y={top + ROW_H / 2 + 4}
                fontSize={11}
                fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                fill={labelColor(row.kind)}
                fontWeight={row.kind === 'target' ? 700 : 400}
              >
                {row.name}
              </text>
              <g transform={`translate(${LABEL_W}, ${top})`}>
                <path
                  d={stepPath(row.wave, slotW)}
                  fill="none"
                  stroke={waveColor(row.kind, row.name)}
                  strokeWidth={row.kind === 'target' ? 2.2 : 1.8}
                  strokeDasharray={row.kind === 'ref' ? '5 3' : undefined}
                  strokeLinejoin="round"
                />
              </g>
            </g>
          );
        })}
        {/* 目标行点击热区（通关后锁定） */}
        {!locked &&
          value.map((_, i) => (
            <rect
              key={`t${i}`}
              x={LABEL_W + i * slotW}
              y={targetTop}
              width={slotW}
              height={ROW_H}
              fill="transparent"
              style={{ cursor: 'pointer', touchAction: 'manipulation' }}
              onPointerDown={(e) => {
                e.preventDefault();
                tapSlot(i);
              }}
            />
          ))}
        {/* 周期序号，与讲解文案中的"第 N 周期"对应 */}
        {Array.from({ length: question.periods }, (_, p) => (
          <text
            key={`p${p}`}
            x={LABEL_W + (p * 2 + 1) * slotW}
            y={svgH - 6}
            fontSize={9}
            fill="#94a3b8"
            textAnchor="middle"
          >
            {p + 1}
          </text>
        ))}
      </svg>

      <div className="editor-tools">
        <button className="btn tiny" onClick={undo} disabled={locked || !canUndo}>
          撤销
        </button>
        <button className="btn tiny" onClick={clear} disabled={locked}>
          清空
        </button>
        <span className="tip">{locked ? '已通关，波形已锁定' : '点击 Q 行：该处向右电平翻转'}</span>
      </div>
    </div>
  );
}
