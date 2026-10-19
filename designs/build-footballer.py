import json,math
from pathlib import Path
from PIL import Image,ImageDraw
shapes=[];labels=[]
def curve(label,*coords):
 pts=[{'x':round((x-324)*.11,4),'y':round((y-370)*.11,4)} for x,y in coords]
 shapes.append({'id':f'footballer-{len(shapes)+1:02}','type':'cubic' if len(pts)==4 else 'quadratic','x':0,'y':0,'size':1,'rotation':0,'points':pts});labels.append(label)
# Back-facing silhouette, authored against the supplied 640 x 743 reference.
curve('머리 윗부분',(280,64),(270,1),(347,4),(347,62))
curve('왼쪽 귀',(280,64),(270,58),(274,78),(283,82))
curve('오른쪽 귀',(347,62),(359,57),(352,79),(345,82))
curve('뒷머리 경계',(283,76),(302,68),(329,68),(345,77))
curve('왼쪽 목',(283,80),(286,87),(283,97))
curve('오른쪽 목',(345,80),(341,89),(345,98))
curve('왼쪽 어깨와 소매',(283,97),(252,111),(220,126),(211,190))
curve('오른쪽 어깨와 소매',(345,98),(392,110),(426,136),(441,187))
curve('왼팔 바깥',(211,190),(201,241),(181,294),(167,344))
curve('왼팔 안쪽',(245,194),(235,256),(204,302),(186,352))
curve('왼쪽 손목 소매',(167,344),(177,345),(186,352))
curve('왼손 외곽',(167,344),(148,354),(130,383),(126,404))
curve('왼손 손가락',(126,404),(140,396),(151,375),(153,374))
curve('왼손 안쪽',(153,374),(145,409),(166,382),(186,352))
curve('왼손 손가락 구분',(143,398),(151,387),(159,376))
curve('오른팔 바깥',(441,187),(468,235),(495,292),(520,328))
curve('오른팔 안쪽',(402,194),(428,263),(469,302),(500,337))
curve('오른쪽 손목 소매',(500,337),(510,333),(520,328))
curve('오른손 외곽',(520,328),(545,345),(552,370),(553,386))
curve('오른손 손가락',(553,386),(543,390),(537,361),(533,360))
curve('오른손 안쪽',(533,360),(533,412),(514,369),(500,337))
curve('오른손 손가락 구분',(542,389),(532,379),(524,362))
curve('유니폼 왼쪽 옆선',(245,194),(254,230),(243,273),(253,316))
curve('유니폼 오른쪽 옆선',(402,194),(400,243),(416,282),(402,313))
curve('유니폼 밑단',(253,316),(302,304),(359,320),(402,313))
curve('밑단 접힌 주름',(253,333),(303,350),(362,339),(402,313))
curve('반바지 왼쪽 바깥',(253,333),(230,371),(217,427),(207,461))
curve('반바지 오른쪽 바깥',(402,313),(419,363),(443,418),(453,461))
curve('반바지 왼쪽 밑단',(207,461),(238,481),(271,487),(287,478))
curve('반바지 오른쪽 밑단',(375,479),(400,489),(430,477),(453,461))
curve('가랑이 왼쪽',(287,478),(298,447),(314,419),(325,409))
curve('가랑이 오른쪽',(325,409),(342,429),(360,457),(375,479))
curve('반바지 중앙 솔기',(331,348),(324,365),(329,390),(325,409))
curve('반바지 왼쪽 주름',(227,429),(250,421),(280,426))
curve('반바지 오른쪽 주름',(347,412),(374,428),(413,431))
curve('왼쪽 다리 바깥',(207,461),(190,498),(172,544),(151,587))
curve('왼쪽 다리 안쪽',(287,478),(260,512),(225,539),(214,563))
curve('오른쪽 다리 바깥',(453,461),(470,500),(497,549),(519,585))
curve('오른쪽 다리 안쪽',(375,479),(397,514),(426,546),(441,562))
curve('왼쪽 양말 윗단',(180,528),(191,516),(218,520),(235,533))
curve('오른쪽 양말 윗단',(433,532),(451,521),(468,514),(479,522))
curve('왼쪽 양말 줄무늬',(151,587),(171,589),(192,602),(200,609))
curve('오른쪽 양말 줄무늬',(459,608),(478,600),(502,588),(519,585))
curve('왼발 양말 아래',(151,587),(138,619),(120,654),(109,679))
curve('왼쪽 정강이 안쪽',(214,563),(204,604),(169,649),(143,686))
curve('오른쪽 정강이 바깥',(519,585),(534,619),(548,646),(559,668))
curve('오른쪽 정강이 안쪽',(441,562),(464,612),(502,648),(528,678))
curve('왼쪽 축구화 윗선',(109,679),(96,698),(72,696),(62,709))
curve('왼쪽 축구화 밑창',(62,709),(84,718),(119,719),(143,714))
curve('왼쪽 축구화 뒤축',(143,714),(144,700),(147,692),(143,686))
curve('오른쪽 축구화',(559,668),(579,680),(584,690),(588,695))
curve('오른쪽 축구화 밑창',(588,695),(570,702),(547,706),(532,704))
curve('오른쪽 축구화 뒤축',(532,704),(530,696),(526,685),(528,678))
# A large outlined 7 takes priority over name and sponsor lettering.
curve('등번호 7 윗변',(304,156),(331,153),(357,156))
curve('등번호 7 오른쪽',(357,156),(351,183),(330,226),(322,251))
curve('등번호 7 밑변',(322,251),(313,252),(305,251))
curve('등번호 7 왼쪽 사선',(305,251),(316,224),(330,193),(338,174))
curve('등번호 7 안쪽 가로',(338,174),(319,174),(304,174))
curve('등번호 7 왼쪽 윗변',(304,174),(303,165),(304,156))
curve('유니폼 어깨 안쪽 선',(256,124),(278,109),(304,103))
# Reserve five strokes for SIUU, keeping the total at 60.
remove_labels=set(['뒷머리 경계', '유니폼 어깨 안쪽 선', '반바지 왼쪽 주름', '반바지 오른쪽 주름', '왼손 손가락 구분'])
kept=[(s,label) for s,label in zip(shapes,labels) if label not in remove_labels]
shapes[:]=[s for s,label in kept];labels[:]=[label for s,label in kept]
# Recompose the figure below the lettering. Ink width stays calibrated at 1.25.
for shape in shapes:
 for p in shape['points']:
  p['x']=round(p['x']*.88,4);p['y']=round(p['y']*.88+6,4)
