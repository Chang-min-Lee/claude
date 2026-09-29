// 사업 운영 기능: 기관(학원) 정보, 학부모 공유 링크(로그인 없이 읽기 전용), 개인정보·이용약관 안내
const orgName = () => state.org?.orgName || t('title');
async function loadOrg() { try { state.org = await api('/api/settings'); } catch { state.org = state.org || {}; } }

// 관리자: 기관 정보 카드
function orgCard() {
  const o = state.org || {};
  return `<div class="card"><h2>${t('org_title')}</h2><p class="sub">${t('org_help')}</p>
    <input type="text" id="orgname" maxlength="40" placeholder="${t('org_name')}" value="${esc(o.orgName || '')}">
    <div class="row"><input type="text" id="orgphone" maxlength="30" placeholder="${t('org_phone')}" value="${esc(o.orgPhone || '')}"><input type="text" id="orgemail" maxlength="80" placeholder="${t('org_email')}" value="${esc(o.orgEmail || '')}"></div>
    <button class="primary" id="orgsave">${t('btn_save')}</button> <span class="sub" id="orgmsg"></span></div>`;
}
function bindOrgCard() {
  if (!$('#orgsave')) return;
  $('#orgsave').onclick = async () => {
    try { state.org = await api('/api/settings', { method: 'PUT', body: { orgName: $('#orgname').value, orgPhone: $('#orgphone').value, orgEmail: $('#orgemail').value } }); $('#orgmsg').textContent = t('saved'); render(); } catch (e) { $('#orgmsg').textContent = e.message; }
  };
}

// 강사: 학부모 공유 링크 카드 (학생을 열어 본 상태)
const parentUrl = (tok) => `${location.origin}${location.pathname}?p=${tok}`;
function parentLinkCard() {
  const v = state.viewAs; if (!v || state.ro || PREVIEW) return '';
  const tok = v.parentToken;
  return `<div class="card"><h2>${t('pl_title')}</h2><p class="sub">${t('pl_help')}</p>
    ${tok ? `<input type="text" id="plurl" readonly value="${esc(parentUrl(tok))}" onclick="this.select()">
      <div class="row"><button class="primary" id="plcopy">${t('pl_copy')}</button><button id="plnew">${t('pl_reissue')}</button><button id="plrevoke" style="color:var(--crit)">${t('pl_revoke')}</button></div>
      <p class="sub">${esc(t('pl_msg', { name: v.name, url: parentUrl(tok) }))}</p><button id="plcopymsg">${t('pl_copy_msg')}</button>`
      : `<button class="primary" id="plnew">${t('pl_issue')}</button>`} <span class="sub" id="plmsg"></span></div>`;
}
async function copyText(s, msgEl) {
  try { await navigator.clipboard.writeText(s); if (msgEl) msgEl.textContent = t('pl_copied'); } catch { if (msgEl) msgEl.textContent = t('pl_copy_fail'); }
}
function bindParentLinkCard() {
  const v = state.viewAs; if (!v || !$('#plmsg')) return;
  const msg = $('#plmsg');
  if ($('#plnew')) $('#plnew').onclick = async () => { try { v.parentToken = (await api(`/api/students/${v.id}/parent-link`, { method: 'POST' })).token; render(); } catch (e) { msg.textContent = e.message; } };
  if ($('#plrevoke')) $('#plrevoke').onclick = async () => { try { await api(`/api/students/${v.id}/parent-link`, { method: 'DELETE' }); v.parentToken = undefined; render(); } catch (e) { msg.textContent = e.message; } };
  if ($('#plcopy')) $('#plcopy').onclick = () => copyText(parentUrl(v.parentToken), msg);
  if ($('#plcopymsg')) $('#plcopymsg').onclick = () => copyText(t('pl_msg', { name: v.name, url: parentUrl(v.parentToken) }), msg);
}

