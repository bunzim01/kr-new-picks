import { formatKST } from '@/lib/utils';
import { getLastScrapedAt } from '@/lib/db';
import RefreshButton from './RefreshButton';

export default function Header() {
  const lastScraped = getLastScrapedAt();

  return (
    <header className="bg-white border-b border-gray-200 py-6 mb-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="font-noto-serif text-4xl font-bold text-text mb-2">
              글로벌 신제품 100
            </h1>
            <p className="font-noto-sans text-gray-600">
              10개 RSS 피드에서 수집한 최신 소비자 상품
            </p>
          </div>

          <div className="text-right">
            {lastScraped && (
              <div className="text-sm text-gray-500 mb-2">
                마지막 업데이트: {formatKST(lastScraped)}
              </div>
            )}
            <RefreshButton />
          </div>
        </div>
      </div>
    </header>
  );
}
