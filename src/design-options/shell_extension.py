"""Integrate the shared chrome without copying game rendering into the builder."""
import re
from pathlib import Path
from game_menu import enhance_menu


def augment_shell(html, script):
    start = script.index('function shell(q,content,controls){')
    end = script.index('\nfunction render()', start)
    script = script[:start] + "function shell(q,content,controls,options={}){return mountGameShell({question:q,stage:content,controls,...options});}" + script[end:]
    start = script.index(" if(q.type==='timeline'){timelineRound(q);return;}", script.index('function render()'))
    end = script.index('\nfunction choicesRound(q)', start)
    # The round controller owns state; the registry dispatches its renderer.
    script = script[:start] + ' renderGame(q);\n}\n' + script[end:]
    script = script.replace('if(!q){emptyTriviaPractice();return;}', 'if(!q){leaveGameShell();emptyTriviaPractice();return;}')
    script = script.replace('function render(){stopEffects();', 'function render(){disposeGameShell();stopEffects();')
    script = script.replace('function finish(){', 'function finish(){leaveGameShell();')
    script = script.replace("styleRoundFeedback(q,value,score);", "setGamePhase('reveal');styleRoundFeedback(q,value,score);")
    script = script.replace("$('playarea').querySelector('.mixed-question').appendChild($('wheel').parentElement);", "$('game-stage').appendChild($('wheel').parentElement);")
    for name in ['viewPicker', 'tracePicker', 'colourPicker']:
        start = script.index('function ' + name + '(q){')
        end = script.index('\nfunction ', start + 1)
        block = script[start:end]
        # A picker mounts the next phase explicitly, independent of its game type.
        # spatialCanvas passes options through; shell can take the same fourth arg.
        if name == 'viewPicker':
            block = block.replace("</button>');const canvas=", "</button>',{phase:'play'});const canvas=", 1)
        elif name == 'tracePicker':
            block = block.replace("</button></div>');const canvas=", "</button></div>',{phase:'play'});const canvas=", 1)
        else:
            block = block.replace('</button>`);', "</button>`,{phase:'play'});", 1)
        script = script[:start] + block + script[end:]
    script = script.replace("overlayViewStart(", "prepareMemoryStart(").replace("beginViewPreview(", "beginMemoryPreview(")
    script = script.replace("function spatialCanvas(q,id,controls=''){", "function spatialCanvas(q,id,controls='',options={}){")
    script = script.replace('></canvas></div>`,controls);}', '></canvas></div>`,controls,options);}')
    redraws = {
        'viewRound': ("drawShape3D($('view-canvas'),{yaw:0,pitch:0,roll:0},{shape:q.shape});", "onGameRedraw(()=>drawShape3D($('view-canvas'),$('playarea').dataset.phase==='preview'?q.answer:{yaw:0,pitch:0,roll:0},{shape:q.shape}));"),
        'viewPicker': ('redraw();}', "onGameRedraw(()=>{if(locked){drawShape3D(canvas,orientation,{shape:q.shape});drawShape3D(canvas,q.answer,{shape:q.shape,overlay:true,outlineOnly:true,dashed:true});}else redraw();});redraw();}"),
        'balanceRound': ('drawBalance(q,support);}', 'onGameRedraw(()=>drawBalance(q,support,locked&&scoreFor(support,q)!==100?Math.sign(q.answer-support)*18:0,locked));drawBalance(q,support);}'),
        'motionRound': ('drawTrace([]);', "onGameRedraw(()=>drawTrace($('playarea').dataset.phase==='preview'?q.answer:[]));drawTrace([]);"),
        'tracePicker': ('drawTrace([]);}', 'onGameRedraw(()=>drawTrace(points,locked?q.answer:undefined));drawTrace([]);}'),
        'perspectiveRound': ('drawPerspective(q);}', 'onGameRedraw(()=>drawPerspective(q,point,locked));drawPerspective(q);}'),
        'legacyProportionRound': ('legacyDrawProportion(size);}', 'onGameRedraw(()=>legacyDrawProportion(size,locked?q.answer:undefined));legacyDrawProportion(size);}'),
        'colourPicker': ('drawWheel();\n}', 'onGameRedraw(()=>drawWheel(locked?q.answer:undefined));drawWheel();\n}')
    }
    for name, (old, new) in redraws.items():
        start = script.index('function ' + name + '(q){')
        end = script.index('\nfunction ', start + 1)
        block = script[start:end]
        if old not in block:
            raise ValueError('Missing redraw integration for ' + name)
        # viewRound adds a hook after its initial draw; other entries replace it.
        replacement = old + new if name == 'viewRound' else new
        before, _, after = block.rpartition(old)
        block = before + replacement + after
        script = script[:start] + block + script[end:]
    # Visual reveals belong to the registered adapter, not the controller.
    reveal_start = script.index('function reveal(value)')
    start = script.index(" if(q.type==='time')", reveal_start)
    end = script.index(" $('controls').querySelectorAll", start)
    script = script[:start] + script[end:]
    start = script.index(' gamebar();const feedback=', reveal_start)
    end = script.index(" if(q.fruit)", start)
    script = script[:start] + " gamebar();const feedback=score===100?'Nailed it.':'Your result.',answerLabel=roundAnswerDisplay(q,value)||q.tip||'';\n" + script[end:]
    start = script.index(" if(q.fruit)", reveal_start)
    end = script.index(" $('actionarea').innerHTML", start)
    script = script[:start] + " revealGame(q,value,score);\n document.querySelectorAll('.spatial-input,.type-slider,.colour-input').forEach(el=>el.disabled=true);\n" + script[end:]
    script = script.replace("'use strict';", "'use strict';\n" + Path('src/design-options/game-paint.js').read_text() + '\n' + Path('src/design-options/game-shell.js').read_text() + '\n' + Path('src/design-options/game-adapters.js').read_text(), 1)

    # Standardize submit labels and the completion view without touching game data.
    for old in ['Choose your angle', 'Choose a year', 'Choose a duration', 'Place your point', 'Draw a cut']:
        script = script.replace('disabled>' + old + '</button>', 'disabled>Lock it in</button>')
    script = script.replace('>Start</button>', '>Start timer</button>').replace("$('timer').textContent='Stop'", "$('timer').textContent='Stop timer'")
    script = script.replace('id="show-view" class="primary">Start timer</button>', 'id="show-view" class="primary">Show shape</button>')
    script = script.replace('Start. Wait. Stop.</p>', 'The number above is your target.</p>')
    script = script.replace('Cut half the total coloured area onto each side.', 'Drag a cut. Adjust the line or its handles.')
    script = script.replace('Tap where the receding lines would meet.', 'Tap to place your point.')
    start = script.index('function finish(){')
    end = script.index('\nfunction ', start + 1)
    block = script[start:end]
    block = re.sub(r'(<div class="resulthead"><span>).*?(</span><span>)', r'\1${summaryResultTitle(r.q)}\2', block)
    begin = block.index('<p>${', block.index('<div class="result-body">'))
    stop = block.index('</p>', begin)
    block = block[:begin] + '<p>${escapeHTML(summaryResultDescription(r))}' + block[stop:]
    block = block.replace("'MIX COMPLETE'", "mode==='daily'?'DAILY COMPLETE':'PRACTICE COMPLETE'")
    block = block.replace("'DAILY MIX'", "'DAILY FIVE'")
    block = block.replace('Daily mix follows your device’s date.', 'Daily Five resets at midnight Central Time.')
    script = script[:start] + block + script[end:]

    # Navigation keeps its IDs and listeners, but lives behind accessible chrome.
    start = html.index('<div class="topline">')
    end = html.index('<div class="layout">', start)
    navigation = html[start:end]
    navigation = re.sub(r'<details id="practice-menu" class="practice-menu"><summary>.*?</summary>', '<section id="practice-menu" class="practice-menu" aria-labelledby="practice-label"><span id="practice-label" class="sr-only">Practice</span>', navigation, count=1)
    navigation = navigation.replace('</details>', '</section>', 1)
    navigation = enhance_menu(navigation)
    html = html[:start] + html[end:]
    menu = '<dialog id="game-menu" class="game-menu" aria-labelledby="game-menu-title"><div class="game-menu-heading"><div><p class="game-menu-eyebrow">Play Perception</p><h2 id="game-menu-title">Trust your eye.</h2></div><button id="game-menu-close" class="circle" aria-label="Close game menu">×</button></div>' + navigation + '</dialog>'
    html = html.replace('</main>', '</main>' + menu, 1)
    html = html.replace('<button id="help"', '<button id="game-menu-toggle" class="circle" aria-label="Game menu" aria-haspopup="dialog" aria-controls="game-menu" aria-expanded="false"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg></button><button id="help"', 1)
    return html, script
