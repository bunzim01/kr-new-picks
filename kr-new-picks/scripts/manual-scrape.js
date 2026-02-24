#!/usr/bin/env node

/**
 * 수동 스크래핑 스크립트
 * 사용: node scripts/manual-scrape.js
 */

async function main() {
  console.log('🚀 수동 스크래핑 시작...\n');

  try {
    // API 호출
    const response = await fetch('http://localhost:3000/api/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data.success) {
      console.log('✅ 스크래핑 성공!');
      console.log(`   • 새로 추가: ${data.inserted}개`);
      console.log(`   • 중복 스킵: ${data.skipped}개`);
      console.log(`   • 전체 상품: ${data.total}개`);
      console.log(`   • 시간: ${new Date(data.scraped_at).toLocaleString('ko-KR')}`);
    } else {
      console.error('❌ 스크래핑 실패:', data.error);
      process.exit(1);
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('❌ 에러:', msg);
    process.exit(1);
  }
}

main();
