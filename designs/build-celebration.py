import json,math
from pathlib import Path
from PIL import Image,ImageDraw
shapes=[];labels=[]
def curve(label,*coords):
 pts=[{'x':round((x-250)*.14,4),'y':round((y-340)*.14,4)} for x,y in coords]
 shapes.append({'id':f'celebration-{len(shapes)+1:02}','type':'cubic' if len(pts)==4 else 'quadratic','x':0,'y':0,'size':1,'rotation':0,'points':pts});labels.append(label)

curve('머리와 곱슬머리 윤곽',(235,81),(220,38),(298,31),(290,83))
curve('앞머리 경계',(235,81),(246,70),(264,91),(289,78))
curve('왼쪽 귀와 얼굴',(235,88),(221,77),(224,110),(239,118))
curve('얼굴 오른쪽',(289,83),(294,108),(285,124),(277,138))
curve('턱',(239,118),(245,142),(263,157),(277,138))
curve('왼쪽 눈썹과 눈',(241,101),(250,106),(257,104))
curve('오른쪽 눈썹과 눈',(269,104),(278,108),(284,102))
curve('코',(263,108),(257,123),(267,123))
curve('벌린 입 왼쪽',(254,129),(248,138),(264,154),(263,145))
curve('벌린 입 오른쪽',(263,145),(270,138),(271,126),(254,129))
curve('목 왼쪽',(235,110),(231,122),(220,128))
curve('목 오른쪽',(277,138),(283,139),(289,139))
curve('옷깃 왼쪽',(220,128),(228,146),(245,154),(259,161))
curve('옷깃 오른쪽',(259,161),(273,154),(282,148),(289,139))
curve('왼쪽 어깨',(220,128),(189,134),(171,148),(158,178))
curve('오른쪽 어깨',(289,139),(313,140),(328,168),(327,199))
curve('왼팔 바깥',(158,178),(139,218),(120,268),(115,328))
curve('왼팔 안쪽',(179,198),(172,239),(150,287),(134,331))
curve('오른팔 바깥',(327,199),(333,242),(342,298),(352,330))
curve('오른팔 안쪽',(301,222),(304,266),(317,304),(334,337))
curve('왼쪽 소매 끝',(115,328),(124,325),(134,331))
curve('오른쪽 소매 끝',(334,337),(341,330),(352,330))
curve('왼손 바깥',(115,328),(108,348),(117,370),(128,377))
curve('왼손 손가락 아래',(128,377),(150,384),(141,367),(130,357))
curve('왼손 펼친 손가락',(122,363),(154,375),(155,364),(130,357))
curve('왼손 엄지와 손바닥',(130,357),(154,353),(130,352),(134,331))
curve('오른손 엄지와 바깥',(352,330),(379,329),(357,348),(357,349))
curve('오른손 바깥 손가락',(357,349),(388,366),(382,394),(355,366))
curve('오른손 안쪽 손가락',(371,369),(370,399),(359,370),(355,366))
curve('오른손 손바닥 안쪽',(355,366),(343,387),(340,354),(334,337))
curve('상의 왼쪽 옆선',(179,198),(181,237),(189,275),(180,308))
curve('상의 오른쪽 옆선',(301,222),(297,250),(304,279),(303,302))
curve('상의 밑단',(180,308),(212,287),(269,299),(303,302))
curve('반바지 왼쪽 바깥',(180,308),(169,346),(159,393),(151,426))
curve('반바지 오른쪽 바깥',(303,302),(316,338),(331,382),(339,428))
curve('왼쪽 반바지 밑단',(151,426),(178,437),(205,444),(230,441))
curve('오른쪽 반바지 밑단',(275,441),(300,440),(323,437),(339,428))
curve('가랑이 왼쪽',(230,441),(235,424),(242,402),(248,390))
curve('가랑이 오른쪽',(248,390),(256,405),(268,428),(275,441))
curve('반바지 중앙 주름',(248,307),(246,335),(259,354),(248,390))
curve('왼쪽 무릎 바깥',(151,426),(146,452),(135,470),(135,479))
curve('왼쪽 무릎 안쪽',(205,438),(194,459),(181,477),(168,494))
curve('오른쪽 무릎 바깥',(339,428),(350,447),(350,465),(348,483))
curve('오른쪽 무릎 안쪽',(285,439),(296,459),(305,473),(307,486))
curve('왼쪽 양말 윗단',(135,479),(143,487),(158,491),(168,494))
curve('오른쪽 양말 윗단',(307,486),(320,495),(336,488),(348,483))
curve('왼쪽 양말 바깥',(135,479),(121,513),(103,554),(94,584))
curve('왼쪽 양말 안쪽',(168,494),(159,535),(130,565),(112,592))
curve('오른쪽 양말 바깥',(348,483),(360,516),(362,565),(366,593))
curve('오른쪽 양말 안쪽',(307,486),(307,531),(326,569),(340,597))
curve('왼쪽 축구화 위',(94,584),(80,597),(81,611),(70,628))
curve('왼쪽 축구화 밑창',(70,628),(90,631),(108,629),(112,592))
curve('오른쪽 축구화 위',(366,593),(382,607),(404,609),(431,622))
curve('오른쪽 축구화 밑창',(431,622),(405,630),(360,625),(344,623))
curve('가슴 등번호 7 가로',(251,215),(262,213),(271,212))
curve('가슴 등번호 7 사선',(271,212),(261,228),(255,246))
curve('주장 완장 윗선',(306,204),(318,202),(327,199))
curve('주장 완장 아랫선',(301,222),(317,222),(331,217))
curve('상의 복부 주름',(185,274),(222,264),(265,289),(300,280))
curve('오른쪽 축구화 뒤축',(344,623),(340,615),(340,605),(340,597))
# Reserve five strokes for SIUU, keeping the total at 60.
remove_labels=set(['앞머리 경계', '왼손 펼친 손가락', '오른손 안쪽 손가락', '반바지 중앙 주름', '상의 복부 주름'])
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
(base/'footballer-celebration.json').write_text(json.dumps(doc,ensure_ascii=False,indent=2),encoding='utf-8')
svg=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="-55 -55 110 110" width="880" height="880">','<circle r="50" fill="#eee5d2" stroke="#ab9270" stroke-width=".35"/>','<g fill="none" stroke="#243f9b" stroke-width="1.25" stroke-linecap="butt" stroke-linejoin="round">']
S=3;D=8*S;im=Image.new('RGB',(880*S,880*S),'#20292d');draw=ImageDraw.Draw(im)
def pix(x,y):return((x+55)*D,(y+55)*D)
draw.ellipse([pix(-50,-50),pix(50,50)],fill='#eee5d2',outline='#ab9270',width=S*3)
guide=['정면 세리머니 선수 · 수동 제작 순서','총 60개 도형 · 자세·표정·7·SIUU 우선, 로고·배경·세부 주름 생략','원 지름 100 · 아래쪽 +Y · P0/마지막 점은 끝점, 나머지는 조절점','']
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
svg.extend(['</g>','</svg>']);(base/'footballer-celebration.svg').write_text('\n'.join(svg),encoding='utf-8')
im.resize((880,880),Image.Resampling.LANCZOS).save(base/'footballer-celebration.png')
(base/'footballer-celebration-guide.txt').write_text('\n'.join(guide),encoding='utf-8')
print('Generated',len(shapes),'shapes')
