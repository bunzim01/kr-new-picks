#!/usr/bin/env python3
"""폰트 페어링 미리보기 — 고른 짝을 실제 문구로 그린 HTML 한 장(1080×1350)을 만든다. 파이썬 기본만 씀.
폰트는 파일이 아니라 웹폰트 주소(구글 폰트 · 눈누 CDN)로 불러온다.

  python3 preview.py --title "Gloock" --point "DM Mono" --body "프리텐다드" \
     --head "find your|perfect|pair." --hl perfect --text "두 폰트, 한 분위기" --out preview.html
  python3 preview.py --title "Zen Old Mincho" --point "Klee One" --body "Zen Kaku Gothic New" \
     --head "P:ふわっと|T:うるおう" --text "韓国で話題のスキンケア" --out preview_ja.html   # 일본어
  python3 preview.py --list            # 폰트 목록(역할별)

--head  제목 줄을 | 로 나눔. 줄마다 폰트를 바꾸려면 앞에 T: 또는 P: (T=제목 폰트, P=포인트 폰트). 없으면 첫 줄 P, 나머지 T.
--hl    형광펜 칠할 낱말(소문자 몸통 높이만 칠함). --accent 형광펜 색, --bg 바탕색, --ink 글자색."""
import argparse, html, json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, '..', 'references', 'fonts.json')
FONTS = {f['name']: f for f in json.load(open(DATA, encoding='utf-8'))}

def need(name):
    if name not in FONTS:
        sys.exit(f'목록에 없는 폰트: {name}\n  python3 preview.py --list 로 이름을 확인하세요.')
    return FONTS[name]

def font_css(names):
    links, faces = [], []
    for n in dict.fromkeys(names):
        f = FONTS[n]
        if 'webfont_css' in f:  # 영어·일본어: 구글 폰트 주소
            links.append(f'<link rel="stylesheet" href="{f["webfont_css"]}">')
        else:
            for w in f['webfont']:
                wt = 400 if w['weight'] == 'single' else w['weight']
                fmt = 'woff2' if w['src'].endswith('woff2') else 'woff' if w['src'].endswith('woff') else 'truetype'
                faces.append(f"@font-face{{font-family:'{n}';font-weight:{wt};font-display:block;src:url('{w['src']}') format('{fmt}')}}")
    return '\n'.join(links), '\n'.join(faces)

def default_weight(n):
    f = FONTS[n]
    if f['lang'] == 'ja': return f.get('default_weight', 400)
    if f['lang'] == 'ko':
        ws = [w['weight'] for w in f['webfont'] if w['weight'] != 'single']
        if not ws: return 400
        return max(ws) if f['role'] in ('본문 고딕', '넓은 고딕', '굵은 제목') else 400
    return 800 if f['role'].startswith('고딕(그로') else 400

