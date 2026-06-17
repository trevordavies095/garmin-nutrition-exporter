(function(){

  /* Pull date from URL e.g. /app/nutrition/2026-06-15/0 — fall back to today */
  var urlDateMatch = window.location.href.match(/(\d{4}-\d{2}-\d{2})/);
  var today = urlDateMatch ? new Date(urlDateMatch[1] + 'T12:00:00') : new Date();
  var calDate = today.toISOString().split('T')[0];
  var dateLabel = today.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'});

  var existing = document.getElementById('__gc_nut__');
  if(existing){ existing.remove(); }

  function fmt(n){ return (n==null||isNaN(n)) ? '0' : Math.round(Number(n)).toLocaleString(); }
  function fmt1(n){ return (n==null||isNaN(n)) ? '0.0' : parseFloat(n).toFixed(1); }
  function textOf(el){ return el?(el.innerText||'').trim():''; }

  function parseSlash(str){
    var s=(str||'').replace(/,/g,'');
    var slash=s.match(/([\d.]+)\s*\/\s*([\d.]+)/);
    if(slash) return {consumed:parseFloat(slash[1]),goal:parseFloat(slash[2])};
    var single=s.match(/([\d.]+)/);
    return {consumed:single?parseFloat(single[1]):0,goal:0};
  }

  /* Parse a MealCard_mealStats element into {cal,goalCal,prot,goalProt,fat,goalFat,carb,goalCarb}
     Each child div has: [colorDot span] [value span e.g. "154 / 737 Cal" or "150 Cal"] */
  function parseStats(statsEl){
    var r={cal:0,goalCal:0,prot:0,goalProt:0,fat:0,goalFat:0,carb:0,goalCarb:0};
    if(!statsEl) return r;
    var divs=statsEl.children;
    for(var i=0;i<divs.length;i++){
      var spans=divs[i].querySelectorAll('span');
      var txt='';
      for(var j=spans.length-1;j>=0;j--){
        var t=textOf(spans[j]);
        if(t){txt=t;break;}
      }
      if(!txt) continue;
      var p=parseSlash(txt);
      if(/cal/i.test(txt))            {r.cal=p.consumed;r.goalCal=p.goal;}
      else if(/\d\s*p$/i.test(txt))   {r.prot=p.consumed;r.goalProt=p.goal;}
      else if(/\d\s*f$/i.test(txt))   {r.fat=p.consumed;r.goalFat=p.goal;}
      else if(/\d\s*c$/i.test(txt))   {r.carb=p.consumed;r.goalCarb=p.goal;}
    }
    return r;
  }

  /* ── UI ─────────────────────────────────────────────────── */
  var overlay=document.createElement('div');
  overlay.id='__gc_nut__';
  overlay.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.55);z-index:99999;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;';
  var card=document.createElement('div');
  card.style.cssText='background:#fff;border-radius:12px;padding:24px 28px;width:min(700px,94vw);max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.3);position:relative;';
  var closeBtn=document.createElement('button');
  closeBtn.textContent='X';
  closeBtn.style.cssText='position:absolute;top:12px;right:16px;background:none;border:none;font-size:18px;cursor:pointer;color:#555;';
  closeBtn.onclick=function(){overlay.remove();};
  var h1=document.createElement('h2');
  h1.style.cssText='margin:0 0 4px;font-size:18px;color:#1a1a1a;';
  h1.textContent='Nutrition Export';
  var subtitle=document.createElement('p');
  subtitle.style.cssText='margin:0 0 16px;color:#666;font-size:13px;';
  subtitle.textContent=dateLabel;
  var content=document.createElement('div');
  var actions=document.createElement('div');
  actions.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin-top:16px;';
  card.appendChild(closeBtn);card.appendChild(h1);card.appendChild(subtitle);
  card.appendChild(content);card.appendChild(actions);
  overlay.appendChild(card);
  document.body.appendChild(overlay);
  overlay.addEventListener('click',function(e){if(e.target===overlay)overlay.remove();});

  function makeBtn(label,color,fn){
    var b=document.createElement('button');
    b.textContent=label;
    b.style.cssText='padding:8px 14px;border:none;border-radius:7px;cursor:pointer;font-size:12px;font-weight:600;background:'+color+';color:#fff;';
    b.onclick=fn;return b;
  }

  /* ════════════════════════════════════════════════════════
     PARSE

     Key insight from debug: the meal card container is
     MealCard_mealCardContainer__x-7Vv (ancestor [4] of foodRowName).
     MealCard_mealCard__ is a child of that.
     Food rows are MealCard_foodRow__yZ3ZV inside the container.

     Strategy: find all foodRowName elements globally (confirmed
     working — found 12), then for each walk up to find:
       - the foodRow container (3 levels up from name)
       - the meal card container (closest ancestor with mealCardContainer)
     Group by meal card container to build meal→items structure.
     Build meal list separately from mealCard__ elements for stats.
  ════════════════════════════════════════════════════════ */
  function parse(){

    /* ── Step 1: collect meal cards in DOM order ── */
    var mealContainers=document.querySelectorAll('[class*="MealCard_mealCardContainer"]');
    var mealMap={};   /* key: container element reference index → meal obj */
    var mealList=[];  /* ordered list */
    var containerList=[];

    mealContainers.forEach(function(container){
      /* Meal name from header label */
      var nameEl=container.querySelector('[class*="MealCard_mealCardHeaderLabel"]');
      var mealName=textOf(nameEl);
      if(!mealName) return;

      /* Meal-level stats: mealStats NOT inside a foodRow */
      var allStats=container.querySelectorAll('[class*="MealCard_mealStats"]');
      var mealStatsEl=null;
      for(var i=0;i<allStats.length;i++){
        var inFoodRow=false;
        var cur=allStats[i].parentElement;
        while(cur&&cur!==container){
          if((cur.className||'').indexOf('MealCard_foodRow__')>-1){inFoodRow=true;break;}
          cur=cur.parentElement;
        }
        if(!inFoodRow){mealStatsEl=allStats[i];break;}
      }
      var ms=parseStats(mealStatsEl);

      var meal={name:mealName,cal:ms.cal,goalCal:ms.goalCal,
        prot:ms.prot,goalProt:ms.goalProt,
        fat:ms.fat,goalFat:ms.goalFat,
        carb:ms.carb,goalCarb:ms.goalCarb,
        items:[]};

      containerList.push(container);
      mealList.push(meal);
    });

    /* ── Step 2: find all food row name elements globally ── */
    var allFoodNames=document.querySelectorAll('[class*="MealCard_foodRowName"]');

    allFoodNames.forEach(function(nameEl){
      var foodName=textOf(nameEl);
      if(!foodName) return;

      /* Walk up to find the foodRow container (has class MealCard_foodRow__) */
      var foodRow=null;
      var cur=nameEl.parentElement;
      while(cur){
        if((cur.className||'').indexOf('MealCard_foodRow__')>-1){foodRow=cur;break;}
        cur=cur.parentElement;
      }
      if(!foodRow) return;

      /* Walk up further to find which mealCardContainer this belongs to */
      var mealIdx=-1;
      cur=foodRow.parentElement;
      while(cur){
        var idx=containerList.indexOf(cur);
        if(idx>-1){mealIdx=idx;break;}
        cur=cur.parentElement;
      }
      if(mealIdx<0) return;

      /* Extract serving, time, macros from the foodRow */
      var servingEl=foodRow.querySelector('[class*="MealCard_foodServing"]');
      var timeEl=foodRow.querySelector('[class*="MealCard_foodTime"]');
      var foodStatsEl=foodRow.querySelector('[class*="MealCard_mealStats"]');
      var fs=parseStats(foodStatsEl);

      mealList[mealIdx].items.push({
        name:foodName,
        serving:textOf(servingEl),
        time:textOf(timeEl),
        cal:fs.cal,prot:fs.prot,fat:fs.fat,carb:fs.carb
      });
    });

    /* ── Step 3: daily totals from chart dataContainers ──
       First multibar has 4 dataContainers in DOM order: Cal, Protein, Fat, Carbs
       Each reads e.g. "1,370 / 2,949" or "99 / 185 g"  */
    var totals={cal:0,prot:0,fat:0,carb:0};
    var goals={cal:0,prot:0,fat:0,carb:0};

    var firstMultibar=document.querySelector('[class*="NutritionStatHBarChart_multibarContainer"]');
    if(firstMultibar){
      var dataCells=firstMultibar.querySelectorAll('[class*="NutritionStatHBarChart_dataContainer"]');
      var keys=[['cal'],['prot'],['fat'],['carb']];
      dataCells.forEach(function(cell,i){
        if(i>3) return;
        var p=parseSlash(textOf(cell));
        totals[keys[i][0]]=p.consumed;
        goals[keys[i][0]]=p.goal;
      });
    }

    /* Fallback to meal sums if chart not found */
    if(!totals.cal){
      mealList.forEach(function(m){
        totals.cal+=m.cal||0;totals.prot+=m.prot||0;
        totals.fat+=m.fat||0;totals.carb+=m.carb||0;
        if(m.goalCal&&!goals.cal)   goals.cal=m.goalCal;
        if(m.goalProt&&!goals.prot) goals.prot=m.goalProt;
        if(m.goalFat&&!goals.fat)   goals.fat=m.goalFat;
        if(m.goalCarb&&!goals.carb) goals.carb=m.goalCarb;
      });
    }

    return {totals:totals,goals:goals,meals:mealList};
  }

  /* ── Render ─────────────────────────────────────────────── */
  function render(data){
    var t=data.totals,g=data.goals,meals=data.meals;

    var macroRows=[
      ['Calories',fmt(t.cal),  g.cal  ?fmt(g.cal)  :'-','kcal'],
      ['Protein', fmt1(t.prot),g.prot ?fmt1(g.prot):'-','g'],
      ['Carbs',   fmt1(t.carb),g.carb ?fmt1(g.carb):'-','g'],
      ['Fat',     fmt1(t.fat), g.fat  ?fmt1(g.fat) :'-','g']
    ];

    var html='<table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">'
      +'<thead><tr style="background:#f4f6f8;">'
      +'<th style="padding:7px 10px;text-align:left;">Nutrient</th>'
      +'<th style="padding:7px 10px;text-align:right;">Consumed</th>'
      +'<th style="padding:7px 10px;text-align:right;">Goal</th>'
      +'<th style="padding:7px 10px;text-align:left;">Unit</th>'
      +'</tr></thead><tbody>';
    macroRows.forEach(function(m,i){
      html+='<tr style="background:'+(i%2?'#fafafa':'#fff')+'">'
        +'<td style="padding:6px 10px;font-weight:600;color:#333;">'+m[0]+'</td>'
        +'<td style="padding:6px 10px;text-align:right;">'+m[1]+'</td>'
        +'<td style="padding:6px 10px;text-align:right;color:#888;">'+m[2]+'</td>'
        +'<td style="padding:6px 10px;color:#888;">'+m[3]+'</td></tr>';
    });
    html+='</tbody></table>';

    html+='<h3 style="font-size:13px;color:#333;margin:0 0 10px;">Meal Breakdown</h3>';
    meals.forEach(function(meal){
      var hg=meal.goalCal>0;
      html+='<div style="margin-bottom:12px;border:1px solid #e8e8e8;border-radius:8px;overflow:hidden;">'
        +'<div style="background:#f0f4f8;padding:7px 12px;">'
        +'<div style="display:flex;justify-content:space-between;align-items:baseline;">'
        +'<span style="font-weight:700;font-size:13px;color:#1a5276;">'+meal.name+'</span>'
        +'<span style="font-size:12px;color:#555;">'+fmt(meal.cal)+(hg?' / '+fmt(meal.goalCal)+' goal':'')+' kcal</span>'
        +'</div>'
        +'<div style="font-size:11px;color:#888;margin-top:2px;">'
        +'P:'+fmt1(meal.prot)+'g'+(meal.goalProt?' / '+fmt1(meal.goalProt)+'g':'')+' &nbsp;·&nbsp; '
        +'C:'+fmt1(meal.carb)+'g'+(meal.goalCarb?' / '+fmt1(meal.goalCarb)+'g':'')+' &nbsp;·&nbsp; '
        +'F:'+fmt1(meal.fat)+'g'+(meal.goalFat?' / '+fmt1(meal.goalFat)+'g':'')
        +'</div></div>';

      if(meal.items.length){
        html+='<table style="width:100%;border-collapse:collapse;font-size:12px;">';
        meal.items.forEach(function(item,i){
          html+='<tr style="background:'+(i%2?'#fafbfc':'#fff')+'">'
            +'<td style="padding:5px 10px;color:#333;">'+item.name+'</td>'
            +'<td style="padding:5px 8px;color:#888;white-space:nowrap;">'
            +(item.time?'<span style="color:#bbb;">'+item.time+'</span>&nbsp; ':'')+item.serving+'</td>'
            +'<td style="padding:5px 8px;text-align:right;white-space:nowrap;color:#555;font-size:11px;">'
            +fmt(item.cal)+' kcal'
            +(item.prot?' P:'+fmt1(item.prot):'')
            +(item.carb?' C:'+fmt1(item.carb):'')
            +(item.fat?' F:'+fmt1(item.fat):'')
            +'</td></tr>';
        });
        html+='</table>';
      } else {
        html+='<p style="padding:8px 10px;color:#bbb;font-size:12px;margin:0;">Nothing logged.</p>';
      }
      html+='</div>';
    });

    content.innerHTML=html;
    actions.innerHTML='';

    function buildText(detail){
      var txt='Nutrition Log - '+dateLabel+'\n'+'='.repeat(46)+'\n\nDAILY TOTALS\n'+'-'.repeat(28)+'\n';
      macroRows.forEach(function(m){
        txt+=(m[0]+':').padEnd(12)+' '+m[1]+(m[2]!=='-'?' / '+m[2]+' goal':'')+' '+m[3]+'\n';
      });
      if(detail){
        txt+='\nMEAL BREAKDOWN\n'+'-'.repeat(28)+'\n';
        meals.forEach(function(meal){
          txt+='\n'+meal.name+' — '+fmt(meal.cal)+(meal.goalCal?' / '+fmt(meal.goalCal)+' goal':'')+' kcal'
            +'  |  P:'+fmt1(meal.prot)+'g  C:'+fmt1(meal.carb)+'g  F:'+fmt1(meal.fat)+'g\n';
          meal.items.forEach(function(item){
            txt+='  - '+(item.time?'['+item.time+'] ':'')+item.name
              +(item.serving?' ('+item.serving+')':'')
              +'  '+fmt(item.cal)+' kcal'
              +(item.prot||item.carb||item.fat
                ?'  P:'+fmt1(item.prot)+'g C:'+fmt1(item.carb)+'g F:'+fmt1(item.fat)+'g':'')
              +'\n';
          });
        });
      }
      txt+='\n---\nExported from Garmin Connect on '+new Date().toLocaleString()+'\n';
      return txt;
    }

    actions.appendChild(makeBtn('Copy Summary','#2980b9',function(){
      var t=buildText(false);navigator.clipboard.writeText(t).then(function(){alert('Copied!');}).catch(function(){prompt('Copy:',t);});
    }));
    actions.appendChild(makeBtn('Copy Full Detail','#1a5276',function(){
      var t=buildText(true);navigator.clipboard.writeText(t).then(function(){alert('Copied!');}).catch(function(){prompt('Copy:',t);});
    }));
    actions.appendChild(makeBtn('Email to Coach','#27ae60',function(){
      var d=today.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});
      window.open('mailto:?subject='+encodeURIComponent('Nutrition Log - '+d)+'&body='+encodeURIComponent(buildText(true)));
    }));
    actions.appendChild(makeBtn('Download .txt','#8e44ad',function(){
      var blob=new Blob([buildText(true)],{type:'text/plain'});
      var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='nutrition-'+calDate+'.txt';a.click();
    }));
  }

  render(parse());
})();