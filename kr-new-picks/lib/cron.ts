import cron from 'node-cron';
import { scrapeNewProducts } from './scraper';

let cronJob: cron.ScheduledTask | null = null;

// Cron 작업 등록
export function registerCronJobs(): void {
  if (cronJob) {
    console.log('[Cron] ⚠️  이미 등록되어 있습니다.');
    return;
  }

  // 6시간마다 스크래핑 (0시, 6시, 12시, 18시 UTC)
  // = 9시, 15시, 21시, 03시 KST
  cronJob = cron.schedule('0 */6 * * *', async () => {
    console.log('\n🕐 [Cron] 6시간 주기 스크래핑 시작 (UTC 기준)');

    try {
      const result = await scrapeNewProducts();

      if (result.success) {
        console.log(`✅ [Cron] 스크래핑 완료: ${result.inserted}개 추가, 전체 ${result.total}개`);
      } else {
        console.error(`❌ [Cron] 스크래핑 실패: ${result.error}`);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`❌ [Cron] 에러: ${msg}`);
    }
  });

  console.log('[Cron] ✅ Cron 작업 등록 완료 (6시간 주기, UTC 기준)');
}

// Cron 작업 중지 (선택사항)
export function stopCronJobs(): void {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
    console.log('[Cron] ⏹️  Cron 작업 중지');
  }
}

// Cron 상태 확인
export function getCronStatus(): string {
  return cronJob ? '실행 중' : '중지됨';
}
