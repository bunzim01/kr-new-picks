# 유튜브 공개 댓글 수집기 (유튜브 웹 앱 내부 데이터 경로 사용, 로그인·API 키 불필요)
# 사용: python3 yt_comments.py <영상ID> [최대댓글수]  → JSON 줄 단위 출력
import json, sys, urllib.request

API = "https://www.youtube.com/youtubei/v1/next?prettyPrint=false"
CTX = {"client": {"clientName": "WEB", "clientVersion": "2.20260801.00.00", "hl": "ar", "gl": "SA"}}

def post(body):
    req = urllib.request.Request(API, data=json.dumps(body).encode(), headers={
        "Content-Type": "application/json", "User-Agent": "Mozilla/5.0", "X-Youtube-Client-Name": "1",
        "X-Youtube-Client-Version": CTX["client"]["clientVersion"]})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())

def walk(o):
    if isinstance(o, dict):
        yield o
        for v in o.values(): yield from walk(v)
    elif isinstance(o, list):
        for v in o: yield from walk(v)

def first_comment_token(data):
    # 댓글 영역의 이어받기 토큰 찾기
    for d in walk(data):
        if d.get("sectionIdentifier") == "comment-item-section" or d.get("targetId") == "comments-section":
            for x in walk(d):
                tok = x.get("continuationCommand", {}).get("token")
                if tok: return tok
    for d in walk(data):
        if d.get("panelIdentifier") == "engagement-panel-comments-section":
            for x in walk(d):
                tok = x.get("continuationCommand", {}).get("token")
                if tok: return tok
    return None

def parse(resp):
    comments, nxt = [], None
    for d in walk(resp):
        p = d.get("commentEntityPayload")
        if p:
            props = p.get("properties", {})
            tb = p.get("toolbar", {})
            comments.append({
                "id": props.get("commentId"),
                "text": props.get("content", {}).get("content", ""),
                "likes": tb.get("likeCountNotliked") or tb.get("likeCountA11y") or "0",
                "replies": tb.get("replyCount") or "0",
                "is_reply": "." in (props.get("commentId") or ""),
            })
    # 다음 페이지 토큰 (답글 펼치기 버튼 토큰은 제외)
    for d in walk(resp):
        cir = d.get("continuationItemRenderer")
        if cir:
            for x in walk(cir):
                tok = x.get("continuationCommand", {}).get("token")
                if tok and "button" not in json.dumps(cir)[:200]:
                    nxt = tok
    return comments, nxt

def main():
    vid = sys.argv[1]; limit = int(sys.argv[2]) if len(sys.argv) > 2 else 300
    data = post({"context": CTX, "videoId": vid})
    tok = first_comment_token(data)
    seen, out = set(), 0
    pages = 0
    while tok and out < limit and pages < 40:
        resp = post({"context": CTX, "continuation": tok})
        cs, tok = parse(resp)
        pages += 1
        new = 0
        for c in cs:
            if c["id"] in seen or c["is_reply"]: continue
            seen.add(c["id"]); new += 1; out += 1
            c["video"] = vid
            print(json.dumps(c, ensure_ascii=False), flush=True)
        if new == 0: break

if __name__ == "__main__":
    main()
