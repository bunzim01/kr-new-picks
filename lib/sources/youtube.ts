// YouTube Data API v3 — 키워드로 일본 채널을 찾고 구독자·조회수를 가져온다
// 한도: 검색(search.list) 은 하루 100회 별도 버킷(2026년 6월 이후), 채널 조회는 1유닛.
// 환경변수 YOUTUBE_API_KEY 가 없으면 조용히 건너뛴다.

import { RawInfluencer } from '../influencer-types'

const API = 'https://www.googleapis.com/youtube/v3'
const JAPANESE = /[぀-ヿ一-鿿]/

export interface YouTubeOptions {
  apiKey?: string
  maxPerKeyword?: number     // 키워드당 채널 수 (최대 50)
  liveCheckLimit?: number    // 구독자 상위 N개 채널만 라이브 횟수 확인 (검색 1회씩 소모)
  japaneseOnly?: boolean     // 일본어 채널만 남김
  fetchImpl?: typeof fetch
}

interface SearchItem { snippet?: { channelId?: string } ; id?: { channelId?: string } }
interface ChannelItem {
  id: string
  snippet: { title: string; description: string; customUrl?: string; country?: string; publishedAt?: string }
  statistics: { subscriberCount?: string; videoCount?: string; viewCount?: string; hiddenSubscriberCount?: boolean }
}

async function getJson<T>(url: string, fetchImpl: typeof fetch): Promise<T> {
  const res = await fetchImpl(url)
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`YouTube API ${res.status}: ${body.slice(0, 300)}`)
  }
  return res.json() as Promise<T>
}

export async function searchYouTubeChannels(
  keywords: string[],
  opts: YouTubeOptions = {},
): Promise<{ rows: RawInfluencer[]; searches: number; warnings: string[] }> {
  const apiKey = opts.apiKey ?? process.env.YOUTUBE_API_KEY
  const warnings: string[] = []
  if (!apiKey) {
    warnings.push('YOUTUBE_API_KEY 가 없어 YouTube 수집을 건너뜁니다')
    return { rows: [], searches: 0, warnings }
  }
  const fetchImpl = opts.fetchImpl ?? fetch
  const maxPerKeyword = Math.min(50, Math.max(1, opts.maxPerKeyword ?? 25))
  const liveCheckLimit = Math.max(0, opts.liveCheckLimit ?? 10)
  const japaneseOnly = opts.japaneseOnly ?? true

  // 1. 키워드 검색 → 채널 ID
  const channelIds = new Set<string>()
  const keywordOf = new Map<string, string>()
  let searches = 0
  for (const kw of keywords) {
    const q = new URLSearchParams({
      part: 'snippet', type: 'channel', q: kw, regionCode: 'JP',
      relevanceLanguage: 'ja', maxResults: String(maxPerKeyword), key: apiKey,
    })
    try {
      const data = await getJson<{ items?: SearchItem[] }>(`${API}/search?${q}`, fetchImpl)
      searches += 1
      for (const item of data.items ?? []) {
        const id = item.snippet?.channelId ?? item.id?.channelId
        if (id && !channelIds.has(id)) { channelIds.add(id); keywordOf.set(id, kw) }
      }
    } catch (err) {
      warnings.push(`검색 실패 "${kw}": ${(err as Error).message}`)
      if (/quota/i.test((err as Error).message)) break
    }
  }

  // 2. 채널 통계 (50개씩)
  const ids = [...channelIds]
  const channels: ChannelItem[] = []
  for (let i = 0; i < ids.length; i += 50) {
    const q = new URLSearchParams({
      part: 'snippet,statistics', id: ids.slice(i, i + 50).join(','), key: apiKey,
    })
    try {
      const data = await getJson<{ items?: ChannelItem[] }>(`${API}/channels?${q}`, fetchImpl)
      channels.push(...(data.items ?? []))
    } catch (err) {
      warnings.push(`채널 조회 실패: ${(err as Error).message}`)
    }
  }

  // 3. 일본어 채널만 남기고 RawInfluencer 로 변환
  const rows: RawInfluencer[] = []
  for (const ch of channels) {
    const text = `${ch.snippet.title} ${ch.snippet.description}`
    const isJapan = ch.snippet.country === 'JP' || JAPANESE.test(text)
    if (japaneseOnly && !isJapan) continue
    const subs = parseInt(ch.statistics.subscriberCount ?? '0', 10) || 0
    const videos = parseInt(ch.statistics.videoCount ?? '0', 10) || 0
    const views = parseInt(ch.statistics.viewCount ?? '0', 10) || 0
    const handle = (ch.snippet.customUrl ?? '').replace(/^@/, '') || ch.id
    rows.push({
      platform: 'youtube',
      handle,
      display_name: ch.snippet.title,
      profile_url: ch.snippet.customUrl ? `https://www.youtube.com/${ch.snippet.customUrl}` : `https://www.youtube.com/channel/${ch.id}`,
      followers: subs,
      posts_count: videos,
      avg_likes: null,
      avg_comments: null,
      avg_views: videos > 0 ? Math.round(views / videos) : null,
      engagement_rate: null,
      female_ratio: null,
      age_20_40_ratio: null,
      category_tags: keywordOf.get(ch.id) ?? '',
      live_count_90d: null,
      avg_live_viewers: null,
      comment_reply_rate: null,
      has_affiliate_link: /a8\.net|rakuten|amzn\.to|amazon\.co\.jp|lit\.link|linktr\.ee/i.test(ch.snippet.description),
      is_tiktok_shop_seller: false,
      past_pr_posts: null,
      follower_growth_90d: null,
      viral_posts_90d: null,
      media_mentions: null,
      fake_follower_ratio: null,
      enjo_history: false,
      agency: '',
      contact_email: (ch.snippet.description.match(/[\w.+-]+@[\w-]+\.[\w.-]+/) ?? [''])[0],
      contact_url: '',
      region: ch.snippet.country ?? '',
      source: 'youtube-api',
    })
  }

  // 4. 구독자 상위 N개 채널의 최근 90일 라이브(종료된 방송) 횟수
  const since = new Date(Date.now() - 90 * 86_400_000).toISOString()
  const targets = [...rows].sort((a, b) => b.followers - a.followers).slice(0, liveCheckLimit)
  const idByHandle = new Map(channels.map(c => [(c.snippet.customUrl ?? '').replace(/^@/, '') || c.id, c.id]))
  for (const r of targets) {
    const channelId = idByHandle.get(r.handle)
    if (!channelId) continue
    const q = new URLSearchParams({
      part: 'id', channelId, type: 'video', eventType: 'completed',
      publishedAfter: since, maxResults: '50', key: apiKey,
    })
    try {
      const data = await getJson<{ items?: unknown[]; pageInfo?: { totalResults?: number } }>(`${API}/search?${q}`, fetchImpl)
      searches += 1
      r.live_count_90d = data.pageInfo?.totalResults ?? (data.items ?? []).length
    } catch (err) {
      warnings.push(`라이브 확인 실패 ${r.handle}: ${(err as Error).message}`)
      if (/quota/i.test((err as Error).message)) break
    }
  }

  return { rows, searches, warnings }
}
