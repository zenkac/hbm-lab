import * as THREE from './vendor/three.module.js';
import { OrbitControls } from './vendor/OrbitControls.js';

// Illustrative package geometry. Pad counts, dimensions and routing are a visual
// sampling, not a JEDEC pin map, a production layout or a mechanical drawing.
export function createPackageScene(host, onSelect = () => {}) {
  if (!host || !host.appendChild) throw new TypeError('3D 장면을 담을 HTML 요소가 필요합니다.');
  const PARTS = ['gpu', 'dram', 'base', 'tsv', 'bump', 'interposer', 'substrate'];
  const names = { gpu: 'GPU / 가속기', dram: 'DRAM 다이', base: '베이스 다이', tsv: 'TSV', bump: '다이 간 접합', interposer: '실리콘 인터포저', substrate: '패키지 기판' };
  let state = { layers: 8, generation: 'hbm3e', bonding: 'microbump', explode: 0, tsv: true, flow: true, labels: true, autoRotate: false, view: 'package', selected: null };
  let disposed = false, visible = false, contextLost = false, frame = 0, lastFrame = 0, renderedFrames = 0;
  let dirty = true, explodeCurrent = 0, hovered = null, pointerDown = null, viewTween = null;
  let width = 1, height = 1, elapsed = 0, sceneRevision = 0;
  let previousPackageFit = 1.2;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const scene = new THREE.Scene();
  scene.background = null;
  scene.fog = new THREE.Fog(0xf3edfc, 38, 85);
  const camera = new THREE.PerspectiveCamera(42, 1, .1, 110);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  if (!renderer.getContext()) { renderer.dispose(); throw new Error('WebGL을 사용할 수 없습니다.'); }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const canvas = renderer.domElement;
  canvas.className = 'pkg-webgl-canvas';
  canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:none;outline:none;';
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', '회전하고 확대할 수 있는 HBM과 GPU의 3D 패키지. 부품 라벨 버튼으로 설명을 선택할 수 있습니다.');
  host.appendChild(canvas);

  const labelsLayer = document.createElement('div');
  labelsLayer.className = 'pkg-label-layer';
  labelsLayer.style.cssText = 'position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:2;';
  const svgNS = 'http://www.w3.org/2000/svg';
  const leaders = document.createElementNS(svgNS, 'svg');
  leaders.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none;';
  leaders.setAttribute('aria-hidden', 'true');
  labelsLayer.appendChild(leaders);
  const labelNodes = new Map(), leaderNodes = new Map();
  for (const key of PARTS) {
    const line = document.createElementNS(svgNS, 'path');
    line.setAttribute('fill', 'none'); line.setAttribute('stroke', '#7caaa2'); line.setAttribute('stroke-width', '1.1'); line.setAttribute('opacity', '.68');
    leaders.appendChild(line); leaderNodes.set(key, line);
    const label = document.createElement('button');
    label.type = 'button'; label.className = 'pkg-scene-label'; label.dataset.part = key;
    label.textContent = names[key]; label.setAttribute('aria-label', names[key] + '의 구조 설명 보기');
    label.style.cssText = 'position:absolute;pointer-events:auto;white-space:nowrap;max-width:160px;font-family:inherit;font-size:12px;font-weight:600;line-height:1.45;color:#174941;background:rgba(255,255,255,.94);border:1px solid #b7d1c7;border-radius:6px;padding:6px 10px;box-shadow:0 2px 9px #154a3510;cursor:pointer;';
    label.addEventListener('click', () => choose(key, { type: 'select', origin: 'label' }));
    label.addEventListener('mouseenter', () => setHover(key));
    label.addEventListener('mouseleave', () => setHover(null));
    labelsLayer.appendChild(label); labelNodes.set(key, label);
  }
  host.appendChild(labelsLayer);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.dampingFactor = .085;
  controls.enablePan = false; controls.rotateSpeed = .65; controls.zoomSpeed = .78;
  controls.minDistance = 3.2; controls.maxDistance = 46;
  controls.minPolarAngle = .08; controls.maxPolarAngle = Math.PI * .47;
  controls.autoRotateSpeed = .75;
  const onControlChange = () => invalidate();
  const onControlStart = () => { viewTween = null; invalidate(); };
  controls.addEventListener('change', onControlChange);
  controls.addEventListener('start', onControlStart);

  const ambient = new THREE.HemisphereLight(0xffffff, 0xb6c9c4, 2.2); scene.add(ambient);
  const keyLight = new THREE.DirectionalLight(0xfffbef, 4.0);
  keyLight.position.set(7, 15, 10); keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  Object.assign(keyLight.shadow.camera, { left: -11, right: 11, top: 11, bottom: -11, near: .5, far: 38 });
  keyLight.shadow.bias = -.00025; keyLight.shadow.normalBias = .045;
  keyLight.target.position.set(0, 1.5, 0); scene.add(keyLight, keyLight.target);
  const fillLight = new THREE.DirectionalLight(0xd4edf6, 2.0); fillLight.position.set(-8, 8, -6); scene.add(fillLight);
  const rimLight = new THREE.DirectionalLight(0xffffff, 1.5); rimLight.position.set(1, 10, -12); scene.add(rimLight);
  const groundGeometry = new THREE.PlaneGeometry(100, 100);
  const groundMaterial = new THREE.ShadowMaterial({ color: 0x797aab, opacity: .18 });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial); ground.rotation.x = -Math.PI / 2; ground.position.y = .03; ground.receiveShadow = true; scene.add(ground);
  const grid = new THREE.GridHelper(26, 26, 0xc7c4e6, 0xdbe2f3); grid.position.y = .038;
  grid.material.transparent = true; grid.material.opacity = .27; scene.add(grid);

  // A procedural, softly lit studio environment supplies reflections to copper
  // and polished die edges without downloading images or using a remote service.
  const studio = new THREE.Scene();
  const studioItems = [];
  function studioBox(size, position, rgb) {
    const geometry = new THREE.BoxGeometry(...size);
    const material = new THREE.MeshBasicMaterial({ color: new THREE.Color(...rgb), side: THREE.DoubleSide });
    const box = new THREE.Mesh(geometry, material); box.position.set(...position); studio.add(box); studioItems.push(box);
  }
  studioBox([30, 30, 30], [0, 0, 0], [.78, .83, .80]);
  studioBox([11, 1, 9], [0, 10, 0], [2.4, 2.4, 2.25]);
  studioBox([1, 8, 12], [11, 3, 0], [2.0, 2.15, 2.3]);
  studioBox([8, 6, 1], [-5, 3, -10], [1.4, 1.7, 1.6]);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(studio, .03); scene.environment = environment.texture;
  pmrem.dispose(); studioItems.forEach(mesh => { mesh.geometry.dispose(); mesh.material.dispose(); });

  const model = new THREE.Group(); scene.add(model);
  let modelGeometries = new Set(), modelMaterials = new Set(), modelTextures = new Set();
  let partMaterials = new Map(), partEdges = new Map(), picks = [], stacks = [], routes = [], anchors = {};
  let substrate, interposer, gpu, c4, stackCarrier, horizontalFlow, verticalFlow;
  let dimensions = {}, gpuTopTexture, tsvCount = 0, bondCount = 0;
  const dummy = new THREE.Object3D();
  const projected = new THREE.Vector3();
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const colorSelected = new THREE.Color(0x369981), colorHover = new THREE.Color(0x286e61);

  function ownGeometry(geometry) { modelGeometries.add(geometry); return geometry; }
  function ownMaterial(material, part) {
    modelMaterials.add(material);
    if (material.emissive) {
      material.userData.pkgEmission = material.emissive.clone();
      material.userData.pkgEmissionStrength = material.emissiveIntensity || 0;
    }
    if (part) { if (!partMaterials.has(part)) partMaterials.set(part, []); partMaterials.get(part).push(material); }
    return material;
  }
  function material(part, options) { return ownMaterial(new THREE.MeshPhysicalMaterial({ roughness: .35, metalness: .22, ...options }), part); }
  function tag(object, part, detail = {}) { object.userData = { ...object.userData, part, ...detail }; picks.push(object); return object; }
  function roundedBox(w, h, d, radius = .04) {
    const r = Math.min(radius, h * .35, w * .08, d * .08), x = (w - 2 * r) / 2, z = (d - 2 * r) / 2;
    const rr = Math.min(r, x * .35, z * .35);
    const shape = new THREE.Shape();
    shape.moveTo(-x + rr, -z); shape.lineTo(x - rr, -z); shape.quadraticCurveTo(x, -z, x, -z + rr);
    shape.lineTo(x, z - rr); shape.quadraticCurveTo(x, z, x - rr, z);
    shape.lineTo(-x + rr, z); shape.quadraticCurveTo(-x, z, -x, z - rr);
    shape.lineTo(-x, -z + rr); shape.quadraticCurveTo(-x, -z, -x + rr, -z);
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: Math.max(.004, h - 2 * r), bevelEnabled: true, bevelThickness: r, bevelSize: r, bevelSegments: 3, curveSegments: 5, steps: 1 });
    geometry.rotateX(-Math.PI / 2); geometry.center(); geometry.computeVertexNormals();
    return ownGeometry(geometry);
  }
  function makeBox(geometry, mat, part, parent = model, detail = {}) {
    const mesh = new THREE.Mesh(geometry, mat); mesh.castShadow = true; mesh.receiveShadow = true;
    if (part) tag(mesh, part, detail); parent.add(mesh); return mesh;
  }
  function edge(geometry, part, parent, color = 0x437c75, opacity = .54) {
    const outlineGeometry = ownGeometry(new THREE.EdgesGeometry(geometry, 26));
    const outlineMaterial = ownMaterial(new THREE.LineBasicMaterial({ color, transparent: true, opacity }));
    const outline = new THREE.LineSegments(outlineGeometry, outlineMaterial); parent.add(outline);
    if (!partEdges.has(part)) partEdges.set(part, []);
    partEdges.get(part).push({ material: outlineMaterial, original: outlineMaterial.color.clone() });
    return outline;
  }
  function drawChipTexture() {
    const image = document.createElement('canvas'); image.width = 1024; image.height = 1024;
    const paint = image.getContext('2d');
    if (!paint) return null;
    const gradient = paint.createLinearGradient(0, 0, 1024, 1024); gradient.addColorStop(0, '#7561a5'); gradient.addColorStop(.5, '#4d567f'); gradient.addColorStop(1, '#617aaa');
    paint.fillStyle = gradient; paint.fillRect(0, 0, 1024, 1024);
    paint.strokeStyle = '#57968d'; paint.lineWidth = 2;
    for (let y = 70; y < 960; y += 94) for (let x = 60; x < 960; x += 95) {
      paint.strokeRect(x, y, 70, 70); paint.fillStyle = (x + y) % 3 ? '#164750' : '#245e61'; paint.fillRect(x + 8, y + 8, 54, 54);
      paint.fillStyle = '#51897c'; for (let j = 0; j < 4; j++) paint.fillRect(x + 12 + j * 14, y + 17, 5, 36);
    }
    paint.fillStyle = '#4b4b75'; paint.fillRect(180, 385, 666, 248);
    paint.strokeStyle = '#d1c1e7'; paint.lineWidth = 2; paint.strokeRect(190, 395, 646, 228);
    paint.fillStyle = '#fff5ea'; paint.font = '700 104px sans-serif'; paint.textAlign = 'center'; paint.fillText('GPU', 512, 508);
    paint.fillStyle = '#d0e5fa'; paint.font = '500 27px sans-serif'; paint.fillText('ACCELERATOR · COMPUTE DIE', 512, 566);
    const texture = new THREE.CanvasTexture(image); texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy()); modelTextures.add(texture); return texture;
  }
  function makeTrace(points, color, opacity = .6) {
    const geometry = ownGeometry(new THREE.BufferGeometry().setFromPoints(points));
    const mat = ownMaterial(new THREE.LineBasicMaterial({ color, transparent: true, opacity }));
    const line = new THREE.Line(geometry, mat); model.add(line); return line;
  }
  function disposeModel() {
    model.clear(); modelGeometries.forEach(item => item.dispose()); modelMaterials.forEach(item => item.dispose()); modelTextures.forEach(item => item.dispose());
    modelGeometries = new Set(); modelMaterials = new Set(); modelTextures = new Set();
    partMaterials = new Map(); partEdges = new Map(); picks = []; stacks = []; routes = []; anchors = {};
  }
  function build() {
    disposeModel(); sceneRevision++;
    const gen4 = state.generation === 'hbm4', hybrid = state.bonding === 'hybrid';
    dimensions = { stackW: gen4 ? 2.66 : 2.5, stackD: gen4 ? 2.06 : 1.96, dieH: .145, bondGap: hybrid ? .026 : .048, padN: hybrid ? 8 : 7, tsvN: 6 };
    const pcbMaterial = material('substrate', { color: 0x94c9be, metalness: .22, roughness: .42, clearcoat: .18 });
    substrate = makeBox(roundedBox(14, .61, 10.1, .09), pcbMaterial, 'substrate');
    substrate.position.set(0, .68, 0); edge(substrate.geometry, 'substrate', substrate, 0x466e5e, .55);
    const layerGeometry = ownGeometry(new THREE.BoxGeometry(13.9, .027, 10));
    const pcbLayerMaterial = material('substrate', { color: 0xf0d7b4, roughness: .55, metalness: .18 });
    for (let y = -.17; y <= .18; y += .12) { const mesh = makeBox(layerGeometry, pcbLayerMaterial, 'substrate', substrate); mesh.position.y = y; }
    const interposerMaterial = material('interposer', { color: 0xbbd2ed, roughness: .3, metalness: .42, clearcoat: .32 });
    interposer = makeBox(roundedBox(12.9, .27, 8.75, .035), interposerMaterial, 'interposer');
    edge(interposer.geometry, 'interposer', interposer, 0x78a99b, .7);

    const c4Geometry = ownGeometry(new THREE.SphereGeometry(.117, 10, 8));
    const c4Material = material('interposer', { color: 0xc1c8c4, roughness: .23, metalness: .92 });
    c4 = tag(new THREE.InstancedMesh(c4Geometry, c4Material, 19 * 13), 'interposer', { subpart: 'C4' });
    c4.castShadow = true; c4.receiveShadow = true; model.add(c4);
    for (let i = 0; i < 19 * 13; i++) {
      dummy.position.set((i % 19 - 9) * .61, 0, (Math.floor(i / 19) - 6) * .61); dummy.scale.set(1, .88, 1); dummy.rotation.set(0, 0, 0); dummy.updateMatrix(); c4.setMatrixAt(i, dummy.matrix);
    }
    c4.instanceMatrix.needsUpdate = true; c4.computeBoundingSphere();

    gpu = new THREE.Group(); model.add(gpu);
    const gpuMaterial = material('gpu', { color: 0x62658e, roughness: .19, metalness: .62, clearcoat: .42, clearcoatRoughness: .16 });
    const gpuBody = makeBox(roundedBox(4.85, .48, 4.55, .065), gpuMaterial, 'gpu', gpu);
    edge(gpuBody.geometry, 'gpu', gpuBody, 0x527f83, .72);
    const gpuFrameMaterial = material('gpu', { color: 0xd7cbe7, roughness: .23, metalness: .88 });
    const gpuFrame = makeBox(roundedBox(4.61, .045, 4.30, .012), gpuFrameMaterial, 'gpu', gpu); gpuFrame.position.y = .254;
    gpuTopTexture = drawChipTexture();
    const topMaterial = material('gpu', { color: 0xffffff, map: gpuTopTexture, roughness: .3, metalness: .26, clearcoat: .2 });
    const top = makeBox(ownGeometry(new THREE.PlaneGeometry(4.43, 4.12)), topMaterial, 'gpu', gpu); top.rotation.x = -Math.PI / 2; top.position.y = .283; top.castShadow = false;

    const baseGeometry = roundedBox(dimensions.stackW + .075, .23, dimensions.stackD + .075, .026);
    const dramGeometry = roundedBox(dimensions.stackW, dimensions.dieH, dimensions.stackD, .018);
    const baseMaterial = material('base', { color: 0x6d87af, metalness: .47, roughness: .24, clearcoat: .35 });
    const dramMaterial = material('dram', { color: gen4 ? 0x92bedf : 0xb6a2d8, metalness: .12, roughness: .27, clearcoat: .35, transparent: true, opacity: .56, depthWrite: false, side: THREE.FrontSide });
    const dramCapMaterial = material('dram', { color: gen4 ? 0xb9d9f2 : 0xddcff0, metalness: .25, roughness: .30, transparent: true, opacity: .46, depthWrite: false });
    const capGeometry = ownGeometry(new THREE.PlaneGeometry(dimensions.stackW - .10, dimensions.stackD - .10));
    const tsvGeometry = ownGeometry(new THREE.CylinderGeometry(.028, .028, 1, 8));
    const tsvMaterial = material('tsv', { color: 0xb86d2e, metalness: .42, roughness: .33, emissive: 0x632604, emissiveIntensity: .16, transparent: false, opacity: 1 });
    const padGeometry = ownGeometry(hybrid ? new THREE.CylinderGeometry(.028, .028, .025, 9) : new THREE.SphereGeometry(.036, 8, 6));
    const padMaterial = material('bump', { color: hybrid ? 0xc97537 : 0xe1a62f, metalness: .30, roughness: .31, emissive: hybrid ? 0x652305 : 0x684305, emissiveIntensity: .16, transparent: false, opacity: 1 });
    const coordinates = [[-4.35, -2.28], [-4.35, 2.28], [4.35, -2.28], [4.35, 2.28]];
    tsvCount = 4 * state.layers * dimensions.tsvN ** 2;
    bondCount = 4 * state.layers * dimensions.padN ** 2;
    coordinates.forEach(([x, z], stackIndex) => {
      const group = new THREE.Group(); group.position.set(x, 0, z); model.add(group);
      const base = makeBox(baseGeometry, baseMaterial, 'base', group, { stack: stackIndex });
      edge(baseGeometry, 'base', base, 0x6a9398, .75);
      const dies = [];
      for (let layer = 0; layer < state.layers; layer++) {
        const holder = new THREE.Group(); group.add(holder);
        const die = makeBox(dramGeometry, dramMaterial, 'dram', holder, { stack: stackIndex, layer });
        edge(dramGeometry, 'dram', die, gen4 ? 0x546d94 : 0x487e79, .55);
        const cap = makeBox(capGeometry, dramCapMaterial, 'dram', holder, { stack: stackIndex, layer }); cap.rotation.x = -Math.PI / 2; cap.position.y = dimensions.dieH / 2 + .002; cap.castShadow = false;
        dies.push(holder);
      }
      const tsv = tag(new THREE.InstancedMesh(tsvGeometry, tsvMaterial, state.layers * dimensions.tsvN ** 2), 'tsv', { stack: stackIndex });
      const pads = tag(new THREE.InstancedMesh(padGeometry, padMaterial, state.layers * dimensions.padN ** 2), 'bump', { stack: stackIndex });
      tsv.castShadow = false; pads.castShadow = false; tsv.instanceMatrix.setUsage(THREE.DynamicDrawUsage); pads.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      group.add(tsv, pads); stacks.push({ group, base, dies, tsv, pads, x, z });
    });
    stackCarrier = makeBox(roundedBox(3.38, .15, 2.9, .025), interposerMaterial, 'interposer');
    stackCarrier.position.set(stacks[0].x, 1.51, stacks[0].z);
    const flowGeometry = ownGeometry(new THREE.SphereGeometry(.046, 8, 6));
    const flowMaterial = ownMaterial(new THREE.MeshBasicMaterial({ color: 0x68cbbd }));
    horizontalFlow = new THREE.InstancedMesh(flowGeometry, flowMaterial, 64); horizontalFlow.instanceMatrix.setUsage(THREE.DynamicDrawUsage); horizontalFlow.frustumCulled = false; model.add(horizontalFlow);
    verticalFlow = new THREE.InstancedMesh(flowGeometry, ownMaterial(new THREE.MeshBasicMaterial({ color: 0xf0b46f })), 24); verticalFlow.instanceMatrix.setUsage(THREE.DynamicDrawUsage); verticalFlow.frustumCulled = false; model.add(verticalFlow);
    for (let stackIndex = 0; stackIndex < 4; stackIndex++) {
      const stack = stacks[stackIndex], sign = Math.sign(stack.x);
      for (let lane = 0; lane < 4; lane++) {
        const laneShift = (lane - 1.5) * .115;
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(sign * 2.44, 1.588, stack.z * .68 + laneShift),
          new THREE.Vector3(sign * 2.84, 1.588, stack.z * .68 + laneShift),
          new THREE.Vector3(sign * 3.4, 1.588, stack.z + laneShift),
          new THREE.Vector3(stack.x, 1.588, stack.z + laneShift)
        ]);
        const line = makeTrace(curve.getPoints(35), lane % 2 ? 0xbda474 : 0x588f84, .71); routes.push({ curve, line, stack: stackIndex });
      }
    }
    // Fine etched traces along the exposed PCB border distinguish the substrate
    // from the upper silicon interposer. They are decorative, not a netlist.
    for (let i = 0; i < 14; i++) {
      const x = -5.75 + i * .86;
      makeTrace([new THREE.Vector3(x, .997, 4.65), new THREE.Vector3(x, .997, 4.16), new THREE.Vector3(x + .24, .997, 3.98)], 0xc6bc87, .65);
    }
    labelNodes.get('bump').textContent = hybrid ? 'Cu–Cu 접합' : '마이크로범프';
    applyVisibility(); layout(explodeCurrent); refreshHighlight();
  }
  function topHeight(exploded = explodeCurrent) {
    return 1.865 + exploded * .82 + state.layers * (dimensions.dieH + dimensions.bondGap + exploded * .255);
  }
  function layout(exploded) {
    interposer.position.y = 1.43 + exploded * .32; c4.position.y = 1.15 + exploded * .12;
    gpu.position.y = 1.99 + exploded * 1.35;
    stackCarrier.position.y = 1.51 + exploded * .32;
    const baseY = 1.75 + exploded * .82, baseTop = baseY + .115;
    for (const stack of stacks) {
      stack.base.position.y = baseY;
      for (let layer = 0; layer < state.layers; layer++) {
        const y = baseTop + dimensions.bondGap + dimensions.dieH / 2 + layer * (dimensions.dieH + dimensions.bondGap) + exploded * .255 * (layer + 1);
        stack.dies[layer].position.y = y;
        for (let pad = 0; pad < dimensions.tsvN ** 2; pad++) {
          dummy.position.set((pad % dimensions.tsvN - (dimensions.tsvN - 1) / 2) * .29, y, (Math.floor(pad / dimensions.tsvN) - (dimensions.tsvN - 1) / 2) * .25);
          dummy.scale.set(1, dimensions.dieH + .017, 1); dummy.rotation.set(0, 0, 0); dummy.updateMatrix(); stack.tsv.setMatrixAt(layer * dimensions.tsvN ** 2 + pad, dummy.matrix);
        }
        for (let pad = 0; pad < dimensions.padN ** 2; pad++) {
          const below = y - dimensions.dieH / 2 - dimensions.bondGap / 2;
          dummy.position.set((pad % dimensions.padN - (dimensions.padN - 1) / 2) * .31, below, (Math.floor(pad / dimensions.padN) - (dimensions.padN - 1) / 2) * .245);
          dummy.scale.set(1, state.bonding === 'hybrid' ? 1 : .55, 1); dummy.rotation.set(0, 0, 0); dummy.updateMatrix(); stack.pads.setMatrixAt(layer * dimensions.padN ** 2 + pad, dummy.matrix);
        }
      }
      stack.tsv.instanceMatrix.needsUpdate = true; stack.pads.instanceMatrix.needsUpdate = true;
      stack.tsv.computeBoundingSphere(); stack.pads.computeBoundingSphere();
    }
    for (const route of routes) route.line.position.y = exploded * .32;
    const stack = stacks[0], last = stack.dies[state.layers - 1].position.y;
    anchors = {
      gpu: new THREE.Vector3(0, gpu.position.y + .3, .15),
      dram: new THREE.Vector3(stack.x - dimensions.stackW * .25, last + .11, stack.z),
      base: new THREE.Vector3(stack.x - dimensions.stackW * .40, baseY, stack.z + dimensions.stackD * .40),
      tsv: new THREE.Vector3(stack.x + .29, (baseTop + last) / 2, stack.z - .25),
      bump: new THREE.Vector3(stack.x - .93, stack.dies[0].position.y - dimensions.dieH / 2 - dimensions.bondGap / 2, stack.z + .73),
      interposer: new THREE.Vector3(5.88, interposer.position.y + .15, 3.75),
      substrate: new THREE.Vector3(3.8, 1.00, 4.94)
    };
    model.updateMatrixWorld(true);
  }
  function applyVisibility() {
    const stackOnly = state.view === 'stack';
    substrate.visible = !stackOnly; interposer.visible = !stackOnly; c4.visible = !stackOnly; gpu.visible = !stackOnly;
    stackCarrier.visible = stackOnly;
    stacks.forEach((stack, index) => { stack.group.visible = !stackOnly || index === 0; stack.tsv.visible = state.tsv; });
    routes.forEach(route => { route.line.visible = !stackOnly; });
    // Other decorative PCB traces are outside the cutout in a stack close-up.
    model.children.forEach(child => { if (child.isLine && !routes.some(route => route.line === child)) child.visible = !stackOnly; });
    horizontalFlow.visible = state.flow && !motion.matches && !stackOnly;
    verticalFlow.visible = state.flow && state.tsv && !motion.matches;
    labelsLayer.style.display = state.labels ? '' : 'none';
    controls.autoRotate = state.autoRotate && !motion.matches;
  }
  function refreshHighlight() {
    for (const [part, materials] of partMaterials) for (const mat of materials) {
      if (!mat.emissive) continue;
      const selected = state.selected === part, hover = hovered === part;
      mat.emissive.copy(selected ? colorSelected : hover ? colorHover : mat.userData.pkgEmission);
      mat.emissiveIntensity = selected ? .34 : hover ? .20 : mat.userData.pkgEmissionStrength;
    }
    for (const [part, edges] of partEdges) edges.forEach(item => { item.material.color.copy(state.selected === part || hovered === part ? colorSelected : item.original); });
    labelNodes.forEach((node, part) => {
      node.classList.toggle('selected', state.selected === part); node.classList.toggle('hovered', hovered === part);
      node.setAttribute('aria-pressed', String(state.selected === part));
      node.style.borderColor = state.selected === part ? '#1b8569' : '#b7d1c7';
      node.style.background = state.selected === part ? 'rgba(219,246,228,.96)' : 'rgba(255,255,255,.94)';
    });
  }
  function choose(part, meta) {
    if (!PARTS.includes(part)) return;
    state.selected = part; refreshHighlight(); invalidate(); onSelect(part, meta);
  }
  function setHover(part, detail = {}) {
    if (part === hovered) return;
    hovered = part; canvas.style.cursor = part ? 'pointer' : 'grab'; refreshHighlight(); invalidate();
    onSelect(part, { type: 'hover', ...detail });
  }
  function actuallyVisible(object) {
    for (let node = object; node; node = node.parent) if (!node.visible) return false;
    return true;
  }
  function pick(event) {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(picks.filter(actuallyVisible), false);
    return hits.find(hit => hit.object.userData.part && hit.distance > camera.near) || null;
  }
  const onPointerMove = event => {
    if (pointerDown && Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y) > 5) pointerDown.dragged = true;
    if (pointerDown && pointerDown.dragged) { setHover(null); return; }
    const hit = pick(event); setHover(hit ? hit.object.userData.part : null, hit ? { instanceId: hit.instanceId ?? null, distance: hit.distance } : {});
  };
  const onPointerDown = event => { pointerDown = { x: event.clientX, y: event.clientY, pointerId: event.pointerId, dragged: false }; };
  const onPointerUp = event => {
    if (!pointerDown || pointerDown.pointerId !== event.pointerId) return;
    const isClick = !pointerDown.dragged && Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y) < 7; pointerDown = null;
    if (!isClick) return;
    const hit = pick(event);
    if (hit) choose(hit.object.userData.part, { type: 'select', origin: 'mesh', instanceId: hit.instanceId ?? null, detail: { ...hit.object.userData }, point: hit.point.toArray(), distance: hit.distance });
  };
  const onPointerLeave = () => { pointerDown = null; setHover(null); };
  canvas.addEventListener('pointerdown', onPointerDown); canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp); canvas.addEventListener('pointerleave', onPointerLeave);

  function positionLabels() {
    if (!state.labels) return;
    const stackOnly = state.view === 'stack', narrow = width < 510;
    const active = PARTS.filter(part => !stackOnly || ['dram', 'base', 'tsv', 'bump'].includes(part)).filter(part => part !== 'tsv' || state.tsv);
    const columns = [[], []];
    for (const part of PARTS) { labelNodes.get(part).style.display = active.includes(part) ? '' : 'none'; leaderNodes.get(part).style.display = active.includes(part) ? '' : 'none'; }
    for (const part of active) {
      projected.copy(anchors[part]).project(camera);
      const node = labelNodes.get(part), projectedX = (projected.x * .5 + .5) * width, projectedY = (-projected.y * .5 + .5) * height;
      const hidden = projected.z > 1 || projected.z < -1;
      node.style.visibility = hidden ? 'hidden' : 'visible'; leaderNodes.get(part).style.visibility = hidden ? 'hidden' : 'visible';
      const side = ['gpu', 'interposer', 'substrate'].includes(part) || (stackOnly && ['tsv', 'bump'].includes(part)) ? 1 : 0;
      columns[side].push({ part, node, px: projectedX, py: projectedY, target: Math.max(15, Math.min(height - 45, projectedY - 12)) });
    }
    columns.forEach((items, side) => {
      items.sort((a, b) => a.target - b.target);
      const spacing = narrow ? 35 : 38, bottom = height - 36;
      items.forEach((item, index) => { item.y = Math.max(item.target, index ? items[index - 1].y + spacing : 12); });
      for (let i = items.length - 1; i >= 0; i--) items[i].y = Math.min(items[i].y, i === items.length - 1 ? bottom : items[i + 1].y - spacing);
      for (const item of items) {
        const nodeWidth = Math.min(160, item.node.offsetWidth || (item.part === 'interposer' ? 126 : 104));
        const x = side ? width - nodeWidth - (narrow ? 7 : 12) : narrow ? 7 : 12;
        const y = Math.max(6, item.y); item.node.style.transform = `translate(${Math.round(x)}px,${Math.round(y)}px)`;
        const edgeX = side ? x : x + nodeWidth, edgeY = y + 14, elbowX = side ? edgeX - 12 : edgeX + 12;
        leaderNodes.get(item.part).setAttribute('d', `M${edgeX.toFixed(1)} ${edgeY.toFixed(1)}L${elbowX.toFixed(1)} ${edgeY.toFixed(1)}L${item.px.toFixed(1)} ${item.py.toFixed(1)}`);
      }
    });
  }
  function moveFlow(time) {
    if (!state.flow || motion.matches) return;
    for (let i = 0; i < 64; i++) {
      const route = routes[Math.floor(i / 4)], phase = (time * .26 + (i % 4) / 4) % 1;
      const point = route.curve.getPoint((Math.floor(i / 4) % 2) ? 1 - phase : phase); point.y += explodeCurrent * .32 + .028;
      dummy.position.copy(point); dummy.scale.setScalar(1); dummy.rotation.set(0, 0, 0); dummy.updateMatrix(); horizontalFlow.setMatrixAt(i, dummy.matrix);
    }
    horizontalFlow.instanceMatrix.needsUpdate = true;
    for (let i = 0; i < 24; i++) {
      const stackIndex = Math.floor(i / 6), stack = stacks[stackIndex], phase = (time * .31 + (i % 6) / 6) % 1;
      dummy.position.set(stack.x + (i % 2 ? .29 : -.29), 1.9 + explodeCurrent * .82 + phase * Math.max(.2, topHeight() - 1.9 - explodeCurrent * .82), stack.z + (i % 3 - 1) * .25);
      dummy.scale.setScalar(state.view === 'stack' && stackIndex !== 0 ? 0 : 1); dummy.rotation.set(0, 0, 0); dummy.updateMatrix(); verticalFlow.setMatrixAt(i, dummy.matrix);
    }
    verticalFlow.instanceMatrix.needsUpdate = true;
  }
  function cameraPose(view) {
    const top = topHeight(state.explode / 100);
    if (view === 'stack') {
      const target = new THREE.Vector3(stacks[0].x, (top + 1.55) / 2, stacks[0].z);
      const distance = Math.max(5.35, (top - 1.2) * 1.65);
      return { target, position: target.clone().add(new THREE.Vector3(1.1, .75, 1.35).normalize().multiplyScalar(distance)) };
    }
    const target = new THREE.Vector3(0, Math.max(1.6, top * .37), 0);
    const distance = Math.max(21.6, top * 2.7) * Math.max(1, 1.2 / camera.aspect);
    return { target, position: target.clone().add(new THREE.Vector3(1.15, 1.0, 1.38).normalize().multiplyScalar(distance)) };
  }
  function flyTo(pose, instant = false) {
    if (instant || motion.matches) { camera.position.copy(pose.position); controls.target.copy(pose.target); controls.update(); viewTween = null; }
    else viewTween = { position: pose.position, target: pose.target };
    invalidate();
  }
  function canDraw() { return !disposed && visible && !document.hidden && !contextLost; }
  function invalidate() { if (disposed) return; dirty = true; if (canDraw() && !frame) frame = requestAnimationFrame(draw); }
  function draw(stamp) {
    frame = 0; if (!canDraw()) { lastFrame = 0; return; }
    const delta = lastFrame ? Math.min(.06, (stamp - lastFrame) / 1000) : 1 / 60; lastFrame = stamp; elapsed += delta;
    const wanted = state.explode / 100;
    const oldExplode = explodeCurrent;
    explodeCurrent = motion.matches ? wanted : THREE.MathUtils.lerp(explodeCurrent, wanted, 1 - Math.exp(-delta * 8));
    if (Math.abs(explodeCurrent - wanted) < .0005) explodeCurrent = wanted;
    if (oldExplode !== explodeCurrent) layout(explodeCurrent);
    let flying = false;
    if (viewTween) {
      const alpha = 1 - Math.exp(-delta * 5.5); camera.position.lerp(viewTween.position, alpha); controls.target.lerp(viewTween.target, alpha);
      flying = camera.position.distanceToSquared(viewTween.position) > .0001 || controls.target.distanceToSquared(viewTween.target) > .0001;
      if (!flying) { camera.position.copy(viewTween.position); controls.target.copy(viewTween.target); viewTween = null; }
    }
    controls.autoRotate = state.autoRotate && !motion.matches;
    const changed = controls.update(delta);
    moveFlow(elapsed); renderer.render(scene, camera); renderedFrames++; positionLabels(); dirty = false;
    const dynamic = !motion.matches && (state.flow || state.autoRotate);
    if (!frame && canDraw() && (dynamic || flying || changed || Math.abs(explodeCurrent - wanted) > .0001 || dirty)) frame = requestAnimationFrame(draw);
  }
  function resize() {
    if (disposed) return;
    const rect = host.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    width = Math.max(1, Math.round(rect.width)); height = Math.max(1, Math.round(rect.height));
    renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix();
    const packageFit = Math.max(1, 1.2 / camera.aspect);
    if (state.view === 'package' && Math.abs(packageFit - previousPackageFit) > .00001) {
      const ratio = packageFit / previousPackageFit;
      camera.position.sub(controls.target).multiplyScalar(ratio).add(controls.target);
      if (viewTween) viewTween.position.sub(viewTween.target).multiplyScalar(ratio).add(viewTween.target);
    }
    previousPackageFit = packageFit;
    invalidate();
  }
  const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(host);
  const visibilityObserver = new IntersectionObserver(entries => {
    visible = entries.some(entry => entry.isIntersecting && entry.intersectionRect.width > 0 && entry.intersectionRect.height > 0);
    if (!visible && frame) { cancelAnimationFrame(frame); frame = 0; lastFrame = 0; }
    invalidate();
  }, { threshold: 0 }); visibilityObserver.observe(host);
  const onVisibility = () => { if (document.hidden && frame) { cancelAnimationFrame(frame); frame = 0; lastFrame = 0; } else invalidate(); };
  const onMotion = () => { applyVisibility(); if (motion.matches) { explodeCurrent = state.explode / 100; layout(explodeCurrent); if (viewTween) flyTo(viewTween, true); } invalidate(); };
  document.addEventListener('visibilitychange', onVisibility); motion.addEventListener('change', onMotion);
  const onContextLost = event => { event.preventDefault(); contextLost = true; if (frame) cancelAnimationFrame(frame); frame = 0; host.dataset.pkgContext = 'lost'; };
  const onContextRestored = () => { contextLost = false; host.dataset.pkgContext = 'ready'; invalidate(); };
  canvas.addEventListener('webglcontextlost', onContextLost); canvas.addEventListener('webglcontextrestored', onContextRestored);

  function update(next = {}) {
    if (disposed) return;
    const previous = state;
    const merged = { ...state, ...next };
    merged.layers = [4, 8, 12, 16].includes(Number(merged.layers)) ? Number(merged.layers) : 8;
    merged.generation = merged.generation === 'hbm4' ? 'hbm4' : 'hbm3e';
    merged.bonding = merged.bonding === 'hybrid' ? 'hybrid' : 'microbump';
    merged.explode = Math.max(0, Math.min(100, Number(merged.explode) || 0));
    merged.view = merged.view === 'stack' ? 'stack' : 'package';
    merged.selected = PARTS.includes(merged.selected) ? merged.selected : null;
    for (const key of ['tsv', 'flow', 'labels', 'autoRotate']) merged[key] = Boolean(merged[key]);
    state = merged;
    const rebuild = previous.layers !== state.layers || previous.generation !== state.generation || previous.bonding !== state.bonding;
    if (rebuild) build(); else { applyVisibility(); refreshHighlight(); }
    if (motion.matches && explodeCurrent !== state.explode / 100) { explodeCurrent = state.explode / 100; layout(explodeCurrent); }
    if (previous.view !== state.view || rebuild) flyTo(cameraPose(state.view));
    invalidate();
  }
  function focus(part) {
    if (disposed || !PARTS.includes(part)) return;
    state.selected = part; refreshHighlight();
    const target = anchors[part].clone();
    const distance = ['dram', 'base', 'tsv', 'bump'].includes(part) ? Math.max(5.5, (topHeight() - 1.2) * 1.32) : part === 'gpu' ? 9.5 : 18;
    const offset = new THREE.Vector3(.98, .7, 1.15).normalize().multiplyScalar(distance);
    flyTo({ target, position: target.clone().add(offset) });
  }
  function setView(view) { update({ view }); }
  function renderInitialFrame() {
    if (disposed || renderedFrames || contextLost) return;
    resize(); explodeCurrent = state.explode / 100; layout(explodeCurrent);
    flyTo(cameraPose(state.view), true); moveFlow(0);
    renderer.render(scene, camera); renderedFrames++; positionLabels();
    host.dataset.pkgFirstFrame = 'ready';
  }
  function reset() { if (disposed) return; viewTween = null; flyTo(cameraPose(state.view)); }
  function getStatus() {
    const suspendedReason = disposed ? 'disposed' : contextLost ? 'context-lost' : document.hidden ? 'hidden-tab' : !visible ? 'offscreen' : null;
    return {
      webgl: !disposed && !contextLost, state: { ...state }, selected: state.selected, hovered,
      sceneRevision, renderedFrames, animating: Boolean(frame), suspendedReason, reducedMotion: motion.matches,
      explodeCurrent: Number((explodeCurrent * 100).toFixed(3)), visibleStacks: state.view === 'stack' ? 1 : 4,
      dramDies: state.layers * 4, visibleDRAMDies: state.layers * (state.view === 'stack' ? 1 : 4),
      instances: { tsv: tsvCount, dieBonds: bondCount, c4: 247, flow: 88 },
      camera: { position: camera.position.toArray().map(value => Number(value.toFixed(3))), target: controls.target.toArray().map(value => Number(value.toFixed(3))), aspect: Number(camera.aspect.toFixed(3)) },
      render: { calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures },
      modelScale: 'illustrative', width, height
    };
  }
  function dispose() {
    if (disposed) return; disposed = true;
    if (frame) cancelAnimationFrame(frame); frame = 0;
    resizeObserver.disconnect(); visibilityObserver.disconnect(); document.removeEventListener('visibilitychange', onVisibility); motion.removeEventListener('change', onMotion);
    controls.removeEventListener('change', onControlChange); controls.removeEventListener('start', onControlStart); controls.dispose();
    canvas.removeEventListener('pointerdown', onPointerDown); canvas.removeEventListener('pointermove', onPointerMove); canvas.removeEventListener('pointerup', onPointerUp); canvas.removeEventListener('pointerleave', onPointerLeave);
    canvas.removeEventListener('webglcontextlost', onContextLost); canvas.removeEventListener('webglcontextrestored', onContextRestored);
    disposeModel(); groundGeometry.dispose(); groundMaterial.dispose(); grid.geometry.dispose(); grid.material.dispose(); environment.dispose(); renderer.dispose();
    canvas.remove(); labelsLayer.remove();
  }
  build(); resize(); flyTo(cameraPose('package'), true);
  host.dataset.pkgContext = 'ready';
  const initial = host.getBoundingClientRect(); visible = initial.width > 0 && initial.height > 0 && initial.bottom > 0 && initial.top < window.innerHeight;
  invalidate();
  return { update, focus, setView, reset, dispose, getStatus, renderInitialFrame };
}
