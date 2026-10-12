# 2000_new 개발 인계

## 확정 요구
- iPad + Apple Pencil 중심 영어→한글 필기평가.
- 1 STEP = 8단어.
- 1 DAY = 40단어 = 8단어 × 5 STEP.
- 기본 진도는 DAY 50 → 49 → ... → 1, 학습자가 다음 DAY를 임의 조정 가능.
- 1~3일 신규, 4일차는 앞선 3일의 오답만 점검. 4일차 신규진도 없음.
- 정답은 교재에 제시된 첫 번째 한글 의미 하나만.
- 엄격 채점: NFC 정규화 + 앞뒤 공백 제거 외에는 정확 일치.
- 오답 즉시: 정답 표시 → 희미한 정답 따라쓰기 1회 → 다시 직접쓰기/인식 → 당일 오답 재시험.
- 관리자: 어떤 단어를 어떤 값으로 틀렸는지, 누적 오답과 세션 기록을 간단히 표시.
- localStorage, 로그인 없음.

## 필기인식 전략
v0.1은 **iPadOS Apple Pencil Scribble**을 우선 사용한다.
커스텀 Canvas OCR보다 먼저 쓰는 이유:
1. 입력 필드에서 손글씨가 즉시 한글 텍스트로 변환된다.
2. 외부 서버가 없어 빠르고 개인정보 전송이 없다.
3. 학생이 인식 결과를 눈으로 확인한 뒤 제출하므로 OCR 오인식을 곧바로 지우고 다시 쓸 수 있다.

실제 iPad Pro 10.5에서 한국어 인식 정확도/속도가 부족하면 다음 단계로 Canvas + 외부 AI/OCR + 작은 서버리스 백엔드를 추가한다.

## 백강 고시체 적용
완전한 디지털 폰트 복제는 하지 않는다. 학습 가이드로만 반영:
- 가로형으로 반듯하게
- 자음을 또렷하게
- 세로획은 짧게
- 글자 크기는 일정하게
- 오답 시 희미한 정답 따라쓰기

## v0.1.2 파일럿
- 기능 검증을 위해 DAY 50의 40단어만 우선 탑재.
- iPad Pro 10.5 + 2026 iPad Air 13(M4) 동시 호환을 목표로 반응형 UI를 강화.
- iPad Air 13 가로모드에서는 8단어를 4×2, 10.5형/중간폭에서는 2열 중심으로 표시.
- safe-area, 화면 회전, 가상 키보드(visualViewport), 입력칸 자동 스크롤을 보강.
- 오답 따라쓰기 Canvas는 Apple Pencil 압력 + coalesced pointer events + ResizeObserver에 대응.
- Scribble 입력칸은 한국어 lang/inputmode/enterkeyhint를 명시하고 높이를 72px 이상으로 확대.
- 실제 iPad에서 필기인식 UX가 통과하면 DAY 49~1 데이터 연결 및 전체 50 DAY 자동 진행을 확장.
- GitHub main push 시 Validate → GitHub Pages 자동 배포.

## 현재 배포 상태
- GitHub Pages Source = GitHub Actions 활성화 완료.
- 2026-10-12 main 배포 성공.
- 실제 Pages build/upload/deploy 전 단계 SUCCESS.
- 공개 URL: https://kfcccpro-ship-it.github.io/2000_new/

## 2026 iPad Air 13 호환 기준
- 2026 iPad Air 13(M4)의 13형 화면을 큰 iPad 프로필로 보고 가로모드 4열×2행 STEP 레이아웃을 적용한다.
- Apple Pencil Pro / Apple Pencil(USB-C) 입력을 고려해 pointer events, 압력값, hover 표시를 지원한다.
- 기기명을 하드코딩하지 않고 실제 CSS viewport 폭과 방향에 따라 자동 레이아웃을 선택한다.
- 가상 키보드가 올라오면 sticky 하단바를 해제하고 현재 입력 카드가 화면 중앙에 오도록 한다.
- iPad Pro 10.5는 기존 2열 레이아웃을 유지해 작은 화면에서 입력칸이 좁아지지 않도록 한다.


## Pages 활성화 확인
- 2026-10-12 사용자 화면에서 Settings → Pages → Source = GitHub Actions 저장 완료를 확인.
- 이후 main push부터 실제 Pages build/upload/deploy 단계가 실행되어야 함.


