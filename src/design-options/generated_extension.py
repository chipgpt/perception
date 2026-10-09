from pathlib import Path

def augment_generated(script):
    script=script.replace('function makeDeck(random,game=mini){','function makeGameDeck(random,game=mini){',1)
    mix_start=script.index(" if(game==='mix')")
    mix_end=script.index("\n if(game==='view3d')",mix_start)
    script=script[:mix_start]+script[mix_end:]
    # The old fixed-bank branches are replaced by procedural generators.
    for game in ['view3d','motion','proportion','rhythm','typography','angle','time']:
        marker=" if(game==='"+game+"')"
        start=script.index(marker)
        end=script.find("\n if(game===",start+len(marker))
        if end<0:end=script.index("\n throw new Error('Unknown mini-game');",start)
        script=script[:start]+script[end:]
    script=script.replace("const date=new Date(),datekey=[date.getFullYear(),date.getMonth()+1,date.getDate()].join('-');\nconst seed=[...datekey].reduce((a,c)=>Math.imul(a,31)+c.charCodeAt(0)|0,0);\n",'')
    script=script.replace("'use strict';", "'use strict';\n"+Path('src/design-options/generated-games.js').read_text(),1)
    script=script.replace("makeDeck(rng(mode==='daily'?seed:Math.floor(Math.random()*4294967295)))", "makeDeck(mode==='daily'?calendarDay():'practice:'+Math.floor(Math.random()*4294967295))")
    script=script.replace("date.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})", "dailyDateLabel(sessionDay)")
    script=script.replace('min="400" max="700" step="100"','min="400" max="700" step="1"')
    script=script.replace('min="-2" max="6" step="0.25"','min="-2" max="6" step="0.1"')
    script=script.replace('Two seconds to remember it.</p><button id="show-line"','Three seconds to remember it.</p><button id="show-line"')
    script=script.replace('afterEffect(()=>tracePicker(q),2000)','afterEffect(()=>tracePicker(q),q.previewMs||3000)')
    fixed_boxes="const boxes=[[-.3,0,0,1.5,.65,.6,'#2448ED'],[.5,.56,0,.5,.47,.6,'#D4EE46'],[-.6,-.1,.55,.5,.45,.5,'#F08A55']];"
    script=script.replace(fixed_boxes,"const boxes=options.shape.boxes;")
    script=script.replace("for(const [x,y,z,w,h,d,hex]of boxes){", "for(const box of boxes){const [x,y,z,w,h,d,hex]=box;")
    script=script.replace("for(const ids of [[0,1,2,3],[4,5,6,7],[0,4,7,3],[1,5,6,2],[3,2,6,7],[0,1,5,4]]){", "for(const [faceIndex,ids]of [[0,1,2,3],[4,5,6,7],[0,4,7,3],[1,5,6,2],[3,2,6,7],[0,1,5,4]].entries()){if(!box[7][faceIndex])continue;")
    script=script.replace("drawShape3D($('view-canvas'),value);", "drawShape3D($('view-canvas'),value,{shape:q.shape});")
    script=script.replace("q.answer,{overlay:true}", "q.answer,{overlay:true,shape:q.shape}")
    script=script.replace("drawShape3D($('view-canvas'),{yaw:0,pitch:0,roll:0});", "drawShape3D($('view-canvas'),{yaw:0,pitch:0,roll:0},{shape:q.shape});")
    script=script.replace("drawShape3D($('view-canvas'),q.answer);", "drawShape3D($('view-canvas'),q.answer,{shape:q.shape});")
    script=script.replace("drawShape3D(canvas,orientation);", "drawShape3D(canvas,orientation,{shape:q.shape});")
    return script
