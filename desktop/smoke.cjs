const {app,BrowserWindow,globalShortcut}=require('electron');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
require('./main.cjs');
const timer=setTimeout(()=>{console.error('Desktop smoke test timed out');app.exit(1);},30000);
app.whenReady().then(async()=>{try{
 const wins=BrowserWindow.getAllWindows();wins.forEach(w=>w.webContents.on('console-message',event=>{if(event.level==='error')console.error(event.message);}));
 await Promise.all(wins.map(w=>new Promise(resolve=>{const done=()=>{resolve();};w.webContents.once('did-finish-load',done);if(w.webContents.getURL().endsWith('.html')&&!w.webContents.isLoading())resolve();}))); 

 const editor=wins.find(w=>w.webContents.getURL().endsWith('/index.html')),overlay=wins.find(w=>w.webContents.getURL().endsWith('/overlay.html'));
 const startupMessage=await editor.webContents.executeJavaScript(`document.getElementById('message').textContent`);
 const result=await editor.webContents.executeJavaScript(`(()=>{
 window.magigraph.setDesign({version:1,settings:{stroke:1.25,outlineRatio:.02},shapes:[{id:'smoke-curve',type:'cubic',x:0,y:0,size:1,rotation:0,points:[{x:-30,y:-15},{x:-25,y:25},{x:25,y:-25},{x:30,y:15}]}]});
 document.querySelector('#layers button').click();
 document.getElementById('traceDiameter').value=400;document.getElementById('traceX').value=100;document.getElementById('traceY').value=100;document.getElementById('traceOpacity').value=.8;
 document.getElementById('traceX').dispatchEvent(new Event('input'));
 document.getElementById('traceToggle').click();
 return {lines:document.querySelectorAll('#handles polyline').length,points:document.querySelectorAll('#handles [data-handle]').length,center:[document.querySelector('#handles [data-transform="move"]').getAttribute('cx'),document.querySelector('#handles [data-transform="move"]').getAttribute('cy')],panel:!document.getElementById('tracePanel').hidden};})()`);

 const markerKinds=await editor.webContents.executeJavaScript(`({endpoints:document.querySelectorAll('#handles circle[data-marker="endpoint"]').length,controls:document.querySelectorAll('#handles rect[data-marker="control"]').length,redLast:document.getElementById('handles').lastElementChild.dataset.marker})`);
 assert.deepEqual(markerKinds,{endpoints:2,controls:2,redLast:'move'});
 const layout=await editor.webContents.executeJavaScript(`(()=>{const sidebar=document.querySelector('main>aside'),edge=sidebar.getBoundingClientRect().right;return {fields:Array.from(sidebar.querySelectorAll('label:has(>input[type=number])')).every(label=>{let input=label.querySelector('input'),r=input.getBoundingClientRect(),text=document.createRange();text.selectNodeContents(label.firstChild);return text.getBoundingClientRect().right<=r.left+.5&&r.right<=edge;}),sliders:['X','Y'].every(axis=>document.getElementById('trace'+axis+'Slider').getBoundingClientRect().width>100)};})()`);
 assert.ok(layout.fields,'Sidebar number fields must not overlap labels or escape the sidebar');assert.ok(layout.sliders);
 for(const key of ['CommandOrControl+Shift+Right','CommandOrControl+Shift+Left','CommandOrControl+Shift+F'])if(!globalShortcut.isRegistered(key)){assert.ok(startupMessage.includes(key),'Shortcut conflicts must be reported');console.log('Shortcut already owned by another running app:',key);}
 assert.equal(result.lines,2);assert.equal(result.points,4);assert.deepEqual(result.center,['0','0']);assert.equal(result.panel,true);
 // Wait for the image decode in the receiving renderer before capturing it.
 await overlay.webContents.executeJavaScript(`new Promise(resolve=>{let img=document.getElementById('trace');if(img.src&&img.complete)resolve();else img.onload=resolve;})`);
 assert.equal(editor.isVisible(),true,'The editor must be visible as well as the overlay');
 assert.equal(overlay.getBounds().width,440);assert.equal(overlay.isVisible(),true);
 const data=await overlay.webContents.executeJavaScript(`(()=>{let img=document.getElementById('trace');return {src:decodeURIComponent(img.src),width:img.naturalWidth};})()`);
 assert.ok(data.width>0);assert.ok(data.src.includes('polyline'));assert.ok(!data.src.includes('refImage'));
 assert.ok(data.src.includes('traceGuideLines'));assert.ok(data.src.includes('r="25"'));assert.ok(data.src.includes('r="12.5"'));assert.ok(data.src.includes('r="37.5"'));
 await overlay.webContents.executeJavaScript(`document.getElementById('trace').decode().then(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))))`);
 fs.writeFileSync(path.join(app.isPackaged?app.getPath('userData'):__dirname,'smoke-preview.png'),(await overlay.webContents.capturePage()).toPNG());
 await editor.webContents.executeJavaScript(`new Promise(resolve=>{window.traceDesktop.onAlignment(value=>{if(value)resolve();});document.getElementById('traceAlign').click();})`);
 assert.equal(overlay.isFocusable(),false,'Alignment must not activate the overlay');
 const alignment=await overlay.webContents.executeJavaScript(`new Promise(resolve=>{const check=()=>{if(document.body.classList.contains('aligning'))resolve({region:getComputedStyle(document.body).webkitAppRegion,button:getComputedStyle(document.getElementById('lock')).webkitAppRegion});};new MutationObserver(check).observe(document.body,{attributes:true});check();})`);
 assert.notEqual(alignment.region,'drag');assert.equal(alignment.button,'no-drag');
 await overlay.webContents.executeJavaScript(`window.traceDesktop.drag('start');window.traceDesktop.drag('move');window.traceDesktop.drag('end');`);
 assert.equal(overlay.isFocused(),false);assert.equal(overlay.isVisible(),true);
 const positionUpdate=editor.webContents.executeJavaScript(`new Promise(resolve=>{window.traceDesktop.onPosition(position=>{if(position.x===160&&position.y===190)resolve();});})`);
 overlay.setPosition(160,190);await positionUpdate;
 assert.deepEqual(await editor.webContents.executeJavaScript(`['traceX','traceY'].map(id=>Number(document.getElementById(id).value))`),[160,190]);
 assert.deepEqual(await editor.webContents.executeJavaScript(`(()=>{let p=JSON.parse(localStorage.getItem('magigraph-trace-v1'));return[p.traceX,p.traceY];})()`),[160,190]);
 const pinned=new Promise(resolve=>overlay.once('show',resolve));
 const pinBounds=overlay.getBounds();
 const pin=await overlay.webContents.executeJavaScript(`(()=>{let r=document.getElementById('lock').getBoundingClientRect();return{x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)};})()`);
 overlay.webContents.sendInputEvent({type:'mouseDown',...pin,button:'left',clickCount:1});
 overlay.webContents.sendInputEvent({type:'mouseUp',...pin,button:'left',clickCount:1});
 await pinned;
 assert.equal(overlay.isFocusable(),false);
 assert.equal(overlay.isVisible(),true);assert.deepEqual(overlay.getBounds(),pinBounds);
 assert.equal(await overlay.webContents.executeJavaScript(`document.getElementById('alignmentBar').hidden`),true);
 const hidden=new Promise(resolve=>overlay.once('hide',resolve));
 await editor.webContents.executeJavaScript(`document.getElementById('traceToggle').click();`);await hidden;
 const restored=new Promise(resolve=>overlay.once('show',resolve));
 await editor.webContents.executeJavaScript(`document.getElementById('traceRestore').click();`);await restored;
 assert.equal(overlay.isVisible(),true);assert.deepEqual(overlay.getBounds(),pinBounds);
 await editor.webContents.executeJavaScript(`document.getElementById('traceGuides').click();`);
 const noGuides=await overlay.webContents.executeJavaScript(`new Promise(resolve=>{let img=document.getElementById('trace');const check=()=>{if(!decodeURIComponent(img.src).includes('traceGuideLines'))resolve(true);};new MutationObserver(check).observe(img,{attributes:true});check();})`);
 assert.equal(noGuides,true);
 // Sliders, numeric fine tuning and window dragging must share one position.
 const movedBySlider=editor.webContents.executeJavaScript(`new Promise(resolve=>{window.traceDesktop.onPosition(p=>{if(p.x===250&&p.y===190)resolve();});let slider=document.getElementById('traceXSlider');slider.value=250;slider.dispatchEvent(new Event('input'));})`);
 await movedBySlider;assert.equal(overlay.getBounds().x,250);
 const movedByNumber=editor.webContents.executeJavaScript(`new Promise(resolve=>{window.traceDesktop.onPosition(p=>{if(p.x===250&&p.y===191)resolve();});let field=document.getElementById('traceY');field.stepUp();field.dispatchEvent(new Event('input'));})`);
 await movedByNumber;assert.equal(overlay.getBounds().y,191);
 assert.deepEqual(await editor.webContents.executeJavaScript(`['traceXSlider','traceYSlider'].map(id=>Number(document.getElementById(id).value))`),[250,191]);
 await editor.webContents.executeJavaScript(`(()=>{let field=document.getElementById('traceX');field.value=-120;field.dispatchEvent(new Event('input'));})()`);
 assert.equal(await editor.webContents.executeJavaScript(`Number(document.getElementById('traceXSlider').value)`),-120);
 // Quadratic control exactly on the chord midpoint formerly covered the red dot.
 const quadratic=await editor.webContents.executeJavaScript(`(()=>{
 const q={id:'q',type:'quadratic',x:0,y:0,size:1,rotation:0,points:[{x:-20,y:0},{x:0,y:0},{x:20,y:0}]};
 window.magigraph.setDesign({version:1,settings:{stroke:1.25,outlineRatio:.02},shapes:[q,{...q,id:'next',y:12}]});document.querySelector('#layers button').click();
 const root=document.getElementById('handles'),red=root.lastElementChild;
 return {count:root.querySelectorAll('[data-handle]').length,control:root.querySelector('[data-marker="control"]').tagName,last:red.dataset.marker,center:[red.getAttribute('cx'),red.getAttribute('cy')]};})()`);
 assert.deepEqual(quadratic,{count:3,control:'rect',last:'move',center:['0','0']});
 await overlay.webContents.executeJavaScript(`new Promise(resolve=>{let img=document.getElementById('trace');const check=()=>{let src=decodeURIComponent(img.src);if(src.includes('data-id="q"')&&src.includes('data-marker="control"'))resolve();};new MutationObserver(check).observe(img,{attributes:true});check();})`);
 const overlayMarkers=await overlay.webContents.executeJavaScript(`(()=>{const xml=new DOMParser().parseFromString(decodeURIComponent(document.getElementById('trace').src).split(',').slice(1).join(','),'image/svg+xml');const group=xml.documentElement.lastElementChild;return{red:group.lastElementChild.getAttribute('data-marker'),control:group.querySelector('[data-marker="control"]').tagName};})()`);
 assert.deepEqual(overlayMarkers,{red:'move',control:'rect'});
 const numberView=await editor.webContents.executeJavaScript(`(()=>{
 document.getElementById('numbers').checked=true;document.getElementById('numbers').dispatchEvent(new Event('change'));
 document.getElementById('preview').checked=true;document.getElementById('preview').dispatchEvent(new Event('change'));
 const badges=[...document.querySelectorAll('#numberLabels [data-shape-number]')];
 return{numbers:badges.map(b=>b.querySelector('text').textContent),positions:badges.map(b=>[b.querySelector('circle').getAttribute('cx'),b.querySelector('circle').getAttribute('cy')]),readable:badges.every(b=>b.querySelector('text').getBoundingClientRect().width>0),handles:document.getElementById('handles').children.length,rightNavigation:!!document.getElementById('traceNext').closest('aside.right'),rightShortcuts:!!document.getElementById('desktopShortcuts').closest('aside.right'),legendInCenter:!!document.querySelector('.canvas-stage .canvas-legend'),sizeControlsOnLeft:!!document.getElementById('handleSize').closest('#tracePanel'),detailsAfterList:!!(document.getElementById('layers').compareDocumentPosition(document.getElementById('inspector'))&Node.DOCUMENT_POSITION_FOLLOWING)};})()`);
 assert.deepEqual(numberView.numbers,['1','2']);assert.notDeepEqual(numberView.positions[0],numberView.positions[1]);assert.ok(numberView.readable);assert.equal(numberView.handles,0);assert.ok(numberView.rightNavigation&&numberView.rightShortcuts&&numberView.legendInCenter&&numberView.sizeControlsOnLeft&&numberView.detailsAfterList);
 await overlay.webContents.executeJavaScript(`new Promise(resolve=>{let img=document.getElementById('trace');const check=()=>{if(decodeURIComponent(img.src).includes('data-shape-number="1"'))resolve();};new MutationObserver(check).observe(img,{attributes:true});check();})`);
 await editor.webContents.executeJavaScript(`document.getElementById('preview').checked=false;document.getElementById('preview').dispatchEvent(new Event('change'));`);
 // Use the same IPC dispatch as the global shortcut, while the overlay is hidden.
 const hideForStep=new Promise(resolve=>overlay.once('hide',resolve));await editor.webContents.executeJavaScript(`document.getElementById('traceToggle').click()`);await hideForStep;
 const shownByStep=new Promise(resolve=>overlay.once('show',resolve));
 await editor.webContents.executeJavaScript(`new Promise(resolve=>{window.traceDesktop.onStep(delta=>{if(delta===1)resolve();});window.traceDesktop.step(1);})`);await shownByStep;
 assert.equal(overlay.isVisible(),true);assert.equal(overlay.isFocused(),false);
 await overlay.webContents.executeJavaScript(`new Promise(resolve=>{let img=document.getElementById('trace');const check=()=>{if(decodeURIComponent(img.src).includes('data-shape-number="2"'))resolve();};new MutationObserver(check).observe(img,{attributes:true});check();})`);
 assert.equal(await editor.webContents.executeJavaScript(`document.getElementById('traceSelection').textContent`),'2 / 2 · 곡선');
 await editor.webContents.executeJavaScript(`new Promise(resolve=>{window.traceDesktop.onStep(delta=>{if(delta===-1)resolve();});document.getElementById('tracePrev').click();})`);
 assert.equal(await editor.webContents.executeJavaScript(`document.getElementById('traceSelection').textContent`),'1 / 2 · 곡선');
 assert.deepEqual(await editor.webContents.executeJavaScript(`['tracePrev','traceNext'].map(id=>document.getElementById(id).disabled)`),[true,false]);
 console.log('Sidebar layout, slider/fine-step sync, negative coordinates, marker roles, quadratic red marker and stroke navigation passed.');
 console.log('Desktop smoke passed: rendering, non-activating alignment, mouse pin click, delayed click-through redraw, visibility recovery, position persistence and guides.');
 await editor.webContents.executeJavaScript(`loadCharacterPreset('footballer-seven')`);
 const preset=await editor.webContents.executeJavaScript(`window.magigraph.getDesign()`);assert.equal(preset.shapes.length,60);assert.ok(preset.shapes[0].id.startsWith('footballer-'));console.log('Footballer preset loads in desktop');
 // Full view must include all 60 strokes even without selection or during playback.
 await editor.webContents.executeJavaScript(`(()=>{document.getElementById('step').value=1;document.getElementById('step').dispatchEvent(new Event('input'));})()`);
 editor.webContents.send('trace-full-toggle');
 const fullDrawing=await overlay.webContents.executeJavaScript(`new Promise(resolve=>{let img=document.getElementById('trace');const check=()=>{let xml=new DOMParser().parseFromString(decodeURIComponent(img.src.slice(img.src.indexOf(',')+1)),'image/svg+xml'),ink=xml.querySelector('[data-overlay-art="full"]');if(ink?.children.length===60)resolve({count:ink.children.length,numbers:xml.querySelectorAll('[data-shape-number]').length,handles:xml.querySelectorAll('[data-handle]').length});};new MutationObserver(check).observe(img,{attributes:true});check();})`);
 assert.deepEqual(fullDrawing,{count:60,numbers:60,handles:0});
 assert.equal(await editor.webContents.executeJavaScript(`JSON.parse(localStorage.getItem('magigraph-trace-v1')).traceFull`),true);
 editor.webContents.send('trace-full-toggle');
 await editor.webContents.executeJavaScript(`document.querySelectorAll('#layers .layer>button:first-child')[1].click();`);
 const selectedOnly=await overlay.webContents.executeJavaScript(`new Promise(resolve=>{let img=document.getElementById('trace');const check=()=>{let xml=new DOMParser().parseFromString(decodeURIComponent(img.src.slice(img.src.indexOf(',')+1)),'image/svg+xml'),ink=xml.querySelector('[data-overlay-art="selected"]');if(ink?.children.length===1)resolve({count:ink.children.length,numbers:xml.querySelectorAll('[data-shape-number]').length,handles:xml.querySelectorAll('[data-handle]').length});};new MutationObserver(check).observe(img,{attributes:true});check();})`);
 assert.equal(selectedOnly.count,1);assert.equal(selectedOnly.numbers,1);assert.ok(selectedOnly.handles>0);
 assert.equal(await editor.webContents.executeJavaScript(`JSON.parse(localStorage.getItem('magigraph-trace-v1')).traceFull`),false);
 await editor.webContents.executeJavaScript(`document.getElementById('traceFull').checked=true;document.getElementById('traceFull').dispatchEvent(new Event('change'));`);
 console.log('Full-drawing shortcut dispatch on/off, checkbox synchronization, playback independence and persisted preference passed.');
 await editor.webContents.executeJavaScript(`document.querySelector('#layers button').click();document.getElementById('step').value=document.getElementById('step').max;document.getElementById('step').dispatchEvent(new Event('input'));document.getElementById('numbers').checked=true;document.getElementById('numbers').dispatchEvent(new Event('change'));window.scrollTo(0,0);`);
 await new Promise(resolve=>setTimeout(resolve,150));
 const badgeCount=await editor.webContents.executeJavaScript(`({badges:document.querySelectorAll('#numberLabels [data-shape-number]').length,shapes:window.magigraph.getDesign().shapes.length})`);assert.deepEqual(badgeCount,{badges:60,shapes:60});
 console.log('Number badges in preview/overlay and 60-shape numbering passed.');
 fs.writeFileSync(path.join(app.isPackaged?app.getPath('userData'):__dirname,'smoke-editor.png'),(await editor.webContents.capturePage()).toPNG());
 clearTimeout(timer);app.exit(0);
 }catch(e){console.error(e);clearTimeout(timer);app.exit(1);}});
