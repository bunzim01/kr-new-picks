// CSV 가져오기 — Astream·iCON Suite·Modash 내보내기 파일이나 직접 만든 명단을 읽는다
// 열 이름은 한국어·영어·일본어 어느 쪽이든 인식하고, 모르는 열은 무시한다.

import { RawInfluencer, Platform, PLATFORMS } from '../influencer-types'

/** 따옴표·줄바꿈·BOM 을 처리하는 CSV 파서 */
export function parseCsv(text: string): Record<string, string>[] {
  const src = text.replace(/^﻿/, '')
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') { field += '"'; i++ }
        else inQuotes = false
      } else {
        field += ch
      }
      continue
    }
    if (ch === '"') { inQuotes = true; continue }
    if (ch === ',') { row.push(field); field = ''; continue }
    if (ch === '\r') continue
    if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; continue }
    field += ch
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row) }

  const nonEmpty = rows.filter(r => r.some(c => c.trim() !== ''))
  if (nonEmpty.length < 2) return []

  const headers = nonEmpty[0].map(h => h.trim())
  return nonEmpty.slice(1).map(r => {
    const obj: Record<string, string> = {}
    headers.forEach((h, idx) => { obj[h] = (r[idx] ?? '').trim() })
    return obj
  })
}

// 열 이름 별칭 — 소문자·공백 제거 후 비교
const ALIASES: Record<string, string[]> = {
  platform: ['platform', '플랫폼', 'プラットフォーム', 'sns', 'channel', '채널'],
  handle: ['handle', 'username', 'user_name', 'account', 'id', '아이디', '계정', '계정명', 'ユーザー名', 'アカウント', 'アカウント名'],
  display_name: ['display_name', 'name', 'nickname', '이름', '표시명', '닉네임', '名前', '表示名', 'ニックネーム'],
  profile_url: ['profile_url', 'url', 'link', 'profile', '프로필', '프로필url', 'プロフィールurl', 'プロフィール'],
  followers: ['followers', 'follower', 'followers_count', 'subscribers', '팔로워', '팔로워수', '구독자', '구독자수', 'フォロワー数', 'フォロワー', '登録者数'],
  posts_count: ['posts_count', 'posts', 'media_count', 'videos', '게시물', '게시물수', '投稿数', '動画数'],
  avg_likes: ['avg_likes', 'likes', 'average_likes', '평균좋아요', '좋아요', '平均いいね', 'いいね'],
  avg_comments: ['avg_comments', 'comments', 'average_comments', '평균댓글', '댓글', '平均コメント', 'コメント'],
  avg_views: ['avg_views', 'views', 'average_views', '평균조회수', '조회수', '平均再生数', '再生数'],
  engagement_rate: ['engagement_rate', 'engagement', 'er', '참여율', 'エンゲージメント率', 'エンゲージメント'],
  female_ratio: ['female_ratio', 'female', 'female_pct', '여성비중', '여성비율', '女性比率', '女性'],
  age_20_40_ratio: ['age_20_40_ratio', 'age2040', 'age_20_40', '2040비중', '20~40대비중', '20-40대', '20〜40代比率', '20-40代'],
  category_tags: ['category_tags', 'category', 'categories', 'tags', 'genre', '카테고리', '분야', '태그', 'カテゴリ', 'ジャンル', 'タグ'],
  live_count_90d: ['live_count_90d', 'lives_90d', 'live_count', '라이브횟수', '라이브', 'ライブ回数', '配信回数'],
  avg_live_viewers: ['avg_live_viewers', 'live_viewers', '라이브시청자', '평균동시시청', 'ライブ視聴者', '同時視聴者'],
  comment_reply_rate: ['comment_reply_rate', 'reply_rate', '댓글응답률', '応答率', '返信率'],
  has_affiliate_link: ['has_affiliate_link', 'affiliate', 'affiliate_link', '제휴링크', 'アフィリエイト'],
  is_tiktok_shop_seller: ['is_tiktok_shop_seller', 'tiktok_shop', 'tiktokshop', '틱톡샵', 'tiktok shop'],
  past_pr_posts: ['past_pr_posts', 'pr_posts', 'pr', 'pr투고', 'pr게시물', 'pr投稿', '案件数'],
  follower_growth_90d: ['follower_growth_90d', 'growth', 'growth_90d', 'follower_growth', '성장률', '팔로워성장률', '成長率', 'フォロワー増加率'],
  viral_posts_90d: ['viral_posts_90d', 'viral_posts', 'viral', '바이럴', 'バズ投稿'],
  media_mentions: ['media_mentions', 'mentions', 'media', '미디어노출', '언급', 'メディア露出'],
  fake_follower_ratio: ['fake_follower_ratio', 'fake_followers', 'fake', '가짜팔로워', 'フェイクフォロワー'],
  enjo_history: ['enjo_history', 'enjo', 'controversy', '炎上', '논란', '炎上歴'],
  agency: ['agency', 'office', '사무소', '소속', '事務所', '所属'],
  contact_email: ['contact_email', 'email', 'mail', '이메일', '메일', 'メール'],
  contact_url: ['contact_url', 'contact', 'contact_form', '연락처', '문의', 'お問い合わせ', '連絡先'],
  region: ['region', 'country', 'location', '지역', '국가', '地域', '国'],
}