// 학부모 공유 페이지 (?p=토큰): 로그인 없이 읽기 전용 학부모 리포트만 보여준다
async function renderParentPage(token) {
  const app = $('#app'); $('#nav').hidden = true;
  const draw = async () => {
    try {
      const r = await fetch('/api/parent?t=' + encodeURIComponent(token), { headers: { 'X-Lang': lang } });
      if (!r.ok) throw new Error();
      const j = await r.json();
      state.org = j.org; loadData(j.data);
      state.profile = state.profile || newProfile(j.name);
      state.profile.name = j.name; state.viewAs = { id: 'p', name: j.name, teacher: j.teacher ? { name: j.teacher } : null }; state.ro = true;
      document.title = orgName(); $('#title').textContent = orgName();
      const body = document.createElement('div'); parentView(body);
      app.innerHTML = ''; app.appendChild(body); app.insertAdjacentHTML('beforeend', legalFooter());
    } catch { app.innerHTML = `<div class="card"><h2>${t('pp_bad')}</h2><p class="sub">${t('pp_bad_help')}</p></div>`; }
  };
  langSel.onchange = () => { setLang(langSel.value); draw(); };
  await draw();
}

// 저장 상태 알림(저장됨 / 저장 실패). 실패해도 입력한 내용은 이 기기에 남아 있고 자동으로 다시 시도한다.
let saveTimer;
function setSaveState(st) {
  let el = document.getElementById('savestat');
  if (!el) { el = document.createElement('div'); el.id = 'savestat'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
  clearTimeout(saveTimer);
  el.className = 'savestat ' + st; el.textContent = st === 'ok' ? '✓ ' + t('save_ok') : '⚠ ' + t('save_fail'); el.hidden = false;
  if (st === 'ok') saveTimer = setTimeout(() => { el.hidden = true; }, 1600);
}

// 개인정보 처리방침·이용약관 (기본 양식). 실제 서비스 전에는 반드시 법률 전문가의 검토를 받아야 한다.
const LEGAL = {
  ko: {
    privacy: ['개인정보 처리방침', (o, c) => [
      ['1. 수집하는 정보', '이름(별명), 이메일(계정이 있는 경우), 학년 구분, 학교, 학습 목표, 검사 응답과 결과, 성적, 시간표, 학습 기록, 상담 메시지. 정서웰빙 검사 결과는 민감할 수 있는 정보이므로 본인(또는 보호자)이 동의한 경우에만 담당 강사에게 공개됩니다.'],
      ['2. 이용 목적', '진로·학습 관리 서비스 제공, 학습 리포트 작성, 담당 강사의 상담 지원, 서비스 개선.'],
      ['3. 보유·이용 기간', '계정 삭제 또는 등록 해지 시까지 보유하며, 삭제를 요청하면 지체 없이 파기합니다. (계정 화면에서 데이터 내려받기와 삭제가 가능합니다.)'],
      ['4. 제3자 제공·처리 위탁', 'AI 기능(코치·퀴즈·진단서·검사 해석)을 사용할 때에 한해 필요한 최소한의 학습 정보가 AI 서비스(Anthropic)에 전달되어 답변 생성에 쓰입니다. 그 밖에 정보를 제3자에게 판매하거나 제공하지 않습니다. 정서웰빙 원점수는 AI로 전송하지 않습니다.'],
      ['5. 만 14세 미만 아동', '만 14세 미만 아동의 정보는 법정대리인(보호자)의 동의를 받은 뒤 등록·이용해야 합니다. 강사가 대신 등록하는 경우에도 동의를 먼저 받아야 합니다.'],
      ['6. 정보주체의 권리', '열람, 정정, 삭제, 처리정지를 요청할 수 있습니다. 아래 연락처로 문의해 주세요.'],
      ['7. 안전성 확보', '비밀번호는 암호화하여 저장하고, 접속은 HTTPS로 보호하며, 권한이 있는 강사·관리자만 담당 학생의 정보를 볼 수 있습니다.'],
      ['8. 개인정보 보호책임자', `${o}${c ? ' · ' + c : ''}`],
    ]],
    terms: ['이용약관', (o) => [
      ['제1조 (목적)', `이 약관은 ${o}(이하 "기관")가 제공하는 진로탐색·학습관리 서비스의 이용 조건을 정합니다.`],
      ['제2조 (서비스)', '진로 흥미·성격·가치관·학습역량·자기주도학습·정서웰빙 검사, 학습 계획·기록, 리포트, AI 코치·퀴즈 등을 제공합니다.'],
      ['제3조 (검사 결과의 성격)', '검사 결과와 AI 답변은 자기이해를 돕는 참고 자료입니다. 공인 심리검사·의학적 진단·입시/취업 결과의 보증이 아닙니다. 마음이 많이 힘들다면 전문 상담기관이나 믿을 수 있는 어른에게 도움을 요청하세요.'],
      ['제4조 (계정과 이용자 의무)', '계정 정보를 안전하게 관리해야 하며, 타인의 정보를 도용하거나 서비스 운영을 방해해서는 안 됩니다.'],
      ['제5조 (해지)', '이용자는 언제든지 계정 화면에서 탈퇴할 수 있으며, 탈퇴 시 저장된 데이터는 삭제됩니다.'],
      ['제6조 (변경)', '약관을 변경할 때에는 서비스 화면에 미리 알립니다.'],
    ]],
    note: '※ 이 문서는 기본 양식입니다. 서비스 시작 전에 법률 전문가의 검토를 받아 기관 상황에 맞게 수정해 주세요.',
    back: '← 돌아가기', foot_priv: '개인정보 처리방침', foot_terms: '이용약관',
  },
  vi: {
    privacy: ['Chính sách bảo mật thông tin cá nhân', (o, c) => [
      ['1. Thông tin thu thập', 'Tên (biệt danh), email (nếu có tài khoản), nhóm lớp/cấp học, trường, mục tiêu học tập, câu trả lời và kết quả kiểm tra, điểm số, thời khóa biểu, nhật ký học tập, tin nhắn tư vấn. Kết quả kiểm tra sức khỏe tinh thần là thông tin nhạy cảm nên chỉ chia sẻ với giáo viên phụ trách khi bản thân (hoặc phụ huynh) đồng ý.'],
      ['2. Mục đích sử dụng', 'Cung cấp dịch vụ hướng nghiệp và quản lý học tập, lập báo cáo học tập, hỗ trợ tư vấn của giáo viên, cải thiện dịch vụ.'],
      ['3. Thời gian lưu trữ', 'Lưu đến khi xóa tài khoản hoặc hủy đăng ký; khi có yêu cầu xóa sẽ hủy ngay. (Bạn có thể tải dữ liệu và xóa tài khoản ở màn hình Tài khoản.)'],
      ['4. Cung cấp cho bên thứ ba', 'Chỉ khi dùng tính năng AI (huấn luyện, trắc nghiệm, bản chẩn đoán, diễn giải kết quả), thông tin học tập tối thiểu cần thiết được gửi tới dịch vụ AI (Anthropic) để tạo câu trả lời. Chúng tôi không bán hay cung cấp thông tin cho bên thứ ba khác. Điểm thô của bài kiểm tra sức khỏe tinh thần không được gửi cho AI.'],
      ['5. Trẻ dưới 14 tuổi', 'Thông tin của trẻ dưới 14 tuổi chỉ được đăng ký và sử dụng sau khi có sự đồng ý của người giám hộ. Kể cả khi giáo viên đăng ký hộ, cũng phải xin sự đồng ý trước.'],
      ['6. Quyền của chủ thể thông tin', 'Bạn có thể yêu cầu xem, chỉnh sửa, xóa hoặc dừng xử lý thông tin. Vui lòng liên hệ theo thông tin bên dưới.'],
      ['7. Bảo mật', 'Mật khẩu được mã hóa, kết nối được bảo vệ bằng HTTPS, chỉ giáo viên/quản trị viên có quyền mới xem được thông tin học viên phụ trách.'],
      ['8. Người phụ trách bảo vệ thông tin', `${o}${c ? ' · ' + c : ''}`],
    ]],
    terms: ['Điều khoản sử dụng', (o) => [
      ['Điều 1 (Mục đích)', `Điều khoản này quy định điều kiện sử dụng dịch vụ hướng nghiệp và quản lý học tập do ${o} (sau đây gọi là "Đơn vị") cung cấp.`],
      ['Điều 2 (Dịch vụ)', 'Các bài kiểm tra sở thích, tính cách, giá trị nghề nghiệp, năng lực học tập, tự học và sức khỏe tinh thần; kế hoạch và nhật ký học tập; báo cáo; huấn luyện và trắc nghiệm AI.'],
      ['Điều 3 (Tính chất của kết quả)', 'Kết quả kiểm tra và câu trả lời của AI chỉ là tài liệu tham khảo giúp hiểu bản thân, không phải trắc nghiệm tâm lý chính thức, chẩn đoán y tế hay cam kết kết quả thi cử/việc làm. Nếu cảm thấy rất khó khăn, hãy tìm đến cơ sở tư vấn chuyên môn hoặc người lớn đáng tin cậy.'],
      ['Điều 4 (Tài khoản và nghĩa vụ)', 'Người dùng phải bảo quản thông tin tài khoản, không được mạo danh hay cản trở hoạt động của dịch vụ.'],
      ['Điều 5 (Hủy dịch vụ)', 'Người dùng có thể xóa tài khoản bất cứ lúc nào ở màn hình Tài khoản; dữ liệu đã lưu sẽ bị xóa.'],
      ['Điều 6 (Thay đổi)', 'Khi thay đổi điều khoản, chúng tôi sẽ thông báo trước trên màn hình dịch vụ.'],
    ]],
    note: '※ Đây là mẫu cơ bản. Trước khi vận hành, hãy nhờ chuyên gia pháp lý xem xét và điều chỉnh cho phù hợp với đơn vị của bạn.',
    back: '← Quay lại', foot_priv: 'Chính sách bảo mật', foot_terms: 'Điều khoản sử dụng',
  },
};
function legalFooter() {
  const L = LEGAL[lang];
  return `<p class="sub noprint" style="text-align:center;margin-top:24px"><a href="?legal=privacy">${L.foot_priv}</a> · <a href="?legal=terms">${L.foot_terms}</a></p>`;
}
function renderLegal(kind) {
  const L = LEGAL[lang], k = kind === 'terms' ? 'terms' : 'privacy', o = orgName(), c = [state.org?.orgPhone, state.org?.orgEmail].filter(Boolean).join(' · ');
  const draw = () => {
    const [title, fn] = LEGAL[lang][k];
    $('#nav').hidden = true; document.title = `${title} - ${orgName()}`;
    $('#app').innerHTML = `<div class="card legal"><p><a href="${location.pathname}">${LEGAL[lang].back}</a></p><h1>${title}</h1>${fn(o, c).map(([h, b]) => `<h2>${esc(h)}</h2><p>${esc(b)}</p>`).join('')}<p class="sub">${LEGAL[lang].note}</p></div>`;
  };
  langSel.onchange = () => { setLang(langSel.value); draw(); };
  draw();
}

// ---------- 베타: 의견 보내기 · 안내 배너 · 백업 ----------
const FB_KINDS = ['bug', 'confusing', 'idea', 'praise'];
function openFeedback() {
  if (document.getElementById('fbmodal')) return;
  const m = document.createElement('div'); m.id = 'fbmodal'; m.className = 'modal';
  m.innerHTML = `<div class="modal-box" role="dialog" aria-modal="true"><h2>💬 ${t('fb_title')}</h2><p class="sub">${t('fb_help')}</p>
    <div class="row">${FB_KINDS.map((k, i) => `<label class="tag" style="cursor:pointer"><input type="radio" name="fbk" value="${k}" ${i === 0 ? 'checked' : ''} style="width:auto"> ${t('fb_' + k)}</label>`).join('')}</div>
    <textarea id="fbtext" rows="4" maxlength="1000" placeholder="${t('fb_ph')}"></textarea>
    <div class="row"><button class="primary" id="fbsend">${t('fb_send')}</button><button id="fbclose">${t('btn_cancel')}</button><span class="sub" id="fbmsg"></span></div></div>`;
  document.body.appendChild(m);
  const close = () => m.remove();
  m.onclick = (e) => { if (e.target === m) close(); };
  $('#fbclose').onclick = close; $('#fbtext').focus();
  $('#fbsend').onclick = async () => {
    const text = $('#fbtext').value.trim(); if (!text) { $('#fbmsg').textContent = t('fb_need'); return; }
    $('#fbsend').disabled = true;
    try { await api('/api/feedback', { method: 'POST', body: { text, kind: document.querySelector('input[name=fbk]:checked').value, where: state.tab } }); $('#fbmsg').textContent = t('fb_thanks'); setTimeout(close, 1200); }
    catch (e) { $('#fbmsg').textContent = e.message; $('#fbsend').disabled = false; }
  };
}
if ($('#fbbtn')) $('#fbbtn').onclick = openFeedback;
let betaHidden = false;
const betaBanner = () => (state.org?.beta && !betaHidden ? `<div class="preview-note noprint">🧪 ${t('beta_note')} <button id="betaclose" style="padding:2px 10px">✕</button></div>` : '');

// 관리자: 받은 의견 목록 (데이터 탭)
const fbs = { list: null, err: '' };
async function loadFeedback() { try { fbs.list = (await api('/api/feedback')).feedback; } catch (e) { fbs.err = e.message; fbs.list = []; } if (state.tab === 'data') render(); }
function feedbackCard() {
  if (roleOf() !== 'admin') return '';
  if (!fbs.list) { loadFeedback(); return `<div class="card"><h2>${t('fb_admin')}</h2><p class="sub">${t('loading')}</p></div>`; }
  return `<div class="card"><h2>${t('fb_admin')} <span class="sub">${fbs.list.length}</span></h2>${fbs.list.length ? fbs.list.slice(0, 50).map((f) => `<div class="task ${f.done ? 'done' : ''}"><span><span class="tag ${f.kind === 'bug' ? 'weak' : ''}">${t('fb_' + f.kind)}</span> <span class="sub">${esc(f.at.slice(0, 10))} · ${esc(f.who || t('fb_anon'))} · ${esc(f.where)}</span><br>${esc(f.text)}</span><button data-fbdone="${esc(f.id)}">${f.done ? t('fb_reopen') : t('fb_done')}</button></div>`).join('') : `<p class="sub">${t('fb_none')}</p>`}
    <div class="row"><button id="fbcsv">${t('csv_btn')}</button><span class="sub">${esc(fbs.err)}</span></div></div>`;
}
function bindFeedbackCard() {
  document.querySelectorAll('[data-fbdone]').forEach((b) => (b.onclick = async () => { try { await api(`/api/feedback/${b.dataset.fbdone}/done`, { method: 'POST' }); } catch {} fbs.list = null; render(); }));
  if ($('#fbcsv')) $('#fbcsv').onclick = () => downloadCsv(`feedback-${today()}.csv`, [['date', 'type', 'who', 'where', 'text', 'done'], ...fbs.list.map((f) => [f.at.slice(0, 10), f.kind, f.who, f.where, f.text, f.done ? 1 : 0])]);
}

// 관리자: 전체 데이터 백업 내려받기
function backupCard() {
  return `<div class="card"><h2>${t('bk_title')}</h2><p class="sub">${t('bk_help')}</p><button id="bkdl">${t('bk_btn')}</button> <span class="sub" id="bkmsg"></span></div>`;
}
function bindBackupCard() {
  if (!$('#bkdl')) return;
  $('#bkdl').onclick = async () => {
    $('#bkmsg').textContent = t('loading');
    try {
      const r = await fetch('/api/backup', { headers: { Authorization: 'Bearer ' + state.token } });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || t('req_failed'));
      const cd = r.headers.get('content-disposition') || '', name = (cd.match(/filename="([^"]+)"/) || [])[1] || 'backup';
      const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(await r.blob()), download: name }); document.body.appendChild(a); a.click(); a.remove();
      $('#bkmsg').textContent = t('bk_done');
    } catch (e) { $('#bkmsg').textContent = e.message; }
  };
}
