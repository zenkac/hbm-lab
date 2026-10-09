'use strict';

// The examples in this module are deliberately inspectable teaching models.
// They do not represent a vendor's memory layout, test program, or qualification limits.
window.HBMExtensions = window.HBMExtensions || [];
window.HBMExtensions.push({
  chapters: [
    ['testing', '테스트·BIST·리페어', '검출하는 것과 고치는 것은 다르다', '메모리 테스트는 어떤 주소에 어떤 데이터를 쓰고, 어떤 순서와 조건에서 읽을지 설계하는 일입니다. 불량을 찾아내는 BIST, 여분 자원을 배정하는 리페어, 적층 이후의 검증을 연결해 보세요.'],
    ['errors', 'ECC·오류 정정', '오류 하나를 찾아낼 정보는 어디에 있을까?', '데이터에 검사 비트를 더하면 정해진 범위 안에서 오류 위치를 추론할 수 있습니다. 하지만 검출, 정정, 물리적 리페어는 서로 다른 기능입니다. 코드워드의 비트를 직접 뒤집어 그 차이를 관찰합니다.'],
    ['failure', '불량 지도·원인 분석', '분포는 원인 가설의 시작이다', '같은 불량률도 산발적인 분포, 가장자리 집중, 줄무늬, 국부 군집으로 나타날 수 있습니다. 위치와 조건을 함께 읽되, 지도만 보고 공정 원인을 확정하지 않는 분석 습관을 익힙니다.'],
    ['mechanics', '박막화·휨·접합 신뢰성', '얇아진 다이는 기계적으로도 달라진다', '박막화는 적층 높이와 TSV 노출을 돕지만 취급 강성, 휨, 크랙, 접합 조건을 함께 바꿉니다. 재료의 열팽창 차이와 반복 열사이클을 시각적으로 연결해 보세요.']
  ],
  init(api) {
    const { $, num, cards, range, select, result, lab, wire, v, read, svg } = api;
    const green = '#087265', softGreen = '#a4d2b5', orange = '#c45c32', yellow = '#dab75c';
    const button = (id, label) => `<button type="button" class="preset" id="${id}">${label}</button>`;
    const controls = content => `<div class="advq-buttons">${content}</div>`;
    const detail = (title, body, open = false) => `<details class="advq-detail"${open ? ' open' : ''}><summary>${title}</summary>${body}</details>`;
    const source = (url, title) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${title} ↗</a>`;
    const sources = items => `<p class="small advq-sources">근거 자료: ${items.join(' · ')}</p>`;
    const checks = text => `<div class="task"><b>업무 판독 체크</b> ${text}</div>`;
    const style = document.createElement('style');
    style.id = 'advq-style';
    style.textContent = `
      .advq-buttons{display:flex;flex-wrap:wrap;gap:7px;margin:14px 0}.advq-buttons .preset{padding:8px 10px}
      .advq-detail{padding:16px 0;border-bottom:1px solid var(--line);font-size:14px}.advq-detail summary{cursor:pointer;font-weight:700;color:var(--green)}
      .advq-detail p{color:var(--muted);line-height:1.9}.advq-detail .formula{line-height:1.8}
      .advq-sources{color:var(--muted);line-height:2}.advq-sources a{text-underline-offset:3px}
      .advq-legend{font-size:12px;color:var(--muted);margin:10px 0;line-height:1.8}.advq-grid{display:grid;gap:4px}
      .advq-cell{min-width:0;min-height:38px;border:1px solid var(--line);background:var(--soft);color:var(--ink);border-radius:4px;padding:3px;font-size:14px;font-weight:700;line-height:1.35}
      .advq-cell small{display:block;font-size:9px;font-weight:400}.advq-cell.fault{border:2px dashed ${orange};background:color-mix(in srgb,var(--paper) 85%,${orange})}
      .advq-cell.detected,.advq-cell.failed{background:${orange};color:white;border-color:${orange}}.advq-cell.active{outline:3px solid var(--ink);outline-offset:1px}
      .advq-log{border:1px solid var(--line);background:var(--bg);padding:12px;font:12px/1.9 monospace;border-radius:5px;overflow-wrap:anywhere;margin-top:12px;min-height:94px}
      .advq-stages{display:flex;flex-wrap:wrap;gap:5px;font-size:11px;margin-bottom:12px}.advq-stages span{padding:4px 7px;background:var(--soft);border-radius:4px;color:var(--muted)}
      .advq-stages span.active{background:var(--green);color:var(--bg)}.advq-caption{font-size:12px;color:var(--muted);margin:8px 0}.advq-note{background:var(--soft);border-radius:6px;padding:12px;font-size:13px;line-height:1.8}
      .advq-repair-layout{display:grid;grid-template-columns:1fr 100px;gap:12px}.advq-repair-row{display:grid;grid-template-columns:29px repeat(8,1fr);gap:3px;margin:4px 0;align-items:center}
      .advq-repair-row b{font-size:11px}.advq-repair-row .advq-cell{min-height:24px;font-size:11px;padding:1px}.advq-repair-row.repaired{background:color-mix(in srgb,var(--soft) 65%,${softGreen});border-radius:4px}
      .advq-spare{border:1px solid var(--line);border-radius:5px;padding:8px;margin-bottom:8px;font-size:11px;background:var(--soft)}.advq-spare.assigned{border-color:var(--green);background:color-mix(in srgb,var(--soft) 70%,${softGreen})}
      .advq-bitrow{display:grid;grid-template-columns:repeat(8,1fr);gap:5px;margin:12px 0}.advq-bitrow .advq-cell{min-height:62px;font-size:20px}.advq-bitrow .parity{background:color-mix(in srgb,var(--soft) 70%,${yellow})}
      .advq-bitrow .flipped{border:2px solid ${orange};background:color-mix(in srgb,var(--paper) 70%,${orange})}.advq-bitrow .grouped{box-shadow:0 0 0 2px var(--green)}
      .advq-parities{display:grid;gap:6px;font:12px/1.6 monospace;padding:10px;border:1px solid var(--line);border-radius:5px;overflow-wrap:anywhere}.advq-parities .selected{color:var(--green);font-weight:700}
      .advq-wafer{display:grid;gap:2px;max-width:370px;margin:auto}.advq-wafer .advq-cell{aspect-ratio:1;min-height:0;min-width:0;padding:0;font-size:8px;border-radius:2px}
      .advq-wafer .void{visibility:hidden;aspect-ratio:1}.advq-mapbox{border:1px solid var(--line);padding:12px;border-radius:12px;background:var(--bg)}
      .advq-sample-grid{display:grid;grid-template-columns:repeat(10,1fr);gap:4px}.advq-sample-grid .advq-cell{min-height:24px;aspect-ratio:1;font-size:10px}
      .advq-quality-viz svg{max-height:none}.advq-quality-viz .advq-chart svg{max-height:230px}.advq-path{stroke:var(--ink);fill:none}.advq-status{font-size:13px;font-weight:700;margin:12px 0}
      @media(max-width:760px){.advq-cell{min-height:35px}.advq-bitrow{gap:3px}.advq-bitrow .advq-cell{font-size:17px;min-height:58px}.advq-repair-layout{grid-template-columns:1fr 78px;gap:7px}}
    `;
    document.head.appendChild(style);

    // 18 — a literal March C− sequence, operating on 64 one-bit addresses.
    $('body-testing').innerHTML = cards([
      ['테스트는 결함 모델에서 출발', 'Stuck-at은 0 또는 1에 고정되는 모델입니다. 전이 결함, 주소 디코더 결함, 결합 결함, retention 및 속도 의존 결함은 추가 자극과 조건이 필요합니다.'],
      ['MBIST · 스스로 읽고 비교', '내장 테스트 로직이 주소, 데이터, 명령을 만들고 기대값과 비교합니다. 한 패턴을 통과했다는 사실이 모든 동작 조건과 결함 모델의 커버리지를 뜻하지는 않습니다.'],
      ['BIRA와 리페어', '검출 위치를 바탕으로 여분 행·열 등의 자원을 배정합니다. 리페어 가능성은 결함 개수뿐 아니라 분포, 자원 구조, 배정 규칙에 달려 있습니다.']
    ]) + detail('검사 단계가 바뀌면 발견할 수 있는 결함도 바뀐다',
      '<p>웨이퍼 단계에서는 셀 어레이와 주변 회로의 기능 및 조건별 동작을 선별합니다. 적층 전 선별한 KGD도 실제 테스트 프로그램과 조건이 정한 범위의 양품입니다. 적층 후에는 다이 간 연결, 접합, 수직 경로에서 새로 생긴 결함을 확인해야 합니다.</p><p>최종 테스트의 fail bit map은 좌표 변환 정보와 함께 보관해야 합니다. 논리 주소, 물리 행·열, 뱅크, 다이, 채널은 같은 좌표계가 아닙니다. 스크램블링과 리던던시가 적용되면 논리 주소가 가리키는 물리 위치도 달라질 수 있습니다.</p><p>검출률을 비교할 때는 검사 온도, 전압, 데이터 패턴, 접근 순서, 속도, 반복 수를 고정하거나 그 차이를 명시합니다. 테스트 시간 감소와 커버리지 변화는 함께 평가해야 합니다.</p>') +
      lab('18', '64개 셀에 고장을 심고 March C−를 실행하세요',
        select('advq-fault-type', '셀 클릭으로 주입할 결함', [[0, 'Stuck-at-0'], [1, 'Stuck-at-1'], ['clear', '결함 제거']]) +
        controls(button('advq-march-step', '한 동작 →') + button('advq-march-phase', '현재 March 단계 끝까지') + button('advq-march-all', '전체 검사') + button('advq-march-reset', '검사 초기화')) +
        controls(button('advq-march-demo', '0·1 고정 결함 예시') + button('advq-march-clear', '모든 결함 제거')) + result('advq-march-read'),
        '1주소=1비트인 가상 어레이입니다. ↑/↓는 주소 증가/감소, r/w는 읽기/쓰기입니다. 정적 stuck-at 모델만 구현했으며 실제 HBM의 셀 구조, 병렬 테스트, 타이밍 및 결합 결함 커버리지를 재현하지 않습니다.',
        '셀 두 곳에 서로 다른 stuck-at을 심으세요. 쓰기는 진행되어도 실제 값이 바뀌지 않는 모습을 확인하고, 처음 읽기 불일치가 발생하는 단계를 찾아보세요.') +
      detail('March C− 기호를 명령으로 풀어 읽기',
        '<p>이 실험의 프로그램은 {↑(w0); ↑(r0,w1); ↑(r1,w0); ↓(r0,w1); ↓(r1,w0); ↑(r0)}입니다. 한 행이 아니라 한 주소를 기준으로 괄호 안의 동작을 순서대로 수행한 다음 다음 주소로 이동합니다. 첫 번째와 마지막 단계의 방향은 구현상 ↑로 표시했습니다.</p><div class="formula">주소당 동작 수 = 1 + 2 + 2 + 2 + 2 + 1 = 10<br>64주소 × 10동작 = 640개의 읽기·쓰기 동작</div><p>예: 주소 10이 stuck-at-0이면 w1은 의도값 1을 쓰지만 실제값은 0에 남습니다. 이후 r1에서 기대 1 / 관측 0으로 검출됩니다. 같은 주소가 여러 번 불일치하므로 불일치 이벤트 수와 결함 주소 수는 다른 통계입니다.</p>') +
      lab('19', '같은 3개 불량 비트도 리페어 결과가 다릅니다',
        range('advq-spares', '여분 행 개수', 0, 4, 2, 1, '개') + range('advq-address', '읽을 논리 행 주소', 0, 9, 2, 1, '') +
        select('advq-repair-view', '주소 변환 적용', [['on', '여분 행 배정 적용'], ['off', '원래 물리 행 접근']]) +
        controls(button('advq-repair-local', '3불량 · 2행 집중') + button('advq-repair-spread', '3불량 · 3행 분산') + button('advq-repair-clear', '불량 제거')) + result('advq-repair-read'),
        '10개 정상 주소 행과 최대 4개 여분 행으로 된 가상 어레이입니다. 불량 행 번호가 작은 순서로 여분 행을 배정하고, 여분 행은 무결함이라고 가정합니다. 실제 제품은 행/열 조합, 뱅크별 자원, eFuse/PPR 등 구현이 다르며 이 화면은 실제 HBM 리페어 방법을 지정하지 않습니다.',
        '불량 비트를 클릭해 추가하세요. 여분 행 2개에서 “2행 집중”과 “3행 분산”을 비교하고, 논리 행 주소를 움직여 어느 물리 행을 읽는지 확인해 보세요.') +
      detail('리페어 전후 성적표를 함께 남기기',
        '<p>리페어 전 fail bit map, 배정된 자원, 리페어 후 재검사 결과를 함께 기록해야 재현과 추적이 가능합니다. 리페어 후 기능 합격이어도 속도·전압·온도 마진과 신뢰성 조건이 자동으로 보장되지는 않습니다.</p><p>예: 불량 셀 3개가 행 2와 행 6에만 있으면 두 여분 행으로 모두 대체할 수 있습니다. 같은 3개가 행 1·4·8에 분산되면 이 행 전용 모델은 최소 세 여분 행이 필요합니다. “불량 비트 수가 같으니 리페어율도 같다”는 판단을 피하세요.</p>') +
      checks('① 불일치 이벤트인가, 고유 불량 주소인가? ② 리페어 전후 어느 좌표인가? ③ 검사 조건과 속도 등급은? ④ 여분 자원 소진 여부는? ⑤ 적층 후 연결 검사는 수행했는가?') +
      sources([source('https://www.siemens.com/en-gb/products/ic/tessent/test/memorybist/', 'Siemens MemoryBIST'), source('https://www.synopsys.com/implementation-and-signoff/test-automation/synopsys-ip-sms.html', 'Synopsys 메모리 테스트·리페어'), source('https://www.synopsys.com/solutions/silicon-lifecycle-management/structural-monitors/slm-ext-ram-ip.html', 'Synopsys DRAM 진단')]);

    const faults = Array(64).fill(null);
    let memory, program, cursor, detected, failEvents, marchLog, lastOp;
    const phaseDefs = [
      ['↑ w0', 1, ['w0']], ['↑ r0,w1', 1, ['r0', 'w1']], ['↑ r1,w0', 1, ['r1', 'w0']],
      ['↓ r0,w1', -1, ['r0', 'w1']], ['↓ r1,w0', -1, ['r1', 'w0']], ['↑ r0', 1, ['r0']]
    ];
    program = [];
    phaseDefs.forEach(([, direction, ops], phase) => {
      for (let j = 0; j < 64; j++) {
        const address = direction === 1 ? j : 63 - j;
        ops.forEach(op => program.push({ address, op, phase }));
      }
    });
    function resetMarch() {
      memory = faults.map(f => f === null ? 0 : f);
      cursor = 0; detected = new Set(); failEvents = 0; marchLog = []; lastOp = null;
      drawMarch();
    }
    function executeMarch() {
      if (cursor >= program.length) return;
      const p = program[cursor++], expected = Number(p.op[1]);
      if (p.op[0] === 'w') memory[p.address] = faults[p.address] === null ? expected : faults[p.address];
      const actual = memory[p.address], bad = p.op[0] === 'r' && actual !== expected;
      if (bad) { detected.add(p.address); failEvents++; }
      marchLog.unshift(`${String(cursor).padStart(3, '0')} · A${String(p.address).padStart(2, '0')} ${p.op} → ${actual}${bad ? ' · FAIL' : p.op[0] === 'r' ? ' · PASS' : ' · WRITE'}`);
      marchLog = marchLog.slice(0, 4); lastOp = p;
    }
    function drawMarch() {
      const activePhase = cursor < program.length ? program[cursor].phase : 5;
      $('viz-18').classList.add('advq-quality-viz');
      $('viz-18').innerHTML = `<div class="advq-stages">${phaseDefs.map(([name], i) => `<span class="${activePhase === i ? 'active' : ''}">${i + 1}. ${name}</span>`).join('')}</div><div class="advq-grid" style="grid-template-columns:repeat(8,1fr)">${memory.map((value, i) => `<button type="button" class="advq-cell ${faults[i] !== null ? 'fault' : ''} ${detected.has(i) ? 'detected' : ''} ${lastOp && lastOp.address === i ? 'active' : ''}" data-advq-march="${i}" aria-label="주소 ${i}, 값 ${value}, ${faults[i] === null ? '결함 없음' : 'stuck-at-' + faults[i]}, ${detected.has(i) ? '검출됨' : '아직 미검출'}">${value}<small>${i}${faults[i] !== null ? ' S' + faults[i] : ''}${detected.has(i) ? ' !' : ''}</small></button>`).join('')}</div><div class="advq-legend">S0 / S1: 주입한 고정 결함 · !: 읽기로 검출 · 진한 테두리: 마지막 접근 주소</div><div class="advq-log" role="log" aria-label="최근 메모리 테스트 동작">${marchLog.length ? marchLog.join('<br>') : '셀을 클릭해 결함을 추가한 뒤 한 동작씩 실행하세요.'}</div>`;
      $('viz-18').querySelectorAll('[data-advq-march]').forEach(b => b.onclick = () => {
        const i = Number(b.dataset.advqMarch), mode = $('advq-fault-type').value;
        faults[i] = mode === 'clear' ? null : Number(mode); resetMarch();
      });
      const injected = faults.filter(x => x !== null).length;
      read('advq-march-read', `${detected.size} / ${injected} 주소 검출`, `${cursor} / 640동작 · 읽기 불일치 ${failEvents}회 · ${cursor === 640 ? '검사 완료' : '다음: ' + phaseDefs[activePhase][0]}`);
      ['advq-march-step', 'advq-march-phase', 'advq-march-all'].forEach(id => $(id).disabled = cursor === 640);
    }
    $('advq-march-step').onclick = () => { executeMarch(); drawMarch(); };
    $('advq-march-phase').onclick = () => {
      if (cursor === program.length) return;
      const phase = program[cursor].phase;
      while (cursor < program.length && program[cursor].phase === phase) executeMarch();
      drawMarch();
    };
    $('advq-march-all').onclick = () => { while (cursor < program.length) executeMarch(); drawMarch(); };
    $('advq-march-reset').onclick = resetMarch;
    $('advq-march-demo').onclick = () => { faults.fill(null); faults[10] = 0; faults[45] = 1; resetMarch(); };
    $('advq-march-clear').onclick = () => { faults.fill(null); resetMarch(); };
    resetMarch();

    const repairFaults = new Set([2 * 8 + 1, 6 * 8 + 2, 6 * 8 + 5]);
    function drawRepair() {
      const faultyRows = [...new Set([...repairFaults].map(i => Math.floor(i / 8)))].sort((a, b) => a - b);
      const budget = v('advq-spares'), applied = $('advq-repair-view').value === 'on';
      const assigned = new Map(faultyRows.slice(0, budget).map((row, i) => [row, i]));
      const address = v('advq-address'), target = applied && assigned.has(address) ? 'S' + assigned.get(address) : 'R' + address;
      const uncovered = faultyRows.filter(row => !applied || !assigned.has(row));
      $('viz-19').classList.add('advq-quality-viz');
      $('viz-19').innerHTML = `<div class="advq-repair-layout"><div>${Array.from({ length: 10 }, (_, row) => `<div class="advq-repair-row ${applied && assigned.has(row) ? 'repaired' : ''}"><b>R${row}</b>${Array.from({ length: 8 }, (_, col) => {
        const index = row * 8 + col, bad = repairFaults.has(index);
        return `<button type="button" class="advq-cell ${bad ? 'failed' : ''} ${row === address ? 'active' : ''}" data-advq-repair="${index}" aria-label="물리 행 ${row}, 열 ${col}, ${bad ? '불량' : '정상'}, 클릭하여 변경">${bad ? '×' : '·'}</button>`;
      }).join('')}</div>`).join('')}</div><div>${Array.from({ length: budget }, (_, i) => {
        const row = faultyRows[i];
        return `<div class="advq-spare ${row !== undefined ? 'assigned' : ''}"><b>Spare S${i}</b><br>${row === undefined ? '미배정' : 'R' + row + ' 대체'}<br>정상 8bit</div>`;
      }).join('') || '<div class="advq-spare">여분 행 0개</div>'}</div></div><div class="advq-note">논리 주소 <b>R${address}</b> → 물리 주소 <b>${target}</b><br>${applied && assigned.has(address) ? '원래 행을 건너뛰고 여분 행에서 데이터를 읽습니다.' : '원래 물리 행에 접근합니다.'}</div><div class="advq-legend">×: 원래 물리 셀의 불량 · 녹색 행: 대체 행 배정 완료<br>리페어 후에도 원래 물리 셀의 결함 자체는 남아 있습니다.</div>`;
      $('viz-19').querySelectorAll('[data-advq-repair]').forEach(b => b.onclick = () => {
        const i = Number(b.dataset.advqRepair); repairFaults.has(i) ? repairFaults.delete(i) : repairFaults.add(i); drawRepair();
      });
      read('advq-repair-read', uncovered.length ? `미대체 ${uncovered.length}행` : '가상 어레이 접근 합격', `불량 ${repairFaults.size}bit / ${faultyRows.length}행 · 배정 ${assigned.size}/${budget}개 · ${applied ? '주소 변환 ON' : '주소 변환 OFF'}`);
    }
    wire(['advq-spares', 'advq-address', 'advq-repair-view'], drawRepair);
    $('advq-repair-local').onclick = () => { repairFaults.clear(); [17, 50, 53].forEach(i => repairFaults.add(i)); drawRepair(); };
    $('advq-repair-spread').onclick = () => { repairFaults.clear(); [9, 34, 69].forEach(i => repairFaults.add(i)); drawRepair(); };
    $('advq-repair-clear').onclick = () => { repairFaults.clear(); drawRepair(); };

    // 20 — exact extended Hamming (8,4), even parity, data at 3/5/6/7.
    $('body-errors').innerHTML = cards([
      ['검출과 정정의 차이', '검출은 받은 코드워드가 규칙을 위반함을 알아내는 일입니다. 정정은 추가 정보와 코드의 가정에 따라 원래 데이터를 복원하는 일입니다. “오류 검출”만으로 재전송 없이 계속 처리할 수 있는 것은 아닙니다.'],
      ['코드워드가 보호의 단위', '같은 두 오류라도 서로 다른 코드워드에 1개씩 있으면 각각 정정할 수 있고, 한 코드워드에 2개가 있으면 SECDED는 정정하지 못합니다. 오류 분포와 인터리빙을 함께 읽어야 합니다.'],
      ['보호 계층을 구분', 'HBM on-die ECC, 호스트 측 ECC, 링크의 패리티/검사 기능은 목적과 보호 범위가 다릅니다. 오류 보고 위치와 카운터의 집계 단위는 제품·컨트롤러 문서로 확인합니다.']
    ]) + detail('HBM 업무에서 ECC 카운터를 읽는 순서',
      '<p>정정 가능 오류가 보고되어도 메모리 셀의 물리 결함이 사라진 것은 아닙니다. 읽은 데이터를 정정했는지, 저장된 데이터까지 다시 썼는지, 해당 보호 계층의 scrub 정책이 무엇인지 구분합니다. 리페어는 결함 자원을 대체하는 별도 동작입니다.</p><p>오류 카운터는 대개 특정 경로와 집계 단위를 가집니다. 카운터 증가는 고유 불량 셀 증가와 같지 않을 수 있습니다. 주소·채널·다이·시간·온도·전압·부하·재현 패턴을 수집해야 반복적인 hard fault와 일시적인 관측을 구분할 근거가 생깁니다.</p><p>HBM3에서 호스트 ECC와 on-die ECC는 서로 다른 계층의 기능입니다. 아래 4bit 데이터/8bit 코드워드는 정정 논리를 작게 보여주기 위한 수학 예시로, HBM on-die ECC의 실제 코드, 오버헤드, 조직 또는 오류 심각도 규칙을 재현하지 않습니다.</p>') +
      lab('20', '비트를 뒤집어서 Hamming SECDED의 경계를 찾으세요',
        '<p class="small">원본 4bit 데이터 · 버튼을 누르면 인코딩이 바뀝니다.</p><div class="advq-buttons" id="advq-data-bits"></div>' +
        select('advq-ecc-group', '강조할 패리티 검사', [['all', '전체 검사'], [1, 'P1 · 위치 1,3,5,7'], [2, 'P2 · 위치 2,3,6,7'], [4, 'P4 · 위치 4,5,6,7'], [8, 'P0 · 모든 8bit']]) +
        controls(button('advq-ecc-one', '단일 오류') + button('advq-ecc-two', '이중 오류') + button('advq-ecc-three', '3bit 오정정 예시') + button('advq-ecc-four', '4bit 미검출 예시') + button('advq-ecc-clear', '오류 제거')) + result('advq-ecc-read'),
        '교육용 확장 Hamming (8,4), 짝수 패리티입니다. ≤1bit 오류 정정과 2bit 오류 검출을 보장합니다. 3bit 이상에서는 오정정 또는 미검출이 가능합니다. 실제 HBM ECC 구조 및 용량 오버헤드와 다릅니다.',
        '코드워드 버튼을 하나씩 클릭하세요. 같은 두 오류를 넣었을 때 syndrome이 0이 아니어도 정정하면 안 되는 이유를 전체 패리티와 연결해 설명해 보세요.') +
      detail('syndrome과 전체 패리티를 함께 읽기',
        '<div class="formula">S = P1검사 × 1 + P2검사 × 2 + P4검사 × 4<br>Q = 받은 8개 비트의 XOR</div><p>S=0,Q=0: 오류 없음으로 해석합니다. S≠0,Q=1: 위치 S의 1bit 오류로 해석해 정정합니다. S=0,Q=1: 전체 패리티 위치 8 오류로 해석합니다. S≠0,Q=0: 2bit 오류를 검출하지만 정정하지 않습니다. 이 판독표의 보장은 최대 2bit 오류라는 범위 안에 있습니다.</p><p>예: 위치 5를 뒤집으면 S=5, Q=1이므로 위치 5를 반전합니다. 위치 5와 6을 뒤집으면 S=5 XOR 6=3, Q=0입니다. S=3만 보고 위치 3을 뒤집으면 정상 비트까지 망가뜨립니다.</p><p>위치 1·2·3을 뒤집으면 S=0,Q=1이 되어 디코더는 전체 패리티 오류로 오판합니다. 위치 1·2·3·8을 뒤집으면 S=0,Q=0이 되어 검사에서 놓칩니다. 실제 주입 개수는 이 교육 화면이 알고 있지만 일반 디코더는 그 정보를 받지 않습니다.</p>') +
      checks('① 어느 ECC 계층의 이벤트인가? ② 코드워드당 오류 분포는? ③ 정정 가능/불가능/미검출을 구분했는가? ④ 카운터 이벤트와 고유 주소를 구분했는가? ⑤ 수정된 데이터를 저장소에 반영하는 정책은?') +
      sources([source('https://www.synopsys.com/articles/hbm3-ip-dwtb.html', 'Synopsys HBM3 ECC 보호 계층'), source('https://cdrdv2-public.intel.com/705204/ug-20031-18-1-1-683189-705204.pdf', 'Intel HBM2 컨트롤러 ECC 동작 예시')]);

    let dataBits = [1, 0, 1, 1];
    const flips = new Set();
    function encodeData() {
      const code = Array(8).fill(0);
      [3, 5, 6, 7].forEach((pos, i) => code[pos - 1] = dataBits[i]);
      [1, 2, 4].forEach(p => { let parity = 0; for (let pos = 1; pos <= 7; pos++) if ((pos & p) && pos !== p) parity ^= code[pos - 1]; code[p - 1] = parity; });
      code[7] = code.slice(0, 7).reduce((a, b) => a ^ b, 0);
      return code;
    }
    function drawECC() {
      const code = encodeData(), recv = code.map((bit, i) => bit ^ (flips.has(i + 1) ? 1 : 0));
      const checkResults = [1, 2, 4].map(p => recv.slice(0, 7).reduce((a, bit, i) => ((i + 1) & p) ? a ^ bit : a, 0));
      const syndrome = checkResults[0] + 2 * checkResults[1] + 4 * checkResults[2], overall = recv.reduce((a, b) => a ^ b, 0);
      let interpretation, correctedAt = null;
      if (!syndrome && !overall) interpretation = '오류 없음으로 판독';
      else if (syndrome && overall) { interpretation = `위치 ${syndrome} 단일 오류로 판독`; correctedAt = syndrome; }
      else if (!syndrome && overall) { interpretation = '전체 패리티 오류로 판독'; correctedAt = 8; }
      else interpretation = '이중 오류 검출 · 정정 중단';
      const corrected = recv.slice();
      if (correctedAt !== null) corrected[correctedAt - 1] ^= 1;
      const output = [3, 5, 6, 7].map(pos => corrected[pos - 1]);
      const matches = output.every((bit, i) => bit === dataBits[i]);
      const group = $('advq-ecc-group').value;
      const groupContains = pos => group === 'all' || group === '8' || (pos <= 7 && (pos & Number(group)) !== 0);
      $('advq-data-bits').innerHTML = dataBits.map((bit, i) => `<button type="button" class="preset" data-advq-data="${i}" aria-label="데이터 D${i + 1} ${bit}, 클릭하여 반전">D${i + 1}: ${bit}</button>`).join('');
      $('advq-data-bits').querySelectorAll('[data-advq-data]').forEach(b => b.onclick = () => { dataBits[Number(b.dataset.advqData)] ^= 1; flips.clear(); drawECC(); });
      const labels = ['P1', 'P2', 'D1', 'P4', 'D2', 'D3', 'D4', 'P0'];
      $('viz-20').classList.add('advq-quality-viz');
      $('viz-20').innerHTML = `<p class="advq-caption">전송 후 코드워드 · 위치 1 → 8 · 버튼 클릭 = 오류 주입/제거</p><div class="advq-bitrow">${recv.map((bit, i) => `<button type="button" data-advq-code="${i + 1}" class="advq-cell ${labels[i][0] === 'P' ? 'parity' : ''} ${flips.has(i + 1) ? 'flipped' : ''} ${group !== 'all' && groupContains(i + 1) ? 'grouped' : ''}" aria-label="위치 ${i + 1} ${labels[i]}, 수신 ${bit}, 원본 ${code[i]}, ${flips.has(i + 1) ? '주입 오류 있음' : '정상'}, 클릭하여 반전">${bit}<small>${i + 1} · ${labels[i]}</small><small>원본 ${code[i]}</small></button>`).join('')}</div><div class="advq-parities">${[1, 2, 4, 8].map(p => {
        const members = Array.from({ length: p === 8 ? 8 : 7 }, (_, i) => i + 1).filter(pos => p === 8 || (pos & p));
        const value = p === 8 ? overall : checkResults[[1, 2, 4].indexOf(p)];
        return `<div class="${group === String(p) ? 'selected' : ''}">${p === 8 ? 'Q' : 'P' + p} [${members.join(',')}] : ${members.map(pos => recv[pos - 1]).join(' XOR ')} = ${value}</div>`;
      }).join('')}</div><div class="advq-note" style="margin-top:12px">S = <b>${syndrome}</b> · Q = <b>${overall}</b><br>디코더 해석: ${interpretation}<br>출력 데이터: <b>${output.join('')}</b> / 원본: <b>${dataBits.join('')}</b><br>${syndrome && !overall ? '정정 불가능 플래그와 함께 전달 또는 처리 중단이 필요합니다.' : matches ? '이 예시에서 원본 데이터와 일치합니다.' : '<b>출력 데이터가 원본과 다릅니다.</b>'}${flips.size > 2 ? '<br><b>실제 주입은 보장 범위 초과입니다. 디코더 해석을 정답으로 신뢰할 수 없습니다.</b>' : ''}</div>`;
      $('viz-20').querySelectorAll('[data-advq-code]').forEach(b => b.onclick = () => { const i = Number(b.dataset.advqCode); flips.has(i) ? flips.delete(i) : flips.add(i); drawECC(); });
      read('advq-ecc-read', flips.size > 2 ? '정정 보장 범위 초과' : flips.size === 2 ? '검출 · 정정 불가능' : flips.size === 1 ? '1bit 정정 가능' : '주입 오류 0개', `주입 ${flips.size}bit · syndrome ${syndrome} · 전체 XOR ${overall} · 데이터 4bit + 검사 4bit (교육용)`);
    }
    wire(['advq-ecc-group'], drawECC);
    function setFlips(positions) { flips.clear(); positions.forEach(i => flips.add(i)); drawECC(); }
    $('advq-ecc-one').onclick = () => setFlips([5]);
    $('advq-ecc-two').onclick = () => setFlips([5, 6]);
    $('advq-ecc-three').onclick = () => setFlips([1, 2, 3]);
    $('advq-ecc-four').onclick = () => setFlips([1, 2, 3, 8]);
    $('advq-ecc-clear').onclick = () => setFlips([]);

    // 21 — deterministic synthetic fail maps, with location inspection.
    $('body-failure').innerHTML = cards([
      ['분포의 좌표부터 확인', '웨이퍼 지도는 다이 단위의 검사 bin을, die fail bit map은 특정 메모리 자원의 세부 실패 위치를 나타낼 수 있습니다. 좌표, notch 방향, 검사 단계와 대상 자원을 명확히 적습니다.'],
      ['패턴은 후보를 좁힌다', '가장자리 집중, 행·열 반복, 군집은 분석을 시작할 단서입니다. 테스트 접근 경로, 공정 위치, 배선 공유, 전압·온도 마진 등 여러 가설이 같은 모양을 만들 수 있습니다.'],
      ['집계 전에 데이터 품질', '재검사, 결측, 리페어 전후 좌표, 중복 이벤트, bin 정의를 확인합니다. 제품과 lot를 섞어 그린 지도는 실제 원인이 없어도 패턴을 만들 수 있습니다.']
    ]) + detail('재현 가능한 불량 분석 보고서의 구조',
      '<p>먼저 “무엇이 실패했는지”를 관측 문장으로 씁니다. 예를 들어 “조건 A에서 다이 좌표 (x,y)의 채널 2에서 읽기 불일치가 반복됐다”입니다. “TSV 불량”처럼 원인을 먼저 적으면 후속 실험의 범위를 불필요하게 좁힐 수 있습니다.</p><p>다음으로 관측을 바꿀 수 있는 조건을 한 번에 하나씩 제어합니다. 온도·전압·클록·명령 패턴에 대한 shmoo 결과, 재검사 재현율, 리페어 전후 데이터, 같은 lot의 분포를 비교해 가설을 좁힙니다. 전기적 위치와 물리 분석 위치를 연결하는 주소 맵도 필요합니다.</p><p>마지막으로 분석 기법과 한계를 기록합니다. 단면 관찰, 비파괴 검사, 전기적 특성 비교 등의 증거가 가설과 맞는지 확인하고, 반례도 찾습니다. 지도 패턴만으로 확정한 원인은 대책의 유효성까지 보장하지 않습니다.</p>') +
      lab('21', '불량률이 같아도 지도는 다릅니다',
        select('advq-map-type', '관찰 좌표계', [['wafer', '웨이퍼 · 다이 합격/불합격'], ['die', '다이 · 가상 bit fail map']]) +
        select('advq-map-pattern', '시뮬레이션 분포', [['random', '산발 분포'], ['edge', '가장자리 집중'], ['stripe', '수평 줄무늬'], ['cluster', '국부 군집']]) +
        range('advq-map-rate', '지도 내 불합격 비율', 1, 35, 12, 1, '%') + range('advq-map-seed', '가상 샘플 번호', 1, 20, 4, 1, '') + result('advq-map-read'),
        '모든 위치와 불량은 난수로 만든 시뮬레이션입니다. 분포별 가중치가 다른 위치 선택 모델이며 실제 생산 데이터, 검사 측정값 또는 특정 공정 원인과의 통계적 연관성을 나타내지 않습니다. 웨이퍼 원 밖의 칸은 분모에서 제외합니다.',
        '불량률을 고정하고 분포를 바꿔 보세요. 지도 안의 한 칸을 클릭해 위치를 선택하고, 행·열 집계에서 집중된 구간을 찾아 관측 문장을 작성해 보세요.') +
      detail('예제 보고: 관측 → 가설 → 확인 실험',
        '<p><b>관측:</b> 가상 샘플에서 같은 불량률을 유지하면서 수평 한 구간의 실패 밀도가 높다. <b>가설:</b> 공통 경로, 위치별 공정 편차 또는 특정 검사 패턴의 영향일 수 있다. <b>확인:</b> 검사 순서·패턴을 바꾸고 다른 조건·lot에서도 동일한 물리 좌표로 재현되는지 비교한다.</p><p>하나의 지도에서 행별 실패가 많다고 바로 wordline 결함으로 결론 내리지 않습니다. 실제 bit map의 주소 변환, 뱅크 구분, 리던던시와 검사 구조가 영향을 줍니다. 데이터가 작거나 일부만 추출되었으면 신뢰구간과 표본 선택 편향도 고려하세요.</p>') +
      checks('① 지도 분모와 좌표계는? ② 합격 bin인가, 오류 이벤트인가? ③ 리페어 전후와 테스트 조건을 구분했는가? ④ 가설을 반증할 실험은? ⑤ 같은 물리 위치에서 재현되는가?') +
      sources([source('https://www.synopsys.com/solutions/silicon-lifecycle-management/structural-monitors/slm-ext-ram-ip.html', 'DRAM 검사·진단 기능'), source('https://www.siemens.com/en-gb/products/ic/tessent/test/memorybist/', '메모리 진단과 테스트')]);

    let selectedMapCell = null;
    function mapRandom(index, seed) {
      let x = (index + 1) ^ (seed * 2654435761); x = Math.imul(x ^ (x >>> 16), 2246822507); x = Math.imul(x ^ (x >>> 13), 3266489909);
      return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
    }
    function drawMap() {
      const isWafer = $('advq-map-type').value === 'wafer', nx = isWafer ? 17 : 16, ny = isWafer ? 17 : 12;
      const pattern = $('advq-map-pattern').value, seed = v('advq-map-seed'), positions = [];
      for (let row = 0; row < ny; row++) for (let col = 0; col < nx; col++) {
        const x = (col - (nx - 1) / 2) / ((nx - 1) / 2), y = (row - (ny - 1) / 2) / ((ny - 1) / 2), radius = Math.sqrt(x * x + y * y);
        if (isWafer && radius > 1) continue;
        let weight = 1;
        if (pattern === 'edge') weight += 14 * Math.pow(Math.min(1, isWafer ? radius : Math.max(Math.abs(x), Math.abs(y))), 7);
        if (pattern === 'stripe') weight += Math.abs(y - .125) < .18 ? 24 : 0;
        if (pattern === 'cluster') weight += 35 * Math.exp(-((x - .25) ** 2 + (y + .2) ** 2) / .07);
        const index = row * nx + col;
        positions.push({ index, row, col, score: -Math.log(Math.max(1e-12, mapRandom(index, seed))) / weight });
      }
      const count = Math.round(positions.length * v('advq-map-rate') / 100);
      const failed = new Set(positions.slice().sort((a, b) => a.score - b.score).slice(0, count).map(p => p.index));
      if (selectedMapCell === null || !positions.some(p => p.index === selectedMapCell)) selectedMapCell = positions[Math.floor(positions.length / 2)].index;
      const valid = new Set(positions.map(p => p.index)), selected = positions.find(p => p.index === selectedMapCell);
      const rowFails = Array(ny).fill(0), colFails = Array(nx).fill(0);
      positions.forEach(p => { if (failed.has(p.index)) { rowFails[p.row]++; colFails[p.col]++; } });
      const profile = (values, max, title, color, x0, y0, w, h) => `<text x="${x0}" y="${y0 - 12}" class="label">${title}</text><path d="M${x0} ${y0}v${h}h${w}" stroke="var(--line)" fill="none"/>${values.map((value, i) => `<rect x="${x0 + i * w / values.length + 1}" y="${y0 + h - value / max * h}" width="${w / values.length - 2}" height="${value / max * h}" fill="${color}"/><text x="${x0 + i * w / values.length + w / values.length / 2}" y="${y0 + h + 15}" text-anchor="middle" style="font-size:8px">${i}</text>`).join('')}`;
      $('viz-21').classList.add('advq-quality-viz');
      $('viz-21').innerHTML = `<div class="advq-mapbox"><div class="advq-wafer" style="grid-template-columns:repeat(${nx},1fr)">${Array.from({ length: nx * ny }, (_, index) => valid.has(index) ? `<button type="button" data-advq-map="${index}" class="advq-cell ${failed.has(index) ? 'failed' : ''} ${selectedMapCell === index ? 'active' : ''}" aria-label="가상 ${isWafer ? '다이' : '셀'} 행 ${Math.floor(index / nx)}, 열 ${index % nx}, ${failed.has(index) ? '불합격' : '합격'}, 클릭하여 위치 선택">${failed.has(index) ? '×' : ''}</button>` : '<span class="void"></span>').join('')}</div></div><div class="advq-legend">× / 주황: 불합격 · 빈 녹색 칸: 합격 · 테두리: 선택 위치<br>시뮬레이션 데이터 · 각 지도 칸은 ${isWafer ? '가상 다이 1개' : '가상 검사 셀 1개'}입니다.</div><div class="advq-note">선택: <b>행 ${selected.row}, 열 ${selected.col}</b> · 가상 bin: <b>${failed.has(selected.index) ? 'FAIL' : 'PASS'}</b><br>선택 행 실패 ${rowFails[selected.row]}/${positions.filter(p => p.row === selected.row).length} · 선택 열 실패 ${colFails[selected.col]}/${positions.filter(p => p.col === selected.col).length}<br>좌표는 논리 시뮬레이션 위치이며 공정 원인을 뜻하지 않습니다.</div><div class="advq-chart">${svg(profile(rowFails, nx, '행별 실패 칸 수', orange, 20, 35, 215, 75) + profile(colFails, ny, '열별 실패 칸 수', green, 275, 35, 215, 75) + '<text x="20" y="149" class="label">행 번호 →</text><text x="275" y="149" class="label">열 번호 →</text>', '0 0 520 170')}</div>`;
      $('viz-21').querySelectorAll('[data-advq-map]').forEach(b => b.onclick = () => { selectedMapCell = Number(b.dataset.advqMap); drawMap(); });
      read('advq-map-read', `${count} / ${positions.length} 불합격`, `실제 표시 비율 ${num(count / positions.length * 100, 1)}% · ${isWafer ? '원 안의 다이' : '전체 가상 셀'} 기준 · 동일 표본 번호에서 분포별 가중치만 변경`);
    }
    wire(['advq-map-type', 'advq-map-pattern', 'advq-map-rate', 'advq-map-seed'], drawMap);

    // 22/23 — explicitly limited thin-film mechanics and statistical reliability models.
    $('body-mechanics').innerHTML = cards([
      ['박막화와 강성', '두께가 줄면 휨에 대한 저항이 크게 달라집니다. 취급·척킹·임시 접착·박리·다이 픽업 조건을 함께 설계하며, 표면/모서리 결함은 크랙의 시작점이 될 수 있습니다.'],
      ['CTE · 열팽창계수', '서로 붙은 재료가 같은 온도 변화에서 다른 길이 변화를 원하면 응력과 변형이 생깁니다. CTE 차이, 탄성계수, 두께, 온도 이력, 잔류응력과 지지 조건이 함께 작용합니다.'],
      ['접합과 신뢰성', '초기 전기적 연결이 합격이어도 반복 온도 변화나 습도·바이어스 조건에서 열화가 발생할 수 있습니다. 접합 방식과 재료에 맞는 시험과 물리 분석이 필요합니다.']
    ]) + detail('휨은 어느 온도, 어느 지지 조건에서 측정했나?',
      '<p>실온에서 평탄하다는 사실이 접합 또는 리플로 온도에서도 평탄함을 뜻하지는 않습니다. 온도 의존 재료 특성, 몰드와 언더필, 접착층, 다층 배선, 실제 지지 조건이 변형을 바꿉니다. 측정 온도와 좌표계, peak-to-valley인지 평균 곡률인지도 명시해야 합니다.</p><p>아래 실험은 얇은 막이 더 두꺼운 기판을 휘게 하는 작은 탄성 변형을 설명하는 Stoney형 모델입니다. 복합 HBM 스택의 실제 휨 해석을 대신하지 않습니다. 두꺼운 필름, 비균일 응력, 큰 변형, 이방성, 다층 접착 구조는 더 정교한 판/유한요소 해석이 필요합니다.</p><p>신뢰성 시험도 서로 다른 자극을 가집니다. 온도 사이클은 온도 전환을 반복하고, HTOL은 동작 중 고온·전압 스트레스를 주며, 습도/바이어스 시험은 또 다른 열화 조건을 가속합니다. 서로 다른 시험의 “1000시간”과 “1000사이클”은 같은 단위도, 같은 의미도 아닙니다.</p>') +
      lab('22', '얇은 기판이 어떻게 휘는지 단면으로 관찰하세요',
        range('advq-thickness', '가상 기판 두께', 30, 120, 50, 5, ' μm') + range('advq-delta-temp', '기준 온도 대비 ΔT', -80, 200, 100, 5, ' °C') +
        range('advq-cte', '막−기판 CTE 차이', -15, 15, 10, 1, ' ppm/°C') + range('advq-span', '관찰 가로 길이', 4, 16, 8, .5, ' mm') + result('advq-bow-read'),
        '균일한 1 μm 막, 막/기판 이축 탄성계수 비 0.4, 초기 휨 0, 선형 탄성·작은 곡률의 가정입니다. 이 값은 가상 입력이며 HBM 재료 사양이 아닙니다. 표시 단면은 변형을 확대하고 ±90px에서 제한합니다. 재료의 인장/압축 부호와 실제 패키지 휨 방향은 구조에 따라 달라집니다.',
        '온도 변화 또는 CTE 차이를 0으로 만들어 보세요. 두께를 50→100 μm로 바꾸면 이 모델의 휨은 몇 배가 되나요? CTE 부호를 반대로 바꾸면 곡률 방향은 어떻게 되나요?') +
      detail('계산 예제: 온도 불일치에서 곡률로',
        '<div class="formula">Δε = Δα × ΔT × 10⁻⁶<br>κ = 6 × (M막 / M기판) × t막 × Δε / t기판²<br>가장자리−중심 높이차 ≈ κ × L² / 8</div><p>길이 단위를 μm로 통일하면 κ는 μm⁻¹입니다. Δα=10 ppm/°C, ΔT=100°C이면 Δε=0.001입니다. t막=1μm, t기판=50μm, 탄성계수 비=0.4, L=8000μm에서 높이차는 7.68μm입니다. 두께를 100μm로 늘리면 1.92μm로 줄어듭니다.</p><p>여기서 높이차는 가정한 1차원 곡률의 기하학 값입니다. 측정된 2D peak-to-valley, 스택 접합 갭, 크랙 임계값, 패키지 합격 규격과 직접 같다고 해석하지 않습니다.</p>') +
      lab('23', '열사이클과 Weibull 분포를 가상 집단에서 비교하세요',
        range('advq-cycle-count', '관찰 사이클 수 N', 0, 3000, 500, 25, '회') + range('advq-cycle-swing', '온도 사이클 폭 ΔT', 40, 200, 100, 5, ' °C') +
        range('advq-weibull-beta', '형상 계수 β', .5, 5, 2, .1, '') + range('advq-weibull-eta', '기준 특성 수명 η₀', 500, 2500, 1500, 50, '회') + result('advq-life-read'),
        '실측 데이터가 없는 통계 교육 모델입니다. η=η₀×(100/ΔT)²라는 가상 스케일 규칙을 임의로 두었습니다. Weibull 분포의 β·η와 가속 지수는 실제 재료·고장 모드·시험 데이터를 적합해 검증해야 합니다. ramp/dwell, 습도, 전압, 복수 고장 모드, 검열 데이터와 신뢰구간을 생략했습니다.',
        '같은 N에서 ΔT를 바꾸고 100개 가상 샘플 중 실패한 개수를 확인하세요. β를 0.5→1→3으로 바꾸며 CDF 곡선의 모양과 위험률 방향을 비교하고, 샘플 칸을 눌러 각 가상 고장 시점을 읽어보세요.') +
      detail('신뢰성 곡선의 숫자가 뜻하는 것',
        '<div class="formula">누적 고장 확률 F(N) = 1 − exp[−(N/η)^β]<br>생존 확률 R(N) = 1 − F(N)<br>N = η일 때 F ≈ 63.2% (β와 무관)</div><p>β&lt;1은 이 분포에서 위험률이 감소하고, β=1은 일정하며, β&gt;1은 증가합니다. 곡선 형태만으로 초기 불량·특정 접합 피로·마모의 실제 원인을 확정할 수는 없습니다. 서로 다른 고장 모드가 섞이면 하나의 Weibull 분포로 설명되지 않을 수 있습니다.</p><p>가상 샘플의 고장 시점은 100개의 균등한 분위수를 역변환해 만듭니다. 따라서 독립 난수 실험의 흔들림이나 실제 측정 오차를 표현하지 않습니다. 종료 시점에 살아 있는 샘플은 실제 수명 분석에서 우측 검열 정보로 포함해야 합니다.</p><p>시험을 통과한 집단으로부터 필드 수명을 말하려면 사용 환경과 시험 환경의 차이, 가속 모델, 신뢰구간, 고장 메커니즘 일치 여부를 확인해야 합니다. 이 실험의 사이클 수는 제품 보증 수명이나 FIT로 환산되지 않습니다.</p>') +
      checks('① 온도·지지 조건과 휨 지표는? ② 재료/막 두께/잔류응력 정보는? ③ 온도 폭·ramp·dwell·반복 수는? ④ 고장 판정 기준과 검열 샘플은? ⑤ 가속 모델과 고장 모드의 검증 근거는?') +
      sources([source('https://pmc.ncbi.nlm.nih.gov/articles/PMC5706234/', '박막 열기계 피로와 Stoney 적용 한계'), source('https://www.ti.com/quality-reliability/reliability/testing.html', 'TI 신뢰성 시험'), source('https://www.itl.nist.gov/div898/handbook/eda/section3/eda3668.htm', 'NIST Weibull 분포'), source('https://amkor.com/blog/thermal-simulation-of-dsmbga-coupled-thermal-mechanical-simulation-of-large-body-hdfo/', 'Amkor 열·기계 결합 해석')]);

    function drawBow() {
      const t = v('advq-thickness'), delta = v('advq-delta-temp'), mismatch = v('advq-cte'), span = v('advq-span');
      const strain = mismatch * delta * 1e-6, kappa = 6 * .4 * strain / (t * t), bow = kappa * ((span * 1000) ** 2) / 8;
      const displayBow = Math.max(-90, Math.min(90, bow * 4)), drawnThickness = 10 + t / 7;
      const points = Array.from({ length: 41 }, (_, i) => { const x = 55 + i * 10, u = (x - 255) / 200; return [x, 138 + displayBow * u * u]; });
      const path = offset => points.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y + offset}`).join(' ');
      const polygon = points.map(([x, y]) => `${x},${y}`).concat(points.slice().reverse().map(([x, y]) => `${x},${y + drawnThickness}`)).join(' ');
      const cteBar = Math.max(-75, Math.min(75, strain * 25000));
      $('viz-22').classList.add('advq-quality-viz');
      $('viz-22').innerHTML = svg(`<text x="28" y="26">가상 얇은 막 + 기판 단면</text><text x="28" y="48" class="label">기준 대비 ΔT ${delta}°C · Δε ${num(strain * 100, 3)}%</text><path d="M55 138h400" stroke="var(--line)" stroke-dasharray="5 4"/><polygon points="${polygon}" fill="${softGreen}" stroke="${green}"/><path d="${path(-4)}" stroke="${yellow}" stroke-width="6" fill="none"/>${[85, 135, 185, 235, 285, 335, 385, 435].map(x => { const y = 138 + displayBow * (((x - 255) / 200) ** 2); return `<path d="M${x} ${y + 2}v${drawnThickness - 4}" stroke="${yellow}" stroke-width="4"/>`; }).join('')}<text x="365" y="${Math.min(262, 167 + displayBow)}" class="label">기판 ${t}μm</text><path d="M255 138V${138 + displayBow}" stroke="${orange}" stroke-width="2"/><text x="28" y="278" class="label">막의 자유 팽창 차이 · 크기와 변형은 시각적으로 확대</text><rect x="170" y="292" width="170" height="12" rx="4" fill="${softGreen}"/><rect x="${170 - cteBar / 2}" y="311" width="${170 + cteBar}" height="7" rx="3" fill="${yellow}"/><text x="355" y="303" class="label">기판</text><text x="355" y="319" class="label">막</text>`, '0 0 520 345');
      read('advq-bow-read', `${num(bow, 2)} μm`, `가상 가장자리−중심 높이차 · 곡률 ${num(kappa * 1e6, 3)} m⁻¹ · 온도 기준의 절대값 대신 ΔT 사용`);
    }
    wire(['advq-thickness', 'advq-delta-temp', 'advq-cte', 'advq-span'], drawBow);

    let selectedLifeSample = 50;
    function drawLife() {
      const n = v('advq-cycle-count'), swing = v('advq-cycle-swing'), beta = v('advq-weibull-beta'), eta0 = v('advq-weibull-eta');
      const eta = eta0 * (100 / swing) ** 2;
      const cdf = x => -Math.expm1(-((x / eta) ** beta));
      const probability = cdf(n), lifetime = index => eta * ((-Math.log(1 - (index + .5) / 100)) ** (1 / beta));
      const lifetimes = Array.from({ length: 100 }, (_, i) => lifetime(i)), failures = lifetimes.filter(t => t <= n).length;
      const x = value => 47 + value / 3000 * 435, y = value => 175 - value * 135;
      const curve = Array.from({ length: 121 }, (_, i) => `${i ? 'L' : 'M'}${x(i * 25)} ${y(cdf(i * 25))}`).join(' ');
      const hazard = beta < 1 ? '감소' : beta === 1 ? '일정' : '증가';
      $('viz-23').classList.add('advq-quality-viz');
      $('viz-23').innerHTML = `<div class="advq-chart">${svg(`<path d="M47 35v140h435" stroke="var(--line)" fill="none"/><text x="7" y="46" class="label">100%</text><text x="19" y="179" class="label">0%</text><text x="47" y="21" class="label">누적 고장 확률 F(N)</text><path d="${curve}" stroke="${green}" stroke-width="3" fill="none"/><path d="M${x(n)} 40v135" stroke="${orange}" stroke-dasharray="4"/><circle cx="${x(n)}" cy="${y(probability)}" r="6" fill="${orange}"/><text x="47" y="196" class="label">0</text><text x="433" y="196" class="label">3000회</text><text x="193" y="218" class="label">관찰 사이클 수 N →</text>`, '0 0 520 235')}</div><div class="advq-sample-grid">${lifetimes.map((time, i) => `<button type="button" data-advq-life="${i}" class="advq-cell ${time <= n ? 'failed' : ''} ${selectedLifeSample === i ? 'active' : ''}" aria-label="가상 샘플 ${i + 1}, ${time <= n ? '고장' : '생존'}, 고장 시점 ${num(time, 0)}사이클">${time <= n ? '×' : '·'}</button>`).join('')}</div><div class="advq-legend">100개 균등 분위수 샘플 · ×: 관찰 시점까지 고장 · ·: 아직 생존</div><div class="advq-note">선택 샘플 ${selectedLifeSample + 1}: 가상 고장 시점 <b>${num(lifetimes[selectedLifeSample], 0)}사이클</b><br>현재 ${n}회에서 <b>${lifetimes[selectedLifeSample] <= n ? '고장' : '생존'}</b> · 이 분포의 위험률은 N&gt;0에서 <b>${hazard}</b><br>η=${num(eta, 1)}회에서 누적 고장 확률은 63.2%입니다.</div>`;
      $('viz-23').querySelectorAll('[data-advq-life]').forEach(b => b.onclick = () => { selectedLifeSample = Number(b.dataset.advqLife); drawLife(); });
      read('advq-life-read', `${num(probability * 100, 1)}% 누적 고장`, `분위수 샘플 ${failures}/100개 고장 · η ${num(eta, 1)}회 · β ${num(beta, 1)} · 실측/보증 값 아님`);
    }
    wire(['advq-cycle-count', 'advq-cycle-swing', 'advq-weibull-beta', 'advq-weibull-eta'], drawLife);
  }
});
