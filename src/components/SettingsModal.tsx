import { useEffect, useState } from 'react';
import { normalizeProgress, type StoredProgress } from '../lib/progress';
import Modal from './Modal';

interface Props {
  progress: StoredProgress;
  /** 导入成功后用备份内容整体替换进度 */
  onImport: (p: StoredProgress) => void;
  onReset: () => void;
  onClose: () => void;
}

export default function SettingsModal({ progress, onImport, onReset, onClose }: Props) {
  const [exportJson, setExportJson] = useState('');
  const [importText, setImportText] = useState('');
  const [status, setStatus] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null);

  useEffect(() => {
    setExportJson(JSON.stringify({ ...progress, exportedAt: new Date().toISOString() }));
  }, [progress]);

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(exportJson);
      setStatus({ kind: 'ok', msg: '已复制到剪贴板' });
    } catch {
      setStatus({ kind: 'err', msg: '复制失败，请手动全选文本框复制' });
    }
  };

  const downloadJson = () => {
    try {
      const blob = new Blob([exportJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fpga-learn-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus({ kind: 'ok', msg: '已开始下载备份文件' });
    } catch {
      setStatus({ kind: 'err', msg: '下载失败，请用「复制」保存' });
    }
  };

  const doImport = () => {
    try {
      const parsed = normalizeProgress(JSON.parse(importText));
      if (!Object.keys(parsed.lessonStatus).length && !Object.keys(parsed.attempts).length) {
        setStatus({ kind: 'err', msg: '备份内容为空或格式不对，请检查粘贴内容' });
        return;
      }
      onImport(parsed);
      setStatus({ kind: 'ok', msg: '导入成功，进度已恢复' });
      setImportText('');
    } catch {
      setStatus({ kind: 'err', msg: 'JSON 解析失败，请检查粘贴内容' });
    }
  };

  const [armReset, setArmReset] = useState(false);
  const doReset = () => {
    if (armReset) {
      onReset();
      setStatus({ kind: 'ok', msg: '进度已清空' });
      setArmReset(false);
    } else {
      setArmReset(true);
      setTimeout(() => setArmReset(false), 3000);
    }
  };

  return (
    <Modal title="备份与设置" onClose={onClose}>
      <h4>导出备份</h4>
      <p className="settings-hint">把下面的 JSON 复制/下载保存好，换设备或清浏览器数据前先备份。</p>
      <textarea id="export-textarea" className="json-box" readOnly value={exportJson} />
      <div className="btn-row">
        <button className="btn small" onClick={copyJson}>
          复制 JSON
        </button>
        <button className="btn small" onClick={downloadJson}>
          下载 .json
        </button>
      </div>

      <h4>导入备份</h4>
      <p className="settings-hint">粘贴备份 JSON 后导入，将完全覆盖当前进度。</p>
      <textarea
        id="import-textarea"
        className="json-box"
        placeholder='{"version":2,"lessonStatus":{...}}'
        value={importText}
        onChange={(e) => setImportText(e.target.value)}
      />
      <div className="btn-row">
        <button className="btn small" disabled={!importText.trim()} onClick={doImport}>
          导入并覆盖
        </button>
      </div>

      {status && <p className={status.kind === 'ok' ? 'status-ok' : 'status-err'}>{status.msg}</p>}

      <h4>危险操作</h4>
      <div className="btn-row">
        <button className="btn small danger" onClick={doReset}>
          {armReset ? '再点一次确认清空' : '清空全部进度'}
        </button>
      </div>
    </Modal>
  );
}
