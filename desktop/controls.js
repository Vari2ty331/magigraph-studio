let state={shown:false,aligning:false};
window.traceDesktop.onControlsState(value=>{state=value;document.querySelector('.placement').hidden=!value.aligning;document.getElementById('opacitySlider').value=value.opacity;document.getElementById('opacityValue').textContent=Math.round(value.opacity*100)+'%';document.getElementById('selection').textContent=value.selection;document.getElementById('visibility').textContent=value.shown?'오버레이 숨기기':'오버레이 표시';document.getElementById('full').setAttribute('aria-pressed',String(value.full));document.getElementById('align').setAttribute('aria-pressed',String(value.aligning));document.getElementById('align').textContent=value.aligning?'고정':'위치 맞추기';
 for(const [key,v] of [['x',value.x],['y',value.y],['radius',value.diameter/2]]){
  const number=document.getElementById(key+'Number'),slider=document.getElementById(key+'Slider');
  if(document.activeElement!==number||!document.hasFocus())number.value=v;
  if(slider){slider.min=Math.min(Number(slider.min),v);slider.max=Math.max(Number(slider.max),v);slider.value=v;}
 }
});
document.getElementById('prev').onclick=()=>window.traceDesktop.step(-1);
document.getElementById('next').onclick=()=>window.traceDesktop.step(1);
document.getElementById('full').onclick=()=>window.traceDesktop.full();
document.getElementById('visibility').onclick=()=>window.traceDesktop.toggle();
document.getElementById('align').onclick=()=>window.traceDesktop.align(!state.aligning);
document.getElementById('close').onclick=()=>window.traceDesktop.panel(false);
for(const key of ['x','y','radius']){
 const number=document.getElementById(key+'Number'),slider=document.getElementById(key+'Slider');
 number.addEventListener('pointerdown',()=>{window.traceDesktop.editControls().then(()=>number.focus());});
 const update=input=>{const value=input.valueAsNumber;if(!Number.isFinite(value)||value<Number(number.min)||value>Number(number.max))return;
  if(input===slider)number.value=value;else if(slider){slider.min=Math.min(Number(slider.min),value);slider.max=Math.max(Number(slider.max),value);slider.value=value;}
  window.traceDesktop.placement({key:key==='radius'?'diameter':key,value:key==='radius'?value*2:value});
 };
 number.oninput=()=>update(number);if(slider)slider.oninput=()=>update(slider);
 number.onblur=()=>{if(!number.validity.valid||number.value==='')number.value=key==='radius'?state.diameter/2:state[key];};
}

document.getElementById('opacitySlider').oninput=event=>{const value=event.target.valueAsNumber;document.getElementById('opacityValue').textContent=Math.round(value*100)+'%';window.traceDesktop.placement({key:'opacity',value});};
