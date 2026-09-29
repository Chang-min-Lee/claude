// 계획·리포트·종합검사·강사 콘솔 문구 (i18n.js 의 UI/CONTENT 를 확장)
Object.assign(UI.ko, {
  tab_plan: '계획', tab_report: '리포트', tab_roster: '학생 목록', tab_register: '학생 등록', tab_staff: '강사 관리',
  sub_schedule: '시간표', sub_weekplan: '주간계획', sub_goal: '목표·D-day', sub_grades: '성적', sub_comp: '종합 결과', sub_student: '학생용', sub_parent: '학부모용', sub_diag: '진단서', sub_teacher: '강사용',
  kind_self: '자기주도학습', kind_school: '학교 내신형', kind_extra: '비교과', gt_abroad: '유학·자격시험', gt_school: '학교·입시', gt_career: '취업·진로', gt_general: '일반 자기계발',
  role_teacher: '강사', role_admin: '관리자', st_ok: '정상', st_watch: '개입 필요',
  btn_delete_item: '삭제', btn_edit: '수정', btn_next_test: '다음 검사', btn_open: '열기', btn_open_report: '리포트 보기', btn_prev: '이전', btn_print: '인쇄', btn_reload: '새로고침', btn_save: '저장', saved: '저장했어요.',
  back_list: '학생 목록', teacher_lbl: '담당', unassigned: '미배정', managed: '강사 등록', read_only: '읽기 전용',
  acc_staff_desc: '강사/관리자 계정이에요. 학생 목록에서 담당 학생을 관리해요.',
  ci_title: '출석 체크인', ci_btn: '출석 체크인', ci_done: '오늘 체크인 완료 ({time})',
  claim_title: '선생님이 등록한 학생 계정 활성화', claim_desc: '선생님이 나를 등록해 주셨다면, 받은 활성화 코드로 내 로그인 계정을 만들 수 있어요.', claim_code_ph: '활성화 코드(8자리)', claim_btn: '계정 활성화',
  co_btn: '주간 마감(완료 항목 정리)', co_hint: '완료 {d}/{n}개를 정리하고 기록을 남겨요.', co_history: '지난 마감',
  consent_title: '정서웰빙 결과 공유', consent_wb: '정서웰빙 검사 결과가 "주의 필요"일 때 담당 강사가 알 수 있도록 허용', consent_note: '허용하지 않으면 정서웰빙 결과는 나만 볼 수 있어요. 보호자에게는 어떤 경우에도 공유되지 않아요. 언제든 바꿀 수 있어요.',
  home_today_sched: '오늘의 시간표', home_no_sched: '오늘 예정된 시간표가 없어요.', home_wp: '이번 주 계획 이행 {g}/{n}칸',
  // 종합검사
  comp_test_title: '종합검사', comp_test_desc: '흥미·성격·가치관·학습역량·자기주도학습·정서웰빙 검사를 이어서 응시하고 하나의 종합 결과로 봐요. 중간에 멈추면 응답이 저장돼요.', items_n: '{n}문항',
  comp_sum: '{k}종 · {n}문항 · 약 {m}분', comp_start: '종합검사 시작', comp_resume: '이어서 하기', comp_restart: '처음부터 다시', comp_resume_info: '저장된 응답 {a}/{b}개가 있어요.', comp_step: '종합검사 {i}/{n}', comp_later: '나중에 이어서 하기',
  comp_title: '종합 결과', comp_intro: '검사를 종합해 나의 흥미·성향·가치관·학습역량·학습습관·마음 상태를 한눈에 봐요.', comp_done: '검사 완료', comp_missing: '아직 하지 않은 검사', comp_continue: '남은 검사 하러 가기', comp_retake: '검사 다시 하러 가기', comp_go: '종합검사 하러 가기', comp_view_report: '종합 결과 보기',
  comp_summary: '검사별 요약', comp_career_note: '추천은 흥미 유형을 바탕으로 한 예시예요. 실제 진로는 가치관, 학습 상황, 시장 정보와 함께 판단하세요.', comp_disclaimer: '이 결과는 참고용 자기보고 검사이며, 공인 검사나 의학·심리 진단이 아니에요. 결과에 얽매이지 말고 대화와 경험으로 확인해 보세요.',
  int_sec_interest: '흥미와 가치관', int_sec_careers: '어울리는 진로 예시', int_sec_style: '성향', int_sec_ability: '학습 역량', int_sec_habit: '학습 습관', int_sec_mind: '마음 상태',
  int_holland: '흥미 코드 {code}: {label} 유형이 가장 두드러져요.', int_values: '직업을 고를 때 {a}·{b}을(를) 특히 중요하게 여겨요.', int_persona: '성향은 "{p}"에 가까워요.',
  int_apt_strong: '학습역량은 {a}·{b} 영역이 강점이에요.', int_apt_weak: '{a} 영역({v}/5)은 보완하면 좋아요.',
  int_wb_0: '최근 마음 상태가 안정적이고 활력이 있어요.', int_wb_1: '전반적으로 괜찮지만 약간의 스트레스가 있어요. 쉬는 시간을 챙겨 주세요.', int_wb_2: '최근 마음이 많이 힘들 수 있어요. 믿을 수 있는 어른과 이야기해 보세요.',
  int_loose: '느슨한 관리', int_normal: '보통 관리', int_tight: '촘촘한 관리',
  // 시간표
  sch_title: '주간 시간표', sch_help: '빈 칸을 누르거나 마우스로 끌어서 시간을 선택하고, 블록을 누르면 수정할 수 있어요.', sch_label_ph: '블록 이름 (예: 수학 숙제)', sch_need_label: '블록 이름을 입력해 주세요.', sch_bad_range: '끝 시각은 시작보다 늦어야 해요.', sch_overlap: '같은 요일에 이미 다른 블록이 있어요.',
  sch_total: '주간 학습 시간 총 {n}시간', sch_empty: '아직 시간표가 비어 있어요.', sch_ai_title: 'AI 시간표 만들기', sch_ai_desc: '과목과 주당 학습 시간을 알려 주면 시간표와 주간 계획표 초안을 만들어요. 현재 시간표는 대체돼요.',
  sch_ai_subj_ph: '과목 (쉼표로 구분, 예: 수학, 영어)', sch_ai_btn: 'AI로 시간표 만들기', sch_ai_making: '만드는 중…', sch_ai_done: '{n}개의 시간표 블록을 만들었어요.', sch_ai_template: ' (AI 키가 없어 기본 템플릿으로 만들었어요)',
  // 주간계획
  wp_title: '주간 학습계획표', wp_help: '요일 칸을 눌러 이행 상태를 바꿔요 (완료 → 일부 → 미이행 → 비움). 모든 칸이 완료되면 이번 주를 제출할 수 있어요.', wp_done: '완료', wp_partial: '일부', wp_missed: '미이행', wp_subject: '과목', wp_kind: '구분', wp_detail: '세부 내용',
  wp_empty: '주간 계획이 비어 있어요. 과목을 추가하거나 시간표에서 가져오세요.', wp_submit: '이번 주 제출', wp_submit_hint: '모든 칸이 "완료"여야 제출할 수 있어요.', wp_add: '과목 추가', wp_from_schedule: '시간표의 과목 가져오기', wp_history: '제출 기록',
  // 목표
  goal_title: '목표·D-day', goal_label_ph: '예: TOPIK 4급, 기말고사, 자격증', goal_note_ph: '학사 일정·특이사항 메모', goal_date: '목표일', ms_title: '이정표', ms_ph: '이정표 (예: 모의고사)', ms_empty: '이정표를 추가해 보세요 (예: 모의고사, 원서 접수).',
  // 성적
  gr_title: '성적 추이', gr_trend_hint: '같은 과목의 성적이 2번 이상 쌓이면 변화 그래프가 나와요.', gr_empty: '아직 성적 기록이 없어요.', gr_date: '날짜', gr_subject: '과목', gr_score: '점수', gr_note: '메모', gr_add: '성적 추가', gr_score_ph: '예: 85 또는 42/50', gr_need: '과목과 점수를 입력해 주세요.',
  gr_csv_title: '여러 건 붙여넣기', gr_csv_help: '한 줄에 "과목,점수,날짜,메모" 순서로 붙여넣으세요. 날짜와 메모는 생략할 수 있어요.', gr_csv_ph: '수학,85,2026-09-15,중간고사', gr_csv_btn: '가져오기', gr_csv_done: '{n}건을 가져왔어요.', gr_csv_none: '가져올 줄이 없어요. "과목,점수" 형식으로 입력해 주세요.',
  // 리포트
  print_hint: '인쇄 창에서 "PDF로 저장"을 고르면 파일로 보관할 수 있어요.', doc_no: '문서번호', doc_date: '발급일', doc_name: '이름',
  stu_title: '나의 학습 리포트', stu_tasks: '목표 완료', stu_strengths: '나의 강점', stu_weak: '보완하면 좋은 점', stu_need_tests: '검사를 하면 강점과 보완점이 여기에 나와요.',
  rep_parent_title: '학부모용 학습 리포트', rep_diag_title: '종합 진단서', rep_status: '학습 현황', rep_checkin_lbl: '이번 주 출석', rep_checkins: '이번 주 출석 체크인 {n}회', rep_task_rate: '목표 완료율', rep_quiz_avg: '퀴즈 평균 {n}점',
  rep_tests: '검사 결과 요약', rep_intensity: '권장 관리 강도', rep_comment: '강사 코멘트', rep_next: '다음 주 학습 계획', rep_disclaimer: '이 문서는 자기보고식 검사와 학습 기록을 바탕으로 한 참고 자료이며, 공인 검사나 의학·심리 진단이 아닙니다.',
  dg_ai_title: 'AI 종합 진단서', dg_ai_desc: 'AI가 검사 결과·성적·시간표를 바탕으로 진단서 문장을 작성해요. 작성 전에도 아래 기본 해석은 볼 수 있어요.', dg_ai_btn: 'AI 진단서 작성', dg_ai_redo: 'AI 진단서 다시 작성', dg_making: 'AI가 작성하는 중…',
  dg_need_tests: '진단서를 만들려면 먼저 검사를 하나 이상 완료해 주세요.', dg_lang_diff: '저장된 AI 진단서는 다른 언어로 작성됐어요. 현재 언어로 보려면 다시 작성해 주세요.',
  dg_basic: '기본 정보', dg_goal_none: '목표 미입력', dg_purpose_h: '상담 목적', dg_purpose: '{g} 학습자로, 목표는 "{goal}"이에요. 검사 결과를 바탕으로 강점과 보완점을 정리하고 학습·진로 방향을 제안합니다.',
  dg_overall: '종합 총평', dg_subjects: '영역별 분석', dg_time_h: '시간 관리 분석', dg_methods: '학습 방법 가이드', dg_career_h: '진로 상담', dg_career: '흥미 유형에 어울리는 진로 예시: {c}.', dg_week: '이번 주 목표와 계획',
  dg_time: '주간 시간표에 확보된 학습 시간은 총 {total}시간(평일 {wk}시간, 주말 {we}시간), {days}일에 분포해 있어요.', dg_time_none: '아직 주간 시간표가 없어요. 시간표를 만들면 시간 관리 분석이 채워져요.',
  dg_time_low: '학습 시간이 적은 편이에요. 목표에 맞춰 주 5시간 이상을 목표로 조금씩 늘려 보세요.', dg_time_high: '학습 시간이 많은 편이에요. 휴식과 수면 시간도 함께 지켜 주세요.', dg_time_ok: '무리 없이 유지할 수 있는 수준이에요.',
  dg_sign_learner: '학습자 확인', dg_sign_teacher: '상담자 확인', dg_ai_note: 'AI가 작성한 내용이 포함돼 있어요. 전문가의 확인을 거쳐 활용하세요.', dg_rule_note: '이 진단서는 검사 결과 기반의 규칙 해석이에요. AI 진단서를 작성하면 더 자세해져요.',
  ta_title: '강사 조치 항목', ta_validity: '검사 응답 신뢰도 확인 필요 — 재검사하거나 응답 상황을 학생과 확인하세요.', ta_wellbeing: '정서웰빙 결과가 "주의 필요"예요 — 개별 면담을 권장해요. (진단이 아닌 참고 결과)',
  ta_idle: '최근 3일 이상 학습·출석 기록이 없어요. 연락해서 상황을 확인해 주세요.', ta_dday: 'D-{n} 임박 — "{label}" 준비 상황을 최종 점검하세요.', ta_tasks: '이번 주 목표 {d}/{n}건 완료 — 미완료 항목을 점검하세요.',
  ta_weekplan: '주간 계획표에 아직 이행하지 못한 칸이 있어요.', ta_ok: '현재 페이스를 유지해도 좋아요.', ta_note: '강사 코멘트', ta_note_help: '학부모용 리포트에 표시돼요.', ta_wb_h: '정서웰빙', ta_wb_shared: '학생이 공유에 동의한 정서웰빙 결과가 있어요. 종합 결과 탭에서 확인하세요.', ta_wb_hidden: '학생이 정서웰빙 결과 공유에 동의하지 않았거나 아직 검사 기록이 없어요.',
  // 강사 콘솔
  roster_title: '담당 학생', roster_search: '이름 검색', roster_all_teachers: '전체 강사', roster_watch_only: '개입 필요 학생만', roster_name: '이름', roster_goal: '목표', roster_tasks: '목표 완료', roster_status: '상태',
  roster_empty: '아직 담당 학생이 없어요. [학생 등록]에서 학생을 등록하거나 연결 코드를 입력해 주세요.', roster_none_match: '조건에 맞는 학생이 없어요.',
  flag_idle: '3일 이상 활동 없음', flag_validity: '검사 응답 확인 필요', flag_wellbeing: '정서웰빙 면담 권장', flag_dday: 'D-{n} 임박',
  ws_btn: '주간 마감 요약 복사', ws_head: '📋 주간 마감 요약 ({date}) — 학생 {n}명 · 정상 {ok}명 · 개입 필요 {w}명', ws_avg: '평균 주간 학습 {min}분 · 평균 출석 {ci}회', ws_watch: '개입 필요: {names}', ws_copied: '요약을 복사했어요.', ws_copy_manual: '자동 복사가 안 되면 위 내용을 직접 복사해 주세요.',
  reg_title: '학생 등록', reg_desc: '학생 계정을 대신 만들고 검사·계획·성적을 입력할 수 있어요.', reg_name: '학생 이름', reg_school: '학교/학년 (선택)', reg_note: '메모 (선택)', svc_study: '학습관리 이용', svc_career: '진로컨설팅 이용',
  reg_consent_note: '학생(또는 보호자)에게 학습 정보 수집·이용에 대한 동의를 받은 뒤 등록해 주세요. 만 14세 미만은 법정대리인 동의가 필요해요.', reg_btn: '학생 등록', reg_need_name: '이름을 입력해 주세요.', reg_done: '{name} 학생을 등록했어요.', reg_code: '활성화 코드',
  reg_code_help: '학생이 직접 로그인하려면 로그인 화면의 "학생 계정 활성화"에 이 코드를 입력하도록 안내해 주세요. 보호자도 이 코드로 연결할 수 있어요.',
  reset_title: '비밀번호 재설정', reset_desc: '비밀번호를 잊었다면 담당 강사나 관리자에게 재설정 코드를 받아 새 비밀번호를 정해요. 코드는 24시간 동안, 한 번만 쓸 수 있어요.', reset_code_ph: '재설정 코드', reset_btn: '비밀번호 바꾸기',
  reset_issue: '비밀번호 재설정 코드 발급', reset_issued: '{name}님의 재설정 코드: {code} (24시간 유효, 1회용) — 본인에게 직접 전달해 주세요.', acct_find_title: '계정 찾기 · 재설정 코드', acct_find_ph: '이름 또는 이메일 (2자 이상)', acct_find_btn: '검색', acct_none: '검색 결과가 없어요.',
  staff_last_admin: '마지막 관리자 계정은 변경하거나 삭제할 수 없어요.', staff_title: '강사 관리', staff_desc: '강사·관리자 계정을 추가·수정·삭제해요. 강사를 삭제해도 담당 학생 데이터는 남고 "미배정"이 돼요.', staff_add: '강사 추가', staff_students: '담당 학생 {n}명', staff_pw_reset: '새 비밀번호(변경할 때만)', staff_del_confirm: '정말 삭제',
});
UI.ko.role_teacher = '강사';
Object.assign(UI.vi, {
  tab_plan: 'Kế hoạch', tab_report: 'Báo cáo', tab_roster: 'Danh sách học viên', tab_register: 'Đăng ký học viên', tab_staff: 'Quản lý giáo viên',
  sub_schedule: 'Thời khóa biểu', sub_weekplan: 'Kế hoạch tuần', sub_goal: 'Mục tiêu · D-day', sub_grades: 'Điểm số', sub_comp: 'Kết quả tổng hợp', sub_student: 'Cho học viên', sub_parent: 'Cho phụ huynh', sub_diag: 'Bản chẩn đoán', sub_teacher: 'Cho giáo viên',
  kind_self: 'Tự học', kind_school: 'Bám sát chương trình trường', kind_extra: 'Ngoại khóa', gt_abroad: 'Du học · chứng chỉ', gt_school: 'Trường học · thi cử', gt_career: 'Việc làm · hướng nghiệp', gt_general: 'Phát triển bản thân',
  role_teacher: 'Giáo viên', role_admin: 'Quản trị viên', st_ok: 'Bình thường', st_watch: 'Cần can thiệp',
  btn_delete_item: 'Xóa', btn_edit: 'Sửa', btn_next_test: 'Bài tiếp theo', btn_open: 'Mở', btn_open_report: 'Xem báo cáo', btn_prev: 'Quay lại', btn_print: 'In', btn_reload: 'Tải lại', btn_save: 'Lưu', saved: 'Đã lưu.',
  back_list: 'Danh sách học viên', teacher_lbl: 'Phụ trách', unassigned: 'Chưa phân công', managed: 'Do giáo viên đăng ký', read_only: 'Chỉ xem',
  acc_staff_desc: 'Đây là tài khoản giáo viên/quản trị viên. Bạn quản lý học viên phụ trách trong Danh sách học viên.',
  ci_title: 'Điểm danh', ci_btn: 'Điểm danh', ci_done: 'Đã điểm danh hôm nay ({time})',
  claim_title: 'Kích hoạt tài khoản do giáo viên đăng ký', claim_desc: 'Nếu giáo viên đã đăng ký cho bạn, hãy dùng mã kích hoạt nhận được để tạo tài khoản đăng nhập của riêng bạn.', claim_code_ph: 'Mã kích hoạt (8 ký tự)', claim_btn: 'Kích hoạt tài khoản',
  co_btn: 'Chốt tuần (dọn mục đã xong)', co_hint: 'Dọn {d}/{n} mục đã hoàn thành và lưu lại lịch sử.', co_history: 'Các lần chốt trước',
  consent_title: 'Chia sẻ kết quả sức khỏe tinh thần', consent_wb: 'Cho phép giáo viên phụ trách biết khi kết quả sức khỏe tinh thần ở mức "Cần lưu ý"', consent_note: 'Nếu không cho phép, chỉ mình bạn xem được kết quả này. Kết quả này không bao giờ được chia sẻ cho phụ huynh. Bạn có thể đổi bất cứ lúc nào.',
  home_today_sched: 'Lịch học hôm nay', home_no_sched: 'Hôm nay chưa có lịch học nào.', home_wp: 'Kế hoạch tuần này đã thực hiện {g}/{n} ô',
  comp_test_title: 'Kiểm tra tổng hợp', comp_test_desc: 'Làm liên tiếp các bài về sở thích, tính cách, giá trị nghề nghiệp, năng lực học tập, tự học và sức khỏe tinh thần rồi xem trong một kết quả tổng hợp. Nếu dừng giữa chừng, câu trả lời sẽ được lưu.', items_n: '{n} câu',
  comp_sum: '{k} bài · {n} câu · khoảng {m} phút', comp_start: 'Bắt đầu kiểm tra tổng hợp', comp_resume: 'Làm tiếp', comp_restart: 'Làm lại từ đầu', comp_resume_info: 'Đã lưu {a}/{b} câu trả lời.', comp_step: 'Kiểm tra tổng hợp {i}/{n}', comp_later: 'Để làm tiếp sau',
  comp_title: 'Kết quả tổng hợp', comp_intro: 'Tổng hợp các bài kiểm tra để thấy sở thích, tính cách, giá trị, năng lực học tập, thói quen học và trạng thái tinh thần của bạn trong một cái nhìn.', comp_done: 'bài đã hoàn thành', comp_missing: 'Các bài chưa làm', comp_continue: 'Đi làm các bài còn lại', comp_retake: 'Đi làm lại bài kiểm tra', comp_go: 'Đi đến kiểm tra tổng hợp', comp_view_report: 'Xem kết quả tổng hợp',
  comp_summary: 'Tóm tắt từng bài', comp_career_note: 'Gợi ý dựa trên nhóm sở thích chỉ mang tính ví dụ. Hãy cân nhắc thêm giá trị bản thân, tình hình học tập và thông tin thị trường khi chọn nghề.', comp_disclaimer: 'Kết quả chỉ mang tính tham khảo từ bài tự đánh giá, không phải bài kiểm tra chuẩn hóa hay chẩn đoán y tế/tâm lý. Hãy đối chiếu với trò chuyện và trải nghiệm thực tế.',
  int_sec_interest: 'Sở thích và giá trị', int_sec_careers: 'Gợi ý nghề phù hợp', int_sec_style: 'Tính cách', int_sec_ability: 'Năng lực học tập', int_sec_habit: 'Thói quen học', int_sec_mind: 'Trạng thái tinh thần',
  int_holland: 'Mã sở thích {code}: nhóm {label} nổi bật nhất.', int_values: 'Khi chọn nghề, bạn đặc biệt coi trọng {a} và {b}.', int_persona: 'Tính cách gần với "{p}".',
  int_apt_strong: 'Năng lực học tập mạnh ở {a} và {b}.', int_apt_weak: 'Lĩnh vực {a} ({v}/5) nên được cải thiện thêm.',
  int_wb_0: 'Gần đây tâm trạng ổn định và tràn đầy năng lượng.', int_wb_1: 'Nhìn chung ổn nhưng có chút căng thẳng. Hãy dành thời gian nghỉ ngơi.', int_wb_2: 'Gần đây bạn có thể đang rất mệt mỏi trong lòng. Hãy trò chuyện với người lớn mà bạn tin tưởng.',
  int_loose: 'Quản lý lỏng', int_normal: 'Quản lý vừa', int_tight: 'Quản lý chặt',
  sch_title: 'Thời khóa biểu tuần', sch_help: 'Bấm vào ô trống hoặc kéo chuột để chọn giờ; bấm vào khối để chỉnh sửa.', sch_label_ph: 'Tên khối (VD: Bài tập Toán)', sch_need_label: 'Vui lòng nhập tên khối.', sch_bad_range: 'Giờ kết thúc phải muộn hơn giờ bắt đầu.', sch_overlap: 'Ngày này đã có khối khác trùng giờ.',
  sch_total: 'Tổng thời gian học trong tuần: {n} giờ', sch_empty: 'Thời khóa biểu còn trống.', sch_ai_title: 'Tạo thời khóa biểu bằng AI', sch_ai_desc: 'Cho biết môn học và số giờ học mỗi tuần, AI sẽ tạo bản nháp thời khóa biểu và kế hoạch tuần. Thời khóa biểu hiện tại sẽ bị thay thế.',
  sch_ai_subj_ph: 'Môn học (cách nhau bằng dấu phẩy, VD: Toán, Tiếng Anh)', sch_ai_btn: 'Tạo bằng AI', sch_ai_making: 'Đang tạo…', sch_ai_done: 'Đã tạo {n} khối thời khóa biểu.', sch_ai_template: ' (Chưa có khóa AI nên dùng mẫu cơ bản)',
  wp_title: 'Kế hoạch học tập tuần', wp_help: 'Bấm vào ô ngày để đổi trạng thái (Hoàn thành → Một phần → Chưa làm → Xóa). Khi tất cả ô đều hoàn thành, bạn có thể nộp tuần này.', wp_done: 'Hoàn thành', wp_partial: 'Một phần', wp_missed: 'Chưa làm', wp_subject: 'Môn', wp_kind: 'Loại', wp_detail: 'Nội dung',
  wp_empty: 'Kế hoạch tuần đang trống. Hãy thêm môn học hoặc lấy từ thời khóa biểu.', wp_submit: 'Nộp tuần này', wp_submit_hint: 'Cần tất cả ô ở trạng thái "Hoàn thành" mới nộp được.', wp_add: 'Thêm môn học', wp_from_schedule: 'Lấy môn từ thời khóa biểu', wp_history: 'Lịch sử đã nộp',
  goal_title: 'Mục tiêu · D-day', goal_label_ph: 'VD: TOPIK cấp 4, thi cuối kỳ, chứng chỉ', goal_note_ph: 'Ghi chú lịch học/lưu ý đặc biệt', goal_date: 'Ngày mục tiêu', ms_title: 'Cột mốc', ms_ph: 'Cột mốc (VD: thi thử)', ms_empty: 'Hãy thêm cột mốc (VD: thi thử, nộp hồ sơ).',
  gr_title: 'Biểu đồ điểm số', gr_trend_hint: 'Khi một môn có từ 2 điểm trở lên, biểu đồ thay đổi sẽ xuất hiện.', gr_empty: 'Chưa có điểm số nào.', gr_date: 'Ngày', gr_subject: 'Môn', gr_score: 'Điểm', gr_note: 'Ghi chú', gr_add: 'Thêm điểm', gr_score_ph: 'VD: 85 hoặc 42/50', gr_need: 'Vui lòng nhập môn và điểm.',
  gr_csv_title: 'Dán nhiều dòng', gr_csv_help: 'Mỗi dòng theo thứ tự "môn,điểm,ngày,ghi chú". Có thể bỏ trống ngày và ghi chú.', gr_csv_ph: 'Toán,85,2026-09-15,Giữa kỳ', gr_csv_btn: 'Nhập', gr_csv_done: 'Đã nhập {n} dòng.', gr_csv_none: 'Không có dòng nào để nhập. Hãy nhập theo dạng "môn,điểm".',
  print_hint: 'Trong hộp thoại in, chọn "Lưu dưới dạng PDF" để lưu thành tệp.', doc_no: 'Số văn bản', doc_date: 'Ngày cấp', doc_name: 'Họ tên',
  stu_title: 'Báo cáo học tập của tôi', stu_tasks: 'Mục tiêu hoàn thành', stu_strengths: 'Điểm mạnh của tôi', stu_weak: 'Điểm nên cải thiện', stu_need_tests: 'Sau khi làm bài kiểm tra, điểm mạnh và điểm cần cải thiện sẽ hiện ở đây.',
  rep_parent_title: 'Báo cáo học tập dành cho phụ huynh', rep_diag_title: 'Bản chẩn đoán tổng hợp', rep_status: 'Tình hình học tập', rep_checkin_lbl: 'Điểm danh tuần này', rep_checkins: 'Điểm danh tuần này: {n} lần', rep_task_rate: 'Tỷ lệ hoàn thành mục tiêu', rep_quiz_avg: 'Trắc nghiệm trung bình {n} điểm',
  rep_tests: 'Tóm tắt kết quả kiểm tra', rep_intensity: 'Mức quản lý đề xuất', rep_comment: 'Nhận xét của giáo viên', rep_next: 'Kế hoạch học tuần tới', rep_disclaimer: 'Tài liệu này là tham khảo dựa trên bài tự đánh giá và nhật ký học tập, không phải bài kiểm tra chuẩn hóa hay chẩn đoán y tế/tâm lý.',
  dg_ai_title: 'Chẩn đoán tổng hợp bằng AI', dg_ai_desc: 'AI viết nội dung chẩn đoán dựa trên kết quả kiểm tra, điểm số và thời khóa biểu. Phần diễn giải cơ bản bên dưới vẫn xem được khi chưa tạo.', dg_ai_btn: 'Tạo chẩn đoán bằng AI', dg_ai_redo: 'Tạo lại chẩn đoán bằng AI', dg_making: 'AI đang viết…',
  dg_need_tests: 'Cần hoàn thành ít nhất một bài kiểm tra để tạo bản chẩn đoán.', dg_lang_diff: 'Bản chẩn đoán AI đã lưu được viết bằng ngôn ngữ khác. Hãy tạo lại để xem bằng ngôn ngữ hiện tại.',
  dg_basic: 'Thông tin cơ bản', dg_goal_none: 'Chưa nhập mục tiêu', dg_purpose_h: 'Mục đích tư vấn', dg_purpose: 'Người học ({g}), mục tiêu là "{goal}". Dựa trên kết quả kiểm tra, tổng hợp điểm mạnh, điểm cần cải thiện và đề xuất hướng học tập, hướng nghiệp.',
  dg_overall: 'Nhận xét tổng quan', dg_subjects: 'Phân tích theo lĩnh vực', dg_time_h: 'Phân tích quản lý thời gian', dg_methods: 'Hướng dẫn phương pháp học', dg_career_h: 'Tư vấn hướng nghiệp', dg_career: 'Gợi ý nghề phù hợp với nhóm sở thích: {c}.', dg_week: 'Mục tiêu và kế hoạch tuần này',
  dg_time: 'Thời gian học đã xếp trong thời khóa biểu là {total} giờ/tuần (ngày thường {wk} giờ, cuối tuần {we} giờ), rải trong {days} ngày.', dg_time_none: 'Chưa có thời khóa biểu tuần. Khi tạo thời khóa biểu, phần phân tích thời gian sẽ được điền.',
  dg_time_low: 'Thời gian học còn ít. Hãy tăng dần lên trên 5 giờ mỗi tuần theo mục tiêu.', dg_time_high: 'Thời gian học khá nhiều. Đừng quên nghỉ ngơi và ngủ đủ giấc.', dg_time_ok: 'Đây là mức có thể duy trì không quá sức.',
  dg_sign_learner: 'Người học xác nhận', dg_sign_teacher: 'Người tư vấn xác nhận', dg_ai_note: 'Có nội dung do AI viết. Hãy dùng sau khi được chuyên gia kiểm tra.', dg_rule_note: 'Bản này là diễn giải theo quy tắc dựa trên kết quả kiểm tra. Tạo chẩn đoán bằng AI sẽ chi tiết hơn.',
  ta_title: 'Việc giáo viên cần làm', ta_validity: 'Cần kiểm tra độ tin cậy của câu trả lời — hãy cho làm lại hoặc trao đổi với học viên.', ta_wellbeing: 'Kết quả sức khỏe tinh thần ở mức "Cần lưu ý" — nên gặp riêng. (Chỉ là kết quả tham khảo, không phải chẩn đoán)',
  ta_idle: 'Đã hơn 3 ngày không có ghi nhận học tập/điểm danh. Hãy liên hệ để hỏi thăm.', ta_dday: 'Sắp đến D-{n} — hãy kiểm tra lần cuối việc chuẩn bị cho "{label}".', ta_tasks: 'Mục tiêu tuần này hoàn thành {d}/{n} — hãy kiểm tra các mục chưa xong.',
  ta_weekplan: 'Kế hoạch tuần còn ô chưa thực hiện.', ta_ok: 'Có thể giữ nhịp độ hiện tại.', ta_note: 'Nhận xét của giáo viên', ta_note_help: 'Sẽ hiển thị trong báo cáo dành cho phụ huynh.', ta_wb_h: 'Sức khỏe tinh thần', ta_wb_shared: 'Có kết quả sức khỏe tinh thần mà học viên đã đồng ý chia sẻ. Xem ở tab Kết quả tổng hợp.', ta_wb_hidden: 'Học viên chưa đồng ý chia sẻ kết quả sức khỏe tinh thần hoặc chưa có bài kiểm tra.',
  roster_title: 'Học viên phụ trách', roster_search: 'Tìm theo tên', roster_all_teachers: 'Tất cả giáo viên', roster_watch_only: 'Chỉ học viên cần can thiệp', roster_name: 'Tên', roster_goal: 'Mục tiêu', roster_tasks: 'Mục tiêu xong', roster_status: 'Trạng thái',
  roster_empty: 'Chưa có học viên phụ trách. Hãy đăng ký học viên ở [Đăng ký học viên] hoặc nhập mã kết nối.', roster_none_match: 'Không có học viên phù hợp điều kiện.',
  flag_idle: 'Hơn 3 ngày không hoạt động', flag_validity: 'Cần kiểm tra câu trả lời', flag_wellbeing: 'Nên gặp riêng về tinh thần', flag_dday: 'Sắp đến D-{n}',
  ws_btn: 'Sao chép tóm tắt chốt tuần', ws_head: '📋 Tóm tắt chốt tuần ({date}) — {n} học viên · bình thường {ok} · cần can thiệp {w}', ws_avg: 'Trung bình học {min} phút/tuần · điểm danh trung bình {ci} lần', ws_watch: 'Cần can thiệp: {names}', ws_copied: 'Đã sao chép bản tóm tắt.', ws_copy_manual: 'Nếu không tự sao chép được, hãy sao chép nội dung phía trên.',
  reg_title: 'Đăng ký học viên', reg_desc: 'Bạn có thể tạo tài khoản thay học viên và nhập kết quả kiểm tra, kế hoạch, điểm số.', reg_name: 'Tên học viên', reg_school: 'Trường/lớp (không bắt buộc)', reg_note: 'Ghi chú (không bắt buộc)', svc_study: 'Dùng dịch vụ quản lý học tập', svc_career: 'Dùng dịch vụ tư vấn hướng nghiệp',
  reg_consent_note: 'Hãy đăng ký sau khi đã được học viên (hoặc phụ huynh) đồng ý cho thu thập và sử dụng thông tin học tập. Trẻ dưới 14 tuổi cần có sự đồng ý của người đại diện hợp pháp.', reg_btn: 'Đăng ký học viên', reg_need_name: 'Vui lòng nhập tên.', reg_done: 'Đã đăng ký học viên {name}.', reg_code: 'Mã kích hoạt',
  reg_code_help: 'Để học viên tự đăng nhập, hãy hướng dẫn nhập mã này vào mục "Kích hoạt tài khoản" ở màn hình đăng nhập. Phụ huynh cũng có thể kết nối bằng mã này.',
  reset_title: 'Đặt lại mật khẩu', reset_desc: 'Nếu quên mật khẩu, hãy nhận mã đặt lại từ giáo viên phụ trách hoặc quản trị viên rồi đặt mật khẩu mới. Mã có hiệu lực 24 giờ và chỉ dùng được một lần.', reset_code_ph: 'Mã đặt lại', reset_btn: 'Đổi mật khẩu',
  reset_issue: 'Cấp mã đặt lại mật khẩu', reset_issued: 'Mã đặt lại của {name}: {code} (hiệu lực 24 giờ, dùng một lần) — hãy đưa trực tiếp cho người đó.', acct_find_title: 'Tìm tài khoản · mã đặt lại', acct_find_ph: 'Tên hoặc email (từ 2 ký tự)', acct_find_btn: 'Tìm', acct_none: 'Không có kết quả.',
  staff_last_admin: 'Không thể thay đổi hoặc xóa tài khoản quản trị viên cuối cùng.', staff_title: 'Quản lý giáo viên', staff_desc: 'Thêm, sửa, xóa tài khoản giáo viên và quản trị viên. Khi xóa giáo viên, dữ liệu học viên phụ trách vẫn được giữ và chuyển thành "Chưa phân công".', staff_add: 'Thêm giáo viên', staff_students: 'Phụ trách {n} học viên', staff_pw_reset: 'Mật khẩu mới (chỉ khi cần đổi)', staff_del_confirm: 'Xác nhận xóa',
});

