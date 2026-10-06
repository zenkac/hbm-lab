# HBM Lab

HBM 업무 신입사원용 한국어 인터랙티브 교과서. 순수 HTML/CSS/JavaScript, 빌드 및 로그인 불필요.

- 8개 챕터, 11개 실험, 6문항 퀴즈, 12개 용어 카드
- SVG 도해: 적층/TSV, 명령 타임라인, 뱅크 큐, Roofline, 패키징, 정렬, 열, 수율
- 진도와 테마는 이 브라우저의 localStorage에만 저장
- 시뮬레이션 가정과 출처는 페이지에 표시. 제품 설계/합격 판단 도구가 아님

## 실행

`node preview.mjs` → http://127.0.0.1:5180

## GitHub Pages

저장소 `zenkac/hbm-lab`의 Settings → Pages → Source는 Deploy from a branch, Branch는 main / (root)로 지정합니다. 모든 자산은 상대 경로라 프로젝트 Pages와 AWS 하위 경로에서 동일하게 동작합니다. 로컬에는 GitHub Actions용 워크플로도 준비되어 있습니다.

기존 SOLO 홈페이지는 `/hbm/index.html`로 연결합니다. 배포 시 게임 서버·DB를 교체할 필요가 없습니다.

학습 흐름 참고: https://memorybook.euiyun.com/ . 콘텐츠와 도해, 코드는 새로 작성했습니다.
