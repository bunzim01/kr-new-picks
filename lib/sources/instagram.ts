// Instagram Graph API (Business Discovery) — 계정명으로 팔로워·게시물·최근 반응을 가져온다
// 키워드 검색은 공식 API 에 없으므로, CSV 나 다른 경로로 찾은 계정을 '검증·갱신'하는 용도다.
// 환경변수 IG_ACCESS_TOKEN, IG_USER_ID (비즈니스 계정 ID) 가 필요하다.

import { RawInfluencer } from '../influencer-types'
import { defaultProfileUrl } from './csv'

const API = 'https://graph.facebook.com/v21.0'
const AFFILIATE = /a8\.net|rakuten|amzn\.to|amazon\.co\.jp|lit\.link|linktr\.ee|qoo10|tiktok\.com\/shop/i
const PR_TAG = /#\s?(pr|PR|ＰＲ|広告|宣伝|プロモーション|タイアップ|提供)/

export interface InstagramOptions {
  accessToken?: string
  igUserId?: string
  delayMs?: number
  fetchImpl?: typeof fetch
}

interface Media {
  like_count?: number
  comments_count?: number
  media_type?: string
  media_product_type?: string
  caption?: string
  timestamp?: string
}

interface Discovery {
  business_discovery?: {
    username: string
    name?: string
    followers_count?: number
    media_count?: number
    biography?: string
    website?: string
    media?: { data?: Media[] }
  }
  error?: { message: string; code?: number }
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

export async function fetchInstagramProfiles(
  handles: string[],
  opts: InstagramOptions = {},
): Promise<{ rows: RawInfluencer[]; warnings: string[] }> {
  const token = opts.accessToken ?? process.env.IG_ACCESS_TOKEN
  const userId = opts.igUserId ?? process.env.IG_USER_ID
  const warnings: string[] = []
  if (!token || !userId) {
    warnings.push('IG_ACCESS_TOKEN / IG_USER_ID 가 없어 Instagram 조회를 건너뜁니다')
    return { rows: [], warnings }
  }
  const fetchImpl = opts.fetchImpl ?? fetch
  const delayMs = opts.delayMs ?? 1000
  const rows: RawInfluencer[] = []

  for (const raw of handles) {
    const handle = raw.replace(/^@/, '').trim()
    if (!handle) continue
    const fields = `business_discovery.username(${handle}){username,name,followers_count,media_count,biography,website,media.limit(20){like_count,comments_count,media_type,media_product_type,caption,timestamp}}`
    const url = `${API}/${userId}?fields=${encodeURIComponent(fields)}&access_token=${encodeURIComponent(token)}`
    try {
      const res = await fetchImpl(url)
      const data = await res.json() as Discovery
      if (!res.ok || data.error || !data.business_discovery) {
        const msg = data.error?.message ?? `HTTP ${res.status}`
        warnings.push(`${handle}: ${msg}`)
        // 한도 초과(코드 4·17·32) 면 중단
        if (data.error && [4, 17, 32].includes(data.error.code ?? 0)) break
        continue
      }
      const bd = data.business_discovery
      const media = bd.media?.data ?? []
      const likes = media.map(m => m.like_count ?? 0)
      const comments = media.map(m => m.comments_count ?? 0)
      const avg = (xs: number[]) => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null
      const followers = bd.followers_count ?? 0
      const avgLikes = avg(likes)
      const avgComments = avg(comments)
      const er = followers > 0 && avgLikes !== null
        ? Math.round(((avgLikes + (avgComments ?? 0)) / followers) * 1000) / 10
        : null
      const bioAndSite = `${bd.biography ?? ''} ${bd.website ?? ''}`

      rows.push({
        platform: 'instagram',
        handle: bd.username,
        display_name: bd.name ?? bd.username,
        profile_url: defaultProfileUrl('instagram', bd.username),
        followers,
        posts_count: bd.media_count ?? null,
        avg_likes: avgLikes,
        avg_comments: avgComments,
        avg_views: null,
        engagement_rate: er,
        female_ratio: null,
        age_20_40_ratio: null,
        category_tags: '',
        live_count_90d: null,
        avg_live_viewers: null,
        comment_reply_rate: null,
        has_affiliate_link: AFFILIATE.test(bioAndSite),
        is_tiktok_shop_seller: /tiktok\s?shop/i.test(bioAndSite),
        past_pr_posts: media.filter(m => PR_TAG.test(m.caption ?? '')).length,
        follower_growth_90d: null,
        viral_posts_90d: viralCount(likes),
        media_mentions: null,
        fake_follower_ratio: null,
        enjo_history: false,
        agency: '',
        contact_email: (bioAndSite.match(/[\w.+-]+@[\w-]+\.[\w.-]+/) ?? [''])[0],
        contact_url: bd.website ?? '',
        region: '',
        source: 'instagram-api',
      })
    } catch (err) {
      warnings.push(`${handle}: ${(err as Error).message}`)
    }
    await sleep(delayMs)
  }

  return { rows, warnings }
}

/** 최근 게시물 중 평균 좋아요의 3배를 넘긴 게시물 수 = 바이럴 게시물 */
function viralCount(likes: number[]): number | null {
  if (likes.length < 5) return null
  const mean = likes.reduce((a, b) => a + b, 0) / likes.length
  if (mean === 0) return 0
  return likes.filter(l => l >= mean * 3).length
}
