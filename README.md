# ThreeJS Speed Effect

Three.js로 3D 환경에서 **전진 이동 시 주변 환경이 빠르게 지나가며 속도감이 느껴지는** 시네마틱 연출을 구현하는 프로젝트입니다.

## 목표
- 자동차/자전거/오토바이처럼 **앞으로 나아갈 때**:
  - 주변 오브젝트의 **패럴랙스(Parallax)**
  - **모션 블러 느낌**(셰이더/후처리)
  - **스피드 라인 / 파티클**
  - **FOV 변화(가속감)**, **카메라 쉐이크(미세)**
  - 조명/안개/색보정으로 **시네마틱 톤**

## 실행
```bash
npm install
npm run dev
```

## 문서
- [00-setup](./docs/00-setup.md)
- [01-deploy-github-pages](./docs/01-deploy-github-pages.md)
- [02-dev-workflow](./docs/02-dev-workflow.md)
- [03-codex-guide](./docs/03-codex-guide.md)
- [04-style-guide](./docs/04-style-guide.md)
- [05-work-log](./docs/05-work-log.md)

## 현재 준비 상태
- Vite + Three.js 실행 구조 준비
- 기본 데모 씬(도로/속도선/FOV 반응) 포함
- GitHub Actions 기반 GitHub Pages 배포 워크플로우 포함
