import json,math
from pathlib import Path
from PIL import Image,ImageDraw
shapes=[];labels=[]
def curve(label,*coords):
 pts=[{'x':round((x-382)*.17,4),'y':round((y-418)*.17,4)} for x,y in coords]
 shapes.append({'id':f'character-{len(shapes)+1:02}','type':'cubic' if len(pts)==4 else 'quadratic','x':0,'y':0,'size':1,'rotation':0,'points':pts});labels.append(label)
curve('왼쪽 귀',(256,246),(229,213),(276,171),(296,207))
curve('왼쪽 귀와 머리 연결',(296,207),(301,215),(299,222))
curve('머리 윗부분',(299,222),(350,199),(388,200),(438,213))
curve('오른쪽 귀 윗부분',(438,213),(440,181),(477,171),(492,187))
curve('오른쪽 귀 끝',(492,187),(506,201),(493,220),(492,224))
curve('오른쪽 얼굴 윤곽',(505,250),(574,273),(612,389),(546,469))
curve('오른손',(558,461),(600,458),(591,495),(558,493))
curve('오른쪽 몸통',(538,511),(522,565),(490,600),(442,608))
curve('오른발 바깥쪽',(442,608),(450,637),(435,660),(417,653))
curve('오른발 안쪽',(417,653),(405,650),(404,639),(408,629))
curve('왼발',(365,609),(402,639),(422,604),(389,588))
curve('왼쪽 몸통',(251,528),(255,583),(313,624),(365,609))
curve('왼손 바깥쪽',(235,480),(189,477),(191,504),(205,512))
curve('왼손 끝',(205,512),(221,519),(236,513))
curve('왼쪽 얼굴 아래',(235,480),(199,461),(175,440),(176,385))
curve('왼쪽 얼굴 위',(176,385),(168,326),(206,265),(256,246))
curve('왼쪽 눈썹',(302,307),(313,298),(323,298))
curve('오른쪽 눈썹',(419,290),(432,285),(442,291))
curve('왼쪽 눈',(298,364),(311,354),(333,354))
curve('오른쪽 눈',(423,347),(442,341),(460,349))
curve('코',(376,390),(382,382),(390,390))
curve('코 아래',(376,390),(384,398),(390,390))
curve('입 왼쪽',(356,394),(364,405),(380,396))
curve('입 오른쪽',(380,396),(397,407),(405,394))
curve('입 아래',(367,401),(366,439),(396,439),(396,401))
curve('턱 아래 작은 선',(378,446),(386,449),(393,447))
curve('왼쪽 볼 위',(240,400),(243,369),(303,362),(305,394))
curve('왼쪽 볼 아래',(305,394),(305,427),(246,438),(240,400))
curve('오른쪽 볼 위',(461,384),(457,349),(519,344),(523,375))
curve('오른쪽 볼 아래',(523,375),(535,408),(472,423),(461,384))
for label,x,y in [('왼쪽 볼 빗금 1',250,404),('왼쪽 볼 빗금 2',270,402),('왼쪽 볼 빗금 3',288,401),('오른쪽 볼 빗금 1',473,384),('오른쪽 볼 빗금 2',492,382),('오른쪽 볼 빗금 3',512,382)]:curve(label,(x,y),(x+2,y-8),(x+5,y-13))
# Spend the remaining 24 curves on the reference's uneven, heavier ink rather
# than introducing features that are not present in the supplied character.
def source_points(shape):
 return [((p['x']/.17)+382,(p['y']/.17)+418) for p in shape['points']]
