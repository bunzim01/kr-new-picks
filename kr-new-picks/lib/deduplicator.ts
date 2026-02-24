import { RawProduct, FilteredProduct } from './types';

// URL 기준 중복 제거
export function deduplicateByUrl<T extends { link?: string; product_url?: string }>(
  products: T[]
): T[] {
  const seen = new Set<string>();
  const unique: T[] = [];

  for (const product of products) {
    const url = product.product_url || product.link;
    if (!url) continue;

    // URL 정규화 (쿼리 파라미터 제거, 소문자)
    const normalized = normalizeUrl(url);

    if (!seen.has(normalized)) {
      seen.add(normalized);
      unique.push(product);
    }
  }

  console.log(
    `🔄 중복 제거: ${products.length}개 → ${unique.length}개 (${products.length - unique.length}개 중복)`
  );

  return unique;
}

// URL 정규화
export function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);

    // 프로토콜 정규화
    urlObj.protocol = urlObj.protocol.toLowerCase();

    // 호스트 정규화
    urlObj.hostname = urlObj.hostname.toLowerCase();

    // www 제거
    if (urlObj.hostname.startsWith('www.')) {
      urlObj.hostname = urlObj.hostname.substring(4);
    }

    // 트레일링 슬래시 제거
    if (urlObj.pathname.endsWith('/') && urlObj.pathname.length > 1) {
      urlObj.pathname = urlObj.pathname.slice(0, -1);
    }

    // 쿼리 파라미터 제거 (선택사항: UTM 파라미터만 제거)
    const params = new URLSearchParams(urlObj.search);
    const utm = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
    for (const param of utm) {
      params.delete(param);
    }
    urlObj.search = params.toString();

    return urlObj.toString();
  } catch {
    return url.toLowerCase();
  }
}

// URL 유사도 검사 (도메인 + 경로 기반)
export function isSimilarUrl(url1: string, url2: string): boolean {
  try {
    const obj1 = new URL(url1);
    const obj2 = new URL(url2);

    // 도메인 비교
    const domain1 = obj1.hostname?.replace('www.', '').toLowerCase();
    const domain2 = obj2.hostname?.replace('www.', '').toLowerCase();

    if (domain1 !== domain2) return false;

    // 경로의 처음 부분 비교 (제품 ID 같은 고유 부분)
    const path1 = obj1.pathname.split('/').filter((p) => p.length > 0)[0];
    const path2 = obj2.pathname.split('/').filter((p) => p.length > 0)[0];

    return path1 === path2;
  } catch {
    return false;
  }
}

// 고급 중복 제거 (URL + 제목 기반)
export function deduplicateAdvanced<T extends { link?: string; title: string }>(
  products: T[]
): T[] {
  const seen = new Set<string>();
  const unique: T[] = [];

  for (const product of products) {
    const url = product.link;
    if (!url) continue;

    // URL + 제목 해시 생성
    const normalizedUrl = normalizeUrl(url);
    const key = `${normalizedUrl}|${product.title.toLowerCase()}`;

    if (!seen.has(key)) {
      seen.add(key);
      unique.push(product);
    }
  }

  return unique;
}

// 중복 검사 유틸
export function getDuplicateStats(original: RawProduct[], deduplicated: RawProduct[]): {
  total: number;
  duplicates: number;
  unique: number;
} {
  return {
    total: original.length,
    duplicates: original.length - deduplicated.length,
    unique: deduplicated.length
  };
}
