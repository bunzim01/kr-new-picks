# 짝 고르는 규칙 12

핀터레스트·웹의 폰트 짝 예시와, 모션그래픽 디자이너가 클로드 결과물을 반려하면서 정한 기준을 합친 거예요.

1. **반대끼리 짝** — 굵은 ↔ 가는, 고딕 ↔ 세리프·필기체·손글씨. 성격이 비슷한 둘은 짝이 안 보여요.
2. **같은 종류끼리는 피하기** — 세리프+세리프, 필기체+필기체, 손글씨+손글씨는 서로 부딪혀요.
3. **한 화면에 폰트 3개까지** — 제목(개성) · 포인트 · 본문(담백). 4개부터는 산만해요.
4. **짝은 제목 안에서 보이게** — 한 폰트가 작은 글자에만 있으면 무엇끼리 짝인지 티가 안 나요. 제목 안에서 낱말 단위로 섞거나, 위아래 줄로 나눠요.
5. **숫자·영어는 영문 폰트로** — 한글 폰트 속 영문·숫자는 대체로 약해요. 가격·날짜·영어 낱말은 짝 영문 폰트로.
6. **본문은 담백하게** — 개성은 제목에서만. 본문은 프리텐다드·수트 같은 기본 고딕 Light~Regular.
7. **크기 대비는 크게** — 제목은 본문의 3배 이상. 어중간한 중간 크기를 여러 개 만들지 않아요.
8. **큰 제목은 자간을 좁게** — −2% ~ −5%. 영어 대문자 라벨에 자간을 넓게 벌리지 않아요(대표적인 AI 티).
9. **필기체·손글씨는 한두 낱말만** — 긴 문장은 읽히지 않아요.
10. **강조 형광펜은 소문자 몸통만** — 영어 낱말을 칠할 땐 위아래로 긴 획(f·t·d·p·y)은 빼고 x높이만. 한글은 글자 높이만.
11. **레퍼런스를 따라 할 땐 디자인과 색을 같이 가져오지 않기** — 색이 가장 큰 표절 힌트예요. 배치는 문법만 빌리고, 색은 새로 고르세요.
12. **폰트 파일은 결과물에 넣지 않기** — 설치 링크와 웹폰트 주소만. 폰트 파일 재배포가 금지된 폰트가 있어요.

## 형광펜 CSS(규칙 10)
```html
<span class="xhl" data-xhl="#ffb070">perfect</span>
<script>
document.fonts.ready.then(()=>document.querySelectorAll('[data-xhl]').forEach(e=>{
  const cs=getComputedStyle(e), c=document.createElement('canvas').getContext('2d');
  c.font=cs.fontStyle+' '+cs.fontWeight+' '+cs.fontSize+' '+cs.fontFamily;
  const xh=c.measureText('x').actualBoundingBoxAscent, S=parseFloat(cs.fontSize);
  e.style.display='inline-block'; e.style.position='relative';
  const m=document.createElement('span'); m.style.cssText='display:inline-block;width:0;height:0;vertical-align:baseline'; e.appendChild(m);
  const base=m.offsetTop; m.remove(); const t=base-xh-.05*S, b=base+.07*S, col=e.dataset.xhl;
  e.style.background=`linear-gradient(transparent ${t}px,${col} ${t}px,${col} ${b}px,transparent ${b}px)`;
}));
</script>
```

## 일본어 규칙 13~18 — 라이크웨이 추가

13. **한일 병기는 같은 계열로** — 같은 문구를 두 언어로 쓸 땐 반대끼리가 아니라 고딕은 고딕, 명조는 명조, 굵기도 맞춰요. 한쪽만 튀면 번역문처럼 보여요.
14. **모바일 본문은 고딕** — 명조 본문은 작은 화면에서 가는 획이 흐려져요. 명조는 제목과 한 줄 문구에만.
15. **일본어 제목은 palt로 조이기** — `font-feature-settings: "palt"`를 켜면 가나 사이 빈칸이 줄어 제목이 단단해져요. 본문은 끄고 그대로 둬요.
16. **본문 행간은 1.7~1.9** — 한자·가나가 빽빽해서 한글보다 넉넉하게. 본문에는 `word-break: keep-all`을 쓰지 않아요(띄어쓰기가 없어 줄이 안 넘어가요).
17. **가격은 숫자를 또렷하게, 税込 표기는 빼지 않기** — 「¥2,980(税込)」처럼 숫자는 영문 폰트나 고정폭으로. 일본은 소비자 가격을 세금 포함 총액으로 표시해야 해요.
18. **lang="ja"를 붙이고, 일본어 폰트는 한 화면 2개까지** — lang이 없으면 같은 한자가 한국·중국식 모양으로 나올 수 있어요. 일본어 폰트는 글자가 많아 무거우니, 구글 폰트 주소를 그대로 써서 필요한 글자만 받게 해요.
