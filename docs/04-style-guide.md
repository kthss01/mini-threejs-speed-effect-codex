# 04. 스타일 가이드

## 코드 스타일
- JavaScript (ESM) 사용
- 함수/변수명은 의미 있게(영문 권장)
- 상수는 대문자 스네이크: `MAX_SPEED`

## 성능/그래픽 기본
- requestAnimationFrame 루프는 하나로 유지
- 매 프레임 생성되는 객체 최소화(가비지 줄이기)
- 텍스처/지오메트리 dispose 고려

## 씬 구성 컨벤션(권장)
- `core/` : renderer/scene/camera/loop 등 엔진 코어
- `world/`: 도로/환경 오브젝트/배경
- `effects/`: 속도선, 파티클, 후처리, 셰이더
- `utils/`: 수학/보간/난수 등 유틸
