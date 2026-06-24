/* DotCanvas — static, touch-first DOT graph editor */
const $ = (s) => document.querySelector(s);
const state = { tool:'select', connectFrom:null, history:[], future:[], restoring:false, selected:null };
const uid = () => `n_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`;
const escapeDot = s => String(s ?? '').replace(/\\/g,'\\\\').replace(/"/g,'\\"').replace(/\n/g,'\\n');

const cy = cytoscape({
  container: $('#cy'), elements: [], minZoom:.08, maxZoom:5, wheelSensitivity:.18,
  selectionType:'single', boxSelectionEnabled:true, autoungrabify:false,
  style:[
    {selector:'node',style:{'label':'data(label)','text-wrap':'wrap','text-max-width':'150px','text-valign':'center','text-halign':'center','font-size':'14px','font-weight':600,'color':'data(textColor)','background-color':'data(fill)','border-color':'data(border)','border-width':2,'shape':'data(shape)','width':'data(size)','height':'mapData(size,50,180,42,110)','padding':'10px','overlay-opacity':0,'transition-property':'border-width, border-color, background-color','transition-duration':'150ms'}},
    {selector:'node:selected',style:{'border-width':5,'border-color':'#ffffff','shadow-blur':18,'shadow-color':'#7381ff','shadow-opacity':.75,'shadow-offset-x':0,'shadow-offset-y':0}},
    {selector:'edge',style:{'width':2.5,'curve-style':'bezier','line-color':'rgba(180,190,230,.62)','target-arrow-color':'rgba(180,190,230,.75)','target-arrow-shape':'triangle','arrow-scale':.9,'overlay-opacity':0}},
    {selector:'edge:selected',style:{'width':4,'line-color':'#8995ff','target-arrow-color':'#8995ff'}},
    {selector:'.connect-source',style:{'border-width':6,'border-color':'#65e6bd'}}
  ]
});

function nodeDefaults(label='New idea'){return { id:uid(),label,shape:'roundrectangle',size:92,fill:'#6d7cff',textColor:'#ffffff',border:'#aeb7ff',locked:false };}
function snapshot(){ if(state.restoring)return; const snap=JSON.stringify({elements:cy.json().elements,pan:cy.pan(),zoom:cy.zoom()}); if(state.history.at(-1)!==snap){state.history.push(snap);if(state.history.length>60)state.history.shift();state.future=[];} localStorage.setItem('dotcanvas-project',snap); updateEmpty(); }
function restore(raw){try{state.restoring=true;const p=typeof raw==='string'?JSON.parse(raw):raw;cy.elements().remove();cy.add(p.elements||[]);if(p.pan)cy.pan(p.pan);if(p.zoom)cy.zoom(p.zoom);cy.nodes().forEach(n=>n.data('locked')?n.lock():n.unlock());state.restoring=false;updateEmpty();updateInspector();}catch(e){state.restoring=false;toast('Could not restore project');}}
function beforeChange(){snapshot();}
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove('show'),1800);}
function updateEmpty(){$('#emptyState').classList.toggle('hidden',cy.nodes().length>0);$('#statusText').textContent=cy.nodes().length?`${cy.nodes().length} nodes · ${cy.edges().length} links`:'Start with a node or open a DOT file';}
function addNode(position,label='New idea',parent=null){beforeChange();const data=nodeDefaults(label);cy.add({group:'nodes',data,position:position||cy.extent().center});if(parent)cy.add({group:'edges',data:{id:`e_${uid()}`,source:parent.id(),target:data.id}});const n=cy.$id(data.id);n.select();state.selected=n;updateInspector();snapshot();updateEmpty();return n;}
function addChild(){const p=cy.$('node:selected').first();if(!p.length){toast('Select a parent node first');return;}const pos=p.position();addNode({x:pos.x+190,y:pos.y+(Math.random()-.5)*120},'New child',p);}
function setTool(tool){state.tool=tool;state.connectFrom=null;cy.nodes().removeClass('connect-source');document.querySelectorAll('.tool[data-tool]').forEach(b=>b.classList.toggle('active',b.dataset.tool===tool));$('#statusText').textContent={select:'Drag nodes or pan the canvas',add:'Tap the canvas to add a node',child:'Tap a parent node to add a child',connect:'Tap two nodes to connect them',edit:'Tap a node to edit it'}[tool];}