## v0.1.2 메인 화면 단순화
- 학생 메인 화면을 키오스크형 단일 행동 구조로 축소.
- 메인에는 오늘 DAY, 단어 수/STEP 수, 큰 시작 버튼, 최소 안내만 표시.
- 백강 고시체 상세 안내, 기기 안내, 4일 리듬 설명 카드, 진도 설명 카드 제거.
- DAY 변경은 접힌 보조 메뉴로 이동.
- 테스트 내부 기능과 관리자 기능은 그대로 유지.
- 목표: 학생이 메인 화면에서 고민할 행동을 사실상 “테스트 시작” 하나로 제한.


## v0.1.2 배포 성공
- main: 98f720bff821656adfc0a3654d1f3dac50bca021
- Validate SUCCESS
- iPad compatibility regression SUCCESS
- Kiosk home regression SUCCESS
- GitHub Pages Deploy SUCCESS

## v0.1.3 — 기존 배포본 유지·기록 보호·실행형 검증 (2026-10-12)
- 기준 시작점: main 3066cc619601944101feccfcbd183cbf1b66b5a1 / VERSION 0.1.2. 이전 기능 및 localStorage 키 `wm2000pilot_v1` 유지.
- 관리자에 JSON 학습기록 백업·복원 추가. 복원은 형식/범위 검사와 덮어쓰기 확인 후 수행. 사용자 승인 없는 기존 기록 삭제 금지.
- 기존 DAY 50 데이터 40개, 8단어×5 STEP, 3회 신규+4회차 오답복습, 엄격 정답채점, 오답 재학습, Apple Pencil Scribble 방식 유지.
- 복습 오답 0개일 때 완료 화면에 `0/0` 대신 `오답 없음`으로 명시.
- Node.js VM에 실제 app.js/data 파일을 로딩하여 카드 제출·오답 따라쓰기 이벤트·재시험·진도·복습·재로드·백업 복원 상태 전이를 수행하는 의존성 없는 런타임 회귀검사 추가.
- 주의: VM 포인터 이벤트 검사는 실제 iPadOS에서의 Apple Pencil/Scribble 인식률이나 Safari 다운로드 성공을 증명하지 않는다. 실제 두 iPad 기종에서의 수동 검증 필요.
- 아직 DAY 49~1 교재 원문 데이터가 없다. 사용자 교재의 첫 번째 의미를 확인한 다음에만 신규 DAY 데이터를 작성한다. 추정 단어로 2000개를 채우지 않는다.
- 다음 우선순위: (1) 실제 iPad Pro 10.5 및 iPad Air 13에서 한국어 Scribble/백업 확인, (2) DAY 49~1 정확한 원본 데이터 확보·40개/일 검증, (3) 확장 DAY 배포 및 자동 진도 회귀검사.


