# 폰트 페어링 (font-pairing-seqc)

> 이 폴더는 [Sequence-st/font-pairing-skill](https://github.com/Sequence-st/font-pairing-skill) v1.0(MIT)을 가져와 **LIKEWAY가 일본어 폰트 24개·짝 16개·규칙 6개를 더한 수정본**이에요. 원본 저작권 고지는 `LICENSE`, 바뀐 것은 `CHANGELOG.md`.

분위기만 말하면 **상업적으로 써도 되는 무료 폰트**로 한글·영어 폰트 짝을 골라 주는 클로드 스킬이에요. by @sequence_ai

## 설치

- **Claude Code**: 이 폴더(`font-pairing-seqc`)를 통째로 `~/.claude/skills/` 안에 넣어요.
- **Claude 앱(claude.ai)**: 설정 → 기능(Capabilities) → 스킬에서 이 zip을 올려요.

## 쓰는 법

- 「차분한 전시 포스터에 어울리는 폰트 짝 골라줘」
- 「이 카드뉴스 폰트 페어링해줘」
- 「한글+한글로 귀여운 조합 3개만」
- 「일본 라이브 썸네일용 일본어 폰트 짝 골라줘」
- 「한일 병기 제안서 폰트 맞춰줘」

스킬이 고른 짝으로 미리보기를 만들고, 설치 링크와 라이선스를 같이 알려 줘요.

## 폰트는 직접 설치해요

이 스킬에는 **폰트 파일이 들어 있지 않아요.** 목록의 설치 링크(눈누 · 구글 폰트)에서 받으세요.

## 라이선스

담긴 폰트 54개(한글 30 · 영어 24)는 2026-10-20에 라이선스를 하나씩 확인했어요. 모두 상업 이용이 가능한 무료 폰트예요.
- 영어: 구글 폰트 공식 라이선스 파일(OFL · Apache)
- 한글: 눈누 사용 범위 6칸 모두 가능

라이선스는 바뀔 수 있어요. 큰 상업 작업 전에는 설치 링크의 원문을 한 번 더 확인하세요. 자세한 건 `references/license.md`.

## 법적 고지

이 스킬은 폰트를 배포하지 않아요. 공식 배포처 링크와 공식 웹폰트 주소만 안내해요. 폰트의 권리는 각 저작권자에게 있고, 라이선스 정리는 참고 정보예요(법률 자문 아님). 자세한 건 `references/license.md`의 「법적 고지」.

## 미리보기 예시
`examples/preview_sample.html`(.jpg)은 아래 명령으로 만든 거예요.
```bash
python3 scripts/preview.py --title Gloock --point "DM Mono" --body 프리텐다드 --head "find your|T:perfect|T:pair." --hl perfect --psize 96 --text "두 폰트, 한 분위기"
```
