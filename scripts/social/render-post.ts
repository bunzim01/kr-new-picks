// 게시물(카드뉴스) 렌더러 — 한국적 미니멀 디자인 (한지색 배경, 먹색 글자, 포인트 색 1개)
// 사용법: npx tsx scripts/social/render-post.ts data/social/posts/001-intro.json [출력폴더]
// 결과: <출력폴더>/<id>-1.png ... (1080x1350)

import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'

interface Slide {
  kind: 'cover' | 'text' | 'list' | 'cta'
  hangul: string      // 한글 포인트 단어 (장마다 1개)
  hangul_ar: string   // 그 단어의 아랍어 뜻
  title: string
  sub?: string
  body?: string
  items?: string[]
  ko: string          // 운영자 확인용 한국어 뜻 (이미지에는 안 들어감)
}
interface Post { id: string; slides: Slide[]; instagram: string; threads: string }

// 디자인 토큰
const C = { paper: '#FAF8F4', ink: '#1F1F1F', mute: '#8C857B', accent: '#C97C82', line: '#E6DFD5' }
const HANDLE = '@kbeauty_arabic'

const br = (s = '') => s.split('\n').join('<br>')

function slideHtml(s: Slide, i: number, total: number) {
  const dark = s.kind === 'cta'
  const bg = dark ? C.ink : C.paper
  const fg = dark ? C.paper : C.ink
  let main = ''
  if (s.kind === 'cover') {
    main = `<h1>${br(s.title)}</h1><p class="sub">${br(s.sub)}</p>`
  } else if (s.kind === 'list') {
    main = `<h2>${br(s.title)}</h2><ol>${(s.items ?? []).map((x) => `<li>${x}</li>`).join('')}</ol>`
  } else {
    main = `<h2>${br(s.title)}</h2><p>${br(s.body)}</p>`
  }
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;600;700&family=Noto+Serif+KR:wght@500;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1350px;background:${bg};color:${fg};font-family:'IBM Plex Sans Arabic',sans-serif}
.card{position:relative;width:100%;height:100%;padding:96px 88px;display:flex;flex-direction:column}
.frame{position:absolute;inset:40px;border:1.5px solid ${dark ? '#3A3A3A' : C.line}}
.top{display:flex;justify-content:space-between;align-items:flex-start}
.word{direction:ltr;text-align:left}
.hangul{font-family:'Noto Serif KR',serif;font-weight:700;font-size:${s.kind === 'cover' ? 120 : 76}px;line-height:1.1;color:${C.accent};letter-spacing:-2px}
.gloss{font-size:28px;color:${dark ? '#B5AEA4' : C.mute};margin-top:10px;direction:rtl;text-align:left}
.page{font-family:'Noto Serif KR',serif;font-size:28px;color:${dark ? '#B5AEA4' : C.mute};direction:ltr}
.main{flex:1;display:flex;flex-direction:column;justify-content:center}
h1{font-size:84px;line-height:1.35;font-weight:700}
h2{font-size:70px;line-height:1.3;font-weight:700;margin-bottom:44px}
.sub{font-size:44px;line-height:1.6;margin-top:40px;color:${dark ? '#D9D2C8' : '#4A4540'}}
p{font-size:48px;line-height:1.7}
ol{list-style:none;counter-reset:n}
li{counter-increment:n;display:flex;gap:28px;align-items:baseline;font-size:44px;line-height:1.5;padding:22px 0;border-bottom:1.5px solid ${C.line}}
li:last-child{border-bottom:none}
li::before{content:counter(n);font-family:'Noto Serif KR',serif;font-weight:700;font-size:40px;color:${C.accent};flex:0 0 40px}
.bottom{display:flex;justify-content:space-between;align-items:center;font-size:30px}
.handle{direction:ltr;font-weight:600}
.seoul{font-family:'Noto Serif KR',serif;color:${dark ? '#B5AEA4' : C.mute};direction:ltr}
</style></head><body><div class="card"><div class="frame"></div>
<div class="top"><div class="page">${i + 1} / ${total}</div><div class="word"><div class="hangul">${s.hangul}</div><div class="gloss">${s.hangul_ar}</div></div></div>
<div class="main">${main}</div>
<div class="bottom"><span class="seoul">from Seoul · 서울에서</span><span class="handle">${HANDLE}</span></div>
</div></body></html>`
}

async function main() {
  const file = process.argv[2]
  if (!file) throw new Error('게시물 JSON 경로를 넣어 주세요')
  const post: Post = JSON.parse(fs.readFileSync(file, 'utf8'))
  const out = process.argv[3] ?? path.join('data', 'social', 'out')
  fs.mkdirSync(out, { recursive: true })
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined })
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } })
  for (let i = 0; i < post.slides.length; i++) {
    await page.setContent(slideHtml(post.slides[i], i, post.slides.length), { waitUntil: 'networkidle' })
    await page.evaluate(() => (globalThis as any).document.fonts.ready) // 웹폰트 로딩 대기
    await page.screenshot({ path: path.join(out, `${post.id}-${i + 1}.png`) })
  }
  await browser.close()
  console.log(`✅ ${post.id}: ${post.slides.length}장 → ${out}`)
  console.log(`   인스타 캡션 ${post.instagram.length}자 / 스레드 ${post.threads.length}자 (스레드 한도 500자)`)
}
main().catch((e) => { console.error('❌', e); process.exit(1) })
