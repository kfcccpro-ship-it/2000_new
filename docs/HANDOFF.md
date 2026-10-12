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
