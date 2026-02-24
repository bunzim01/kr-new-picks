'use server';

import { RSS_FEEDS } from './feeds';
import { fetchAllRssFeeds } from './fetcher';
import { extractMetadataSequential } from './extractor';
import { applyFilters } from './filters';
import { classifyProducts } from './classifier';
import { deduplicateByUrl } from './deduplicator';
import { getDb, upsertProducts, logScrape } from './db';
import { delay, randomDelay, toISOString } from './utils';
import { ScrapeResult, Product } from './types';

// 메인 스크래핑 함수 (오케스트레이션)
export async function scrapeNewProducts(): Promise<ScrapeResult> {
  const startTime = Date.now();

  try {
    console.log('\n====== 📡 스크래핑 시작 ======');
    console.log(`시간: ${new Date().toISOString()}`);

    // 1단계: RSS 피드 동시 수집
    console.log('\n1️⃣  RSS 피드 수집...');
    const rawProducts = await fetchAllRssFeeds(RSS_FEEDS);
    const totalFetched = rawProducts.length;
    console.log(`   결과: ${totalFetched}개 아이템`);

    if (totalFetched === 0) {
      console.warn('❌ RSS 피드에서 아이템을 수집하지 못했습니다.');
      logScrape(0, 0, 0, 0, 'error');
      return {
        success: false,
        total: 0,
        inserted: 0,
        skipped: 0,
        scraped_at: new Date().toISOString(),
        error: 'No items fetched'
      };
    }

    // 2단계: URL 중복 제거
    console.log('\n2️⃣  중복 제거...');
    const uniqueProducts = deduplicateByUrl(rawProducts);
    const afterDedup = uniqueProducts.length;
    console.log(`   결과: ${afterDedup}개 고유 아이템`);

    // 3단계: 기본 필터링 (제외/포함 키워드)
    console.log('\n3️⃣  필터링...');
    const filteredProducts = applyFilters(uniqueProducts);
    const afterFilter = filteredProducts.length;
    console.log(`   결과: ${afterFilter}개 아이템 (${totalFetched - afterFilter}개 제외)`);

    if (afterFilter === 0) {
      console.warn('⚠️  필터링 후 아이템이 없습니다.');
      logScrape(totalFetched, 0, 0, 0, 'partial');
      return {
        success: false,
        total: 0,
        inserted: 0,
        skipped: 0,
        scraped_at: new Date().toISOString(),
        error: 'No items after filtering'
      };
    }

    // 4단계: 메타데이터 추출 (순차 + 지연)
    console.log('\n4️⃣  메타데이터 추출...');
    const extractedProducts = await extractMetadataSequential(filteredProducts, (current, total) => {
      if (current % 10 === 0 || current === total) {
        console.log(`   진행: ${current}/${total}`);
      }
    });
    console.log(`   완료: ${extractedProducts.length}개`);

    // 5단계: 카테고리 분류
    console.log('\n5️⃣  카테고리 분류...');
    const classifiedProducts = classifyProducts(extractedProducts);

    // 카테고리 통계
    const categoryStats: Record<string, number> = {};
    for (const product of classifiedProducts) {
      categoryStats[product.category] = (categoryStats[product.category] || 0) + 1;
    }
    console.log(`   결과:`);
    for (const [category, count] of Object.entries(categoryStats)) {
      console.log(`     - ${category}: ${count}개`);
    }

    // 6단계: DB 저장
    console.log('\n6️⃣  DB 저장...');
    const productsToSave: Product[] = classifiedProducts.map((p) => ({
      title: p.title,
      link: p.link,
      source: p.source,
      image_url: p.image_url || '',
      price: p.price || '',
      brand: p.brand || '',
      description: p.description,
      product_url: p.link,
      source_site: p.source,
      category: p.category,
      published_at: p.pubDate ? toISOString(p.pubDate) : new Date().toISOString(),
      pubDate: p.pubDate
    }));

    const { inserted, skipped } = upsertProducts(productsToSave);
    console.log(`   결과: ${inserted}개 추가, ${skipped}개 중복 스킵`);

    // 7단계: 로그 기록
    console.log('\n7️⃣  로그 기록...');
    logScrape(totalFetched, afterFilter, inserted, skipped, 'success');

    const duration = Date.now() - startTime;
    console.log(`\n✅ 스크래핑 완료 (${(duration / 1000).toFixed(1)}초)`);
    console.log(`====== 결과 요약 ======`);
    console.log(`  • 수집: ${totalFetched}개`);
    console.log(`  • 필터링: ${afterFilter}개`);
    console.log(`  • 새로 추가: ${inserted}개`);
    console.log(`  • 중복 스킵: ${skipped}개`);
    console.log(`========================\n`);

    // 현재 전체 상품 수 조회
    const db = getDb();
    const countResult = db.prepare('SELECT COUNT(*) as count FROM products').get() as unknown as {
      count: number;
    };
    const totalProducts = countResult.count;

    return {
      success: true,
      total: totalProducts,
      inserted,
      skipped,
      scraped_at: new Date().toISOString()
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`\n❌ 스크래핑 실패: ${msg}`);
    logScrape(0, 0, 0, 0, 'error');

    return {
      success: false,
      total: 0,
      inserted: 0,
      skipped: 0,
      scraped_at: new Date().toISOString(),
      error: msg
    };
  }
}

// 선택적: 강제 재수집 (기존 데이터 무시)
export async function forceScrape(): Promise<ScrapeResult> {
  console.log('🔄 강제 재수집 모드...');
  return scrapeNewProducts();
}
