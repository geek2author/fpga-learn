import { BADGES } from '../lib/badges';
import type { StoredProgress } from '../lib/progress';
import Modal from './Modal';

interface Props {
  progress: StoredProgress;
  onClose: () => void;
}

export default function BadgeWall({ progress, onClose }: Props) {
  const unlockedCount = BADGES.filter((b) => b.check(progress)).length;
  return (
    <Modal title={`成就徽章 ${unlockedCount}/${BADGES.length}`} onClose={onClose}>
      <div className="badge-grid">
        {BADGES.map((b) => {
          const at = progress.badges[b.id];
          const unlocked = !!at || b.check(progress);
          return (
            <div key={b.id} className={`badge-card ${unlocked ? 'on' : ''}`}>
              <div className="badge-icon">{b.icon}</div>
              <div className="badge-name">{b.name}</div>
              <div className="badge-desc">{b.desc}</div>
              <div className="badge-time">
                {unlocked ? (at ? new Date(at).toLocaleDateString('zh-CN') : '已达成') : '未解锁'}
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
