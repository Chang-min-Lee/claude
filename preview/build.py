#!/usr/bin/env python3
"""claude.ai 아티팩트용 미리보기(단일 HTML) 빌드. 서버 없이 동작하도록 클라이언트 코드를 합치고,
   강사·관리자·보호자 화면은 preview/demo.js 의 샘플 데이터로 체험할 수 있게 한다.
   사용: python3 preview/build.py [출력경로]   (기본: preview/preview.html)"""
import re, sys, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUB = os.path.join(ROOT, 'public')
rd = lambda *p: open(os.path.join(*p), encoding='utf-8').read()
def rep(s, a, b):
    assert a in s, a[:70]
    return s.replace(a, b)

css = rd(PUB, 'style.css')
dark_vars = re.search(r'@media \(prefers-color-scheme: dark\) \{ :root \{ (.*?) \} \}', css).group(1)
css = re.sub(r'@media \(prefers-color-scheme: dark\) \{ :root \{ .*? \} \}',
  '@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { %s color-scheme: dark; } }\n:root[data-theme="dark"] { %s color-scheme: dark; }' % (dark_vars, dark_vars), css)
css = rep(css, 'position:sticky; top:0;', 'position:sticky; top:env(safe-area-inset-top, 0px);')
css += '\n.preview-note { background:var(--main2); border:1px solid var(--line); border-radius:12px; padding:10px 14px; margin-bottom:14px; font-size:.9em; color:var(--ink); }\n#demorole { max-width:170px; }\n'

i18n = rd(PUB, 'i18n.js') + '\n' + rd(PUB, 'i18n2.js') + """
Object.assign(UI.ko, { demo_view: '보기 전환', demo_learner: '학습자(나)', demo_teacher: '강사 화면(샘플)', demo_admin: '관리자 화면(샘플)', demo_guardian: '보호자 화면(샘플)',
  preview_note: '미리보기 버전이에요. 위의 "보기 전환"에서 강사·관리자·보호자 화면을 샘플 데이터로 체험할 수 있어요(학생 등록·입력·강사 관리도 동작하지만 저장되지 않아요). 로그인과 AI 기능은 설치 버전에서 쓸 수 있고, 학습자 화면에 입력한 내용은 이 브라우저에만 저장돼요.' });
Object.assign(UI.vi, { demo_view: 'Chuyển chế độ xem', demo_learner: 'Học viên (tôi)', demo_teacher: 'Màn hình giáo viên (mẫu)', demo_admin: 'Màn hình quản trị (mẫu)', demo_guardian: 'Màn hình phụ huynh (mẫu)',
  preview_note: 'Đây là bản xem thử. Ở mục "Chuyển chế độ xem" phía trên, bạn có thể trải nghiệm màn hình giáo viên, quản trị viên, phụ huynh với dữ liệu mẫu (đăng ký, nhập liệu, quản lý giáo viên đều hoạt động nhưng không được lưu). Đăng nhập và AI có trong bản cài đặt; dữ liệu nhập ở màn hình học viên chỉ lưu trong trình duyệt này.' });
"""
app = rd(PUB, 'app.js')
app = rep(app, 'const PREVIEW = false;', 'const PREVIEW = true;')
app = rep(app, "const LEARNER_TABS = ['home', 'explore', 'tests', 'study', 'plan', 'report', 'quiz', 'coach', 'account'];", "const LEARNER_TABS = ['home', 'explore', 'tests', 'study', 'plan', 'report'];")
app = rep(app, "async function api(path, { method = 'GET', body } = {}) {\n", """function previewPlan(goal, weeks, hours) {
  const steps = { ko: ['현재 수준 점검과 학습 자료 정하기', '핵심 개념 익히기', '문제/실습으로 적용하기', '틀린 부분 복습·정리하기', '실전 점검 및 다음 목표 세우기'], vi: ['Đánh giá trình độ hiện tại và chọn tài liệu học', 'Nắm vững khái niệm cốt lõi', 'Áp dụng qua bài tập/thực hành', 'Ôn lại và tổng hợp phần làm sai', 'Kiểm tra thực tế và đặt mục tiêu tiếp theo'] }[lang];
  const per = lang === 'vi' ? hours + ' giờ/tuần' : '주 ' + hours + '시간';
  return { ai: false, tasks: [...Array(weeks)].map((_, i) => ({ week: i + 1, text: goal + ' — ' + steps[Math.min(steps.length - 1, Math.floor(i / weeks * steps.length))] + ' (' + per + ')' })) };
}
async function api(path, { method = 'GET', body } = {}) {
  if (PREVIEW) { const d = demoApi(path, { method, body }); if (d !== undefined) return d; if (path === '/api/plan') return previewPlan(String(body.goal).slice(0, 100), body.weeks, body.hours); throw new Error(t('err_conn')); }
""")
app = rep(app, 'function render() {', 'var render = function render() {')
main = rd(PUB, 'main.js')
main = rep(main, "const langSel = $('#lang');", """const _render = render;
const roleSel = document.createElement('select'); roleSel.id = 'demorole'; roleSel.setAttribute('aria-label', 'demo');
$('#nav').before(roleSel); roleSel.onchange = () => demoSwitch(roleSel.value);
const roleOpts = () => ['learner', 'teacher', 'admin', 'guardian'].map((r) => `<option value="${r}">${t('demo_' + r)}</option>`).join('');
render = function () {
  _render();
  const cur = !state.user ? 'learner' : state.user.role; roleSel.innerHTML = roleOpts(); roleSel.value = cur; roleSel.title = t('demo_view');
  const n = document.createElement('div'); n.className = 'preview-note'; n.textContent = t('preview_note'); $('#app').prepend(n);
};
const langSel = $('#lang');""")
main = rep(main, "langSel.onchange = () => { setLang(langSel.value); render(); };", "langSel.onchange = () => { setLang(langSel.value); demoReset(); if (state.user && state.user.role !== 'learner') demoSwitch(state.user.role); else render(); };")
report = rd(PUB, 'report.js')
report = rep(report, 'const ro = state.ro || isGuardianView();', 'const ro = state.ro || isGuardianView() || PREVIEW;')
report = rep(report, 'const printBtn = () => `', 'const printBtn = () => PREVIEW ? \'\' : `')
scripts = [i18n, rd(PUB, 'tests.js'), app, rd(PUB, 'plan.js'), rd(PUB, 'tests-ui.js'), rd(PUB, 'quiz.js'), report, rd(PUB, 'staff.js'), rd(ROOT, 'preview', 'demo.js'), main]
page = '<title>진로AI 코치</title>\n<style>\n' + css + '\n</style>\n<header>\n  <h1 id="title"></h1>\n  <select id="lang" aria-label="Language"></select>\n  <nav id="nav" hidden></nav>\n</header>\n<main id="app"></main>\n' + ''.join('<script>\n' + s + '\n</script>\n' for s in scripts)
out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'preview', 'preview.html')
open(out, 'w', encoding='utf-8').write(page)
print('built', out, len(page))
