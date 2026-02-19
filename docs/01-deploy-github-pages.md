# 01. GitHub Pages 배포

## 1) GitHub Pages 설정
GitHub 저장소 → **Settings → Pages**
- **Build and deployment / Source**: `GitHub Actions` 선택

## 2) Workflow 동작 조건
- `.github/workflows/deploy.yml` 사용
- `main` 브랜치에 push되면 자동 배포
- Actions 탭에서 `workflow_dispatch`로 수동 실행 가능

## 3) Workflow 구성
- Node 20 환경 구성
- 의존성 설치 후 `npm run build` 실행
- `dist` 결과물을 Pages artifact로 업로드
- `actions/deploy-pages`로 배포

## 4) 배포 확인
1. Actions 탭에서 `Deploy to GitHub Pages` workflow 성공 확인
2. 완료 후 표시되는 Pages URL 접속

## 참고
- Vite base 경로는 `vite.config.js`에서 `GITHUB_REPOSITORY` 기준으로 자동 처리
- 프로젝트 URL은 보통 `https://<github-id>.github.io/<repo-name>/`
