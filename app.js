const $=s=>document.querySelector(s);const uid=()=>`n_${Math.random().toString(36).slice(2,9)}`;
const STRUCTURES={
 mindmap:{name:'Traditional Mind Map',short:'Mind map',desc:'Central idea with balanced branches.',icon:'mind',template:'mindmap'},
 flowchart:{name:'Logic Chart & Flowchart',short:'Flowchart',desc:'Process steps, decisions and outcomes.',icon:'flow',template:'flowchart'},
 fishbone:{name:'Fishbone Diagram',short:'Fishbone',desc:'Cause-and-effect analysis.',icon:'fish',template:'fishbone'},
 timeline:{name:'Timeline',short:'Timeline',desc:'Events arranged in chronological order.',icon:'timeline',template:'timeline'},
 matrix:{name:'Matrix Layout',short:'Matrix',desc:'Compare items across rows and columns.',icon:'matrix',template:'matrix'},
 gantt:{name:'Gantt Chart',short:'Gantt',desc:'Tasks positioned across project phases.',icon:'timeline',template:'gantt'},
 orgchart:{name:'Organizational Chart',short:'Org chart',desc:'Teams and reporting hierarchy.',icon:'org',template:'orgchart'},
 tree:{name:'Tree Diagram',short:'Tree',desc:'Rooted hierarchy with branching levels.',icon:'tree',template:'tree'},
 concept:{name:'Concept Map',short:'Concept map',desc:'Network of related concepts.',icon:'concept',template:'concept'},
 bubble:{name:'Bubble Map',short:'Bubble map',desc:'Central topic surrounded by associations.',icon:'bubble',template:'bubble'}
};
const state={tool:'select',connectFrom:null,history:[],future:[],restoring:false,structure:'mindmap'};
const defaults=(label='New node')=>({id:uid(),label,subtitle:'',shape:'roundrectangle',size:150,fill:'#14263a',textColor:'#eef7ff',border:'#2d8cff',locked:false});
const cy=cytoscape({container:$('#cy'),elements:[],minZoom:.2,maxZoom:4,wheelSensitivity:.18,boxSelectionEnabled:true,selectionType:'additive',style:[
 {selector:'node',style:{'shape':'data(shape)','width':'data(size)','height':58,'background-color':'data(fill)','border-width':1.5,'border-color':'data(border)','border-opacity':.8,'label':'data(displayLabel)','color':'data(textColor)','font-size':13,'font-weight':600,'text-wrap':'wrap','text-max-width':'130px','text-valign':'center','text-halign':'center','padding':'10px','shadow-blur':20,'shadow-color':'data(border)','shadow-opacity':.18,'shadow-offset-x':0,'shadow-offset-y':0,'overlay-opacity':0}},
 {selector:'node:selected',style:{'border-width':2.5,'border-color':'#63d8ff','shadow-blur':34,'shadow-color':'#2d8cff','shadow-opacity':.52,'background-color':'#19314b'}},
 {selector:'node.connect-source',style:{'border-color':'#ffb45c','shadow-color':'#ff9a3d','shadow-opacity':.7}},
 {selector:'edge',style:{'curve-style':'bezier','width':1.4,'line-color':'#2d8cff','target-arrow-color':'#62ceff','target-arrow-shape':'triangle','arrow-scale':.7,'opacity':.72,'line-gradient-stop-colors':'#164c91 #43c8ff','line-gradient-stop-positions':'0% 100%','underlay-color':'#1579d8','underlay-opacity':.12,'underlay-padding':3,'overlay-opacity':0}},
 {selector:'edge:selected',style:{'width':2.4,'opacity':1,'line-color':'#79e4ff','underlay-opacity':.35,'underlay-padding':5}},
 {selector:'.undirected',style:{'target-arrow-shape':'none'}},{selector:'.muted',style:{'opacity':.35}}
],layout:{name:'preset'}});
function refreshLabels(){cy.nodes().forEach(n=>n.data('displayLabel',n.data('subtitle')?`${n.data('label')}\n${n.data('subtitle')}`:n.data('label')))}
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(t._x);t._x=setTimeout(()=>t.classList.remove('show'),1800)}
function project(){return JSON.stringify({elements:cy.json().elements,pan:cy.pan(),zoom:cy.zoom(),structure:state.structure})}
function snapshot(){if(state.restoring)return;const s=project();if(state.history.at(-1)!==s)state.history.push(s);if(state.history.length>60)state.history.shift();state.future=[];localStorage.setItem('dotcanvas-future-project',s);updateEmpty()}
function restore(raw){state.restoring=true;try{const p=typeof raw==='string'?JSON.parse(raw):raw;cy.elements().remove();cy.add(p.elements||[]);refreshLabels();state.structure=p.structure||'mindmap';setStructureUI();cy.pan(p.pan||{x:innerWidth/2,y:innerHeight/2});const restoredZoom=Number(p.zoom)||1;cy.zoom(cy.nodes().length<=15?Math.max(.55,restoredZoom):restoredZoom);cy.nodes().forEach(n=>n.data('locked')?n.lock():n.unlock())}finally{state.restoring=false;updateEmpty();updateInspector()}}
function beforeChange(){}
function updateEmpty(){$('#emptyState').hidden=cy.nodes().length>0;$('#statusText').textContent=cy.nodes().length?`${cy.nodes().length} nodes · ${cy.edges().length} links`:'Ready'}
function setTool(tool){state.tool=tool;document.querySelectorAll('.tool[data-tool]').forEach(b=>b.classList.toggle('active',b.dataset.tool===tool));if(state.connectFrom){state.connectFrom.removeClass('connect-source');state.connectFrom=null}toast(({select:'Select and move',add:'Tap canvas to add a node',child:'Tap a parent node',connect:'Tap source, then destination',edit:'Tap a node to edit'})[tool])}
function addNode(pos,label='New node',parent=null){const data=defaults(label);cy.add({group:'nodes',data,position:pos});refreshLabels();if(parent)cy.add({group:'edges',data:{id:`e_${uid()}`,source:parent.id(),target:data.id}});cy.$id(data.id).select();snapshot();updateInspector();return cy.$id(data.id)}
function addChild(){const n=cy.$('node:selected').first();if(!n.length)return toast('Select a parent node first');addNode({x:n.position('x')+220,y:n.position('y')+80},'New child',n)}
cy.on('tap',e=>{if(e.target===cy&&state.tool==='add')addNode(e.position)});
cy.on('tap','node',e=>{const n=e.target;cy.$(':selected').unselect();n.select();updateInspector();if(innerWidth<761)$('#inspector').classList.add('open');if(state.tool==='child')addNode({x:n.position('x')+210,y:n.position('y')+80},'New child',n);if(state.tool==='edit')setTimeout(()=>$('#labelInput').focus(),50);if(state.tool==='connect'){if(!state.connectFrom){state.connectFrom=n;n.addClass('connect-source');toast('Now tap the destination node')}else if(state.connectFrom.id()!==n.id()){cy.add({group:'edges',data:{id:`e_${uid()}`,source:state.connectFrom.id(),target:n.id()}});state.connectFrom.removeClass('connect-source');state.connectFrom=null;snapshot();toast('Nodes connected')}}});
cy.on('tap','edge',e=>{cy.$(':selected').unselect();e.target.select();updateInspector()});cy.on('dragfree','node',snapshot);cy.on('zoom',()=>$('#zoomText').textContent=`${Math.round(cy.zoom()*100)}%`);cy.on('pan zoom',()=>localStorage.setItem('dotcanvas-future-view',JSON.stringify({pan:cy.pan(),zoom:cy.zoom()})));cy.on('dbltap','node',e=>{e.target.select();updateInspector();$('#inspector').classList.add('open');setTimeout(()=>$('#labelInput').focus(),30)});
function updateInspector(){const n=cy.$('node:selected').first(),controls=$('#nodeControls');if(!n.length){$('#inspectorTitle').textContent=cy.$('edge:selected').length?'Connection selected':'No node selected';controls.classList.add('disabled');return}controls.classList.remove('disabled');$('#inspectorTitle').textContent=n.data('label')||n.id();$('#labelInput').value=n.data('label')||'';$('#subtitleInput').value=n.data('subtitle')||'';$('#shapeInput').value=n.data('shape')||'roundrectangle';$('#sizeInput').value=n.data('size')||150;$('#fillInput').value=n.data('fill')||'#14263a';$('#textInput').value=n.data('textColor')||'#eef7ff';$('#borderInput').value=n.data('border')||'#2d8cff';$('#lockInput').checked=n.locked()}
function bindData(id,key,event='input'){ $(id).addEventListener(event,e=>{const n=cy.$('node:selected').first();if(!n.length)return;n.data(key,e.target.value);refreshLabels();if(key==='label')$('#inspectorTitle').textContent=e.target.value;snapshot()})}
bindData('#labelInput','label');bindData('#subtitleInput','subtitle');bindData('#shapeInput','shape','change');bindData('#sizeInput','size');bindData('#fillInput','fill');bindData('#textInput','textColor');bindData('#borderInput','border');$('#lockInput').addEventListener('change',e=>{const n=cy.$('node:selected').first();if(!n.length)return;n.data('locked',e.target.checked);e.target.checked?n.lock():n.unlock();snapshot()});
document.querySelectorAll('.tool[data-tool]').forEach(b=>b.onclick=()=>setTool(b.dataset.tool));$('#startNodeBtn').onclick=()=>addNode({x:0,y:0},'Central idea');$('#deleteBtn').onclick=()=>{const sel=cy.$(':selected');if(!sel.length)return;sel.remove();snapshot();updateInspector()};$('#duplicateBtn').onclick=()=>{const n=cy.$('node:selected').first();if(!n.length)return;const d={...n.data(),id:uid(),label:`${n.data('label')} copy`};cy.add({group:'nodes',data:d,position:{x:n.position('x')+50,y:n.position('y')+50}}).select();refreshLabels();snapshot();updateInspector()};$('#addChildInspectorBtn').onclick=addChild;function readableFit(duration=350){if(!cy.elements().length)return;cy.animate({fit:{eles:cy.elements(),padding:90},duration,complete:()=>{if(cy.nodes().length<=15&&cy.zoom()<.62){cy.zoom({level:.62,renderedPosition:{x:cy.width()/2,y:cy.height()/2}})}}})}$('#fitBtn').onclick=()=>readableFit(350);$('#closeInspector').onclick=()=>$('#inspector').classList.remove('open');
function roots(){const r=cy.nodes().filter(n=>n.indegree()===0);return r.length?r:cy.nodes().first()}
function posManual(type){const ns=cy.nodes().toArray(),n=ns.length;if(!n)return;const root=roots().first();const others=ns.filter(x=>x.id()!==root.id());if(type==='timeline'){ns.forEach((x,i)=>x.position({x:i*220,y:(i%2?45:-45)}));return}if(type==='matrix'){const cols=Math.max(2,Math.ceil(Math.sqrt(n)));ns.forEach((x,i)=>x.position({x:(i%cols)*210,y:Math.floor(i/cols)*110}));return}if(type==='gantt'){ns.forEach((x,i)=>x.position({x:(i%4)*210+Math.floor(i/4)*70,y:Math.floor(i/4)*95}));return}if(type==='fishbone'){root.position({x:430,y:0});others.forEach((x,i)=>{const row=Math.floor(i/2),up=i%2===0;x.position({x:250-row*105,y:up?-90-(row%2)*45:90+(row%2)*45})});return}if(type==='bubble'){root.position({x:0,y:0});others.forEach((x,i)=>{const a=i/Math.max(1,others.length)*Math.PI*2,r=180+(i%3)*22;x.position({x:Math.cos(a)*r,y:Math.sin(a)*r})});return}}
function runStructure(type){state.structure=type;setStructureUI();const animate=$('#animateLayout').checked;const done=()=>{setTimeout(snapshot,animate?650:50)};if(['timeline','matrix','gantt','fishbone','bubble'].includes(type)){posManual(type);cy.animate({fit:{eles:cy.elements(),padding:90},duration:animate?450:0,complete:()=>{if(cy.nodes().length<=15&&cy.zoom()<.62)cy.zoom({level:.62,renderedPosition:{x:cy.width()/2,y:cy.height()/2}})});done();return}let cfg={fit:true,padding:100,animate,animationDuration:520};if(type==='mindmap')cfg={...cfg,name:'breadthfirst',directed:true,roots:roots(),spacingFactor:1.45};if(type==='flowchart')cfg={...cfg,name:'breadthfirst',directed:true,roots:roots(),spacingFactor:1.25};if(type==='orgchart'||type==='tree')cfg={...cfg,name:'breadthfirst',directed:true,roots:roots(),spacingFactor:1.4};if(type==='concept')cfg={...cfg,name:'cose',idealEdgeLength:180,nodeRepulsion:900000,gravity:.13,numIter:900};cy.layout(cfg).run();done()}
function setStructureUI(){$('#layoutSelect').value=state.structure;$('#structureText').textContent=STRUCTURES[state.structure].short;document.querySelectorAll('.structure-card').forEach(c=>c.classList.toggle('active',c.dataset.type===state.structure))}
Object.entries(STRUCTURES).forEach(([k,v])=>{const o=document.createElement('option');o.value=k;o.textContent=v.name;$('#layoutSelect').appendChild(o);const b=document.createElement('button');b.type='button';b.className='structure-card';b.dataset.type=k;b.innerHTML=`<i class="mini ${v.icon}"></i><div><b>${v.name}</b><span>${v.desc}</span></div>`;b.onclick=()=>applyStructure(k);$('#structureGrid').appendChild(b)});
function template(type){const N=(id,label,x,y,extra={})=>({group:'nodes',data:{...defaults(label),id,...extra},position:{x,y}}),E=(a,b)=>({group:'edges',data:{id:`e_${uid()}`,source:a,target:b}});let e=[];if(type==='mindmap')e=[N('c','Central idea',0,0),N('a','Research',220,-130),N('b','Design',220,-40),N('d','Build',220,50),N('f','Launch',220,140),E('c','a'),E('c','b'),E('c','d'),E('c','f')];if(type==='flowchart')e=[N('s','Start',0,0,{shape:'ellipse'}),N('p','Process',220,0),N('q','Decision?',440,0,{shape:'diamond'}),N('y','Yes',650,-90),N('n','No',650,90),E('s','p'),E('p','q'),E('q','y'),E('q','n')];if(type==='fishbone')e=[N('effect','Observed effect',430,0),N('people','People',190,-130),N('process','Process',70,-80),N('tools','Tools',190,130),N('env','Environment',70,80),E('people','effect'),E('process','effect'),E('tools','effect'),E('env','effect')];if(type==='timeline')e=[N('t1','Discovery',0,-45),N('t2','Planning',220,45),N('t3','Build',440,-45),N('t4','Launch',660,45),E('t1','t2'),E('t2','t3'),E('t3','t4')];if(type==='matrix')e=['A1','A2','B1','B2','C1','C2'].map((x,i)=>N(x,x,(i%3)*210,Math.floor(i/3)*110));if(type==='gantt')e=[N('g1','Research · Week 1',0,0),N('g2','Design · Week 2',220,95),N('g3','Build · Weeks 3–4',440,190),N('g4','Launch · Week 5',700,285),E('g1','g2'),E('g2','g3'),E('g3','g4')];if(type==='orgchart')e=[N('ceo','Director',0,0),N('ops','Operations',-220,150),N('prod','Product',0,150),N('sales','Sales',220,150),E('ceo','ops'),E('ceo','prod'),E('ceo','sales')];if(type==='tree')e=[N('root','Root',0,0),N('l','Branch A',-180,140),N('r','Branch B',180,140),N('l1','Leaf A1',-270,280),N('l2','Leaf A2',-90,280),N('r1','Leaf B1',90,280),N('r2','Leaf B2',270,280),E('root','l'),E('root','r'),E('l','l1'),E('l','l2'),E('r','r1'),E('r','r2')];if(type==='concept')e=[N('c','Core concept',0,0),N('a','Related idea',220,-130),N('b','Evidence',240,100),N('d','Context',-220,100),N('f','Outcome',-220,-130),E('c','a'),E('c','b'),E('c','d'),E('c','f'),E('a','b'),E('d','f')];if(type==='bubble')e=[N('c','Main topic',0,0,{shape:'ellipse',size:130}),N('a','Idea A',190,0,{shape:'ellipse',size:100}),N('b','Idea B',0,190,{shape:'ellipse',size:110}),N('d','Idea C',-190,0,{shape:'ellipse',size:90}),N('f','Idea D',0,-190,{shape:'ellipse',size:105}),E('c','a'),E('c','b'),E('c','d'),E('c','f')];return e}
function applyStructure(type){if($('#replaceWithTemplate').checked||!cy.nodes().length){cy.elements().remove();cy.add(template(type));refreshLabels()}runStructure(type);$('#structuresDialog').close();toast(`${STRUCTURES[type].name} applied`)}
$('#structuresBtn').onclick=$('#emptyStructuresBtn').onclick=$('#openStructuresInspector').onclick=()=>{$('#structuresDialog').showModal();setStructureUI()};$('#reflowBtn').onclick=()=>runStructure(state.structure);$('#layoutSelect').onchange=e=>runStructure(e.target.value);
$('#undoBtn').onclick=()=>{if(state.history.length<2)return;const current=state.history.pop();state.future.push(current);restore(state.history.at(-1))};$('#redoBtn').onclick=()=>{const next=state.future.pop();if(!next)return;state.history.push(next);restore(next)};
function parseAttrs(raw=''){const out={};const re=/(\w+)\s*=\s*("(?:\\.|[^"])*"|[^,\]\s]+)/g;let m;while((m=re.exec(raw)))out[m[1]]=m[2].replace(/^"|"$/g,'').replace(/\\n/g,'\n').replace(/\\"/g,'"');return out}
function parseDot(dot){const clean=dot.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/.*$/gm,'').replace(/#.*$/gm,'');const nodes=new Map(),edges=[];const edgeRe=/([A-Za-z_][\w.-]*|"[^"]+")\s*(->|--)\s*([A-Za-z_][\w.-]*|"[^"]+")\s*(?:\[([^\]]*)\])?/g;let m;const norm=s=>s.replace(/^"|"$/g,'');while((m=edgeRe.exec(clean))){const a=norm(m[1]),b=norm(m[3]);nodes.set(a,nodes.get(a)||{});nodes.set(b,nodes.get(b)||{});edges.push([a,b,m[2],parseAttrs(m[4])])}const statementRe=/(?:^|[;{}\n])\s*([A-Za-z_][\w.-]*|"[^"]+")\s*\[([^\]]+)\]/g;while((m=statementRe.exec(clean))){const id=norm(m[1]);if(['node','edge','graph'].includes(id))continue;nodes.set(id,{...(nodes.get(id)||{}),...parseAttrs(m[2])})}const elements=[];for(const [id,a] of nodes){const shapeMap={box:'rectangle',rect:'rectangle',ellipse:'ellipse',circle:'ellipse',diamond:'diamond',hexagon:'hexagon'};elements.push({group:'nodes',data:{...defaults(a.label||id),id,label:a.label||id,shape:shapeMap[a.shape]||'roundrectangle',fill:a.fillcolor||'#14263a',border:a.color||'#2d8cff',textColor:a.fontcolor||'#eef7ff'}})}edges.forEach(([a,b,op],i)=>elements.push({group:'edges',classes:op==='--'?'undirected':'',data:{id:`e_${i}_${uid()}`,source:a,target:b}}));return elements}
function importText(text,name='Imported graph'){try{if(text.trim().startsWith('{'))restore(JSON.parse(text));else{const els=parseDot(text);if(!els.some(e=>e.group==='nodes'))throw new Error('No nodes found');cy.elements().remove();cy.add(els);refreshLabels();runStructure('mindmap')}snapshot();toast(`${name} opened`)}catch(e){console.error(e);toast('Could not parse this file')}}
$('#fileInput').onchange=async e=>{const f=e.target.files[0];if(!f)return;importText(await f.text(),f.name);e.target.value=''};['dragenter','dragover'].forEach(type=>$('#canvasWrap').addEventListener(type,e=>{e.preventDefault();$('#canvasWrap').classList.add('dragging')}));['dragleave','drop'].forEach(type=>$('#canvasWrap').addEventListener(type,e=>{e.preventDefault();$('#canvasWrap').classList.remove('dragging')}));$('#canvasWrap').addEventListener('drop',async e=>{const f=e.dataTransfer.files[0];if(f)importText(await f.text(),f.name)});$('#exampleBtn').onclick=()=>{cy.elements().remove();cy.add(template('concept'));refreshLabels();runStructure('concept')};
const esc=s=>String(s??'').replace(/\\/g,'\\\\').replace(/"/g,'\\"').replace(/\n/g,'\\n');function toDot(){const lines=['digraph DotCanvas {','  graph [overlap=false, splines=curved];','  node [style=filled];'];cy.nodes().forEach(n=>{const d=n.data(),p=n.position(),shape={roundrectangle:'box',rectangle:'box',ellipse:'ellipse',diamond:'diamond',hexagon:'hexagon'}[d.shape]||'box';lines.push(`  "${esc(n.id())}" [label="${esc(d.label)}", shape=${shape}, fillcolor="${d.fill}", color="${d.border}", fontcolor="${d.textColor}", pos="${p.x.toFixed(1)},${(-p.y).toFixed(1)}!"];`)});cy.edges().forEach(e=>lines.push(`  "${esc(e.source().id())}" -> "${esc(e.target().id())}";`));lines.push('}');return lines.join('\n')}
function download(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)}$('#exportBtn').onclick=()=>$('#exportDialog').showModal();document.querySelectorAll('[data-export]').forEach(b=>b.onclick=()=>{const type=b.dataset.export;if(type==='dot')download(new Blob([toDot()],{type:'text/vnd.graphviz'}),'dotcanvas-future.dot');if(type==='json')download(new Blob([project()],{type:'application/json'}),'dotcanvas-future.json');if(type==='png'||type==='jpg'){const uri=type==='png'?cy.png({full:true,scale:2,bg:'transparent'}):cy.jpg({full:true,scale:2,bg:'#040c17'});const a=document.createElement('a');a.href=uri;a.download=`dotcanvas-future.${type}`;a.click()}$('#exportDialog').close()});document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?$('#redoBtn').click():$('#undoBtn').click()}if((e.key==='Delete'||e.key==='Backspace')&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName))$('#deleteBtn').click()});
const saved=localStorage.getItem('dotcanvas-future-project');if(saved){restore(saved);state.history=[saved]}else{snapshot()}setStructureUI();updateEmpty();


