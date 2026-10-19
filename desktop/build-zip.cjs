const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {build,Platform,Arch}=require('electron-builder');
async function main(){
 const root=path.resolve(__dirname,'..'),pkg=require('../package.json');
 const output=path.join(process.env.LOCALAPPDATA||os.tmpdir(),'Magigraph Studio','builds',Date.now().toString());
 const localRuntime=path.join(process.env.LOCALAPPDATA||os.tmpdir(),'Magigraph Studio','runtime',pkg.devDependencies.electron);
 const files=await build({projectDir:root,targets:Platform.WINDOWS.createTarget('zip',Arch.x64),config:{
  appId:'studio.magigraph.desktop',productName:'Magigraph Studio',asar:true,
  electronVersion:pkg.devDependencies.electron,
  ...(fs.existsSync(path.join(localRuntime,'electron.exe'))?{electronDist:localRuntime}:{}),
  directories:{output},artifactName:'Magigraph-Studio-${version}-Windows-x64.${ext}',
  files:['index.html','style.css','app.js','AI-GUIDE.md','design.schema.json','designs/*.json',
   'desktop/main.cjs','desktop/preload.cjs','desktop/overlay.html','desktop/overlay.css','desktop/overlay.js','desktop/smoke.cjs'],
  extraFiles:[{from:'desktop/START-HERE.txt',to:'START-HERE.txt'},{from:'AI-GUIDE.md',to:'AI-GUIDE.md'},
   {from:'design.schema.json',to:'design.schema.json'},{from:'designs',to:'Designs',filter:['*.json']}],
  win:{target:['zip'],signAndEditExecutable:false},npmRebuild:false,publish:null
 }});
 const destination=path.join(root,'dist');fs.mkdirSync(destination,{recursive:true});
 for(const file of files)if(file.endsWith('.zip')){const target=path.join(destination,path.basename(file));fs.copyFileSync(file,target);console.log('ZIP ready:',target);}
 fs.writeFileSync(path.join(destination,'latest-build.json'),JSON.stringify({output,exe:path.join(output,'win-unpacked','Magigraph Studio.exe'),archives:files},null,2));
}
main().catch(error=>{console.error(error);process.exitCode=1;});
