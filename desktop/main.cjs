const {app,BrowserWindow,ipcMain,globalShortcut,session,screen,clipboard}=require('electron');
const fs=require('node:fs/promises');
const path=require('node:path');
// Stable transparent-window rendering on this Windows/NAS setup.
app.disableHardwareAcceleration();
app.setName('Magigraph Studio');
const smoke=process.argv.includes('--self-test')||process.argv.some(arg=>path.basename(arg)==='smoke.cjs');
app.setPath('userData',smoke?path.join(app.getPath('temp'),'magigraph-smoke-'+process.pid):path.join(app.getPath('appData'),'Magigraph Studio'));
let editor,overlay,controls,lastImage,shown=false,aligning=false,placementDrag=null,modeTimer,panelEnabled=true;
let controlState={selection:'선택한 획 없음',full:false,x:100,y:100,diameter:400,opacity:.8};
function syncControls(){if(controls&&!controls.isDestroyed())controls.webContents.send('trace-controls-state',{...controlState,shown,aligning});}
function pinControls(){
 if(!controls||controls.isDestroyed())return;
 // Never drop topmost or rewrite focusability while handling a click/blur.
 controls.setAlwaysOnTop(true,'screen-saver');

}
function showControls(){if(panelEnabled&&controls&&!controls.isDestroyed()){if(controls.isMinimized())controls.restore();pinControls();if(!controls.isVisible())controls.show();pinControls();syncControls();editor.webContents.send('trace-panel-status',true);}}
function reveal(){
 if(overlay.isDestroyed())return;
 shown=true;overlay.showInactive();overlay.moveTop();
 if(lastImage)overlay.webContents.send('trace-image',lastImage);
 overlay.webContents.invalidate();editor.webContents.send('trace-status',true);
 showControls();
}
function stepStroke(delta){editor.webContents.send('trace-step',delta);reveal();}
function sendScreenBounds(){
 if(!editor||editor.isDestroyed())return;
 const displays=screen.getAllDisplays().map(d=>d.bounds);
 const limits=(axis,length)=>({min:Math.max(-30000,Math.min(...displays.map(d=>d[axis]))),max:Math.min(30000,Math.max(...displays.map(d=>d[axis]+d[length])))});
 editor.webContents.send('trace-bounds',{x:limits('x','width'),y:limits('y','height')});
}
function setAlignment(value){
 clearTimeout(modeTimer);placementDrag=null;aligning=value;
 if(controls&&!controls.isDestroyed()){controls.setSize(360,value?395:150);pinControls();}
 // Keep WS_EX_NOACTIVATE in both modes. Activating the overlay can disturb games.
 // Do not reset the topmost window style during pinning.
 if(aligning)overlay.setIgnoreMouseEvents(false);
 overlay.webContents.send('trace-alignment',aligning);editor.webContents.send('trace-alignment',aligning);
 syncControls();
 if(aligning)reveal();
 else modeTimer=setTimeout(()=>{
  if(overlay.isDestroyed()||aligning)return;
  // Let the pin click and toolbar repaint finish before changing hit testing.
  overlay.setIgnoreMouseEvents(true);
  if(shown){overlay.hide();reveal();}
 },100);
}
function protect(win){win.webContents.setWindowOpenHandler(()=>({action:'deny'}));win.webContents.on('will-navigate',e=>e.preventDefault());}
function toggle(){placementDrag=null;shown=!shown;if(shown)overlay.showInactive();else overlay.hide();editor.webContents.send('trace-status',shown);showControls();}
app.whenReady().then(()=>{
 session.defaultSession.setPermissionRequestHandler((w,p,done)=>done(false));
 const webPreferences={preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true};
 editor=new BrowserWindow({width:1400,height:950,webPreferences});
 editor.once('ready-to-show',()=>{editor.show();editor.focus();});
 overlay=new BrowserWindow({width:440,height:440,x:100,y:100,frame:false,transparent:true,backgroundColor:'#00000000',alwaysOnTop:true,skipTaskbar:true,focusable:false,resizable:false,show:false,webPreferences});
 overlay.setIgnoreMouseEvents(true);protect(editor);protect(overlay);
 controls=new BrowserWindow({width:360,height:150,x:560,y:100,frame:false,alwaysOnTop:false,skipTaskbar:true,focusable:true,resizable:true,minWidth:360,maxWidth:360,show:false,backgroundColor:'#172024',webPreferences});
 // A normal focusable tool window avoids Windows activation/style races.
 controls.on('blur',()=>setImmediate(()=>{if(!controls.isDestroyed()&&panelEnabled&&controls.isVisible())pinControls();}));
 editor.on('blur',()=>{if(panelEnabled&&controls.isVisible())pinControls();});
 protect(controls);controls.loadFile(path.join(__dirname,'controls.html'));
 controls.webContents.on('did-finish-load',syncControls);
 overlay.loadFile(path.join(__dirname,'overlay.html'));
 overlay.webContents.on('did-finish-load',()=>{if(lastImage)overlay.webContents.send('trace-image',lastImage);overlay.webContents.send('trace-alignment',aligning);});
 let positionTimer;overlay.on('move',()=>{
  const {x,y}=overlay.getBounds();controlState={...controlState,x,y};syncControls();
  clearTimeout(positionTimer);positionTimer=setTimeout(()=>{if(editor.isDestroyed()||overlay.isDestroyed())return;let {x,y}=overlay.getBounds();editor.webContents.send('trace-position',{x,y});},40);
 });
 const designArg=process.argv.find(arg=>/^--design=(round-character|striped-character|footballer-seven)$/.test(arg));
 editor.loadFile(path.join(__dirname,'..','index.html'),designArg?{query:{design:designArg.split('=')[1]}}:{});
 editor.on('closed',()=>app.quit());
 editor.webContents.on('did-finish-load',sendScreenBounds);
 // Packaged file:// resources cannot rely on browser fetch. Only expose bundled assets.
 const readableResources=new Set(['AI-GUIDE.md',...['round-character','striped-character','footballer-seven'].map(name=>`designs/${name}.json`)]);
 ipcMain.handle('read-resource',async(e,name)=>{
  if(e.sender!==editor.webContents||!readableResources.has(name))throw Error('허용되지 않은 자료입니다.');
  const root=app.isPackaged&&name==='AI-GUIDE.md'?path.dirname(app.getPath('exe')):path.join(__dirname,'..');
  return fs.readFile(path.join(root,name),'utf8');
 });
 ipcMain.handle('copy-text',(e,text)=>{
  if(e.sender!==editor.webContents||typeof text!=='string'||text.length>2000000)throw Error('복사할 안내문이 올바르지 않습니다.');
  return clipboard.writeText(text);
 });
 for(const event of ['display-added','display-removed','display-metrics-changed'])screen.on(event,sendScreenBounds);
 const isController=e=>e.sender===editor.webContents||e.sender===controls.webContents;
 ipcMain.on('trace-panel',(e,value)=>{if(!isController(e)||typeof value!=='boolean')return;panelEnabled=value;if(value)showControls();else controls.hide();editor.webContents.send('trace-panel-status',value);});
 ipcMain.handle('trace-controls-edit',e=>{if(e.sender!==controls.webContents)return;controls.focus();});
 ipcMain.on('trace-placement',(e,data)=>{
  if(e.sender!==controls.webContents||!data||!['x','y','diameter','opacity'].includes(data.key)||!Number.isFinite(data.value))return;
  const value=data.value;if(data.key==='opacity'?(value<.1||value>1):data.key==='diameter'?(value<100||value>3000):Math.abs(value)>30000)return;
  editor.webContents.send('trace-placement',data);
 });
 ipcMain.on('trace-full-request',e=>{if(isController(e))editor.webContents.send('trace-full-toggle');});
 ipcMain.on('trace-step-request',(e,delta)=>{if(isController(e)&&(delta===1||delta===-1))stepStroke(delta);});
 ipcMain.on('trace-update',(e,data)=>{
  if(e.sender!==editor.webContents||!data||typeof data.image!=='string'||!data.image.startsWith('data:image/svg+xml,')||data.image.length>2000000)return;
  if(![data.x,data.y,data.diameter,data.opacity].every(Number.isFinite)||data.diameter<100||data.diameter>3000||Math.abs(data.x)>30000||Math.abs(data.y)>30000||data.opacity<.1||data.opacity>1)return;
  if(data.place===true)overlay.setBounds({x:Math.round(data.x),y:Math.round(data.y),width:Math.round(data.diameter*1.1),height:Math.round(data.diameter*1.1)});
  overlay.setOpacity(data.opacity);lastImage=data.image;
  overlay.webContents.send('trace-image',lastImage);
  const position=overlay.getBounds();
  controlState={selection:typeof data.selection==='string'?data.selection.slice(0,100):'선택한 획 없음',full:data.full===true,x:position.x,y:position.y,diameter:data.diameter,opacity:data.opacity};syncControls();
 });
 ipcMain.on('trace-toggle',e=>{if(isController(e))toggle();});
 ipcMain.on('trace-restore',e=>{if(e.sender===editor.webContents)reveal();});
 ipcMain.on('trace-align',(e,value)=>{if((isController(e)||e.sender===overlay.webContents)&&typeof value==='boolean')setAlignment(value);});
 ipcMain.on('trace-drag',(e,phase)=>{
  if(e.sender!==overlay.webContents)return;
  if(phase==='end'){placementDrag=null;return;}
  if(!aligning||!shown)return;
  if(phase==='start'){placementDrag={cursor:screen.getCursorScreenPoint(),bounds:overlay.getBounds()};return;}
  if(phase==='move'&&placementDrag){let cursor=screen.getCursorScreenPoint(),start=placementDrag;overlay.setPosition(start.bounds.x+cursor.x-start.cursor.x,start.bounds.y+cursor.y-start.cursor.y);}
 });
 const shortcuts=[['CommandOrControl+Shift+F',()=>editor.webContents.send('trace-full-toggle')],['CommandOrControl+Shift+M',()=>setAlignment(!aligning)],['CommandOrControl+Shift+Space',toggle],['CommandOrControl+Shift+Right',()=>stepStroke(1)],['CommandOrControl+Shift+Left',()=>stepStroke(-1)]];
 const unavailable=shortcuts.filter(([key,action])=>!globalShortcut.register(key,action)).map(([key])=>key);
 if(unavailable.length)editor.webContents.once('did-finish-load',()=>editor.webContents.send('trace-error',`다른 프로그램에서 사용 중인 단축키: ${unavailable.join(', ')}. 오버레이 패널의 버튼을 사용하세요.`));

});
app.on('will-quit',()=>globalShortcut.unregisterAll());
app.on('window-all-closed',()=>app.quit());
if(process.argv.includes('--self-test'))require('./smoke.cjs');
