from pathlib import Path
import json, re

ORIGIN='https://perception.thedanktank.com/'
SOCIAL_IMAGE=ORIGIN+'assets/social/perception-mix.png'
SOCIAL_ALT='Five Perception puzzles: rotate a 3D shape, remember a colour, judge an angle, tap a rhythm, and place a historical event on a timeline.'
TITLE='Perception — Daily Visual Puzzles & Trivia'
DESCRIPTION='Five quick daily puzzles. Match colours, judge angles, feel time, and test your trivia. Play free, score up to 500, and share your results.'

def metadata(about=False):
    title='About Perception — How to Play the Daily Puzzle Game' if about else TITLE
    url=ORIGIN+'about.html' if about else ORIGIN
    graph=[{'@type':'WebSite','@id':ORIGIN+'#website','name':'Perception','url':ORIGIN,'description':DESCRIPTION,'inLanguage':'en'},
           {'@type':'WebApplication','@id':ORIGIN+'#game','name':'Perception','url':ORIGIN,'description':DESCRIPTION,'applicationCategory':'GameApplication','operatingSystem':'Any device with a modern web browser','browserRequirements':'Requires JavaScript','isAccessibleForFree':True,'offers':{'@type':'Offer','price':'0','priceCurrency':'USD'},'image':SOCIAL_IMAGE},
           {'@type':'WebPage','@id':url+'#page','url':url,'name':title,'isPartOf':{'@id':ORIGIN+'#website'},'about':{'@id':ORIGIN+'#game'},'inLanguage':'en'}]
    structured=json.dumps({'@context':'https://schema.org','@graph':graph},ensure_ascii=False).replace('<','\\u003c')
    return f'''<title>{title}</title>
<meta name="description" content="{DESCRIPTION}">
<meta name="robots" content="index,follow,max-image-preview:large">
<link rel="canonical" href="{url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Perception">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{DESCRIPTION}">
<meta property="og:url" content="{url}">
<meta property="og:locale" content="en_US">
<meta property="og:image" content="{SOCIAL_IMAGE}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="{SOCIAL_ALT}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{title}">
<meta name="twitter:description" content="{DESCRIPTION}">
<meta name="twitter:image" content="{SOCIAL_IMAGE}">
<meta name="twitter:image:alt" content="{SOCIAL_ALT}">
<script type="application/ld+json">{structured}</script>'''

def augment_seo(html):
    html=re.sub(r'<title>.*?</title>','',html,count=1)
    html=re.sub(r'<meta name="description"[^>]*>','',html,count=1)
    html=html.replace('</head>',metadata()+'</head>')
    html=html.replace('<div id="playarea"></div>','<div id="playarea"><noscript><h1>Perception: five daily puzzles</h1><p>A free daily game of perception and trivia. Match colours, judge angles, feel time, and explore a new mix of five puzzle types each day. Each round is worth 100 points, for a total of 500.</p><p>Enable JavaScript to play, or <a href="about.html">read how Perception works</a>.</p></noscript></div>')
    return html

def build_discovery_files():
    template=Path('src/design-options/about.html').read_text()
    Path('public/about.html').write_text(template.replace('<!-- SEO -->',metadata(True)))
    for name in ['robots.txt','sitemap.xml','llms.txt']:
        Path('public',name).write_text(Path('src/design-options/'+name).read_text())
