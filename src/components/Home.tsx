import { useState } from 'react';
import { chapters } from '../data/course';
import type { Chapter } from '../data/types';
import type { StoredProgress } from '../lib/progress';
import { bookStats, formatGap } from '../lib/progress';
import { BADGES } from '../lib/badges';
import BadgeWall from './BadgeWall';
import SettingsModal from './SettingsModal';

interface Props {
  progress: StoredProgress;
  onOpen: (lessonId: string) => void;
  onReview: () => void;
  onImport: (p: StoredProgress) => void;
  onReset: () => void;
}

function ChapterBlock({
  chapter,
  progress,
  onOpen,
}: {
  chapter: Chapter;
  progress: StoredProgress;
  onOpen: (lessonId: string) => void;
}) {
  const lessons = chapter.lessons;
  const doneCount = lessons.filter((l) => progress.lessonStatus[l.id]?.completed).length;
  const allDone = doneCount === lessons.length;
  // 不做线性锁定：所有小节随时可学，「继续」只标记本章第一个未完成的小节
  const currentIdx = lessons.findIndex((l) => !progress.lessonStatus[l.id]?.completed);

  return (
    <section className="chapter-block">
      <div className="card chapter-card">
        <div className="qmeta">{chapter.subtitle}</div>
        <h2>{chapter.title}</h2>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${(doneCount / lessons.length) * 100}%` }}
          />
        </div>
        <div className="qmeta">
          {allDone ? `🎉 全部 ${lessons.length} 个小节完成！` : `${doneCount} / ${lessons.length} 个小节`}
        </div>
      </div>

      <div className="lesson-list">
        {lessons.map((l, i) => {
          const st = progress.lessonStatus[l.id];
          const isDone = !!st?.completed;
          const isCurrent = i === currentIdx;
          return (
            <button
              key={l.id}
              className={`lesson-node ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}
              onClick={() => onOpen(l.id)}
            >
              <span className="node-icon">{isDone ? '✓' : i + 1}</span>
              <span className="node-text">
                <span className="node-title">{l.title}</span>
                <span className="node-sub">{isDone ? '已完成 · 点击复习' : l.summary}</span>
              </span>
              {isCurrent && <span className="node-cta">继续 →</span>}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default function Home({ progress, onOpen, onReview, onImport, onReset }: Props) {
  const [modal, setModal] = useState<'none' | 'badges' | 'settings'>('none');
  const badgeCount = BADGES.filter((b) => b.check(progress)).length;
  const book = bookStats(progress);

  return (
    <div className="app">
      <header className="topbar">
        <h1>FPGA 闯关练习</h1>
        <div className="topbar-actions">
          <button className="icon-btn" aria-label="成就徽章" onClick={() => setModal('badges')}>
            🏅<span className="icon-count">{badgeCount}</span>
          </button>
          <button className="icon-btn" aria-label="备份与设置" onClick={() => setModal('settings')}>
            ⚙️
          </button>
        </div>
      </header>

      {book.total > 0 && (
        <section className="card mistake-card">
          <div className="mistake-head">
            <strong>📕 错题本</strong>
            <span className="qmeta">
              共 {book.total} 题 · {book.due > 0 ? `${book.due} 题已到期` : `最早 ${formatGap(book.nextDueAt - Date.now())}后到期`}
            </span>
          </div>
          <button className="btn primary" disabled={book.due === 0} onClick={onReview}>
            {book.due > 0 ? `开始复习（${book.due} 题）` : '暂无到期题目'}
          </button>
        </section>
      )}

      {chapters.map((ch) => (
        <ChapterBlock key={ch.id} chapter={ch} progress={progress} onOpen={onOpen} />
      ))}

      <p className="footer">M4 · 数据仅存本机，可在 ⚙️ 中备份迁移</p>

      {modal === 'badges' && <BadgeWall progress={progress} onClose={() => setModal('none')} />}
      {modal === 'settings' && (
        <SettingsModal
          progress={progress}
          onImport={onImport}
          onReset={onReset}
          onClose={() => setModal('none')}
        />
      )}
    </div>
  );
}
