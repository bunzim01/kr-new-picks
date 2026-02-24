# 글로벌 신제품 100

RSS 피드 기반으로 글로벌 뉴스에서 새로운 소비자 제품 100개를 자동으로 수집하여 매일 큐레이션하는 웹 애플리케이션입니다.

## 주요 기능

- ✅ 10개 RSS 피드에서 상품 뉴스 자동 수집
- ✅ 물리적 소비자 제품만 필터링 (B2B/SaaS 제외)
- ✅ 매 6시간마다 자동 스크래핑
- ✅ 카테고리별로 큐레이션된 TOP 100 표시
- ✅ 반응형 디자인 (모바일, 태블릿, PC)

## 기술 스택

- **Next.js 16** (App Router) + TypeScript
- **Tailwind CSS** (스타일링)
- **node:sqlite** (Node.js 24 내장 DB)
- **Cheerio** (HTML/XML 파싱)
- **node-cron** (6시간 주기 스케줄링)

## 설치

### 사전 요구사항
- **Node.js v24.5.0 이상** (node:sqlite 사용)
- npm 또는 yarn

### 설치 단계

```bash
# 의존성 설치
npm install

# 개발 서버 시작
npm run dev

# 프로덕션 빌드
npm run build
npm start
```

개발 서버: http://localhost:3000

## 사용법

### 웹 인터페이스
1. 메인 페이지에서 카테고리별 상품 열람
2. "지금 수집" 버튼으로 수동 스크래핑 트리거
3. 페이지네이션으로 상품 검색

### API 엔드포인트

#### GET /api/products
쿼리 파라미터:
- `page` (기본: 1)
- `limit` (기본: 20, 최대: 100)
- `category` (기본: 전체)

응답:
```json
{
  "products": [...],
  "total": 487,
  "page": 1,
  "totalPages": 10,
  "lastScrapedAt": "2025-02-24T09:00:00Z"
}
```

#### POST /api/scrape
수동 스크래핑 트리거

응답:
```json
{
  "success": true,
  "total": 487,
  "inserted": 25,
  "skipped": 12,
  "scraped_at": "2025-02-24T09:15:30Z"
}
```

#### GET /api/scrape/status
스크래핑 상태 조회

## RSS 피드 소스

| 사이트 | URL | 우선순위 |
|--------|-----|---------|
| TechCrunch | feeds.feedburner.com/TechCrunch | 높음 |
| The Verge | www.theverge.com/rss/index.xml | 높음 |
| Wired | feeds.wired.com/wired/index | 높음 |
| Product Hunt | www.producthunt.com/feed | 높음 |
| Engadget | feeds.feedburner.com/Engadget | 중간 |
| Gizmodo | gizmodo.com/rss | 중간 |
| Mashable | mashable.com/feeds/rss/all | 중간 |
| Cool Things | www.coolthings.com/feed | 중간 |
| Uncrate | uncrate.com/feed | 중간 |
| High Consumption | hiconsumption.com/feed | 낮음 |

## 카테고리 분류

- **Gadgets**: 기술 제품, 스마트 기기, 전자제품
- **Home**: 가구, 인테리어, 주방용품
- **Beauty**: 미용 제품, 스킨케어, 향수
- **Fashion**: 의류, 액세서리, 신발
- **Food**: 음식, 음료, 주방 가젯
- **Other**: 분류되지 않은 상품

## 스크래핑 파이프라인

```
1. RSS 피드 동시 fetch (10개 피드)
   ↓
2. URL 기준 중복 제거
   ↓
3. 제외/포함 키워드 필터링
   ↓
4. 각 페이지 메타데이터 추출 (og:tags)
   ↓
5. 카테고리 자동 분류 (키워드 기반)
   ↓
6. SQLite DB 저장 (INSERT OR IGNORE)
```

## 디렉토리 구조

```
kr-new-picks/
├── app/
│   ├── page.tsx                    # 메인 페이지
│   ├── layout.tsx                  # 레이아웃
│   ├── globals.css                 # 전역 스타일
│   └── api/
│       ├── products/route.ts       # GET /api/products
│       └── scrape/
│           ├── route.ts            # POST /api/scrape
│           └── status/route.ts     # GET /api/scrape/status
├── components/
│   ├── Header.tsx                  # 헤더 + 마지막 업데이트
│   ├── FilterTabs.tsx              # 카테고리 필터
│   ├── ProductCard.tsx             # 상품 카드
│   ├── ProductGrid.tsx             # 카드 그리드
│   ├── RefreshButton.tsx           # 수동 새로고침
│   ├── Pagination.tsx              # 페이지네이션
│   └── LoadingSkeleton.tsx         # 로딩 스켈레톤
├── lib/
│   ├── types.ts                    # TypeScript 타입
│   ├── db.ts                       # SQLite 래퍼
│   ├── feeds.ts                    # RSS 피드 설정
│   ├── fetcher.ts                  # RSS fetch + 파싱
│   ├── extractor.ts                # 메타데이터 추출
│   ├── filters.ts                  # 필터링 로직
│   ├── classifier.ts               # 카테고리 분류
│   ├── deduplicator.ts             # 중복 제거
│   ├── scraper.ts                  # 오케스트레이션
│   ├── cron.ts                     # 스케줄 설정
│   └── utils.ts                    # 유틸리티 함수
├── data/
│   └── products.db                 # SQLite 데이터베이스
├── instrumentation.ts              # 서버 초기화
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── postcss.config.js
└── README.md
```

## 데이터베이스 스키마

### Products 테이블
```sql
CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  image_url TEXT DEFAULT '',
  price TEXT DEFAULT '',
  brand TEXT DEFAULT '',
  description TEXT DEFAULT '',
  product_url TEXT NOT NULL UNIQUE,
  source_site TEXT NOT NULL,
  category TEXT DEFAULT 'Other',
  published_at DATETIME,
  collected_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Scrape Log 테이블
```sql
CREATE TABLE scrape_log (
  id INTEGER PRIMARY KEY,
  scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  total_fetched INTEGER,
  filtered_count INTEGER,
  inserted_count INTEGER,
  skipped_count INTEGER,
  status TEXT
);
```

## 스케줄링

- **Cron**: 6시간마다 자동 실행 (0시, 6시, 12시, 18시 UTC)
- **KST**: 9시, 15시, 21시, 03시
- **설정 위치**: `lib/cron.ts`

## 성능

- DB 쿼리: <100ms (인덱스 활용)
- API 응답: <500ms
- 페이지 로드: <2초 (Suspense + Skeleton)
- 스크래핑: ~10-15분 (100개 상품, 2-3초 딜레이)

## 에러 처리

- ✅ 개별 피드 실패 → 다른 피드 계속 진행
- ✅ 메타데이터 추출 실패 → RSS 폴백값 사용
- ✅ 이미지 404 → Placeholder 이미지 사용
- ✅ DB 중복 → INSERT OR IGNORE로 자동 스킵

## 주의사항

- **Node.js**: v24.5.0 이상 필수 (node:sqlite 사용)
- **better-sqlite3**: 설치 불가 (Python/node-gyp 필요 없음)
- **Client Components**: `product_url`이 Props로 전달되면 `.map(r => ({ ...r }))`로 변환 필수

## 배포

### Vercel
```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel
```

### Docker
```dockerfile
FROM node:24-slim
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 라이선스

MIT License

## 지원

문제 발생 시 GitHub Issues에 보고해주세요.