## v0.1.4 — 승인된 Mobbin A안 실제 적용 (2026-10-12)
- 기준 원본: main `6eeba41fb984e2ade6d9bdbc18b4bbbbd0c1a721`, VERSION `0.1.3`.
- 승인 레퍼런스: Figma `g9MeTNXefGtu81Rk5vwsnI`, node `4:2`; 실제 비교 시안 `2000_new_UI_A_review.html`.
- 디자인: 크림색 배경(#f6f0eb), 청록색 시작/진행 버튼(#9cc6c8), 넓은 여백, DAY 중심 키오스크, 8단어 진행 세그먼트, 카드별 Pencil 입력, 오답 1개 집중 재학습, 간결한 완료 화면.
- 운영 기능/기록 유지: `wm2000pilot_v1` localStorage 키 그대로, STEP=8, DAY50 데이터, 3회 신규+4회차 복습, NFC+trim 엄격 채점, 오답→캔버스 따라쓰기→재입력→재시험, 부모 관리자/JSON 백업·복원.
- 데이터 안정성: `st.current.drafts`에 제출 전 필기 텍스트를 저장해 다른 단어 제출로 리렌더되어도 사라지지 않게 보강. 제출 뒤 해당 draft 삭제. 다른 기록을 초기화하거나 재설정하지 않음.
- iPad 레이아웃: Air 13 가로 4열×2행, Pro 10.5 가로 2열, 세로 2열, 작은 폰 1열. Apple Pencil Scribble 필드는 유지, 확대 및 키보드 viewport 처리 유지.
- 배포 시 Validate/Node 런타임 회귀검사/`tests/a-design.mjs` 확인 및 GitHub Pages Deploy SUCCESS 확인 필요.
- 실제 iPadOS Scribble 정확도와 iPad Safari에서 키보드 전환, 백업 다운로드는 실기기에서 재검증 필요.
- DAY 49~1 데이터는 아직 교재 원본 검증 전으로 등록하지 않음.

## v0.1.4 최종 배포 결과
- 적용 커밋: `1f5d2d3b44cffe553a36abb82cb384d776f2c429` (기존 main `6eeba41f`에서 증분 수정).
- GitHub Actions: https://github.com/kfcccpro-ship-it/2000_new/actions/runs/38204638951 — validate 및 deploy 모두 SUCCESS.
- Validate 단계 통과: validate.mjs, node --check app.js, iPad 호환성 회귀, 키오스크 홈 회귀, 학습·백업 VM 런타임 회귀, A안 테마 검증.
- 공개 주소: https://kfcccpro-ship-it.github.io/2000_new/
- 소스 버전: `VERSION=0.1.4`, HTML 자산 cache-busting 모두 `v=0.1.4`.
- 미실시: 실물 iPadOS Apple Pencil 한국어 Scribble 인식 및 Safari 다운로드·회전 수동 검증, 외부 브라우저 실제 스크린샷 시각 검사. CI 통과가 물리적 펜 UX를 보증하지는 않음.


## v0.2.0 — ADHD 친화 단계형 학습·필수 누적 복습 (2026-10-12)
- 이전 main `469faf8c55fd5470a5da8cba73bb0c913afd7a8d`, localStorage 키 `wm2000pilot_v1`과 예전 history/stats/current 유지. `study`, `reviewPlan` 선택적 필드만 증분 추가.
- DAY당 **40단어**, 50 DAY이며 현재 배포 데이터는 DAY50 40개만 실존. 원본 `data/day50.js` 정답은 한 글자도 수정하지 않는다.
- 학생 홈: DAY 중심 ‘오늘 학습 시작’ 버튼만 전면 배치. DAY 변경 UI는 관리자 페이지에 숫자 직접 입력으로 이동. 등록되지 않은 DAY를 선택하면 원본 값 변경 없이 이유 표시.
- 기본 일과: 그림 연상·첫째 뜻(1초 뒤)·한국어 예문 2회 분할(2.5/4.4초)·다음(4.6초 이후 활성화) → 이전 오답 우선 평가 → 오늘 DAY 평가.
- `data/learning-day50.js`: 교재에서 채점하는 뜻을 변경하지 않고 그림/상황 단서와 독자 작성 한글 문장 40개 제공.
- **중학 표시**: 교육부 2022 개정 영어과 기본 어휘 목록 (** 마크: 중학·고교 공통과목 권장)에서 검증된 `wound`에 한해서만 표시. 나머지는 무근거 분류하지 않음. 근거: https://www.goe.go.kr/resource/old/BBSMSTR_000000030136/BBS_202307111028067791.pdf
- 8단어 STEP과 고유 정답/재학습·당일 재시험 엔진 유지, 평가 UI만 한 단어 집중형 + **15초 실시간 타이머**. 시간 초과는 보충학습 대상으로 기록한 뒤 따라쓰기/재입력 절차 수행. 필기 인식 지연의 실기기 보완 필요.
- 지난번 학습 오답과 `reviewPlan`에서 복습 예정 시점이 도래한 단어를 신규 DAY 앞에 넣음. 출제 항목에 `어제 오답 · DAY n` 또는 `복습 예정 · DAY n` 표시. 기존 History도 당일 앞선 학습 기록을 최대한 이어받음.
- 복습 간격: 최초 정확 기억 3일 → 다음 정확 기억 7일 → 다음부터 14일; 최초 오답은 다음날 다시. 1/3/7은 경험적 기본값이며 모든 학생의 최적 간격은 아님.
- v0.1.x JSON 백업 호환 보존. `tests/runtime-flow.mjs`, `tests/learning-review.mjs` 자동 테스트로 이전 세션/채점/백업과 신규 동작 회귀 검증.
- 약 30분은 **일일 목표**. 복습·오답이 많으면 30분 초과 가능; 오답을 건너뛰거나 학습 데이터를 잘라내지 않음.
- iPad Pro 10.5 / Air 13 실제 Apple Pencil·Scribble 15초 이내 처리와 학습 전환 수동 검증 필요.


### v0.2.0 강화 검증
- 테스트용 가상 브라우저에서 제어 가능한 시계/interval/timeout을 구현하여 '한 단어 15초 감소 → 시간 초과 → 오답 재학습', 학습 문장 단계별 표시 후 버튼 활성화 및 이어하기 재로드를 검사한다.
- 관리자에서 오답 횟수에 따른 학습 우선순위(오답1~2:집중, 3회 이상:최우선)와 다음 복습 예정일을 제공한다.
- 백업 복원 시 선택적 v0.2.0 추가 데이터(학습 이어하기 및 복습 일정)의 구조 검증을 강화하되, 기존 schema=1 백업 파일도 계속 허용한다.

- 추가 실행형 회귀: 테스트 전용 가상 DAY49(실제 운영 데이터에 등록하지 않음) 40개에, 전날 DAY50 오답 1개가 앞에 추가되어 총 41개가 평가되고 `어제 오답 · DAY 50` 배지가 표시되는지 검사.


## v0.2.1 — DAY49 검증 등록 및 iPad 브라우저 QA
- 원천: 사용자 Library에 보관된 `WordMaster_수능2000_18DAY_누적진도_클라우드복구_확정본(1).html` 내부 `WORDS` 2,000건.
- 이 자료는 앱에서 30일간 나눈 `day` 필드를 사용하므로 해당 필드는 배제하고 원래 순번 1921~1960을 DAY49로 복구. DAY50 순번 1961~2000의 영단어 40/40개가 현재 운영 데이터와 같은 순서임을 대조.
- 원문 뜻은 `sourceFirstMeaning`에 보존, 첫 콤마 앞 한 의미를 `answer`로 채점. 괄호 주석 3곳은 기존 DAY50 기준에 맞춰 채점답에서만 생략. 세부 감사표: `docs/DAY49_SOURCE_AUDIT.md`.
- `data/day49.js` 및 `data/learning-day49.js`를 별도 추가하여 이전 `data/day50.js`를 한 글자도 건드리지 않음. DAY49 모든 40단어의 짧은 그림 단서와 한글 예문 제공. 근거가 확인되지 않은 단어에는 '중학' 뱃지 부여하지 않음.
- 필기평가 남은 15초는 단어/STEP별 절대 마감시각을 `st.current.clock`에 저장하고, 페이지 이동·새로고침으로 리셋되지 않게 함.
- 2개의 DAY가 등록되면 관리자 수기 입력 DAY49/50 지원. DAY48~1은 데이터 검증 전까지 선택 차단.
- 기존 localStorage 키 `wm2000pilot_v1` 및 기록 schema 1, 8단어/STEP, 필수 과거 오답·복습 규칙 유지.
- iPad 브라우저 QA는 Chromium으로 크기만 근사한 테스트. 실제 iPadOS Safari/Apple Pencil 한글 손글씨 인식은 테스트 장비에서 수동 확인 필요.


### Chromium 실제 브라우저 시뮬레이션 추가
- `tests/browser-ipad-qa.html` + `tests/browser-ipad-run.mjs`을 CI에 추가. Linux GitHub runner의 Chrome/Chromium을 실제로 실행하여 1112×834 및 1366×1024 viewport에서 다음 단계를 테스트:
  1. DAY49 원본 40개를 브라우저에서 하나씩 정확 제출하고 DAY48로 진도 이동하는지.
  2. DAY49 학습 카드에서 첫 뜻과 예문이 단계별 등장하는지.
  3. 한글 입력 중 미제출 문자가 페이지 재로드 후 유지되는지.
  4. 전날 DAY49 오답이 다음 DAY50보다 먼저 나오며 출처 표시되는지.
  5. 15초 타이머가 실제로 카운트다운되고 새로고침해도 리셋되지 않는지, 타임아웃이 오답 재학습으로 이어지는지.
- 두 viewport 스크린샷을 Actions artifact `ipad-chromium-viewport-qa`로 업로드. 테스트는 Chrome 리눅스 기반으로 Safari Pencil 실물 인증이 아님.

## v0.2.1 배포 최종 감사 (2026-10-12)
- 실제 WordMaster 사용자 Library의 순번 1921~1960에 해당하는 DAY49를 40개 등록. DAY50 순번 일치율 40/40. 교재 오탈자/한글 의미 검증표 `docs/DAY49_SOURCE_AUDIT.md`.
- 앱 변경 커밋: `734772826e8c4509b8f93256487ad1d5e195a3d4`, 실행형 Chromium 검사 커밋: `71cf8c2bb370157ab80815a8911c2743f2329eda`, 최종 검증 완료: `1b87ebbeafea57254018e6997622bbc7040a270f`.
- Actions run: https://github.com/kfcccpro-ship-it/2000_new/actions/runs/38208879013 — 모든 Validate 및 Pages Deploy SUCCESS.
- 브라우저 자동검사 성공: 원문 40개 채점, 실제 DAY49→48, 전날 오류 우선, DAY 배지, 타이머 새로고침/만료, 미제출 손글씨/재개, 두 iPad 해상도 근사 Chromium 테스트.
- 스크린샷 artifact: `ipad-chromium-viewport-qa` (해당 Actions run의 Artifacts).
- 남은 필수 단계: 실물 iPad Pro 10.5(Apple Pencil 1세대, iPadOS 17 계열일 수 있음) 및 Air13(M4)의 Safari Scribble/키보드 성능 검사. 지침 `docs/IPAD_REAL_DEVICE_CHECKLIST.md`.
- 본 검증은 Chromium 브라우저 기반으로 iPadOS 실기기 필기인식 호환성 **증명 아님**. 실제 15초 제한은 필기 입력/인식이 느린 구형 기기에서 과도할 수 있음.


## v0.2.2 — 하나의 웹앱 안에서 학습 / 평가 독립 선택 (2026-10-12)
- 기준: main `882d8392aa9d9530dc8b229a53c86693947b8a26`, v0.2.1. 히어로 메인에서 **학습**과 **평가** 두 대형 버튼으로 각각 직접 진입.
- 학습: 시각 연상 단서·첫 번째 뜻·한글 예문을 순서대로 학습. **마지막 단어 후 평가 자동 실행 삭제**. 학습 완료 후 처음 화면 또는 선택적 평가 이동. 학습만 실행해도 history/stats/채점 current는 생성하지 않는다.
- 평가: 히어로에서 별도 진입. 기존 15초, 8단어 STEP, 엄격 채점, 오답 따라쓰기·재시험, 필수 이전 오답 및 원래 DAY 표시, 3/7/14일 간격 예약, 4일차 복습 구조 유지. 학습을 마치지 않아도 평가 가능.
- 상단 처음 화면을 눌러도 진행 중인 학습과 평가의 상태를 초기화하지 않음. 기존 `wm2000pilot_v1` 저장키 유지, 선택적 `activeMode`로 새로고침 시 현재 모드를 구분. 구버전 기록은 activeMode가 없어도 기존 이어하기 로직으로 보존.
- 학습은 완료시 `st.study.done=true`, 기록을 유지하며 다시 학습도 가능. 평가 시작 시 `st.study`를 지우지 않음.
- Mobbin A안 크림/청록, iPad 가로 2개 큼직한 버튼, 모바일에서는 세로 배치. 관리자의 DAY 직접 지정 유지.
- 테스트: 40개 학습-only 완료 기록 부재 확인, 학습⇄평가 중단·진행 상태 보존, 기존 오답/타이머/백업, iPad Chromium 화면 검증.


## v0.2.3 — 새로고침 시 항상 히어로 표시 (2026-10-12)
- 사용자 실기기/PC 화면에서 강제 새로고침해도 penetrate 학습 화면으로 바로 복귀함을 확인. 원인은 캐시가 아니라 v0.2.2 앱 진입부 `render()`가 저장된 `activeMode:"study"`에 따라 이전 학습 화면을 자동 열던 것.
- 수정: 초기 로딩은 반드시 `home()`에서 시작하여 **학습/평가 2개 대형 선택 버튼**을 표시. 두 기록 `st.study`와 `st.current`, `history`, `reviewPlan`, `stats`, `wm2000pilot_v1` 키를 모두 보존. 사용자가 해당 버튼을 누르면 이전 진행을 선택적으로 복원.
- `VERSION`/HTML css·script cache-busting `v=0.2.3`. 필요하면 `https://kfcccpro-ship-it.github.io/2000_new/?v=0.2.3`로 접속해 HTML URL 캐시도 분리 가능.
- 회귀: 이전 `activeMode:study`로 저장된 v0.2.2의 기존 기록으로 새로고침 → 두 버튼 표시 → 학습 이어하기, 평가 오답·진도 이어하기, 미제출 한글 입력 유지, 15초 타이머 deadline 유지 및 시간 만료, iPad 1112x834/1366x1024 Chromium 동작.
- 주의: 평가의 절대 마감시간은 기존 정책 그대로 유지하여 앱을 떠나 있는 시간이 타이머에 포함됨. 별도의 일시정지/재개 정책 변경은 하지 않음.
