// 상품 데이터 타입 정의

export interface Product {
  id: number
  title: string
  image_url: string
  price: string
  original_price: string
  discount_rate: number
  description: string
  product_url: string
  brand: string
  source_site: string
  category: '뷰티' | '라이프스타일' | '아이디어'
  score: number
  rank: number
  collected_date: string
  created_at: string
}

// 크롤러가 수집하는 원본 데이터 (점수/순위 없음)
export interface RawProduct {
  title: string
  image_url: string
  price: string
  original_price: string
  discount_rate: number
  description: string
  product_url: string
  brand: string
  source_site: string
  category: '뷰티' | '라이프스타일' | '아이디어'
  // 점수 계산용 메타데이터
  is_new_arrival: boolean
  is_best_seller: boolean
}

// 사이트별 크롤러 설정
export interface SiteConfig {
  name: string          // 사이트명 (source_site)
  url: string           // 수집 URL
  category: '뷰티' | '라이프스타일' | '아이디어'
  type: 'new_arrival' | 'best_seller'
  flag: string          // 국가 이모지
}

// API 응답 타입
export interface ProductsResponse {
  products: Product[]
  total: number
  page: number
  totalPages: number
  date: string
}
