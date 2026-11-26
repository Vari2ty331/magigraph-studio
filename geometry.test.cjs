const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('app.js','utf8').split('function draw(){')[0];
const context={document:{getElementById(){}}};vm.createContext(context);
vm.runInContext(source+`;globalThis.api={validate,normalizeDesign,exportGraph,contained,world,width,selectionFrame,transformFromPointer,moveHandle,numberAnchor};`,context);
const {validate,normalizeDesign,exportGraph,contained,width}=context.api;
const base={version:1,settings:{stroke:1,outlineRatio:.014},shapes:[]};
const shape=(type,extra={})=>({id:'a',type,x:0,y:0,size:20,rotation:0,...extra});
assert.equal(contained(shape('circle',{x:39.8})),true);
assert.equal(contained(shape('circle',{x:40})),false,'stroke must be inside boundary');
assert.equal(contained(shape('disc',{x:40})),true);
assert.equal(contained(shape('square',{size:75,rotation:45})),false);
assert.equal(contained(shape('line',{size:98.75})),true);
assert.equal(contained(shape('line',{size:100})),false);
const q=shape('quadratic',{size:1,points:[{x:-20,y:0},{x:0,y:70},{x:20,y:0}]});
assert.equal(contained(q),true,'outside control point is allowed if curve stays inside');
assert.equal(contained({...q,points:[{x:-20,y:0},{x:0,y:120},{x:20,y:0}]}),false);
assert.throws(()=>validate({...base,shapes:Array.from({length:61},(_,i)=>shape('disc',{id:String(i)}))}),/60/);
assert.throws(()=>validate({...base,shapes:[shape('disc'),shape('disc')]}),/중복/);
assert.throws(()=>validate({...base,shapes:[shape('cubic',{points:[]})]}),/좌표점/);
assert.throws(()=>validate({...base,shapes:[shape('line',{size:NaN})]}),/올바르지/);
assert.throws(()=>validate({...base,shapes:[shape('disc',{x:49})]}),/원 밖/);
validate({...base,shapes:Array.from({length:60},(_,i)=>shape('disc',{id:String(i)}))});
assert.equal(width(shape('line',{size:10})),1.25);
assert.equal(width(shape('line',{size:80})),1.25);
assert.equal(width(shape('quadratic',{size:80})),1.25);
assert.equal(width(shape('cubic',{size:80})),1.25);
assert.equal(width(shape('square',{size:53.25}))*4,4.26);
assert.equal(width(shape('square',{size:18}))*4,1.44);
console.log('Geometry, format and screenshot calibration checks passed');

const strokes=count=>Array.from({length:count},(_,i)=>shape('disc',{id:`stroke-${i+1}`}));
for(const graphCount of [2,3]){
 const limit=graphCount*60,input={...base,graphCount,shapes:strokes(limit)},normalized=normalizeDesign(input);
 assert.equal(normalized.graphCount,graphCount);
 assert.equal(normalized.shapes.length,limit);
 assert.ok(input.shapes.every(s=>!('graph' in s)),'Import normalization must preserve the input');
 for(let graph=1;graph<=graphCount;graph++){
  const single=exportGraph(graph,normalized);
  assert.equal(single.shapes.length,60);
  assert.equal(single.shapes[0].id,`stroke-${(graph-1)*60+1}`);
  assert.equal(single.shapes[59].id,`stroke-${graph*60}`);
  assert.ok(!('graphCount' in single)&&single.shapes.every(s=>!('graph' in s)));
  validate(single);
 }
 assert.throws(()=>validate({...input,shapes:strokes(limit+1)}),new RegExp(String(limit)));
}
const assigned={...base,graphCount:2,shapes:[{...strokes(1)[0],graph:2},shape('circle',{id:'frame',graph:1}),shape('line',{id:'detail',graph:2})]};
assert.deepEqual(Array.from(normalizeDesign(assigned).shapes,s=>s.id),['frame','stroke-1','detail']);
assert.throws(()=>validate({...assigned,shapes:strokes(61).map(s=>({...s,graph:2}))}),/2번.+60/);
assert.throws(()=>validate({...assigned,shapes:[...assigned.shapes,shape('disc',{id:'unassigned'})]}),/graph/);
assert.throws(()=>validate({...assigned,shapes:[shape('disc',{graph:3})]}),/graph/);
assert.throws(()=>validate({...assigned,graphCount:4}),/graphCount/);
console.log('Combined design budgets, group assignment and single-graph export checks passed');

