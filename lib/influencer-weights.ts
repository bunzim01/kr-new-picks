// 점수 가중치 — 기획서 '프로그램 컨셉'의 평가 축 표 기준
// 숫자만 바꾸면 다음 수집부터 전체 점수에 반영된다 (합계 100)

export const WEIGHTS = {
  // 영향력 25
  influence: {
    reach: 10,        // 팔로워·도달 규모
    female: 8,        // 여성 팔로워 비중
    age2040: 7,       // 20~40대 비중
  },
  // 판매력 40
  sales: {
    liveCount: 10,    // 최근 90일 라이브 횟수
    liveViewers: 10,  // 라이브 평균 동시 시청자
    replyRate: 5,     // 댓글 응답 비율
    tiktokShop: 6,    // TikTok Shop 셀러·크리에이터 표시
    affiliate: 4,     // 제휴 링크 보유
    prPosts: 5,       // 과거 PR 투고(판매·협업 경험)
  },
  // 이슈력 20
  buzz: {
    growth: 10,       // 90일 팔로워 성장세
    viral: 6,         // 바이럴 게시물 수
    media: 4,         // 미디어 노출
  },
  // 신뢰도 15
  trust: {
    engagement: 8,    // 규모 보정 참여율 (벤치마크 대비)
    fake: 4,          // 가짜 팔로워 비율
    enjo: 3,          // 炎上 이력 없음
  },
} as const

// 등급 기준점 (총점)
export const GRADE_CUTOFFS = {
  골드: 70,
  실버: 55,
  루키: 40,
} as const

// 제외 규칙 — 걸리면 순위에서 빠지고 화면에 '제외' 로 표시
export const EXCLUDE_RULES = {
  fakeFollowerRatio: 0.3,   // 가짜 팔로워 30% 초과
  enjoHistory: true,        // 炎上 이력 있으면 제외
} as const

// 일본 Instagram 팔로워 규모별 평균 참여율(%) — A stream 조사(65만 계정, 2024년경)
// 팔로워가 이 구간 이하일 때의 기준값. 참여율이 기준의 2배면 만점.
export const ER_BENCHMARK: Array<{ maxFollowers: number; er: number }> = [
  { maxFollowers: 5_000, er: 3.92 },
  { maxFollowers: 10_000, er: 1.48 },
  { maxFollowers: 50_000, er: 1.03 },
  { maxFollowers: 100_000, er: 0.88 },
  { maxFollowers: 500_000, er: 0.96 },
  { maxFollowers: 1_000_000, er: 0.95 },
  { maxFollowers: Number.POSITIVE_INFINITY, er: 1.05 },
]

// 플랫폼별 참여율 배율 — TikTok·YouTube 는 Instagram 보다 참여율이 높게 나오는 경향
// (업계 자료: TikTok 1만~5만 팔로워 5~8%, YouTube 평균 4%). 라이브 앱은 참여율 개념이 달라 중립.
export const ER_PLATFORM_FACTOR: Record<string, number> = {
  instagram: 1,
  tiktok: 3,
  youtube: 2,
  x: 0.5,
  '17live': 1,
  pococha: 1,
  other: 1,
}