def main():
    ap = argparse.ArgumentParser(description='폰트 페어링 미리보기')
    ap.add_argument('--list', action='store_true'); ap.add_argument('--title'); ap.add_argument('--point'); ap.add_argument('--body', default='프리텐다드')
    ap.add_argument('--head', default='Two fonts,|one mood.'); ap.add_argument('--hl', default=''); ap.add_argument('--text', default='')
    ap.add_argument('--bg', default='#fff3d6'); ap.add_argument('--ink', default='#1d1f17'); ap.add_argument('--accent', default='#ffb070')
    ap.add_argument('--tw', type=int); ap.add_argument('--pw', type=int); ap.add_argument('--psize', type=int, default=124, help='포인트 줄 크기(px, 제목 줄은 150)'); ap.add_argument('--italic', action='store_true', help='포인트 폰트를 이탤릭으로')
    ap.add_argument('--out', default='preview.html')
    a = ap.parse_args()
    if a.list:
        for lang, t in [('ko', '한글'), ('en', '영어'), ('ja', '일본어')]:
            print(f'── {t}')
            roles = {}
            for f in FONTS.values():
                if f['lang'] == lang: roles.setdefault(f['role'], []).append(f['name'])
            for r, ns in roles.items(): print(f'  {r}: ' + ', '.join(ns))
        return
    if not a.title or not a.point: sys.exit('--title 과 --point 를 넣어 주세요. (--list 로 목록)')
    T, P, B = need(a.title), need(a.point), need(a.body)
    links, faces = font_css([a.title, a.point, a.body])
    tw, pw, bw = a.tw or default_weight(a.title), a.pw or default_weight(a.point), 300 if B['lang'] == 'ko' else 400
    lines = []
    for i, raw in enumerate(a.head.split('|')):
        kind = 'P' if i == 0 else 'T'
        if raw[:2] in ('T:', 'P:'): kind, raw = raw[0], raw[2:]
        txt = html.escape(raw)
        if a.hl and a.hl in raw: txt = txt.replace(html.escape(a.hl), f'<span class="xhl" data-xhl="{a.accent}">{html.escape(a.hl)}</span>')
        fam, wt = (a.title, tw) if kind == 'T' else (a.point, pw)
        sty = 'italic' if (kind == 'P' and a.italic) else 'normal'
        lines.append(f'<div class="hl-line" lang="{FONTS[fam]["lang"]}" data-fit="900" style="font-family:\'{fam}\';font-weight:{wt};font-style:{sty};font-size:{150 if kind == "T" else a.psize}px">{txt}</div>')
    spec = ' <i>×</i> '.join(f'<span style="font-family:\'{n}\';font-weight:{w}">{html.escape(n)}</span>' for n, w in [(a.title, tw), (a.point, pw)])
    seen = set(); lic_rows = []
    for f in (T, P, B):
        if f['name'] in seen: continue
        seen.add(f['name']); lic_rows.append(f'<div class="lic"><b>{html.escape(f["name"])}</b> · {html.escape(f["install"])}<br><small>{html.escape(f["license"])} · 폰트 파일 {html.escape(f["font_file"])}</small></div>')
    page = f"""<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>폰트 페어링 미리보기</title>{links}
<style>{faces}
html,body{{margin:0}} body{{width:1080px;height:1350px;background:{a.bg};color:{a.ink};position:relative;overflow:hidden;word-break:keep-all;-webkit-font-smoothing:antialiased}}
.wrap{{position:absolute;left:90px;right:90px;top:170px;display:flex;flex-direction:column;align-items:center;gap:44px;text-align:center}}
.head{{text-align:center}}
:lang(ja){{font-feature-settings:'palt'}} .body:lang(ja){{word-break:normal;line-break:strict;font-feature-settings:normal;line-height:1.8}}
.hl-line{{line-height:1.02;letter-spacing:-.03em;white-space:nowrap}}
.xhl{{display:inline-block;position:relative;padding:0 .08em}}
.body{{max-width:820px;font-family:'{a.body}';font-weight:{bw};font-size:34px;line-height:1.6}}
.spec{{font-size:40px;padding-top:24px;border-top:1.5px solid currentColor}} .spec i{{font-style:normal;opacity:.5;margin:0 14px;font-family:'{a.body}'}}
.lics{{position:absolute;left:120px;right:120px;bottom:70px;font-family:'{a.body}';font-weight:{bw};font-size:20px;line-height:1.5;opacity:.78}}
.lic{{margin-top:8px}} .lic small{{font-size:16px}}
</style></head><body>
<div class="wrap"><div class="head">{''.join(lines)}</div>
<div class="body" lang="{B["lang"]}">{html.escape(a.text)}</div>
<div class="spec">{spec}</div></div>
<div class="lics">{''.join(lic_rows)}</div>
<script>document.fonts.ready.then(()=>{{
 document.querySelectorAll('[data-fit]').forEach(e=>{{const s=document.createElement('span');s.style.cssText='display:inline-block;white-space:nowrap';while(e.firstChild)s.appendChild(e.firstChild);e.appendChild(s);const w=s.getBoundingClientRect().width,fs=parseFloat(getComputedStyle(e).fontSize);if(w>e.dataset.fit)e.style.fontSize=(fs*e.dataset.fit/w)+'px'}});
 document.querySelectorAll('[data-xhl]').forEach(e=>{{const cs=getComputedStyle(e),c=document.createElement('canvas').getContext('2d');c.font=cs.fontStyle+' '+cs.fontWeight+' '+cs.fontSize+' '+cs.fontFamily;const xh=c.measureText('x').actualBoundingBoxAscent,S=parseFloat(cs.fontSize);const m=document.createElement('span');m.style.cssText='display:inline-block;width:0;height:0;vertical-align:baseline';e.appendChild(m);const base=m.offsetTop;m.remove();const t=base-xh-.05*S,b=base+.07*S,col=e.dataset.xhl;e.style.background=`linear-gradient(transparent ${{t}}px,${{col}} ${{t}}px,${{col}} ${{b}}px,transparent ${{b}}px)`}});
 document.body.dataset.ready='1'}})</script></body></html>"""
    open(a.out, 'w', encoding='utf-8').write(page)
    print('ok', a.out, '·', a.title, '×', a.point, '· 본문', a.body)

if __name__ == '__main__':
    main()