Object.assign(UI.ko, {
  tab_messages: '메시지', tab_counsel: '상담일지', flag_msg: '답변 대기',
  msg_title: '메시지', msg_help: '담당 강사 {name} 선생님께 질문을 남기면 답변을 받을 수 있어요.', msg_help_staff: '{name} 학생과의 대화예요. 피드백이나 응원을 남겨 주세요. 보호자에게는 보이지 않아요.', msg_no_teacher: '아직 담당 강사가 없어요. 담당 강사가 연결되면 이곳에서 대화할 수 있어요.', msg_empty: '아직 대화가 없어요.', msg_ph: '메시지를 입력하세요',
  cn_title: '상담일지', cn_help: '강사·관리자만 볼 수 있는 내부 기록이에요. 학생과 보호자에게는 보이지 않아요.', cn_ph: '상담 내용, 관찰한 점, 다음 계획…', cn_empty: '아직 기록이 없어요.', cn_need: '내용을 입력해 주세요.',
  home_career: '진로·검사', home_comp_progress: '종합검사 {a}/{b}종 완료', heat_title: '학습 달력', heat_hint: '최근 12주 · 색이 진할수록 많이 공부했어요',
  bd_title: '나의 배지', bd_checkin: '첫 출석', bd_streak3: '3일 연속', bd_streak7: '7일 연속', bd_streak30: '30일 연속', bd_test1: '첫 검사', bd_comp: '종합검사 완료', bd_goal: '목표 세우기', bd_sched: '시간표 만들기', bd_weekplan: '주간 제출', bd_quiz: '첫 퀴즈', bd_hours10: '10시간 공부',
  theme_auto: '테마: 자동', theme_light: '테마: 라이트', theme_dark: '테마: 다크',
  csv_btn: 'CSV 내려받기', csv_name: '이름', csv_group: '구분', csv_teacher: '담당', csv_goal: '목표', csv_dday: 'D-day', csv_streak: '연속학습(일)', csv_week: '최근7일(분)', csv_done: '완료 목표', csv_total: '전체 목표', csv_checkin: '이번주 출석', csv_status: '상태', csv_reasons: '사유',
});
Object.assign(UI.vi, {
  tab_messages: 'Tin nhắn', tab_counsel: 'Nhật ký tư vấn', flag_msg: 'Chờ trả lời',
  msg_title: 'Tin nhắn', msg_help: 'Bạn có thể để lại câu hỏi cho giáo viên phụ trách {name} và nhận câu trả lời.', msg_help_staff: 'Đây là cuộc trò chuyện với học viên {name}. Hãy để lại phản hồi hoặc lời động viên. Phụ huynh không thấy được.', msg_no_teacher: 'Chưa có giáo viên phụ trách. Khi được kết nối, bạn có thể trò chuyện ở đây.', msg_empty: 'Chưa có cuộc trò chuyện nào.', msg_ph: 'Nhập tin nhắn',
  cn_title: 'Nhật ký tư vấn', cn_help: 'Ghi chú nội bộ chỉ giáo viên/quản trị viên xem được. Học viên và phụ huynh không thấy.', cn_ph: 'Nội dung tư vấn, điều quan sát được, kế hoạch tiếp theo…', cn_empty: 'Chưa có ghi chú.', cn_need: 'Vui lòng nhập nội dung.',
  home_career: 'Hướng nghiệp · Kiểm tra', home_comp_progress: 'Kiểm tra tổng hợp: xong {a}/{b} bài', heat_title: 'Lịch học tập', heat_hint: '12 tuần gần đây · màu càng đậm càng học nhiều',
  bd_title: 'Huy hiệu của tôi', bd_checkin: 'Điểm danh đầu tiên', bd_streak3: '3 ngày liên tiếp', bd_streak7: '7 ngày liên tiếp', bd_streak30: '30 ngày liên tiếp', bd_test1: 'Bài kiểm tra đầu tiên', bd_comp: 'Xong kiểm tra tổng hợp', bd_goal: 'Đặt mục tiêu', bd_sched: 'Lập thời khóa biểu', bd_weekplan: 'Nộp kế hoạch tuần', bd_quiz: 'Trắc nghiệm đầu tiên', bd_hours10: 'Học 10 giờ',
  theme_auto: 'Giao diện: tự động', theme_light: 'Giao diện: sáng', theme_dark: 'Giao diện: tối',
  csv_btn: 'Tải CSV', csv_name: 'Họ tên', csv_group: 'Nhóm', csv_teacher: 'Phụ trách', csv_goal: 'Mục tiêu', csv_dday: 'D-day', csv_streak: 'Ngày học liên tiếp', csv_week: '7 ngày qua (phút)', csv_done: 'Mục tiêu xong', csv_total: 'Tổng mục tiêu', csv_checkin: 'Điểm danh tuần này', csv_status: 'Trạng thái', csv_reasons: 'Lý do',
});

