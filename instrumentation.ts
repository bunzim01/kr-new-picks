// Next.js instrumentation hook — 서버 시작 시 cron 등록
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startCron } = await import('./lib/cron')
    startCron()
  }
}
