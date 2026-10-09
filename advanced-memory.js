/* HBM Lab extension: architecture, traffic, maintenance and signal integrity. */
(function () {
  'use strict';
  window.HBMExtensions = window.HBMExtensions || [];
  window.HBMExtensions.push({
    chapters: [
      ['channels', '채널과 주소 매핑', '1024개의 선을 32개의 길로 읽기', 'HBM3의 넓은 데이터 인터페이스는 16개의 64-bit 채널, 최대 32개의 32-bit 의사채널로 나뉩니다. 전체 폭이 같아도 요청을 어느 경로에 배치하느냐에 따라 실제 병렬성이 달라집니다. 주소를 직접 보내며 그 차이를 관찰합니다.'],
      ['transfers', '버스트와 요청 큐', '대역폭을 채우려면 요청도 준비되어야 한다', '실효 대역폭은 유용한 바이트 비율, 명령과 데이터 버스의 유휴 시간, 읽기·쓰기 전환, 동시에 진행 중인 요청 수에 의해 제한됩니다. 큰 수치 하나 대신 어떤 단계가 시간을 차지하는지 분해해 봅니다.'],
      ['refresh', '리프레시와 데이터 유지', '메모리는 가만히 있어도 일을 한다', 'DRAM 셀의 전하는 시간이 지나면 줄어듭니다. 리프레시는 데이터를 유지하는 필수 동작이며, 대상 뱅크와 실행 시점에 따라 요청의 대기 시간이 바뀝니다. 온도와 retention의 연결도 가상의 셀에서 확인합니다.'],
      ['signal', '신호 무결성과 PHY', '빠른 비트가 정확한 비트가 되기까지', '넓은 병렬 인터페이스에서는 각 DQ와 기준 신호의 타이밍 및 전압 여유가 중요합니다. 아이 다이어그램을 클릭하여 샘플링 위치를 옮기고, 지터·잡음·상승시간이 판정 여유를 어떻게 좁히는지 살펴봅니다.']
    ],
    init: function (api) {
      const { $, num, cards, range, select, result, lab, wire, v, read, svg } = api;
      const previousReadouts = new Map();
      function readStable(key, value, description) {
        const signature = value + '\n' + description;
        if (previousReadouts.get(key) === signature) return;
        previousReadouts.set(key, signature);
        read(key, value, description);
      }
      const prefix = 'advm-';
      const id = name => prefix + name;
      const n = name => v(id(name));
      const val = name => $(id(name)).value;
      const button = (name, text) => `<button type="button" class="preset" id="${id(name)}">${text}</button>`;
      const controls = html => `<div class="advm-buttons">${html}</div>`;
      const diagram = (body, label, height = 380) => svg(body, `0 0 600 ${height}`).replace('실험 결과 개념도', label);
      const lesson = (title, body) => `<details class="advm-lesson" open><summary>${title}</summary>${body}</details>`;
      const source = (url, title) => `<p class="small advm-source">근거 읽기 · <a href="${url}" target="_blank" rel="noopener noreferrer">${title} ↗</a></p>`;
      const formula = text => `<div class="formula">${text}</div>`;
      const task = text => `<div class="task"><b>업무에서 확인하기</b> ${text}</div>`;
      const style = document.createElement('style');
      style.textContent = `.advm-buttons{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0}.advm-buttons button{font-size:13px}.advm-buttons button[aria-pressed=true]{background:var(--green);color:var(--bg)}.advm-lesson{border:1px solid var(--line);border-radius:7px;padding:16px 20px;margin:14px 0}.advm-lesson summary{font-weight:700;cursor:pointer}.advm-lesson p,.advm-lesson li{font-size:14px;color:var(--muted)}.advm-source{color:var(--muted)}.advm-packets{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin-top:14px}.advm-packets button{font-size:12px;padding:6px 2px;min-width:0}.advm-caption{font-size:12px;color:var(--muted);margin:10px 0}.advm-click{cursor:pointer}.advm-click:focus{outline:none}.advm-click:focus rect{stroke:var(--orange);stroke-width:3px}.advm-instructions{font-size:12px;line-height:1.7;color:var(--muted)}.advm-matrix-readout{padding:12px;background:var(--soft);border-radius:5px;font-size:13px;min-height:70px}.advm-viz-wrap{position:relative}.advm-lesson code{overflow-wrap:anywhere}.advm-source a{text-underline-offset:3px}`;
      document.head.appendChild(style);

      // An animation has no scheduled frame while hidden, outside the viewport,
      // paused, or while the OS asks for reduced motion. Step buttons always work.
      const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
      function player(target, render, step, playId, stepId, rate) {
        let time = 0, visible = false, running = false, frame = 0, last = 0;
        const play = $(id(playId));
        function paint() { render(time); }
        function enabled() { return running && visible && !document.hidden && !motion.matches; }
        function loop(stamp) {
          frame = 0;
          if (!enabled()) { last = 0; return; }
          if (last) time += Math.min(80, stamp - last) * rate;
          last = stamp;
          paint();
          frame = requestAnimationFrame(loop);
        }
        function sync() {
          if (enabled() && !frame) { last = 0; frame = requestAnimationFrame(loop); }
          if (!enabled() && frame) { cancelAnimationFrame(frame); frame = 0; last = 0; }
          play.textContent = motion.matches ? '동작 줄이기 · 단계 버튼 사용' : running ? '일시정지' : '자동 재생';
          play.disabled = motion.matches;
          play.setAttribute('aria-pressed', String(running && !motion.matches));
          const announcement = target.closest('.lab').querySelector('.readout');
          if (announcement) announcement.setAttribute('aria-live', running && !motion.matches ? 'off' : 'polite');
        }
        play.onclick = () => { running = !running; sync(); };
        $(id(stepId)).onclick = () => { running = false; time += step; sync(); paint(); };
        const observer = new IntersectionObserver(entries => { visible = entries.some(e => e.isIntersecting); sync(); }, { threshold: 0 });
        observer.observe(target);
        document.addEventListener('visibilitychange', sync);
        if (motion.addEventListener) motion.addEventListener('change', sync);
        sync(); paint();
        return { reset() { time = 0; paint(); }, render: paint, set(value) { time = value; paint(); }, pause() { running = false; sync(); }, start() { running = true; sync(); } };
      }

      $('body-channels').innerHTML = cards([
        ['채널 ≠ 의사채널 ≠ 뱅크', '채널은 인터페이스 분할, 의사채널은 더 작은 접근 단위, 뱅크는 내부 행 동작의 병렬 단위입니다. 컨트롤러 포트 수나 다이 수와도 일대일 대응한다고 단정할 수 없습니다.'],
        ['HBM3 구조의 기준', '16 × 64 bit = 32 × 32 bit = 1024 bit입니다. 의사채널이 늘어난다고 전체 데이터 선 수가 두 배가 되지는 않습니다. 공유 자원과 타이밍 제약이 남으므로 의사채널은 무조건 독립인 작은 메모리가 아닙니다.'],
        ['주소 패턴이 병렬성을 만든다', '같은 요청 개수라도 특정 채널·뱅크에 몰리면 다른 경로가 쉬게 됩니다. 연속, stride, gather/scatter 접근을 따로 측정해야 합니다. 주소 해시와 배치는 플랫폼 구현에 따라 다릅니다.']
      ]) + lesson('주소는 어떻게 컨트롤러의 자원이 될까?', '<p>프로그램의 byte 주소가 그대로 DRAM 행 주소가 되는 것은 아닙니다. 시스템의 주소 변환과 메모리 컨트롤러의 매핑을 거쳐 스택, 채널, 의사채널, 뱅크, 행, 열을 선택합니다. 주소의 어떤 비트를 채널 선택에 쓰는지가 연속 접근의 분산 정도를 바꿉니다.</p><p>낮은 주소 비트로 경로를 교대로 고르면 연속 접근은 분산되지만, 경로 개수와 맞물리는 stride는 다시 한 곳에 집중될 수 있습니다. 상위 비트를 XOR하는 해시는 일부 규칙적인 패턴을 완화할 수 있으며 모든 패턴의 균등 분산을 보장하지는 않습니다.</p><p>의사채널의 대역폭을 각각 합산하려면 각 경로에 충분한 요청이 동시에 공급되어야 합니다. 하나의 stream만 측정한 결과와 여러 stream을 묶은 결과를 구분하세요. 물리 주소 매핑을 모른다면 stride sweep와 채널 카운터로 가설을 검증할 수 있습니다.</p>') +
      lab('12', '주소 패킷을 보내고 32개 의사채널의 편중 찾기',
        select(id('map'), '교육용 매핑 방식', [['interleave', '32B마다 순환 배치'], ['block', '1KiB 블록마다 경로 변경'], ['xor', '상위 비트 XOR 분산']]) +
        select(id('stride'), '64개 요청 사이의 주소 간격', [[32, '32 B · 연속'], [64, '64 B'], [128, '128 B'], [256, '256 B'], [512, '512 B'], [1024, '1024 B'], [2048, '2048 B']]) +
        range(id('base'), '시작 주소 오프셋', 0, 992, 0, 32, ' B') + result(id('map-read')) +
        controls(button('map-play', '자동 재생') + button('map-step', '다음 패킷') + button('map-reset', '처음부터')) +
        `<p class="advm-instructions">아래 요청 버튼 또는 오른쪽 PC 칸을 클릭하세요. PC 칸은 Tab과 Enter로도 선택할 수 있습니다.</p><div class="advm-packets" id="${id('packets')}"></div><div class="advm-matrix-readout" id="${id('map-detail')}" aria-live="polite"></div>`,
        'HBM3의 32개 의사채널 개수만 실제 구조를 참고합니다. 주소 비트 배치, 64개 요청, PC당 8개 뱅크 및 행 분해는 교육용 가정이며 실제 GPU 주소 디코더를 재현하지 않습니다. heatmap은 요청 수이고 처리 속도나 온도 측정값이 아닙니다.',
        '32B 순환 배치에서 stride를 32B → 1024B로 바꾸세요. 활성 PC 수가 32 → 1이 되는 이유를 나머지 연산으로 설명한 뒤 XOR를 적용해 보세요.') +
      formula('예시: unit = floor(byte_address / 32) · 순환 PC = unit mod 32 · XOR PC = (unit XOR floor(unit / 32)) AND 31') +
      lesson('계산 예제 · 32개 경로와 1024B stride', '<p>순환 매핑에서 주소 0, 32, 64B는 PC 0, 1, 2로 향합니다. 반면 주소 0, 1024, 2048B는 32B 단위 주소가 0, 32, 64이므로 PC가 모두 0입니다. 폭이 1024 bit라는 사실은 이 편중을 자동으로 해소하지 않습니다.</p><p>해시를 바꿨더니 빨라졌다면 단순히 대역폭 등급이 개선된 것이 아닙니다. 동일한 물리 자원의 이용률이 바뀐 것입니다. 행 locality가 동시에 변할 수 있으므로 PC 분산뿐 아니라 ACT/PRE 비율도 함께 확인해야 합니다.</p>') +
      task('세대별 채널/의사채널 폭, 스택당 경로 개수, 주소 interleave 단위, 측정 stride와 working set 크기를 기록하세요. HBM2E의 8×128-bit 구조를 HBM3의 16×64-bit 구조와 혼용하지 마세요.') +
      source('https://www.synopsys.com/designware-ip/interface-ip/hbm/hbm3-phy.html', 'Synopsys HBM3 PHY · 16채널 / 32의사채널') +
      source('https://docs.amd.com/r/en-US/pg313-network-on-chip/HBM-Topology', 'AMD PG313 HBM topology · 해당 AMD HBM2E 구현과 비교');

      let selectedPacket = 0, selectedPC = null, mappingPlayer;
      function addressAt(i) { return n('base') + i * n('stride'); }
      function decode(address) {
        const u = Math.floor(address / 32), mode = val('map');
        return { pc: mode === 'block' ? Math.floor(u / 32) % 32 : mode === 'xor' ? (u ^ Math.floor(u / 32)) & 31 : u % 32,
          bank: Math.floor(u / 32) % 8, row: Math.floor(u / 256), offset: address % 32 };
      }
      function drawMapping(t) {
        const current = ((Math.floor(t) % 64) + 64) % 64;
        const address = addressAt(current), d = decode(address);
        const counts = Array(32).fill(0);
        for (let i = 0; i < 64; i++) counts[decode(addressAt(i)).pc]++;
        const max = Math.max(...counts), active = counts.filter(Boolean).length;
        readStable(id('map-read'), active + ' / 32 PC', `64개 요청 중 최다 ${max}개(${num(max / 64 * 100, 1)}%)가 한 PC에 배치 · 현재 요청 #${current + 1}`);
        let cells = '';
        counts.forEach((count, pc) => {
          const x = 20 + pc % 8 * 72, y = 118 + Math.floor(pc / 8) * 51;
          const chosen = (selectedPC === null ? d.pc : selectedPC) === pc;
          cells += `<g class="advm-click" role="button" tabindex="0" data-advm-pc="${pc}" aria-label="PC ${pc}, 요청 ${count}개, 선택하기"><rect x="${x}" y="${y}" width="64" height="43" rx="5" fill="${chosen ? '#ccf292' : '#58a38d'}" fill-opacity="${chosen ? 1 : .13 + .72 * count / Math.max(1, max)}" stroke="${chosen ? '#ba562c' : '#799e8c'}" stroke-width="${chosen ? 2 : 1}"/><text x="${x + 7}" y="${y + 17}" style="font-size:11px">PC ${pc}</text><text x="${x + 7}" y="${y + 34}" style="font-size:11px">${count} req</text></g>`;
        });
        $('viz-12').innerHTML = diagram(`<text x="20" y="23">주소 → 채널 → 의사채널 → 뱅크/행</text><rect x="20" y="43" width="180" height="43" rx="6" fill="#ccf292"/><text x="31" y="62">#${current + 1} · 0x${address.toString(16).toUpperCase()}</text><text x="31" y="78" style="font-size:11px">${address} byte</text><path d="M205 65H282" stroke="#58a38d" stroke-width="3"/><circle cx="${211 + (t % 1) * 66}" cy="65" r="6" fill="#ba562c"/><rect x="290" y="43" width="286" height="43" rx="6" fill="#c4d4be"/><text x="302" y="64">CH ${Math.floor(d.pc / 2)} · PC ${d.pc}</text><text x="302" y="80" style="font-size:11px">가상 Bank ${d.bank} · Row ${d.row}</text>${cells}<text x="20" y="344" class="label">칸 색이 진할수록 요청이 많음 · 선택 칸은 연두색</text><text x="20" y="365" class="label">행·뱅크 값은 별도 가상 분해이며 실제 주소맵이 아닙니다.</text>`, '주소 요청과 32개 의사채널 분포');
        const focusPC = selectedPC === null ? d.pc : selectedPC;
        const examples = Array.from({ length: 64 }, (_, i) => i).filter(i => decode(addressAt(i)).pc === focusPC).slice(0, 5).map(i => `#${i + 1}(${addressAt(i)}B)`).join(', ');
        $(id('map-detail')).textContent = `PC ${focusPC}: ${counts[focusPC]}개 요청. ${examples ? '예: ' + examples : '현재 64개 요청에서 접근하지 않습니다.'}`;
      }
      mappingPlayer = player($('viz-12'), drawMapping, 1, 'map-play', 'map-step', .0025);
      $('viz-12').addEventListener('click', event => { const el = event.target.closest('[data-advm-pc]'); if (el) { selectedPC = +el.dataset.advmPc; mappingPlayer.pause(); mappingPlayer.render(); } });
      $('viz-12').addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { const el = event.target.closest('[data-advm-pc]'); if (el) { event.preventDefault(); selectedPC = +el.dataset.advmPc; mappingPlayer.pause(); mappingPlayer.render(); const next = $('viz-12').querySelector(`[data-advm-pc="${selectedPC}"]`); if (next) next.focus(); } } });
      wire([id('map'), id('stride'), id('base')], () => {
        selectedPC = null; selectedPacket = 0;
        $(id('packets')).innerHTML = Array.from({ length: 16 }, (_, i) => `<button type="button" class="preset" data-advm-request="${i}" aria-label="요청 ${i + 1}, 주소 ${addressAt(i)} byte">#${i + 1} · ${addressAt(i)}B</button>`).join('');
        mappingPlayer.reset();
      });
      $(id('packets')).onclick = event => { const el = event.target.closest('[data-advm-request]'); if (el) { selectedPacket = +el.dataset.advmRequest; selectedPC = null; mappingPlayer.pause(); mappingPlayer.set(selectedPacket); } };
      $(id('map-reset')).onclick = () => { selectedPC = null; mappingPlayer.pause(); mappingPlayer.reset(); };

      $('body-transfers').innerHTML = cards([
        ['버스트 · Burst', '여러 beat를 묶어 데이터를 옮깁니다. HBM3의 32-bit 의사채널에 8 beat를 곱하면 32B 접근 단위가 됩니다. 소프트웨어의 요청 크기와 물리 DRAM 접근 단위는 구분해야 합니다.'],
        ['실효 대역폭의 분모', '유용한 데이터만 셀지, 실제 DRAM 전송 전체를 셀지 먼저 정합니다. 작은 비정렬 접근은 불필요한 바이트를 가져올 수 있습니다. 명령 간격·row miss·R/W 전환은 전송하지 못하는 시간도 만듭니다.'],
        ['Outstanding 요청 · MLP', '첫 요청을 기다리는 동안 다음 요청을 준비해 지연을 겹칩니다. 요청 의존성, queue depth, 포트 arbitration이 병렬성을 제한합니다. queue만 크게 하면 평균 지연과 공정성이 나빠질 수도 있습니다.']
      ]) + lesson('DRAM 버스트와 시스템의 요청 묶기를 구분하기', '<p>HBM3의 의사채널 데이터 폭은 4B이고 8 beat 접근으로 32B를 옮깁니다. 아래 실험은 이 32B 단위만 사용하여 유용한 payload가 차지하는 비율을 계산합니다. 명령이 데이터 선 위에 16B 헤더로 전송된다는 식의 직렬 패킷 모델은 사용하지 않습니다.</p><p>상위 계층의 요청이 128B라면 여러 32B 접근으로 처리될 수 있습니다. 반대로 4B만 필요해도 주변 데이터를 함께 가져오는 상황이 생길 수 있습니다. 캐시, coalescing, byte mask, write RMW 동작은 시스템과 접근 종류에 따라 다르므로 실제 traffic counter로 확인해야 합니다.</p><p>읽기와 쓰기를 교대로 수행하면 데이터 방향 전환에 공백이 필요할 수 있습니다. 같은 방향 요청을 묶으면 효율이 개선될 수 있지만 대기 중인 다른 방향의 요청이 오래 기다릴 수 있습니다. 평균 대역폭과 tail latency를 함께 비교하는 이유입니다.</p>') +
      lab('13', '유용한 바이트와 실제 전송 시간을 분리하기',
        range(id('payload'), '필요한 payload', 4, 256, 64, 4, ' B') +
        range(id('offset'), '32B 경계 안 시작 위치', 0, 31, 0, 1, ' B') +
        range(id('gap'), '서비스 단위 사이 유휴 시간', 0, 20, 2, .5, ' ns') +
        range(id('pinrate'), '의사채널 핀 전송률', 2, 10, 8, .5, ' Gbit/s') +
        select(id('bundle'), '유휴 시간을 나누는 요청 묶음', [[1, '1개 요청마다 공백'], [4, '4개 묶음마다 공백'], [8, '8개 묶음마다 공백'], [16, '16개 묶음마다 공백']]) +
        result(id('burst-read')) + controls(button('burst-aligned', '64B 정렬 요청') + button('burst-small', '4B 비정렬 요청') + button('burst-bundle', '16개 묶기')),
        '32B 접근으로 시작/끝 경계를 덮는 가상 읽기 모델입니다. 유휴 시간은 서비스 단위 하나에 배분한 가정이며 특정 HBM3 타이밍 값이 아닙니다. 묶음 K개가 유휴 시간 1회를 공유한다고 가정합니다. ECC·캐시·재사용·압축·bank parallelism은 제외합니다.',
        'payload 32B와 시작 위치 0B/1B를 비교하세요. 필요한 데이터는 같아도 물리 접근이 1회에서 2회가 되는 이유를 설명해 보세요.') +
      formula('N = ceil((offset + payload) / 32) · wire_bytes = 32N · data_time(ns) = wire_bytes / (핀 Gbit/s × 32 / 8) · 실효 GB/s = payload / (data_time + gap / 묶음 수)') +
      lesson('계산 예제 · 4B가 32B로 전송되는 경우', '<p>8Gbit/s, 32-bit 의사채널의 이론 대역폭은 32GB/s입니다. 경계 안에 들어오는 4B 요청을 32B 한 번으로 읽으면 데이터 시간은 1ns입니다. 요청당 2ns 유휴 시간까지 더하면 유용한 대역폭은 4B ÷ 3ns ≈ 1.33GB/s입니다.</p><p>이 값은 HBM3 제품의 측정 성능이 아닙니다. 유용한 바이트의 낭비와 유휴 시간의 영향을 분리한 계산입니다. 실험에서 묶음 수를 늘리는 효과는 공백을 공유한다는 모델 가정이 성립할 때만 발생합니다.</p>') +
      lab('16', '지연을 숨기는 outstanding 요청 창',
        range(id('window'), '동시 outstanding 제한', 1, 128, 16, 1, '개') +
        select(id('requestsize'), '요청당 유용한 데이터', [[32, '32 B'], [64, '64 B'], [128, '128 B'], [256, '256 B'], [512, '512 B']]) +
        range(id('latency'), '요청 서비스 지연', 50, 400, 100, 10, ' ns') +
        range(id('peak'), '가정한 공유 버스 상한', 8, 128, 64, 8, ' GB/s') +
        result(id('queue-read')) + controls(button('queue-play', '자동 재생') + button('queue-step', '다음 10ns') + button('queue-single', '요청 1개 주입') + button('queue-fill', '창 가득 주입') + button('queue-reset', '비우기')),
        'Q개의 요청이 지연 L을 겹칠 때 min(Bpeak, Q×S/L)를 공급 상한으로 보는 Little’s law 교육 모델입니다. 아래 이동 점은 각 요청의 서비스 진행 상태를 나타내며 DRAM 명령 시뮬레이터가 아닙니다. 24개보다 많은 요청은 묶어서 표시합니다. 계산은 wire traffic 대신 payload 기준입니다.',
        '64B, 100ns, 64GB/s에서 6400B가 동시에 진행 중이어야 버스를 채울 수 있습니다. 100개 요청이 필요한 계산을 확인하세요.') +
      formula('대역폭-지연 곱 B×L = 동시에 진행해야 할 바이트 · 필요 요청 수 = ceil(Bpeak × L / S) · Q=16, S=64B, L=100ns → 공급 상한 10.24GB/s') +
      task('읽기/쓰기 종류, 요청 크기·정렬, R/W 전환 횟수, queue occupancy, row hit 비율, 유용한 payload와 wire 바이트를 따로 기록하세요. 대역폭 상승과 함께 p95/p99 지연도 확인하세요.') +
      source('https://www.synopsys.com/articles/hbm3-ip-dwtb.html', 'Synopsys · HBM3의 32-bit PC, 8 beat, 32B 접근') +
      source('https://docs.amd.com/r/en-US/pg276-axi-hbm/Memory-Controller-Register-Map', 'AMD HBM 컨트롤러의 ACT·REF·R/W 전환 카운터');

      function updateBurst() {
        const useful = n('payload'), offset = n('offset'), actual = 32 * Math.ceil((useful + offset) / 32);
        const peak = n('pinrate') * 4, dataTime = actual / peak, gapTime = n('gap') / n('bundle');
        const elapsed = dataTime + gapTime, bandwidth = useful / elapsed;
        readStable(id('burst-read'), num(bandwidth, 2) + ' GB/s', `payload 효율 ${num(useful / actual * 100, 1)}% · 시간 이용률 ${num(dataTime / elapsed * 100, 1)}% · PC 상한 ${num(peak)} GB/s`);
        const scale = 530 / actual, usefulWidth = useful * scale, before = offset * scale, height = 32;
        let blocks = '';
        for (let j = 0; j < actual / 32; j++) blocks += `<path d="M${35 + j * 32 * scale} 85v${height}" stroke="#487b69" stroke-width="1"/>`;
        const dataWidth = 530 * dataTime / elapsed;
        $('viz-13').innerHTML = diagram(`<text x="35" y="32">물리 ${actual}B 중 필요한 ${useful}B</text><rect x="35" y="85" width="530" height="${height}" rx="3" fill="#c4d4be"/><rect x="${35 + before}" y="85" width="${usefulWidth}" height="${height}" fill="#08645b"/>${blocks}<text x="35" y="144" class="label">진한 초록: 유용한 payload · 옅은 영역: 함께 읽는 바이트</text><text x="35" y="192">요청 1개에 배분한 총 시간 ${num(elapsed, 2)} ns</text><rect x="35" y="214" width="530" height="37" rx="3" fill="#d8b081"/><rect x="35" y="214" width="${dataWidth}" height="37" fill="#58a38d"/><text x="35" y="278" class="label">전송 ${num(dataTime, 2)}ns + 배분한 유휴 ${num(gapTime, 2)}ns</text><text x="35" y="315" class="label">전체 효율 = payload 효율 × 시간 이용률</text><text x="35" y="346" class="label">요청 묶음은 가상 서비스 단위이며 DRAM BL 변경이 아닙니다.</text>`, '유용한 데이터와 32바이트 접근 및 유휴 시간');
      }
      wire(['payload', 'offset', 'gap', 'pinrate', 'bundle'].map(id), updateBurst);
      function preset(values) { Object.keys(values).forEach(key => { $(id(key)).value = values[key]; $(id(key)).dispatchEvent(new Event('input')); }); }
      $(id('burst-aligned')).onclick = () => preset({ payload: 64, offset: 0, bundle: 1 });
      $(id('burst-small')).onclick = () => preset({ payload: 4, offset: 31, bundle: 1 });
      $(id('burst-bundle')).onclick = () => preset({ bundle: 16 });

      $(id('requestsize')).value = '64';
      let queuePackets = [], queueClock = 0, nextQueueId = 1, returned = 0, queuePlayer;
      function drawQueue(t) {
        queueClock = t;
        const latency = n('latency'), size = n('requestsize'), peak = n('peak'), q = n('window');
        const before = queuePackets.length;
        queuePackets = queuePackets.filter(packet => t - packet.start < latency);
        returned += before - queuePackets.length;
        const throughput = Math.min(peak, q * size / latency), need = Math.ceil(peak * latency / size);
        readStable(id('queue-read'), num(throughput, 2) + ' GB/s', `공급 상한 · 버스 충족에 ${need}개 요청 필요 · 진행 ${queuePackets.length} / ${q}개 · 반환 ${returned}개`);
        let dots = '';
        const group = Math.max(1, Math.ceil(queuePackets.length / 24));
        queuePackets.forEach((packet, i) => {
          if (i % group) return;
          const idx = Math.floor(i / group), y = 68 + idx % 8 * 25;
          const x = 60 + Math.max(0, Math.min(1, (t - packet.start) / latency)) * 470;
          dots += `<circle cx="${x}" cy="${y}" r="7" fill="${idx % 2 ? '#ba562c' : '#08645b'}"/><text x="${x - 8}" y="${y + 17}" style="font-size:9px">${group > 1 ? '×' + Math.min(group, queuePackets.length - i) : '#' + packet.key}</text>`;
        });
        let lanes = ''; for (let i = 0; i < 8; i++) lanes += `<path d="M60 ${68 + i * 25}H530" stroke="#c4d4be" stroke-dasharray="4 5"/>`;
        $('viz-16').innerHTML = diagram(`<text x="30" y="28">서비스 중인 요청 · 가상 시각 ${num(t, 0)} ns</text><text x="30" y="48" class="label">송출</text><text x="503" y="48" class="label">응답</text>${lanes}${dots}<text x="30" y="299" class="label">이동점은 요청의 경과 시간 · 버스 위 동시 bit 수가 아닙니다.</text><rect x="30" y="317" width="535" height="21" rx="3" fill="#c4d4be"/><rect x="30" y="317" width="${535 * throughput / peak}" height="21" rx="3" fill="#58a38d"/><text x="30" y="361" class="label">공급 상한 / 버스 상한 = ${num(throughput / peak * 100, 1)}% · 창을 채운 뒤 재생해 보세요.</text>`, '동시에 서비스 중인 요청과 대역폭 공급 상한');
      }
      queuePlayer = player($('viz-16'), drawQueue, 10, 'queue-play', 'queue-step', .09);
      function injectQueue(fill) {
        const slots = n('window') - queuePackets.length;
        const count = fill ? slots : Math.min(1, slots);
        for (let i = 0; i < count; i++) queuePackets.push({ start: queueClock, key: nextQueueId++ });
        queuePlayer.render();
      }
      $(id('queue-single')).onclick = () => injectQueue(false);
      $(id('queue-fill')).onclick = () => injectQueue(true);
      function resetQueue() { queuePackets = []; returned = 0; nextQueueId = 1; queuePlayer.pause(); queuePlayer.reset(); }
      $(id('queue-reset')).onclick = resetQueue;
      wire(['window', 'requestsize', 'latency', 'peak'].map(id), resetQueue);

      $('body-refresh').innerHTML = cards([
        ['셀 전하는 영구적이지 않다', '저장 전하가 누설되기 때문에 주기적인 복원이 필요합니다. retention time은 셀, 데이터 패턴, 전압, 온도 및 시간에 따라 달라질 수 있습니다. 평균 셀만으로 가장 약한 셀을 판단할 수 없습니다.'],
        ['tREFI와 tRFC', 'tREFI는 refresh 간격을, tRFC는 refresh 동작과 관련한 차단 시간을 설명할 때 사용하는 타이밍 용어입니다. 실제 값과 refresh 대상 범위는 세대·밀도·모드·온도 조건의 데이터시트를 확인해야 합니다.'],
        ['평균 손실과 순간 대기', '같은 평균 refresh 비율이라도 여러 뱅크를 동시에 멈추는지 분산하는지에 따라 순간적으로 서비스 가능한 자원이 다릅니다. 숨겨진 다른 대기까지 더해지므로 평균 대역폭 손실만으로 tail latency를 설명할 수 없습니다.']
      ]) + lesson('유지 동작을 스케줄링한다는 의미', '<p>리프레시를 수행하는 동안 대상 자원에서는 일반 접근을 바로 처리할 수 없습니다. 컨트롤러는 refresh 요구와 사용자 요청의 타이밍 제약을 모두 충족해야 합니다. 같은 스택 안에서도 정책과 자원 공유 범위에 따라 다른 요청이 진행할 수 있는 정도가 달라집니다.</p><p>아래 실험은 4개 가상 뱅크를 모두 동시에 멈추는 방식과 각 뱅크의 시작 시각을 분산하는 방식을 비교합니다. 비교의 공정성을 위해 각 뱅크가 같은 주기마다 같은 길이로 멈추게 했습니다. 실제 per-bank와 all-bank 모드는 타이밍 값이 같지 않을 수 있습니다.</p><p>온도가 오르면 필요한 refresh 정책이 바뀌어 대역폭에 영향을 줄 수 있습니다. 온도 조건을 따로 기록하지 않은 벤치마크는 동일 설정이어도 재현이 어려울 수 있습니다. 특정 제품의 85°C 같은 경계를 모든 HBM에 적용하지 마세요.</p>') +
      lab('14', 'refresh 차단을 함께 하거나 뱅크에 분산하기',
        range(id('interval'), '가상 refresh 주기', 1, 8, 4, .5, ' µs') +
        range(id('blocktime'), '각 뱅크의 차단 시간', .1, .8, .4, .1, ' µs') +
        select(id('refreshmode'), '뱅크 4개의 유지 동작 시작', [['all', '모든 뱅크가 함께 시작'], ['stagger', '주기를 4등분하여 순차 시작']]) +
        result(id('refresh-read')) + controls(button('refresh-play', '자동 재생') + button('refresh-step', '다음 0.1µs') + button('refresh-reset', '시각 초기화')),
        '4개 가상 뱅크의 주기와 차단 시간을 동일하게 둡니다. 숫자는 HBM 제품 사양이 아닙니다. 상한 손실은 뱅크당 차단 시간/주기이며 다른 뱅크의 요청이 충분하고 공유 버스는 병목이 없다고 가정합니다. 실제 refresh 행 순회·명령 제약·온도별 전환 임계점은 생략합니다.',
        '차단 0.4µs, 주기 4µs에서 두 정책의 평균 가용률은 모두 90%입니다. 재생하면서 순간적으로 모든 뱅크가 쉬는 상황의 차이를 관찰하세요.') +
      formula('가상 뱅크당 차단 비율 = t_block / interval · 동시에 모두 차단하면 순간 가용 뱅크 수 0 · 분산하면 시작 시각이 바뀌지만 총 뱅크-시간은 동일') +
      lesson('데이터 유지의 분포 · 왜 가장 약한 셀을 보는가?', '<p>동일한 온도에서도 모든 셀이 같은 시간 동안 데이터를 유지하지 않습니다. 일부 셀이 먼저 약해지는 꼬리 분포가 있기 때문에 신뢰성 조건은 평균 retention만으로 정할 수 없습니다. 아래 격자는 셀마다 다른 누설 상수를 주어 이 차이를 표현합니다.</p><p>센스 앰프의 실제 판정과 refresh 순회를 단순화해, 저장된 논리 1의 전하가 가상 임계값 아래로 내려가면 해당 셀을 약화로 표시합니다. 임계값과 누설 시간은 학습을 위해 만든 수치입니다. ECC가 표시한 오류 개수나 실제 제품 보존 시간을 예측하지 않습니다.</p>') +
      lab('17', '셀을 선택하고 전하의 감소와 복원 관찰하기',
        range(id('retentiontemp'), '가상 셀 온도', 25, 105, 55, 5, ' °C') +
        range(id('retentioninterval'), '가상 복원 간격', 4, 64, 32, 4, ' ms') +
        select(id('retentionmode'), '복원 정책', [['auto', '모든 셀 주기적으로 복원'], ['off', '복원을 끈 가상 비교']]) +
        result(id('retention-read')) + controls(button('retention-play', '자동 재생') + button('retention-step', '다음 2ms') + button('retention-restore', '선택 셀 복원') + button('retention-reset', '전체 초기화')) +
        `<p class="advm-instructions">오른쪽 셀을 클릭하거나 Tab/Enter로 선택하세요. 선택 셀의 전하를 확인하고 ‘선택 셀 복원’을 눌러 비교합니다.</p><div class="advm-matrix-readout" id="${id('retention-detail')}" aria-live="polite"></div>`,
        '64개 논리 1 셀의 Q(t)=exp(−t/τ) 가상 모델입니다. 55°C 기준 τ=35~94ms, 10°C 상승 시 τ를 약 √2로 나누는 임의 관계를 사용합니다. 약화 임계값 0.5, 온도 관계, 전체 동시 복원과 자동 복원 시 이상적 데이터 회복은 실제 HBM 동작이 아닙니다. 온도 변경 시 실험을 초기화합니다.',
        '자동 복원을 끄고 온도를 55→95°C로 바꾼 뒤 단계 진행을 해 보세요. 평균 전하가 높아도 일부 셀이 먼저 약해집니다. 임계값 아래로 떨어진 실물 데이터를 refresh만으로 회복할 수 있다고 결론내리지 마세요.') +
      task('측정 중 HBM 온도, refresh 설정, refresh 명령 수와 측정 구간을 함께 남기세요. 오류가 나면 전원·속도·주소 패턴·온도별 재현을 확인하고 유지 시간과 링크 오류를 구분하는 가설을 세우세요.') +
      source('https://www.synopsys.com/designware-ip/interface-ip/hbm/hbm3-controller.html', 'Synopsys HBM3 controller · autonomous per-bank/all-bank refresh') +
      source('https://docs.amd.com/r/en-US/xapp1377-heatsinks-thermal/Obtaining-Thermal-and-Power-Targets-to-use-with-Thermal-Simulation', 'AMD HBM 열 설계 · 온도와 refresh의 대역폭 영향');

      let refreshPlayer;
      function drawRefresh(t) {
        const period = n('interval'), blocked = n('blocktime'), stagger = val('refreshmode') === 'stagger';
        const now = t % (period * 2), available = Array.from({ length: 4 }, (_, bank) => {
          const offset = stagger ? bank * period / 4 : 0;
          return ((now - offset) % period + period) % period >= blocked;
        });
        readStable(id('refresh-read'), num((1 - blocked / period) * 100, 1) + '% 평균 가용', `현재 ${available.filter(Boolean).length}/4개 뱅크 가용 · 가상 시간 ${num(now, 2)}µs · 전체 평균은 두 정책 동일`);
        const scale = 480 / (period * 2), x = 80 + now * scale;
        let timeline = '';
        for (let bank = 0; bank < 4; bank++) {
          const y = 76 + bank * 55, offset = stagger ? bank * period / 4 : 0;
          timeline += `<text x="14" y="${y + 20}">Bank ${bank}</text><rect x="80" y="${y}" width="480" height="30" rx="3" fill="#c4d4be"/>`;
          for (let rep = -1; rep <= 2; rep++) {
            const start = offset + rep * period, left = Math.max(0, start), right = Math.min(period * 2, start + blocked);
            if (right > left) timeline += `<rect x="${80 + left * scale}" y="${y}" width="${(right - left) * scale}" height="30" fill="#ba562c"/>`;
          }
          timeline += `<circle cx="574" cy="${y + 15}" r="7" fill="${available[bank] ? '#08645b' : '#ba562c'}"/>`;
        }
        $('viz-14').innerHTML = diagram(`<text x="80" y="27">0</text><text x="306" y="27">${period}µs</text><text x="518" y="27">${period * 2}µs</text>${timeline}<path d="M${x} 47V288" stroke="#183c39" stroke-width="2"/><text x="80" y="327" class="label">초록 영역: 일반 접근 가능 · 주황 영역: 유지 동작 차단</text><text x="80" y="354" class="label">검은 커서: 현재 시각 · 오른쪽 점: 뱅크별 현재 상태</text>`, '4개 뱅크의 리프레시 차단 타임라인');
      }
      refreshPlayer = player($('viz-14'), drawRefresh, .1, 'refresh-play', 'refresh-step', .0012);
      wire(['interval', 'blocktime', 'refreshmode'].map(id), () => refreshPlayer.reset());
      $(id('refresh-reset')).onclick = () => { refreshPlayer.pause(); refreshPlayer.reset(); };

      let selectedCell = 0, lastRestore = Array(64).fill(0), retentionClock = 0, retentionPlayer;
      function cellTau(cell) { return (35 + ((cell * 29 + 11) % 60)) / Math.pow(2, (n('retentiontemp') - 55) / 20); }
      function drawRetention(t) {
        retentionClock = t;
        const interval = n('retentioninterval'), auto = val('retentionmode') === 'auto';
        const epoch = auto ? Math.floor(t / interval) * interval : 0;
        const ages = lastRestore.map(manual => t - Math.max(manual, epoch));
        const charges = ages.map((age, i) => Math.exp(-age / cellTau(i)));
        const weak = charges.filter(q => q < .5).length;
        readStable(id('retention-read'), weak + ' / 64 셀 약화', `가상 임계값 Q<0.5 · 평균 Q=${num(charges.reduce((a, b) => a + b, 0) / 64, 2)} · 시각 ${num(t, 0)}ms`);
        let cells = '';
        charges.forEach((charge, cell) => {
          const x = 57 + cell % 8 * 62, y = 37 + Math.floor(cell / 8) * 37;
          cells += `<g class="advm-click" role="button" tabindex="0" data-advm-cell="${cell}" aria-label="셀 ${cell}, 전하 ${num(charge, 2)}, 선택하기"><rect x="${x}" y="${y}" width="50" height="28" rx="4" fill="${charge < .5 ? '#ba562c' : '#58a38d'}" fill-opacity="${.25 + .75 * charge}" stroke="${cell === selectedCell ? '#ba562c' : '#799e8c'}" stroke-width="${cell === selectedCell ? 3 : 1}"/><text x="${x + 7}" y="${y + 18}" style="font-size:11px">${num(charge, 2)}</text></g>`;
        });
        $('viz-17').innerHTML = diagram(`${cells}<text x="57" y="350" class="label">가상 Q: 1=복원 직후 · 0.5 미만은 주황색 · 선택 셀은 굵은 테두리</text>`, '64개 가상 DRAM 셀의 전하와 유지 시간 분포');
        $(id('retention-detail')).textContent = `선택 셀 #${selectedCell}: τ=${num(cellTau(selectedCell), 1)}ms · 복원 후 ${num(ages[selectedCell], 1)}ms · Q=${num(charges[selectedCell], 3)}. 이 셀의 가상 임계값 도달 시간 τ×ln2=${num(cellTau(selectedCell) * Math.LN2, 1)}ms.`;
      }
      retentionPlayer = player($('viz-17'), drawRetention, 2, 'retention-play', 'retention-step', .008);
      function resetRetention() { lastRestore = Array(64).fill(0); retentionPlayer.pause(); retentionPlayer.reset(); }
      wire(['retentiontemp', 'retentioninterval', 'retentionmode'].map(id), resetRetention);
      $(id('retention-reset')).onclick = resetRetention;
      $(id('retention-restore')).onclick = () => { lastRestore[selectedCell] = retentionClock; retentionPlayer.render(); };
      function chooseCell(event) { const el = event.target.closest('[data-advm-cell]'); if (el) { selectedCell = +el.dataset.advmCell; retentionPlayer.pause(); retentionPlayer.render(); return true; } return false; }
      $('viz-17').onclick = chooseCell;
      $('viz-17').onkeydown = event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); if (chooseCell(event)) { const next = $('viz-17').querySelector(`[data-advm-cell="${selectedCell}"]`); if (next) next.focus(); } } };

      $('body-signal').innerHTML = cards([
        ['아이 다이어그램 · Eye', '같은 기준 시간에 많은 비트 구간을 겹친 파형입니다. 가로의 여유는 샘플링 시간, 세로의 여유는 판정 전압과 연결됩니다. 열린 눈 모양만으로 프로토콜·논리 동작이 맞는지는 알 수 없습니다.'],
        ['지터·잡음·ISI', '지터는 에지 시각의 흔들림, 잡음은 전압의 흔들림입니다. 느린 상승/하강과 이전 비트의 영향인 ISI가 여유를 줄일 수도 있습니다. 비슷한 눈 모양이 서로 다른 원인에서 나올 수 있습니다.'],
        ['PHY와 트레이닝', 'PHY는 실제 전기 인터페이스를 다루고 트레이닝은 타이밍과 판정 조건을 맞춥니다. DQ별 skew·전압·온도 변화·전원 잡음·측정 위치를 함께 봅니다. 정상 트레이닝이 모든 동작 조건의 안정성을 보증하지 않습니다.']
      ]) + lesson('병렬 HBM에서도 한 비트의 여유를 읽기', '<p>데이터 핀 전송률이 8Gbit/s이면 1 UI(Unit Interval)는 125ps입니다. UI는 비트 시간 간격이며 명령 클록 주기와 같은 용어가 아닙니다. 아래 그림은 절대 전압 대신 정규화한 신호 레벨, 가로축에는 UI를 사용합니다.</p><p>수신기는 특정 시각에 기준 전압보다 높은지 낮은지로 논리 값을 판정합니다. 시간 여유와 전압 여유가 모두 필요하기 때문에 화면의 중앙이 항상 최적 판정점은 아닐 수 있습니다. 상승/하강 비대칭, 기준 신호와 DQ의 skew, 레벨 비대칭을 같이 확인합니다.</p><p>아이 다이어그램의 밀도는 수집한 샘플에 의존합니다. 드물게 나타나는 오류를 짧은 화면 한 장에서 찾지 못할 수 있습니다. 장비 대역폭, probe loading, deskew와 trigger/reference 방법이 측정 결과를 바꿀 수 있으며 BER 판단에는 표준의 조건과 충분한 통계가 필요합니다.</p>') +
      lab('15', '지터와 잡음이 닫는 눈 · 샘플링 위치 직접 찾기',
        range(id('jitter'), '가상 bounded 지터', 0, .3, .04, .01, ' UI') +
        range(id('noise'), '가상 bounded 전압 잡음', 0, .4, .05, .01, ' 레벨') +
        range(id('rise'), '상승·하강 전이 폭', .05, .5, .15, .01, ' UI') +
        range(id('sampletime'), '판정 시각', .1, .9, .5, .01, ' UI') +
        range(id('threshold'), '판정 전압 · 정규화', .1, .9, .5, .01, ' 레벨') +
        result(id('eye-read')) + controls(button('eye-clean', '깨끗한 신호') + button('eye-jitter', '지터 악화') + button('eye-noise', '잡음 악화') + button('eye-capture', '새 파형 48개 겹치기') + button('eye-center', '판정점 중앙')) +
        '<p class="advm-instructions">오른쪽 파형 안을 클릭하면 판정점이 이동합니다. 키보드 사용자는 판정 시각/전압 슬라이더를 조절하세요. 캡처마다 다른 재현 가능한 파형 묶음을 표시합니다.</p>',
        '하나의 NRZ DQ 파형을 가정하고 bounded 지터·bounded 잡음·선형 에지를 합성합니다. HBM PHY 전압, 실제 transfer function, DQS/WCK/CK 관계, crosstalk·ISI·random-jitter tail·BER는 재현하지 않습니다. 가로/세로 여유는 이 합성 파형의 보수적 기하 값으로 규격 pass/fail 판정이 아닙니다.',
        '지터만 높인 경우와 잡음만 높인 경우를 비교하세요. 눈이 가로와 세로에서 각각 어떻게 좁아지는지 보고 판정점을 옮겨 여유가 줄어드는 위치를 찾으세요.') +
      formula('8Gbit/s → UI = 1 / (8×10⁹) = 125ps · 교육용 보수 여유: 시간 = min(t, 1−t) − 지터 − 전이 폭/2 · 전압 = min(Vth, 1−Vth) − 잡음') +
      lesson('측정 결과를 리뷰할 때의 질문', '<p>첫째, 측정 위치가 송신기인지 수신기인지 확인합니다. 둘째, timing reference와 deskew 조건이 실제 수신기의 관점에 맞는지 확인합니다. 셋째, 동일한 핀 속도에서 전압·온도·pattern과 캡처 길이를 통제합니다. 한 lane만 보고 나머지 1023개 데이터 선의 상태를 확정하지 않습니다.</p><p>마스크에 닿지 않았다는 결과와 목표 BER을 만족했다는 결과는 다른 증거입니다. 발생률이 매우 낮은 오류는 더 긴 시간이나 적합한 통계 모델이 필요합니다. 이 실험은 교육용 합성 그림이므로 제품의 합격 여부 또는 오류율을 산출하지 않습니다.</p>') +
      task('DQ별 여유, skew, 기준 전압, 온도·전원 조건, 트레이닝 성공 기록과 반복 측정을 남기세요. 오류 위치가 특정 채널/비트에 고정되는지, 속도·전압·온도 변경 시 달라지는지 비교하여 원인 가설을 검증하세요.') +
      source('https://www.tek.com/en/documents/application-note/anatomy-eye-diagram', 'Tektronix · 아이 다이어그램의 구성과 판정점') +
      source('https://www.tek.com/en/documents/application-note/using-mixed-signal-oscilloscopes-to-find-and-diagnose-jitter-caused-by-power-integrity-problems', 'Tektronix · 지터·잡음 관찰과 mask test의 한계') +
      source('https://www.synopsys.com/designware-ip/interface-ip/hbm/hbm3-phy.html', 'Synopsys · HBM3 PHY의 training 기능');

      let eyeCapture = 0;
      function random(seed) { let state = seed >>> 0; return () => { state = (state * 1664525 + 1013904223) >>> 0; return state / 4294967296; }; }
      function drawEye() {
        const jitter = n('jitter'), noise = n('noise'), rise = n('rise'), sample = n('sampletime'), threshold = n('threshold');
        const width = Math.max(0, 1 - 2 * jitter - rise), height = Math.max(0, 1 - 2 * noise);
        const timeMargin = Math.min(sample, 1 - sample) - jitter - rise / 2;
        const voltageMargin = Math.min(threshold, 1 - threshold) - noise;
        readStable(id('eye-read'), `${num(width, 2)} UI × ${num(height, 2)}`, `합성 보수 눈 크기 · 선택점 시간 여유 ${num(timeMargin, 2)}UI · 전압 여유 ${num(voltageMargin, 2)} · ${timeMargin > 0 && voltageMargin > 0 ? '가상 여유 영역 안' : '가상 여유가 사라진 위치'}`);
        const x = t => 55 + (t + .5) / 2 * 490, y = voltage => 297 - voltage * 218;
        let paths = '', grid = '';
        for (let i = 0; i <= 4; i++) grid += `<path d="M${55 + i * 122.5} 42V310 M55 ${42 + i * 67}H545" stroke="#adc4b7" opacity=".45"/>`;
        for (let trace = 0; trace < 48; trace++) {
          const rng = random(817 + eyeCapture * 937 + trace * 113), pattern = [rng() > .5 ? 1 : 0, rng() > .5 ? 1 : 0, rng() > .5 ? 1 : 0];
          const edge0 = (rng() * 2 - 1) * jitter, edge1 = 1 + (rng() * 2 - 1) * jitter;
          const noisePhase = rng() * 8, levelShift = (rng() * 2 - 1) * noise * .7;
          const points = [];
          for (let step = 0; step <= 140; step++) {
            const t = -.5 + step / 70;
            let voltage = pattern[0];
            voltage += (pattern[1] - pattern[0]) * Math.max(0, Math.min(1, (t - edge0) / rise + .5));
            voltage += (pattern[2] - pattern[1]) * Math.max(0, Math.min(1, (t - edge1) / rise + .5));
            voltage += levelShift + Math.sin(t * 13 + noisePhase) * noise * .3;
            points.push(`${step ? 'L' : 'M'}${x(t).toFixed(2)} ${y(voltage).toFixed(2)}`);
          }
          paths += `<path d="${points.join(' ')}" fill="none" stroke="${trace % 3 ? '#08645b' : '#ba562c'}" stroke-width="1.15" opacity=".20"/>`;
        }
        const sx = x(sample), sy = y(threshold);
        const ew = Math.max(0, 1 - 2 * (jitter + rise / 2)), ey = Math.max(0, 1 - 2 * noise);
        $('viz-15').innerHTML = diagram(`<defs><clipPath id="advm-eye-clip"><rect x="55" y="42" width="490" height="268"/></clipPath></defs>${grid}<g clip-path="url(#advm-eye-clip)"><rect x="${x(jitter + rise / 2)}" y="${y(1 - noise)}" width="${ew * 245}" height="${ey * 218}" fill="#ccf292" opacity=".17"/>${paths}</g><path d="M${sx} 42V310 M55 ${sy}H545" stroke="#ba562c" stroke-dasharray="5 4"/><circle cx="${sx}" cy="${sy}" r="7" fill="#ba562c"/><text x="58" y="24">합성 DQ 아이 · 캡처 ${eyeCapture + 1} / 48 traces</text><text x="8" y="82" class="label">1</text><text x="8" y="191" class="label">0.5</text><text x="8" y="301" class="label">0</text><text x="170" y="334" class="label">0 UI</text><text x="294" y="334" class="label">0.5 UI</text><text x="418" y="334" class="label">1 UI</text><text x="58" y="365" class="label">화면을 클릭하여 판정점 이동 · 제품 규격 판정용 아님</text>`, '지터와 잡음을 겹친 아이 다이어그램 및 클릭 가능한 판정점');
      }
      wire(['jitter', 'noise', 'rise', 'sampletime', 'threshold'].map(id), drawEye);
      $(id('eye-clean')).onclick = () => preset({ jitter: .02, noise: .02, rise: .1 });
      $(id('eye-jitter')).onclick = () => preset({ jitter: .25, noise: .02, rise: .15 });
      $(id('eye-noise')).onclick = () => preset({ jitter: .02, noise: .35, rise: .15 });
      $(id('eye-capture')).onclick = () => { eyeCapture++; drawEye(); };
      $(id('eye-center')).onclick = () => preset({ sampletime: .5, threshold: .5 });
      $('viz-15').onclick = event => {
        const picture = $('viz-15').querySelector('svg');
        if (!picture || !picture.getScreenCTM()) return;
        const point = picture.createSVGPoint(); point.x = event.clientX; point.y = event.clientY;
        const where = point.matrixTransform(picture.getScreenCTM().inverse());
        if (where.x < 55 || where.x > 545 || where.y < 42 || where.y > 310) return;
        const t = Math.max(.1, Math.min(.9, (where.x - 55) / 245 - .5));
        const threshold = Math.max(.1, Math.min(.9, (297 - where.y) / 218));
        preset({ sampletime: Math.round(t * 100) / 100, threshold: Math.round(threshold * 100) / 100 });
      };
    }
  });
})();
