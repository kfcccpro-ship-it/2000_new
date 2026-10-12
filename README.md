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
