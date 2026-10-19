const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('traceDesktop',{
 update:data=>ipcRenderer.send('trace-update',data),
 step:delta=>ipcRenderer.send('trace-step-request',delta),
 onBounds:fn=>ipcRenderer.on('trace-bounds',(_e,value)=>fn(value)),
 toggle:()=>ipcRenderer.send('trace-toggle'),
 restore:()=>ipcRenderer.send('trace-restore'),
 align:value=>ipcRenderer.send('trace-align',value),
 drag:phase=>ipcRenderer.send('trace-drag',phase),
 onAlignment:fn=>ipcRenderer.on('trace-alignment',(_e,value)=>fn(value)),
 onPosition:fn=>ipcRenderer.on('trace-position',(_e,value)=>fn(value)),
 onImage:fn=>ipcRenderer.on('trace-image',(_e,image)=>fn(image)),
 onStatus:fn=>ipcRenderer.on('trace-status',(_e,shown)=>fn(shown)),
 onFullToggle:fn=>ipcRenderer.on('trace-full-toggle',()=>fn()),
 onStep:fn=>ipcRenderer.on('trace-step',(_e,delta)=>fn(delta)),
 onError:fn=>ipcRenderer.on('trace-error',(_e,message)=>fn(message))
});