// 해석 팁 (종합 결과·진단서의 규칙 기반 문장)
CONTENT.ko.tips = {
  bigfive: { O: '새로운 분야를 탐색하는 프로젝트·동아리·체험에 도전해 보세요.', C: '계획과 마감을 지키는 강점을 살려 장기 목표를 단계별로 세워 보세요.', E: '발표·토론·팀 활동에서 강점이 드러나요. 사람과 함께하는 진로를 살펴보세요.', A: '협력과 배려가 강점이에요. 팀워크가 중요한 환경에서 빛나요.', N: '스트레스 상황에서도 안정적이에요. 압박이 큰 도전에도 잘 대응할 수 있어요.' },
  aptitude: { lang: '매일 짧은 글을 읽고 핵심 문장을 한 줄로 요약해 보세요.', math: '기초 연산과 단위 변환을 매일 10분씩 반복해 보세요.', spatial: '지도·도면을 보며 방향과 위치를 말로 설명하는 연습을 해 보세요.', social: '친구·동료의 이야기를 끝까지 듣고 감정을 한마디로 짚어 보는 연습을 해 보세요.', logic: '규칙 찾기·순서 추리 문제를 하루 한두 개씩 풀어 보세요.', creative: '같은 물건의 새로운 쓰임새를 3가지씩 적어 보는 습관을 들여 보세요.' },
  sdl: { plan: '주간 계획표에 하루 2~3개 핵심 과제만 적고, 우선순위를 표시해 보세요.', monitor: '공부 후 5분 동안 "오늘 이해한 것/모르는 것"을 적어 스스로 점검해 보세요.', goal: '큰 목표를 주 단위 작은 목표로 쪼개서 이정표에 적어 두세요.', persist: '의욕이 낮은 날은 15분만 하기로 규칙을 정하고, 끝나면 체크해 보세요.' },
  sdlBand: ['스스로 계획하고 실행하는 힘이 강해요. 도전적인 목표를 스스로 세워 보세요.', '학습 습관이 안정적이에요. 계획표와 점검 습관을 유지해 보세요.', '보통 수준이에요. 주간 계획표와 체크리스트로 관리하면 더 좋아져요.', '스스로 계획하기가 어려운 편이에요. 짧은 목표부터 강사·보호자와 함께 자주 점검해 주세요.'],
};
CONTENT.vi.tips = {
  bigfive: { O: 'Hãy thử sức với các dự án, câu lạc bộ, trải nghiệm ở lĩnh vực mới.', C: 'Phát huy thế mạnh giữ kế hoạch và hạn chót để đặt mục tiêu dài hạn theo từng bước.', E: 'Thế mạnh thể hiện ở thuyết trình, thảo luận, làm việc nhóm. Hãy xem xét những nghề làm việc cùng nhiều người.', A: 'Hợp tác và quan tâm người khác là thế mạnh. Bạn tỏa sáng trong môi trường đề cao tinh thần đồng đội.', N: 'Bạn giữ được sự ổn định ngay cả khi căng thẳng, có thể đối mặt tốt với những thử thách áp lực cao.' },
  aptitude: { lang: 'Mỗi ngày đọc một đoạn ngắn và tóm tắt ý chính trong một câu.', math: 'Luyện các phép tính cơ bản và đổi đơn vị mỗi ngày 10 phút.', spatial: 'Nhìn bản đồ, sơ đồ rồi tập mô tả bằng lời hướng đi và vị trí.', social: 'Tập nghe hết câu chuyện của bạn bè, đồng nghiệp và gọi tên cảm xúc của họ bằng một câu.', logic: 'Mỗi ngày giải một hai bài tìm quy luật hoặc suy luận thứ tự.', creative: 'Tập thói quen viết ra 3 cách dùng mới cho cùng một đồ vật.' },
  sdl: { plan: 'Trong kế hoạch tuần, mỗi ngày chỉ ghi 2–3 việc chính và đánh dấu thứ tự ưu tiên.', monitor: 'Sau khi học, dành 5 phút ghi "hôm nay hiểu gì/chưa hiểu gì" để tự kiểm tra.', goal: 'Chia mục tiêu lớn thành mục tiêu nhỏ theo tuần và ghi vào cột mốc.', persist: 'Những ngày thiếu động lực, đặt quy tắc chỉ học 15 phút rồi tự đánh dấu hoàn thành.' },
  sdlBand: ['Khả năng tự lập kế hoạch và thực hiện rất mạnh. Hãy tự đặt những mục tiêu thử thách hơn.', 'Thói quen học ổn định. Hãy duy trì kế hoạch và thói quen tự kiểm tra.', 'Ở mức trung bình. Quản lý bằng kế hoạch tuần và danh sách việc cần làm sẽ giúp tốt hơn.', 'Bạn còn khó tự lập kế hoạch. Hãy bắt đầu từ mục tiêu ngắn và thường xuyên kiểm tra cùng giáo viên/phụ huynh.'],
};