def offset_points(points,amount):
 # Offset the Bezier control polygon along smoothly oriented local normals.
 # It remains a single legal Bezier, with its original fixed stroke width.
 mid=points[len(points)//2]
 tangent=(points[-1][0]-points[0][0],points[-1][1]-points[0][1])
 normal=(-tangent[1],tangent[0])
 sign=1 if normal[0]*(mid[0]-382)+normal[1]*(mid[1]-418)>=0 else -1
 result=[]
 for j,p in enumerate(points):
  a=points[max(0,j-1)];b=points[min(len(points)-1,j+1)]
  dx=b[0]-a[0];dy=b[1]-a[1];length=math.hypot(dx,dy) or 1
  result.append((p[0]-sign*dy/length*amount,p[1]+sign*dx/length*amount))
 return result
for i in range(16):
 curve(labels[i]+' · 바깥 먹선 보강',*offset_points(source_points(shapes[i]),2.7))
for i in [16,17,18,19]:
 curve(labels[i]+' · 먹선 보강',*[(x,y+2.2) for x,y in source_points(shapes[i])])
# Small return curves soften both exposed ends of the two eye marks.
for i in [18,19]:
 ps=source_points(shapes[i])
 for endpoint,neighbor in [(ps[0],ps[1]),(ps[-1],ps[-2])]:
  dx=endpoint[0]-neighbor[0];dy=endpoint[1]-neighbor[1];n=math.hypot(dx,dy) or 1
  x,y=endpoint;curve(labels[i]+' · 끝 둥글리기',(x,y),(x+dx/n*2.2,y+dy/n*2.2+1.1),(x,y+2.2))
assert len(shapes)==60
doc={'version':1,'settings':{'stroke':1.25,'outlineRatio':.02},'shapes':shapes}
Path('designs/round-character.json').write_text(json.dumps(doc,ensure_ascii=False,indent=2),encoding='utf-8')
svg=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="-55 -55 110 110" width="880" height="880">','<circle r="50" fill="#eee5d2" stroke="#ab9270" stroke-width=".35"/>','<g fill="none" stroke="#243f9b" stroke-width="1.25" stroke-linecap="butt">']
scale=4;im=Image.new('RGB',(880*scale,880*scale),'#20292d');draw=ImageDraw.Draw(im);D=8*scale
def pix(x,y):return ((x+55)*D,(y+55)*D)
draw.ellipse([pix(-50,-50),pix(50,50)],fill='#eee5d2',outline='#ab9270',width=scale*3)
guide=['둥근 캐릭터 · 마기그래프 수동 제작 순서',f'총 {len(shapes)}개 도형 / 60개 제한 · 모두 곡선','원 지름 100, 중심 (0,0), 오른쪽 +X, 아래쪽 +Y','P0과 마지막 P는 끝점, 나머지는 곡선 조절점입니다.','볼의 분홍색 면은 곡선 윤곽으로 단순화했습니다.','']
for i,(s,label) in enumerate(zip(shapes,labels)):
 ps=s['points'];p=['%s %s'%(q['x'],q['y']) for q in ps];svg.append(f'<path d="M{p[0]} '+('C' if len(ps)==4 else 'Q')+' '.join(p[1:])+'"/>')
 samples=[]
 for j in range(201):
  t=j/200;row=[(p['x'],p['y']) for p in ps]
  while len(row)>1:row=[(a[0]*(1-t)+b[0]*t,a[1]*(1-t)+b[1]*t) for a,b in zip(row,row[1:])]
  samples.append(pix(*row[0]))
 draw.line(samples,fill='#243f9b',width=round(1.25*D),joint='curve')
 for px,py in samples[1:-1]:
  r=1.25*D/2;draw.ellipse((px-r,py-r,px+r,py+r),fill='#243f9b')
 guide.append(f'{i+1:02}. {label} · '+('2점 곡선' if len(ps)==4 else '곡선')+'\n    '+' / '.join(f"P{j} ({p['x']:.2f}, {p['y']:.2f})" for j,p in enumerate(ps)))
svg+=['</g></svg>'];Path('designs/round-character.svg').write_text('\n'.join(svg),encoding='utf-8');Path('designs/round-character-guide.txt').write_text('\n'.join(guide),encoding='utf-8');im.resize((880,880),Image.Resampling.LANCZOS).save('designs/round-character.png')
print(f'{len(shapes)} curves created')