cy.on('tap', e=>{ if(e.target===cy && state.tool==='add') addNode(e.position); });
cy.on('tap','node',e=>{const n=e.target;state.selected=n;updateInspector();if(innerWidth<761)$('#inspector').classList.add('open');if(state.tool==='child')addNode({x:n.position('x')+190,y:n.position('y')},'New child',n);if(state.tool==='edit')setTimeout(()=>$('#labelInput').focus(),50);if(state.tool==='connect'){if(!state.connectFrom){state.connectFrom=n;n.addClass('connect-source');toast('Now tap the destination node');}else if(state.connectFrom.id()!==n.id()){beforeChange();cy.add({group:'edges',data:{id:`e_${uid()}`,source:state.connectFrom.id(),target:n.id()}});state.connectFrom.removeClass('connect-source');state.connectFrom=null;snapshot();toast('Nodes connected');}}});
cy.on('tap','edge',e=>{state.selected=e.target;updateInspector();});
cy.on('unselect',()=>setTimeout(updateInspector,0));
cy.on('dragfree','node',()=>snapshot());
cy.on('zoom',()=>$('#zoomText').textContent=`${Math.round(cy.zoom()*100)}%`);
cy.on('pan zoom',()=>localStorage.setItem('dotcanvas-view',JSON.stringify({pan:cy.pan(),zoom:cy.zoom()})));
cy.on('dbltap','node',e=>{e.target.select();updateInspector();$('#inspector').classList.add('open');setTimeout(()=>$('#labelInput').focus(),30);});

function updateInspector(){const n=cy.$('node:selected').first();const controls=$('#nodeControls');if(!n.length){$('#inspectorTitle').textContent=cy.$('edge:selected').length?'Connection selected':'No node selected';controls.classList.add('disabled');return;}state.selected=n;controls.classList.remove('disabled');$('#inspectorTitle').textContent=n.data('label')||n.id();$('#labelInput').value=n.data('label')||'';$('#shapeInput').value=n.data('shape')||'roundrectangle';$('#sizeInput').value=n.data('size')||92;$('#fillInput').value=n.data('fill')||'#6d7cff';$('#textInput').value=n.data('textColor')||'#ffffff';$('#borderInput').value=n.data('border')||'#aeb7ff';$('#lockInput').checked=n.locked();}
function bindData(id,key,event='input'){ $(id).addEventListener(event,e=>{const n=cy.$('node:selected').first();if(!n.length)return;beforeChange();n.data(key,e.target.value);if(key==='label')$('#inspectorTitle').textContent=e.target.value;snapshot();}); }
bindData('#labelInput','label');bindData('#shapeInput','shape','change');bindData('#sizeInput','size');bindData('#fillInput','fill');bindData('#textInput','textColor');bindData('#borderInput','border');
$('#lockInput').addEventListener('change',e=>{const n=cy.$('node:selected').first();if(!n.length)return;beforeChange();n.data('locked',e.target.checked);e.target.checked?n.lock():n.unlock();snapshot();});

document.querySelectorAll('.tool[data-tool]').forEach(b=>b.onclick=()=>setTool(b.dataset.tool));
$('#startNodeBtn').onclick=()=>addNode({x:0,y:0},'Central idea');
$('#deleteBtn').onclick=()=>{const sel=cy.$(':selected');if(!sel.length)return;beforeChange();sel.remove();snapshot();updateInspector();updateEmpty();};
$('#duplicateBtn').onclick=()=>{const n=cy.$('node:selected').first();if(!n.length)return;const d={...n.data(),id:uid(),label:`${n.data('label')} copy`};beforeChange();cy.add({group:'nodes',data:d,position:{x:n.position('x')+45,y:n.position('y')+45}}).select();snapshot();updateInspector();};
$('#addChildInspectorBtn').onclick=addChild;
$('#fitBtn').onclick=()=>cy.animate({fit:{eles:cy.elements(),padding:90},duration:350});
$('#closeInspector').onclick=()=>$('#inspector').classList.remove('open');

