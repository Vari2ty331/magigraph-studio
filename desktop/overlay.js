window.traceDesktop.onImage(image=>{document.getElementById('trace').src=image;});
window.traceDesktop.onAlignment(value=>{document.body.classList.toggle('aligning',value);document.getElementById('alignmentBar').hidden=!value;});
document.getElementById('lock').onclick=()=>window.traceDesktop.align(false);
let pointer=null;
document.body.addEventListener('pointerdown',event=>{
 if(event.button!==0||!document.body.classList.contains('aligning')||event.target.closest('button'))return;
 event.preventDefault();pointer=event.pointerId;document.body.setPointerCapture(pointer);window.traceDesktop.drag('start');
});
document.body.addEventListener('pointermove',event=>{if(event.pointerId===pointer)window.traceDesktop.drag('move');});
function finishDrag(event){if(event.pointerId!==pointer)return;pointer=null;window.traceDesktop.drag('end');}
for(const type of ['pointerup','pointercancel','lostpointercapture'])document.body.addEventListener(type,finishDrag);
