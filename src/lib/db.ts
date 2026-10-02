import { openDB, type IDBPDatabase } from 'idb';
import { defaultProgress, normalizeProgress, type StoredProgress } from './progress';

const DB_NAME = 'fpga-learn';
const DB_VERSION = 1;
const STORE = 'progress';
const KEY = 'main';

let dbPromise: Promise<IDBPDatabase> | null = null;

function db() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(d) {
        d.createObjectStore(STORE);
      },
    });
  }
  return dbPromise;
}

export async function loadProgress(): Promise<StoredProgress> {
  try {
    const d = await db();
    const rec = (await d.get(STORE, KEY)) as unknown;
    return normalizeProgress(rec);
  } catch {
    // 隐私模式等场景下载入失败：从零开始，不影响学习
  }
  return defaultProgress();
}

export async function saveProgress(p: StoredProgress): Promise<void> {
  try {
    const d = await db();
    await d.put(STORE, p, KEY);
  } catch {
    // 写失败时静默：学习流程不中断
  }
}
