'use client';

import { useState } from 'react';

export default function RefreshButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleRefresh() {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST'
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✅ 완료! ${data.inserted}개 상품이 추가되었습니다.`);
        // 2초 후 새로고침
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setMessage(`❌ 오류: ${data.error || '스크래핑 실패'}`);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      setMessage(`❌ 네트워크 오류: ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={handleRefresh}
        disabled={loading}
        className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
          loading
            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
            : 'bg-accent text-text hover:bg-opacity-80'
        }`}
      >
        {loading ? '수집 중...' : '지금 수집'}
      </button>

      {message && (
        <div className="text-sm text-center">
          {message}
        </div>
      )}
    </div>
  );
}
