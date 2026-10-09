"""Draw the social preview from native puzzle graphics. Requires Pillow with WOFF2 support."""
import colorsys
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
S = 3
BG = '#101116'
INK = '#eff1f6'
MUTED = '#a0a5b3'
LIME = '#cdf66a'
im = Image.new('RGB', (1200*S, 630*S), BG)
draw = ImageDraw.Draw(im)

def font(size, weight=500, family='space-grotesk'):
    f = ImageFont.truetype(str(ROOT / f'public/assets/fonts/{family}-latin.woff2'), size*S)
    f.set_variation_by_axes([weight])
    return f

def text(x, y, value, size=20, fill=INK, weight=500, anchor='la'):
    draw.text((x*S,y*S),value,font=font(size,weight),fill=fill,anchor=anchor)

def rect(box, fill, outline=None, radius=16, width=1):
    draw.rounded_rectangle(tuple(round(n*S) for n in box),radius=radius*S,fill=fill,outline=outline,width=width*S)

def line(points, fill=INK, width=3):
    draw.line([(round(x*S),round(y*S)) for x,y in points],fill=fill,width=width*S,joint='curve')

def circle(x,y,r,fill=None,outline=None,width=2):
    draw.ellipse(tuple(round(n*S) for n in (x-r,y-r,x+r,y+r)),fill=fill,outline=outline,width=width*S)

def poly(points,fill):
    draw.polygon([(round(x*S),round(y*S)) for x,y in points],fill=fill)

def block(x,y,w,h,depth,color,side,top):
    # Isometric beam: three faces, a crisp silhouette, no decorative cube pile.
    a=(x,y); b=(x+w,y-w*.48); c=(x+w+depth,y-w*.48+depth*.48); e=(x+depth,y+depth*.48)
    poly([a,b,c,e],top)
    poly([a,e,(e[0],e[1]+h),(x,y+h)],side)
    poly([e,c,(c[0],c[1]+h),(e[0],e[1]+h)],color)
    line([a,b,c,(c[0],c[1]+h),(e[0],e[1]+h),(x,y+h),a],'#0c1020',2)
    line([a,e,c], '#0c1020',2)
    line([e,(e[0],e[1]+h)],'#0c1020',2)

# Brand and one clear promise; the puzzles carry the rest of the story.
circle(56,52,11,outline=LIME,width=2)
text(80,31,'PERCEPTION',29,weight=700)
text(1150,40,'THE DAILY PUZZLE MIX',15,MUTED,anchor='ra')
text(48,103,'How ',67,weight=700)
x=48+draw.textlength('How ',font=font(67,700))/S
text(x,103,'sharp',67,LIME,700)
x+=draw.textlength('sharp',font=font(67,700))/S
text(x,103,' are you?',67,weight=700)
text(50,195,'Five quick puzzles. A fresh mix every day.',27,'#c2c6d0')
rect((984,119,1152,181),'#20271a','#3a4725',18)
text(1068,133,'500 points',25,LIME,600,anchor='ma')

cards=[('MATCH A VIEW','#a393ff'),('REMEMBER A COLOUR','#fc85ba'),('FIND THE ANGLE',LIME),('FEEL THE RHYTHM','#6ddbd7'),('WHEN WAS IT?','#ffbd76')]
for i,(label,accent) in enumerate(cards):
    x=48+i*224
    rect((x,258,x+208,505),'#191c24','#323743',20)
    text(x+16,278,f'0{i+1}',14,accent,600)
    text(x+16,468,label,13,accent,600)

# 1: an asymmetric 3D sculpture, inviting a turn.
block(75,380,78,21,23,'#9282ed','#4c4087','#c7bcff')
block(119,338,29,76,24,'#9282ed','#4c4087','#c7bcff')
block(152,349,50,26,23,'#ee8fbc','#91476c','#ffbedb')
line([(83,439),(107,447),(178,447),(206,438)],'#6c607f',2)
line([(200,430),(208,438),(199,443)],'#a393ff',2)

# 2: the actual hue/saturation answer space with two close guesses.
cx,cy,r=376,374,67
for py in range(-r*S,r*S+1):
    for px in range(-r*S,r*S+1):
        saturation=math.hypot(px,py)/(r*S)
        if saturation<=1:
            hue=(math.atan2(py,px)/(2*math.pi))%1
            rgb=colorsys.hsv_to_rgb(hue,saturation,1)
            im.putpixel((cx*S+px,cy*S+py),tuple(round(v*255) for v in rgb))
circle(408,339,6,'#101116','#ffffff',3)
circle(420,349,6,LIME,'#101116',2)

# 3: unmarked dial and a short prompt, like the playable puzzle.
text(600,307,'73°',23,LIME,600,anchor='ma')
circle(600,395,47,outline='#3e4540',width=2)
line([(600,395),(647,395)],'#767c73',3)
line([(600,395),(613,350)],LIME,4)
circle(600,395,5,LIME)

# 4: a visual beat across a continuous answer space; no music required.
for i,h in enumerate([12,23,45,68,44,23,12,23,45,68,44,23,12]):
    x=759+i*11
    rect((x,381-h/2,x+5,381+h/2),'#6ddbd7' if i in (3,9) else '#42666c',radius=2)
text(824,429,'Tap the beat',19,'#c2dadd',anchor='ma')

# 5: familiar trivia pinned on a timeline.
text(1048,318,'First Moon',24,weight=600,anchor='ma')
text(1048,347,'landing',24,weight=600,anchor='ma')
line([(973,414),(1123,414)],'#67625c',2)
for i in range(13):
    x=973+i*12.5
    line([(x,407),(x,421)],'#67625c',1)
line([(1059,394),(1059,436)],'#ffbd76',3)
circle(1059,414,6,'#ffbd76','#191c24',2)
text(978,437,'1900',12,MUTED)
text(1120,437,'2000',12,MUTED,anchor='ra')

text(48,545,'Trust your instincts. Get closer. Come back tomorrow.',24,INK,500)
text(48,588,'perception.thedanktank.com',17,LIME)
text(1152,588,'FREE TO PLAY  ·  NO LOGIN',15,MUTED,anchor='ra')
out=ROOT/'public/assets/social/perception-mix.png'
im.resize((1200,630),Image.Resampling.LANCZOS).save(out,optimize=True)
print(f'Created {out.relative_to(ROOT)} (1200 × 630).')
