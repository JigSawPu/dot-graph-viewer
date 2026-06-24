import { instance } from "https://esm.sh/@viz-js/viz@3.28.0";

const $ = (s) => document.querySelector(s);
const editor = $('#editor'), fileInput = $('#fileInput'), graphStage = $('#graphStage');
const canvas = $('#canvas'), loading = $('#loading'), emptyState = $('#emptyState');
const fileName = $('#fileName'), statusDot = $('#statusDot'), graphStats = $('#graphStats');
const EXAMPLE = `digraph DotGlass {
  graph [bgcolor="transparent", rankdir=LR, pad=0.35, nodesep=0.55, ranksep=0.8, splines=spline];
  node [shape=rect, style="rounded,filled", fontname="Arial", fontsize=13, margin="0.18,0.12", color="#8B7CFF", fillcolor="#171D36", fontcolor="#F4F7FF", penwidth=1.4];
  edge [color="#8EA0C8", fontcolor="#B7C3DC", fontname="Arial", fontsize=10, penwidth=1.3, arrowsize=0.75];
  Upload [label="Open .dot file", fillcolor="#322A66"];
  Parse [label="Parse locally"];
  Layout [label="Graphviz WASM"];
  Explore [label="Pan • Zoom • Inspect", fillcolor="#154B49", color="#4EE1C1"];
  Export [label="Export SVG"];
  Upload -> Parse -> Layout -> Explore -> Export;
  Parse -> Privacy [label=" never uploaded"];
  Privacy [shape=note, label="Private by design", fillcolor="#2B2440"];
}`;

let viz, currentSvg = null, currentName = 'No file open';
let transform = { x: 0, y: 0, scale: 1 };
let drag = null, pinchDistance = null, toastTimer;