// 학생 입력(올인원)·일괄 등록 문구
Object.assign(UI.ko, {
  tab_input: '학생 입력', in_title: '학생 정보 입력', in_help: '한 화면에서 기본 정보, 목표, 검사 결과, 성적, 시간표, 주간계획, 할 일, 진단서까지 모두 입력·수정할 수 있어요.',
  in_s_basic: '기본 정보', in_s_goal: '목표·D-day', in_s_tests: '검사 결과 직접 입력', in_s_grades: '성적', in_s_sched: '시간표', in_s_wp: '주간 학습계획', in_s_tasks: '할 일', in_s_diag: '진단서',
  ot_none: '운영 모델 (선택 안 함)', ot_language: '어학원', ot_studyroom: '공부방', ot_consultant: '학습 컨설턴트',
  in_teacher: '담당 강사', in_code: '활성화 코드', in_has_account: '이 학생은 직접 가입한 계정이에요.', in_delete: '학생 삭제', in_delete_confirm: '정말 삭제할까요? 되돌릴 수 없어요.',
  mt_help: '종이 검사나 외부 검사 결과를 영역별 1~5점으로 입력하면 리포트에 반영돼요.', mt_none: '결과 없음', mt_save: '결과 저장', mt_del_last: '마지막 결과 삭제', mt_need: '모든 영역에 1~5점을 입력해 주세요.',
  dgi_help: '진단서를 직접 작성하거나, AI로 초안을 만든 뒤 고칠 수 있어요.', dgi_ai: 'AI로 초안 채우기', dgi_before: '이전 상황', dgi_insight: '핵심 통찰', dgi_int_label: '학습 강도', dgi_int_reason: '강도 이유',
  dgi_subjects: '과목별 분석', dgi_subjects_ph: '한 줄에 하나: 과목: 내용', dgi_methods: '학습 방법', dgi_methods_ph: '한 줄에 하나: 항목: 내용', dgi_checklist: '체크리스트', dgi_checklist_ph: '한 줄에 하나', dgi_view: '진단서 보기',
  sch_ai_existing_ph: '이미 있는 일정(학교·학원 등)을 적어 주세요. AI가 그 시간을 피해 짜 줘요.',
  bulk_title: '일괄 등록 (CSV·엑셀 붙여넣기)', bulk_help: '한 줄에 한 명. 열: 이름, 학년구분(elementary/middle/high/college/adult), 학교, 목표, 목표일(YYYY-MM-DD)',
  bulk_example: '예시', bulk_preview: '미리보기', bulk_go: '일괄 등록하기', bulk_done: '{n}명 등록 완료', bulk_codes: '활성화 코드 CSV 받기',
  reg_continue: '이어서 입력하기', reg_to_list: '목록으로', reg_org: '운영 모델',
});
Object.assign(UI.vi, {
  tab_input: 'Nhập thông tin', in_title: 'Nhập thông tin học viên', in_help: 'Nhập và chỉnh sửa trên một màn hình: thông tin cơ bản, mục tiêu, kết quả kiểm tra, điểm số, thời khóa biểu, kế hoạch tuần, việc cần làm, bản chẩn đoán.',
  in_s_basic: 'Thông tin cơ bản', in_s_goal: 'Mục tiêu · D-day', in_s_tests: 'Nhập kết quả kiểm tra', in_s_grades: 'Điểm số', in_s_sched: 'Thời khóa biểu', in_s_wp: 'Kế hoạch học tuần', in_s_tasks: 'Việc cần làm', in_s_diag: 'Bản chẩn đoán',
  ot_none: 'Mô hình vận hành (không chọn)', ot_language: 'Trung tâm ngoại ngữ', ot_studyroom: 'Lớp học kèm tại nhà', ot_consultant: 'Cố vấn học tập',
  in_teacher: 'Giáo viên phụ trách', in_code: 'Mã kích hoạt', in_has_account: 'Học viên này tự đăng ký tài khoản.', in_delete: 'Xóa học viên', in_delete_confirm: 'Bạn chắc chắn muốn xóa? Không thể hoàn tác.',
  mt_help: 'Nhập kết quả bài kiểm tra giấy hoặc bên ngoài theo từng lĩnh vực (1–5 điểm) để phản ánh vào báo cáo.', mt_none: 'Chưa có kết quả', mt_save: 'Lưu kết quả', mt_del_last: 'Xóa kết quả gần nhất', mt_need: 'Hãy nhập 1–5 điểm cho tất cả lĩnh vực.',
  dgi_help: 'Bạn có thể tự viết bản chẩn đoán hoặc tạo bản nháp bằng AI rồi chỉnh sửa.', dgi_ai: 'Điền bản nháp bằng AI', dgi_before: 'Tình hình trước đây', dgi_insight: 'Nhận định chính', dgi_int_label: 'Cường độ học', dgi_int_reason: 'Lý do cường độ',
  dgi_subjects: 'Phân tích theo môn', dgi_subjects_ph: 'Mỗi dòng một mục: môn: nội dung', dgi_methods: 'Phương pháp học', dgi_methods_ph: 'Mỗi dòng một mục: tiêu đề: nội dung', dgi_checklist: 'Danh sách kiểm tra', dgi_checklist_ph: 'Mỗi dòng một mục', dgi_view: 'Xem bản chẩn đoán',
  sch_ai_existing_ph: 'Ghi các lịch đã có (trường, lớp học thêm...). AI sẽ xếp lịch tránh các giờ đó.',
  bulk_title: 'Đăng ký hàng loạt (dán CSV/Excel)', bulk_help: 'Mỗi dòng một học viên. Cột: tên, nhóm (elementary/middle/high/college/adult), trường, mục tiêu, ngày mục tiêu (YYYY-MM-DD)',
  bulk_example: 'Ví dụ', bulk_preview: 'Xem trước', bulk_go: 'Đăng ký hàng loạt', bulk_done: 'Đã đăng ký {n} học viên', bulk_codes: 'Tải CSV mã kích hoạt',
  reg_continue: 'Tiếp tục nhập thông tin', reg_to_list: 'Về danh sách', reg_org: 'Mô hình vận hành',
});