function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[\s_\-()（）]/g, '')
}

const LOOKUP: Record<string, string> = {}
for (const [field, names] of Object.entries(ALIASES)) {
  for (const n of names) LOOKUP[normalizeHeader(n)] = field
}

/** 열 이름 → 내부 필드명 매핑 */
function mapHeaders(headers: string[]): Record<string, string> {
  const map: Record<string, string> = {}
  for (const h of headers) {
    const field = LOOKUP[normalizeHeader(h)]
    if (field && !(field in map)) map[field] = h
  }
  return map
}

/** "1,234" "1.2万" "12K" "3.4M" "45%" → 숫자 */
export function parseNumber(v: string | undefined): number | null {
  if (v === undefined) return null
  let s = v.trim().replace(/,/g, '').replace(/[%％]/g, '')
  if (s === '' || s === '-' || s.toLowerCase() === 'n/a') return null
  let mult = 1
  if (/万$/.test(s)) { mult = 10_000; s = s.replace(/万$/, '') }
  else if (/億$/.test(s)) { mult = 100_000_000; s = s.replace(/億$/, '') }
  else if (/[kK]$/.test(s)) { mult = 1_000; s = s.replace(/[kK]$/, '') }
  else if (/[mM]$/.test(s)) { mult = 1_000_000; s = s.replace(/[mM]$/, '') }
  const n = parseFloat(s)
  return Number.isFinite(n) ? n * mult : null
}

/** 0~1 비율. "62%" 나 62 처럼 100 기준이면 100 으로 나눈다 */
export function parseRatio(v: string | undefined): number | null {
  const n = parseNumber(v)
  if (n === null) return null
  return n > 1 ? n / 100 : n
}

/** true/1/yes/○/예/있음/あり → true */
export function parseBool(v: string | undefined): boolean {
  if (!v) return false
  const s = v.trim().toLowerCase()
  return ['true', '1', 'yes', 'y', 'o', '○', '◯', '예', '있음', 'あり', '有', 'はい'].includes(s)
}

const PLATFORM_HOSTS: Array<[RegExp, Platform]> = [
  [/instagram\.com/i, 'instagram'],
  [/tiktok\.com/i, 'tiktok'],
  [/youtube\.com|youtu\.be/i, 'youtube'],
  [/(^|\.)x\.com|twitter\.com/i, 'x'],
  [/17\.live/i, '17live'],
  [/pococha\.com/i, 'pococha'],
]

export function detectPlatform(value: string | undefined, url: string | undefined): Platform | null {
  const s = (value ?? '').trim().toLowerCase().replace(/\s/g, '')
  const direct: Record<string, Platform> = {
    instagram: 'instagram', ig: 'instagram', insta: 'instagram', 'インスタ': 'instagram', 'インスタグラム': 'instagram', '인스타': 'instagram', '인스타그램': 'instagram',
    tiktok: 'tiktok', '틱톡': 'tiktok', 'ティックトック': 'tiktok',
    youtube: 'youtube', yt: 'youtube', '유튜브': 'youtube', 'ユーチューブ': 'youtube',
    x: 'x', twitter: 'x', '트위터': 'x', 'ツイッター': 'x',
    '17live': '17live', '17': '17live', 'イチナナ': '17live',
    pococha: 'pococha', 'ポコチャ': 'pococha', '포코차': 'pococha',
    other: 'other', '기타': 'other',
  }
  if (s && direct[s]) return direct[s]
  if (s && (PLATFORMS as string[]).includes(s)) return s as Platform
  for (const [re, p] of PLATFORM_HOSTS) {
    if (url && re.test(url)) return p
  }
  return null
}

