// Windows Chromium child processes may fail when the runtime lives on a NAS.
// Keep the executable runtime local; project files can stay on the shared drive.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {spawn}=require('node:child_process');
let executable=require('electron');
if(process.platform==='win32'){
 const version=require('electron/package.json').version;
 const runtime=path.join(process.env.LOCALAPPDATA||os.tmpdir(),'Magigraph Studio','runtime',version);
 const ready=path.join(runtime,'ready.txt');
 if(!fs.existsSync(ready)){
  console.log('Preparing local desktop runtime (project stays on the shared drive)...');
  fs.mkdirSync(runtime,{recursive:true});fs.cpSync(path.dirname(executable),runtime,{recursive:true});fs.writeFileSync(ready,version);
 }
 executable=path.join(runtime,'electron.exe');
}
const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
console.log('Opening Magigraph Studio...');
const designArg=process.argv.find(arg=>/^--design=(round-character|striped-character|footballer-seven)$/.test(arg));
const child=spawn(executable,[path.join(__dirname,process.argv.includes('--smoke')?'smoke.cjs':'main.cjs'),...(designArg?[designArg]:[])],{stdio:'inherit',env,windowsHide:false});
child.on('error',e=>{console.error(e);process.exitCode=1;});
child.on('exit',code=>{process.exitCode=code??1;});
