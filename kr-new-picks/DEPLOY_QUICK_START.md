# 🚀 Vercel 배포 빠른 시작

## 5분 안에 배포하기

---

## 방법 A: GitHub + Vercel 자동 배포 (권장)

### 1️⃣ GitHub에 푸시
```bash
cd kr-new-picks

# Git 저장소 초기화
git init
git add .
git commit -m "Add: RSS-based new product curation site"

# GitHub에 푸시 (YOUR_USERNAME 변경)
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/kr-new-picks.git
git push -u origin main
```

### 2️⃣ Vercel에서 Import
1. https://vercel.com/new 방문
2. "Import Git Repository" 클릭
3. GitHub 리포지토리 선택
4. **Deploy** 클릭 (자동 감지됨)

### 3️⃣ 완료! 🎉
- 배포 URL: `https://kr-new-picks.vercel.app`
- 커밋할 때마다 자동 배포

---

## 방법 B: CLI로 직접 배포 (빠름)

### 1️⃣ Vercel CLI 사용
```bash
# 이미 설치됨
vercel login
cd kr-new-picks
vercel deploy --prod
```

### 2️⃣ 프롬프트 따라하기
```
? Set up and deploy "kr-new-picks"? [Y/n] Y
? Which scope? (선택 또는 새로 생성)
? Link to existing project? [y/N] N
? What's your project's name? kr-new-picks
? In which directory is your code? ./
? Create Vercel project? [Y/n] Y
? Deploy? [y/N] Y
```

### 3️⃣ 배포 완료! 🎉
URL이 콘솔에 표시됨

---

## 배포 후 설정

### ✅ 환경 변수 확인
Vercel 대시보드에서 자동으로 설정됨:
- `ENABLE_SCRAPING=false` (SQLite 데이터 영속성 없음)
- `ENABLE_CRON=false` (수동 배포)

### ✅ 커스텀 도메인 연결 (선택)
Vercel 대시보드 → Settings → Domains
```
my-products.com
```

---

## 🧪 배포 후 테스트

```bash
# 배포된 사이트 확인
https://kr-new-picks.vercel.app

# API 테스트
curl https://kr-new-picks.vercel.app/api/products

# 로그 확인
vercel logs kr-new-picks
```

---

## ⚠️ 주의사항

### SQLite 데이터 영속성 없음
Vercel 서버리스 환경에서는 파일 시스템이 휘발성입니다.
- ❌ 스크래핑 데이터 저장 불가
- ❌ Cron 작업 자동 실행 불가

### 해결책
**프로덕션용 DB 사용:**
- [Supabase PostgreSQL](https://supabase.com)
- [Vercel Postgres](https://vercel.com/storage/postgres)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

---

## 📚 상세 가이드

더 많은 정보는 `DEPLOYMENT.md` 참고

---

## 🆘 문제 해결

### 빌드 실패
```bash
# 로컬에서 먼저 확인
npm run build
npm start
```

### 배포 후 스타일 깨짐
```bash
# Tailwind 재빌드
npm run build
```

### 느린 속도
- Vercel Pro 업그레이드
- CDN 활성화

---

## 배포 완료 체크리스트

- [ ] GitHub 또는 Vercel에 배포 완료
- [ ] URL 접근 확인
- [ ] `/api/products` 정상 작동 확인
- [ ] 모바일에서 반응형 확인

---

**축하합니다! 🎉 배포 완료!**

GitHub 커밋 시마다 자동으로 배포됩니다.
