// 미리보기 전용 데모: 서버 없이 강사·관리자·보호자 화면을 샘플 데이터로 체험한다. (실제 서버 API와 같은 모양의 응답을 메모리에서 만든다)
const DEMO_CATS = { holland: 'RIASEC'.split(''), bigfive: 'OCEAN'.split(''), workvalues: ['growth', 'stability', 'reward', 'autonomy', 'recognition', 'fun'], aptitude: ['lang', 'math', 'spatial', 'social', 'logic', 'creative'], sdl: ['plan', 'monitor', 'goal', 'persist'], wellbeing: ['stable', 'energy', 'relation', 'stress'] };
const dAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return dk(d); };
const dAhead = (n) => dAgo(-n);
const demoRes = (id, vals, v = []) => { const cat = {}; DEMO_CATS[id].forEach((k, i) => { cat[k] = vals[i]; }); return { date: dAgo(6), cat, overall: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10, v }; };
const demoLog = (mins) => Object.fromEntries(mins.map((m, i) => [dAgo(i), m]).filter(([, m]) => m > 0));
const blk = (day, start, end, label, color) => ({ day, start, end, label, color });
const COLS = ['#BE185D', '#0E7490', '#4338CA', '#B45309', '#15803D', '#6D28D9'];

const L = (ko, vi) => (lang === 'vi' ? vi : ko);
function demoInit() {
  const mk = (id, name, group, teacherId, extra) => ({ id, name, email: extra.email ?? null, role: 'learner', shareCode: extra.code, teacherId, data: extra.data });
  const students = {
    mai: mk('mai', 'Nguyễn Thị Mai', 'high', 't_kim', { code: 'MAI12345', data: {
      messages: [{ id: 'm1', at: dAgo(2) + 'T18:20:00Z', from: 'learner', name: 'Nguyễn Thị Mai', text: L('선생님, 쓰기 첨삭은 언제 받을 수 있나요?', 'Cô ơi, khi nào em nhận được bài chấm viết ạ?') }, { id: 'm2', at: dAgo(2) + 'T19:05:00Z', from: 'staff', name: L('김하리 강사', 'Cô Kim Hari'), text: L('내일 수업 전에 보내 줄게요. 듣기 15분도 잊지 마세요!', 'Ngày mai trước giờ học cô sẽ gửi. Đừng quên nghe 15 phút nhé!') }],
      counsel: [{ id: 'c1', date: dAgo(7), at: dAgo(7) + 'T10:00:00Z', by: L('김하리 강사', 'Cô Kim Hari'), byId: 't_kim', text: L('초기 상담: 유학 동기가 분명함. 듣기·말하기 보강 필요, 주 3회 어휘 점검 합의.', 'Tư vấn ban đầu: động lực du học rõ ràng. Cần bổ sung nghe–nói, thống nhất kiểm tra từ vựng 3 lần/tuần.') }],
      profile: { name: 'Nguyễn Thị Mai', group: 'high', services: { study: true, career: true }, school: L('고2','Lớp 11'), note: L('한국 대학 진학 희망','Muốn học đại học ở Hàn Quốc'), teacherNote: L('어휘 암기를 꾸준히 하고 있어요. 듣기 보강이 필요합니다.','Học từ vựng đều đặn. Cần bổ sung phần nghe.') },
      goal: { type: 'abroad', label: 'TOPIK 4', date: dAhead(42), note: L('10월 정기시험','Kỳ thi định kỳ tháng 10'), milestones: [{ text: L('모의고사 1회','Thi thử lần 1'), date: dAhead(14), done: true }, { text: L('쓰기 첨삭 3회','Chấm bài viết 3 lần'), date: dAhead(28), done: false }] },
      consent: { wellbeing: true },
      deep: { holland: [demoRes('holland', [2.4, 3.9, 3.1, 4.2, 3.5, 2.8])], bigfive: [demoRes('bigfive', [4, 4.2, 3.4, 4.1, 3.6])], workvalues: [demoRes('workvalues', [4.4, 3.2, 3.5, 3.8, 3.1, 3.9])], aptitude: [demoRes('aptitude', [4.5, 3.5, 3.5, 5, 4, 2])], sdl: [demoRes('sdl', [3.8, 3.4, 4.2, 4.0])], wellbeing: [demoRes('wellbeing', [4, 3.8, 4.2, 3.6])] },
      log: demoLog([50, 40, 60, 0, 45, 30, 55, 20, 40]), checkins: [0, 1, 2, 4, 5].map((n) => ({ date: dAgo(n), time: '18:30' })),
      tasks: [{ text: L('단어 30개 암기','Học 30 từ vựng'), done: true }, { text: L('듣기 15분','Nghe 15 phút'), done: true }, { text: L('쓰기 일기 1편','Viết nhật ký 1 bài'), done: false }, { text: L('문법 5과 복습','Ôn ngữ pháp bài 5'), done: false }],
      schedule: [blk(0, 19, 20, L('어휘','Từ vựng'), COLS[0]), blk(1, 19, 21, L('듣기·말하기','Nghe · nói'), COLS[1]), blk(2, 19, 20, L('문법','Ngữ pháp'), COLS[2]), blk(3, 20, 21, L('쓰기·일기','Viết · nhật ký'), COLS[3]), blk(5, 10, 12, L('모의고사','Thi thử'), COLS[4])],
      weekplan: [{ subject: L('어휘','Từ vựng'), kind: 'self', detail: L('매일 30개','Mỗi ngày 30 từ'), days: ['green', 'green', 'green', 'yellow', '', '', ''] }, { subject: L('듣기','Nghe'), kind: 'self', detail: L('뉴스 15분','Tin tức 15 phút'), days: ['green', 'red', 'green', '', '', '', ''] }],
      grades: [{ subject: L('국어','Ngữ văn'), score: '72', date: dAgo(60), note: '' }, { subject: L('국어','Ngữ văn'), score: '80', date: dAgo(30), note: '' }, { subject: L('수학','Toán'), score: '65', date: dAgo(60), note: '' }, { subject: L('수학','Toán'), score: '78', date: dAgo(30), note: '' }, { subject: L('TOPIK 모의','TOPIK thi thử'), score: '112/200', date: dAgo(20), note: L('3급 후반','Cuối cấp 3') }],
    } }),
    nam: mk('nam', 'Trần Văn Nam', 'middle', 't_kim', { code: 'NAM12345', data: {
      messages: [{ id: 'm3', at: dAgo(1) + 'T21:40:00Z', from: 'learner', name: 'Trần Văn Nam', text: L('수학 오답노트를 어떻게 정리해야 할지 모르겠어요.', 'Em không biết cách sắp xếp sổ chép lỗi sai môn Toán ạ.') }],
      profile: { name: 'Trần Văn Nam', group: 'middle', services: { study: true, career: true }, school: L('중3','Lớp 9'), note: '', teacherNote: '' },
      goal: { type: 'school', label: L('기말고사','Thi cuối kỳ'), date: dAhead(9), note: '', milestones: [] }, consent: { wellbeing: true },
      deep: { sdl: [demoRes('sdl', [2.4, 2.6, 2.8, 2.1])], wellbeing: [demoRes('wellbeing', [2.2, 2.4, 3, 2])], bigfive: [demoRes('bigfive', [3, 2.6, 2.4, 3.2, 2.5])] },
      log: demoLog([0, 0, 0, 0, 0, 25, 30]), checkins: [{ date: dAgo(6), time: '17:40' }],
      tasks: [{ text: L('수학 오답노트','Sổ chép lỗi sai môn Toán'), done: false }, { text: L('영어 단어','Từ vựng tiếng Anh'), done: false }], schedule: [blk(1, 19, 20, L('수학','Toán'), COLS[0])], weekplan: [{ subject: L('수학','Toán'), kind: 'school', detail: L('문제집 20쪽','Sách bài tập trang 20'), days: ['red', 'red', '', '', '', '', ''] }],
      grades: [{ subject: L('수학','Toán'), score: '70', date: dAgo(40), note: '' }, { subject: L('수학','Toán'), score: '62', date: dAgo(10), note: L('중간고사','Thi giữa kỳ') }],
    } }),
    huong: mk('huong', 'Lê Thị Hương', 'adult', 't_park', { code: 'HUO12345', data: {
      profile: { name: 'Lê Thị Hương', group: 'adult', services: { study: true, career: true }, school: '', note: L('직무 전환 준비','Chuẩn bị chuyển nghề'), teacherNote: '' },
      goal: { type: 'career', label: L('마케팅 직무 전환','Chuyển sang ngành marketing'), date: dAhead(120), note: '', milestones: [{ text: L('포트폴리오 초안','Bản nháp hồ sơ năng lực'), date: dAhead(40), done: false }] }, consent: { wellbeing: false },
      deep: { holland: [demoRes('holland', [2.2, 3, 4.3, 3.6, 4.4, 2.6])], workvalues: [demoRes('workvalues', [4.6, 2.8, 3.9, 4.4, 3.8, 4.1])], bigfive: [demoRes('bigfive', [4.3, 3.8, 4.4, 3.7, 3.5], ['same'])] },
      log: demoLog([40, 45, 30, 50, 0, 35, 40]), checkins: [0, 1, 3].map((n) => ({ date: dAgo(n), time: '21:10' })),
      tasks: [{ text: L('온라인 강의 3강','Học 3 bài giảng online'), done: true }, { text: L('자기소개서 초안','Bản nháp thư xin việc'), done: false }], schedule: [blk(0, 21, 22, L('강의','Bài giảng'), COLS[1]), blk(2, 21, 22, L('강의','Bài giảng'), COLS[1]), blk(5, 14, 16, L('포트폴리오','Hồ sơ năng lực'), COLS[5])],
      weekplan: [{ subject: L('강의','Bài giảng'), kind: 'self', detail: L('주 3회','3 buổi/tuần'), days: ['green', '', 'green', '', '', '', ''] }], grades: [],
    } }),
  };
  const staff = [{ id: 't_admin', name: L('관리자(마스터)','Quản trị viên'), email: 'admin@demo.kr', role: 'admin' }, { id: 't_kim', name: L('김하리 강사','Cô Kim Hari'), email: 'kim@demo.kr', role: 'teacher' }, { id: 't_park', name: L('박선영 강사','Cô Park Seon-young'), email: 'park@demo.kr', role: 'teacher' }];
  // 반·출결·상담 세션·커리어 샘플
  const attP = (pat) => Object.fromEntries(pat.map((v, i) => [dAgo(i + 1), v]).filter(([, v]) => v));
  Object.assign(students.mai.data.profile, { className: L('고2 TOPIK반', 'Lớp TOPIK 11'), parentName: L('어머니', 'Mẹ'), status: 'active', nextSession: dAhead(3) });
  students.mai.data.attendance = attP(['p', 'p', 'l', 'p', 'p', '', '', 'p', 'p', 'a', 'p', 'p', '', '', 'p']);
  students.mai.data.intake = { concern: L('한국 대학 진학 준비가 막막함', 'Băn khoăn về việc chuẩn bị vào đại học Hàn Quốc'), goal: 'TOPIK 4', strengths: L('꾸준함, 어휘 암기', 'Kiên trì, học từ vựng tốt'), interests: '', habits: '', background: '' };
  Object.assign(students.nam.data.profile, { orgType: 'studycafe', seat: 'B-07', passType: L('월 정기권', 'Gói tháng'), passEnd: dAhead(5) });
  students.nam.data.visits = [{ date: dk(), in: '15:10', out: '' }];
  Object.assign(students.nam.data.profile, { className: L('중3 수학반', 'Lớp Toán 9'), status: 'active' });
  students.nam.data.attendance = attP(['p', 'a', 'a', 'p', 'l', '', '', 'p', 'a', 'p']);
  Object.assign(students.huong.data.profile, { className: '', status: 'active' });
  students.huong.data.career = { job: L('영업 사무', 'Nhân viên kinh doanh'), industry: L('제조업', 'Sản xuất'), years: 5, target: L('디지털 마케터', 'Chuyên viên marketing số'), targetIndustry: 'IT', skills: [L('고객 응대', 'Chăm sóc khách hàng'), 'Excel'], motive: L('성장 정체', 'Không còn cơ hội phát triển'), constraints: L('퇴근 후 학습 가능', 'Chỉ học được sau giờ làm') };
  students.huong.data.jobs = [{ company: 'ABC Media', role: 'Marketing Executive', status: 'interview', date: dAgo(2), note: '' }, { company: 'XYZ Digital', role: 'Content Marketer', status: 'applied', date: dAgo(5), note: '' }];
  return { students, staff };
}
let demo = demoInit();
const demoReset = () => { demo = demoInit(); }; // 언어를 바꾸면 샘플 데이터도 그 언어로 다시 만든다
const demoTeacher = (sid) => demo.staff.find((s) => s.id === demo.students[sid]?.teacherId);
const demoRole = () => state.user?.role;
const demoVisible = () => { // 역할별로 볼 수 있는 학생
  const r = demoRole(), me = state.user?.id;
  if (r === 'admin') return Object.values(demo.students);
  if (r === 'teacher') return Object.values(demo.students).filter((s) => s.teacherId === me);
  if (r === 'guardian') return Object.values(demo.students).filter((s) => (demo.guardianLinks || ['mai']).includes(s.id));
  return [];
};
function demoSummary(s) { // 서버 summarize 와 같은 규칙
  const d = s.data, log = d.log || {}, td = today();
  const week = [...Array(7)].map((_, i) => { const x = new Date(); x.setDate(x.getDate() - (6 - i)); return log[dk(x)] || 0; });
  const cur = new Date(); if (!log[dk(cur)]) cur.setDate(cur.getDate() - 1); let streak = 0; while (log[dk(cur)]) { streak++; cur.setDate(cur.getDate() - 1); }
  const tasks = d.tasks || [], deep = {};
  ['holland', 'bigfive', 'workvalues', 'aptitude', 'sdl'].forEach((id) => { if (d.deep?.[id]?.length) deep[id] = d.deep[id].at(-1); });
  const lastLog = Object.keys(log).filter((k) => log[k] > 0).sort().at(-1) || '', lastCi = (d.checkins || []).map((c) => c.date).sort().at(-1) || '', last = [lastLog, lastCi].sort().at(-1) || '';
  const m = new Date(); m.setDate(m.getDate() - ((m.getDay() + 6) % 7));
  const dday = d.goal?.date ? Math.round((new Date(d.goal.date + 'T00:00:00') - new Date(td + 'T00:00:00')) / 86400000) : null;
  const sd = d.deep?.sdl?.at(-1)?.overall, wb = d.deep?.wellbeing?.at(-1);
  const idle = !last || Math.round((new Date(td) - new Date(last)) / 86400000) >= 3;
  const validity = Object.values(deep).some((r) => r.v?.length);
  const wellbeing = !!(isStaffRole() && d.consent?.wellbeing && wb && wb.overall < 3);
  const t = demoTeacher(s.id);
  return { id: s.id, name: s.name, managed: !s.email, group: d.profile?.group || null, streak, week, today: week[6], openTasks: tasks.filter((x) => !x.done).map((x) => x.text).slice(0, 5), doneCount: tasks.filter((x) => x.done).length, openCount: tasks.filter((x) => !x.done).length, riasec: [], quiz: [], deep,
    teacher: t ? { id: t.id, name: t.name } : null, awaiting: isStaffRole() && d.messages?.at(-1)?.from === 'learner', lastActive: last, checkinsWeek: (d.checkins || []).filter((c) => c.date >= dk(m)).length, goal: { type: d.goal?.type || 'general', label: d.goal?.label || '', dday },
    intensity: sd === undefined ? null : sd >= 3.8 ? 'loose' : sd >= 3.0 ? 'normal' : 'tight', flags: { idle, validity, wellbeing, ddaySoon: dday !== null && dday >= 0 && dday <= 14, lowAtt: (() => { const v = Object.values(d.attendance || {}); return v.length >= 4 && v.filter((x) => x === 'p' || x === 'l').length / v.length < 0.7; })() }, snoozed: (d.profile?.snoozeUntil || '') >= dk(), idleDays: last ? Math.round((new Date(dk()) - new Date(last)) / 86400000) : null, validityTests: Object.entries(deep).filter(([, r]) => r.v?.length).map(([id]) => id),
    status: (d.profile?.snoozeUntil || '') >= dk() ? 'ok' : (idle || validity || wellbeing || (() => { const v = Object.values(d.attendance || {}); return v.length >= 4 && v.filter((x) => x === 'p' || x === 'l').length / v.length < 0.7; })()) ? 'watch' : 'ok',
    orgType: d.profile?.orgType || '', className: d.profile?.className || '', enroll: d.profile?.status || 'active', nextSession: d.profile?.nextSession || '', ...(() => { const att = d.attendance || {}, ks = Object.keys(att), v30 = ks.map((k) => att[k]); return { att, attRate: v30.length ? Math.round(100 * v30.filter((x) => x === 'p' || x === 'l').length / v30.length) : null }; })(),
    inNow: (d.visits || []).some((v) => !v.out), seat: d.profile?.seat || '', passType: d.profile?.passType || '', passEnd: d.profile?.passEnd || '', todayMin: (d.log || {})[dk()] || 0 };
}
const isStaffRole = () => ['teacher', 'admin'].includes(demoRole());
const demoErr = (m) => { throw new Error(m); };

