# 구글·유튜브 자동완성 수집기
# 아랍어 '한국 여자' 관련 씨앗 검색어로 나라별(사우디·UAE·쿠웨이트·이집트) 실제 자동완성 검색어를 모은다.
# 자동완성 순서 = 구글이 보여 주는 인기순 (검색 건수는 주지 않음)
import json, sys, time, urllib.parse, urllib.request, csv, os

OUT = sys.argv[1]
COUNTRIES = ["sa", "ae", "kw", "eg"]
SOURCES = {"google": "", "youtube": "yt"}

# 씨앗 검색어: 한국 여자 전반 + 뷰티 + 걸프/이집트 방언 질문형
SEEDS = [
    "الكوريات", "البنات الكوريات", "بنات كوريا", "الكورية", "كورية",
    "ليش الكوريات", "لماذا الكوريات", "ليه الكوريات",
    "كيف الكوريات", "ازاي الكوريات", "هل الكوريات", "وش تستخدم الكوريات",
    "سر الكوريات", "سر بشرة الكوريات", "سر جمال الكوريات", "روتين الكوريات",
    "بشرة الكوريات", "شعر الكوريات", "مكياج الكوريات", "رجيم الكوريات",
    "الكوريات يستخدمون", "الكوريات ما", "كورية تتكلم", "يوتيوبر كورية",
    "سكن كير كوري", "منتجات كورية", "روتين كوري",
]
# 긴 꼬리 확장용 (씨앗 뒤에 글자 붙이기) — 핵심 씨앗만
EXPAND = ["الكوريات", "ليش الكوريات", "سر الكوريات", "كيف الكوريات", "بشرة الكوريات"]
LETTERS = list("ابتثجحخدذرزسشصضطظعغفقكلمنهوي")

def fetch(q, gl, ds):
    params = {"client": "firefox", "hl": "ar", "gl": gl, "q": q}
    if ds: params["ds"] = ds
    url = "https://suggestqueries.google.com/complete/search?" + urllib.parse.urlencode(params)
    for attempt in range(3):
        try:
            with urllib.request.urlopen(url, timeout=15) as r:
                return json.loads(r.read().decode("utf-8", "replace"))[1]
        except Exception as e:
            time.sleep(2 * (attempt + 1))
    return None

rows, fails = [], 0
queries = [(s, s) for s in SEEDS] + [(s, f"{s} {l}") for s in EXPAND for l in LETTERS]
total = len(queries) * len(COUNTRIES) * len(SOURCES)
n = 0
for src, ds in SOURCES.items():
    for gl in COUNTRIES:
        for seed, q in queries:
            n += 1
            res = fetch(q, gl, ds)
            if res is None:
                fails += 1
                continue
            for rank, sug in enumerate(res, 1):
                rows.append({"source": src, "country": gl, "seed": seed, "query": q, "rank": rank, "suggestion": sug})
            time.sleep(0.25)
        print(f"{src}/{gl} 완료 ({n}/{total}), 실패 {fails}", flush=True)

with open(OUT, "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=["source", "country", "seed", "query", "rank", "suggestion"])
    w.writeheader(); w.writerows(rows)
print("rows", len(rows), "fails", fails)