// Progressive Web App support
(function setupPWA(){
  const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  document.documentElement.classList.toggle('standalone', standalone);

  const installTip = document.querySelector('#installTip');
  const dismissInstallTip = document.querySelector('#dismissInstallTip');
  const updateNotice = document.querySelector('#updateNotice');
  const reloadAppBtn = document.querySelector('#reloadAppBtn');
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const tipDismissed = localStorage.getItem('dotcanvas-install-tip-dismissed') === '1';

  if (isIOS && !standalone && !tipDismissed && installTip) {
    window.setTimeout(() => { installTip.hidden = false; }, 1200);
  }
  dismissInstallTip?.addEventListener('click', () => {
    installTip.hidden = true;
    localStorage.setItem('dotcanvas-install-tip-dismissed', '1');
  });

  if (!('serviceWorker' in navigator)) return;
  let waitingWorker = null;

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('./service-worker.js', { scope: './' });

      const showUpdate = worker => {
        waitingWorker = worker;
        if (updateNotice) updateNotice.hidden = false;
      };
      if (registration.waiting) showUpdate(registration.waiting);

      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) showUpdate(worker);
        });
      });

      reloadAppBtn?.addEventListener('click', () => {
        waitingWorker?.postMessage({ type: 'SKIP_WAITING' });
      });

      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });
    } catch (error) {
      console.error('DotCanvas service worker registration failed:', error);
    }
  });
})();