// 운영(기관 정보·학부모 링크·저장 알림·일괄 메시지·시작 안내·AI 검사 해석·재진단 회차)
Object.assign(UI.ko, {
  org_title: '기관 정보', org_help: '기관(학원) 이름과 연락처를 넣으면 화면 제목, 리포트·진단서 머리글, 개인정보 처리방침에 표시돼요.', org_name: '기관 이름 (예: ○○어학원)', org_phone: '대표 전화', org_email: '문의 이메일',
  pl_title: '학부모 공유 링크', pl_help: '로그인 없이 학부모가 이 학생의 학습 리포트만 읽을 수 있는 링크예요. (정서웰빙·상담일지·메시지는 포함되지 않아요.) 다시 발급하면 이전 링크는 못 써요.',
  pl_issue: '링크 만들기', pl_reissue: '다시 발급', pl_copy: '링크 복사', pl_copied: '복사했어요.', pl_copy_fail: '복사하지 못했어요. 직접 선택해서 복사해 주세요.', pl_revoke: '링크 끄기',
  pl_msg: '{name} 학생의 학습 리포트예요: {url}', pl_copy_msg: '안내 문구 복사', pp_bad: '링크를 열 수 없어요', pp_bad_help: '링크가 바뀌었거나 사용이 중지됐어요. 담당 선생님께 새 링크를 요청해 주세요.',
  save_ok: '저장됨', save_fail: '저장하지 못했어요. 인터넷 연결을 확인해 주세요. 내용은 이 기기에 남아 있고 자동으로 다시 시도해요.',
  dgr_change: '이전 진단 대비 변화', dgr_pick: '회차 보기 (총 {n}회):', dgr_first: '초기', dgr_n: '제{n}차', dgr_latest: '(최신)',
  aid_title: 'AI 상세 해석', aid_help: '이 검사 결과를 AI가 더 자세히 풀어 줘요. (기본 해석은 위에 이미 있어요.)', aid_btn: 'AI로 자세히 보기', aid_redo: '다시 해석', aid_strengths: '강점', aid_cautions: '주의할 점', aid_tips: '이렇게 해 보세요',
  today_title: '오늘 살펴볼 학생', tile_dday: 'D-day 임박',
  bm_title: '선택한 학생에게 메시지 보내기', bm_help: '위 표에서 체크한 학생 {n}명에게 같은 메시지를 보내요. (공지, 숙제 안내 등)', bm_send: '메시지 보내기', bm_need: '학생을 선택하고 메시지를 입력해 주세요.', bm_done: '{ok}/{n}명에게 보냈어요.',
  qs_title: '처음 시작하기', qs_help: '아래 순서대로 하면 바로 운영을 시작할 수 있어요.', qs1: '기관 이름·연락처 입력 (계정 탭)', qs2: '강사 계정 만들기 (강사 관리)', qs3: '학생 등록 (한 명씩 또는 일괄)', qs4: '학생 열어서 검사·목표·시간표 입력하고, 학부모 링크 보내기', qs_go: '이동',
  agree_label: '개인정보 수집·이용에 동의합니다', agree_link: '처리방침 보기', agree_need: '개인정보 수집·이용에 동의해 주세요.',
});
Object.assign(UI.vi, {
  org_title: 'Thông tin đơn vị', org_help: 'Nhập tên và liên hệ của trung tâm để hiển thị ở tiêu đề, phần đầu báo cáo/bản chẩn đoán và chính sách bảo mật.', org_name: 'Tên đơn vị (VD: Trung tâm ○○)', org_phone: 'Điện thoại', org_email: 'Email liên hệ',
  pl_title: 'Liên kết chia sẻ cho phụ huynh', pl_help: 'Liên kết giúp phụ huynh đọc báo cáo học tập của học viên mà không cần đăng nhập. (Không gồm sức khỏe tinh thần, nhật ký tư vấn, tin nhắn.) Cấp lại thì liên kết cũ sẽ không dùng được.',
  pl_issue: 'Tạo liên kết', pl_reissue: 'Cấp lại', pl_copy: 'Sao chép liên kết', pl_copied: 'Đã sao chép.', pl_copy_fail: 'Không sao chép được. Hãy chọn và sao chép thủ công.', pl_revoke: 'Tắt liên kết',
  pl_msg: 'Báo cáo học tập của {name}: {url}', pl_copy_msg: 'Sao chép nội dung thông báo', pp_bad: 'Không mở được liên kết', pp_bad_help: 'Liên kết đã thay đổi hoặc bị tắt. Vui lòng xin giáo viên phụ trách liên kết mới.',
  save_ok: 'Đã lưu', save_fail: 'Không lưu được. Hãy kiểm tra kết nối mạng. Nội dung vẫn còn trên thiết bị này và sẽ tự thử lại.',
  dgr_change: 'Thay đổi so với lần chẩn đoán trước', dgr_pick: 'Xem theo lần (tổng {n} lần):', dgr_first: 'Ban đầu', dgr_n: 'Lần {n}', dgr_latest: '(mới nhất)',
  aid_title: 'Diễn giải chi tiết bằng AI', aid_help: 'AI sẽ diễn giải chi tiết hơn kết quả này. (Diễn giải cơ bản đã có ở trên.)', aid_btn: 'Xem chi tiết bằng AI', aid_redo: 'Diễn giải lại', aid_strengths: 'Điểm mạnh', aid_cautions: 'Điểm cần lưu ý', aid_tips: 'Hãy thử như sau',
  today_title: 'Học viên cần chú ý hôm nay', tile_dday: 'Sắp đến D-day',
  bm_title: 'Gửi tin nhắn cho học viên đã chọn', bm_help: 'Gửi cùng một tin nhắn cho {n} học viên đã tích ở bảng trên. (Thông báo, bài tập...)', bm_send: 'Gửi tin nhắn', bm_need: 'Hãy chọn học viên và nhập tin nhắn.', bm_done: 'Đã gửi cho {ok}/{n} học viên.',
  qs_title: 'Bắt đầu nhanh', qs_help: 'Làm theo thứ tự dưới đây là có thể vận hành ngay.', qs1: 'Nhập tên và liên hệ đơn vị (tab Tài khoản)', qs2: 'Tạo tài khoản giáo viên (Quản lý giáo viên)', qs3: 'Đăng ký học viên (từng người hoặc hàng loạt)', qs4: 'Mở học viên để nhập kiểm tra, mục tiêu, thời khóa biểu và gửi liên kết cho phụ huynh', qs_go: 'Đi tới',
  agree_label: 'Tôi đồng ý cho thu thập và sử dụng thông tin cá nhân', agree_link: 'Xem chính sách', agree_need: 'Vui lòng đồng ý thu thập và sử dụng thông tin cá nhân.',
});

