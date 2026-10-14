# 2000_new

Word Master 수능 2000 기반 iPad Apple Pencil 영어→한글 필기평가 웹앱.

- DAY 50부터 역순 기본 진행
- 1 DAY 40단어 / 8단어 × 5 STEP
- 3일 신규 + 4일차 오답점검
- strict first-meaning grading
- iPadOS Scribble 우선 필기인식
- 오답 즉시 따라쓰기 + 재입력 + 당일 재시험
- 관리자 local dashboard
- GitHub Actions 검증 + GitHub Pages 자동 배포

자세한 개발 기준은 `docs/HANDOFF.md` 참고.

- v0.1.3: 관리자 JSON 학습기록 백업·복원 및 실제 상태 전이 회귀검사. DAY 49~1 교재 데이터 등록 대기.

- v0.1.4: Mobbin A안 키오스크 디자인 실적용 (크림·청록, 8단어 진행, 오답 집중 화면, 미제출 Pencil 입력 보존).

- v0.2.0: DAY 관리자 직접 선택, 단계적 한글 예문/그림 학습, 15초 집중 필기, 전날 오답과 3/7일 간격 복습, 출처 확인 '중학' 태그(DAY 50 검증분), 기존 기록 유지.

- v0.2.1: 사용자 기존 WordMaster 원데이터에서 DAY49 40단어/첫 뜻 등록, 40개 상황문장/그림단서, 필기 타이머 절대 마감시각 저장 및 실제 브라우저 iPad 화면 회귀검사.

- iPad viewport 실동작 검증: Actions의 `Real Chromium iPad viewport interaction regression`, 스크린샷 artifact `ipad-chromium-viewport-qa` 확인.

- v0.2.2: 단순한 히어로에서 학습/평가를 독립 진입, 기록과 진도 각각 보존, 학습 완료 후 시험 자동 실행 없음.

- v0.2.3: 강제 새로고침·앱 재진입은 항상 학습/평가 히어로부터 표시. 단어 진도·채점·필기 입력은 버튼 선택 시 이어하기.

- v0.2.4: DAY48 원본 HTML·PDF 대조 완료. 공개 재배포 허락 확인 전에는 보호자 설정의 개인 JSON 가져오기로 연결. 기본 80개, 개인 DAY48 등록 후 120개. DAY47~1 반복 검증·파일 생성 도구와 공개 데이터 차단 CI 추가.

- v0.2.5: DAY1~47 1,880개 순서·철자 전수 대조, 첫 뜻 자동 일치 1,700개와 원본 차이 180개 렌더 이미지 검토. DAY1~48 통합 개인 검증팩을 가져오면 공개 DAY49~50과 합쳐 50 DAY·2,000개를 사용한다. 교재 데이터는 권한 확인 전까지 GitHub/Pages에 포함하지 않는다.
- 개인 파일 및 데이터 확장: [docs/DATA_IMPORT.md](docs/DATA_IMPORT.md).
- 전체 검증 요약: [docs/FULL_CORPUS_VERIFICATION.md](docs/FULL_CORPUS_VERIFICATION.md).
- 새 채팅 인계: [PROJECT_HANDOFF_LATEST.md](PROJECT_HANDOFF_LATEST.md).
