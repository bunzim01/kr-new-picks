// 아랍어 K-뷰티 꿀팁 카드 이미지 + 캡션 생성 스크립트
// 사용법: npx tsx scripts/social/kbeauty-ar.ts [--tip N] [--out 폴더] [--theme gold|sand|emerald|blush]
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
  carousel?: Carousel
}
// 카드뉴스(여러 장) 내용 — 있으면 5장짜리 카드뉴스, 없으면 1장 카드
interface Carousel {
  mistake_ko: string
  mistake_ar: string
  steps_title_ar: string
  steps_ko: string[]
  steps_ar: string[]
  bonus_ko: string
  bonus_ar: string
}
interface TipBank {
  brand: { handle: string; signature_ar: string; signature_ko: string; theme?: string }
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
    theme: get('--theme'),
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


// 디자인 테마 — --theme 옵션으로 선택 (기본값은 팁 파일의 brand.theme, 없으면 gold)
interface Theme {
  bg: string          // 배경
  fg: string          // 글자
  accent: string      // 포인트(금색 등)
  soft: string        // 보조 포인트
  endBg: string       // 마지막(저장 유도) 장 배경
  endFg: string       // 마지막 장 글자
  head: string        // 제목 폰트
  body: string        // 본문 폰트
  arch: boolean       // 아치형 프레임 사용
  pattern: boolean    // 아랍 기하학(8각 별) 문양 사용
  center: boolean     // 가운데 정렬
}
const THEMES: Record<string, Theme> = {
  // 기존 블러쉬 (사이트 팔레트)
  blush: { bg: '#FAFAF8', fg: '#1A1A1A', accent: '#C98B91', soft: '#E8B4B8', endBg: '#1A1A1A', endFg: '#FAFAF8',
    head: 'Cairo', body: 'Cairo', arch: false, pattern: false, center: false },
  // 딥 플럼 + 골드 — 걸프 럭셔리 뷰티 스타일
  gold: { bg: '#2A0E1B', fg: '#F6EBDD', accent: '#C9A25E', soft: '#E8C9A0', endBg: '#C9A25E', endFg: '#2A0E1B',
    head: 'El Messiri', body: 'Tajawal', arch: true, pattern: true, center: true },
  // 샌드 누드 + 테라코타 — 따뜻하고 부드러운 데일리 스타일
  sand: { bg: '#F4EADF', fg: '#3A2A22', accent: '#B07A5A', soft: '#D9B8A0', endBg: '#3A2A22', endFg: '#F4EADF',
    head: 'Amiri', body: 'Tajawal', arch: true, pattern: false, center: true },
  // 에메랄드 + 골드 — 고급 스파/한방 느낌
  emerald: { bg: '#0E3B36', fg: '#F3EBDD', accent: '#D4AF6A', soft: '#9FC3B5', endBg: '#D4AF6A', endFg: '#0E3B36',
    head: 'Reem Kufi', body: 'Tajawal', arch: true, pattern: true, center: true },
}

// 8각 별(아랍 전통 문양) 배경 타일 SVG
function starPattern(color: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" viewBox="0 0 140 140"><g fill="none" stroke="${color}" stroke-width="1.4" opacity=".16"><rect x="40" y="40" width="60" height="60"/><rect x="40" y="40" width="60" height="60" transform="rotate(45 70 70)"/><circle cx="70" cy="70" r="12"/></g></svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

// 카드뉴스 공통 틀 — 모든 장이 같은 배경/폰트/프레임/하단 계정 표시를 공유
function shell(bank: TipBank, tip: Tip, t: Theme, page: number, total: number, body: string, end = false) {
  const bg = end ? t.endBg : t.bg
  const fg = end ? t.endFg : t.fg
  const accent = end ? t.endFg : t.accent
  const fontQ = [t.head, t.body, 'Cairo'].map((f) => `family=${f.replace(/ /g, '+')}:wght@400;700`).join('&')
  return `<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?${fontQ}&family=Noto+Serif+KR:wght@600&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 1080px; height: 1350px; background: ${bg}; color: ${fg}; font-family: '${t.body}', sans-serif; }
  .card { position: relative; width: 100%; height: 100%; overflow: hidden;
    ${t.pattern && !end ? `background-image: ${starPattern(t.accent)};` : ''} }
  .blob { position: absolute; border-radius: 50%; background: ${t.soft}; opacity: .35; }
  .b1 { width: 520px; height: 520px; top: -200px; left: -160px; }
  .b2 { width: 360px; height: 360px; bottom: -120px; right: -100px; opacity: .25; }
  .top { position: absolute; top: 60px; left: 80px; right: 80px; display: flex; justify-content: space-between; align-items: center; z-index: 2; }
  .pill { border: 2px solid ${accent}; color: ${accent}; font-family: '${t.head}', sans-serif; font-weight: 700; font-size: 28px; padding: 8px 30px; border-radius: 999px; }
  .page { font-weight: 700; font-size: 30px; color: ${accent}; direction: ltr; letter-spacing: 2px; }
  .arch { position: absolute; top: 150px; left: 70px; right: 70px; bottom: 160px; border: 3px solid ${accent};
    border-radius: 470px 470px 18px 18px; background: ${bg}; }
  .arch::after { content: ''; position: absolute; inset: 14px; border: 1px solid ${accent}; opacity: .6; border-radius: 456px 456px 10px 10px; }
  .mid { position: absolute; z-index: 2; ${t.arch ? 'top: 150px; left: 70px; right: 70px; bottom: 160px; padding: 200px 90px 80px;' : 'top: 160px; left: 80px; right: 80px; bottom: 170px; padding-top: 120px;'}
    display: flex; flex-direction: column; justify-content: center; text-align: ${t.center ? 'center' : 'right'}; }
  .label { font-family: '${t.head}', sans-serif; font-size: 36px; font-weight: 700; color: ${accent}; margin-bottom: 22px; }
  .bar { width: 140px; height: 4px; background: ${accent}; margin: 0 ${t.center ? 'auto' : '0'} 40px; border-radius: 4px; }
  .orn { color: ${accent}; font-size: 34px; letter-spacing: 14px; margin: 0 0 30px; }
  h1 { font-family: '${t.head}', sans-serif; font-size: 90px; line-height: 1.3; font-weight: 700; }
  h2 { font-family: '${t.head}', sans-serif; font-size: 60px; line-height: 1.35; font-weight: 700; margin-bottom: 40px; }
  p { font-size: 52px; line-height: 1.75; }
  .swipe { margin-top: 60px; font-size: 34px; font-weight: 700; color: ${accent}; }
  ol { list-style: none; counter-reset: s; text-align: right; }
  li { counter-increment: s; display: flex; gap: 26px; align-items: flex-start; font-size: 42px; line-height: 1.6; margin-bottom: 36px; }
  li::before { content: counter(s); flex: 0 0 70px; height: 70px; border-radius: 50%; border: 2px solid ${accent}; color: ${accent};
    font-weight: 700; font-size: 36px; display: flex; align-items: center; justify-content: center; margin-top: 4px; }
  .bottom { position: absolute; bottom: 60px; left: 80px; right: 80px; display: flex; justify-content: space-between; align-items: center; z-index: 2; }
  .handle { font-size: 32px; font-weight: 700; direction: ltr; color: ${accent}; }
  .ko { font-family: 'Noto Serif KR', serif; font-size: 26px; opacity: .6; direction: ltr; }
</style></head><body>
<div class="card">
  ${t.arch ? '<div class="arch"></div>' : '<div class="blob b1"></div><div class="blob b2"></div>'}
  <div class="top"><span class="pill">الجمال الكوري</span><span class="page">${page} / ${total}</span></div>
  <div class="mid">${t.arch ? '<div class="orn">✦ ✦ ✦</div>' : ''}${body}</div>
  <div class="bottom"><span class="handle">${bank.brand.handle}</span><span class="ko">${tip.topic} · K-Beauty</span></div>
</div></body></html>`
}

// 카드뉴스 5장: 표지 → 흔한 실수 → 한국식 방법 → 보너스 팁 → 저장/팔로우 유도
function carouselHtml(bank: TipBank, tip: Tip, t: Theme): string[] {
  const c = tip.carousel!
  const total = 5
  return [
    shell(bank, tip, t, 1, total, `
      <div class="label">نصيحة #${tip.id}</div>
      <div class="bar"></div>
      <h1>${tip.ar_title}</h1>
      <div class="swipe">اسحبي لتعرفي السر ←</div>`),
    shell(bank, tip, t, 2, total, `
      <div class="label">❌ الخطأ الشائع</div>
      <div class="bar"></div>
      <p>${c.mistake_ar}</p>`),
    shell(bank, tip, t, 3, total, `
      <div class="label">✅ الطريقة الصحيحة</div>
      <h2>${c.steps_title_ar}</h2>
      <ol>${c.steps_ar.map((x) => `<li>${x}</li>`).join('')}</ol>`),
    shell(bank, tip, t, 4, total, `
      <div class="label">💡 نصيحة إضافية</div>
      <div class="bar"></div>
      <p>${c.bonus_ar}</p>`),
    shell(bank, tip, t, 5, total, `
      <h1>احفظي المنشور 📌</h1>
      <p style="margin-top:40px">وتابعي <b style="direction:ltr;display:inline-block">${bank.brand.handle}</b><br>لنصيحة جمال كورية جديدة كل يوم 🇰🇷</p>`, true),
  ]
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
  const { tip: tipId, out, theme: themeArg } = parseArgs()
  const bank: TipBank = JSON.parse(fs.readFileSync(BANK_PATH, 'utf8'))
  const tip = tipId ? bank.tips.find((t) => t.id === tipId) : pickTipByDate(bank.tips)
  if (!tip) throw new Error(`팁 #${tipId} 을(를) 찾을 수 없습니다 (1~${bank.tips.length})`)

  fs.mkdirSync(out, { recursive: true })
  const json = path.join(out, `tip-${tip.id}.json`)
  // 카드뉴스 내용이 있으면 5장, 없으면 1장
  const themeName = themeArg ?? bank.brand.theme ?? 'gold'
  const theme = THEMES[themeName]
  if (!theme) throw new Error(`테마 '${themeName}' 없음 (가능: ${Object.keys(THEMES).join(', ')})`)
  const pages = tip.carousel ? carouselHtml(bank, tip, theme) : [cardHtml(bank, tip)]
  const images: string[] = []

  // 환경변수 CHROMIUM_PATH 가 있으면 그 실행 파일 사용 (클라우드 세션용), 없으면 Playwright 기본 설치본
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined })
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } })
  for (let i = 0; i < pages.length; i++) {
    const png = path.join(out, pages.length > 1 ? `tip-${tip.id}-${i + 1}.png` : `tip-${tip.id}.png`)
    await page.setContent(pages[i], { waitUntil: 'networkidle' })
    await page.evaluate(() => (globalThis as any).document.fonts.ready) // 웹폰트 로딩 대기
    await page.screenshot({ path: png, type: 'png' })
    images.push(png)
  }
  await browser.close()

  const captions = buildCaptions(bank, tip)
  fs.writeFileSync(
    json,
    JSON.stringify(
      { id: tip.id, topic: tip.topic, ko: tip.ko, images, width: 1080, height: 1350, ...captions },
      null,
      2,
    ),
  )
  console.log(`✅ 팁 #${tip.id} (${tip.topic})`)
  console.log(`   이미지 ${images.length}장: ${images.join(', ')}`)
  console.log(`   캡션:   ${json}`)
  console.log(`   인스타 ${captions.instagram.length}자 / 스레드 ${captions.threads.length}자`)
}

main().catch((e) => {
  console.error('❌ 생성 실패:', e)
  process.exit(1)
})