// 컨설팅 운영: 문진·커리어·반/출결·데이터 현황·상담 세션
Object.assign(UI.ko, {
  tab_classes: '반·출결', tab_data: '데이터', tab_career: '커리어',
  in_s_intake: '상담 문진', in_s_attend: '출결', in_s_career: '커리어(성인·대학생)',
  att_p: '출석', att_l: '지각', att_a: '결석', att_e: '사유결석', att_help: '수업 출결을 날짜별로 기록해요. 학부모 리포트에 최근 30일 출석률이 나와요.', att_rate30: '최근 30일 출석률', att_none: '아직 출결 기록이 없어요.',
  ns_title: '다음 상담', ns_today: '오늘이에요', ns_in: '{n}일 남았어요', ns_label: '다음 상담일',
  intake_help: '첫 상담에서 들은 내용을 정리해요. 상담과 AI 진단서의 바탕이 돼요.', intake_concern: '가장 큰 고민', intake_goal: '바라는 것(목표)', intake_strengths: '강점·잘하는 것', intake_interests: '관심·좋아하는 것', intake_habits: '학습·생활 습관', intake_background: '배경(가정·학교·경력 등)',
  cr_profile: '커리어 프로필', cr_help: '현재 하는 일과 가고 싶은 방향을 적어요. 성인·대학생 상담의 출발점이에요.', cr_job: '현재 직무/전공', cr_industry: '업종/분야', cr_years: '경력(년)', cr_target: '희망 직무', cr_tindustry: '희망 업종', cr_skills: '보유 역량 (쉼표로 구분)', cr_motive: '이직·진로 전환 이유', cr_constraints: '제약 조건 (시간·지역·연봉 등)',
  jb_title: '지원 현황', jb_help: '지원한 곳과 진행 상황을 한눈에 봐요.', jb_empty: '아직 지원 기록이 없어요.', jb_company: '회사/기관', jb_role: '직무', jb_note: '메모',
  jb_interested: '관심', jb_applied: '지원함', jb_interview: '면접', jb_offer: '합격/오퍼', jb_rejected: '불합격', jb_closed: '종료',
  cls_none: '(반 없음)', cls_title: '반별 출결', cls_help: '반과 날짜를 고르고 학생별로 출석·지각·결석을 누른 뒤 저장하세요. 반 이름은 학생 입력 > 기본 정보에서 정해요.', cls_empty: '학생을 등록하고 기본 정보에 반 이름을 넣으면 여기에 나타나요.', cls_all_present: '전원 출석', cls_today: '이 날짜', cls_overview: '반 현황', cls_name: '반', cls_n: '인원',
  cls_nochange: '바뀐 내용이 없어요.', cls_saved: '{n}명 저장했어요.', cls_ph: '반 이름 (예: 고1 영어반)', cls_all: '전체 반', cls_show_left: '퇴원 학생 포함',
  en_active: '재원', en_paused: '휴원', en_left: '퇴원', par_name: '보호자 이름', par_phone: '보호자 연락처',
  consent_rs: '개인을 알 수 없게 통계로 활용하는 것에 동의', consent_rs_note: '동의하면 이름 없이 검사 점수만 모아 기관의 통계·연구에 쓸 수 있어요. 언제든 철회할 수 있어요.',
  cn_topic: '상담 주제 (예: 유학 준비)', cn_actions_ph: '학생 과제 (한 줄에 하나, 최대 5개)', cn_send_tasks: '과제를 학생의 할 일로 보내기',
  rep_att: '최근 30일 출석률 {rate}% (출석 {p} · 지각 {l} · 결석 {a})',
  an_title: '데이터 현황', an_help: '검사·상담·출결이 얼마나 쌓였는지 보여줘요. (개인 정보 없이 숫자만)', an_students: '학생 수', an_complete: '검사 5종 완료', an_active: '최근 7일 활동',
  an_goal_title: '데이터 목표', an_goal_now: '검사 5종을 모두 마친 학생 {a}명 / 다음 목표 {b}명', an_lv1: '10명: 시범 운영의 최소선 — 검사가 잘 돌아가는지, 강사 업무가 되는지 확인', an_lv2: '30명: 기관 평균과 개인을 비교하는 참고치를 볼 수 있음', an_lv3: '100명 이상: 연령·유형별 기관 기준값(규준)을 논할 수 있음',
  an_caveat: '※ 10명은 통계적 결론을 내릴 수 있는 수가 아니에요. 기관 내부 참고용이며, 규준·연구 결과로 발표하려면 더 많은 표본과 전문가 검토가 필요해요.',
  an_tests: '검사별 현황', an_test: '검사', an_avg: '평균(5점)', an_retake: '재검사', an_invalid: '신뢰도 경고', an_records: '기록 현황',
  an_r_goal: '목표를 입력한 학생 {n}명', an_r_grades: '성적을 입력한 학생 {n}명', an_r_sessions: '상담 기록이 있는 학생 {n}명 (총 {s}건)', an_r_diag: '진단서가 있는 학생 {n}명', an_r_retest: '재검사한 학생 {n}명', an_r_att: '출결 기록 {n}건', an_r_research: '통계 활용에 동의한 학생 {n}명',
  an_groups: '연령·구분별', an_export: '동의한 학생 데이터 내려받기 (CSV)', an_export_note: '이름·학교·목표 없이 무작위 번호와 검사 점수만 나가고, 통계 활용에 동의한 학생만 포함돼요. 정서웰빙은 제외돼요.', an_exported: '{n}명의 데이터를 내려받았어요.',
});
Object.assign(UI.vi, {
  tab_classes: 'Lớp · Điểm danh', tab_data: 'Dữ liệu', tab_career: 'Nghề nghiệp',
  in_s_intake: 'Phiếu tư vấn ban đầu', in_s_attend: 'Điểm danh', in_s_career: 'Nghề nghiệp (người lớn/sinh viên)',
  att_p: 'Có mặt', att_l: 'Đi muộn', att_a: 'Vắng', att_e: 'Vắng có phép', att_help: 'Ghi điểm danh theo ngày. Báo cáo cho phụ huynh sẽ hiển thị tỷ lệ đi học 30 ngày gần nhất.', att_rate30: 'Tỷ lệ đi học 30 ngày', att_none: 'Chưa có dữ liệu điểm danh.',
  ns_title: 'Buổi tư vấn tiếp theo', ns_today: 'Hôm nay', ns_in: 'Còn {n} ngày', ns_label: 'Ngày tư vấn tiếp theo',
  intake_help: 'Ghi lại nội dung nghe được ở buổi tư vấn đầu tiên. Đây là nền tảng cho tư vấn và bản chẩn đoán AI.', intake_concern: 'Băn khoăn lớn nhất', intake_goal: 'Mong muốn (mục tiêu)', intake_strengths: 'Điểm mạnh', intake_interests: 'Sở thích, quan tâm', intake_habits: 'Thói quen học tập, sinh hoạt', intake_background: 'Bối cảnh (gia đình, trường, kinh nghiệm...)',
  cr_profile: 'Hồ sơ nghề nghiệp', cr_help: 'Ghi công việc hiện tại và hướng muốn đi. Đây là điểm khởi đầu của buổi tư vấn cho người lớn/sinh viên.', cr_job: 'Công việc/chuyên ngành hiện tại', cr_industry: 'Ngành/lĩnh vực', cr_years: 'Kinh nghiệm (năm)', cr_target: 'Vị trí mong muốn', cr_tindustry: 'Ngành mong muốn', cr_skills: 'Năng lực hiện có (cách nhau bằng dấu phẩy)', cr_motive: 'Lý do đổi việc/chuyển hướng', cr_constraints: 'Ràng buộc (thời gian, khu vực, lương...)',
  jb_title: 'Tình hình ứng tuyển', jb_help: 'Xem nhanh các nơi đã ứng tuyển và tiến độ.', jb_empty: 'Chưa có hồ sơ ứng tuyển.', jb_company: 'Công ty/tổ chức', jb_role: 'Vị trí', jb_note: 'Ghi chú',
  jb_interested: 'Quan tâm', jb_applied: 'Đã nộp', jb_interview: 'Phỏng vấn', jb_offer: 'Trúng tuyển/Offer', jb_rejected: 'Không đạt', jb_closed: 'Kết thúc',
  cls_none: '(Chưa có lớp)', cls_title: 'Điểm danh theo lớp', cls_help: 'Chọn lớp và ngày, bấm có mặt/đi muộn/vắng cho từng học viên rồi lưu. Tên lớp đặt ở Nhập thông tin > Thông tin cơ bản.', cls_empty: 'Đăng ký học viên và nhập tên lớp ở thông tin cơ bản thì lớp sẽ hiện ở đây.', cls_all_present: 'Cả lớp có mặt', cls_today: 'Ngày này', cls_overview: 'Tổng quan các lớp', cls_name: 'Lớp', cls_n: 'Sĩ số',
  cls_nochange: 'Không có thay đổi.', cls_saved: 'Đã lưu {n} học viên.', cls_ph: 'Tên lớp (VD: Tiếng Anh lớp 10)', cls_all: 'Tất cả lớp', cls_show_left: 'Gồm học viên đã nghỉ',
  en_active: 'Đang học', en_paused: 'Tạm nghỉ', en_left: 'Đã nghỉ', par_name: 'Tên phụ huynh', par_phone: 'Liên hệ phụ huynh',
  consent_rs: 'Đồng ý dùng dữ liệu dưới dạng thống kê ẩn danh', consent_rs_note: 'Nếu đồng ý, chỉ điểm kiểm tra (không kèm tên) được dùng cho thống kê/nghiên cứu của đơn vị. Có thể rút lại bất cứ lúc nào.',
  cn_topic: 'Chủ đề tư vấn (VD: Chuẩn bị du học)', cn_actions_ph: 'Bài tập cho học viên (mỗi dòng một mục, tối đa 5)', cn_send_tasks: 'Gửi bài tập vào danh sách việc cần làm của học viên',
  rep_att: 'Tỷ lệ đi học 30 ngày gần nhất {rate}% (có mặt {p} · muộn {l} · vắng {a})',
  an_title: 'Tình hình dữ liệu', an_help: 'Cho biết đã tích lũy được bao nhiêu kết quả kiểm tra, tư vấn, điểm danh. (Chỉ số liệu, không có thông tin cá nhân)', an_students: 'Số học viên', an_complete: 'Hoàn thành 5 bài kiểm tra', an_active: 'Hoạt động 7 ngày qua',
  an_goal_title: 'Mục tiêu dữ liệu', an_goal_now: 'Học viên hoàn thành cả 5 bài: {a} / mục tiêu tiếp theo {b}', an_lv1: '10 người: mức tối thiểu để chạy thử — kiểm tra bài test vận hành tốt và công việc của giáo viên khả thi', an_lv2: '30 người: có thể xem giá trị tham khảo so sánh cá nhân với trung bình của đơn vị', an_lv3: 'Từ 100 người: có thể bàn về giá trị chuẩn theo độ tuổi/nhóm',
  an_caveat: '※ 10 người chưa đủ để rút ra kết luận thống kê. Chỉ dùng để tham khảo nội bộ; muốn công bố làm chuẩn/nghiên cứu cần mẫu lớn hơn và chuyên gia thẩm định.',
  an_tests: 'Theo từng bài kiểm tra', an_test: 'Bài kiểm tra', an_avg: 'TB (thang 5)', an_retake: 'Làm lại', an_invalid: 'Cảnh báo độ tin cậy', an_records: 'Tình hình hồ sơ',
  an_r_goal: '{n} học viên đã nhập mục tiêu', an_r_grades: '{n} học viên đã nhập điểm số', an_r_sessions: '{n} học viên có ghi chép tư vấn (tổng {s})', an_r_diag: '{n} học viên có bản chẩn đoán', an_r_retest: '{n} học viên đã làm lại bài kiểm tra', an_r_att: '{n} bản ghi điểm danh', an_r_research: '{n} học viên đồng ý dùng dữ liệu thống kê',
  an_groups: 'Theo nhóm tuổi', an_export: 'Tải dữ liệu của học viên đã đồng ý (CSV)', an_export_note: 'Chỉ gồm mã ngẫu nhiên và điểm kiểm tra, không có tên/trường/mục tiêu, và chỉ học viên đồng ý dùng thống kê. Loại trừ sức khỏe tinh thần.', an_exported: 'Đã tải dữ liệu của {n} học viên.',
});

