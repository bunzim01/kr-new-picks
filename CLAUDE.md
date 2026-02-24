# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 언어 및 커뮤니케이션 규칙

- **기본 응답 언어**: 한국어
- **코드 주석**: 한국어로 작성
- **커밋 메시지**: 한국어로 작성
- **문서화**: 한국어로 작성
- **변수명/함수명**: 영어 (코드 표준 준수)

## 프로젝트 개요

**오늘의 픽 100** — 한국 여성(20~40대) 대상 글로벌 상품 큐레이션 사이트.
전 세계 9개 쇼핑몰에서 매일 자동 수집한 TOP 100 상품을 뷰티 / 라이프스타일 / 아이디어 카테고리로 제공.

## 주요 명령어

```bash
npm run dev          # 개발 서버 (localhost:3000)
npm run build        # 프로덕션 빌드
npm run start        # 프로덕션 서버 실행
npm run lint         # ESLint 검사
npm run collect      # 수동 크롤링 실행 (스크립트)
```

**Node.js 요구사항**: v22.5.0 이상 (내장 `node:sqlite` 모듈 사용)

## 아키텍처

```
app/                        # Next.js 16 App Router
  page.tsx                  # 메인 페이지 (서버 컴포넌트, 직접 DB 접근)
  archive/page.tsx          # 아카이브 — 클라이언트 컴포넌트, /api/products 호출
  admin/page.tsx            # 관리자 — 수동 수집 트리거
  api/
    products/route.ts       # GET /api/products?date=&category=&page=&limit=
    products/[id]/route.ts  # GET /api/products/:id
    dates/route.ts          # GET /api/dates
    cron/collect/route.ts   # POST /api/cron/collect (크롤링 트리거)
    admin/status/route.ts   # GET /api/admin/status

lib/
  db.ts           # node:sqlite 래퍼 — getDb(), upsertProducts(), deleteOldData()
  types.ts        # Product, RawProduct, SiteConfig 타입
  collect.ts      # 수집 오케스트레이터 (크롤링 → 스코어링 → DB 저장)
  scorer.ts       # TOP 100 스코어링 알고리즘
  cron.ts         # node-cron 스케줄러 (KST 09:00 = UTC 00:00)
  crawler/
    index.ts      # 9개 크롤러 순차 실행
    utils.ts      # 공통 유틸 (delay, parsePrice, generateDescription)
    sephora.ts    # 뷰티
    cultbeauty.ts # 뷰티
    iherb.ts      # 뷰티
    anthropologie.ts      # 라이프스타일
    urbanoutfitters.ts    # 라이프스타일
    terrain.ts            # 라이프스타일
    momastore.ts          # 아이디어
    uncommongoods.ts      # 아이디어
    poketo.ts             # 아이디어

components/
  Header.tsx        # 사이트 헤더 + 한국어 날짜
  CategoryTabs.tsx  # 전체/뷰티/라이프스타일/아이디어 탭
  ProductCard.tsx   # 상품 카드 (순위 뱃지, NEW/SALE 뱃지, 버튼)
  Pagination.tsx    # 페이지네이션
  SkeletonCard.tsx  # 로딩 스켈레톤

data/picks.db       # SQLite DB (자동 생성)
instrumentation.ts  # Next.js 서버 시작 시 cron 등록
```

## 핵심 설계 결정

- **DB**: Node.js 24 내장 `node:sqlite` 사용 (`better-sqlite3` 불필요 — 네이티브 컴파일 없음)
- **메인 페이지**: 서버 컴포넌트에서 DB 직접 접근 (API 불필요, SSR 성능 최적화)
- **크롤러**: Playwright headless Chromium, 요청 간 2~3초 딜레이, 사이트 실패 시 건너뜀
- **스코어링**: 신상품 +30 / 베스트셀러 +20 / 할인율 × 0.5 / 멀티소스 +10 / 중간가격대 +5
- **Cron**: `instrumentation.ts` → `lib/cron.ts` → UTC 00:00 (= KST 09:00) 매일 실행

## 스코어링 알고리즘

```
점수 = (신상품 ? +30 : 0)
     + (베스트셀러 ? +20 : 0)
     + (할인율 × 0.5)
     + (동일 브랜드 멀티소스 ? +10 : 0)
     + ($30~$200 가격대 ? +5 : 0)
```

## 디자인 팔레트

| 용도 | 색상 |
|------|------|
| 배경 | `#FAFAF8` (워밍 화이트) |
| 기본 텍스트 | `#1A1A1A` (딥 차콜) |
| 강조 | `#E8B4B8` (소프트 블러쉬) |
| 헤딩 폰트 | Noto Serif KR |
| 본문 폰트 | Noto Sans KR |
