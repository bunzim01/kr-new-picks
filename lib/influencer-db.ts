// 인플루언서 DB — lib/db.ts 의 SQLite 연결을 그대로 쓰고 표만 추가한다
// 표: influencers(후보) · influencer_snapshots(일별 지표) · influencer_lives(방송 성과) · contact_logs(접촉 이력)

import type { DatabaseSync } from 'node:sqlite'
import { getDb } from './db'
import {
  ScoredInfluencer, Influencer, InfluencerSnapshot, InfluencerLive, ContactLog,
  InfluencersResponse, InfluencerStats, ContactStatus, Grade, Platform,
  GRADES, CONTACT_STATUSES,
} from './influencer-types'

let schemaReady = false

export function getInfluencerDb(): DatabaseSync {
  const db = getDb()
  if (!schemaReady) {
    initSchema(db)
    schemaReady = true
  }
  return db
}

function initSchema(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS influencers (
      id                    INTEGER PRIMARY KEY AUTOINCREMENT,
      platform              TEXT    NOT NULL,
      handle                TEXT    NOT NULL,
      display_name          TEXT    NOT NULL DEFAULT '',
      profile_url           TEXT    NOT NULL DEFAULT '',
      followers             INTEGER NOT NULL DEFAULT 0,
      posts_count           INTEGER,
      avg_likes             REAL,
      avg_comments          REAL,
      avg_views             REAL,
      engagement_rate       REAL,
      female_ratio          REAL,
      age_20_40_ratio       REAL,
      category_tags         TEXT    NOT NULL DEFAULT '',
      live_count_90d        INTEGER,
      avg_live_viewers      REAL,
      comment_reply_rate    REAL,
      has_affiliate_link    INTEGER NOT NULL DEFAULT 0,
      is_tiktok_shop_seller INTEGER NOT NULL DEFAULT 0,
      past_pr_posts         INTEGER,
      follower_growth_90d   REAL,
      viral_posts_90d       INTEGER,
      media_mentions        INTEGER,
      fake_follower_ratio   REAL,
      enjo_history          INTEGER NOT NULL DEFAULT 0,
      agency                TEXT    NOT NULL DEFAULT '',
      contact_email         TEXT    NOT NULL DEFAULT '',
      contact_url           TEXT    NOT NULL DEFAULT '',
      region                TEXT    NOT NULL DEFAULT '',
      source                TEXT    NOT NULL DEFAULT '',
      source_date           TEXT    NOT NULL DEFAULT '',
      score_influence       REAL    NOT NULL DEFAULT 0,
      score_sales           REAL    NOT NULL DEFAULT 0,
      score_buzz            REAL    NOT NULL DEFAULT 0,
      score_trust           REAL    NOT NULL DEFAULT 0,
      score                 REAL    NOT NULL DEFAULT 0,
      grade                 TEXT    NOT NULL DEFAULT '미분류',
      rank                  INTEGER NOT NULL DEFAULT 0,
      excluded              INTEGER NOT NULL DEFAULT 0,
      exclude_reason        TEXT    NOT NULL DEFAULT '',
      contact_status        TEXT    NOT NULL DEFAULT '미접촉',
      contact_channel       TEXT    NOT NULL DEFAULT '',
      contact_note          TEXT    NOT NULL DEFAULT '',
      consent               INTEGER NOT NULL DEFAULT 0,
      consent_date          TEXT    NOT NULL DEFAULT '',
      created_at            DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at            DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(platform, handle)
    );
    CREATE INDEX IF NOT EXISTS idx_influencers_score ON influencers(excluded, score DESC);
    CREATE INDEX IF NOT EXISTS idx_influencers_status ON influencers(contact_status);

    CREATE TABLE IF NOT EXISTS influencer_snapshots (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      influencer_id   INTEGER NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
      snapshot_date   TEXT    NOT NULL,
      followers       INTEGER NOT NULL DEFAULT 0,
      engagement_rate REAL,
      avg_views       REAL,
      live_count_90d  INTEGER,
      score           REAL    NOT NULL DEFAULT 0,
      grade           TEXT    NOT NULL DEFAULT '미분류',
      UNIQUE(influencer_id, snapshot_date)
    );

    CREATE TABLE IF NOT EXISTS influencer_lives (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      influencer_id INTEGER NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
      live_date     TEXT    NOT NULL,
      platform      TEXT    NOT NULL DEFAULT '',
      viewers_peak  INTEGER,
      viewers_avg   INTEGER,
      duration_min  INTEGER,
      sales_jpy     INTEGER,
      orders        INTEGER,
      note          TEXT    NOT NULL DEFAULT '',
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_lives_influencer ON influencer_lives(influencer_id, live_date DESC);

    CREATE TABLE IF NOT EXISTS contact_logs (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      influencer_id INTEGER NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
      logged_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
      status        TEXT    NOT NULL,
      channel       TEXT    NOT NULL DEFAULT '',
      note          TEXT    NOT NULL DEFAULT ''
    );
    CREATE INDEX IF NOT EXISTS idx_contact_logs_influencer ON contact_logs(influencer_id, logged_at DESC);
  `)
}

// ---- 행 변환 (node:sqlite 는 null-prototype 객체·정수 불리언을 돌려준다) ----

type Row = Record<string, unknown>

function toInfluencer(row: Row): Influencer {
  const r = { ...row } as Record<string, unknown>
  return {
    ...(r as unknown as Influencer),
    has_affiliate_link: !!r.has_affiliate_link,
    is_tiktok_shop_seller: !!r.is_tiktok_shop_seller,
    enjo_history: !!r.enjo_history,
    excluded: !!r.excluded,
    consent: !!r.consent,
  }
}

function plain<T>(row: unknown): T {
  return { ...(row as Record<string, unknown>) } as T
}

// ---- 저장 ----

const RAW_COLUMNS = [
  'display_name', 'profile_url', 'followers', 'posts_count', 'avg_likes', 'avg_comments',
  'avg_views', 'engagement_rate', 'female_ratio', 'age_20_40_ratio', 'category_tags',
  'live_count_90d', 'avg_live_viewers', 'comment_reply_rate', 'has_affiliate_link',
  'is_tiktok_shop_seller', 'past_pr_posts', 'follower_growth_90d', 'viral_posts_90d',
  'media_mentions', 'fake_follower_ratio', 'enjo_history', 'agency', 'contact_email',
  'contact_url', 'region', 'source', 'source_date',
  'score_influence', 'score_sales', 'score_buzz', 'score_trust', 'score', 'grade',
  'excluded', 'exclude_reason',
] as const

/**
 * 점수가 매겨진 목록을 저장한다.
 * 같은 (플랫폼, 계정) 이 이미 있으면 원본 지표·점수만 갱신하고 접촉 정보는 그대로 둔다.
 * 저장 뒤 전체 표를 다시 순위 매기고, 오늘 날짜 스냅샷을 남긴다.
 */
export function upsertInfluencers(list: ScoredInfluencer[], date: string): { inserted: number; updated: number } {
  const db = getInfluencerDb()
  if (list.length === 0) return { inserted: 0, updated: 0 }

  const cols = ['platform', 'handle', ...RAW_COLUMNS]
  const placeholders = cols.map(() => '?').join(', ')
  const updates = RAW_COLUMNS.map(c => `${c} = excluded.${c}`).join(',\n        ')

  const upsert = db.prepare(`
    INSERT INTO influencers (${cols.join(', ')})
    VALUES (${placeholders})
    ON CONFLICT(platform, handle) DO UPDATE SET
        ${updates},
        updated_at = CURRENT_TIMESTAMP
  `)
  const exists = db.prepare('SELECT id FROM influencers WHERE platform = ? AND handle = ?')
  const snapshot = db.prepare(`
    INSERT OR REPLACE INTO influencer_snapshots
      (influencer_id, snapshot_date, followers, engagement_rate, avg_views, live_count_90d, score, grade)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  let inserted = 0
  let updated = 0

  db.exec('BEGIN')
  try {
    for (const s of list) {
      const before = exists.get(s.platform, s.handle) as unknown as { id: number } | undefined
      const values: Array<string | number | null> = [
        s.platform, s.handle,
        s.display_name, s.profile_url, s.followers, s.posts_count, s.avg_likes, s.avg_comments,
        s.avg_views, s.engagement_rate, s.female_ratio, s.age_20_40_ratio, s.category_tags,
        s.live_count_90d, s.avg_live_viewers, s.comment_reply_rate, s.has_affiliate_link ? 1 : 0,
        s.is_tiktok_shop_seller ? 1 : 0, s.past_pr_posts, s.follower_growth_90d, s.viral_posts_90d,
        s.media_mentions, s.fake_follower_ratio, s.enjo_history ? 1 : 0, s.agency, s.contact_email,
        s.contact_url, s.region, s.source, date,
        s.score_influence, s.score_sales, s.score_buzz, s.score_trust, s.score, s.grade,
        s.excluded ? 1 : 0, s.exclude_reason,
      ]
      upsert.run(...values)
      const after = exists.get(s.platform, s.handle) as unknown as { id: number }
      if (before) updated += 1
      else inserted += 1

      snapshot.run(
        after.id, date, s.followers, s.engagement_rate, s.avg_views,
        s.live_count_90d, s.score, s.grade,
      )
    }

    rerankAll(db)
    db.exec('COMMIT')
  } catch (err) {
    db.exec('ROLLBACK')
    throw err
  }

  return { inserted, updated }
}

/** 전체 표 기준으로 순위를 다시 매긴다 (제외 대상은 0) */
function rerankAll(db: DatabaseSync) {
  db.exec(`
    UPDATE influencers SET rank = 0 WHERE excluded = 1;
    UPDATE influencers SET rank = (
      SELECT rn FROM (
        SELECT id, ROW_NUMBER() OVER (ORDER BY score DESC, followers DESC, id ASC) AS rn
        FROM influencers WHERE excluded = 0
      ) ranked WHERE ranked.id = influencers.id
    ) WHERE excluded = 0;
  `)
}

// ---- 조회 ----

export interface ListOptions {
  platform?: string
  grade?: string
  status?: string
  q?: string
  includeExcluded?: boolean
  page?: number
  limit?: number
}

export function listInfluencers(opts: ListOptions = {}): InfluencersResponse {
  const db = getInfluencerDb()
  const page = Math.max(1, opts.page ?? 1)
  const limit = Math.min(200, Math.max(1, opts.limit ?? 50))
  const offset = (page - 1) * limit

  const where: string[] = []
  const params: Array<string | number> = []

  if (!opts.includeExcluded) where.push('excluded = 0')
  if (opts.platform) { where.push('platform = ?'); params.push(opts.platform) }
  if (opts.grade) { where.push('grade = ?'); params.push(opts.grade) }
  if (opts.status) { where.push('contact_status = ?'); params.push(opts.status) }
  if (opts.q) {
    where.push('(handle LIKE ? OR display_name LIKE ? OR category_tags LIKE ? OR agency LIKE ?)')
    const like = `%${opts.q}%`
    params.push(like, like, like, like)
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''

  const total = (db.prepare(`SELECT COUNT(*) AS cnt FROM influencers ${whereSql}`)
    .get(...params) as unknown as { cnt: number }).cnt

  const rows = db.prepare(`
    SELECT * FROM influencers ${whereSql}
    ORDER BY excluded ASC, CASE WHEN rank = 0 THEN 999999 ELSE rank END ASC, score DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset) as unknown as Row[]

  return {
    influencers: rows.map(toInfluencer),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  }
}

export function getInfluencerById(id: number): Influencer | null {
  const db = getInfluencerDb()
  const row = db.prepare('SELECT * FROM influencers WHERE id = ?').get(id) as unknown as Row | undefined
  return row ? toInfluencer(row) : null
}

export function getSnapshots(influencerId: number): InfluencerSnapshot[] {
  const db = getInfluencerDb()
  const rows = db.prepare(`
    SELECT * FROM influencer_snapshots WHERE influencer_id = ? ORDER BY snapshot_date DESC LIMIT 60
  `).all(influencerId) as unknown[]
  return rows.map(r => plain<InfluencerSnapshot>(r))
}

export function getLives(influencerId: number): InfluencerLive[] {
  const db = getInfluencerDb()
  const rows = db.prepare(`
    SELECT * FROM influencer_lives WHERE influencer_id = ? ORDER BY live_date DESC, id DESC LIMIT 100
  `).all(influencerId) as unknown[]
  return rows.map(r => plain<InfluencerLive>(r))
}

export function getContactLogs(influencerId: number): ContactLog[] {
  const db = getInfluencerDb()
  const rows = db.prepare(`
    SELECT * FROM contact_logs WHERE influencer_id = ? ORDER BY logged_at DESC, id DESC LIMIT 100
  `).all(influencerId) as unknown[]
  return rows.map(r => plain<ContactLog>(r))
}

export function getInfluencerStats(): InfluencerStats {
  const db = getInfluencerDb()
  const total = (db.prepare('SELECT COUNT(*) AS cnt FROM influencers').get() as unknown as { cnt: number }).cnt
  const excluded = (db.prepare('SELECT COUNT(*) AS cnt FROM influencers WHERE excluded = 1').get() as unknown as { cnt: number }).cnt

  const byGrade = Object.fromEntries(GRADES.map(g => [g, 0])) as Record<Grade, number>
  for (const r of db.prepare('SELECT grade, COUNT(*) AS cnt FROM influencers WHERE excluded = 0 GROUP BY grade').all() as unknown as Array<{ grade: Grade; cnt: number }>) {
    if (r.grade in byGrade) byGrade[r.grade] = r.cnt
  }

  const byStatus = Object.fromEntries(CONTACT_STATUSES.map(s => [s, 0])) as Record<ContactStatus, number>
  for (const r of db.prepare('SELECT contact_status, COUNT(*) AS cnt FROM influencers GROUP BY contact_status').all() as unknown as Array<{ contact_status: ContactStatus; cnt: number }>) {
    if (r.contact_status in byStatus) byStatus[r.contact_status] = r.cnt
  }

  const last = db.prepare('SELECT MAX(source_date) AS d FROM influencers').get() as unknown as { d: string | null }

  return { total, excluded, byGrade, byStatus, lastSourceDate: last?.d ?? '' }
}

// ---- 접촉 관리 ----

export interface ContactPatch {
  contact_status?: ContactStatus
  contact_channel?: string
  contact_note?: string
  consent?: boolean
}

export function updateContact(id: number, patch: ContactPatch): Influencer | null {
  const db = getInfluencerDb()
  const current = getInfluencerById(id)
  if (!current) return null

  const status = patch.contact_status ?? current.contact_status
  if (!CONTACT_STATUSES.includes(status)) throw new Error(`알 수 없는 접촉 상태: ${status}`)
  const channel = patch.contact_channel ?? current.contact_channel
  const note = patch.contact_note ?? current.contact_note
  const consent = patch.consent ?? current.consent
  const consentDate = consent
    ? (current.consent ? current.consent_date : new Date().toISOString().slice(0, 10))
    : ''

  db.exec('BEGIN')
  try {
    db.prepare(`
      UPDATE influencers
      SET contact_status = ?, contact_channel = ?, contact_note = ?, consent = ?, consent_date = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, channel, note, consent ? 1 : 0, consentDate, id)

    // 상태나 메모가 바뀌었을 때만 이력을 남긴다
    if (status !== current.contact_status || note !== current.contact_note || channel !== current.contact_channel) {
      db.prepare(`
        INSERT INTO contact_logs (influencer_id, status, channel, note) VALUES (?, ?, ?, ?)
      `).run(id, status, channel, note)
    }
    db.exec('COMMIT')
  } catch (err) {
    db.exec('ROLLBACK')
    throw err
  }

  return getInfluencerById(id)
}

export interface LiveInput {
  live_date: string
  platform?: Platform | string
  viewers_peak?: number | null
  viewers_avg?: number | null
  duration_min?: number | null
  sales_jpy?: number | null
  orders?: number | null
  note?: string
}

export function addLive(id: number, live: LiveInput): InfluencerLive | null {
  const db = getInfluencerDb()
  const current = getInfluencerById(id)
  if (!current) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(live.live_date)) throw new Error('live_date 는 YYYY-MM-DD 형식이어야 합니다')

  const result = db.prepare(`
    INSERT INTO influencer_lives
      (influencer_id, live_date, platform, viewers_peak, viewers_avg, duration_min, sales_jpy, orders, note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, live.live_date, live.platform ?? current.platform,
    live.viewers_peak ?? null, live.viewers_avg ?? null, live.duration_min ?? null,
    live.sales_jpy ?? null, live.orders ?? null, live.note ?? '',
  )
  const row = db.prepare('SELECT * FROM influencer_lives WHERE id = ?').get(Number(result.lastInsertRowid))
  return plain<InfluencerLive>(row)
}
