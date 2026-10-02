import { useEffect } from 'react';
import { badgeById } from '../lib/badges';

interface Props {
  /** 待展示的徽章 id 队列 */
  toastIds: string[];
  onDismiss: (id: string) => void;
}

export default function Toast({ toastIds, onDismiss }: Props) {
  if (!toastIds.length) return null;
  return (
    <div className="toast-stack">
      {toastIds.map((id) => (
        <ToastItem key={id} badgeId={id} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ badgeId, onDismiss }: { badgeId: string; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(badgeId), 3500);
    return () => clearTimeout(t);
  }, [badgeId, onDismiss]);

  const badge = badgeById(badgeId);
  if (!badge) return null;
  return (
    <div className="toast" role="status">
      <span className="toast-icon">{badge.icon}</span>
      <span>
        <strong>成就达成：{badge.name}</strong>
        <small>{badge.desc}</small>
      </span>
    </div>
  );
}
