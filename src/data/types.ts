export type Bit = 0 | 1;

/* ---------- 波形题 ---------- */

export interface InputSignal {
  /** 信号名，如 clk / D / rst_n / en / Q0 */
  name: string;
  /** 每个时间片一个电平；长度 = periods * 2（每周期两片：低、高） */
  wave: Bit[];
}

export interface WaveQuestion {
  id: string;
  prompt: string;
  /** 显示的时钟周期数，总时间片数 = periods * 2 */
  periods: number;
  inputs: InputSignal[];
  target: {
    name: string;
    reference: Bit[];
    /** 待画行的初始电平（默认 0；UART 空闲等场景为 1） */
    initial?: Bit;
  };
  /** 通过 / 复盘时展示的讲解 */
  explanation: string;
}

/* ---------- 步骤 ---------- */

export interface ConceptStep {
  type: 'concept';
  id: string;
  title: string;
  body: string;
  /** 要点列表 */
  points?: string[];
  /** 可选的 Verilog 代码示例 */
  verilog?: string;
}

export interface McqStep {
  type: 'mcq';
  id: string;
  question: string;
  /** 可选：题面上方的代码片段（用于"找 bug"类题目） */
  code?: string;
  options: string[];
  /** 正确选项的下标 */
  answer: number;
  explanation: string;
}

export interface CodeFillBlank {
  /** 占位符编号，对应代码里的 {{N}} */
  id: string;
  options: string[];
  /** 正确选项的下标 */
  answer: number;
  hint?: string;
}

export interface CodeFillStep {
  type: 'codefill';
  id: string;
  prompt: string;
  /** 代码模板，空位用 {{N}} 占位，N 对应 blanks 的 id */
  code: string;
  blanks: CodeFillBlank[];
  explanation: string;
}

export interface WaveStep {
  type: 'waveform';
  id: string;
  question: WaveQuestion;
}

export type Step = ConceptStep | McqStep | CodeFillStep | WaveStep;

/* ---------- 课程结构 ---------- */

export interface Lesson {
  id: string;
  title: string;
  /** 课程地图上的一行简介 */
  summary: string;
  steps: Step[];
}

export interface Chapter {
  id: string;
  title: string;
  subtitle: string;
  lessons: Lesson[];
}
