// Copy and arithmetic inputs for the educational 3D package explorer.
// Dimensions, connection counts and selectable combinations are illustrative.
export const PARTS = {
  gpu: {
    title: 'GPU · 연산 다이',
    kicker: 'COMPUTE / 데이터의 사용자',
    description: '모델의 연산을 수행하는 칩입니다. 캐시에 없는 데이터는 메모리 컨트롤러와 PHY를 거쳐 HBM에서 가져옵니다. 넓은 대역폭은 데이터 공급을 돕지만, 연산량·접근 패턴·데이터 재사용도 성능을 결정합니다.',
    question: 'HBM 대역폭이 충분해도 GPU 연산이 느릴 수 있는 이유는 무엇일까요?'
  },
  dram: {
    title: 'DRAM · 데이터 저장 다이',
    kicker: 'STORAGE / 적층 수와 용량',
    description: '트랜지스터와 커패시터로 데이터를 저장하는 층입니다. 이 모델은 다이당 24 Gb, 즉 3 GB를 가정합니다. 8-Hi와 12-Hi는 DRAM 다이 수를 뜻하며, 베이스 다이는 이 적층 수에 포함하지 않습니다.',
    question: '핀 속도와 버스 폭을 유지하고 8-Hi를 12-Hi로 바꾸면 어떤 수치가 늘어날까요?'
  },
  base: {
    title: '베이스 다이 · 스택의 연결 기반',
    kicker: 'BASE / 연결과 인터페이스',
    description: 'DRAM 스택 아래에서 상부 다이와 패키지 사이의 신호·전원 연결 및 인터페이스 기능을 제공합니다. 세대와 제품 설계에 따라 역할이 달라집니다. 모든 메모리 제어 기능이 이 다이에 들어 있다고 단정하면 안 됩니다.',
    question: '스택의 베이스 다이와 GPU 쪽 메모리 컨트롤러는 어떤 점에서 구분해야 할까요?'
  },
  tsv: {
    title: 'TSV · 실리콘을 관통하는 연결',
    kicker: 'VERTICAL / 다이 내부의 수직 길',
    description: '실리콘을 관통해 수직 방향으로 전기 신호를 연결하는 구조입니다. 그림의 TSV는 HBM 스택 내부의 대표 경로를 보여줍니다. 실제 개수·치수·배치는 생략했으며, 다이 사이 접합과 패키지의 수평 배선은 별도 구조입니다.',
    question: '다이 내부를 관통하는 TSV와 두 다이 사이의 접합부를 각각 찾아보세요.'
  },
  bump: {
    title: '다이 사이 접합 · 층을 잇는 경계',
    kicker: 'BOND / 마이크로범프와 하이브리드',
    description: '마이크로범프는 다이 사이를 잇는 미세 금속 접합부입니다. 하이브리드 본딩은 금속과 주변 절연층의 접합을 함께 활용합니다. 두 모드는 구조를 비교하는 가상 선택이며, 같은 세대·적층 수의 모든 제품이 이 방식을 쓴다는 뜻은 아닙니다.',
    question: '접합 방식을 바꿨다는 사실만으로 용량이나 대역폭이 자동 증가할까요?'
  },
  interposer: {
    title: '인터포저 · 칩 사이의 배선',
    kicker: 'HORIZONTAL / 패키지 안의 넓은 길',
    description: 'GPU와 HBM 사이의 많은 연결을 패키지 안에서 이어 주는 중간 배선 구조입니다. 실리콘, RDL, 로컬 실리콘 연결 등 구현이 다릅니다. 이 모델은 배선 역할을 단순화했으며 특정 CoWoS 제품의 단면을 재현하지 않습니다.',
    question: 'HBM 스택의 3D 적층과 인터포저 위의 2.5D 배치는 어떻게 함께 존재할까요?'
  },
  substrate: {
    title: '패키지 기판 · 시스템과의 연결',
    kicker: 'SUBSTRATE / 지지와 외부 연결',
    description: '인터포저와 칩들을 지지하고 패키지의 전원·신호를 시스템 보드 쪽으로 연결하는 기반입니다. HBM 셀을 저장하는 층이 아니며, 인터포저와도 구분합니다. 실제 기판의 다층 배선과 외부 접합 구조는 이 그림에서 생략했습니다.',
    question: 'DRAM 다이, 인터포저, 패키지 기판 중 데이터를 저장하는 부품은 무엇일까요?'
  }
};

