# 05. 작업 로그

> 목적: Codex 및 팀원의 작업 이력을 문서로 누적 관리합니다.
> 작성 원칙: 최신 항목이 위로 오도록 기록합니다.

## 템플릿
- 날짜: YYYY-MM-DD
- 작업 제목: 
- 변경 파일:
  - `path/to/file`
- 검증 명령:
  - `npm run build` (성공/실패)
- 비고:
  - 후속 작업 또는 참고 사항

---

## 2026-02-19
- 작업 제목: SpeedController 분리 및 3단 패럴랙스 환경 풀링 연결
- 변경 파일:
  - `src/main.ts`
  - `src/config.ts`
  - `src/core/speedController.ts`
  - `src/world/groundPool.ts`
  - `src/world/environmentManager.ts`
  - `docs/05-work-log.md`
- 검증 명령:
  - `npm run build` (성공)
- 비고:
  - near/mid/far 레이어별 배율을 `parallaxLayers`와 동기화해 가속/감속 시 계층감이 유지되도록 조정
  - 카메라 FOV 및 미세 흔들림을 속도 정규화 값에 연동

## 2026-02-19
- 작업 제목: Codex 커밋/PR 규칙 및 작업 로그 정책 문서화
- 변경 파일:
  - `docs/03-codex-guide.md`
  - `docs/05-work-log.md`
  - `README.md`
- 검증 명령:
  - `npm run build` (성공)
- 비고:
  - 이후 변경 작업마다 본 문서에 동일 형식으로 누적 기록 필요
