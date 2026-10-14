# DAY1~48 통합 개인 데이터 연결 절차

v0.2.5부터 보호자 설정의 **단어 파일 불러오기**로 DAY1~48 통합 개인 JSON을 추가한다.
기본 공개 배포 데이터는 DAY49·50의 80개이고, 통합팩을 불러온 기기는 DAY1~50의 2,000개를 사용한다.
추가 단어는 `wm2000personal_words_v1`, 기존 기록은 `wm2000pilot_v1`에 각각 보관한다.

## 사용 방법

1. 같은 브라우저에서 보호자 설정 → 단어 파일 불러오기 → `WM2000_DAY1-48_개인용_검증팩.json` 선택.
2. 등록 DAY가 1~50인지 확인한다. DAY49 완료 후 DAY48부터 DAY1까지 이어진다.
3. 특정 DAY를 시작하려면 진행 중인 학습·평가를 완료하고 보호자 설정에서 DAY 번호를 적용한다.
4. 기기를 바꿀 때 개인 단어 파일과 학습기록 백업을 둘 다 보관한다. 새 기기에서 단어 파일을 먼저 불러온 뒤 기록을 복원한다.

기존 DAY49·50, 저장 중인 기록, 미제출 답안, 절대 타이머, 8단어 STEP,
3회 신규·4회차 오답 복습 및 NFC+trim 정확 일치 채점을 유지한다.
이미 가져온 DAY의 철자·채점답 변경은 기록 보호를 위해 차단한다.
개인 데이터 등록으로 진행 중인 DAY를 자동 변경하지 않는다.

## 전체 일괄 검증·생성

원본 HTML의 옛 `day` 필드는 30일 분할값이므로 사용하지 않는다.
정렬된 원래 순번으로 계산한다: `DAY = floor((순번-1)/40)+1`.
예: DAY48=1881~1920. DAY47=1841~1880. DAY1=1~40.

원본은 공개 저장소 밖에 보관한다. 아래 산출물은 `.private/`에만 생성한다.

```bash
python3 tools/audit-private-corpus.py \
  --html /path/to/original.html --pdf /path/to/original.pdf \
  --first-day 1 --last-day 47 --output .private/bulk-audit

python3 tools/render-private-audit-sheets.py \
  --audit .private/bulk-audit/corpus-audit.json --pdf /path/to/original.pdf \
  --output .private/bulk-audit/review-sheets
```

자동 대조는 순번·철자와 첫 의미 일치를 검사한다. 불일치 행은 렌더 검토표로 직접 확인하고,
검토자·날짜·감사 해시·예외 근거를 private resolution JSON에 기록한다. 자동 추출만으로
`visuallyReviewed`를 표시하지 않는다.

```bash
python3 tools/build-private-corpus-pack.py \
  --audit .private/bulk-audit/corpus-audit.json \
  --resolution .private/bulk-audit/visual-resolution.json \
  --day48 .private/DAY48_personal.json --output .private/full-pack
```

감사 파일이나 불일치 집합이 시각 검토 뒤 변경되면 해시 검사에서 생성을 중단한다.

## 단일 DAY 재검증

```bash
python3 tools/prepare-pdf-review.py \
  --html /path/to/original.html --pdf /path/to/original.pdf --day 47
```

현재 PDF의 두 열·20행 형식과 DAY=PDF 페이지 위치에 한정한 보조 도구다.
각 셀의 추출문과 페이지 이미지가 생성된다. PDF 추출문은 확인 완료 데이터가 아니다.
페이지를 직접 보고 **40개 전부**의 번호·철자·첫 번째 뜻을 독립 대조한다.
`pdfFirstMeaning`, `checked`, `reviewer`, `reviewedAt`, `visuallyReviewed`를 채운다.
PDF 글꼴 매핑이나 줄바꿈이 깨진 부분은 화면을 읽어 확인하고 대조표에 기록한다.

`DAY47_learning.json`에 40개의 자체 작성 그림 단서/한글 예문을 원래 순서로 준비한다.
중학 표시 등 근거 없는 분류는 추가하지 않는다.

