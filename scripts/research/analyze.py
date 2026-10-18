# 실데이터 분석: 자동완성 검색어 + 유튜브 댓글 → 주제별 집계
# 사용: python3 analyze.py <데이터폴더>
import csv, json, re, sys, collections, os

D = sys.argv[1]
AR = re.compile(r"[؀-ۿ]")

def norm(s):
    s = re.sub(r"[ً-ْـ]", "", s)          # 모음 부호·장식선 제거
    s = s.replace("أ", "ا").replace("إ", "ا").replace("آ", "ا").replace("ى", "ي").replace("ة", "ه")
    return re.sub(r"\s+", " ", s).strip().lower()

# 주제 사전 (정규화된 형태로 비교)
TOPICS = {
    "피부·스킨케어": ["بشر", "سكن", "روتين", "كريم", "ماسك", "واقي", "صن بلوك", "تبييض", "تفتيح", "حبوب", "حب الشباب", "مسام", "هالات", "نضار", "زجاج", "تونر", "سيروم", "غسول", "تجاعيد", "نقاء", "صافيه"],
    "메이크업": ["مكياج", "ميكب", "ميك اب", "makeup", "روج", "تنت", "كوشن", "رموش", "عيون"],
    "헤어": ["شعر", "شعرك", "شامبو"],
    "몸매·다이어트·음식": ["رجيم", "دايت", "وزن", "نحيف", "نحافه", "رشيق", "جسم", "ياكلون", "تاكل", "اكل", "اندومي", "رياضه", "طويل", "طول", "قصير"],
    "성형·자연미인": ["عمليات", "عمليه", "تجميل", "طبيعي", "بدون مكياج", "فلتر", "قبل وبعد", "بلاستيك"],
    "제품·구매처": ["منتج", "منتجات", "وين اشتري", "من وين", "سعر", "رابط", "اسم ال", "متجر", "نون", "امازون", "اوليف"],
    "아랍어·언어": ["عربي", "العربيه", "تتكلم", "تتحدث", "لهجه", "لغه", "تعلمت", "تتعلم", "سعودي", "خليجي", "مصري", "كوري"],
    "종교·이슬람·히잡": ["اسلام", "مسلم", "حجاب", "محجب", "الله يهدي", "يهديها", "صلاه", "رمضان", "نقاب", "استغفر", "عري"],
    "한국 생활·여행·유학": ["سافر", "اسافر", "سفر", "دراسه", "ادرس", "اعيش", "العيش", "منحه", "شغل", "عمل", "حياه", "اهاجر"],
    "연애·결혼": ["زواج", "تتزوج", "زوج", "حبيب", "خطيب", "يتزوج", "عريس"],
    "K-팝·드라마": ["بي تي اس", "bts", "مسلسل", "دراما", "كيبوب", "كي بوب", "ايدول", "بلاك بينك", "blackpink", "جونغكوك", "جيمين"],
    "나이·동안": ["عمرك", "كم عمر", "اعمار", "صغيره", "شباب", "عجوز", "كبيره"],
}
QWORDS = ["؟", "?", "هل ", "كيف", "ليش", "لماذا", "ليه", "وش ", "ايش", "شو ", "ازاي", "متى", "وين", "فين", "كم ", "مين ", "ممكن", "ابي اعرف", "ابغى اعرف", "ابغي اعرف", "نفسي اعرف", "سؤال", "اسالك", "علميني", "علمينا", "قوليلي", "قولي لي", "انصحيني", "تنصحيني", "شنو"]
FEMALE = ["انا بنت", "انا وحده", "معجبه", "مهتمه", "متابعه", "حابه", "نايمه", "عاشقه", "مدمنه", "فرحانه", "زعلانه", "انا سعوديه", "انا مصريه", "انا عراقيه", "انا كويتيه", "انا اماراتيه", "انا جزائريه", "انا مغربيه", "انا اردنيه", "انا سوريه", "انا فلسطينيه", "انا يمنيه", "انا ليبيه", "انا تونسيه", "انا قطريه", "انا عمانيه", "انا بحرينيه", "متحمسه", "مشتاقه", "خايفه", "ابنتي", "بنوته"]

