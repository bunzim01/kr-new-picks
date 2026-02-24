#!/usr/bin/env node
import { getDb } from '../lib/db'

const db = getDb()
const rows = db.prepare(`
  SELECT source_site, image_url
  FROM products
  WHERE collected_date = date('now')
  ORDER BY source_site
`).all() as { source_site: string; image_url: string }[]

// 사이트별 이미지 URL 샘플 출력
const bySource = new Map<string, string[]>()
for (const r of rows) {
  if (!bySource.has(r.source_site)) bySource.set(r.source_site, [])
  bySource.get(r.source_site)!.push(r.image_url)
}

for (const [site, urls] of bySource) {
  console.log(`\n=== ${site} ===`)
  urls.slice(0, 2).forEach(u => console.log('  ', u))
}
