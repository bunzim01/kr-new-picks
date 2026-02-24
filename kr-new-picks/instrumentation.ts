import { initSchema } from './lib/db';
import { registerCronJobs } from './lib/cron';

export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('🚀 Next.js 서버 시작...');

    // DB 스키마 초기화
    try {
      initSchema();
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('❌ DB 초기화 실패:', msg);
    }

    // Cron 작업 등록
    try {
      registerCronJobs();
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('❌ Cron 등록 실패:', msg);
    }

    console.log('✅ 서버 초기화 완료\n');
  }
}
