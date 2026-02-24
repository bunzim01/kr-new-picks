#!/usr/bin/env node
// Beautylish offerCard 내부 전체 구조 탐색

import { chromium } from 'playwright'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36'

;(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'] })
  const ctx = await browser.newContext({ userAgent: UA, locale: 'en-US', viewport: { width: 1280, height: 900 } })
  await ctx.addInitScript(() => { Object.defineProperty(navigator, 'webdriver', { get: () => false }) })
  const page = await ctx.newPage()

  await page.goto('https://www.beautylish.com/new-arrivals', { waitUntil: 'domcontentloaded', timeout: 25000 })
  await page.waitForSelector('.offerCard', { timeout: 10000 }).catch(() => {})
  await page.waitForTimeout(2000)

  const sample = await page.evaluate(() => {
    const card = document.querySelector('.offerCard')
    if (!card) return { html: 'no card', items: [] }

    // 전체 HTML (일부)
    const html = card.outerHTML.slice(0, 800)

    // 카드들 상세 탐색
    const cards = Array.from(document.querySelectorAll('.offerCard')).slice(0, 5)
    const items = cards.map(c => {
      const els: Record<string, string> = {}
      ;['offerCard_title', 'offerCard_caption', 'offerCard_description', 'offerCard_details', 'offerCard_price', 'offerCard_stats'].forEach(cls => {
        const el = c.querySelector('.' + cls)
        if (el) els[cls] = el.textContent?.trim().slice(0, 80) ?? ''
      })
      return els
    })

    return { html, items }
  })

  console.log('첫 번째 카드 HTML:')
  console.log(sample.html)
  console.log('\n카드 요소별 텍스트:')
  sample.items.forEach((item, i) => {
    console.log(`\n  카드 #${i}:`)
    Object.entries(item).forEach(([k, v]) => console.log(`    ${k}: "${v}"`))
  })

  await browser.close()
})().catch(err => { console.error(err); process.exit(1) })