// 스터디카페
Object.assign(UI.ko, {
  tab_cafe: '입퇴실', ot_studycafe: '스터디카페', cafe_title: '스터디카페', cafe_in: '입실', cafe_out: '퇴실', cafe_in_now: '이용 중', cafe_since: '{time} 입실', cafe_seat: '좌석', cafe_pass: '이용권', cafe_pass_end: '이용권 만료일',
  cafe_pass_left: '{n}일 남음', cafe_pass_expired: '만료됨', cafe_pass_soon: '이용권 만료 임박(7일)', cafe_console: '입·퇴실 관리', cafe_help: '이름 옆 버튼으로 입실·퇴실을 기록해요. 퇴실하면 이용 시간이 학습 기록에 자동으로 더해져요. 학생 본인도 홈 화면에서 직접 누를 수 있어요.',
  cafe_today_total: '오늘 총 이용', cafe_search: '이름·좌석 검색', cafe_only_in: '이용 중만', cafe_today: '오늘 이용', cafe_empty: '학생을 등록하면 여기에 나타나요.',
});
Object.assign(UI.vi, {
  tab_cafe: 'Vào/ra', ot_studycafe: 'Quán cà phê học tập', cafe_title: 'Quán cà phê học tập', cafe_in: 'Vào', cafe_out: 'Ra', cafe_in_now: 'Đang sử dụng', cafe_since: 'Vào lúc {time}', cafe_seat: 'Chỗ ngồi', cafe_pass: 'Gói sử dụng', cafe_pass_end: 'Ngày hết hạn gói',
  cafe_pass_left: 'Còn {n} ngày', cafe_pass_expired: 'Đã hết hạn', cafe_pass_soon: 'Gói sắp hết hạn (7 ngày)', cafe_console: 'Quản lý vào/ra', cafe_help: 'Bấm nút cạnh tên để ghi vào/ra. Khi ra, thời gian sử dụng tự động cộng vào nhật ký học tập. Học viên cũng có thể tự bấm ở màn hình chính.',
  cafe_today_total: 'Tổng thời gian hôm nay', cafe_search: 'Tìm tên/chỗ ngồi', cafe_only_in: 'Chỉ đang sử dụng', cafe_today: 'Hôm nay', cafe_empty: 'Đăng ký học viên thì sẽ hiện ở đây.',
});

// 확인 필요(개입) 안내
Object.assign(UI.ko, {
  st_watch: '확인 필요', roster_watch_only: '확인 필요 학생만', flag_lowatt: '출석률 낮음',
  iv_title: '오늘 확인할 학생', iv_none: '지금 따로 확인할 학생이 없어요. 👍', iv_help: '"확인 필요"는 문제가 생겼다는 뜻이 아니라, 강사가 한 번 살펴보면 좋다는 신호예요. 이유와 할 일을 아래에 적었어요. 처리했으면 "3일 보류"를 누르세요.',
  iv_todo: '이렇게 하세요:', iv_open: '학생 열기', iv_msg_btn: '메시지 보내기', iv_snooze: '확인했어요 (3일 보류)', iv_snoozed: '3일 동안 확인 필요에서 뺐어요. 새로운 문제가 생기면 다시 나타나요.', iv_send: '보내기', iv_sent: '메시지를 보냈어요.',
  iv_wb: '마음 상태', iv_msg: '답장 필요', iv_idle: '활동 없음', iv_att: '출석', iv_val: '검사 신뢰도', iv_dday: 'D-day',
  iv_wb_why: '정서웰빙 검사에서 "주의" 구간이 나왔어요. (학생이 공유에 동의한 경우에만 보여요)', iv_wb_todo: '진단이 아니라 참고 결과예요. 조용히 1:1로 안부를 물어보고, 힘들다는 이야기가 나오면 보호자·전문 상담기관에 연결하세요. 상담일지에 기록해 두세요.', iv_wb_tpl: '{name}님, 요즘 마음은 어때요? 편할 때 이야기해 줘도 좋아요.',
  iv_msg_why: '학생이 보낸 메시지에 아직 답하지 않았어요.', iv_msg_todo: '메시지 탭에서 짧게라도 답장해 주세요. 답이 늦으면 학생이 멈추기 쉬워요.',
  iv_idle_why: '{n}일째 학습 기록과 출석 체크인이 없어요.', iv_idle_todo: '안부 메시지로 이유(시험·건강·흥미 저하)를 물어보세요. 목표가 너무 크면 이번 주 할 일을 줄여 주세요. 계속되면 보호자에게 연락하세요.', iv_idle_tpl: '{name}님, 요즘 어떻게 지내요? 이번 주 목표를 같이 가볍게 점검해 볼까요?',
  iv_att_why: '최근 30일 출석률이 {rate}%예요.', iv_att_todo: '결석 사유를 물어보고, 시간표가 무리한지 점검하세요. 보호자에게 출석 상황을 알려 주세요.', iv_att_tpl: '{name}님, 최근 못 온 날이 있었네요. 무슨 일 있었는지 편하게 알려 주세요.',
  iv_val_why: '{tests} 검사에서 같은 답을 반복하는 등 성의 없는 응답 패턴이 있어요.', iv_val_todo: '이 결과는 그대로 믿지 마세요. 학생과 응답 상황을 이야기하고, 조용한 환경에서 다시 검사하도록 권하세요.', iv_val_tpl: '{name}님, 지난 검사를 조금 급하게 하신 것 같아요. 시간 될 때 차분히 다시 해 볼까요?',
  iv_dday_why: '"{label}"까지 D-{n}이에요.', iv_dday_todo: '남은 이정표·성적·할 일을 점검하고, 이번 주 우선순위를 3개로 줄여 주세요.', iv_dday_tpl: '{name}님, {label}까지 D-{n}이에요. 이번 주 우선순위를 같이 정해 볼까요?',
});
Object.assign(UI.vi, {
  st_watch: 'Cần xem xét', roster_watch_only: 'Chỉ học viên cần xem xét', flag_lowatt: 'Tỷ lệ đi học thấp',
  iv_title: 'Học viên cần xem hôm nay', iv_none: 'Hiện chưa có học viên nào cần xem. 👍', iv_help: '"Cần xem xét" không có nghĩa là có vấn đề, mà là tín hiệu để giáo viên xem qua. Lý do và việc cần làm ghi bên dưới. Xử lý xong hãy bấm "Tạm ẩn 3 ngày".',
  iv_todo: 'Nên làm:', iv_open: 'Mở học viên', iv_msg_btn: 'Gửi tin nhắn', iv_snooze: 'Đã xem (ẩn 3 ngày)', iv_snoozed: 'Đã bỏ khỏi danh sách cần xem trong 3 ngày. Nếu có vấn đề mới sẽ hiện lại.', iv_send: 'Gửi', iv_sent: 'Đã gửi tin nhắn.',
  iv_wb: 'Tinh thần', iv_msg: 'Cần trả lời', iv_idle: 'Không hoạt động', iv_att: 'Đi học', iv_val: 'Độ tin cậy', iv_dday: 'D-day',
  iv_wb_why: 'Bài kiểm tra sức khỏe tinh thần ở mức "cần chú ý". (Chỉ hiện khi học viên đồng ý chia sẻ)', iv_wb_todo: 'Đây không phải chẩn đoán mà chỉ là kết quả tham khảo. Hãy nhẹ nhàng hỏi thăm riêng; nếu em nói đang rất khó khăn, hãy kết nối với phụ huynh/cơ sở tư vấn chuyên môn. Ghi lại vào nhật ký tư vấn.', iv_wb_tpl: '{name} à, dạo này tinh thần em thế nào? Khi nào thoải mái em cứ chia sẻ nhé.',
  iv_msg_why: 'Học viên đã gửi tin nhắn nhưng chưa được trả lời.', iv_msg_todo: 'Hãy trả lời ngắn gọn ở tab Tin nhắn. Trả lời chậm dễ làm học viên bỏ dở.',
  iv_idle_why: 'Đã {n} ngày không có nhật ký học tập hay điểm danh.', iv_idle_todo: 'Nhắn hỏi thăm lý do (thi cử, sức khỏe, mất hứng). Nếu mục tiêu quá lớn, hãy giảm việc tuần này. Nếu kéo dài, hãy liên hệ phụ huynh.', iv_idle_tpl: '{name} à, dạo này em thế nào? Mình cùng xem lại mục tiêu tuần này nhé?',
  iv_att_why: 'Tỷ lệ đi học 30 ngày gần nhất là {rate}%.', iv_att_todo: 'Hỏi lý do vắng, kiểm tra lịch học có quá tải không. Báo phụ huynh về tình hình đi học.', iv_att_tpl: '{name} à, gần đây em có vài buổi vắng. Em cho cô/thầy biết có chuyện gì không nhé.',
  iv_val_why: 'Bài {tests} có dấu hiệu trả lời qua loa như lặp lại cùng một đáp án.', iv_val_todo: 'Đừng tin hoàn toàn kết quả này. Trao đổi với học viên về cách làm bài và đề nghị làm lại ở nơi yên tĩnh.', iv_val_tpl: '{name} à, bài kiểm tra vừa rồi có vẻ em làm hơi vội. Khi rảnh mình làm lại thong thả nhé?',
  iv_dday_why: '"{label}" còn D-{n}.', iv_dday_todo: 'Kiểm tra các mốc, điểm số, việc cần làm còn lại và thu gọn 3 ưu tiên cho tuần này.', iv_dday_tpl: '{name} à, còn D-{n} là đến "{label}". Mình cùng chọn ưu tiên tuần này nhé?',
});

