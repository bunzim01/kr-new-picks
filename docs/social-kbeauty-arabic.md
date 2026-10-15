# 아랍어 K-뷰티 꿀팁 자동 게시 (인스타그램 + 스레드)

새 계정 `@kbeauty_arabic` 용 자동화 안내서입니다. 개발 지식 없이 읽을 수 있게 썼습니다.

## 1. 프로필 소개글 (복사해서 붙여넣기)

**이름(표시 이름)**
```
K-Beauty بالعربي ✨ الجمال الكوري
```

**인스타그램 / 스레드 소개 (3줄, 150자 제한 안)**
```
🇰🇷 كورية من سيول تشارككِ أسرار الجمال الكوري بالعربي
✨ نصيحة K-Beauty يومية للعناية بالبشرة
💕 احفظي وشاركي مع صديقاتك
```

한국어 뜻: "서울에 사는 한국 여자가 아랍어로 K-뷰티 비밀을 알려드려요 / 매일 하나씩 K-뷰티 스킨케어 꿀팁 / 저장하고 친구에게 공유하세요"

**프로필 사진**: `data/social/samples/profile-avatar.png`

## 2. 어떻게 돌아가나요?

```
팁 30개 (data/social/kbeauty-tips-ar.json)
   ↓ 날짜 기준으로 하루 한 개 자동 선택 (30일 주기 순환)
카드 이미지 생성 (scripts/social/kbeauty-ar.ts, 1080×1350)
   ↓
Uplika 를 통해 인스타그램 + 스레드에 게시
```

- 팁 하나당 **한국어 원문(ko)** 과 **아랍어 제목/본문(ar_title, ar)** 이 함께 들어 있어 내용 확인이 쉽습니다.
- 인스타 캡션: 제목 + 본문 + 저장 유도 문구 + 해시태그 10개
- 스레드 캡션: 제목 + 본문 + 해시태그 3개 (500자 제한 준수)

## 3. 인스타 카드뉴스 (5장)

팁에 `carousel` 내용이 있으면 5장짜리 카드뉴스로, 없으면 1장 카드로 만들어집니다.

1. 표지: 제목 + "넘겨서 비법 보기"
2. 흔한 실수
3. 한국식 올바른 방법 (번호 3단계)
4. 보너스 팁
5. 저장·팔로우 유도 (검은 배경)

스레드는 글 위주라 같은 내용을 글로 올리고, 카드는 표지 1장만 붙입니다.
미리보기: `data/social/samples/theme-compare.png`

## 3-1. 디자인 테마 (아랍권 취향)

| 테마 | 느낌 | 색 | 제목 서체 |
|------|------|----|-----------|
| `gold` (기본값) | 걸프 지역 럭셔리 뷰티 | 딥 플럼 + 골드 | El Messiri |
| `sand` | 따뜻하고 부드러운 데일리 | 샌드 누드 + 테라코타 | Amiri (전통 서체) |
| `emerald` | 고급 스파, 한방 느낌 | 에메랄드 + 골드 | Reem Kufi (쿠픽 서체) |
| `blush` | 기존 사이트 색 | 화이트 + 블러쉬 | Cairo |

세 테마 모두 아치형 창문 프레임을 쓰고, `gold`와 `emerald`는 8각 별 문양을 배경에 은은하게 깝니다.
테마는 `data/social/kbeauty-tips-ar.json` 의 `brand.theme` 값으로 정하거나, 실행할 때 `--theme sand` 처럼 지정합니다.
비교 이미지: `data/social/samples/theme-compare.png`

## 3-2. 직접 만들어 보기

```bash
npm install
npx tsx scripts/social/kbeauty-ar.ts            # 오늘 팁
npx tsx scripts/social/kbeauty-ar.ts --tip 7    # 7번 팁
npx tsx scripts/social/kbeauty-ar.ts --tip 3 --theme sand   # 테마 지정
```
결과물은 `data/social/out/tip-N.png` 와 `tip-N.json`(캡션)에 저장됩니다.

## 4. 자동 게시 준비 순서

1. **Instagram / Threads 새 계정을 Uplika 에 연결**: https://uplika.com/dashboard/connections
   (현재 연결된 계정은 `healthy_sangsik` 뿐이라, 새 계정 연결 전까지 자동 게시가 켜지지 않습니다.)
2. 연결이 끝나면 Claude 에게 "아랍어 뷰티 자동 게시 켜줘" 라고 말하면 됩니다.
   Claude 가 매일 정해진 시간에 카드를 만들고 두 채널에 올립니다.
3. 게시 시간 기본값: **KST 새벽 1시 = 걸프 지역 저녁 7시** (아랍권 활동 시간대).

## 5. 내용 수정하고 싶을 때

- 팁 추가/수정: `data/social/kbeauty-tips-ar.json` 에서 `ar_title`, `ar` 를 고치면 다음 게시부터 반영
- 해시태그 변경: 같은 파일 `hashtags` 배열
- 카드 색/폰트: `scripts/social/kbeauty-ar.ts` 의 `cardHtml` (배경 #FAFAF8, 강조 #E8B4B8, 폰트 Cairo)

## 6. 참고

- 테마 비교 미리보기: `data/social/samples/theme-compare.png`
- 클라우드 세션에서 실행할 때는 `CHROMIUM_PATH=/opt/pw-browsers/chromium` 환경변수가 필요합니다.
