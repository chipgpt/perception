from pathlib import Path
import json, os

def augment(html, script):
    script=script.replace("if(game==='mix')", "if(['timeline','duration'].includes(game))return triviaDeck(random,game);\n if(game==='mix')",1)
    script=script.replace("'memory','time']).slice", "'memory','time','timeline','duration']).slice",1)
    script=script.replace('function scoreFor(value,q){',"function scoreFor(value,q){\n if(['timeline','duration'].includes(q.type))return triviaScore(value,q);")
    script=script.replace("if(q.type==='view3d'){viewRound", "if(q.type==='timeline'){timelineRound(q);return;}\n if(q.type==='duration'){durationRound(q);return;}\n if(q.type==='view3d'){viewRound",1)
    script=script.replace("const answerLabel=q.type==='time'?", "const answerLabel=['timeline','duration'].includes(q.type)?triviaFeedback(value,q):q.type==='time'?",1)
    script=script.replace("const copy={mix:","const copy={timeline:['Place it in history.','One event. A timeline to explore.<br>Drag through the years and place your pin.'],duration:['How long does it take?','Sport. Space. Everyday life.<br>Turn the dial to your best guess.'],mix:",1)
    script=script.replace("r.q.cue||r.q.skill", "r.q.cue||(['timeline','duration'].includes(r.q.type)?escapeHTML(r.q.title):r.q.skill)")
    # Define the question bank before the initial start() call.
    data=Path(os.environ.get('PERCEPTION_DATA_DIR','data'))
    bank=json.loads((data/'trivia-bank.json').read_text())['facts']
    schedule=json.loads((data/'daily-trivia.json').read_text())
    trivia=Path('src/design-options/trivia-games.js').read_text()
    end=trivia.index('function triviaDeck')
    arrays=[]
    for type in ['timeline','duration']:
        rows=[[f['title'],f['answer'],f['explain'],[f['source']['name'],f['source']['url']]] if type=='timeline' else [f['title'],f['answer'],f['caption'],f['explain'],[f['source']['name'],f['source']['url']]] for f in bank if f['type']==type]
        arrays.append('const '+type+'Facts='+json.dumps(rows,ensure_ascii=False)+';')
    data_js='const DAILY_TRIVIA_SCHEDULE='+json.dumps(schedule['days'],ensure_ascii=False)+';\nconst TRIVIA_BY_ID='+json.dumps({f['id']:f for f in bank},ensure_ascii=False)+';\n'
    # JSON is embedded in HTML script tags; escape HTML delimiters in curated text.
    data_js=(data_js+'\n'.join(arrays)+'\n').replace('<','\\u003c').replace('>','\\u003e').replace('&','\\u0026')
    script=script.replace("'use strict';", "'use strict';\n"+data_js+trivia[end:],1)
    html=html.replace('<button data-mini="time">Time</button>', '<button data-mini="time">Time</button><button data-mini="timeline">When?</button><button data-mini="duration">How long?</button>')
    html=html.replace('<p><strong>Time:</strong>', '<p><strong>When?</strong> Tap to pin an event’s year. Drag through the years and tap to place a pin. <strong>How long?</strong> Turn the dial from seconds to days. Arrow keys adjust; Shift makes finer changes. Both award up to 100 points for closeness, with the answer and source shown after you commit.</p><p><strong>Time:</strong>')
    return html, script
