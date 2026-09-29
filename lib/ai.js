// AI 진단서·시간표 생성. API 키가 없으면 시간표는 규칙 기반 템플릿으로 대체하고, 진단서는 클라이언트의 규칙 기반 해석을 쓴다.
const { sanitizers, ORG_TYPES, clip, int, isDate, arr, obj } = require('./sanitize');

const LEVEL = {
  ko: { elementary: '초등학생', middle: '중학생', high: '고등학생', college: '대학생', adult: '성인 학습자' },
  vi: { elementary: 'học sinh tiểu học', middle: 'học sinh THCS', high: 'học sinh THPT', college: 'sinh viên', adult: 'người học trưởng thành' },
};
const ORG = {
  ko: { language: '어학원', studyroom: '공부방(다과목 자기주도학습 관리)', consultant: '기관에 속하지 않은 학습 컨설턴트', studycafe: '스터디카페(좌석 이용·자기주도 학습 관리)' },
  vi: { language: 'trung tâm ngoại ngữ', studyroom: 'lớp tự học nhiều môn có quản lý', consultant: 'tư vấn học tập độc lập', studycafe: 'quán cà phê học tập (thuê chỗ tự học có quản lý)' },
};
const COLORS = ['#BE185D', '#0E7490', '#4338CA', '#B45309', '#15803D', '#6D28D9'];
const DEFAULT_SUBJECTS = { ko: ['국어', '수학', '영어'], vi: ['Ngữ văn', 'Toán', 'Tiếng Anh'] };
const REVIEW = { ko: '복습·정리', vi: 'Ôn tập' };

// 평일 저녁 → 주말 순서로 1시간 슬롯 [요일(0=월), 시작시각]
const SLOT_ORDER = [
  [0, 19], [1, 19], [2, 19], [3, 19], [4, 19], [5, 10], [6, 10],
  [0, 20], [1, 20], [2, 20], [3, 20], [4, 20], [5, 14], [6, 14],
  [0, 18], [1, 18], [2, 18], [3, 18], [4, 18], [5, 15], [6, 15],
  [5, 11], [6, 11], [5, 16], [6, 16], [0, 21], [1, 21], [2, 21], [3, 21], [4, 21],
];

function fallbackSchedule({ subjects, hours }, lang) {
  const subs = subjects.length ? subjects : DEFAULT_SUBJECTS[lang];
  const n = Math.min(hours, SLOT_ORDER.length);
  const label = (i) => (i % (subs.length + 1) === subs.length ? REVIEW[lang] : subs[i % (subs.length + 1)]);
  const color = {};
  const schedule = SLOT_ORDER.slice(0, n).map(([day, start], i) => {
    const l = label(i); color[l] = color[l] || COLORS[Object.keys(color).length % COLORS.length];
    return { day, start, end: start + 1, label: l, color: color[l] };
  });
  const per = Math.max(1, Math.round(hours / subs.length));
  const detail = lang === 'vi' ? `Học ${per} giờ/tuần · ôn lại 30 phút` : `주 ${per}시간 학습 · 복습 30분`;
  return { schedule, weekplan: subs.map((subject) => ({ subject, kind: 'self', detail })) };
}

// 같은 요일에 겹치는 블록은 먼저 온 것만 남긴다
function dropOverlaps(blocks) {
  const kept = [];
  for (const b of blocks) if (!kept.some((k) => k.day === b.day && b.start < k.end && k.start < b.end)) kept.push(b);
  return kept;
}