def letter(label,*coords):
 shapes.append({'id':label,'type':'cubic' if len(coords)==4 else 'quadratic','x':0,'y':0,'size':1,'rotation':0,'points':[{'x':x,'y':y} for x,y in coords]});labels.append(label)
letter('SIUU-S-upper',(-13,-41),(-22,-46),(-24,-36),(-17,-37.5))
letter('SIUU-S-lower',(-17,-37.5),(-9,-39),(-11,-29),(-21,-34))
letter('SIUU-I',(-6,-43),(-6,-38),(-6,-33))
letter('SIUU-U-left',(0,-43),(0,-30),(8,-30),(8,-43))
letter('SIUU-U-right',(14,-43),(14,-30),(22,-30),(22,-43))
assert len(shapes)==60,len(shapes)
doc={'version':1,'settings':{'stroke':1.25,'outlineRatio':.02},'shapes':shapes}
base=Path(__file__).parent
(base/'footballer-seven.json').write_text(json.dumps(doc,ensure_ascii=False,indent=2),encoding='utf-8')
svg=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="-55 -55 110 110" width="880" height="880">','<circle r="50" fill="#eee5d2" stroke="#ab9270" stroke-width=".35"/>','<g fill="none" stroke="#243f9b" stroke-width="1.25" stroke-linecap="butt" stroke-linejoin="round">']
S=3;D=8*S;im=Image.new('RGB',(880*S,880*S),'#20292d');draw=ImageDraw.Draw(im)
def pix(x,y):return((x+55)*D,(y+55)*D)
draw.ellipse([pix(-50,-50),pix(50,50)],fill='#eee5d2',outline='#ab9270',width=S*3)
guide=['등번호 7 축구 선수 · 수동 제작 순서','총 60개 도형 · 이름·로고·배경 생략, 자세·등번호·SIUU 우선','원 지름 100 · 아래쪽 +Y · P0/마지막 점은 끝점, 나머지는 조절점','']
for i,(s,label) in enumerate(zip(shapes,labels)):
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
svg.extend(['</g>','</svg>']);(base/'footballer-seven.svg').write_text('\n'.join(svg),encoding='utf-8')
im.resize((880,880),Image.Resampling.LANCZOS).save(base/'footballer-seven.png')
(base/'footballer-seven-guide.txt').write_text('\n'.join(guide),encoding='utf-8')
print('Generated',len(shapes),'shapes')
