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