```bash
node tools/build-word-pack.mjs \
  --html /path/to/original.html --pdf /path/to/original.pdf \
  --review .private/DAY47_review.json \
  --learning .private/DAY47_learning.json --output .private
```

자동 검증: 원본 2000건의 순번 1~2000, 40건/DAY, PDF/HTML 번호·철자·첫 뜻,
원본 SHA-256, 대조자·확인일, 카드 순서, 첫 뜻→채점답 규칙을 검사한다.
미확인/불일치 항목이 하나라도 있으면 산출을 중단한다. 교재 판본 차이나 오탈자는
먼저 사람이 원본과 이미지로 판단하고 근거를 기록해야 한다. 자동 추정으로 채우지 않는다.

첫 의미는 괄호 바깥 첫 콤마 앞 부분이다. **앞의 괄호 부연 설명만** 채점답에서 생략한다.
단어 내부 괄호·띄어쓰기는 그대로 보존한다. `sourceFirstMeaning`/`sourceFullMeaning`은 원문을 보관한다.
이 전처리는 데이터 작성 규칙이며, 제출된 답의 채점은 기존대로 NFC+앞뒤 공백 제거만 한다.

생성 파일은 `DAY47_personal.json`, `DAY47_audit.json`이다.
개인 JSON을 가져오면 기존 개인 DAY와 병합된다. 통합팩 중 특정 DAY를 재검증할 때 사용한다.
대조표는 자기 서명이므로 진위에 대한 암호학적 인증이 아니다. 원본과 함께 보관한다.

## 공개 이용권한 확인

2026-10-14 확인: 공개 저장소이고 main 변경은 Pages에 자동 배포된다.
제공 원본이나 저장소에서 새 DAY 원문을 공개 재배포해도 된다는 허락은 확인하지 못했다.
이투스의 공식 안내는 자사 영단테를 도서 구매자가 이용할 수 있다고 설명한다.
이는 제3자 GitHub/Pages에 교재 목록·뜻을 공개하는 허락을 확인해 주는 자료가 아니다.

- 공식 안내: https://word.etoos.com/information
- 이투스북: https://www.etoos.com/bookstore/book/

따라서 공개 커밋에는 DAY1~48 단어 원문·PDF·전체 HTML·개인팩·상세 대조표를 포함하지 않는다.
개인 JSON에는 `permission-unconfirmed / personal-device` 상태를 기록한다.
공개화하려면 권리자 허락 자료에서 판본, 대상 내용, 공개 Git/Pages, 복제·전송·변형,
허용기간·출처 표시 등을 확인하고 그 근거와 범위를 기록해야 한다.
개인 파일 생성은 공개 재배포 허락이나 법률상 이용권한을 인정한다는 뜻이 아니다.

`node tools/check-public-data.mjs`를 CI에서 실행한다. 미승인 신규 DAY 파일, 원본 PDF,
개인 JSON·대조표가 공개 Git에 들어오면 실패한다. 공개 승인 후에는 이 검사를 근거와 함께
명시적으로 갱신하고 검증/배포 절차를 다시 수행한다. 기존 DAY49·50은 이 작업에서 수정하지 않는다.

## 실제 브라우저 검증

```bash
node tests/personal-words.mjs
node tests/browser-ipad-run.mjs
# 개인 검증팩을 이 로컬 실행에만 연결할 때:
WM_PERSONAL_PACK=.private/full-pack/WM2000_DAY1-48_개인용_검증팩.json node tests/browser-ipad-run.mjs
```

Chrome 자동 검색이 어려우면 `CHROME_BIN=/absolute/path/to/chrome` 지정 가능.
로컬 개인 JSON은 테스트 서버에만 제공되고 CI/Git에 업로드하지 않는다.
로컬 통합팩 검사에서는 50 DAY·2,000개 구조와 DAY1 40개 실제 제출까지 추가로 검사한다.
공개 CI는 DAY48 구조의 **가상 단어**로 가져오기·40개 제출·3+1회 복습·백업 복원을 검사한다.
1112×834/1366×1024 Chromium 검사는 실제 Safari/Apple Pencil 한국어 인식률을 증명하지 않는다.