/** URL 에서 계정명을 뽑는다 (instagram.com/abc/ → abc, youtube.com/@abc → abc) */
export function handleFromUrl(url: string | undefined): string {
  if (!url) return ''
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`)
    const parts = u.pathname.split('/').filter(Boolean)
    const last = parts[parts.length - 1] ?? ''
    return last.replace(/^@/, '')
  } catch {
    return ''
  }
}

export interface CsvImportResult {
  rows: RawInfluencer[]
  skipped: string[]   // 건너뛴 행과 이유
}

/** CSV 텍스트 → RawInfluencer 목록 */
export function csvToInfluencers(text: string, source = 'csv'): CsvImportResult {
  const records = parseCsv(text)
  const rows: RawInfluencer[] = []
  const skipped: string[] = []
  if (records.length === 0) return { rows, skipped }

  const map = mapHeaders(Object.keys(records[0]))
  const get = (rec: Record<string, string>, field: string): string | undefined =>
    map[field] ? rec[map[field]] : undefined

  records.forEach((rec, i) => {
    const lineNo = i + 2
    const url = get(rec, 'profile_url') ?? ''
    const platform = detectPlatform(get(rec, 'platform'), url)
    const handle = (get(rec, 'handle') ?? '').replace(/^@/, '').trim() || handleFromUrl(url)
    const followers = parseNumber(get(rec, 'followers'))

    if (!platform) { skipped.push(`${lineNo}행: 플랫폼을 알 수 없음`); return }
    if (!handle) { skipped.push(`${lineNo}행: 계정명 없음`); return }
    if (followers === null) { skipped.push(`${lineNo}행: 팔로워 수 없음 (${handle})`); return }

    rows.push({
      platform,
      handle,
      display_name: get(rec, 'display_name') ?? handle,
      profile_url: url || defaultProfileUrl(platform, handle),
      followers: Math.round(followers),
      posts_count: toInt(parseNumber(get(rec, 'posts_count'))),
      avg_likes: parseNumber(get(rec, 'avg_likes')),
      avg_comments: parseNumber(get(rec, 'avg_comments')),
      avg_views: parseNumber(get(rec, 'avg_views')),
      engagement_rate: parseNumber(get(rec, 'engagement_rate')),
      female_ratio: parseRatio(get(rec, 'female_ratio')),
      age_20_40_ratio: parseRatio(get(rec, 'age_20_40_ratio')),
      category_tags: get(rec, 'category_tags') ?? '',
      live_count_90d: toInt(parseNumber(get(rec, 'live_count_90d'))),
      avg_live_viewers: parseNumber(get(rec, 'avg_live_viewers')),
      comment_reply_rate: parseRatio(get(rec, 'comment_reply_rate')),
      has_affiliate_link: parseBool(get(rec, 'has_affiliate_link')),
      is_tiktok_shop_seller: parseBool(get(rec, 'is_tiktok_shop_seller')),
      past_pr_posts: toInt(parseNumber(get(rec, 'past_pr_posts'))),
      follower_growth_90d: parseRatio(get(rec, 'follower_growth_90d')),
      viral_posts_90d: toInt(parseNumber(get(rec, 'viral_posts_90d'))),
      media_mentions: toInt(parseNumber(get(rec, 'media_mentions'))),
      fake_follower_ratio: parseRatio(get(rec, 'fake_follower_ratio')),
      enjo_history: parseBool(get(rec, 'enjo_history')),
      agency: get(rec, 'agency') ?? '',
      contact_email: get(rec, 'contact_email') ?? '',
      contact_url: get(rec, 'contact_url') ?? '',
      region: get(rec, 'region') ?? '',
      source,
    })
  })

  return { rows, skipped }
}

function toInt(n: number | null): number | null {
  return n === null ? null : Math.round(n)
}

export function defaultProfileUrl(platform: Platform, handle: string): string {
  switch (platform) {
    case 'instagram': return `https://www.instagram.com/${handle}/`
    case 'tiktok': return `https://www.tiktok.com/@${handle}`
    case 'youtube': return `https://www.youtube.com/@${handle}`
    case 'x': return `https://x.com/${handle}`
    case '17live': return `https://17.live/ja/profile/r/${handle}`
    case 'pococha': return `https://www.pococha.com/ja-jp/user/${handle}`
    default: return ''
  }
}
