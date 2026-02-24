#!/usr/bin/env node
import { chromium } from 'playwright'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36'

;(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'] })
  const ctx = await browser.newContext({ userAgent: UA, locale: 'en-US', viewport: { width: 1280, height: 900 } })
  await ctx.addInitScript(() => { Object.defineProperty(navigator, 'webdriver', { get: () => false }) })
  const page = await ctx.newPage()

  // 홈페이지 테스트 (162개 [class*="post"] 확인)
  await page.goto('https://design-milk.com/', { waitUntil: 'domcontentloaded', timeout: 25000 })
  await page.waitForTimeout(2000)

  const result = await page.evaluate(() => {
    const posts = Array.from(document.querySelectorAll('[class*="post"]'))
    console.log('total [class*=post]:', posts.length)

    // 유니크 URL/title 추출
    const seen = new Set<string>()
    const items: { cls: string; h: string; url: string; img: string }[] = []

    for (const p of posts) {
      const aEl = p.querySelector('a[href]') as HTMLAnchorElement | null
      const href = aEl?.getAttribute('href') ?? ''
      if (!href || href.includes('/category/') || href.includes('/tag/') || seen.has(href)) continue
      if (!href.includes('design-milk.com')) continue
      seen.add(href)

      const h = p.querySelector('h2,h3')?.textContent?.trim().slice(0, 70) ?? ''
      const img = (p.querySelector('img') as HTMLImageElement | null)?.getAttribute('src')?.slice(0, 70) ?? ''
      const cls = (p as HTMLElement).className?.slice(0, 40) ?? ''

      if (h && items.length < 10) items.push({ cls, h, url: href.slice(0, 80), img })
    }
    return { total: posts.length, items }
  })

  console.log('총 [class*=post]:', result.total)
  console.log('유니크 아이템:', result.items.length)
  result.items.forEach((x, i) => {
    console.log(`  [${i}] class="${x.cls}"`)
    console.log(`      제목: "${x.h}"`)
    console.log(`      url: ${x.url}`)
    console.log(`      img: ${x.img}`)
  })

  await browser.close()
})().catch(err => { console.error(err); process.exit(1) })
