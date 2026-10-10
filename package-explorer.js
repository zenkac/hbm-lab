import {PARTS,GENERATIONS,SOURCES} from './package-content.js?v=20261011-pastel';

const modelState={layers:8,generation:'hbm3e',bonding:'microbump',explode:35,tsv:true,flow:true,labels:true,autoRotate:false,view:'package',selected:null};
const oldLab=document.querySelector('#body-structure .lab');
const group=(key,title,options)=>`<fieldset class="pkg-field"><legend>${title}</legend><div class="pkg-segments">${options.map(([value,label])=>`<button type="button" data-pkg-setting="${key}" data-value="${value}" aria-pressed="${String(modelState[key]===value)}">${label}</button>`).join('')}</div></fieldset>`;
const toggle=(key,label)=>`<label class="pkg-toggle"><input type="checkbox" data-pkg-toggle="${key}" ${modelState[key]?'checked':''}><span>${label}</span></label>`;
const explorer=document.createElement('div');
explorer.className='pkg-explorer';explorer.id='package-explorer';explorer.dataset.visualMode='loading';
explorer.innerHTML=`<div class="pkg-heading"><div><small>EXPERIMENT 01 <span class="pkg-badge">3D EXPLORER</span></small><h3>2.5D HBM 패키지 · 안쪽까지 살펴보기</h3></div><button type="button" id="pkg-basic" class="pkg-text-button" hidden>기본 도해 보기</button></div><div class="pkg-body"><div class="pkg-display"><div class="pkg-stage" id="pkg-stage" aria-label="드래그와 확대가 가능한 3D HBM 패키지"><div class="pkg-loading">패키지 모델을 준비하고 있습니다…</div></div><div class="pkg-canvas-tools"><span id="pkg-hover">드래그 회전 · 휠 / 두 손가락 확대</span><button type="button" id="pkg-reset">시점 초기화 ↺</button></div><div class="pkg-parts" aria-label="부품 선택">${Object.entries(PARTS).map(([key,part])=>`<button type="button" data-pkg-part="${key}" aria-pressed="false">${part.title}</button>`).join('')}</div><div class="pkg-detail" id="pkg-detail"><span class="pkg-detail-kicker">EXPLORE THE PACKAGE</span><h4>그림 속 부품을 직접 선택해 보세요.</h4><p>라벨 또는 아래 부품 버튼을 누르면 연결 역할을 확인할 수 있습니다. 드래그하면 다른 면을, ‘스택 확대’에서는 다이 사이를 볼 수 있습니다.</p></div></div><div class="pkg-panel">${group('layers','DRAM 적층 수',[[4,'4-Hi'],[8,'8-Hi'],[12,'12-Hi'],[16,'16-Hi']])}${group('generation','인터페이스 비교',[['hbm3e','HBM3E'],['hbm4','HBM4']])}${group('bonding','다이 사이 접합 비교',[['microbump','마이크로범프'],['hybrid','하이브리드']])}<label class="pkg-slider"><span>분해도 <output id="pkg-explode-value">35%</output></span><input id="pkg-explode" type="range" min="0" max="100" value="35" step="1" aria-label="패키지 분해도"></label>${group('view','관찰 범위',[['package','패키지 전체'],['stack','스택 확대']])}<div class="pkg-toggles">${toggle('tsv','TSV 표시')}${toggle('flow','데이터 흐름')}${toggle('labels','부품 라벨')}${toggle('autoRotate','자동 회전')}</div><div class="pkg-current"><span>현재 모델 조건</span><p id="pkg-assumptions"></p></div></div></div><div class="pkg-metrics" aria-label="교육용 모델 계산"><div><span>스택 용량 · 24 Gb / 다이 가정</span><strong id="pkg-capacity"></strong></div><div><span>스택당 이론 대역폭</span><strong id="pkg-bandwidth"></strong><small id="pkg-interface"></small></div><div><span>패키지 4스택 · 총 용량</span><strong id="pkg-total-capacity"></strong></div><div><span>패키지 4스택 · 총 이론 대역폭</span><strong id="pkg-total-bandwidth"></strong></div></div><p class="pkg-footnote">치수·층 간격·연결 수·배선은 관찰하기 위한 개념 표현입니다. 접합 방식은 독립적인 구조 비교이며 선택한 세대의 실제 제품 공정을 뜻하지 않습니다. 분해도는 실제 다이 두께를 바꾸지 않습니다.</p><p id="pkg-status" class="pkg-status" role="status" aria-live="polite">3D 모델 준비 중</p>`;
oldLab.before(explorer);
explorer.querySelectorAll('.pkg-body button,.pkg-body input').forEach(control=>control.disabled=true);
const sourceLinks=document.createElement('p');sourceLinks.className='pkg-source-links';sourceLinks.innerHTML='구조와 비교값의 근거 · '+SOURCES.map(source=>`<a href="${source.url}" target="_blank" rel="noopener noreferrer">${source.title} ↗</a>`).join(' · ');explorer.appendChild(sourceLinks);
let scene,heroScene,heroState,failed=false,basic=false;
const at=id=>document.getElementById(id);
const number=(value,digits=2)=>value.toLocaleString('ko-KR',{maximumFractionDigits:digits});

