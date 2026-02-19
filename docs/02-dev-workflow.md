# 02. 개발 워크플로우

## 브랜치 전략(간단)
- `main`: 항상 배포 가능한 상태 유지
- 작업 브랜치: `feature/...`, `fix/...`, `chore/...`, `docs/...`

예:
- `feature/speedlines`
- `fix/camera-jitter`
- `docs/setup-guide`

## 작업 흐름
1) 이슈 생성(권장)
2) 작업 브랜치 생성
3) 커밋(규칙 준수)
4) PR 생성(템플릿 준수)
5) 리뷰/수정 후 `main` 머지

## 로컬 실행 체크리스트
- `npm run dev` 동작
- `npm run build` 성공
- 주요 효과(속도감 연출) 데모 씬에서 확인
