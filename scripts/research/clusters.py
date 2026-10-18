# 자동완성 검색어를 콘텐츠 주제 묶음으로 모아 점수 합산 (점수 = 나라·출처별 노출 순위 점수의 합)
import csv, json, sys, collections
D = sys.argv[1]
rows = list(csv.DictReader(open(D + "/autocomplete_ranked.csv", encoding="utf-8")))
NOISE = ["الجهراء", "الكويت", "صور", "خلفيات", "العيدان", "يابان", "صين", "الكوريات الكوريات", "الكوريات كوريات", "كوريات كوريات", "تزرب"]
CL = {
    "피부 비결·루틴·세안": ["بشره", "روتين", "تعتني", "تنظيف", "ماسك", "نقاء", "نضاره", "لمعان", "لمعه", "صافيه", "سكن كير"],
    "몸매·날씬함·다이어트": ["نحاف", "نحيف", "رشاق", "دايت", "رجيم", "جسم", "اجسام", "خصر", "وزن", "ضعف", "انحف"],
    "헤어·앞머리": ["شعر", "غره", "تسريحه"],
    "하얀 피부(미백)": ["بياض", "تبييض", "بيضاء", "بيض "],
    "메이크업": ["مكياج", "عيون", "شفايف", "حواجب", "ميكب"],
    "민낯·진짜 모습": ["بدون مكياج", "قبل وبعد", "حقيقه", "الحقيقيه"],
    "닮고 싶다(어떻게 하면)": ["كيف اصبح", "كيف اصير", "اشبه", "مثل الكوريات", "زي الكوريات", "مثل الكوريين"],
    "패션·옷": ["يلبسون", "فساتين", "لبس", "ملابس", "ستايل", "فستان"],
    "키·체형": ["طول", "طويلات", "قصيرات"],
    "음식·식습관": ["ياكل", "اندومي", "اكل"],
    "미모 일반": ["جمال", "جميلات", "الحلوات", "حلوات"],
    "아랍어 하는 한국인": ["تتكلم", "تتحدث", "عربي"],
    "제품": ["منتجات", "منتج"],
}
score, cnt, ex = collections.Counter(), collections.Counter(), collections.defaultdict(list)
total = 0
for r in rows:
    s = r["suggestion"]
    if any(n in s for n in NOISE): continue
    sc = int(r["score"]); total += sc
    for k, ws in CL.items():
        if any(w in s for w in ws):
            score[k] += sc; cnt[k] += 1
            if len(ex[k]) < 6: ex[k].append(s)
res = [{"cluster": k, "score": score[k], "share_pct": round(100 * score[k] / total, 1), "suggestions": cnt[k], "examples": ex[k]} for k, _ in score.most_common()]
json.dump({"total_score": total, "clusters": res}, open(D + "/autocomplete_clusters.json", "w"), ensure_ascii=False, indent=1)
for x in res: print(f"{x['cluster']}\t{x['score']}\t{x['share_pct']}%\t{x['suggestions']}\t{' / '.join(x['examples'][:4])}")
