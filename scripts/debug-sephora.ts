#!/usr/bin/env node
// Sephora API 직접 호출 디버그

// Sephora 내부 API 엔드포인트 목록
const APIS = [
  // Best Sellers — Makeup 카테고리
  'https://www.sephora.com/api/catalog/categories/cat140001/products?currentPage=1&pageSize=30&sortBy=TOP_SELLERS&content=true',
  // New Arrivals — Makeup
  'https://www.sephora.com/api/catalog/categories/cat140001/products?currentPage=1&pageSize=30&sortBy=NEW&content=true',
  // Best Sellers — Skincare
  'https://www.sephora.com/api/catalog/categories/cat150010/products?currentPage=1&pageSize=30&sortBy=TOP_SELLERS&content=true',
]

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
  'Accept': 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://www.sephora.com/',
  'sec-ch-ua': '"Chromium";v="132", "Google Chrome";v="132"',
  'sec-ch-ua-platform': '"Windows"',
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'same-origin',
}

;(async () => {
  for (const url of APIS) {
    console.log(`\n🌐 API 호출: ${url}`)
    try {
      const res = await fetch(url, { headers: HEADERS })
      console.log(`📡 상태: ${res.status} ${res.statusText}`)

      if (!res.ok) {
        const text = await res.text()
        console.log(`❌ 응답 (처음 300자): ${text.slice(0, 300)}`)
        continue
      }

      const json = await res.json() as Record<string, unknown>
      console.log('✅ JSON 키:', Object.keys(json))

      // 상품 목록이 담긴 필드 탐색
      const findProducts = (obj: unknown, depth = 0): unknown[] => {
        if (depth > 5 || !obj || typeof obj !== 'object') return []
        if (Array.isArray(obj) && obj.length > 0 && typeof obj[0] === 'object') return obj
        for (const val of Object.values(obj as Record<string, unknown>)) {
          const found = findProducts(val, depth + 1)
          if (found.length > 0) return found
        }
        return []
      }

      const products = findProducts(json)
      if (products.length > 0) {
        console.log(`📦 상품 ${products.length}개 발견`)
        const first = products[0] as Record<string, unknown>
        console.log('첫 번째 상품 키:', Object.keys(first))
        console.log('샘플:', JSON.stringify(first).slice(0, 400))
      } else {
        console.log('⚠️  상품 배열 없음. 전체 응답 키 구조:')
        console.log(JSON.stringify(json, null, 2).slice(0, 600))
      }
    } catch (err) {
      console.error('🔥 요청 실패:', err)
    }
  }
})()
