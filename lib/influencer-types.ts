// 일본 인플루언서 발굴 엔진 — 타입 정의
// 기획서 '프로그램 컨셉'의 평가 축(영향력·판매력·이슈력·신뢰도)과
// '컨택·제안·결제 운영 설계'의 접촉 단계를 그대로 코드로 옮긴 것

export type Platform =
  | 'instagram'
  | 'tiktok'
  | 'youtube'
  | 'x'
  | '17live'
  | 'pococha'
  | 'other'

export const PLATFORMS: Platform[] = [
  'instagram', 'tiktok', 'youtube', 'x', '17live', 'pococha', 'other',
]

export const PLATFORM_LABELS: Record<Platform, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  x: 'X',
  '17live': '17LIVE',
  pococha: 'Pococha',
  other: '기타',
}

// 등급 — 리그 수수료율 차등의 기준 (골드 20% · 실버 15% · 루키 10% 안)
export type Grade = '골드' | '실버' | '루키' | '미분류'
export const GRADES: Grade[] = ['골드', '실버', '루키', '미분류']

// 접촉 단계 — 리스트업 → 컨택 → 제안 → 계약 흐름
export type ContactStatus =
  | '미접촉'
  | '접촉'
  | '응답'
  | '동의'
  | '제안'
  | '계약'
  | '보류'
  | '거절'

export const CONTACT_STATUSES: ContactStatus[] = [
  '미접촉', '접촉', '응답', '동의', '제안', '계약', '보류', '거절',
]

/**
 * 수집 소스(CSV·API)가 만들어내는 원본 데이터. 점수는 없다.
 * 모르는 값은 null 로 두면 점수 계산에서 '중립'으로 처리한다.
 */
export interface RawInfluencer {
  platform: Platform
  handle: string                       // @ 없는 계정명
  display_name: string
  profile_url: string
  followers: number
  posts_count: number | null
  avg_likes: number | null
  avg_comments: number | null
  avg_views: number | null             // 동영상 평균 조회수
  engagement_rate: number | null       // % 단위 (1.47 = 1.47%)
  female_ratio: number | null          // 0~1, 여성 팔로워 비중
  age_20_40_ratio: number | null       // 0~1, 20~40대 비중
  category_tags: string                // 쉼표 구분 (뷰티, 스킨케어, 라이프스타일 ...)
  live_count_90d: number | null        // 최근 90일 라이브 횟수
  avg_live_viewers: number | null      // 라이브 평균 동시 시청자
  comment_reply_rate: number | null    // 0~1, 댓글 응답 비율
  has_affiliate_link: boolean          // 제휴 링크 보유
  is_tiktok_shop_seller: boolean       // TikTok Shop 셀러·크리에이터 표시
  past_pr_posts: number | null         // 과거 PR 투고 수
  follower_growth_90d: number | null   // 비율 (0.12 = +12%)
  viral_posts_90d: number | null       // 바이럴 게시물 수 (평균 대비 급증)
  media_mentions: number | null        // 미디어·뉴스 노출 건수
  fake_follower_ratio: number | null   // 0~1, 가짜 팔로워 비율 추정
  enjo_history: boolean                // 炎上(논란) 이력
  agency: string                       // 소속 사무소
  contact_email: string
  contact_url: string                  // 업무 연락 창구 URL
  region: string
  source: string                       // 데이터 출처 (csv:astream, youtube-api ...)
}

/** 점수 계산 결과 */
export interface ScoreBreakdown {
  score_influence: number   // 영향력 (최대 25)
  score_sales: number       // 판매력 (최대 40)
  score_buzz: number        // 이슈력 (최대 20)
  score_trust: number       // 신뢰도 (최대 15)
  score: number             // 합계 (최대 100)
  grade: Grade
  excluded: boolean         // 제외 규칙에 걸림 (가짜 팔로워·炎上)
  exclude_reason: string
}

export interface ScoredInfluencer extends RawInfluencer, ScoreBreakdown {
  rank: number              // 제외 대상은 0
}

/** DB 에 저장된 인플루언서 (점수·접촉 정보 포함) */
export interface Influencer extends ScoredInfluencer {
  id: number
  contact_status: ContactStatus
  contact_channel: string   // DM, 메일, 사무소, 소개 ...
  contact_note: string
  consent: boolean          // 데이터 활용·리그 참가 동의
  consent_date: string
  source_date: string       // 마지막 수집일 (YYYY-MM-DD)
  created_at: string
  updated_at: string
}

/** 일별 지표 스냅샷 — 성장세 추적용 */
export interface InfluencerSnapshot {
  id: number
  influencer_id: number
  snapshot_date: string
  followers: number
  engagement_rate: number | null
  avg_views: number | null
  live_count_90d: number | null
  score: number
  grade: Grade
}

/** 라이브 방송 성과 — 리그 참가 동의 후에만 기록 */
export interface InfluencerLive {
  id: number
  influencer_id: number
  live_date: string
  platform: Platform
  viewers_peak: number | null
  viewers_avg: number | null
  duration_min: number | null
  sales_jpy: number | null
  orders: number | null
  note: string
  created_at: string
}

/** 접촉 이력 */
export interface ContactLog {
  id: number
  influencer_id: number
  logged_at: string
  status: ContactStatus
  channel: string
  note: string
}

export interface InfluencersResponse {
  influencers: Influencer[]
  total: number
  page: number
  totalPages: number
}

export interface InfluencerStats {
  total: number
  excluded: number
  byGrade: Record<Grade, number>
  byStatus: Record<ContactStatus, number>
  lastSourceDate: string
}
