#!/usr/bin/env node
// 인플루언서 수동 수집 — npm run collect:influencers
//
// 예시:
//   npm run collect:influencers                                  # data/influencers/*.csv 읽기
//   npm run collect:influencers -- --csv ./내파일.csv            # 특정 CSV
//   npm run collect:influencers -- --youtube "韓国コスメ,スキンケア ライブ"   # YouTube 검색 (YOUTUBE_API_KEY 필요)
//   npm run collect:influencers -- --instagram                   # CSV 의 Instagram 계정을 API 로 갱신 (IG_ACCESS_TOKEN 필요)

import { collectInfluencers } from '../lib/collect-influencers'

function parseArgs(argv: string[]) {
  const csv: string[] = []
  let youtube: string[] = []
  let instagram = false
  let liveLimit: number | undefined
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--csv' && argv[i + 1]) csv.push(argv[++i])
    else if (a === '--youtube' && argv[i + 1]) youtube = argv[++i].split(',').map(s => s.trim()).filter(Boolean)
    else if (a === '--instagram') instagram = true
    else if (a === '--live-limit' && argv[i + 1]) liveLimit = parseInt(argv[++i], 10)
  }
  return { csv, youtube, instagram, liveLimit }
}

;(async () => {
  const args = parseArgs(process.argv.slice(2))
  console.log('=== 일본 인플루언서 발굴 — 수집 시작 ===')
  const result = await collectInfluencers({
    csvPaths: args.csv.length ? args.csv : undefined,
    youtubeKeywords: args.youtube,
    youtubeLiveCheckLimit: args.liveLimit,
    enrichInstagram: args.instagram,
  })

  console.log('')
  console.log('상위 10명:')
  for (const s of result.top) {
    console.log(`  ${String(s.rank).padStart(3)}위  ${s.score.toFixed(1)}점  ${s.grade}  ${s.platform}/@${s.handle}  팔로워 ${s.followers.toLocaleString('ko-KR')}`)
  }
  console.log('')
  console.log(`=== 완료: ${result.date}, 수집 ${result.collected}명 → 신규 ${result.inserted}·갱신 ${result.updated}·제외 ${result.excluded} ===`)
  console.log('화면에서 보기: npm run dev 후 http://localhost:3000/influencers')
  process.exit(0)
})().catch(err => {
  console.error('수집 실패:', err)
  process.exit(1)
})