function demoApi(path, { method = 'GET', body } = {}) {
  const [p] = path.split('?'); let m;
  if (p === '/api/dashboard') { const out = { learners: demoVisible().map(demoSummary) }; if (demoRole() === 'admin') out.teachers = demo.staff.filter((s) => s.role === 'teacher').map((s) => ({ id: s.id, name: s.name })); return out; }
  if ((m = p.match(/^\/api\/students\/([\w-]+)$/)) && method === 'GET') {
    const s = demo.students[m[1]]; if (!s || !demoVisible().includes(s)) demoErr(t('req_failed'));
    const d = JSON.parse(JSON.stringify(s.data)); delete d.chat;
    if (!isStaffRole()) { delete d.messages; delete d.counsel; }
    if (!(isStaffRole() && d.consent?.wellbeing) && d.deep) delete d.deep.wellbeing; // 정서웰빙: 동의한 경우에만 강사에게, 보호자에게는 항상 숨김
    const tt = demoTeacher(s.id);
    return { user: { id: s.id, name: s.name, managed: !s.email, shareCode: isStaffRole() ? s.shareCode : undefined }, data: d, teacher: tt ? { id: tt.id, name: tt.name } : null, canWrite: isStaffRole() };
  }
  if ((m = p.match(/^\/api\/students\/([\w-]+)\/data$/)) && method === 'PUT') {
    const s = demo.students[m[1]]; if (!s || !isStaffRole()) demoErr(t('req_failed'));
    const keep = s.data.consent?.wellbeing ? null : s.data.deep?.wellbeing; Object.assign(s.data, JSON.parse(JSON.stringify(body.data)));
    if (keep && s.data.deep) s.data.deep.wellbeing = keep; if (body.data.profile?.name) s.name = body.data.profile.name; return { ok: true };
  }
  if ((m = p.match(/^\/api\/students\/([\w-]+)\/messages$/)) && method === 'POST') {
    const s = demo.students[m[1]]; if (!s || !isStaffRole()) demoErr(t('req_failed'));
    s.data.messages = [...(s.data.messages || []), { id: 'm' + Math.random().toString(36).slice(2, 8), at: new Date().toISOString(), from: 'staff', name: state.user.name, text: String(body.text).slice(0, 500) }]; return { messages: s.data.messages };
  }
  if ((m = p.match(/^\/api\/students\/([\w-]+)\/counsel(?:\/([\w-]+))?$/))) {
    const s = demo.students[m[1]]; if (!s || !isStaffRole()) demoErr(t('req_failed'));
    if (method === 'POST') s.data.counsel = [...(s.data.counsel || []), { id: 'c' + Math.random().toString(36).slice(2, 8), date: body.date || today(), at: new Date().toISOString(), by: state.user.name, byId: state.user.id, topic: String(body.topic || '').slice(0, 60), next: body.next || '', actions: (body.actions || []).slice(0, 5), text: String(body.text).slice(0, 1000) }];
    if (method === 'DELETE') s.data.counsel = (s.data.counsel || []).filter((x) => x.id !== m[2]);
    return { counsel: s.data.counsel };
  }
  if (p === '/api/students' && method === 'POST') {
    const id = 'n' + Math.random().toString(36).slice(2, 8), code = Math.random().toString(16).slice(2, 10).toUpperCase();
    const tid = demoRole() === 'teacher' ? state.user.id : body.teacherId || null;
    demo.students[id] = { id, name: body.name, email: null, role: 'learner', shareCode: code, teacherId: tid, data: { profile: { name: body.name, group: body.group || 'high', services: body.services || { study: true, career: true }, school: body.school || '', note: body.note || '', teacherNote: '', orgType: body.orgType || '' }, goal: { type: body.goalType || 'general', label: body.goalLabel || '', date: body.goalDate || '', note: '', milestones: [] }, consent: { wellbeing: true } } };
    return { id, shareCode: code };
  }
  if ((m = p.match(/^\/api\/students\/([\w-]+)$/)) && method === 'DELETE') { delete demo.students[m[1]]; return { ok: true }; }
  if (p === '/api/attendance' && method === 'POST') { let n = 0; for (const [id, st] of Object.entries(body.marks || {})) { const x = demo.students[id]; if (!x) continue; x.data.attendance = { ...(x.data.attendance || {}) }; if (st) x.data.attendance[body.date] = st; else delete x.data.attendance[body.date]; n++; } return { saved: n, skipped: 0 }; }
  if (p === '/api/visits' && method === 'POST') { let n = 0; for (const [id, st] of Object.entries(body.marks || {})) { const x = demo.students[id]; if (!x) continue; const v = [...(x.data.visits || [])], o = v.findLastIndex((y) => !y.out); if (st === 'in' && o < 0) v.push({ date: body.date, in: body.time, out: '' }); else if (st === 'out' && o >= 0) { v[o].out = body.time; const m = (+body.time.slice(0, 2) * 60 + +body.time.slice(3)) - (+v[o].in.slice(0, 2) * 60 + +v[o].in.slice(3)); if (m > 0) x.data.log = { ...(x.data.log || {}), [body.date]: ((x.data.log || {})[body.date] || 0) + m }; } else continue; x.data.visits = v; n++; } return { saved: n, skipped: 0 }; }
  if (p === '/api/analytics/export') return { rows: [] };
  if (p === '/api/analytics' && method === 'GET') {
    const L2 = Object.values(demo.students), tests = {};
    Object.keys(DEMO_CATS).filter((id) => id !== 'wellbeing').forEach((id) => { const r = L2.map((x) => x.data.deep?.[id]?.at(-1)).filter(Boolean); tests[id] = { n: r.length, invalid: 0, retake: 0, avg: r.length ? Math.round(r.reduce((a, b) => a + b.overall, 0) / r.length * 10) / 10 : null, cats: {} }; });
    return { n: L2.length, groups: { high: 1, middle: 1, adult: 1 }, orgTypes: {}, classes: {}, enroll: {}, tests, complete: 1, withGoal: 3, withGrades: 2, withSessions: 1, sessions: 1, withDiag: 0, retest: 0, activeWeek: 3, attMarks: 25, research: 0 };
  }
  if ((m = p.match(/^\/api\/students\/([\w-]+)\/snooze$/)) && method === 'POST') { const x = demo.students[m[1]]; const u = new Date(); u.setDate(u.getDate() + (body.days || 3)); x.data.profile.snoozeUntil = dk(u); return { snoozeUntil: x.data.profile.snoozeUntil }; }
  if (p === '/api/settings') { if (method === 'PUT') demo.org = { orgName: body.orgName || '', orgPhone: body.orgPhone || '', orgEmail: body.orgEmail || '', beta: true }; return demo.org || { orgName: '스마트에듀 학습관리시스템', orgPhone: '', orgEmail: '', beta: true }; }
  if (p === '/api/feedback') { demo.fb = demo.fb || []; if (method === 'POST') { demo.fb.unshift({ id: 'f' + demo.fb.length, at: new Date().toISOString(), kind: body.kind, text: body.text, where: body.where, who: state.user ? state.user.name : '', done: false }); return { ok: true }; } return { feedback: demo.fb }; }
  if (p === '/api/link' && method === 'POST') { const s = Object.values(demo.students).find((x) => x.shareCode === String(body.code).toUpperCase()); if (!s) demoErr(t('req_failed')); if (demoRole() === 'teacher') s.teacherId = state.user.id; else (demo.guardianLinks = demo.guardianLinks || ['mai']).push(s.id); return { ok: true, name: s.name }; }
  if (p === '/api/unlink') { if (demoRole() === 'guardian') demo.guardianLinks = (demo.guardianLinks || ['mai']).filter((x) => x !== body.id); else if (demo.students[body.id]) demo.students[body.id].teacherId = null; return { ok: true }; }
  if ((m = p.match(/^\/api\/students\/([\w-]+)\/meta$/)) && method === 'PUT') { demo.students[m[1]].teacherId = body.teacherId || null; return { ok: true }; }
  if (p === '/api/staff' && method === 'GET') return { staff: demo.staff.map((s) => ({ ...s, students: s.role === 'teacher' ? Object.values(demo.students).filter((x) => x.teacherId === s.id).length : null })) };
  if (p === '/api/staff' && method === 'POST') { if (!body.name || !body.email || String(body.password).length < 8) demoErr(t('pw_new_ph')); demo.staff.push({ id: 's' + Math.random().toString(36).slice(2, 7), name: body.name, email: body.email, role: body.role }); return { ok: true }; }
  if ((m = p.match(/^\/api\/staff\/([\w-]+)$/))) {
    const s = demo.staff.find((x) => x.id === m[1]); if (!s) demoErr(t('req_failed'));
    if (method === 'PUT') { if (body.name) s.name = body.name; if (body.role && body.role !== s.role) { if (s.role === 'admin' && demo.staff.filter((x) => x.role === 'admin').length <= 1) demoErr(t('staff_last_admin')); s.role = body.role; } return { ok: true }; }
    if (method === 'DELETE') { if (s.role === 'admin' && demo.staff.filter((x) => x.role === 'admin').length <= 1) demoErr(t('staff_last_admin')); demo.staff = demo.staff.filter((x) => x !== s); Object.values(demo.students).forEach((x) => { if (x.teacherId === s.id) x.teacherId = null; }); return { ok: true }; }
  }
  return undefined;
}

// 데모 역할 전환 (학습자 = 실제 로컬 데이터, 나머지 = 샘플 데이터)
function demoSwitch(role) {
  flush();
  if (role === 'landing') { state.user = null; state.token = null; state.viewAs = null; state.ro = false; state.trial = false; state.authMode = 'login'; state.tab = 'home'; clearLocal(); }
  else if (role === 'learner') { state.user = null; state.token = null; state.viewAs = null; state.ro = false; SYNC.forEach((k) => { state[k] = normalize(k, store.get(k, null)); }); state.tab = 'home'; }
  else {
    state.viewAs = null; state.ro = false; loadData({}); state.token = 'demo';
    state.user = role === 'teacher' ? { id: 't_kim', name: L('김하리 강사','Cô Kim Hari'), role: 'teacher' } : role === 'admin' ? { id: 't_admin', name: L('관리자(마스터)','Quản trị viên'), role: 'admin' } : { id: 'g1', name: L('Mai 어머니','Mẹ của Mai'), role: 'guardian' };
    state.tab = role === 'guardian' ? 'dash' : 'roster'; roster.loaded = false; gdash.loaded = false; stf.loaded = false;
  }
  render(); scrollTo(0, 0);
}