function layoutConfig(name){const animate=$('#animateLayout').checked;const common={animate,animationDuration:500,fit:true,padding:90};if(name==='mindmap')return {name:'breadthfirst',directed:true,spacingFactor:1.35,roots:findRoots(),...common};if(name==='vertical')return {name:'breadthfirst',directed:true,spacingFactor:1.25,roots:findRoots(),...common};if(name==='radial')return {name:'concentric',minNodeSpacing:55,concentric:n=>-n.degree(),levelWidth:()=>1,...common};if(name==='organic')return {name:'cose',idealEdgeLength:150,nodeRepulsion:650000,gravity:.18,numIter:700,...common};if(name==='circle')return {name:'circle',spacingFactor:1.2,...common};return {name:'grid',avoidOverlap:true,...common};}
function findRoots(){const roots=cy.nodes().filter(n=>n.indegree()===0);return roots.length?roots:cy.nodes().first();}
function reflow(){if(!cy.nodes().length)return;beforeChange();cy.layout(layoutConfig($('#layoutSelect').value)).run();setTimeout(snapshot,650);}
$('#reflowBtn').onclick=reflow;
$('#layoutSelect').onchange=reflow;

$('#undoBtn').onclick=()=>{if(state.history.length<2)return;const current=state.history.pop();state.future.push(current);restore(state.history.at(-1));};
$('#redoBtn').onclick=()=>{const next=state.future.pop();if(!next)return;state.history.push(next);restore(next);};

