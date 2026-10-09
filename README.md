# HBM Lab

HBM 업무 신입사원용 한국어 인터랙티브 교과서. 순수 HTML/CSS/JavaScript, 빌드 및 로그인 불필요.

- 18개 챕터, 26개 실험, 20문항 퀴즈, 36개 용어 카드
- WebGL 3D 패키지 탐색기: 드래그 회전·확대, 4/8/12/16-Hi, HBM3E/HBM4 비교, 층 분해, 스택 확대, 부품 선택, TSV·접합·데이터 흐름. 소개 화면에도 3D 모델 적용
- SVG 도해: 적층/TSV, 명령 타임라인, 뱅크 큐, Roofline, 패키징, 정렬, 열, 수율
- 새 심화 실험: 주소 매핑, 버스트·동시 요청, 리프레시·retention, 아이 다이어그램, GPU 패킷 경로·캐시 재사용, March 테스트·spare-row 리페어, SECDED, 불량 지도, 휨·가상 수명, 종합 설계 미션
- 각 장에 상세 개념 설명·계산 예제·실무 판독 체크·공개 원문 링크 포함
- 진도와 테마는 이 브라우저의 localStorage에만 저장
- 시뮬레이션 가정과 출처는 페이지에 표시. 제품 설계/합격 판단 도구가 아님
- 3D 모델은 Three.js 0.180.0을 로컬 `vendor/`에서 로드하며 MIT 라이선스를 동봉합니다. WebGL을 사용할 수 없으면 기존 SVG 도해로 전환합니다. 보이지 않는 모델은 렌더링을 멈추고, 움직임 감소 설정을 따릅니다.

## 실행

`node preview.mjs` → http://127.0.0.1:5180

## GitHub Pages

저장소 `zenkac/hbm-lab`의 Settings → Pages → Source는 Deploy from a branch, Branch는 main / (root)로 지정합니다. 모든 자산은 상대 경로라 프로젝트 Pages와 AWS 하위 경로에서 동일하게 동작합니다. 로컬에는 GitHub Actions용 워크플로도 준비되어 있습니다.

기존 SOLO 홈페이지는 `/hbm/index.html`로 연결합니다. 배포 시 게임 서버·DB를 교체할 필요가 없습니다.

학습 흐름 참고: https://memorybook.euiyun.com/ . 콘텐츠와 도해, 코드는 새로 작성했습니다.
