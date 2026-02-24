import { RawProduct, ExtractedProduct } from './types';
import { fetchPage } from './fetcher';
import { truncate, cleanText, parsePrice, resolveUrl } from './utils';

// OG 메타데이터 추출
async function extractOgMetadata(
  url: string
): Promise<{ title?: string; description?: string; image?: string }> {
  const $ = await fetchPage(url);
  if (!$) {
    return {};
  }

  const metadata = {
    title: $('meta[property="og:title"]').attr('content'),
    description: $('meta[property="og:description"]').attr('content'),
    image: $('meta[property="og:image"]').attr('content')
  };

  return metadata;
}

// 페이지에서 이미지 추출 (og:image 우선, 없으면 첫 번째 img)
async function extractImage(url: string): Promise<string> {
  const $ = await fetchPage(url);
  if (!$) {
    return '';
  }

  // og:image 우선
  const ogImage = $('meta[property="og:image"]').attr('content');
  if (ogImage) {
    return ogImage;
  }

  // 첫 번째 img 태그
  const firstImg = $('img').first().attr('src');
  if (firstImg) {
    return resolveUrl(url, firstImg);
  }

  return '';
}

// 가격 추출
async function extractPrice(url: string): Promise<string> {
  const $ = await fetchPage(url);
  if (!$) {
    return '';
  }

  const priceText = $('*').text();
  return parsePrice(priceText);
}

// 브랜드 추출 (og:brand 또는 도메인)
async function extractBrand(url: string): Promise<string> {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname
      .replace('www.', '')
      .split('.')[0]
      .charAt(0)
      .toUpperCase() + urlObj.hostname.replace('www.', '').split('.')[0].slice(1);

    return domain;
  } catch {
    return 'Unknown';
  }
}

// 상품별 메타데이터 추출
export async function extractMetadata(product: RawProduct): Promise<ExtractedProduct> {
  const ogData = await extractOgMetadata(product.link);
  const image = await extractImage(product.link);
  const price = await extractPrice(product.link);
  const brand = await extractBrand(product.link);

  // 제목: OG 우선, 없으면 RSS 제목
  const title = ogData.title || product.title;

  // 설명: OG 우선, 없으면 RSS 설명, 최대 150자
  const description = cleanText(ogData.description || product.description || title);
  const truncatedDescription = truncate(description, 150);

  return {
    ...product,
    title: cleanText(title),
    image_url: image,
    price,
    brand,
    description: truncatedDescription
  };
}

// 여러 상품 메타데이터 추출 (순차, 지연 포함)
export async function extractMetadataSequential(
  products: RawProduct[],
  onProgress?: (current: number, total: number) => void
): Promise<ExtractedProduct[]> {
  const results: ExtractedProduct[] = [];

  for (let i = 0; i < products.length; i++) {
    try {
      const extracted = await extractMetadata(products[i]);
      results.push(extracted);

      if (onProgress) {
        onProgress(i + 1, products.length);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.warn(`⚠️  메타데이터 추출 실패: ${products[i].link} - ${msg}`);
      // 실패해도 계속 진행 (RSS 원본값 사용)
      results.push({
        ...products[i],
        title: cleanText(products[i].title),
        image_url: '',
        price: '',
        brand: 'Unknown',
        description: truncate(products[i].description || products[i].title, 150)
      });
    }
  }

  return results;
}