function toast(message){ const t=$('#toast'); t.textContent=message; t.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>t.classList.remove('show'),2600); }
function applyTransform(){ graphStage.style.transform=`translate(${transform.x}px,${transform.y}px) scale(${transform.scale})`; }
function setLoading(on){ loading.hidden=!on; }
function sanitizeSvg(svg){
  svg.querySelectorAll('script,foreignObject').forEach(n=>n.remove());
  svg.querySelectorAll('*').forEach(el=>{
    [...el.attributes].forEach(a=>{
      if(/^on/i.test(a.name) || ((a.name==='href'||a.name.endsWith(':href')) && /^javascript:/i.test(a.value))) el.removeAttribute(a.name);
    });
  });
}
async function ensureViz(){ if(!viz) viz=await instance(); return viz; }
async function renderGraph(){
  const source=editor.value.trim(); if(!source){ toast('Add DOT source first.'); return; }
  setLoading(true); statusDot.classList.remove('error');
  try{
    const renderer=await ensureViz();
    const svg=renderer.renderSVGElement(source,{engine:$('#engine').value});
    sanitizeSvg(svg); svg.removeAttribute('width'); svg.removeAttribute('height');
    const vb=svg.viewBox.baseVal; svg.style.width=`${Math.max(vb.width,1)}px`; svg.style.height=`${Math.max(vb.height,1)}px`;
    graphStage.replaceChildren(svg); currentSvg=svg; emptyState.hidden=true;
    fileName.textContent=currentName;
    const nodes=svg.querySelectorAll('g.node').length, edges=svg.querySelectorAll('g.edge').length;
    graphStats.textContent=`${nodes} nodes · ${edges} edges · ${$('#engine').value} layout`;
    requestAnimationFrame(fitGraph); localStorage.setItem('dotglass-source',source);
  }catch(err){ statusDot.classList.add('error'); graphStats.textContent='Render error'; toast((err?.message||String(err)).split('\n')[0]); }
  finally{ setLoading(false); }
}
function fitGraph(){
  if(!currentSvg) return;
  const vb=currentSvg.viewBox.baseVal, pad=44, cw=canvas.clientWidth, ch=canvas.clientHeight;
  const scale=Math.min((cw-pad*2)/vb.width,(ch-pad*2)/vb.height,2.2);
  transform.scale=Math.max(.05,scale); transform.x=(cw-vb.width*transform.scale)/2; transform.y=(ch-vb.height*transform.scale)/2; applyTransform();
}
function zoomAt(factor,cx=canvas.clientWidth/2,cy=canvas.clientHeight/2){
  const old=transform.scale, next=Math.min(8,Math.max(.05,old*factor));
  transform.x=cx-(cx-transform.x)*(next/old); transform.y=cy-(cy-transform.y)*(next/old); transform.scale=next; applyTransform();
}
async function readFile(file){
  if(!file) return; if(file.size>5*1024*1024){toast('Please choose a file smaller than 5 MB.');return;}
  try{ editor.value=await file.text(); currentName=file.name; fileName.textContent=currentName; await renderGraph(); }
  catch{ toast('Could not read that file.'); }
}
function downloadSvg(){
  if(!currentSvg){toast('Render a graph first.');return;}
  const clone=currentSvg.cloneNode(true); clone.setAttribute('xmlns','http://www.w3.org/2000/svg');
  const blob=new Blob([new XMLSerializer().serializeToString(clone)],{type:'image/svg+xml'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=currentName.replace(/\.(dot|gv)$/i,'')+'.svg'; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}

$('#openBtn').onclick=()=>fileInput.click(); $('#dropZone').onclick=(e)=>{if(e.target.id!=='openBtn')fileInput.click()};
fileInput.onchange=()=>readFile(fileInput.files[0]); $('#renderBtn').onclick=renderGraph;
$('#exampleBtn').onclick=()=>{editor.value=EXAMPLE;currentName='example.dot';fileName.textContent=currentName;renderGraph()};
$('#clearBtn').onclick=()=>{editor.value='';graphStage.replaceChildren();currentSvg=null;currentName='No file open';fileName.textContent=currentName;emptyState.hidden=false;graphStats.textContent='Ready';statusDot.classList.remove('error');setLoading(false);localStorage.removeItem('dotglass-source')};
$('#fitBtn').onclick=fitGraph; $('#zoomInBtn').onclick=()=>zoomAt(1.25); $('#zoomOutBtn').onclick=()=>zoomAt(.8); $('#downloadBtn').onclick=downloadSvg;
$('#fullscreenBtn').onclick=()=>document.fullscreenElement?document.exitFullscreen():$('#viewer').requestFullscreen?.();
$('#themeBtn').onclick=()=>{document.documentElement.classList.toggle('light');localStorage.setItem('dotglass-theme',document.documentElement.classList.contains('light')?'light':'dark')};
$('#engine').onchange=()=>currentSvg&&renderGraph();

const dz=$('#dropZone'); ['dragenter','dragover'].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.add('dragover')}));
['dragleave','drop'].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.remove('dragover')})); dz.addEventListener('drop',e=>readFile(e.dataTransfer.files[0]));
canvas.addEventListener('wheel',e=>{e.preventDefault();const r=canvas.getBoundingClientRect();zoomAt(Math.exp(-e.deltaY*.0015),e.clientX-r.left,e.clientY-r.top)},{passive:false});
canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);drag={id:e.pointerId,x:e.clientX,y:e.clientY,tx:transform.x,ty:transform.y}});
canvas.addEventListener('pointermove',e=>{if(drag&&drag.id===e.pointerId){transform.x=drag.tx+e.clientX-drag.x;transform.y=drag.ty+e.clientY-drag.y;applyTransform()}});
canvas.addEventListener('pointerup',()=>drag=null); canvas.addEventListener('pointercancel',()=>drag=null);
canvas.addEventListener('touchstart',e=>{if(e.touches.length===2)pinchDistance=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY)},{passive:true});
canvas.addEventListener('touchmove',e=>{if(e.touches.length===2&&pinchDistance){const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);zoomAt(d/pinchDistance);pinchDistance=d}},{passive:true});
canvas.addEventListener('touchend',()=>pinchDistance=null); window.addEventListener('resize',()=>currentSvg&&fitGraph());

if(localStorage.getItem('dotglass-theme')==='light')document.documentElement.classList.add('light');
const savedSource=localStorage.getItem('dotglass-source');
if(savedSource){
  editor.value=savedSource;
  currentName='Restored draft';
  fileName.textContent=currentName;
  renderGraph();
}else{
  editor.value='';
  fileName.textContent=currentName;
  graphStats.textContent='Ready';
  emptyState.hidden=false;
  setLoading(false);
}