export const GENERATIONS = {
  hbm3e: {
    label: 'HBM3E · 산술 예제',
    width: 1024,
    speed: 9.6,
    notes: '1024 bit × 9.6 Gbit/s를 사용하는 비교 예제입니다. 9.6 Gbit/s는 모든 HBM3E 제품의 보장 속도나 JEDEC 공통 상한을 뜻하지 않습니다.'
  },
  hbm4: {
    label: 'HBM4 · 표준 기준 비교',
    width: 2048,
    speed: 8,
    notes: '2048 bit × 8 Gbit/s를 사용하는 비교 예제입니다. 8 Gbit/s는 표준 기준 비교값이며, 제조사가 공개한 더 높은 속도 제품의 최고 성능을 나타내지 않습니다.'
  }
};

export const MODEL_ASSUMPTIONS = {
  dieDensityGb: 24,
  dieCapacityGB: 3,
  stackCount: 4,
  gbPerTb: 1000,
  capacityNote: '다이당 24 Gb ÷ 8 = 3 GB, 동일한 용량의 HBM 스택 4개를 가정합니다. 표시 용량은 산술 합계이며 GPU가 실제로 제공하는 사용 가능 용량과 다를 수 있습니다.',
  bandwidthNote: '이론 GB/s = 데이터 폭(bit) × 핀 전송률(Gbit/s) ÷ 8. 핀 전송률에 DDR 계수를 다시 곱하지 않습니다. 전체 대역폭은 4개 스택의 이론 합계이며 실측 지속 대역폭이 아닙니다.',
  layersNote: '4·8·12·16-Hi는 구조를 비교하기 위한 선택입니다. 특히 16-Hi를 포함한 모든 세대·접합 조합이 실제 제품으로 존재하거나 검증됐다는 뜻은 아닙니다.',
  bondingNote: '하이브리드 본딩은 가상 구조 비교입니다. HBM4가 이를 의무적으로 사용한다는 뜻은 아니며, 제품별 접합 공정은 제조사 자료로 확인해야 합니다.',
  geometryNote: '펼침 간격은 부품을 관찰하기 위한 상대 표시입니다. 다이 두께·범프 피치·스택 높이·TSV 개수는 실제 비율이 아니며 제품 규격의 합격 여부를 판정하지 않습니다.',
  flowNote: '움직이는 점은 대표 데이터 경로의 논리 표시입니다. 점의 개수와 이동 속도는 실제 I/O 수, 처리량 또는 지연시간을 나타내지 않습니다.'
};

export const INTERPRETATION = [
  {
    title: '층을 늘리면 우선 용량이 늘어납니다',
    description: '다이당 용량이 같으면 8-Hi 24 GB → 12-Hi 36 GB로 1.5배가 됩니다. 같은 폭·핀 속도에서 스택 대역폭은 그대로입니다. 4개 스택의 용량은 96 GB → 144 GB입니다.'
  },
  {
    title: '세대 비교는 폭과 속도를 함께 봅니다',
    description: '이 예제의 스택당 이론값은 HBM3E 1228.8 GB/s, HBM4 2048 GB/s입니다. 폭은 2배지만 선택한 핀 속도가 9.6 → 8 Gbit/s로 달라져 대역폭 비는 약 1.67배입니다.'
  },
  {
    title: '펼침과 접합 선택은 관찰을 위한 변화입니다',
    description: '펼침은 층을 보기 위한 화면 간격이고, 접합 선택은 경계 구조 비교입니다. 어느 조작도 계산기의 폭·속도·다이당 용량을 바꾸지 않으므로 표시 용량과 대역폭은 자동으로 증가하지 않습니다.'
  }
];

export const SOURCES = [
  {
    title: 'Synopsys · HBM3 PHY 인터페이스',
    url: 'https://www.synopsys.com/designware-ip/interface-ip/hbm/hbm3-phy.html',
    supports: '1024 bit, 16개 64-bit 채널, 최대 32개 32-bit 의사채널과 9.6 Gbit/s까지의 PHY 지원 예시. PHY 지원 속도는 모든 DRAM 제품의 보장 속도와 구분합니다.'
  },
  {
    title: 'SK hynix · HBM4의 폭·속도·접합 공정',
    url: 'https://news.skhynix.com/en/sk-hynix-completes-worlds-first-hbm4-development-and-readies-mass-production/',
    supports: '2048 I/O, 표준 기준 8 Gbit/s와 더 높은 제품 속도의 구분, 해당 HBM4 제품의 Advanced MR-MUF 적용. HBM4 전체가 하이브리드 본딩을 쓴다고 일반화하지 않습니다.'
  },
  {
    title: 'TSMC · CoWoS와 인터포저의 역할',
    url: 'https://3dfabric.tsmc.com/english/dedicatedFoundry/technology/cowos.htm',
    supports: 'SoC와 HBM의 2.5D 통합, 실리콘·RDL·로컬 실리콘 연결 등 패키징 구현의 차이. 본 3D 모델은 특정 CoWoS 설계의 실물 치수나 단면도가 아닙니다.'
  }
];
