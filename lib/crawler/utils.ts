// 크롤러 공통 유틸리티

/** 표준 User-Agent — Chrome 최신 버전 */
export const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
  'AppleWebKit/537.36 (KHTML, like Gecko) ' +
  'Chrome/132.0.0.0 Safari/537.36'

/** 최소~최대 랜덤 딜레이 */
export async function delay(minMs = 2000, maxMs = 3500) {
  const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs
  await new Promise(resolve => setTimeout(resolve, ms))
}

/** 상품명 + 카테고리 기반 한국어 설명 생성 */
export function generateDescription(title: string, category: string): string {
  const categoryMap: Record<string, string> = {
    '뷰티': '뷰티 루틴을 완성해줄 감각적인 아이템입니다.',
    '라이프스타일': '일상을 더욱 특별하게 만들어줄 라이프스타일 제품입니다.',
    '아이디어': '독창적인 디자인이 돋보이는 아이디어 상품입니다.',
  }
  return categoryMap[category] ?? '글로벌 감도를 담은 특별한 상품입니다.'
}
