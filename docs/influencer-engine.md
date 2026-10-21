# 일본 인플루언서 발굴 엔진 — 사용 안내

기획서(`docs/japan-influencer-discovery-plan.md`)의 "시스템 설계"를 구현한 것입니다.
오늘의 픽 100 과 같은 흐름(수집 → 점수 계산 → DB → 화면)으로 돌아가며, 크롤링 대신 CSV 와 공식 API 를 읽습니다.

## 한눈에 보기

```
data/influencers/*.csv  ─┐
YouTube Data API        ─┼→ lib/sources/index.ts → lib/influencer-scorer.ts → SQLite(data/picks.db) → /influencers 화면
Instagram Graph API     ─┘        (합치기)              (100점 만점)            (후보·지표·방송·접촉)
```

## 1. 데이터 준비

`data/influencers/` 폴더에 CSV 파일을 넣습니다. 서드파티 도구(Astream, iCON Suite, Modash 등)의 내보내기 파일을 그대로 넣어도 되고, 엑셀로 직접 만들어도 됩니다.

- 필수 열: **플랫폼(또는 프로필 URL), 계정명, 팔로워**
- 열 이름은 한국어·영어·일본어 모두 인식합니다 (`팔로워`, `followers`, `フォロワー数` …).
- 숫자는 `1,234`, `1.2万`, `12K`, `45%` 표기를 모두 읽습니다.
- 예시: `data/influencers/sample.csv` (가상의 예시 계정입니다)
- 실제 명단 CSV 는 git 에 올라가지 않도록 `.gitignore` 에 걸려 있습니다.

전체 열 설명은 사이트의 `/influencers/guide` 페이지에 있습니다.

## 2. 수집 실행 (로컬 컴퓨터)

```bash
npm run collect:influencers                                  # data/influencers/*.csv 전부 읽기
npm run collect:influencers -- --csv ./내명단.csv             # 특정 파일만
npm run collect:influencers -- --youtube "韓国コスメ,スキンケア ライブ"   # YouTube 키워드 검색 추가
npm run collect:influencers -- --instagram                   # CSV 의 Instagram 계정을 API 로 갱신
```

API 를 쓰려면 `.env.local` 에 키를 넣습니다.

```
YOUTUBE_API_KEY=...        # Google Cloud 콘솔에서 발급. 검색은 하루 100회 한도
IG_ACCESS_TOKEN=...        # Instagram 비즈니스 계정 연결 토큰
IG_USER_ID=...             # 내 Instagram 비즈니스 계정 ID
```

같은 계정을 다시 수집하면 지표와 점수만 갱신되고, 접촉 상태·메모·동의 기록은 그대로 남습니다. 수집할 때마다 날짜별 지표 스냅샷이 쌓여 성장세를 볼 수 있습니다.

## 3. 화면

| 주소 | 내용 |
| --- | --- |
| `/influencers` | 후보 목록. 플랫폼·등급·접촉 상태·검색어로 거르기, 점수 순 정렬 |
| `/influencers/[id]` | 상세. 점수 내역, 원본 지표, 접촉 관리(상태·채널·메모·동의), 방송 성과 기록, 지표 이력 |
| `/influencers/guide` | 수집 방법과 열 설명 |

## 4. 점수 (100점)

| 축 | 배점 | 보는 것 |
| --- | --- | --- |
| 영향력 | 25 | 팔로워 규모 10, 여성 비중 8, 20~40대 비중 7 |
| 판매력 | 40 | 라이브 횟수 10, 라이브 시청자 10, 댓글 응답 5, TikTok Shop 6, 제휴 링크 4, PR 경험 5 |
| 이슈력 | 20 | 90일 성장세 10, 바이럴 게시물 6, 미디어 노출 4 |
| 신뢰도 | 15 | 규모 보정 참여율 8, 가짜 팔로워 4, 炎上 없음 3 |

- 등급: 70점 이상 골드, 55점 이상 실버, 40점 이상 루키
- 제외: 가짜 팔로워 30% 초과, 炎上 이력 (순위에서 빠지고 "제외" 로 표시)
- 모르는 값(null)은 중립으로 처리해 데이터가 없다고 손해 보지 않게 했습니다.
- 가중치·기준점은 `lib/influencer-weights.ts` 의 숫자만 바꾸면 됩니다.

## 5. API

| 방법 | 주소 | 설명 |
| --- | --- | --- |
| GET | `/api/influencers?platform=&grade=&status=&q=&page=&limit=&excluded=1` | 목록 |
| GET | `/api/influencers/stats` | 등급·접촉 단계별 인원 |
| GET | `/api/influencers/[id]` | 상세 + 스냅샷 + 방송 성과 + 접촉 이력 |
| PATCH | `/api/influencers/[id]` | `{ contact_status, contact_channel, contact_note, consent }` |
| POST | `/api/influencers/[id]/lives` | `{ live_date, viewers_peak, viewers_avg, duration_min, sales_jpy, orders, note }` (동의 후에만) |

## 6. 개인정보·약관 원칙 (코드에 반영된 것)

- 공개 프로필의 공개 수치만 저장합니다. 게시물 본문·이미지는 저장하지 않습니다.
- 로그인 상태 수집·자동 크롤링은 하지 않습니다. 공식 API 와 서드파티 DB 내보내기만 씁니다.
- 방송 성과(매출·시청자)는 `consent` 가 켜진 뒤에만 기록할 수 있습니다 (API 가 거부).
- 본인이 삭제를 요청하면 해당 행을 DB 에서 삭제합니다.

## 7. 파일 구조

```
lib/
  influencer-types.ts      # 타입 (플랫폼, 등급, 접촉 단계, 원본 지표)
  influencer-weights.ts    # 가중치·기준점 (여기만 바꾸면 됨)
  influencer-scorer.ts     # 점수 계산 + 순위
  influencer-db.ts         # SQLite 표 4개 (후보·스냅샷·방송·접촉 이력)
  collect-influencers.ts   # 수집 오케스트레이터
  sources/
    csv.ts                 # CSV 파서 + 열 이름 별칭
    youtube.ts             # YouTube Data API
    instagram.ts           # Instagram Graph API (Business Discovery)
    index.ts               # 소스 실행·합치기
scripts/collect-influencers.ts
app/influencers/           # 목록 · [id] 상세 · guide
app/api/influencers/       # 목록 · stats · [id] · [id]/lives
components/influencers/    # 표, 필터, 배지, 점수 막대, 접촉 패널, 방송 입력
```