// 베타 테스트
Object.assign(UI.ko, {
  fb_title: '의견 보내기', fb_help: '불편한 점, 이해가 안 되는 화면, 바라는 기능을 알려 주세요. 개발에 바로 반영해요.', fb_bug: '오류·고장', fb_confusing: '이해하기 어려움', fb_idea: '있으면 좋겠어요', fb_praise: '좋았어요',
  fb_ph: '무엇이 어땠는지 편하게 적어 주세요 (어느 화면인지 함께 적으면 더 좋아요)', fb_send: '보내기', fb_need: '내용을 적어 주세요.', fb_thanks: '고마워요! 의견을 받았어요.', fb_admin: '베타 의견함', fb_anon: '로그인 전', fb_reopen: '다시 열기', fb_done: '처리함', fb_none: '아직 받은 의견이 없어요.',
  beta_note: '베타 테스트 중이에요. 불편한 점은 왼쪽 아래(모바일은 위쪽)의 💬 버튼으로 알려 주세요.',
  bk_title: '데이터 백업', bk_help: '모든 학생·계정 데이터를 파일 하나로 내려받아요. 비밀번호(암호화됨)와 개인정보가 들어 있으니 안전한 곳에만 보관하고, 일주일에 한 번은 받아 두세요.', bk_btn: '백업 파일 내려받기', bk_done: '내려받았어요. 안전한 곳에 보관하세요.',
});
Object.assign(UI.vi, {
  fb_title: 'Gửi ý kiến', fb_help: 'Hãy cho chúng tôi biết điều bất tiện, màn hình khó hiểu hoặc tính năng mong muốn. Chúng tôi sẽ cải thiện ngay.', fb_bug: 'Lỗi', fb_confusing: 'Khó hiểu', fb_idea: 'Mong có thêm', fb_praise: 'Rất tốt',
  fb_ph: 'Hãy viết thoải mái (ghi rõ màn hình nào thì càng tốt)', fb_send: 'Gửi', fb_need: 'Vui lòng nhập nội dung.', fb_thanks: 'Cảm ơn bạn! Chúng tôi đã nhận được ý kiến.', fb_admin: 'Hộp ý kiến beta', fb_anon: 'Chưa đăng nhập', fb_reopen: 'Mở lại', fb_done: 'Đã xử lý', fb_none: 'Chưa có ý kiến nào.',
  beta_note: 'Đang chạy thử (beta). Nếu có điều bất tiện, hãy bấm nút 💬 ở góc dưới bên trái (trên điện thoại ở phía trên).',
  bk_title: 'Sao lưu dữ liệu', bk_help: 'Tải toàn bộ dữ liệu học viên và tài khoản thành một tệp. Tệp chứa mật khẩu (đã mã hóa) và thông tin cá nhân nên chỉ giữ ở nơi an toàn; hãy tải ít nhất mỗi tuần một lần.', bk_btn: 'Tải tệp sao lưu', bk_done: 'Đã tải xuống. Hãy lưu ở nơi an toàn.',
});

// 처음 화면(랜딩)·로그인 화면
Object.assign(UI.ko, {
  auth_tab_login: '로그인', auth_tab_signup: '회원가입', auth_tab_claim: '활성화 코드', auth_forgot: '비밀번호를 잊었어요', auth_staff_note: '강사·관리자 계정은 기관에서 만들어 드려요. 받은 이메일과 비밀번호로 로그인하세요.',
  land_tagline: '진로 탐색과 학습 관리를 한곳에서. 검사 · 목표 · 시간표 · 상담 · 리포트까지 함께해요.', land_b1: '6가지 종합검사로 나의 흥미·성향·역량을 알아봐요', land_b2: '목표와 시간표, 주간 계획으로 꾸준히 학습해요', land_b3: '선생님과 보호자가 진행 상황을 함께 확인해요',
  land_claim_q: '선생님이 나를 등록해 주셨나요?', land_l_t: '학생·성인 학습자', land_l_d: '회원가입 후 검사를 하고 목표와 시간표를 관리해요. 초등학생부터 성인까지 눈높이에 맞게 보여 드려요.', land_s_t: '강사·학원·스터디카페', land_s_d: '학생 등록, 반·출결, 입퇴실, 상담 기록, 학부모 리포트를 관리해요. 계정은 기관 관리자가 만들어 줘요.',
  land_p_t: '학부모', land_p_d: '선생님이 보내 준 링크를 열면 로그인 없이 자녀의 학습 리포트를 볼 수 있어요.', land_trial_t: '먼저 둘러보고 싶어요', land_trial_d: '가입 없이 체험해 볼 수 있어요. 입력한 내용은 이 기기에만 저장돼요.', land_trial: '가입 없이 체험하기',
});
Object.assign(UI.vi, {
  auth_tab_login: 'Đăng nhập', auth_tab_signup: 'Đăng ký', auth_tab_claim: 'Mã kích hoạt', auth_forgot: 'Quên mật khẩu', auth_staff_note: 'Tài khoản giáo viên/quản trị viên do đơn vị tạo. Hãy đăng nhập bằng email và mật khẩu đã nhận.',
  land_tagline: 'Hướng nghiệp và quản lý học tập ở một nơi. Kiểm tra · mục tiêu · thời khóa biểu · tư vấn · báo cáo.', land_b1: 'Khám phá sở thích, tính cách, năng lực qua 6 bài kiểm tra tổng hợp', land_b2: 'Học đều đặn với mục tiêu, thời khóa biểu và kế hoạch tuần', land_b3: 'Giáo viên và phụ huynh cùng theo dõi tiến độ',
  land_claim_q: 'Giáo viên đã đăng ký cho bạn?', land_l_t: 'Học viên · Người lớn', land_l_d: 'Đăng ký rồi làm bài kiểm tra, quản lý mục tiêu và thời khóa biểu. Nội dung phù hợp từ tiểu học đến người lớn.', land_s_t: 'Giáo viên · Trung tâm · Quán học tập', land_s_d: 'Quản lý đăng ký học viên, lớp và điểm danh, vào/ra, ghi chép tư vấn, báo cáo phụ huynh. Tài khoản do quản trị viên đơn vị tạo.',
  land_p_t: 'Phụ huynh', land_p_d: 'Mở liên kết giáo viên gửi để xem báo cáo học tập của con mà không cần đăng nhập.', land_trial_t: 'Tôi muốn xem thử trước', land_trial_d: 'Dùng thử không cần đăng ký. Nội dung nhập chỉ lưu trên thiết bị này.', land_trial: 'Dùng thử không đăng ký',
});
Object.assign(UI.ko, { land_preview_t: '미리보기 안내', land_preview_hint: '이 화면은 실제 서비스의 첫 화면이에요. 위쪽 "보기 전환"에서 강사·관리자·보호자 화면을 체험할 수 있어요. 로그인·회원가입 화면은 모양만 볼 수 있고 실제로 가입되지는 않아요.', land_preview_no: '미리보기에서는 실제로 가입·로그인되지 않아요. 위쪽 "보기 전환"으로 체험해 보세요.' });
Object.assign(UI.vi, { land_preview_t: 'Hướng dẫn xem thử', land_preview_hint: 'Đây là màn hình đầu tiên của dịch vụ thực tế. Ở phần "Chuyển chế độ xem" phía trên bạn có thể trải nghiệm màn hình giáo viên, quản trị viên, phụ huynh. Màn hình đăng nhập/đăng ký chỉ để xem giao diện, không tạo tài khoản thật.', land_preview_no: 'Bản xem thử không đăng ký/đăng nhập thật. Hãy dùng "Chuyển chế độ xem" phía trên.' });

// 입구별 로그인
Object.assign(UI.ko, {
  ent_learner: '학생·성인', ent_learner_d: '검사, 목표, 시간표, 학습 기록을 관리해요. 초등학생부터 성인까지 눈높이에 맞게 보여 드려요.', ent_guardian: '학부모·보호자', ent_guardian_d: '자녀의 학습 요약을 확인해요. 선생님이 보낸 링크가 있다면 로그인 없이 바로 볼 수 있어요.',
  ent_teacher: '강사', ent_teacher_d: '담당 학생의 검사·상담·출결·입퇴실을 관리해요. 계정은 기관 관리자가 만들어 줘요.', ent_admin: '관리자', ent_admin_d: '학생·강사 등록, 기관 정보, 데이터 현황, 백업을 관리해요.',
  login_as_learner: '학생 로그인', login_as_guardian: '보호자 로그인', login_as_teacher: '강사 로그인', login_as_admin: '관리자 로그인',
  login_wrong_role: '이 계정은 {role} 계정이에요. 「{right}」 입구로 들어와 주세요.',
});
Object.assign(UI.vi, {
  ent_learner: 'Học viên · Người lớn', ent_learner_d: 'Quản lý bài kiểm tra, mục tiêu, thời khóa biểu, nhật ký học. Nội dung phù hợp từ tiểu học đến người lớn.', ent_guardian: 'Phụ huynh · Người giám hộ', ent_guardian_d: 'Xem tóm tắt học tập của con. Nếu có liên kết giáo viên gửi, bạn xem được ngay không cần đăng nhập.',
  ent_teacher: 'Giáo viên', ent_teacher_d: 'Quản lý kiểm tra, tư vấn, điểm danh, vào/ra của học viên phụ trách. Tài khoản do quản trị viên đơn vị tạo.', ent_admin: 'Quản trị viên', ent_admin_d: 'Quản lý đăng ký học viên/giáo viên, thông tin đơn vị, tình hình dữ liệu, sao lưu.',
  login_as_learner: 'Đăng nhập học viên', login_as_guardian: 'Đăng nhập phụ huynh', login_as_teacher: 'Đăng nhập giáo viên', login_as_admin: 'Đăng nhập quản trị viên',
  login_wrong_role: 'Đây là tài khoản {role}. Vui lòng vào bằng mục 「{right}」.',
});