function describe(part){
  if(!PARTS[part])return;
  if(modelState.view==='stack'&&['gpu','interposer','substrate'].includes(part)){modelState.view='package';drawControls()}
  if(part==='tsv'&&!modelState.tsv){modelState.tsv=true;explorer.querySelector('[data-pkg-toggle="tsv"]').checked=true;drawControls()}
  modelState.selected=part;
  const data=PARTS[part];
  at('pkg-detail').innerHTML=`<span class="pkg-detail-kicker">${data.kicker}</span><h4>${data.title}</h4><p>${data.description}</p><p class="pkg-part-question"><b>생각해 보기</b> ${data.question}</p>`;
  explorer.querySelectorAll('[data-pkg-part]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.pkgPart===part)));
  at('pkg-status').textContent=data.title+' 선택 · 아래 설명에서 연결 역할을 확인하세요.';
  scene?.update(modelState);
}

function drawControls(){
  const gen=GENERATIONS[modelState.generation],capacity=modelState.layers*3,bandwidth=gen.width*gen.speed/8/1000;
  explorer.querySelectorAll('[data-pkg-setting]').forEach(button=>button.setAttribute('aria-pressed',String(String(modelState[button.dataset.pkgSetting])===button.dataset.value)));
  at('pkg-explode-value').textContent=modelState.explode+'%';
  at('pkg-explode').value=String(modelState.explode);
  at('pkg-capacity').textContent=capacity+' GB';at('pkg-bandwidth').textContent=number(bandwidth,3)+' TB/s';
  at('pkg-interface').textContent=gen.width+' bit × '+gen.speed+' Gbit/s ÷ 8';
  at('pkg-total-capacity').textContent=capacity*4+' GB';at('pkg-total-bandwidth').textContent=number(bandwidth*4,3)+' TB/s';
  at('pkg-assumptions').textContent=`${modelState.layers}-Hi · 24 Gb / 다이 가정. ${gen.notes} ${modelState.layers===16?'16-Hi는 고적층 구조를 비교하는 가상 구성입니다.':''}`;
  explorer.dataset.layers=String(modelState.layers);explorer.dataset.generation=modelState.generation;explorer.dataset.bonding=modelState.bonding;explorer.dataset.view=modelState.view;
  scene?.update(modelState);
  if(heroScene){heroState={...heroState,layers:modelState.layers,generation:modelState.generation,bonding:modelState.bonding};heroScene.update(heroState)}
}

function useBasic(forceFailure=false){
  failed=failed||forceFailure;basic=failed||!basic;
  explorer.classList.toggle('pkg-basic-mode',basic);oldLab.hidden=!basic;explorer.dataset.visualMode=basic?'svg':'webgl';
  at('pkg-basic').textContent=basic?'3D 모델로 돌아가기':'기본 도해 보기';at('pkg-basic').hidden=failed;
  at('pkg-status').textContent=failed?'현재 환경에서 3D 화면을 사용할 수 없어 기본 도해를 표시합니다.':basic?'기본 도해 모드입니다. 기존 슬라이더로 적층을 관찰하세요.':'3D 모델 준비 완료 · 그림 속 부품을 선택하거나 시점을 움직여 보세요.';
  if(failed){scene?.dispose();scene=null}
}

function mountHero(createPackageScene){
  const hero=at('hero-stack');
  const restoreHero=()=>{heroScene?.dispose();heroScene=null;hero.dispatchEvent(new Event('hbm-hero-fallback'))};
  try{
    const heroHost=document.createElement('div');heroHost.className='pkg-stage pkg-hero-stage';heroHost.setAttribute('aria-label','회전과 확대가 가능한 HBM 패키지 미리보기');
    hero.replaceChildren(heroHost);
    heroScene=createPackageScene(heroHost,(part,meta)=>{if(meta?.type!=='hover'&&PARTS[part]){describe(part);location.hash='structure'}});
    heroState={...modelState,explode:25,labels:false,flow:false,autoRotate:false,view:'package',selected:null};heroScene.update(heroState);heroScene.renderInitialFrame();
    heroHost.querySelector('canvas').addEventListener('webglcontextlost',restoreHero,{once:true});
    at('advs-hero-explode').onclick=()=>{heroState.explode=heroState.explode?0:40;heroScene.update(heroState);at('advs-hero-explode').textContent=heroState.explode?'적층 펼침 ✓':'적층 펼치기';at('advs-hero-explode').setAttribute('aria-pressed',String(heroState.explode>0))};
    at('advs-hero-turn').textContent='스택 확대 ↗';at('advs-hero-turn').onclick=()=>{heroState.view=heroState.view==='package'?'stack':'package';heroScene.update(heroState);at('advs-hero-turn').textContent=heroState.view==='package'?'스택 확대 ↗':'전체 보기 ↗'};
    at('advs-hero-explode').disabled=false;at('advs-hero-turn').disabled=false;
    hero.parentElement.querySelector('.pkg-hero-fallback')?.remove();
    hero.dataset.heroMode='webgl';hero.setAttribute('aria-busy','false');
  }catch(error){console.warn('HBM 소개 모델을 기본 도해로 전환합니다.',error.message);restoreHero()}
}

drawControls();
async function start(){
  try{
    const {createPackageScene}=await import('./package-scene.js?v=20261011-pastel');
    mountHero(createPackageScene);
    scene=createPackageScene(at('pkg-stage'),(part,meta)=>{
      if(meta?.type==='hover'){at('pkg-hover').textContent=PARTS[part]?PARTS[part].title+' · 클릭하면 설명':'드래그 회전 · 휠 / 두 손가락 확대';return}
      describe(part);
    });
    scene.update(modelState);at('pkg-stage').querySelector('.pkg-loading')?.remove();oldLab.hidden=true;
    explorer.dataset.visualMode='webgl';at('pkg-basic').hidden=false;at('pkg-status').textContent='3D 모델 준비 완료 · 그림 속 부품을 선택하거나 시점을 움직여 보세요.';
    explorer.querySelectorAll('[data-pkg-setting]').forEach(button=>button.onclick=()=>{const key=button.dataset.pkgSetting;modelState[key]=key==='layers'?Number(button.dataset.value):button.dataset.value;drawControls()});
    explorer.querySelectorAll('[data-pkg-toggle]').forEach(input=>input.onchange=()=>{modelState[input.dataset.pkgToggle]=input.checked;drawControls()});
    explorer.querySelectorAll('[data-pkg-part]').forEach(button=>button.onclick=()=>{describe(button.dataset.pkgPart);scene.focus(button.dataset.pkgPart)});
    at('pkg-explode').oninput=event=>{modelState.explode=Number(event.target.value);drawControls()};
    at('pkg-reset').onclick=()=>{scene.reset();modelState.autoRotate=false;explorer.querySelector('[data-pkg-toggle="autoRotate"]').checked=false;drawControls();at('pkg-status').textContent='관찰 시점을 초기화했습니다.'};
    at('pkg-basic').onclick=()=>useBasic();
    explorer.querySelectorAll('.pkg-body button,.pkg-body input').forEach(control=>control.disabled=false);
    at('pkg-stage').querySelector('canvas')?.addEventListener('webglcontextlost',()=>useBasic(true));
  }catch(error){console.warn('HBM 3D 모델을 기본 도해로 전환합니다.',error.message);useBasic(true);if(at('hero-stack').dataset.heroMode==='loading')at('hero-stack').dispatchEvent(new Event('hbm-hero-fallback'))}
}
start();

