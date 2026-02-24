import { DatabaseSync } from 'node:sqlite';
import { Product, CategoryType } from './types';

let dbInstance: DatabaseSync | null = null;

// DB 경로 (process.cwd() + 'data/products.db')
const DB_PATH = `${process.cwd()}/data/products.db`;

// DB 인스턴스 획득
export function getDb(): DatabaseSync {
  if (!dbInstance) {
    dbInstance = new DatabaseSync(DB_PATH);
    dbInstance.exec('PRAGMA journal_mode = WAL');
  }
  return dbInstance;
}

// 스키마 초기화
export function initSchema(): void {
  const db = getDb();

  // products 테이블
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      image_url TEXT NOT NULL DEFAULT '',
      price TEXT NOT NULL DEFAULT '',
      brand TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      product_url TEXT NOT NULL UNIQUE,
      source_site TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'Other',
      published_at DATETIME,
      collected_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // INDEX 별도 생성
  db.exec(`CREATE INDEX IF NOT EXISTS idx_collected_desc ON products (collected_at DESC);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_category ON products (category);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_published ON products (published_at DESC);`);

  // scrape_log 테이블
  db.exec(`
    CREATE TABLE IF NOT EXISTS scrape_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      total_fetched INTEGER,
      filtered_count INTEGER,
      inserted_count INTEGER,
      skipped_count INTEGER,
      status TEXT
    );
  `);

  console.log('[DB] ✅ 스키마 초기화 완료');
}

// 상품 저장 (중복 무시)
export function upsertProducts(products: Product[]): { inserted: number; skipped: number } {
  const db = getDb();
  let inserted = 0;
  let skipped = 0;

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO products (
      title, image_url, price, brand, description,
      product_url, source_site, category, published_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const product of products) {
    const result = stmt.run(
      product.title,
      product.image_url || '',
      product.price || '',
      product.brand || '',
      product.description,
      product.product_url,
      product.source_site,
      product.category,
      product.published_at || new Date().toISOString()
    ) as unknown as { changes: number };

    if (result.changes > 0) {
      inserted++;
    } else {
      skipped++;
    }
  }

  return { inserted, skipped };
}

// 상품 조회 (페이지네이션 + 카테고리 필터)
export function getProducts(
  page: number = 1,
  limit: number = 20,
  category?: string
): { products: Product[]; total: number } {
  const db = getDb();
  const offset = (page - 1) * limit;

  let query = 'SELECT * FROM products';
  const params: (string | number)[] = [];

  if (category && category !== 'All') {
    query += ' WHERE category = ?';
    params.push(category);
  }

  query += ' ORDER BY collected_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  // 데이터 조회
  const stmt = db.prepare(query);
  const rows = stmt.all(...params) as unknown as Product[];

  // 전체 개수 조회
  let countQuery = 'SELECT COUNT(*) as count FROM products';
  if (category && category !== 'All') {
    countQuery += ' WHERE category = ?';
  }
  const countStmt = db.prepare(countQuery);
  const countParams = category && category !== 'All' ? [category] : [];
  const countResult = countStmt.get(...countParams) as unknown as { count: number };

  // null-prototype 객체 변환 (Client Component 호환)
  const products = (rows || []).map((r) => ({ ...r }));

  return {
    products,
    total: countResult?.count || 0
  };
}

// 마지막 스크래핑 시각 조회
export function getLastScrapedAt(): string | null {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT MAX(scraped_at) as last_scraped FROM scrape_log WHERE status = 'success'
  `);
  const result = stmt.get() as unknown as { last_scraped: string | null };
  return result?.last_scraped || null;
}

// 스크래핑 로그 기록
export function logScrape(
  totalFetched: number,
  filteredCount: number,
  insertedCount: number,
  skippedCount: number,
  status: 'success' | 'error' | 'partial'
): void {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO scrape_log (total_fetched, filtered_count, inserted_count, skipped_count, status)
    VALUES (?, ?, ?, ?, ?)
  `);

  stmt.run(totalFetched, filteredCount, insertedCount, skippedCount, status);
  console.log(`[DB] 📝 스크래핑 로그 기록: ${status} (${insertedCount} 추가, ${skippedCount} 중복)`);
}

// 오래된 데이터 삭제 (선택사항: 30일 이상 데이터)
export function deleteOldData(days: number = 30): number {
  const db = getDb();
  const stmt = db.prepare(`
    DELETE FROM products
    WHERE collected_at < datetime('now', '-' || ? || ' days')
  `);

  const result = stmt.run(days) as unknown as { changes: number };
  return result.changes;
}

// 전체 상품 수
export function getProductCount(): number {
  const db = getDb();
  const stmt = db.prepare('SELECT COUNT(*) as count FROM products');
  const result = stmt.get() as unknown as { count: number };
  return result?.count || 0;
}

// 카테고리별 상품 수
export function getCategoryStats(): Record<CategoryType, number> {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT category, COUNT(*) as count FROM products GROUP BY category
  `);
  const rows = stmt.all() as unknown as Array<{ category: CategoryType; count: number }>;

  const stats: Record<CategoryType, number> = {
    Gadgets: 0,
    Home: 0,
    Beauty: 0,
    Fashion: 0,
    Food: 0,
    Other: 0
  };

  for (const row of rows) {
    stats[row.category] = row.count;
  }

  return stats;
}
