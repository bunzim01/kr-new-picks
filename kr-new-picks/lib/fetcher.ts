import * as cheerio from 'cheerio';
import { RawProduct, FeedConfig } from './types';
import { USER_AGENT, randomDelay } from './utils';

// 단일 RSS 피드 파싱
export async function fetchRssFeed(feed: FeedConfig): Promise<RawProduct[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(feed.url, {
      headers: {
        'User-Agent': USER_AGENT
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`⚠️  RSS Fetch 실패: ${feed.name} (${response.status})`);
      return [];
    }

    const text = await response.text();
    const $ = cheerio.load(text, { xmlMode: true });

    const products: RawProduct[] = [];

    // 최대 50개 아이템 추출
    $('item').slice(0, 50).each((_, elem) => {
      const title = $(elem).find('title').text().trim();
      const link = $(elem).find('link').text().trim();
      const pubDate = $(elem).find('pubDate').text().trim();
      const description = $(elem).find('description').text().trim();

      if (title && link) {
        products.push({
          title,
          link,
          pubDate,
          description,
          source: feed.name
        });
      }
    });

    console.log(`✅ ${feed.name}: ${products.length}개 아이템 파싱 완료`);
    return products;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`❌ RSS Fetch 에러: ${feed.name} - ${msg}`);
    return [];
  }
}

// 모든 RSS 피드 동시 수집
export async function fetchAllRssFeeds(feeds: FeedConfig[]): Promise<RawProduct[]> {
  console.log(`\n📡 ${feeds.length}개 RSS 피드 동시 수집 시작...`);

  const results = await Promise.all(feeds.map((feed) => fetchRssFeed(feed)));

  const allProducts = results.flat();
  console.log(`\n📊 총 ${allProducts.length}개 아이템 수집 완료`);

  return allProducts;
}

// 단일 HTML 페이지 fetch
export async function fetchPage(url: string): Promise<cheerio.CheerioAPI | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const text = await response.text();
    return cheerio.load(text);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn(`⚠️  페이지 Fetch 실패: ${url} - ${msg}`);
    return null;
  }
}

// 직렬 fetch (각 요청마다 지연)
export async function fetchSequential(
  urls: string[],
  callback: (url: string, index: number) => Promise<void>
): Promise<void> {
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    try {
      await callback(url, i);
      if (i < urls.length - 1) {
        await randomDelay();
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`❌ 순차 Fetch 에러: ${url} - ${msg}`);
    }
  }
}
