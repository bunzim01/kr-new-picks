// 지연 함수 (밀리초)
export async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 동적 지연 (2~3초 랜덤)
export async function randomDelay(): Promise<void> {
  const ms = 2000 + Math.random() * 1000;
  return delay(ms);
}

// 표준 User-Agent
export const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36';

// 가격 파싱 ($100.00 형식 추출)
export function parsePrice(text: string | null | undefined): string {
  if (!text) return '';

  const match = text.match(/\$[\d,]+\.?\d{0,2}/);
  return match ? match[0] : '';
}

// 텍스트 자르기 (최대 length 글자)
export function truncate(text: string, length: number = 150): string {
  if (!text) return '';
  return text.length > length ? text.substring(0, length).trim() + '...' : text;
}

// 텍스트 정제 (공백, 특수문자 제거)
export function cleanText(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .replace(/\s+/g, ' ')
    .replace(/<[^>]*>/g, '') // HTML 태그 제거
    .trim();
}

// ISO 날짜 형식
export function toISOString(date: Date | string): string {
  if (typeof date === 'string') {
    return new Date(date).toISOString();
  }
  return date.toISOString();
}

// 한국 시간 포맷
export function formatKST(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Seoul'
  }).format(d);
}

// URL 유효성 검사
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// 상대 URL을 절대 URL로 변환
export function resolveUrl(base: string, relative: string): string {
  try {
    return new URL(relative, base).toString();
  } catch {
    return relative;
  }
}

// 키워드 포함 여부 검사 (대소문자 무시)
export function includesKeyword(text: string | null | undefined, keywords: string[]): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw.toLowerCase()));
}

// 카테고리 배지 색상
export const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  Gadgets: { bg: 'bg-blue-100', text: 'text-blue-800' },
  Home: { bg: 'bg-green-100', text: 'text-green-800' },
  Beauty: { bg: 'bg-pink-100', text: 'text-pink-800' },
  Fashion: { bg: 'bg-purple-100', text: 'text-purple-800' },
  Food: { bg: 'bg-orange-100', text: 'text-orange-800' },
  Other: { bg: 'bg-gray-100', text: 'text-gray-800' }
};

// 상품 ID 생성 (URL 기반)
export function generateId(url: string): string {
  return Buffer.from(url).toString('base64').substring(0, 12);
}
