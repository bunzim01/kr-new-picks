# Vercel 배포 가이드

## 🚀 Vercel에 배포하기

### 사전 준비사항
- Vercel 계정 (https://vercel.com)
- GitHub 계정 (선택사항)
- Vercel CLI

---

## 방법 1: 로컬에서 CLI로 배포 (가장 간단)

### 1단계: Vercel 로그인
```bash
vercel login
```

이메일 입력 후 이메일로 받은 링크를 클릭하여 인증합니다.

### 2단계: 프로젝트 배포
```bash
cd kr-new-picks
vercel deploy --prod
```

배포가 진행되며, 완료 후 **https://kr-new-picks.vercel.app** 형태의 URL을 받습니다.

---

## 방법 2: GitHub 연결 (권장)

### 1단계: GitHub에 푸시
```bash
# 저장소 초기화
git init
git add .
git commit -m "Initial commit: RSS-based new product curation site"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/kr-new-picks.git
git push -u origin main
```

### 2단계: Vercel에서 Import
1. https://vercel.com/new로 이동
2. "Import Git Repository" 클릭
3. GitHub 리포지토리 선택
4. Framework: **Next.js** (자동 감지)
5. "Deploy" 클릭

배포 완료 후 커밋할 때마다 자동 배포됨 (CI/CD)

---

## ⚠️ 주의: SQLite 데이터 영속성

### Vercel의 제한사항
- ❌ SQLite 데이터는 각 배포마다 초기화됨
- ❌ 함수 실행 중에만 /tmp 사용 가능
- ❌ 데이터가 유지되지 않음

### 해결책

#### 옵션 1: 로컬 개발 전용 (권장)
프로덕션에서는 스크래핑 비활성화:

**.env.production**
```
ENABLE_SCRAPING=false
ENABLE_CRON=false
```

#### 옵션 2: PostgreSQL 사용 (고급)
Vercel Postgres를 사용하여 데이터 영속성 확보:

```bash
# Vercel에서 제공하는 PostgreSQL 생성
vercel env pull .env.local

# 프로젝트에 @vercel/postgres 설치
npm install @vercel/postgres
```

#### 옵션 3: 외부 데이터베이스 (권장)
- Supabase PostgreSQL: https://supabase.com
- PlanetScale MySQL: https://planetscale.com
- MongoDB Atlas: https://www.mongodb.com/cloud/atlas

---

## 환경 변수 설정

Vercel 대시보드에서 설정 → 환경 변수:

```
NODE_ENV = production
ENABLE_SCRAPING = false
ENABLE_CRON = false
```

또는 CLI로:
```bash
vercel env add ENABLE_SCRAPING
vercel env add ENABLE_CRON
```

---

## 배포 후 확인

1. **Vercel 대시보드**: https://vercel.com/dashboard
2. **배포된 사이트**: https://kr-new-picks.vercel.app
3. **로그 확인**:
   ```bash
   vercel logs kr-new-picks
   ```

---

## 커스텀 도메인 연결

Vercel 대시보드에서:
1. 프로젝트 선택
2. Settings → Domains
3. 도메인 추가 (예: products.mydomain.com)
4. DNS 레코드 업데이트

---

## 배포 후 스크래핑 트리거

### 옵션 1: Vercel Cron 작업 (권장)
**vercel.json** 추가:
```json
{
  "crons": [
    {
      "path": "/api/cron/scrape",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

### 옵션 2: 외부 서비스
- EasyCron: https://www.easycron.com
- Cron Job: https://cron-job.org

```bash
curl -X POST https://kr-new-picks.vercel.app/api/scrape
```

### 옵션 3: GitHub Actions (CI/CD)
**.github/workflows/scrape.yml**:
```yaml
name: Daily Scrape
on:
  schedule:
    - cron: '0 */6 * * *'

jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger scraping
        run: |
          curl -X POST https://kr-new-picks.vercel.app/api/scrape
```

---

## 문제 해결

### 빌드 실패 "module not found"
```bash
# .gitignore에서 제거
node_modules/
.next/

# Vercel에서 재설치
npm install --legacy-peer-deps
```

### 배포 후 데이터가 없음
이는 정상 동작입니다. SQLite 데이터는 서버리스 환경에서 유지되지 않습니다.

**해결책**: PostgreSQL 등 외부 DB 사용

### 스크래핑 시간 초과
- API 최대 실행 시간: 60초 (Hobby), 900초 (Pro)
- `vercel.json`에서 `maxDuration` 증가:

```json
{
  "functions": {
    "app/api/scrape": {
      "maxDuration": 120
    }
  }
}
```

---

## 모니터링

### Vercel Analytics
1. 프로젝트 → Settings → Analytics
2. Web Vitals, Performance 모니터링
3. 에러 로그 실시간 확인

### 커스텀 로깅
```typescript
// app/api/scrape/route.ts
console.log('스크래핑 시작:', new Date().toISOString());
```

Vercel 대시보드의 Logs 탭에서 확인 가능

---

## 성능 최적화

### 1. 이미지 최적화
```typescript
// components/ProductCard.tsx에서 이미지 CDN 사용
<Image
  src={product.image_url}
  alt={product.title}
  priority={false}
  quality={75}
/>
```

### 2. 캐싱 전략
```typescript
// app/page.tsx
export const revalidate = 3600; // 1시간 캐시
```

### 3. 번들 크기 줄이기
```bash
npm install -g @vercel/analyze
vercel analyze
```

---

## 비용 추정

| 항목 | 비용 |
|------|------|
| Hobby (기본) | **무료** |
| Bandwidth (100GB/월) | 무료 |
| Build (100/월) | 무료 |
| Database (외부) | 별도 |

---

## 배포 체크리스트

- [ ] `.env.production` 생성 (스크래핑 비활성화)
- [ ] `vercel.json` 설정 확인
- [ ] 환경 변수 Vercel 대시보드에 설정
- [ ] 로컬에서 `npm run build` 성공
- [ ] GitHub에 푸시 (선택)
- [ ] Vercel 로그인 (`vercel login`)
- [ ] 배포 실행 (`vercel deploy --prod`)
- [ ] 배포된 URL 확인
- [ ] API 엔드포인트 테스트 (`/api/products`)
- [ ] 커스텀 도메인 연결 (선택)

---

## 다음 단계

1. **데이터베이스 마이그레이션**: SQLite → PostgreSQL
2. **API 인증**: JWT 토큰 추가
3. **모니터링**: Sentry, LogRocket 연동
4. **CDN**: Cloudflare 연동 (선택)

---

## 지원

Vercel 문제: https://vercel.com/support
프로젝트 문제: 이 README.md 참고

**행운을 빕니다! 🚀**
