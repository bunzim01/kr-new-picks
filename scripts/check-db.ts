#!/usr/bin/env node
import { getDb } from '../lib/db'

const db = getDb()
const total = db.prepare('SELECT COUNT(*) as n FROM products').get() as { n: number }
const byCategory = db.prepare('SELECT category, COUNT(*) as n FROM products GROUP BY category').all() as { category: string; n: number }[]
const bySource = db.prepare('SELECT source_site, COUNT(*) as n FROM products GROUP BY source_site ORDER BY n DESC').all() as { source_site: string; n: number }[]
const samples = db.prepare('SELECT rank, title, price, category, source_site FROM products ORDER BY rank LIMIT 5').all() as { rank: number; title: string; price: string; category: string; source_site: string }[]

console.log('총 상품:', total.n)
console.log('\n카테고리별:')
byCategory.forEach(x => console.log(`  ${x.category}: ${x.n}개`))
console.log('\n사이트별:')
bySource.forEach(x => console.log(`  ${x.source_site}: ${x.n}개`))
console.log('\nTOP 5:')
samples.forEach(p => console.log(`  #${p.rank} [${p.category}] ${p.title.slice(0, 50)} | ${p.price || '(무가격)'} | ${p.source_site}`))
