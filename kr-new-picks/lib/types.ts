// 카테고리 타입
export type CategoryType =
  | 'Gadgets'
  | 'Home'
  | 'Beauty'
  | 'Fashion'
  | 'Food'
  | 'Other';

// RSS 원본 데이터
export interface RawProduct {
  title: string;
  link: string;
  pubDate?: string;
  description?: string;
  source: string; // RSS 피드 이름
}

// 메타데이터 추출 완료
export interface ExtractedProduct extends RawProduct {
  image_url: string;
  description: string;
  brand?: string;
  price?: string;
}

// 필터링 완료 상태
export interface FilteredProduct extends ExtractedProduct {
  category: CategoryType;
}

// DB 저장 형식
export interface Product extends FilteredProduct {
  id?: number;
  product_url: string;
  source_site: string;
  collected_at?: string;
  published_at?: string;
}

// API 응답 형식
export interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
  lastScrapedAt?: string;
}

// 스크래핑 결과
export interface ScrapeResult {
  success: boolean;
  total: number;
  inserted: number;
  skipped: number;
  scraped_at: string;
  error?: string;
}

// 스크래핑 상태
export interface ScrapeStatus {
  lastScraped?: string;
  status: 'success' | 'error' | 'pending';
  inserted: number;
  total: number;
}

// RSS 피드 설정
export interface FeedConfig {
  name: string;
  url: string;
  priority: 'high' | 'medium' | 'low';
  defaultCategory?: CategoryType;
}
