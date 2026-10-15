# 아랍어 K-뷰티 꿀팁 자동 게시 (인스타그램 + 스레드)

새 계정 `@kbeauty_arabic` 용 자동화 안내서입니다. 개발 지식 없이 읽을 수 있게 썼습니다.

## 1. 프로필 소개글 (복사해서 붙여넣기)

**이름(표시 이름)**
```
K-Beauty بالعربي ✨ الجمال الكوري
```

**인스타그램 소개 (150자 제한, 아래는 138자)**
```
✨ أسرار الجمال الكوري بالعربي
💧 نصيحة يومية للعناية بالبشرة على الطريقة الكورية
🇰🇷 من سيول إليكِ مباشرة
👇 احفظي وشاركي مع صديقاتك
```

**스레드 소개 (짧은 버전)**
```
✨ أسرار الجمال الكوري بالعربي | نصيحة يومية من سيول 🇰🇷
```

한국어 뜻: "한국 뷰티의 비밀을 아랍어로 / 한국식 스킨케어 팁 매일 하나 / 서울에서 직접 전해드려요 / 저장하고 친구에게 공유하세요"

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

## 3. 직접 카드 한 장 만들어 보기

```bash
npm install
npx tsx scripts/social/kbeauty-ar.ts            # 오늘 팁
npx tsx scripts/social/kbeauty-ar.ts --tip 7    # 7번 팁
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

- 샘플 카드: `data/social/samples/tip-3.png`
- 클라우드 세션에서 실행할 때는 `CHROMIUM_PATH=/opt/pw-browsers/chromium` 환경변수가 필요합니다.
