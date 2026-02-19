# 01. GitHub Pages 배포

## 1) Pages 설정
GitHub 저장소 → **Settings → Pages**
- Source: **GitHub Actions** 선택

## 2) Workflow 확인
- `.github/workflows/deploy.yml` 사용
- `main` 브랜치 push 또는 수동 실행(`workflow_dispatch`) 시 배포

## 3) 배포 확인
1. Actions 탭에서 workflow 성공 확인
2. Pages URL 접속 후 화면 확인

## 참고
- 빌드 결과물은 `dist`
- Vite base 경로는 `vite.config.js`에서 저장소명 기준으로 자동 처리
