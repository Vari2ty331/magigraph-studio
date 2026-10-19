import json,math
from pathlib import Path
from PIL import Image,ImageDraw
shapes=[];labels=[]
def curve(label,*coords):
 pts=[{'x':round((x-380)*.142,4),'y':round((y-375)*.142,4)} for x,y in coords]
 shapes.append({'id':f'bunny-{len(shapes)+1:02}','type':'cubic' if len(pts)==4 else 'quadratic','x':0,'y':0,'size':1,'rotation':0,'points':pts});labels.append(label)

curve('왼쪽 귀 바깥',(310,238),(282,196),(237,89),(263,78))
curve('왼쪽 귀 안쪽 외곽',(263,78),(295,54),(357,168),(354,228))
curve('오른쪽 귀 뿌리',(317,114),(310,63),(323,42),(344,66))
curve('오른쪽 귀 바깥',(344,66),(379,97),(403,166),(394,222))
curve('왼쪽 귀 속 왼편',(284,96),(286,135),(310,196),(333,215))
curve('왼쪽 귀 속 오른편',(333,215),(356,240),(331,152),(284,96))
curve('오른쪽 귀 속 왼편',(342,83),(336,114),(358,188),(378,209))
curve('오른쪽 귀 속 오른편',(378,209),(396,228),(382,129),(342,83))
curve('머리 왼쪽 위',(310,238),(240,239),(207,274),(183,326))
curve('머리 왼쪽 옆',(183,326),(153,377),(171,439),(200,476))
curve('왼쪽 볼 아래',(200,476),(210,492),(226,505),(240,510))
curve('머리 오른쪽 위',(417,227),(491,226),(549,263),(571,321))
curve('머리 오른쪽 옆',(571,321),(594,373),(590,439),(556,490))
curve('왼쪽 손 바깥',(240,510),(212,529),(219,569),(247,580))
curve('왼쪽 손 안쪽',(247,580),(283,591),(284,548),(255,553))
curve('오른쪽 손 바깥',(565,510),(593,533),(572,571),(544,565))
curve('오른쪽 손 안쪽',(544,565),(550,553),(550,541),(539,538))
curve('몸통 왼쪽 아래',(282,594),(315,636),(365,659),(423,651))
curve('몸통 오른쪽 아래',(539,538),(536,595),(497,638),(450,639))
curve('왼쪽 발',(390,654),(381,691),(414,689),(431,674))
curve('오른쪽 발',(423,651),(442,686),(480,683),(450,639))
curve('왼쪽 눈썹',(245,355),(249,322),(276,282),(305,282))
curve('오른쪽 눈썹',(410,273),(456,255),(501,290),(509,344))
# Smooth curve rings bound two round highlight holes; filled discs cover the gaps.
def shiny_eye(label,cx,cy):
 def stroke(suffix,ps):curve(label+suffix,*[(cx+x/.142,cy+y/.142) for x,y in ps])
 r=2.15*.142/.124
 stroke(' 위 외곽',[(-r,0),(-r,-r*4/3),(r,-r*4/3),(r,0)])
 stroke(' 아래 외곽',[(r,0),(r,r*4/3),(-r,r*4/3),(-r,0)])
 # Three 120-degree arcs make the larger upper highlight especially smooth.
 for name,x,y,rx,ry,parts in [(' 큰 반짝임',-.85,-.7,1.375,1.025,3),(' 작은 반짝임',.85,.7,1.275,.975,2)]:
  angle=-35*math.pi/180
  def rotate(u,v):return(x+u*math.cos(angle)-v*math.sin(angle),y+u*math.sin(angle)+v*math.cos(angle))
  for j in range(parts):
   a=j*2*math.pi/parts;b=(j+1)*2*math.pi/parts;k=4/3*math.tan((b-a)/4)
   ps=[rotate(rx*math.cos(a),ry*math.sin(a)),rotate(rx*(math.cos(a)-k*math.sin(a)),ry*(math.sin(a)+k*math.cos(a))),rotate(rx*(math.cos(b)+k*math.sin(b)),ry*(math.sin(b)-k*math.cos(b))),rotate(rx*math.cos(b),ry*math.sin(b))]
   stroke(name+str(j+1),ps)
 for suffix,dx,dy,r in [(' 왼쪽 채움',-1,1,1.1),(' 오른쪽 채움',1,-1,1.1)]:
  shapes.append({'id':f'bunny-{len(shapes)+1:02}','type':'disc','x':round((cx-380)*.142+dx,4),'y':round((cy-375)*.142+dy,4),'size':round(2*r,4),'rotation':0});labels.append(label+suffix)
