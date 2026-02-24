import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '글로벌 신제품 100 | RSS 기반 큐레이션 사이트',
  description:
    '10개 RSS 피드에서 수집한 최신 글로벌 소비자 상품 TOP 100. 매 6시간마다 자동 업데이트.',
  keywords: [
    '신제품',
    '큐레이션',
    'RSS',
    '글로벌',
    'Gadgets',
    'Lifestyle',
    'Beauty',
    'Fashion',
    'Food'
  ],
  viewport: 'width=device-width, initial-scale=1.0'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <div className="min-h-screen bg-bg">
          {children}
        </div>

        {/* 푸터 */}
        <footer className="bg-white border-t border-gray-200 mt-12 py-6">
          <div className="max-w-6xl mx-auto px-4 text-center text-sm text-gray-500">
            <p>© 2025 글로벌 신제품 100 | RSS 피드 기반 자동 큐레이션</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
