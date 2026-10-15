// 아랍어 K-뷰티 꿀팁 카드 이미지 + 캡션 생성 스크립트
// 사용법: npx tsx scripts/social/kbeauty-ar.ts [--tip N] [--out 폴더]
//   - 팁을 고르지 않으면 "오늘 날짜" 기준으로 30개 팁을 순서대로 돌려가며 선택
//   - 결과: <out>/tip-N.png (1080x1350 인스타 세로 카드), <out>/tip-N.json (캡션/해시태그)

import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'

interface Tip {
  id: number
  topic: string
  ko: string
  ar_title: string
  ar: string
}
interface TipBank {
  brand: { handle: string; signature_ar: string; signature_ko: string }
  hashtags: string[]
  tips: Tip[]
}

const ROOT = path.resolve(__dirname, '..', '..')
const BANK_PATH = path.join(ROOT, 'data', 'social', 'kbeauty-tips-ar.json')

function parseArgs() {
  const args = process.argv.slice(2)
  const get = (flag: string) => {
    const i = args.indexOf(flag)
    return i >= 0 ? args[i + 1] : undefined
  }
  return {
    tip: get('--tip') ? Number(get('--tip')) : undefined,
    out: get('--out') ?? path.join(ROOT, 'data', 'social', 'out'),
  }
}

// 날짜 기준 순환 선택 — 같은 날엔 항상 같은 팁, 다음 날엔 다음 팁
function pickTipByDate(tips: Tip[]): Tip {
  const dayIndex = Math.floor(Date.now() / 86_400_000)
  return tips[dayIndex % tips.length]
}

// 인스타(2200자) / 스레드(500자) 캡션 생성
function buildCaptions(bank: TipBank, tip: Tip) {
  const tags = bank.hashtags.join(' ')
  const instagram = [
    `✨ ${tip.ar_title}`,
    '',
    tip.ar,
    '',
    `💡 ${bank.brand.signature_ar}`,
    `احفظي المنشور وشاركيه مع صديقتك 💕`,
    '',
    tags,
  ].join('\n')

  // 스레드는 500자 제한 — 본문 + 해시태그 3개만
  let threads = `✨ ${tip.ar_title}\n\n${tip.ar}\n\n${bank.hashtags.slice(0, 3).join(' ')}`
  if (threads.length > 500) {
    threads = `✨ ${tip.ar_title}\n\n${tip.ar}`.slice(0, 497) + '…'
  }
  return { instagram, threads }
}

// 카드 HTML — 아랍어는 RTL, 구글 폰트(Cairo) 사용
function cardHtml(bank: TipBank, tip: Tip) {
  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;800&family=Noto+Serif+KR:wght@600&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 1080px; height: 1350px; background: #FAFAF8; font-family: 'Cairo', sans-serif; color: #1A1A1A; }
  .card { position: relative; width: 100%; height: 100%; padding: 90px 80px; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; }
  .blob { position: absolute; border-radius: 50%; background: #E8B4B8; opacity: .35; }
  .b1 { width: 520px; height: 520px; top: -200px; left: -160px; }
  .b2 { width: 360px; height: 360px; bottom: -120px; right: -100px; opacity: .25; }
  .top { position: relative; display: flex; justify-content: space-between; align-items: center; }
  .pill { background: #1A1A1A; color: #FAFAF8; font-weight: 700; font-size: 30px; padding: 12px 34px; border-radius: 999px; }
  .num { font-weight: 800; font-size: 34px; color: #C98B91; }
  .mid { position: relative; }
  .kicker { font-size: 32px; font-weight: 600; color: #C98B91; margin-bottom: 22px; }
  h1 { font-size: 74px; line-height: 1.25; font-weight: 800; margin-bottom: 46px; }
  p { font-size: 44px; line-height: 1.75; font-weight: 400; }
  .bar { width: 160px; height: 10px; background: #E8B4B8; border-radius: 999px; margin-bottom: 38px; }
  .bottom { position: relative; display: flex; justify-content: space-between; align-items: flex-end; border-top: 2px solid #E8B4B8; padding-top: 34px; }
  .handle { font-size: 34px; font-weight: 700; direction: ltr; }
  .ko { font-family: 'Noto Serif KR', serif; font-size: 28px; color: #6B6B6B; direction: ltr; }
</style>
</head>
<body>
<div class="card">
  <div class="blob b1"></div><div class="blob b2"></div>
  <div class="top"><span class="pill">الجمال الكوري</span><span class="num">نصيحة #${tip.id}</span></div>
  <div class="mid">
    <div class="kicker">${bank.brand.signature_ar}</div>
    <div class="bar"></div>
    <h1>${tip.ar_title}</h1>
    <p>${tip.ar}</p>
  </div>
  <div class="bottom"><span class="handle">${bank.brand.handle}</span><span class="ko">${tip.topic} · K-Beauty</span></div>
</div>
</body></html>`
}

async function main() {
  const { tip: tipId, out } = parseArgs()
  const bank: TipBank = JSON.parse(fs.readFileSync(BANK_PATH, 'utf8'))
  const tip = tipId ? bank.tips.find((t) => t.id === tipId) : pickTipByDate(bank.tips)
  if (!tip) throw new Error(`팁 #${tipId} 을(를) 찾을 수 없습니다 (1~${bank.tips.length})`)

  fs.mkdirSync(out, { recursive: true })
  const png = path.join(out, `tip-${tip.id}.png`)
  const json = path.join(out, `tip-${tip.id}.json`)

  // 환경변수 CHROMIUM_PATH 가 있으면 그 실행 파일 사용 (클라우드 세션용), 없으면 Playwright 기본 설치본
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined })
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } })
  await page.setContent(cardHtml(bank, tip), { waitUntil: 'networkidle' })
  await page.evaluate(() => (document as any).fonts.ready) // 웹폰트 로딩 대기
  await page.screenshot({ path: png, type: 'png' })
  await browser.close()

  const captions = buildCaptions(bank, tip)
  fs.writeFileSync(
    json,
    JSON.stringify(
      { id: tip.id, topic: tip.topic, ko: tip.ko, image: png, width: 1080, height: 1350, ...captions },
      null,
      2,
    ),
  )
  console.log(`✅ 팁 #${tip.id} (${tip.topic})`)
  console.log(`   이미지: ${png}`)
  console.log(`   캡션:   ${json}`)
  console.log(`   인스타 ${captions.instagram.length}자 / 스레드 ${captions.threads.length}자`)
}

main().catch((e) => {
  console.error('❌ 생성 실패:', e)
  process.exit(1)
})
