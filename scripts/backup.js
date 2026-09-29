#!/usr/bin/env node
// 데이터 백업: SQLite면 일관된 스냅샷(VACUUM INTO), JSON이면 파일 복사. 서버가 켜져 있어도 실행할 수 있다.
// 사용: npm run backup [-- 저장경로]   (기본: $DATA_DIR/backups/, 최근 BACKUP_KEEP 개(기본 14)만 남김)
const fs = require('fs');
const path = require('path');
const { openStore } = require('../lib/store');

const dir = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const store = openStore(dir);
store.load();
const d = new Date(), pad = (n) => String(n).padStart(2, '0');
const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
const ext = store.kind === 'sqlite' ? 'sqlite' : 'json';
const dest = process.argv[2] || path.join(dir, 'backups', `app-${stamp}.${ext}`);
store.backup(dest);
console.log(`백업 완료: ${dest}`);
if (!process.argv[2]) { // 오래된 백업 정리
  const keep = parseInt(process.env.BACKUP_KEEP || '14', 10), bdir = path.join(dir, 'backups');
  const files = fs.readdirSync(bdir).filter((f) => f.startsWith('app-')).sort();
  files.slice(0, Math.max(0, files.length - keep)).forEach((f) => fs.rmSync(path.join(bdir, f)));
}
store.close();
