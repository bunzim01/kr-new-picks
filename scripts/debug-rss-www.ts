#!/usr/bin/env node
import { chromium } from 'playwright'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36'

;(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'] })
  const ctx = await browser.newContext({ userAgent: UA, locale: 'en-US', viewport: { width: 1280, height: 900 } })
  const page = await ctx.newPage()

  // Design Milk 메인 RSS 테스트
  console.log('=== Design Milk 메인 RSS ===')
  try {
    const res = await page.request.get('https://design-milk.com/feed/', { timeout: 15000 })
    console.log('status:', res.status())
    const text = await res.text()
    const items = [...text.matchAll(/<item>([\s\S]*?)<\/item>/g)]
    console.log('item 개수:', items.length)
    if (items.length > 0) {
      for (const m of items.slice(0, 3)) {
        const item = m[1]
        const title = item.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/)?.[1]?.trim()
        const link = item.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim()
        const img = item.match(/<media:content[^>]+url="([^"]+)"/)?.[1]?.slice(0,70) ?? item.match(/enclosure[^>]+url="([^"]+)"/)?.[1]?.slice(0,70) ?? ''
        console.log('  제목:', title?.slice(0, 60))
        console.log('  링크:', link?.slice(0, 70))
        console.log('  img:', img)
      }
    }
  } catch(e) { console.log('오류:', String(e).slice(0, 100)) }

  // Who What Wear - [class*="item"] 탐색
  console.log('\n=== Who What Wear item 탐색 ===')
  try {
    await page.goto('https://www.whowhatwear.com/beauty', { waitUntil: 'domcontentloaded', timeout: 25000 })
    await page.waitForTimeout(2000)
    const sample = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('[class*="item"]')).slice(0, 10)
      return items.map(el => {
        const a = el.querySelector('a[href]') as HTMLAnchorElement | null
        const h = el.querySelector('h1,h2,h3,h4,[class*="title"],[class*="hed"]') as HTMLElement | null
        const img = el.querySelector('img') as HTMLImageElement | null
        return {
          cls: (el as HTMLElement).className.slice(0, 50),
          href: a?.href?.slice(0, 80) ?? '',
          title: h?.textContent?.trim().slice(0, 60) ?? '',
          img: img?.getAttribute('src')?.slice(0, 60) ?? '',
          tag: el.tagName,
        }
      })
    })
    sample.forEach((x, i) => console.log(`  [${i}] ${x.tag} class="${x.cls}"\n      href=${x.href}\n      title="${x.title}"`))
  } catch(e) { console.log('오류:', String(e).slice(0, 100)) }

  await browser.close()
})().catch(err => { console.error(err); process.exit(1) })
