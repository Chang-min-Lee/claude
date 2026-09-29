// 저장소 어댑터. Node 22.5+ 의 내장 SQLite(node:sqlite)를 우선 쓰고, 없으면 JSON 파일로 동작한다.
// 서버는 메모리의 db {users, sessions}를 읽고, 바뀐 사용자/세션만 이 어댑터로 저장한다.
const fs = require('fs');
const path = require('path');

function sqliteStore(dir) {
  const origWarn = process.emitWarning; // 실험 기능 경고 문구 숨김 (동작에는 영향 없음)
  process.emitWarning = (w, ...a) => (String(w?.message || w).includes('SQLite') ? undefined : origWarn.call(process, w, ...a));
  const { DatabaseSync } = require('node:sqlite');
  process.emitWarning = origWarn;
  const file = path.join(dir, 'app.sqlite');
  const sql = new DatabaseSync(file);
  sql.exec(`PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY, body TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions(hash TEXT PRIMARY KEY, user_id TEXT NOT NULL, exp INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);
    CREATE TABLE IF NOT EXISTS kv(k TEXT PRIMARY KEY, v TEXT NOT NULL);`);
  const q = {
    upUser: sql.prepare('INSERT INTO users(id, body) VALUES(?, ?) ON CONFLICT(id) DO UPDATE SET body=excluded.body'),
    delUser: sql.prepare('DELETE FROM users WHERE id=?'), delUserSessions: sql.prepare('DELETE FROM sessions WHERE user_id=?'),
    upSess: sql.prepare('INSERT OR REPLACE INTO sessions(hash, user_id, exp) VALUES(?, ?, ?)'), delSess: sql.prepare('DELETE FROM sessions WHERE hash=?'),
    purge: sql.prepare('DELETE FROM sessions WHERE exp < ?'),
    upKv: sql.prepare('INSERT INTO kv(k, v) VALUES(?, ?) ON CONFLICT(k) DO UPDATE SET v=excluded.v'),
  };
  const store = {
    kind: 'sqlite', file,
    load() {
      const db = { users: {}, sessions: {}, kv: {} };
      for (const r of sql.prepare('SELECT k, v FROM kv').all()) { try { db.kv[r.k] = JSON.parse(r.v); } catch {} }
      for (const r of sql.prepare('SELECT id, body FROM users').all()) db.users[r.id] = JSON.parse(r.body);
      for (const r of sql.prepare('SELECT hash, user_id, exp FROM sessions').all()) db.sessions[r.hash] = { userId: r.user_id, exp: r.exp };
      if (!Object.keys(db.users).length) { // 기존 JSON 파일이 있으면 한 번 옮긴다
        const j = path.join(dir, 'db.json');
        try {
          const old = JSON.parse(fs.readFileSync(j, 'utf8'));
          sql.exec('BEGIN');
          for (const u of Object.values(old.users || {})) q.upUser.run(u.id, JSON.stringify(u));
          for (const [h, s] of Object.entries(old.sessions || {})) q.upSess.run(h, s.userId, s.exp);
          sql.exec('COMMIT');
          fs.renameSync(j, j + '.migrated');
          console.log(`db.json → SQLite 이전 완료 (사용자 ${Object.keys(old.users || {}).length}명). 원본은 db.json.migrated 로 보관했어요.`);
          return this.load();
        } catch (e) { if (e.code !== 'ENOENT') { try { sql.exec('ROLLBACK'); } catch {} console.error('db.json 이전 실패:', e.message); } }
      }
      return db;
    },
    saveUser: (u) => q.upUser.run(u.id, JSON.stringify(u)),
    saveKv: (k, v) => q.upKv.run(k, JSON.stringify(v)),
    removeUser(id) { q.delUserSessions.run(id); q.delUser.run(id); },
    saveSession: (hash, s) => q.upSess.run(hash, s.userId, s.exp),
    removeSession: (hash) => q.delSess.run(hash),
    removeSessionsOf: (userId) => q.delUserSessions.run(userId),
    purgeSessions: (now) => q.purge.run(now),
    backup(dest) { fs.mkdirSync(path.dirname(dest), { recursive: true }); if (fs.existsSync(dest)) fs.rmSync(dest); sql.prepare('VACUUM INTO ?').run(dest); return dest; },
    close() { try { sql.close(); } catch {} },
  };
  return store;
}

function jsonStore(dir) {
  const file = path.join(dir, 'db.json');
  let db = { users: {}, sessions: {}, kv: {} };
  const write = () => { const tmp = file + '.tmp'; fs.writeFileSync(tmp, JSON.stringify(db)); fs.renameSync(tmp, file); };
  return {
    kind: 'json', file,
    load() { try { db = JSON.parse(fs.readFileSync(file, 'utf8')); } catch {} db.kv = db.kv || {}; return db; },
    saveKv: write,
    saveUser: write, removeUser: write, saveSession: write, removeSession: write, removeSessionsOf: write, purgeSessions: write,
    backup(dest) { fs.mkdirSync(path.dirname(dest), { recursive: true }); fs.copyFileSync(file, dest); return dest; },
    close() {},
  };
}

function openStore(dir) {
  fs.mkdirSync(dir, { recursive: true });
  if (process.env.STORAGE !== 'json') { try { return sqliteStore(dir); } catch (e) { console.warn('SQLite를 쓸 수 없어 JSON 파일 저장으로 동작해요:', e.message); } }
  return jsonStore(dir);
}
module.exports = { openStore };