def topics_of(t):
    return [k for k, ws in TOPICS.items() if any(w in t for w in ws)]

# ---------- 자동완성 ----------
ac = list(csv.DictReader(open(os.path.join(D, "autocomplete_raw.csv"), encoding="utf-8")))
NOISE = ["كريات", "الكريات"]
agg = collections.defaultdict(lambda: {"score": 0, "countries": set(), "sources": set(), "hits": 0})
for r in ac:
    s = norm(r["suggestion"])
    if any(n in s for n in NOISE) and "كوري" not in s: continue
    if norm(r["query"]) == s: continue                      # 입력어 자체는 제외
    a = agg[s]; a["score"] += 11 - int(r["rank"]); a["hits"] += 1
    a["countries"].add(r["country"]); a["sources"].add(r["source"])
ac_rows = sorted(({"suggestion": k, "score": v["score"], "hits": v["hits"], "countries": ",".join(sorted(v["countries"])),
                   "sources": ",".join(sorted(v["sources"])), "topics": "|".join(topics_of(k))} for k, v in agg.items()),
                 key=lambda x: -x["score"])
with open(os.path.join(D, "autocomplete_ranked.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=list(ac_rows[0].keys())); w.writeheader(); w.writerows(ac_rows)
ac_topic = collections.Counter(); ac_topic_score = collections.Counter()
for r in ac_rows:
    for t in (r["topics"].split("|") if r["topics"] else ["기타"]):
        ac_topic[t] += 1; ac_topic_score[t] += r["score"]

# ---------- 유튜브 댓글 ----------
def likes(x):
    x = str(x).replace(",", "").strip()
    m = re.match(r"([\d.]+)\s*([KkMm]|ألف|الف|مليون)?", x)
    if not m: return 0
    n = float(m.group(1)); u = (m.group(2) or "").lower()
    return int(n * (1000 if u in ("k", "ألف", "الف") else 1_000_000 if u in ("m", "مليون") else 1))

cm = [json.loads(l) for l in open(os.path.join(D, "youtube_comments_raw.jsonl"), encoding="utf-8")]
ar = [c for c in cm if len(AR.findall(c["text"])) >= max(3, 0.4 * len(re.sub(r"\s", "", c["text"])))]
out = []
for c in ar:
    t = norm(c["text"])
    q = any(w in t for w in QWORDS) or any(w in c["text"] for w in ["؟", "?"])
    fem = any(w in t for w in FEMALE)
    out.append({"group": c["group"], "video": c["video"], "likes": likes(c["likes"]), "is_question": q, "female_marker": fem,
                "topics": "|".join(topics_of(t)), "text": c["text"].replace("\n", " ")})
with open(os.path.join(D, "youtube_comments_tagged.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=list(out[0].keys())); w.writeheader(); w.writerows(out)

def topic_table(rows):
    cnt, lk = collections.Counter(), collections.Counter()
    for r in rows:
        for t in (r["topics"].split("|") if r["topics"] else ["기타"]):
            cnt[t] += 1; lk[t] += r["likes"]
    return cnt, lk

qs = [r for r in out if r["is_question"]]
summary = {
    "autocomplete": {"raw_rows": len(ac), "unique_suggestions": len(ac_rows),
                     "topic_count": ac_topic.most_common(), "topic_score": ac_topic_score.most_common()},
    "youtube": {"comments_total": len(cm), "arabic": len(ar), "questions": len(qs),
                "female_marked": sum(r["female_marker"] for r in out),
                "female_marked_questions": sum(r["female_marker"] for r in qs),
                "videos": len({c['video'] for c in cm})},
}
for name, rows in [("all_arabic", out), ("questions", qs), ("female_marked", [r for r in out if r["female_marker"]])]:
    c, l = topic_table(rows)
    summary["youtube"][f"topics_{name}"] = [(k, c[k], l[k]) for k, _ in c.most_common()]
json.dump(summary, open(os.path.join(D, "summary.json"), "w"), ensure_ascii=False, indent=1)
print(json.dumps(summary, ensure_ascii=False, indent=1))
