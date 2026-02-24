import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '오늘의 픽 100 | 글로벌 감도 큐레이션',
  description: '전 세계 감도 높은 쇼핑몰에서 엄선한 오늘의 인기 상품 TOP 100. 뷰티, 라이프스타일, 아이디어 상품을 매일 새롭게 만나보세요.',
  keywords: ['뷰티', '라이프스타일', '글로벌 쇼핑', '큐레이션', '오늘의 픽'],
  openGraph: {
    title: '오늘의 픽 100',
    description: '전 세계 감도 높은 쇼핑몰에서 엄선한 오늘의 TOP 100',
    locale: 'ko_KR',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>
        {children}
      </body>
    </html>
  )
}