function parseAttrs(raw=''){const out={};const re=/(\w+)\s*=\s*("(?:\\.|[^"])*"|[^,\]\s]+)/g;let m;while((m=re.exec(raw)))out[m[1]]=m[2].replace(/^"|"$/g,'').replace(/\\n/g,'\n').replace(/\\"/g,'"');return out;}
function parseDot(dot){const clean=dot.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/.*$/gm,'').replace(/#.*$/gm,'');const nodes=new Map(),edges=[];const edgeRe=/([A-Za-z_][\w.-]*|"[^"]+")\s*(->|--)\s*([A-Za-z_][\w.-]*|"[^"]+")\s*(?:\[([^\]]*)\])?/g;let m;const norm=s=>s.replace(/^"|"$/g,'');while((m=edgeRe.exec(clean))){const a=norm(m[1]),b=norm(m[3]);nodes.set(a,nodes.get(a)||{});nodes.set(b,nodes.get(b)||{});edges.push([a,b,parseAttrs(m[4])]);}const statementRe=/(?:^|[;{}\n])\s*([A-Za-z_][\w.-]*|"[^"]+")\s*\[([^\]]+)\]/g;while((m=statementRe.exec(clean))){const id=norm(m[1]);if(['node','edge','graph'].includes(id))continue;nodes.set(id,{...(nodes.get(id)||{}),...parseAttrs(m[2])});}if(!nodes.size){const idRe=/(?:^|[;{}\n])\s*([A-Za-z_][\w.-]*|"[^"]+")\s*(?=;|\n|})/g;while((m=idRe.exec(clean))){const id=norm(m[1]);if(!['digraph','graph','strict','node','edge'].includes(id))nodes.set(id,{});}}const elements=[];for(const [id,a] of nodes){const shapeMap={box:'rectangle',rect:'rectangle',rectangle:'rectangle',ellipse:'ellipse',circle:'ellipse',diamond:'diamond',hexagon:'hexagon'};elements.push({group:'nodes',data:{...nodeDefaults(a.label||id),id,label:a.label||id,shape:shapeMap[a.shape]||'roundrectangle',fill:a.fillcolor||a.color||'#6d7cff',border:a.color||'#aeb7ff'}});}edges.forEach(([a,b],i)=>elements.push({group:'edges',data:{id:`e_${i}_${uid()}`,source:a,target:b}}));return elements;}
function importText(text,name='Imported graph'){try{beforeChange();const isJson=text.trim().startsWith('{');if(isJson){const p=JSON.parse(text);restore(p);state.history.push(JSON.stringify(p));}else{const els=parseDot(text);if(!els.some(e=>e.group==='nodes'))throw new Error('No nodes found');cy.elements().remove();cy.add(els);cy.layout(layoutConfig('mindmap')).run();setTimeout(snapshot,600);}updateEmpty();toast(`${name} opened`);}catch(e){console.error(e);toast('Could not parse this file');}}
$('#fileInput').onchange=async e=>{const f=e.target.files[0];if(!f)return;importText(await f.text(),f.name);e.target.value='';};
['dragenter','dragover'].forEach(type=>$('#canvasWrap').addEventListener(type,e=>{e.preventDefault();$('#canvasWrap').classList.add('dragging');}));
['dragleave','drop'].forEach(type=>$('#canvasWrap').addEventListener(type,e=>{e.preventDefault();$('#canvasWrap').classList.remove('dragging');}));
$('#canvasWrap').addEventListener('drop',async e=>{const f=e.dataTransfer.files[0];if(f)importText(await f.text(),f.name);});

const example=`digraph MindMap {\n  idea [label="Launch a product", shape=ellipse, fillcolor="#7b88ff"];\n  research [label="Research"]; design [label="Design"]; build [label="Build"]; launch [label="Launch"];\n  users [label="User interviews"]; market [label="Market map"];\n  ui [label="Interface"]; brand [label="Brand system"];\n  prototype [label="Prototype"]; test [label="Test & refine"];\n  idea -> research; idea -> design; idea -> build; idea -> launch;\n  research -> users; research -> market; design -> ui; design -> brand; build -> prototype; build -> test;\n}`;
$('#exampleBtn').onclick=()=>importText(example,'Example');

function toDot(){const lines=['digraph DotCanvas {','  graph [overlap=false, splines=true];','  node [style=filled];'];cy.nodes().forEach(n=>{const d=n.data(),p=n.position();const shape={roundrectangle:'box',rectangle:'box',ellipse:'ellipse',diamond:'diamond',hexagon:'hexagon'}[d.shape]||'box';lines.push(`  "${escapeDot(n.id())}" [label="${escapeDot(d.label)}", shape=${shape}, fillcolor="${d.fill}", color="${d.border}", fontcolor="${d.textColor}", pos="${p.x.toFixed(1)},${(-p.y).toFixed(1)}!"];`);});cy.edges().forEach(e=>lines.push(`  "${escapeDot(e.source().id())}" -> "${escapeDot(e.target().id())}";`));lines.push('}');return lines.join('\n');}
function download(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},500);}
$('#exportBtn').onclick=()=>$('#exportDialog').showModal();
document.querySelectorAll('[data-export]').forEach(b=>b.onclick=()=>{const type=b.dataset.export;if(type==='dot')download(new Blob([toDot()],{type:'text/vnd.graphviz'}),'dotcanvas.dot');if(type==='json')download(new Blob([JSON.stringify({elements:cy.json().elements,pan:cy.pan(),zoom:cy.zoom()},null,2)],{type:'application/json'}),'dotcanvas-project.json');if(type==='png'||type==='jpg'){const uri=type==='png'?cy.png({full:true,scale:2,bg:'transparent'}):cy.jpg({full:true,scale:2,bg:'#ffffff'});const a=document.createElement('a');a.href=uri;a.download=`dotcanvas.${type}`;a.click();}$('#exportDialog').close();});

document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?$('#redoBtn').click():$('#undoBtn').click();}if(e.key==='Delete'||e.key==='Backspace'){if(!['INPUT','TEXTAREA'].includes(document.activeElement.tagName))$('#deleteBtn').click();}});

const saved=localStorage.getItem('dotcanvas-project');if(saved){restore(saved);state.history=[saved];}else{snapshot();}updateEmpty();