module.exports = ({ callClaude, extractJson, HttpError }) => ({
  async makeSchedule(body, lang) {
    const group = LEVEL.ko[body.group] ? body.group : 'adult';
    const hours = int(body.hours, 1, 30, 6);
    const subjects = arr(body.subjects, 6).map((s) => clip(s, 20)).filter(Boolean);
    const goal = clip(body.goal, 100), existing = clip(body.existing, 300);
    const level = LEVEL[lang][group];
    const text = await callClaude(
      lang === 'vi' ? `Bạn là chuyên gia lập thời khóa biểu học cho ${level}. Chỉ trả về JSON.` : `당신은 ${level} 시간표 설계 전문가입니다. 반드시 JSON만 출력하세요.`,
      [{ role: 'user', content: lang === 'vi'
        ? `Mục tiêu: ${goal || 'chưa nhập'}\nMôn/nội dung: ${subjects.join(', ') || 'tự đề xuất'}\nTổng thời gian học mỗi tuần: khoảng ${hours} giờ\nLịch đã có (phải tránh trùng): ${existing || 'không có'}\nChỉ trả lời JSON: {"schedule":[{"day":0-6 (0=Thứ Hai),"start":6-22,"end":start+1..23,"label":"tên khối"}],"weekplan":[{"subject":"môn","kind":"self|school|extra","detail":"nội dung cụ thể"}]}. schedule gồm 6-14 khối thực tế, weekplan gồm 3-6 dòng, viết bằng tiếng Việt.`
        : `목표: ${goal || '미입력'}\n과목/학습 내용: ${subjects.join(', ') || '알아서 제안'}\n주당 총 학습 시간: 약 ${hours}시간\n이미 있는 일정(겹치지 않게): ${existing || '없음'}\nJSON으로만 답하세요: {"schedule":[{"day":0~6 (0=월요일),"start":6~22,"end":start+1~23,"label":"블록명"}],"weekplan":[{"subject":"과목","kind":"self|school|extra","detail":"세부내용"}]}. schedule은 현실적으로 6~14개 블록, weekplan은 3~6개 행, 한국어로 작성하세요.` }],
      2000);
    if (text === null) return { ...fallbackSchedule({ subjects, hours }, lang), ai: false };
    const j = extractJson(text);
    const colors = {};
    const schedule = dropOverlaps(sanitizers.schedule(arr(j.schedule, 20).map((b) => ({ ...b, color: (colors[b?.label] = colors[b?.label] || COLORS[Object.keys(colors).length % COLORS.length]) }))));
    const weekplan = sanitizers.weekplan(arr(j.weekplan, 8));
    if (!schedule.length) throw new HttpError(502, 'planFail');
    return { schedule, weekplan, ai: true };
  },

  // 종합 진단서. 검사 결과는 클라이언트가 현재 언어로 만든 요약(이름·헤드라인·영역 점수)을 보낸다. 정서웰빙 원점수는 받지 않는다.
  async makeDiagnosis(body, lang) {
    const group = LEVEL.ko[body.group] ? body.group : 'adult';
    const level = LEVEL[lang][group];
    const tests = arr(body.tests, 6).map((t) => ({
      name: clip(t?.name, 50), headline: clip(t?.headline, 80),
      cats: arr(t?.cats, 8).map((c) => `${clip(c?.label, 30)} ${Number(c?.value).toFixed(1)}`).join(', '),
    })).filter((t) => t.name);
    const grades = arr(body.grades, 12).map((g) => `${clip(g?.subject, 30)} ${clip(g?.score, 12)}`).join(', ');
    const goal = obj(body.goal), sch = obj(body.schedule);
    const org = ORG_TYPES.includes(body.orgType) ? ORG[lang][body.orgType] : '';
    const info = lang === 'vi'
      ? [...(org ? [`Mô hình vận hành: ${org}`] : []), `Người học: ${clip(body.name, 20) || 'ẩn danh'} (${level})`, `Mục tiêu: ${clip(goal.label, 60) || 'chưa nhập'}${goal.dday != null ? ` (D-${int(goal.dday, -999, 9999, 0)})` : ''}`,
        `Kết quả kiểm tra (thang 5):\n${tests.map((t) => `- ${t.name}: ${t.headline} | ${t.cats}`).join('\n') || '- chưa có'}`, `Điểm số gần đây: ${grades || 'chưa nhập'}`,
        `Thời gian học đã xếp trong tuần: ${int(sch.hours, 0, 200, 0)} giờ`, `Việc cần làm: hoàn thành ${int(body.tasksDone, 0, 999, 0)}/${int(body.tasksTotal, 0, 999, 0)}`]
      : [...(org ? [`운영 모델: ${org}`] : []), `학습자: ${clip(body.name, 20) || '이름 미입력'} (${level})`, `목표: ${clip(goal.label, 60) || '미입력'}${goal.dday != null ? ` (D-${int(goal.dday, -999, 9999, 0)})` : ''}`,
        `검사 결과(5점 만점):\n${tests.map((t) => `- ${t.name}: ${t.headline} | ${t.cats}`).join('\n') || '- 없음'}`, `최근 성적: ${grades || '미입력'}`,
        `주간 시간표에 확보된 학습 시간: ${int(sch.hours, 0, 200, 0)}시간`, `할 일: ${int(body.tasksDone, 0, 999, 0)}/${int(body.tasksTotal, 0, 999, 0)} 완료`];
    const schema = '{"before":"","insight":"","intensityLabel":"","intensityReason":"","purpose":"","overall":"","subjects":[["",""]],"timeAnalysis":"","etc":[["",""]],"methods":[["",["",""]]],"career":"","checklist":[""],"weekplan":[{"subject":"","kind":"self|school|extra","detail":""}]}';
    const [sys, user] = lang === 'vi'
      ? [`Bạn là chuyên gia tư vấn học tập và hướng nghiệp cho ${level}. Chỉ dựa trên dữ liệu được cung cấp, không khẳng định chắc chắn về phần thiếu dữ liệu, không chẩn đoán y tế/tâm lý. Chỉ trả về JSON.`,
        `${info.join('\n')}\n\nHãy viết bản chẩn đoán tổng hợp bằng tiếng Việt, cụ thể và bám sát điểm số. Không dùng HTML. Trả lời đúng một đối tượng JSON theo mẫu (điền nội dung thay cho chuỗi rỗng):\n${schema}\n- before: 2–3 câu tóm tắt trạng thái hiện tại dựa trên kết quả\n- insight: tối đa 2 câu về điểm mạnh/điểm cần cải thiện\n- intensityLabel: một trong "Quản lý lỏng" / "Quản lý vừa" / "Quản lý chặt"\n- overall: 6–8 câu, nêu ít nhất 2 điểm mạnh và 1–2 điểm yếu kèm căn cứ\n- subjects: 4–6 mục [tên lĩnh vực, 2–3 câu]\n- methods: 3–4 môn, mỗi môn 3–4 gợi ý thực hiện được\n- career: 5–6 câu, nêu ít nhất 2 hướng nghề nghiệp kèm căn cứ từ kết quả\n- checklist: 3–4 mục tiêu tuần này; weekplan: 4–5 dòng`]
      : [`당신은 ${level} 대상의 학습·진로 컨설턴트입니다. 제공된 데이터에만 근거하고, 데이터가 없는 부분은 단정하지 말며, 의학·심리 진단은 하지 마세요. 반드시 JSON만 출력하세요.`,
        `${info.join('\n')}\n\n위 데이터를 바탕으로 종합 진단서를 한국어로, 점수와 태그에 근거해 구체적으로 작성하세요. HTML은 쓰지 마세요. 아래 형식의 JSON 객체 하나만 답하세요(빈 문자열 자리를 채우세요):\n${schema}\n- before: 검사 결과만 놓고 본 현재 상태 2~3문장\n- insight: 강점·보완점 2문장 이내\n- intensityLabel: "느슨한 관리" / "보통 관리" / "촘촘한 관리" 중 하나\n- overall: 6~8문장, 강점 2가지 이상과 약점 1~2가지를 근거와 함께\n- subjects: 4~6개 [영역명, 2~3문장]\n- methods: 3~4과목, 과목당 실행 가능한 가이드 3~4개\n- career: 5~6문장, 진로·직무 분야 2개 이상과 근거\n- checklist: 이번 주 목표 3~4개, weekplan: 4~5행`];
    const text = await callClaude(sys, [{ role: 'user', content: user }], 3500);
    if (text === null) throw new HttpError(503, 'diagNeedKey');
    const today = isDate(body.today) ? body.today : new Date().toISOString().slice(0, 10);
    const diag = sanitizers.diag({ ...extractJson(text), date: today, lang });
    if (!diag.overall) throw new HttpError(502, 'aiParse');
    return { diag };
  },

  // 검사 하나에 대한 AI 심층 해석 (정서웰빙은 대상에서 제외). 키가 없으면 503.
  async makeTestDetail(body, lang) {
    const group = LEVEL.ko[body.group] ? body.group : 'adult';
    const level = LEVEL[lang][group];
    const name = clip(body.name, 50), headline = clip(body.headline, 80);
    const cats = arr(body.cats, 8).map((c) => `${clip(c?.label, 30)} ${Number(c?.value).toFixed(1)}`).join(', ');
    if (!name || !cats) throw new HttpError(400, 'badReq');
    const schema = '{"summary":"","strengths":[""],"cautions":[""],"tips":[""]}';
    const [sys, user] = lang === 'vi'
      ? [`Bạn là chuyên gia tư vấn học tập và hướng nghiệp cho ${level}. Chỉ dựa trên số liệu được cung cấp, không chẩn đoán y tế/tâm lý, giọng văn tích cực và cụ thể. Chỉ trả về JSON.`,
        `Bài kiểm tra: ${name}\nKết quả: ${headline} | ${cats} (thang 5)\nMục tiêu: ${clip(body.goal, 60) || 'chưa nhập'}\n\nHãy diễn giải kết quả bằng tiếng Việt theo mẫu JSON sau (summary 2-3 câu; strengths, cautions, tips mỗi mục 2-3 ý ngắn): ${schema}`]
      : [`당신은 ${level} 대상의 학습·진로 컨설턴트입니다. 제공된 점수에만 근거하고, 의학·심리 진단은 하지 마세요. 긍정적이고 구체적인 말투로 JSON만 출력하세요.`,
        `검사: ${name}\n결과: ${headline} | ${cats} (5점 만점)\n목표: ${clip(body.goal, 60) || '미입력'}\n\n결과를 한국어로 해석해 아래 JSON 형식으로만 답하세요(summary 2~3문장, strengths·cautions·tips 는 각 2~3개의 짧은 항목): ${schema}`];
    const text = await callClaude(sys, [{ role: 'user', content: user }], 1200);
    if (text === null) throw new HttpError(503, 'detailNeedKey');
    const j = extractJson(text), list = (v) => arr(v, 4).map((x) => clip(x, 200)).filter(Boolean);
    const detail = { summary: clip(j.summary, 500), strengths: list(j.strengths), cautions: list(j.cautions), tips: list(j.tips) };
    if (!detail.summary) throw new HttpError(502, 'aiParse');
    return { detail };
  },
});
module.exports.fallbackSchedule = fallbackSchedule;
