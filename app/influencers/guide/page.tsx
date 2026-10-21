// 수집 방법 안내 — 비개발자용 사용 설명
import Link from 'next/link'
import Header from '@/components/Header'

export const metadata = { title: '인플루언서 수집 방법 | 오늘의 픽 100' }

const COLUMNS: Array<[string, string, string]> = [
  ['platform', '플랫폼', 'instagram / tiktok / youtube / x / 17live / pococha (프로필 URL 이 있으면 비워도 됨)'],
  ['handle', '계정명', '@ 없이. URL 이 있으면 비워도 됨'],
  ['display_name', '이름', '표시 이름'],
  ['profile_url', '프로필 URL', '있으면 플랫폼·계정명을 자동으로 읽음'],
  ['followers', '팔로워', '필수. "1.2万", "12K" 같은 표기도 인식'],
  ['engagement_rate', '참여율(%)', '없으면 평균 좋아요·댓글로 계산'],
  ['avg_likes / avg_comments / avg_views', '평균 좋아요·댓글·조회수', '선택'],
  ['female_ratio / age_20_40_ratio', '여성 비중 / 20~40대 비중', '0~1 또는 % (도구 추정치)'],
  ['category_tags', '분야 태그', '뷰티, 스킨케어, 라이프스타일 …'],
  ['live_count_90d / avg_live_viewers', '90일 라이브 횟수 / 평균 동시 시청', '판매력 점수의 핵심'],
  ['comment_reply_rate', '댓글 응답 비율', '0~1'],
  ['has_affiliate_link / is_tiktok_shop_seller', '제휴 링크 / TikTok Shop 셀러', 'yes · 1 · ○ · 있음'],
  ['past_pr_posts', '과거 PR 투고 수', '판매·협업 경험'],
  ['follower_growth_90d', '90일 팔로워 성장률', '0.12 또는 12%'],
  ['viral_posts_90d / media_mentions', '바이럴 게시물 / 미디어 노출', '이슈력'],
  ['fake_follower_ratio', '가짜 팔로워 비율', '0.3(30%) 초과면 제외'],
  ['enjo_history', '炎上 이력', 'yes 면 제외'],
  ['agency / contact_email / contact_url', '사무소 / 메일 / 연락 창구', '컨택 단계에서 사용'],
]

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <Link href="/influencers" className="text-xs text-gray-400 hover:text-charcoal">← 후보 목록</Link>
        <h2 className="font-serif text-2xl text-charcoal mt-3 mb-2">인플루언서 수집 방법</h2>
        <p className="text-sm text-gray-500 mb-8 leading-relaxed">
          후보 데이터는 서드파티 도구(Astream, iCON Suite, Modash 등)에서 내보낸 CSV 나 직접 만든 명단을 읽어 점수를 매깁니다.
          크롤링은 하지 않습니다. YouTube·Instagram 공식 API 키가 있으면 검색·갱신도 할 수 있습니다.
        </p>

        <Step n={1} title="CSV 파일을 data/influencers 폴더에 넣기">
          열 이름은 한국어·영어·일본어 어느 쪽이든 됩니다. 필수는 <strong>플랫폼(또는 프로필 URL), 계정명, 팔로워</strong> 세 가지이고 나머지는 비워도 됩니다.
          예시 파일: <code className="text-xs bg-white border border-gray-100 rounded px-1.5 py-0.5">data/influencers/sample.csv</code>
        </Step>
        <Step n={2} title="로컬 컴퓨터에서 수집 실행">
          <code className="block bg-white text-charcoal text-xs p-3 rounded border border-gray-100 font-mono my-2">npm run collect:influencers</code>
          YouTube 검색까지 하려면 <code className="text-xs">YOUTUBE_API_KEY</code> 를 .env.local 에 넣고
          <code className="block bg-white text-charcoal text-xs p-3 rounded border border-gray-100 font-mono my-2">npm run collect:influencers -- --youtube &quot;韓国コスメ,スキンケア ライブ&quot;</code>
          Instagram 갱신은 <code className="text-xs">IG_ACCESS_TOKEN</code>, <code className="text-xs">IG_USER_ID</code> 를 넣고 <code className="text-xs">--instagram</code> 옵션을 붙입니다.
        </Step>
        <Step n={3} title="후보 목록에서 확인하고 접촉 관리">
          점수 순으로 정렬된 목록에서 등급·접촉 상태로 걸러 보고, 상세 화면에서 접촉 상태·메모·동의 여부를 기록합니다.
          같은 계정을 다시 수집하면 지표와 점수만 바뀌고 접촉 기록은 그대로 남습니다.
        </Step>

        <h3 className="font-medium text-charcoal text-sm mt-10 mb-3">CSV 열 설명</h3>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-400 border-b border-gray-100 text-left">
                <th className="px-3 py-2 font-medium">열 이름</th>
                <th className="px-3 py-2 font-medium">뜻</th>
                <th className="px-3 py-2 font-medium">비고</th>
              </tr>
            </thead>
            <tbody>
              {COLUMNS.map(([k, label, note]) => (
                <tr key={k} className="border-b border-gray-50 align-top">
                  <td className="px-3 py-2 font-mono text-[11px] text-charcoal">{k}</td>
                  <td className="px-3 py-2 text-gray-700">{label}</td>
                  <td className="px-3 py-2 text-gray-500">{note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className="font-medium text-charcoal text-sm mt-10 mb-3">점수 계산</h3>
        <ul className="text-sm text-gray-600 space-y-1.5 leading-relaxed">
          <li><strong>영향력 25</strong>: 팔로워 규모 10, 여성 비중 8, 20~40대 비중 7</li>
          <li><strong>판매력 40</strong>: 라이브 횟수 10, 라이브 시청자 10, 댓글 응답 5, TikTok Shop 6, 제휴 링크 4, PR 경험 5</li>
          <li><strong>이슈력 20</strong>: 90일 성장세 10, 바이럴 게시물 6, 미디어 노출 4</li>
          <li><strong>신뢰도 15</strong>: 규모 보정 참여율 8, 가짜 팔로워 4, 炎上 없음 3</li>
          <li>등급: 70점 이상 골드, 55점 이상 실버, 40점 이상 루키. 가짜 팔로워 30% 초과나 炎上 이력은 제외.</li>
          <li>가중치는 <code className="text-xs">lib/influencer-weights.ts</code> 의 숫자만 바꾸면 됩니다.</li>
        </ul>

        <h3 className="font-medium text-charcoal text-sm mt-10 mb-3">개인정보 원칙</h3>
        <ul className="text-sm text-gray-600 space-y-1.5 leading-relaxed">
          <li>공개 프로필의 공개 수치만 저장하고, 게시물 본문·이미지는 저장하지 않습니다.</li>
          <li>방송 성과(매출·시청자)는 본인 동의를 체크한 뒤에만 기록됩니다.</li>
          <li>본인이 삭제를 요청하면 해당 행을 삭제합니다.</li>
        </ul>
      </main>
    </div>
  )
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 mb-6">
      <div className="w-7 h-7 rounded-full bg-charcoal text-white text-xs flex items-center justify-center shrink-0 mt-0.5">{n}</div>
      <div>
        <h3 className="font-medium text-charcoal text-sm mb-1">{title}</h3>
        <div className="text-sm text-gray-500 leading-relaxed">{children}</div>
      </div>
    </div>
  )
}