const {selectionFrame,transformFromPointer}=context.api;
const square=shape('square',{x:3,y:4,size:20,rotation:30});
const scaled=transformFromPointer(square,'resize',{x:13,y:14},{x:23,y:24});
assert.equal(scaled.size,40);assert.equal(scaled.x,3);assert.equal(scaled.y,4);assert.equal(scaled.rotation,30);
const rotated=transformFromPointer(square,'rotate',{x:13,y:4},{x:3,y:14});
assert.ok(Math.abs(rotated.rotation-120)<1e-8);assert.equal(rotated.size,20);
assert.equal(transformFromPointer(square,'rotate',{x:13,y:4},{x:13,y:6},true).rotation,45);
assert.equal(transformFromPointer(square,'resize',{x:13,y:4},{x:3,y:4}).size,.1);
assert.equal(transformFromPointer(square,'resize',{x:13,y:4},{x:1000,y:4}).size,200);
assert.equal(width(transformFromPointer(shape('line'),'resize',{x:10,y:0},{x:20,y:0})),1.25);
const cubic=shape('cubic',{points:[{x:-.5,y:0},{x:-.2,y:.5},{x:.2,y:-.5},{x:.5,y:0}]});
assert.equal(JSON.stringify(transformFromPointer(cubic,'resize',{x:10,y:0},{x:20,y:0}).points),JSON.stringify(cubic.points));
assert.equal(selectionFrame(cubic).corners.length,4);
assert.equal(contained(transformFromPointer(square,'resize',{x:13,y:4},{x:100,y:100})),false);
console.log('Interactive resize / rotation checks passed');

const combined=transformFromPointer(square,'transform',{x:13,y:4},{x:3,y:24});
assert.equal(combined.size,40);assert.ok(Math.abs(combined.rotation-120)<1e-8);
assert.equal(combined.x,3);assert.equal(combined.y,4);
console.log('Combined one-dot transform checks passed');

// Off-center, transformed endpoints determine the move handle; controls cannot move it.
const testCurve=shape('cubic',{x:7,y:-3,size:2,rotation:90,points:[{x:2,y:4},{x:90,y:80},{x:-70,y:45},{x:6,y:8}]});
let marker=context.api.moveHandle(testCurve);
assert.ok(Math.abs(marker.x+5)<1e-8);assert.ok(Math.abs(marker.y-5)<1e-8);
const changedControls=JSON.parse(JSON.stringify(testCurve));changedControls.points[1]={x:0,y:0};changedControls.points[2]={x:1,y:1};
assert.deepEqual(context.api.moveHandle(changedControls),marker);
changedControls.points[3].x+=4;
assert.ok(Math.abs(context.api.moveHandle(changedControls).y-9)<1e-8);
console.log('Endpoint-midpoint move marker checks passed');

for(const name of ['round-character','striped-character','footballer-seven'])validate(JSON.parse(fs.readFileSync('designs/'+name+'.json','utf8')));
console.log('All shipped presets pass simulator validation');

const numbered={id:'numbered',type:'quadratic',x:0,y:0,size:1,rotation:0,points:[{x:10,y:20},{x:20,y:0},{x:30,y:20}]};
assert.deepEqual(JSON.parse(JSON.stringify(context.api.numberAnchor(numbered))),{x:20,y:10});
const shiftedNumber=JSON.parse(JSON.stringify(numbered));shiftedNumber.points=shiftedNumber.points.map(p=>({x:p.x-15,y:p.y+5}));
assert.deepEqual(JSON.parse(JSON.stringify(context.api.numberAnchor(shiftedNumber))),{x:5,y:15});
console.log('Shape-number anchors follow curve geometry, not shared object origins');
