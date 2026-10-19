'use strict';
const $=id=>document.getElementById(id), NS='http://www.w3.org/2000/svg';
const TYPES=['line','circle','disc','square','filled-square','triangle','filled-triangle','quadratic','cubic'];
const NAMES={'line':'직선','circle':'빈 원','disc':'꽉 찬 원','square':'빈 네모','filled-square':'꽉 찬 네모','triangle':'빈 세모','filled-triangle':'꽉 찬 세모','quadratic':'곡선','cubic':'2점 곡선'};
const LABELS=['↗ 직선','○ 빈 원','● 꽉 찬 원','□ 빈 네모','■ 꽉 찬 네모','△ 빈 세모','▲ 꽉 찬 세모','⌒ 곡선','∿ 2점 곡선'];
let doc={version:1,settings:{stroke:1.25,outlineRatio:.02},shapes:[]},selected=null,tool='select',history=[],future=[],drag=null,visible=0;
const clone=x=>JSON.parse(JSON.stringify(x));
function el(tag,attrs={}){let e=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));return e;}
function notify(s){$('message').textContent=s;}
function snapshot(){history.push(clone(doc));if(history.length>100)history.shift();future=[];}
function persist(){try{localStorage.setItem('magigraph-studio-v1',JSON.stringify(doc));}catch{} }
function shape(){return doc.shapes.find(s=>s.id===selected);}
function world(s,p){let a=s.rotation*Math.PI/180,c=Math.cos(a),d=Math.sin(a);return {x:s.x+s.size*(p.x*c-p.y*d),y:s.y+s.size*(p.x*d+p.y*c)};}
function local(s,p){let a=-s.rotation*Math.PI/180,c=Math.cos(a),d=Math.sin(a),x=(p.x-s.x)/s.size,y=(p.y-s.y)/s.size;return{x:x*c-y*d,y:x*d+y*c};}
function vertices(s){if(s.type.includes('square'))return[{x:-.5,y:-.5},{x:.5,y:-.5},{x:.5,y:.5},{x:-.5,y:.5}];return[{x:0,y:-1/Math.sqrt(3)},{x:.5,y:1/(2*Math.sqrt(3))},{x:-.5,y:1/(2*Math.sqrt(3))}];}
function width(s,settings=doc.settings){return ['line','quadratic','cubic'].includes(s.type)?settings.stroke:s.size*settings.outlineRatio;}
function isFilled(s){return s.type==='disc'||s.type.startsWith('filled');}
function controls(s){return s.type==='line'?[{x:-.5,y:0},{x:.5,y:0}]:s.points;}
// The move marker follows the endpoint chord, independently of curve controls.
function moveHandle(s){if(!['line','quadratic','cubic'].includes(s.type))return{x:s.x,y:s.y};let ps=controls(s),a=world(s,ps[0]),b=world(s,ps.at(-1));return{x:(a.x+b.x)/2,y:(a.y+b.y)/2};}
function handleMetrics(){let matrix=$('canvas').getScreenCTM(),scale=matrix?Math.hypot(matrix.a,matrix.b):1;return{radius:Number($('handleSize').value)/2/scale,line:Number($('handleWidth').value)/scale};}
function curveContained(ps,r,depth=0){if(ps.every(p=>Math.hypot(p.x,p.y)<=r))return true;if(Math.hypot(ps[0].x,ps[0].y)>r||Math.hypot(ps.at(-1).x,ps.at(-1).y)>r)return false;if(depth>16)return false;let rows=[ps],left=[ps[0]],right=[ps.at(-1)];while(rows.at(-1).length>1){let row=rows.at(-1),next=row.slice(1).map((p,i)=>({x:(p.x+row[i].x)/2,y:(p.y+row[i].y)/2}));rows.push(next);left.push(next[0]);right.unshift(next.at(-1));}return curveContained(left,r,depth+1)&&curveContained(right,r,depth+1);}
function contained(s,settings=doc.settings){let r=50-(isFilled(s)?0:width(s,settings)/2);if(s.type==='circle'||s.type==='disc')return Math.hypot(s.x,s.y)+s.size/2<=r;if(['line','quadratic','cubic'].includes(s.type))return curveContained(controls(s).map(p=>world(s,p)),r);return vertices(s).every(p=>{let q=world(s,p);return Math.hypot(q.x,q.y)<=r;});}
function validate(d){if(d.version!==1||!d.settings||!Array.isArray(d.shapes))throw Error('버전 1 도안 형식(settings, shapes)이 필요합니다.');if(d.shapes.length>60)throw Error('도형은 최대 60개까지 배치할 수 있습니다.');if(!Number.isFinite(d.settings.stroke)||d.settings.stroke<.1||d.settings.stroke>10||!Number.isFinite(d.settings.outlineRatio)||d.settings.outlineRatio<.001||d.settings.outlineRatio>.1)throw Error('두께 보정값이 올바르지 않습니다.');let ids=new Set();for(let s of d.shapes){if(typeof s.id!=='string'||!s.id||ids.has(s.id))throw Error('도형마다 중복되지 않는 문자열 id가 필요합니다.');ids.add(s.id);if(!TYPES.includes(s.type)||!['x','y','size','rotation'].every(k=>Number.isFinite(s[k]))||s.size<=0||s.size>200)throw Error('도형 종류 또는 위치·크기·회전 값이 올바르지 않습니다.');if(['quadratic','cubic'].includes(s.type)&&(!Array.isArray(s.points)||s.points.length!==(s.type==='quadratic'?3:4)||!s.points.every(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y))))throw Error('곡선에는 종류에 따라 유효한 좌표점 3개 또는 4개가 필요합니다.');if(!contained(s,d.settings))throw Error(`도형 ${s.id}이(가) 원 밖으로 벗어납니다.`);}return d;}
function geometry(s){if(s.type==='circle'||s.type==='disc')return el('circle',{r:.5});if(s.type.includes('square')||s.type.includes('triangle'))return el('polygon',{points:vertices(s).map(p=>`${p.x},${p.y}`).join(' ')});let ps=controls(s),p=ps.map(p=>`${p.x} ${p.y}`);return el('path',{d:s.type==='line'?`M${p[0]} L${p[1]}`:s.type==='quadratic'?`M${p[0]} Q${p[1]} ${p[2]}`:`M${p[0]} C${p[1]} ${p[2]} ${p[3]}`});}
function selectionFrame(s){
 let ps;
 if(s.type==='circle'||s.type==='disc')ps=[{x:-.5,y:-.5},{x:.5,y:.5}];
 else if(['line','quadratic','cubic'].includes(s.type)){
  let cp=controls(s);ps=Array.from({length:65},(_,i)=>{let row=cp.map(p=>({...p})),t=i/64;while(row.length>1)row=row.slice(1).map((p,j)=>({x:row[j].x*(1-t)+p.x*t,y:row[j].y*(1-t)+p.y*t}));return row[0];});
 }else ps=vertices(s);
 let pad=2/s.size,x0=Math.min(...ps.map(p=>p.x))-pad,x1=Math.max(...ps.map(p=>p.x))+pad,y0=Math.min(...ps.map(p=>p.y))-pad,y1=Math.max(...ps.map(p=>p.y))+pad;
 let corners=[{x:x0,y:y0},{x:x1,y:y0},{x:x1,y:y1},{x:x0,y:y1}].map(p=>world(s,p));
 return {corners,stem:world(s,{x:(x0+x1)/2,y:y0}),rotate:world(s,{x:(x0+x1)/2,y:y0-5/s.size})};
}
function transformFromPointer(s,kind,start,p,snap=false){
 let candidate=clone(s),dx=p.x-s.x,dy=p.y-s.y;
 if(kind==='resize'||kind==='transform'){let distance=Math.hypot(start.x-s.x,start.y-s.y);if(distance>.0001)candidate.size=Math.min(200,Math.max(.1,s.size*Math.hypot(dx,dy)/distance));}
 if(kind==='rotate'||kind==='transform'){let angle=Math.atan2(dy,dx)-Math.atan2(start.y-s.y,start.x-s.x);candidate.rotation=s.rotation+Math.atan2(Math.sin(angle),Math.cos(angle))*180/Math.PI;if(snap)candidate.rotation=Math.round(candidate.rotation/15)*15;}
 return candidate;
}
function drawTransformHandles(s,h){
 if(['line','quadratic','cubic'].includes(s.type))return;
 let f=selectionFrame(s),frame=el('polygon',{points:f.corners.map(p=>`${p.x},${p.y}`).join(' '),fill:'transparent',stroke:'#b28840','stroke-width':.3,'stroke-dasharray':'1 .7','data-transform':'move',style:'cursor:move'});h.append(frame);
 let p={x:(f.corners[2].x+f.corners[3].x)/2,y:(f.corners[2].y+f.corners[3].y)/2};
 let handle=el('circle',{cx:p.x,cy:p.y,r:1.1,fill:'#fff3bd',stroke:'#88682a','stroke-width':.3,'data-transform':'transform',style:'cursor:grab'}),title=el('title');title.textContent='드래그: 크기·회전 동시 조절 · Shift: 15° 단위';handle.append(title);h.append(handle);
}
function drawSelectionHandles(s,h,metrics){
 drawTransformHandles(s,h);
 if(['line','quadratic','cubic'].includes(s.type)){
  let ps=controls(s).map(p=>world(s,p));
  if(s.type!=='line'){
   let pairs=s.type==='cubic'?[[ps[0],ps[1]],[ps[3],ps[2]]]:[[ps[0],ps[1]],[ps[2],ps[1]]];
   pairs.forEach(pair=>h.append(el('polyline',{points:pair.map(p=>`${p.x},${p.y}`).join(' '),fill:'none',stroke:'#ffe52e','stroke-width':metrics.line,'pointer-events':'none'})));
  }
  ps.forEach((p,i)=>{
   let endpoint=i===0||i===ps.length-1,r=metrics.radius,half=r/Math.SQRT2;
   let attributes={fill:'#ffe52e',stroke:'#66502a','stroke-width':metrics.line/2,'data-handle':i,'data-marker':endpoint?'endpoint':'control',style:'cursor:crosshair'};
   let marker=endpoint?el('circle',{...attributes,cx:p.x,cy:p.y,r}):el('rect',{...attributes,x:p.x-half,y:p.y-half,width:half*2,height:half*2,transform:`rotate(45 ${p.x} ${p.y})`});
   let title=el('title');title.textContent=endpoint?'끝점 · 드래그하여 위치 조절':'곡률 조절점 · 드래그하여 곡선 모양 조절';marker.append(title);h.append(marker);
  });
 }else{
  let ring=geometry(s);Object.entries({transform:`translate(${s.x} ${s.y}) rotate(${s.rotation}) scale(${s.size})`,fill:'none',stroke:'#b28840','stroke-width':.3/s.size,'stroke-dasharray':`${1/s.size} ${1/s.size}`,'pointer-events':'none'}).forEach(([k,v])=>ring.setAttribute(k,v));h.append(ring);
 }
 // Paint the red midpoint last so a shared quadratic control cannot conceal it.
 let center=moveHandle(s),marker=el('circle',{cx:center.x,cy:center.y,r:metrics.radius,fill:'#df2828',stroke:'#573d25','stroke-width':metrics.line/2,'data-transform':'move','data-marker':'move',style:'cursor:move'}),title=el('title');title.textContent='이동점 · 도형 전체 이동 (겹친 조절점: Alt+드래그)';marker.append(title);h.append(marker);
}
function numberAnchor(s){
 if(!['quadratic','cubic'].includes(s.type))return {x:s.x,y:s.y};
 let row=controls(s).map(p=>({...p}));while(row.length>1)row=row.slice(1).map((p,i)=>({x:(row[i].x+p.x)/2,y:(row[i].y+p.y)/2}));return world(s,row[0]);
}
function drawShapeNumber(s,index,parent,metrics,occupied=[]){
 let anchor=numberAnchor(s),radius=metrics.radius,point=null;
 for(let ring=1;ring<=10&&!point;ring++)for(let i=0;i<12;i++){
  let angle=(-45+i*30)*Math.PI/180,distance=(radius*1.5)+(ring-1)*(radius*2+.5),p={x:anchor.x+Math.cos(angle)*distance,y:anchor.y+Math.sin(angle)*distance};
  if(Math.hypot(p.x,p.y)+radius<49.8&&occupied.every(q=>Math.hypot(p.x-q.x,p.y-q.y)>radius*2+.5)){point=p;break;}
 }
 if(!point){let length=Math.hypot(anchor.x,anchor.y)||1,factor=Math.min(1,(49-radius)/length);point={x:anchor.x*factor,y:anchor.y*factor};}
 occupied.push(point);let group=el('g',{'data-shape-number':index+1,'pointer-events':'none'});
 group.append(el('line',{x1:anchor.x,y1:anchor.y,x2:point.x,y2:point.y,stroke:'#ad4e22','stroke-width':metrics.line}));
 group.append(el('circle',{cx:point.x,cy:point.y,r:radius,fill:'#fff7df',stroke:'#ad4e22','stroke-width':metrics.line}));
 let text=el('text',{x:point.x,y:point.y,'font-size':metrics.font,'font-family':'sans-serif','font-weight':'bold','text-anchor':'middle','dominant-baseline':'central',fill:'#773014'});text.textContent=index+1;group.append(text);parent.append(group);
}
function updateStrokeNavigation(){let index=doc.shapes.findIndex(s=>s.id===selected);$('traceSelection').textContent=index<0?'선택한 획 없음':`${index+1} / ${doc.shapes.length} · ${NAMES[doc.shapes[index].type]}`;$('tracePrev').disabled=!doc.shapes.length||index===0;$('traceNext').disabled=!doc.shapes.length||index===doc.shapes.length-1;}
function draw(){let art=$('art'),h=$('handles');art.replaceChildren();h.replaceChildren();$('numberLabels').replaceChildren();let clean=$('preview').checked;$('gridDisc').style.display=$('grid').checked&&!clean?'':'none';$('gameGuideLines').style.display=$('gameGuide').checked?'':'none';$('refImage').style.display=clean?'none':'';doc.shapes.slice(0,visible).forEach((s,i)=>{let g=el('g',{'data-id':s.id,class:'shape',transform:`translate(${s.x} ${s.y}) rotate(${s.rotation}) scale(${s.size})`}),e=geometry(s);e.setAttribute('fill',isFilled(s)?'#243f9b':'none');e.setAttribute('stroke',isFilled(s)?'none':'#243f9b');e.setAttribute('stroke-width',width(s)/s.size);e.setAttribute('stroke-linejoin','round');e.setAttribute('stroke-linecap','butt');g.append(e);let hit=geometry(s);hit.setAttribute('fill',isFilled(s)?'transparent':'none');hit.setAttribute('stroke','transparent');hit.setAttribute('stroke-width',Math.max(width(s),2)/s.size);g.append(hit);art.append(g);});
if($('numbers').checked){let matrix=$('canvas').getScreenCTM(),scale=matrix?Math.hypot(matrix.a,matrix.b):1,occupied=[];doc.shapes.slice(0,visible).forEach((s,i)=>drawShapeNumber(s,i,$('numberLabels'),{radius:8/scale,font:10/scale,line:1/scale},occupied));}

let s=shape();if(s&&!clean&&doc.shapes.indexOf(s)<visible)drawSelectionHandles(s,h,handleMetrics());
$('count').textContent=`배치된 도형 ${doc.shapes.length} / 60`;$('remaining').textContent=`${60-doc.shapes.length}개 남음`;$('step').max=doc.shapes.length;$('step').value=visible;$('stepText').textContent=`${visible} / ${doc.shapes.length}`;$('undo').disabled=!history.length;$('redo').disabled=!future.length;updateStrokeNavigation();publishTrace();}
function sync(){$('stroke').value=doc.settings.stroke;$('ratio').value=doc.settings.outlineRatio;draw();inspector();layers();persist();}
function update(s,changes){let candidate={...s,...changes};if(!contained(candidate)){notify('도형의 선이나 면이 원 밖으로 벗어나 변경할 수 없습니다.');return false;}snapshot();Object.assign(s,changes);notify('');sync();return true;}
function inspector(){let box=$('inspector');box.replaceChildren();let s=shape();if(!s){box.textContent='선택한 도형이 없습니다.';return;}let title=document.createElement('p');title.textContent=`${doc.shapes.indexOf(s)+1}. ${NAMES[s.type]}`;box.append(title);for(let [key,label]of [['x','중심 X'],['y','중심 Y'],['size','크기 / 배율'],['rotation','회전 (°)']].filter(([key])=>!['quadratic','cubic'].includes(s.type)||key==='x'||key==='y')){let l=document.createElement('label');l.textContent=label;let i=document.createElement('input');i.type='number';i.step=key==='rotation'?'1':'.1';i.value=+s[key].toFixed(3);i.onchange=()=>{let v=Number(i.value);if(!Number.isFinite(v)||(key==='size'&&(v<=0||v>200))){inspector();return;}update(s,{[key]:v});inspector();};l.append(i);box.append(l);}if(s.points){let group=document.createElement('div');group.className='coords';s.points.forEach((p,j)=>['x','y'].forEach(axis=>{let l=document.createElement('label');l.textContent=`P${j} ${axis}`;let i=document.createElement('input');i.type='number';i.step='.01';i.value=+p[axis].toFixed(3);i.onchange=()=>{let v=Number(i.value);if(!Number.isFinite(v))return;let points=clone(s.points);points[j][axis]=v;update(s,{points});inspector();};l.append(i);group.append(l);}));box.append(group);let hint=document.createElement('p');hint.className='hint';hint.textContent='P0과 마지막 점은 양 끝점이며, 그 사이 점은 곡률을 조절하는 점입니다. 좌표는 크기·회전 적용 전의 도형 내부 좌표입니다.';box.append(hint);}for(let [text,fn]of [['도형 복사',()=>{if(doc.shapes.length===60)return notify('도형은 최대 60개까지 배치할 수 있습니다.');snapshot();let copy=clone(s);copy.id=crypto.randomUUID();doc.shapes.push(copy);selected=copy.id;visible=doc.shapes.length;sync();}],['삭제',()=>remove()]]){let b=document.createElement('button');b.textContent=text;b.onclick=fn;box.append(b);}}
function layers(){let scrollTop=$('layers').scrollTop;$('layers').replaceChildren();doc.shapes.forEach((s,i)=>{let row=document.createElement('div');row.className='layer';let b=document.createElement('button');b.textContent=`${String(i+1).padStart(2,'0')}  ${NAMES[s.type]}`;b.className=s.id===selected?'active':'';b.onclick=()=>{selected=s.id;$('preview').checked=false;setTool('select');visible=Math.max(visible,i+1);sync();notify(`${i+1}번 ${NAMES[s.type]} 선택 · 중심점이나 조절점을 드래그하여 편집하세요.`);};row.append(b);for(let [text,delta]of [['↑',-1],['↓',1]]){let b=document.createElement('button');b.textContent=text;b.title='배치 순서 변경';b.disabled=i+delta<0||i+delta>=doc.shapes.length;b.onclick=()=>{snapshot();[doc.shapes[i],doc.shapes[i+delta]]=[doc.shapes[i+delta],doc.shapes[i]];sync();};row.append(b);}let del=document.createElement('button');del.textContent='×';del.className='delete-shape';del.title=`${i+1}번 ${NAMES[s.type]} 삭제`;del.setAttribute('aria-label',del.title);del.onclick=()=>remove(s.id);row.append(del);$('layers').append(row);});$('layers').scrollTop=scrollTop;}
function remove(id=selected){let index=doc.shapes.findIndex(s=>s.id===id);if(index<0)return;snapshot();doc.shapes.splice(index,1);if(selected===id)selected=null;if(index<visible)visible--;sync();notify('도형을 삭제했습니다. 되돌리기로 복원할 수 있습니다.');}
function setTool(t){tool=t;document.querySelectorAll('#tools button').forEach(b=>b.classList.toggle('active',b.dataset.tool===t));$('status').textContent=t==='select'?'중심점: 이동 · 기본 도형 노란 점: 크기·회전 · 직선 양 끝점: 길이·방향 · 곡선 조절점: 모양 변경':`${NAMES[t]} 그리기 · 원 안에서 드래그하세요`;}
['select',...TYPES].forEach((t,i)=>{let b=document.createElement('button');b.textContent=i?LABELS[i-1]:'↖ 선택·이동';b.dataset.tool=t;b.onclick=()=>setTool(t);$('tools').append(b);});
function pointer(e){let p=$('canvas').createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform($('canvas').getScreenCTM().inverse());}
$('canvas').onpointerdown=e=>{if(e.button!==0||$('preview').checked)return;let p=pointer(e),target=e.target.closest('[data-id]'),handle=e.target.getAttribute('data-handle'),transform=e.target.getAttribute('data-transform');if(transform==='move'&&e.altKey&&shape()?.points){let ps=controls(shape()).map(q=>world(shape(),q)),radius=handleMetrics().radius;let index=ps.findIndex((q,i)=>i>0&&i<ps.length-1&&Math.hypot(q.x-p.x,q.y-p.y)<=radius*2);if(index>=0){handle=String(index);transform=null;}}if(transform&&shape()){setTool('select');$('canvas').setPointerCapture(e.pointerId);drag={kind:transform,start:p,original:clone(shape()),before:clone(doc)};return;}if(handle===null&&Math.hypot(p.x,p.y)>50)return;$('canvas').setPointerCapture(e.pointerId);if(handle!==null&&shape()){setTool('select');drag={kind:'handle',index:+handle,start:p,original:clone(shape()),before:clone(doc)};return;}if(tool==='select'){selected=target?.dataset.id||null;let s=shape();if(s)drag={kind:'move',start:p,original:clone(s),before:clone(doc)};sync();return;}if(doc.shapes.length>=60)return notify('도형은 최대 60개까지 배치할 수 있습니다.');let s={id:crypto.randomUUID(),type:tool,x:p.x,y:p.y,size:.1,rotation:0};if(tool==='quadratic')s.points=[{x:-.5,y:0},{x:0,y:.5},{x:.5,y:0}];if(tool==='cubic')s.points=[{x:-.5,y:0},{x:-.2,y:.5},{x:.2,y:-.5},{x:.5,y:0}];if(!contained(s))return;drag={kind:'create',start:p,before:clone(doc),original:clone(s)};doc.shapes.push(s);selected=s.id;visible=doc.shapes.length;sync();};
$('canvas').onpointermove=e=>{if(!drag)return;let p=pointer(e),s=shape();if(!s)return;let candidate=clone(drag.original);if(drag.kind==='transform'){candidate=transformFromPointer(drag.original,drag.kind,drag.start,p,e.shiftKey);}else if(drag.kind==='move'){candidate.x+=p.x-drag.start.x;candidate.y+=p.y-drag.start.y;}else if(drag.kind==='handle'){if(s.type==='line'){let ps=controls(drag.original).map(q=>world(drag.original,q));ps[drag.index]=p;candidate.x=(ps[0].x+ps[1].x)/2;candidate.y=(ps[0].y+ps[1].y)/2;candidate.size=Math.max(.1,Math.hypot(ps[1].x-ps[0].x,ps[1].y-ps[0].y));candidate.rotation=Math.atan2(ps[1].y-ps[0].y,ps[1].x-ps[0].x)*180/Math.PI;}else candidate.points[drag.index]=local(drag.original,p);}else{let dx=p.x-drag.start.x,dy=p.y-drag.start.y;candidate.x=(p.x+drag.start.x)/2;candidate.y=(p.y+drag.start.y)/2;candidate.size=Math.max(.1,Math.hypot(dx,dy));candidate.rotation=Math.atan2(dy,dx)*180/Math.PI;}if(contained(candidate)){Object.assign(s,candidate);notify('');draw();inspector();}else notify('원 경계에 도달했습니다. 선과 면이 모두 원 안에 있어야 합니다.');};
function finish(){if(!drag)return;let before=drag.before;drag=null;if(JSON.stringify(before)!==JSON.stringify(doc)){history.push(before);if(history.length>100)history.shift();future=[];}sync();}
$('canvas').onpointerup=finish;$('canvas').onpointercancel=()=>{if(drag){doc=drag.before;drag=null;selected=null;visible=doc.shapes.length;sync();}};
$('undo').onclick=()=>{if(!history.length)return;future.push(clone(doc));doc=history.pop();selected=null;visible=doc.shapes.length;sync();};$('redo').onclick=()=>{if(!future.length)return;history.push(clone(doc));doc=future.pop();selected=null;visible=doc.shapes.length;sync();};
window.addEventListener('keydown',e=>{if(['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))return;if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();$(e.shiftKey?'redo':'undo').click();return;}if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();remove();}let s=shape(),delta=e.shiftKey?1:.1;if(s&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();update(s,{x:s.x+(e.key==='ArrowRight'?delta:e.key==='ArrowLeft'?-delta:0),y:s.y+(e.key==='ArrowDown'?delta:e.key==='ArrowUp'?-delta:0)});}});
for(let id of ['grid','numbers','preview','gameGuide'])$(id).onchange=()=>{try{localStorage.setItem('magigraph-view-v1',JSON.stringify({gameGuide:$('gameGuide').checked,grid:$('grid').checked,numbers:$('numbers').checked}));}catch{}draw();};$('step').oninput=()=>{visible=+$('step').value;draw();};
for(let [id,key]of [['stroke','stroke'],['ratio','outlineRatio']])$(id).onchange=()=>{let d=clone(doc);d.settings[key]=+$(id).value;try{validate(d);snapshot();doc=d;sync();notify('');}catch(e){notify('도안을 적용할 수 없습니다: '+e.message);$(id).value=doc.settings[key];}};
function applyCalibration(){let candidate=clone(doc);candidate.settings.stroke=1.25;candidate.settings.outlineRatio=.02;try{validate(candidate);snapshot();doc=candidate;sync();notify('스크린샷 기준 두께를 적용했습니다. 되돌리기로 이전 값으로 복원할 수 있습니다.');}catch(e){notify('두께를 적용하지 못했습니다: '+e.message);}}
$('calibrate').onclick=applyCalibration;
function download(name,data,type){let a=document.createElement('a'),url=URL.createObjectURL(new Blob([data],{type}));a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('save').onclick=()=>download('magigraph.json',JSON.stringify(doc,null,2),'application/json');
function loadDesign(d){validate(d);snapshot();doc=clone(d);selected=null;visible=doc.shapes.length;$('stroke').value=doc.settings.stroke;$('ratio').value=doc.settings.outlineRatio;sync();notify('도안을 불러왔습니다.');}
$('load').onchange=async e=>{try{let f=e.target.files[0];if(f)loadDesign(JSON.parse(await f.text()));}catch(e){notify('도안을 적용할 수 없습니다: '+e.message);}e.target.value='';};$('refresh').onclick=()=>$('json').value=JSON.stringify(doc,null,2);$('apply').onclick=()=>{try{loadDesign(parseDesignText($('json').value));}catch(e){notify('도안을 적용할 수 없습니다: '+e.message);}};
let refUrl=null;$('reference').onchange=e=>{let file=e.target.files[0];if(!file)return;if(refUrl)URL.revokeObjectURL(refUrl);refUrl=URL.createObjectURL(file);$('refImage').setAttribute('href',refUrl);e.target.value='';};$('opacity').oninput=()=>$('refImage').setAttribute('opacity',$('opacity').value);$('removeRef').onclick=()=>{$('refImage').removeAttribute('href');if(refUrl)URL.revokeObjectURL(refUrl);refUrl=null;};
$('clear').onclick=()=>{if(!doc.shapes.length)return;snapshot();doc.shapes=[];selected=null;visible=0;sync();notify('모두 삭제했습니다. 되돌리기로 복원할 수 있습니다.');};
function guideText(){return ['마기그래프 디자인 · 수동 제작 순서','원 지름: 100. 중심: (0, 0). 오른쪽이 +X, 아래쪽이 +Y입니다.','크기: 원은 지름, 네모·세모는 한 변의 길이, 직선은 양 끝점 사이의 거리입니다.','회전: 오른쪽을 향한 직선 / 기본 방향의 도형을 기준으로 시계 방향 각도입니다.','곡선: 크기는 내부 좌표의 배율입니다. 아래 좌표는 크기·회전이 적용된 도안 좌표입니다.',`선과 면은 모두 원 안에 있습니다. 직선·곡선 두께: ${doc.settings.stroke} (원 지름 대비 %), 기본 도형 테두리: 크기의 ${(doc.settings.outlineRatio*100).toFixed(2)}%. 게임의 부드러운 테두리는 근사값입니다.`,'',...doc.shapes.map((s,i)=>{let str=`${i+1}. ${NAMES[s.type]} | 중심 (${s.x.toFixed(2)}, ${s.y.toFixed(2)}) | 크기 ${s.size.toFixed(2)} | 회전 ${s.rotation.toFixed(1)}°`;if(['line','quadratic','cubic'].includes(s.type))str+='\n   '+controls(s).map((p,j)=>{let q=world(s,p);return `P${j} (${q.x.toFixed(2)}, ${q.y.toFixed(2)})`;}).join(' · ');return str;})].join('\n');}
$('guide').onclick=()=>download('magigraph-guide.txt',guideText(),'text/plain');
$('svgExport').onclick=()=>{let svg=el('svg',{xmlns:NS,viewBox:'-55 -55 110 110',width:1000,height:1000});svg.append(el('circle',{r:50,fill:'#eee5d2',stroke:'#ab9270','stroke-width':.35}));doc.shapes.forEach(s=>{let g=el('g',{transform:`translate(${s.x} ${s.y}) rotate(${s.rotation}) scale(${s.size})`}),e=geometry(s);Object.entries({fill:isFilled(s)?'#243f9b':'none',stroke:isFilled(s)?'none':'#243f9b','stroke-width':width(s)/s.size,'stroke-linejoin':'round'}).forEach(([k,v])=>e.setAttribute(k,v));g.append(e);svg.append(g);});download('magigraph.svg',new XMLSerializer().serializeToString(svg),'image/svg+xml');};
window.magigraph={getDesign:()=>clone(doc),setDesign:loadDesign,validate:d=>validate(clone(d)),getGuide:guideText};
try{let saved=localStorage.getItem('magigraph-studio-v1');if(saved){doc=validate(JSON.parse(saved));if(doc.settings.stroke===1&&doc.settings.outlineRatio===.014){let calibrated=clone(doc);calibrated.settings.stroke=1.25;calibrated.settings.outlineRatio=.02;try{validate(calibrated);history.push(clone(doc));doc=calibrated;notify('스크린샷 기준 두께로 기본값을 보정했습니다. 되돌리기로 이전 값으로 복원할 수 있습니다.');}catch{notify('기존 도안을 보호하기 위해 두께를 유지했습니다. 경계 근처 도형을 조정한 뒤 스크린샷 기준 적용을 눌러 주세요.');}}}}catch(e){notify('저장된 도안을 복원하지 못했습니다: '+e.message);}visible=doc.shapes.length;$('stroke').value=doc.settings.stroke;$('ratio').value=doc.settings.outlineRatio;try{let view=JSON.parse(localStorage.getItem('magigraph-view-v1')||'null');if(view){$('gameGuide').checked=view.gameGuide!==false;$('grid').checked=view.grid===true;$('numbers').checked=view.numbers===true;}}catch{}setTool('select');sync();$('refresh').click();


async function loadCharacterPreset(name='round-character'){if(!['round-character','striped-character','footballer-seven'].includes(name))return;try{let response=await fetch(`designs/${name}.json`,{cache:'no-store'});if(!response.ok)throw Error('도안 파일을 불러오지 못했습니다.');loadDesign(await response.json());$('preview').checked=true;draw();notify(`참고 캐릭터 도안: 곡선 ${doc.shapes.length}개. 미리보기를 해제하면 개별 편집할 수 있습니다.`);}catch(e){notify(e.message);}}
$('characterPreset').onclick=()=>loadCharacterPreset('round-character');
$('stripedPreset').onclick=()=>loadCharacterPreset('striped-character');
$('footballerPreset').onclick=()=>loadCharacterPreset('footballer-seven');
const requestedDesign=new URLSearchParams(location.search).get('design');
if(['round-character','striped-character','footballer-seven'].includes(requestedDesign))loadCharacterPreset(requestedDesign);

function parseDesignText(value){return JSON.parse(value.trim().replace(/^```(?:json)?\s*\n([\s\S]*?)\n```$/i,'$1'));}
$('copyAi').onclick=async()=>{try{let response=await fetch('AI-GUIDE.md');if(!response.ok)throw Error('안내문을 불러오지 못했습니다.');let guide=await response.text();let prompt='첨부한 참고 이미지 또는 설명을 아래 규칙에 맞는 마기그래프 도안으로 재현해 주세요. 최대 60개 도형을 사용하고, 완전한 JSON을 하나의 코드 블록으로 출력해 주세요. 특징적인 윤곽과 표정을 우선하고 필요한 단순화는 알려 주세요.\n\n'+guide;if($('includeDesign').checked)prompt+='\n\n수정할 현재 도안 JSON:\n```json\n'+JSON.stringify(doc,null,2)+'\n```';$('aiPrompt').value=prompt;try{await navigator.clipboard.writeText(prompt);notify('AI 안내문을 복사했습니다. 원하는 AI에 참고 이미지와 함께 붙여 넣으세요.');}catch{$('aiPrompt').focus();$('aiPrompt').select();notify('자동 복사가 차단되었습니다. 선택된 안내문을 Ctrl/Cmd+C로 복사하세요.');}}catch(e){notify(e.message);}};

for(let id of ['handleSize','handleWidth'])$(id).oninput=()=>draw();
new ResizeObserver(()=>draw()).observe($('canvas'));

function publishTrace(place=false){
 if(!window.traceDesktop)return;
 syncTraceSliders();
 let diameter=Number($('traceDiameter').value),x=Number($('traceX').value),y=Number($('traceY').value),opacity=Number($('traceOpacity').value);
 if(![diameter,x,y,opacity].every(Number.isFinite)||diameter<100||diameter>3000)return;
 let svg=el('svg',{xmlns:NS,viewBox:'-55 -55 110 110'}),s=shape();
 if($('traceGuides').checked){let guide=$('gameGuideLines').cloneNode(true);guide.id='traceGuideLines';guide.removeAttribute('style');guide.setAttribute('stroke','#00e5ff');svg.append(guide);}
 if($('traceRing').checked)svg.append(el('circle',{r:50,fill:'none',stroke:'#00e5ff','stroke-width':100/diameter}));
 if(s&&doc.shapes.indexOf(s)<visible){
  let group=Array.from($('art').children).find(e=>e.dataset.id===s.id);
  if(group){let copy=group.cloneNode(true);if(copy.children.length>1)copy.lastChild.remove();svg.append(copy);}
  if($('numbers').checked)drawShapeNumber(s,doc.shapes.indexOf(s),svg,{radius:8*100/diameter,font:10*100/diameter,line:100/diameter});
  if(!$('preview').checked){let guides=el('g');drawSelectionHandles(s,guides,{radius:Number($('handleSize').value)*50/diameter,line:Number($('handleWidth').value)*100/diameter});svg.append(guides);}
 }
 // The display-only SVG needs no cursor styles; keep the overlay CSP strict.
 for(let node of svg.querySelectorAll('[style]'))node.removeAttribute('style');
 window.traceDesktop.update({x,y,diameter,opacity,place,image:'data:image/svg+xml,'+encodeURIComponent(new XMLSerializer().serializeToString(svg))});
}
function syncTraceSliders(){
 for(let axis of ['X','Y']){let value=Number($('trace'+axis).value),slider=$('trace'+axis+'Slider');if(!Number.isFinite(value))continue;slider.min=Math.max(-30000,Math.min(Number(slider.min),value));slider.max=Math.min(30000,Math.max(Number(slider.max),value));slider.value=value;}
}
function saveTracePreferences(){try{localStorage.setItem('magigraph-trace-v1',JSON.stringify(Object.fromEntries(['traceX','traceY','traceDiameter','traceOpacity'].map(key=>[key,Number($(key).value)]))));}catch{}}
function stepTraceSelection(delta){if(!doc.shapes.length)return;let i=doc.shapes.findIndex(s=>s.id===selected);i=i<0?(delta>0?0:doc.shapes.length-1):Math.max(0,Math.min(doc.shapes.length-1,i+delta));selected=doc.shapes[i].id;visible=Math.max(visible,i+1);$('preview').checked=false;setTool('select');sync();let button=$('layers').children[i]?.firstChild;button?.scrollIntoView({block:'nearest'});}
if(window.traceDesktop){
 $('tracePanel').hidden=false;
 try{let prefs=JSON.parse(localStorage.getItem('magigraph-trace-v1')||'null');if(prefs)for(let id of ['traceX','traceY','traceDiameter','traceOpacity'])if(Number.isFinite(prefs[id]))$(id).value=prefs[id];}catch{}
 for(let id of ['traceX','traceY','traceDiameter','traceOpacity','traceRing','traceGuides'])$(id).oninput=()=>{publishTrace(['traceX','traceY','traceDiameter'].includes(id));saveTracePreferences();};
 for(let axis of ['X','Y'])$('trace'+axis+'Slider').oninput=()=>{$('trace'+axis).value=$('trace'+axis+'Slider').value;publishTrace(true);saveTracePreferences();};
 window.traceDesktop.onBounds(bounds=>{for(let axis of ['X','Y']){let limits=bounds[axis.toLowerCase()];$('trace'+axis+'Slider').min=limits.min;$('trace'+axis+'Slider').max=limits.max;}syncTraceSliders();});
 $('desktopShortcuts').hidden=false;
 $('traceAlign').onchange=()=>window.traceDesktop.align($('traceAlign').checked);
 window.traceDesktop.onAlignment(value=>{$('traceAlign').checked=value;$('traceMode').textContent=value?'위치 맞추기 · 오버레이를 드래그하세요. 끝나면 고정하세요.':'고정됨 · 마우스 입력은 게임으로 전달됩니다.';});
 window.traceDesktop.onPosition(({x,y})=>{$('traceX').value=x;$('traceY').value=y;syncTraceSliders();saveTracePreferences();});
 $('traceRestore').onclick=()=>{publishTrace();window.traceDesktop.restore();};
 $('traceToggle').onclick=()=>{$('preview').checked=false;draw();window.traceDesktop.toggle();};
 window.traceDesktop.onStatus(shown=>{$('traceToggle').textContent=shown?'오버레이 숨기기':'오버레이 표시';});
 window.traceDesktop.onStep(stepTraceSelection);
 window.traceDesktop.onError(notify);publishTrace(true);
}

$('tracePrev').onclick=()=>window.traceDesktop?window.traceDesktop.step(-1):stepTraceSelection(-1);
$('traceNext').onclick=()=>window.traceDesktop?window.traceDesktop.step(1):stepTraceSelection(1);