shiny_eye('왼쪽 눈',322,380)
shiny_eye('오른쪽 눈',444,370)
curve('왼쪽 볼 위',(223,419),(224,385),(294,380),(303,413))
curve('왼쪽 볼 아래',(303,413),(322,453),(229,481),(223,419))
curve('오른쪽 볼 위',(474,395),(481,363),(543,358),(550,392))
curve('오른쪽 볼 아래',(550,392),(567,429),(473,454),(474,395))
curve('왼쪽 볼 무늬 1',(247,417),(244,425),(245,435))
curve('왼쪽 볼 무늬 2',(267,416),(265,422),(265,428))
curve('왼쪽 볼 무늬 3',(288,415),(288,420),(288,426))
curve('오른쪽 볼 무늬 1',(491,391),(485,398),(485,405))
curve('오른쪽 볼 무늬 2',(510,390),(506,397),(506,402))
curve('오른쪽 볼 무늬 3',(531,387),(529,393),(530,399))
curve('입 왼쪽',(366,424),(375,440),(391,437),(398,424))
curve('코와 인중',(398,424),(387,410),(402,407),(398,424))
curve('입 오른쪽',(398,424),(410,439),(428,430),(426,418))
curve('작은 아랫입술',(401,445),(412,448),(418,437),(410,433))
curve('왼쪽 움직임 위',(255,604),(266,598),(278,598))
curve('왼쪽 움직임 중간',(249,649),(254,640),(264,635))
curve('왼쪽 움직임 아래 1',(275,674),(275,668),(278,660))
curve('왼쪽 움직임 아래 2',(304,673),(305,674),(305,675))
curve('왼쪽 움직임 아래 3',(333,673),(333,669),(331,666))
assert len(shapes)==60,len(shapes)
doc={'version':1,'settings':{'stroke':1.25,'outlineRatio':.02},'shapes':shapes}
base=Path(__file__).parent
(base/'bunny-hop.json').write_text(json.dumps(doc,ensure_ascii=False,indent=2),encoding='utf-8')
svg=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="-55 -55 110 110" width="880" height="880">','<circle r="50" fill="#eee5d2" stroke="#ab9270" stroke-width=".35"/>','<g fill="none" stroke="#243f9b" stroke-width="1.25" stroke-linecap="butt" stroke-linejoin="round">']
S=3;D=8*S;im=Image.new('RGB',(880*S,880*S),'#20292d');draw=ImageDraw.Draw(im)
def pix(x,y):return((x+55)*D,(y+55)*D)
draw.ellipse([pix(-50,-50),pix(50,50)],fill='#eee5d2',outline='#ab9270',width=S*3)
guide=['통통 토끼 · 수동 제작 순서','총 60개 도형 · 확대된 토끼, 눈에 18개 도형 집중, 꽉 찬 원 4개로 눈 음영, 나머지는 곡선','원 지름 100 · 아래쪽 +Y · P0/마지막 점은 끝점, 나머지는 조절점','']
for i,(s,label) in enumerate(zip(shapes,labels)):
 if s['type']=='disc':
  x,y,r=s['x'],s['y'],s['size']/2
  svg.append(f'<circle cx="{x}" cy="{y}" r="{r}" fill="#243f9b" stroke="none"/>')
  draw.ellipse([pix(x-r,y-r),pix(x+r,y+r)],fill='#243f9b')
  guide.append(f'{i+1}. {label} · 꽉 찬 원 · 중심 ({x:.2f}, {y:.2f}) · 지름 {s["size"]:.2f}')
  continue
 ps=s['points'];p=['%s %s'%(q['x'],q['y']) for q in ps];svg.append(f'<path d="M{p[0]} '+('C' if len(ps)==4 else 'Q')+' '.join(p[1:])+'"/>')
 samples=[]
 for j in range(301):
  t=j/300;row=[(p['x'],p['y']) for p in ps]
  while len(row)>1:row=[(a[0]*(1-t)+b[0]*t,a[1]*(1-t)+b[1]*t) for a,b in zip(row,row[1:])]
  samples.append(pix(*row[0]))
 draw.line(samples,fill='#243f9b',width=round(1.25*D),joint='curve')
 for px,py in samples[1:-1]:
  r=1.25*D/2;draw.ellipse((px-r,py-r,px+r,py+r),fill='#243f9b')
 guide.append(f'{i+1}. {label}\n   '+' · '.join(f"P{j} ({p['x']:.2f}, {p['y']:.2f})" for j,p in enumerate(ps)))
svg.extend(['</g>','</svg>']);(base/'bunny-hop.svg').write_text('\n'.join(svg),encoding='utf-8')
im.resize((880,880),Image.Resampling.LANCZOS).save(base/'bunny-hop.png')
(base/'bunny-hop-guide.txt').write_text('\n'.join(guide),encoding='utf-8')
print('Generated',len(shapes),'shapes')
