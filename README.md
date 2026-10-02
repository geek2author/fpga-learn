# fpga-learn

**在线玩：https://geek2author.github.io/fpga-learn/**（手机浏览器打开后可「添加到主屏幕」当 App 用；进度存本地 IndexedDB，换设备用 ⚙️ 导出/导入 JSON 迁移）

Duolingo 式 FPGA 碎片化学习应用。当前为 **M3（MVP 完整）**：课程框架 + 进度持久化 + 第一章内容 + 成就徽章 + 错题本（间隔复习）+ 备份导入导出。

产品需求见 [PRD.md](./PRD.md)。推送到 main 分支会自动构建并部署到 GitHub Pages。

## 开发

```bash
npm install
npm run dev      # 本地开发，默认 http://localhost:5173
npm run build    # 类型检查 + 产物构建
npm run preview  # 预览构建产物
```

## 目录

```
src/
  data/types.ts        # 数据模型：章节/小节/步骤（概念卡/选择题/波形题）
  data/course.ts       # 课程内容（第一章 8 个小节）
  lib/waveform.ts      # 波形比对工具
  lib/db.ts            # IndexedDB 进度持久化（idb）
  components/Home.tsx        # 课程地图（解锁/进度/重置）
  components/LessonView.tsx  # 小节学习器（概念卡/选择题步骤）
  components/WaveStepView.tsx # 波形题步骤
  components/WaveEditor.tsx   # 核心：SVG 波形编辑器
  App.tsx              # 页面路由 + 进度状态
```

## 当前功能（M3 · MVP）

- 课程地图：所有小节随时可学（不做线性锁定），「继续」标记最近未完成的小节，进度条可查
- 小节 = 概念卡（要点 + Verilog 代码）→ 选择题（答错重试）→ 波形题（画波形判分）的混合序列
- 中途退出自动记住步骤位置，重进断点续学
- **成就徽章**：8 枚事件驱动徽章（首次通关/首次画对波形/完美通关/错题清零…），达成弹 Toast，徽章墙查收集
- **错题本**：答错自动入本，按遗忘曲线排期复习（10 分钟 → 1 小时 → 1 天 → 3 天 → 7 天 → 毕业），答对拉长间隔、答错重新排队
- **备份迁移**：设置中导出 JSON（复制/下载 .json）、粘贴导入覆盖，换设备不丢进度
- 进度存 IndexedDB，刷新/重开浏览器不丢

## 波形题数据约定

- 每个时钟周期 2 个时间片（低、高），上升沿在奇数片起始边界；
- 触发器输出在上升沿后的时间片更新，取上升沿前一瞬间输入的电平；
- 出题时保证输入不在上升沿边界变化，避免采样歧义；
- 参考答案人工逐边沿核对，后续接 iverilog 离线仿真自动生成与校验。

## 里程碑

- [x] M1 波形编辑器原型（交互手感验证通过）
- [x] M2 课程框架 + 进度存储 + 第一章内容
- [x] M3 成就徽章 + 错题本 + 导出备份（MVP 完整交付）
- [x] M4a 协议章节：第二章 UART + 第三章 SPI（CPOL/CPHA 四模式波形判读）
- [x] M4b 代码填空题型：代码内空位点选候选片段 + 看代码找 bug 的选择题，已铺入四章
- [x] M5 有限状态机（FSM）章节：Moore/Mealy、三段式、状态图↔波形互推
- [ ] 可选：iverilog 离线仿真自动生成/校验波形题答案
