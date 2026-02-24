// Node.js 24 내장 SQLite 모듈 사용
import { DatabaseSync } from 'node:sqlite'
import path from 'path'
import fs from 'fs'

const DB_PATH = path.join(process.cwd(), 'data', 'picks.db')

// data 디렉토리 보장
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })

let _db: DatabaseSync | null = null

export function getDb(): DatabaseSync {
  if (!_db) {
    _db = new DatabaseSync(DB_PATH)
    initSchema(_db)
  }
  return _db
}

function initSchema(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      title            TEXT    NOT NULL,
      image_url        TEXT    NOT NULL DEFAULT '',
      price            TEXT    NOT NULL DEFAULT '',
      original_price   TEXT    NOT NULL DEFAULT '',
      discount_rate    REAL    NOT NULL DEFAULT 0,
      description      TEXT    NOT NULL DEFAULT '',
      product_url      TEXT    NOT NULL DEFAULT '',
      brand            TEXT    NOT NULL DEFAULT '',
      source_site      TEXT    NOT NULL DEFAULT '',
      category         TEXT    NOT NULL DEFAULT '',
      score            REAL    NOT NULL DEFAULT 0,
      rank             INTEGER NOT NULL DEFAULT 0,
      collected_date   TEXT    NOT NULL,
      created_at       DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_products_date
      ON products(collected_date);

    CREATE INDEX IF NOT EXISTS idx_products_date_rank
      ON products(collected_date, rank);
  `)
}

// 전체 상품 교체 (기존 전체 삭제 후 새 데이터 삽입)
export function upsertProducts(
  products: Array<{
    title: string
    image_url: string
    price: string
    original_price: string
    discount_rate: number
    description: string
    product_url: string
    brand: string
    source_site: string
    category: string
    score: number
    rank: number
    collected_date: string
  }>
) {
  const db = getDb()

  if (products.length === 0) return

  // 트랜잭션으로 원자적 교체 — 모든 기존 데이터 삭제 후 새 데이터 삽입
  db.exec('BEGIN')
  try {
    db.exec('DELETE FROM products')

    const insert = db.prepare(`
      INSERT INTO products
        (title, image_url, price, original_price, discount_rate, description,
         product_url, brand, source_site, category, score, rank, collected_date)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    for (const p of products) {
      insert.run(
        p.title, p.image_url, p.price, p.original_price,
        p.discount_rate, p.description, p.product_url, p.brand,
        p.source_site, p.category, p.score, p.rank, p.collected_date
      )
    }

    db.exec('COMMIT')
  } catch (err) {
    db.exec('ROLLBACK')
    throw err
  }
}

// 특정 날짜 데이터 삭제 (수집 전 초기화용)
export function deleteDateData(date: string) {
  const db = getDb()
  db.prepare('DELETE FROM products WHERE collected_date = ?').run(date)
}

// 30일 이상 된 데이터 삭제
export function deleteOldData() {
  const db = getDb()
  db.prepare(`
    DELETE FROM products
    WHERE collected_date < date('now', '-30 days')
  `).run()
}

// 수집된 날짜 목록 조회
export function getAvailableDates(): string[] {
  const db = getDb()
  const rows = db.prepare(`
    SELECT DISTINCT collected_date
    FROM products
    ORDER BY collected_date DESC
  `).all() as unknown as Array<{ collected_date: string }>
  return rows.map(r => r.collected_date)
}

// 날짜별 상품 수
export function getProductCount(date: string): number {
  const db = getDb()
  const row = db.prepare(
    'SELECT COUNT(*) as cnt FROM products WHERE collected_date = ?'
  ).get(date) as unknown as { cnt: number } | undefined
  return row?.cnt ?? 0
}
