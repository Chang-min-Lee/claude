// 의존성 없는 Node 서버: 정적 파일 제공 + Claude API 프록시(API 키를 브라우저에 노출하지 않음)
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-5-5';
const PUBLIC = path.join(__dirname, 'public');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };

const STYLE = {
  elementary: '초등학생에게 말하듯 쉬운 낱말과 짧은 문장으로, 친근하고 칭찬을 많이 하며 이모지를 조금 사용하세요.',
  middle: '중학생 눈높이로 친근하게, 구체적인 예시를 들어 설명하세요.',
  high: '고등학생에게 입시·전공 선택·진로 준비를 현실적으로 안내하세요.',
  college: '대학생에게 전공 활용, 인턴·자격증·포트폴리오 등 취업 준비를 구체적으로 안내하세요.',
  adult: '성인 학습자/직장인에게 커리어 전환, 재교육, 자기계발을 존중하는 어조로 실용적으로 안내하세요.',
};

function systemPrompt({ name, group, riasec, tasks } = {}) {
  return [
    '당신은 진로탐색과 학습관리를 돕는 AI 코치입니다. 한국어로 답합니다.',
    STYLE[group] || STYLE.adult,
    name ? `사용자 이름: ${name}` : '',
    riasec ? `진로 흥미검사(RIASEC) 상위 유형: ${riasec}` : '',
    tasks ? `현재 학습 목표/할 일: ${tasks}` : '',
    '원칙: 정답을 강요하지 말고 질문을 통해 스스로 탐색하도록 돕고, 다음에 할 수 있는 작은 행동 1~3가지를 제안하세요.',
    '의학·법률·재정 등 전문 영역은 단정하지 말고 전문가 상담을 권하세요. 답변은 간결하게(최대 10문장 안팎).',
  ].filter(Boolean).join('\n');
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => { data += c; if (data.length > 1e6) { req.destroy(); reject(new Error('too large')); } });
    req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch (e) { reject(e); } });
  });
}

async function handleChat(req, res) {
  const send = (code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(obj)); };
  let body;
  try { body = await readBody(req); } catch { return send(400, { error: '잘못된 요청입니다.' }); }
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return send(200, { reply: 'AI 코치를 쓰려면 서버에 ANTHROPIC_API_KEY 환경변수를 설정해 주세요. (진로검사·학습관리는 키 없이도 사용할 수 있어요.)' });
  const messages = (body.messages || []).slice(-20).map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content).slice(0, 4000) }));
  if (!messages.length || messages[0].role !== 'user') return send(400, { error: '메시지가 필요합니다.' });
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: MODEL, max_tokens: 1024, system: systemPrompt(body.profile), messages }),
    });
    const j = await r.json();
    if (!r.ok) return send(502, { error: j.error?.message || 'AI 호출 실패' });
    send(200, { reply: j.content.map((c) => c.text || '').join('') });
  } catch (e) { send(502, { error: 'AI 서버에 연결하지 못했습니다.' }); }
}

http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api/chat') return handleChat(req, res);
  const rel = req.url.split('?')[0] === '/' ? 'index.html' : decodeURIComponent(req.url.split('?')[0]);
  const file = path.normalize(path.join(PUBLIC, rel));
  if (!file.startsWith(PUBLIC)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    res.end(buf);
  });
}).listen(PORT, () => console.log(`http://localhost:${PORT}`));
