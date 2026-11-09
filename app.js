(function(){
"use strict";
var C=window.CONFIG||{};var qs=new URLSearchParams(location.search);
var KIOSK=qs.get("kiosk")||C.KIOSK_ID||"1";
var SPEED=parseFloat(qs.get("fast")||"1")||1;        // test mode: ?fast=10 → timers 10× faster
var URL_=(qs.get("api")||C.WEB_APP_URL||"").trim();
var QKEY="sevina.voteQueue.v1",VKEY="sevina.voted.v1",SKEY="sevina.sent.v1",RKEY="sevina.rejected.v1";
var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return [].slice.call((r||document).querySelectorAll(s))};
var stage=$("#stage");

/* ---------- scaling (9:16, letterbox) ---------- */
var baseH=0;
function fit(){var w=innerWidth,h=innerHeight;
  // when the on-screen keyboard is open, the viewport shrinks: keep the previous scale, don't shrink the UI
  if(document.activeElement&&document.activeElement.tagName==="INPUT"&&baseH&&h<baseH)h=baseH;else baseH=h;
  var s=Math.min(w/1080,h/1920);stage.style.transform="translate("+((w-1080*s)/2)+"px,"+Math.max(0,(h-1920*s)/2)+"px) scale("+s+")";}
addEventListener("resize",fit);fit();

/* ---------- block zoom / context menu / pull-to-refresh ---------- */
["gesturestart","gesturechange","contextmenu","dragstart","selectstart"].forEach(function(t){document.addEventListener(t,function(e){if(t==="selectstart"&&e.target.tagName==="INPUT")return;e.preventDefault()},{passive:false})});
document.addEventListener("touchmove",function(e){if(e.touches.length>1){e.preventDefault();return}if(!e.target.closest(".vscroll"))e.preventDefault()},{passive:false});
document.addEventListener("wheel",function(e){if(e.ctrlKey)e.preventDefault()},{passive:false});
var lastTouch=0;document.addEventListener("touchend",function(e){var n=Date.now();if(n-lastTouch<300&&e.target.tagName!=="INPUT")e.preventDefault();lastTouch=n},{passive:false});

/* ---------- navigation + inactivity timer ---------- */
var cur="home",deadline=0,total=0,tick=null;
function go(id){var nx=$("#"+id);if(!nx)return;var old=$(".screen.active");if(old===nx){arm();return}
  if(old){old.classList.remove("active");if(old.id==="vote")resetVote();if(old.id==="seating"&&window.__seating)window.__seating.reset()}
  nx.classList.add("active");cur=id;var sc=$(".vscroll",nx);if(sc)sc.scrollTop=0;
  if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();arm();}
function arm(){var t=+($("#"+cur).dataset.t||0);clearInterval(tick);if(!t){deadline=0;return}
  total=t*1000/SPEED;deadline=Date.now()+total;render();tick=setInterval(render,250/Math.max(1,SPEED/4));}
function render(){if(!deadline)return;var left=deadline-Date.now(),scr=$("#"+cur);
  $$(".n",scr).forEach(function(n){n.textContent=Math.max(0,Math.ceil(left*SPEED/1000))});
  var b=$(".bar i",scr);if(b)b.style.transform="scaleX("+Math.max(0,left/total)+")";
  if(left<=0){clearInterval(tick);deadline=0;go("home")}}
function activity(){if(deadline&&!adminOpen())arm()}
["pointerdown","touchstart","keydown","input"].forEach(function(t){document.addEventListener(t,activity,{passive:true,capture:true})});
document.addEventListener("click",function(e){var g=e.target.closest("[data-go]");if(g)go(g.dataset.go)});
window.__kiosk={go:go,get cur(){return cur}};

/* ---------- validation ---------- */
var MASH=["qwert","werty","ertyu","rtyui","tyuio","yuiop","asdf","sdfg","dfgh","fghj","ghjk","hjkl","zxcv","xcvb","cvbn","vbnm","йцук","цуке","укен","фыва","ывап","вапр","ячсм","чсми","асдф","ертъ"];
var VOW=/[aeiouyаеиоуъюяэыё]/i;
function norm(s){return (s||"").replace(/\s+/g," ").trim()}
function key(s){return norm(s).toLocaleLowerCase("bg").replace(/[\s\-–'’.]/g,"")}
function check(raw,kind){var s=norm(raw),max=kind==="name"?40:50,lbl=kind==="name"?"Името":"Името на отбора";
  if(!s)return kind==="name"?"Моля, въведи името си.":"Моля, въведи името на отбора.";
  var letters=(s.match(/[A-Za-zА-Яа-яЁёЀ-ӿ]/g)||[]).length;
  if(/^[\d\s\W]+$/.test(s)&&!letters)return lbl+" трябва да съдържа букви, не само цифри или знаци.";
  if(letters<2)return lbl+" е твърде кратко – напиши поне 2 букви.";
  if(s.length>max)return lbl+" е твърде дълго – най-много "+max+" знака.";
  var ok=kind==="name"?/^[A-Za-zА-Яа-яЁёЀ-ӿ\s\-'’.]+$/:/^[A-Za-zА-Яа-яЁёЀ-ӿ0-9\s\-'’.!&?,:]+$/;
  if(!ok.test(s))return kind==="name"?"Използвай само букви (кирилица или латиница), интервал и тире.":"Използвай букви, цифри и обикновени знаци (без емоджита и специални символи).";
  var low=s.toLocaleLowerCase("bg");
  if(/(.)\1\1/.test(low.replace(/\s/g,"")))return "Хм, това прилича на случайно натиснати клавиши 🙂 Моля, напиши истинско име.";
  var flat=low.replace(/[^a-zа-яё]/g,"");
  for(var i=0;i<MASH.length;i++)if(flat.indexOf(MASH[i])>=0)return "Хм, това прилича на случайно натиснати клавиши 🙂 Моля, напиши истинско име.";
  if(flat.length>=4&&!VOW.test(flat))return "Хм, това прилича на случайно натиснати клавиши 🙂 Моля, напиши истинско име.";
  if(flat.length>=6&&new Set(flat).size<=2)return "Хм, това прилича на случайно натиснати клавиши 🙂 Моля, напиши истинско име.";
  return "";}
window.__check=check;

/* ---------- voting week (Wed 00:00 → Tue 23:59, Europe/Sofia) ---------- */
var TZ="Europe/Sofia";
function sofia(ms){var d=new Date(ms==null?Date.now():ms);try{var o={};new Intl.DateTimeFormat("en-CA",{timeZone:TZ,year:"numeric",month:"2-digit",day:"2-digit",weekday:"short"}).formatToParts(d).forEach(function(x){o[x.type]=x.value});
    return {y:+o.year,m:+o.month,d:+o.day,u:{Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6,Sun:7}[o.weekday]}}
  catch(e){return {y:d.getFullYear(),m:d.getMonth()+1,d:d.getDate(),u:d.getDay()||7}}}
function ymd(y,m,d){return new Date(Date.UTC(y,m-1,d)).toISOString().slice(0,10)}
function weekKey(ms){var p=sofia(ms);return ymd(p.y,p.m,p.d-(p.u+4)%7)}       // date of the Wednesday the week starts on
function nightDate(ms){var p=sofia((ms==null?Date.now():ms)-6*3600000);return ymd(p.y,p.m,p.d)} // before 06:00 = previous evening
window.__week={weekKey:weekKey,nightDate:nightDate};

/* ---------- this week's nights + teams (seating.js) ---------- */
var D0=window.SEATING||{},NIGHTS=(D0.nights||[]).filter(function(n){return n&&n.teams}),CUR_WEEK=weekKey(),WEEK_OK=true,NIGHT=null;
if(NIGHTS.length){
  var srt=NIGHTS.filter(function(n){return n.date}).sort(function(a,b){return a.date<b.date?-1:1}),td=nightDate();
  NIGHT=srt.filter(function(n){return n.date===td})[0]||srt.filter(function(n){return n.date>td})[0]||srt[srt.length-1]||NIGHTS[0];
  D0.teams=NIGHT.teams;D0.night=NIGHT.label||NIGHT.date;   // the seating map shows tonight's (or the next) night
  var wk=NIGHTS.filter(function(n){return n.date&&weekKey(Date.parse(n.date+"T12:00:00Z"))===CUR_WEEK});
  WEEK_OK=wk.length>0;var src=WEEK_OK?wk:NIGHTS;          // file not updated for this week yet → still list all, admin warns
  var allT=[];src.forEach(function(n){allT=allT.concat(n.teams)});
}else var allT=D0.teams||[];
/* ---------- vote form ---------- */
// Team dropdown = all teams reserved for this voting week's nights. size = max votes per team per week.
var TEAM_BY={},TEAMS=[];
allT.forEach(function(t){if(!t||!norm(t.name))return;var k=key(t.name),s=Math.max(1,parseInt(t.size,10)||0);
  if(TEAM_BY[k])TEAM_BY[k].size=Math.max(TEAM_BY[k].size,s);else{TEAM_BY[k]={name:norm(t.name),size:s};TEAMS.push(TEAM_BY[k])}});
TEAMS.sort(function(a,b){return a.name.localeCompare(b.name,"bg")});
window.__teams=TEAMS;
var form=$("#vform"),fn=$("#fname"),ft=$("#fteam"),ftv=$("#fteamv"),sub=$("#vsubmit"),pick=$("#tpick"),tlist=$("#tlist"),nsug=$("#nsug"),theme="",teamSel="";
var touched={name:false,team:false};
var escH=function(x){return String(x).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})};
function teamErr(){if(!TEAMS.length)return "Няма отбори в списъка за тази седмица – попитай водещия.";return teamSel&&TEAM_BY[key(teamSel)]?"":"Моля, първо избери отбора си."}
function upd(){var en=check(fn.value,"name"),et=teamErr();
  show(fn,$("#ename"),touched.name?en:"");show(ft,$("#eteam"),touched.team||!TEAMS.length?et:"");
  sub.disabled=!!(en||et||!theme);if(!sub.disabled)$("#eform").textContent="";return !sub.disabled}
function show(inp,el,m){el.textContent=m;inp.classList.toggle("bad",!!m)}
function setTeam(n){teamSel=n||"";ftv.textContent=teamSel||"Избери отбора си";ftv.classList.toggle("ph",!teamSel);
  $$(".topt",tlist).forEach(function(o){o.classList.toggle("sel",o.dataset.team===teamSel);o.setAttribute("aria-selected",o.dataset.team===teamSel)})}
tlist.innerHTML=TEAMS.length?TEAMS.map(function(t){return '<button type="button" class="topt" role="option" data-team="'+escH(t.name)+'">'+escH(t.name)+'</button>'}).join(""):'<div class="tempty">Няма отбори в списъка за тази седмица.</div>';
if(!TEAMS.length)ft.disabled=true;
function openPick(){if(!TEAMS.length)return;hideSug();if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();pick.hidden=false;ft.classList.add("open");
  var s=$(".topt.sel",tlist);tlist.scrollTop=s?Math.max(0,s.offsetTop-tlist.offsetTop-200):0}
function closePick(){pick.hidden=true;ft.classList.remove("open")}
ft.addEventListener("click",openPick);
$("#tclose").addEventListener("click",function(){closePick();touched.team=true;upd()});
pick.addEventListener("click",function(e){var o=e.target.closest(".topt");if(o){var ch=o.dataset.team!==teamSel;setTeam(o.dataset.team);closePick();touched.team=true;$("#eform").textContent="";upd();
    if(!fn.value){setTimeout(function(){fn.focus()},150)}else if(ch)renderSug();return}   // team first → straight on to the name
  if(e.target===pick){closePick();touched.team=true;upd()}});

/* ---------- name suggestions (custom list, no <datalist>) ---------- */
// server: GET ?names=1 → names ever entered per team (all weeks) + t = voted this week; cached for offline use.
var NKEY="sevina.teamNames.v1",LKEY="sevina.localNames.v1",MAXSUG=5,namesBusy=false;
function fetchNames(force){if(!URL_||namesBusy||!navigator.onLine)return;var c=load(NKEY,null);if(!force&&c&&Date.now()-c.at<60000)return;namesBusy=true;
  tfetch(URL_+(URL_.indexOf("?")<0?"?":"&")+"names=1&_="+Date.now(),{method:"GET"},C.TALLY_TIMEOUT_MS||12000).then(function(r){return r.json()})
  .then(function(j){if(j&&j.ok&&j.names){save(NKEY,{at:Date.now(),week:j.week||CUR_WEEK,names:j.names});if(document.activeElement===fn)renderSug()}}).catch(function(){}).then(function(){namesBusy=false})}
function rememberName(name,team){var L=load(LKEY,{}),tk=key(team);L[tk]=L[tk]||{};L[tk][key(name)]={n:name,ts:Date.now()};save(LKEY,L)}
function votedThisWeek(k){var v=load(VKEY,{});return !!v[k]&&weekKey(v[k])===weekKey()}
function teamNames(team){var tk=key(team),c=load(NKEY,null),L=load(LKEY,{})[tk]||{},m={},out=[],wkNow=weekKey(),srvWeek=c&&c.week===wkNow;
  ((c&&c.names&&c.names[tk])||[]).forEach(function(x){var nk=key(x.n);if(!nk||m[nk])return;m[nk]={n:x.n,t:!!(x.t&&srvWeek)};out.push(m[nk])});
  Object.keys(L).forEach(function(nk){if(!m[nk]){m[nk]={n:L[nk].n,t:false};out.push(m[nk])}});
  out.forEach(function(x){if(votedThisWeek(key(x.n)+"|"+tk))x.t=true});return out}
function suggest(team,typed){var q=key(typed),lo=norm(typed).toLocaleLowerCase("bg");if(!team||!q)return [];
  var res=[];teamNames(team).forEach(function(x){var nk=key(x.n),words=norm(x.n).toLocaleLowerCase("bg").split(" "),tier;
    if(nk.indexOf(q)===0||words.some(function(w){return key(w).indexOf(q)===0}))tier=0;else if(nk.indexOf(q)>=0)tier=1;else return;
    if(nk===q&&!x.t)return;   // already typed exactly
    res.push({n:x.n,t:x.t,tier:tier})});
  res.sort(function(a,b){return (a.t-b.t)||(a.tier-b.tier)||a.n.localeCompare(b.n,"bg")});return res.slice(0,MAXSUG)}
window.__suggest=suggest;
function hl(n,typed){var lo=n.toLocaleLowerCase("bg"),t=norm(typed).toLocaleLowerCase("bg"),i=t?lo.indexOf(t):-1;
  return i<0?escH(n):escH(n.slice(0,i))+"<b>"+escH(n.slice(i,i+t.length))+"</b>"+escH(n.slice(i+t.length))}
function renderSug(){var s=suggest(teamSel,fn.value);if(!s.length||document.activeElement!==fn){hideSug();return}
  nsug.innerHTML=s.map(function(x){return '<button type="button" class="ns'+(x.t?' done':'')+'" role="option" data-n="'+escH(x.n)+'"'+(x.t?' aria-disabled="true"':'')+'><span>'+hl(x.n,fn.value)+'</span>'+(x.t?'<small>✅ вече гласува</small>':'')+'</button>'}).join("");nsug.hidden=false}
function hideSug(){nsug.hidden=true;nsug.innerHTML=""}
["mousedown","pointerdown"].forEach(function(t){nsug.addEventListener(t,function(e){e.preventDefault()})});   // keep focus in the field while tapping
nsug.addEventListener("click",function(e){var o=e.target.closest(".ns");if(!o)return;
  if(o.classList.contains("done")){toast("„"+o.dataset.n+"“ вече гласува тази седмица 🙂");return}
  fn.value=o.dataset.n;touched.name=true;hideSug();fn.blur();upd()});
fn.addEventListener("input",function(){if(fn.value.length>2)touched.name=true;upd();renderSug()});
fn.addEventListener("focus",function(){fetchNames();renderSug()});
fn.addEventListener("blur",function(){setTimeout(function(){if(document.activeElement!==fn)hideSug()},200);if(fn.value)touched.name=true;upd()});
fn.addEventListener("keydown",function(e){if(e.key==="Enter"){e.preventDefault();fn.blur()}});
$$(".theme").forEach(function(b){b.addEventListener("click",function(){theme=b.dataset.theme;$$(".theme").forEach(function(x){x.classList.toggle("sel",x===b);x.setAttribute("aria-pressed",x===b)});if(document.activeElement)document.activeElement.blur();upd()})});
var vs=$("#vote .vscroll"),fwrap=fn.closest(".acwrap");
fn.addEventListener("focus",function(){vs.classList.add("kb");var y=function(){vs.scrollTop=Math.max(0,fwrap.offsetTop-260)};setTimeout(y,60);setTimeout(y,400)});
document.addEventListener("focusout",function(){setTimeout(function(){if(!document.activeElement||document.activeElement.tagName!=="INPUT"){vs.classList.remove("kb");fit()}},50)});
function resetVote(){form.reset();theme="";closePick();hideSug();setTeam("");touched={name:false,team:false};$$(".theme").forEach(function(x){x.classList.remove("sel")});$$(".err",form).forEach(function(e){e.textContent=""});$$(".field").forEach(function(f){f.classList.remove("bad")});sub.disabled=true;vs.classList.remove("kb");busy=false;upd()}
upd();
// local per-week records: drop entries from earlier voting weeks
(function(){var v=load(VKEY,{}),w=weekKey(),ch=false;for(var k in v)if(typeof v[k]!=="number"||weekKey(v[k])!==w){delete v[k];ch=true}if(ch)save(VKEY,v)})();
// votes this kiosk recorded for a team this week (sent or queued) – offline lower bound for the team cap
function localTeamCount(tk){var v=load(VKEY,{}),w=weekKey(),n=0;for(var k in v)if(k.slice(k.indexOf("|")+1)===tk&&weekKey(v[k])===w)n++;return n}
var busy=false;
form.addEventListener("submit",function(e){e.preventDefault();touched={name:true,team:true};if(!upd()){if(!theme)$("#eform").textContent="Избери тема, за която гласуваш.";return}
  if(busy)return;busy=true;hideSug();var T=TEAM_BY[key(teamSel)],name=norm(fn.value),team=T.name,size=T.size,k=key(name)+"|"+key(team);
  if(votedThisWeek(k)){dup(name,team);busy=false;return}
  if(localTeamCount(key(team))>=size){full(team,size);busy=false;return}
  remoteCheck(k,team,size).then(function(r){if(r.dup){dup(name,team);busy=false;return}
    if(r.full){full(team,r.cap||size);busy=false;return}
    var voted=load(VKEY,{});voted[k]=Date.now();save(VKEY,voted);rememberName(name,team);
    var v={id:KIOSK+"-"+Date.now()+"-"+Math.random().toString(36).slice(2,7),ts:new Date().toISOString(),kiosk:KIOSK,name:name,team:team,size:size,theme:theme,key:k,ua:navigator.userAgent};
    var q=load(QKEY,[]);q.push(v);save(QKEY,q);flush();busy=false;go("thanks");$("#tbars").innerHTML="";$("#tnote").textContent="…";setTimeout(showTally,900);});
});
document.addEventListener("click",function(e){var g=e.target.closest('[data-go="vote"]');if(g)fetchNames()});setTimeout(function(){fetchNames(true)},2500);
var TKEY="sevina.tally.v1";
function drawTally(t,note){var names=$$(".theme").map(function(b){return b.dataset.theme}),w=weekKey();
  var q=load(QKEY,[]).filter(function(v){return weekKey(Date.parse(v.ts))===w});var c={};names.forEach(function(n){c[n]=(t&&t[n])||0});q.forEach(function(v){if(c.hasOwnProperty(v.theme))c[v.theme]++});
  var tot=names.reduce(function(a,n){return a+c[n]},0),mx=Math.max.apply(null,names.map(function(n){return c[n]}));
  $("#tbars").innerHTML=names.map(function(n){var pc=tot?Math.round(c[n]*100/tot):0;return '<div class="tb'+(c[n]===mx&&mx>0?' lead':'')+'" data-theme="'+n.replace(/"/g,"&quot;")+'"><div class="bl"><span>'+n+'</span><b>'+c[n]+' · '+pc+'%</b></div><div class="bt"><i style="width:'+pc+'%"></i></div></div>'}).join("");
  $("#tnote").textContent=note||"";}
function showTally(){var cache=load(TKEY,null);if(cache&&cache.week&&cache.week!==weekKey())cache={t:{},week:weekKey()};   // last week's results never shown
  $("#tbars").innerHTML="";$("#tnote").textContent="Зареждане на резултатите…";
  var off=function(){if(cache)drawTally(cache.t,"Последни известни резултати – ще се обновят след връзка с интернет.");else{$("#tbars").innerHTML="";$("#tnote").textContent="Резултатите ще се покажат след връзка с интернет."}};
  if(!URL_){off();return}
  var got=false,attempts=0,ms=C.TALLY_TIMEOUT_MS||12000;
  function apply(j){if(!j||!j.ok||!j.tallies)return false;got=true;save(TKEY,{t:j.tallies,at:Date.now(),week:j.week||weekKey()});drawTally(j.tallies,"");return true}
  function failOrRetry(){if(got)return;if(attempts<2){doFetch();return}off()}
  function doFetch(){attempts++;var url=URL_+(URL_.indexOf("?")<0?"?":"&")+"tally=1&_="+Date.now();
    var settled=false,to=setTimeout(function(){if(settled||got)return;settled=true;failOrRetry()},ms);
    fetch(url).then(function(r){return r.json()}).then(function(j){clearTimeout(to);
      if(apply(j)){settled=true;return} // late OK after off() still draws
      if(!settled){settled=true;failOrRetry()}
    }).catch(function(){clearTimeout(to);if(got||settled)return;settled=true;failOrRetry()})}
  doFetch();}
window.__showTally=showTally;
function dup(name,team){$("#eform").textContent="Вече има глас от „"+name+"“ от отбор „"+team+"“ тази седмица. Всеки гласува само веднъж седмично – благодарим! 🙂";toast("Този човек вече е гласувал 🙂")}
function full(team,n){$("#eform").textContent=n===1?"Отбор „"+team+"“ вече е подал своя 1 глас тази седмица 🙂":"Отбор „"+team+"“ вече е подал всички "+n+" гласа тази седмица 🙂";toast("Отборът вече е гласувал изцяло 🙂")}
var tT;function toast(m){var t=$("#toast");t.textContent=m;t.classList.add("show");clearTimeout(tT);tT=setTimeout(function(){t.classList.remove("show")},3500)}


/* ---------- seating ---------- */
var SEAT_COL=["#e85d75","#4fc3f7","#81c784","#ffb74d","#ba68c8","#4db6ac","#f06292","#aed581","#7986cb","#ffd54f","#a1887f","#90a4ae"];
function isBlocked(sec,r,s){var b=(sec.blocked||{})[r];return !!b&&b.indexOf(s)>=0}
// bands = rows (1,2),(3,4)… of each section in order; each band = free segments of seats usable in BOTH rows.
function allocateSeats(teams,sections,band){band=band||2;var items=teams.map(function(t,i){return {name:t.name,size:+t.size,i:i}}).sort(function(a,b){return b.size-a.size||a.i-b.i});
  var bands=[],maxW=0,out={};
  sections.forEach(function(sec){for(var r=1;r+band-1<=sec.rows.length;r+=band){var n=Infinity,k;for(k=0;k<band;k++)n=Math.min(n,sec.rows[r-1+k]);
    var segs=[],cur=null;for(var s=1;s<=n;s++){var bl=false;for(k=0;k<band;k++)if(isBlocked(sec,r+k,s))bl=true;
      if(bl){cur=null;continue}if(!cur){cur={a:s,b:s,c:s};segs.push(cur)}else cur.b=s}
    segs.forEach(function(g){maxW=Math.max(maxW,g.b-g.a+1)});bands.push({sec:sec,r0:r,segs:segs})}});
  items.forEach(function(t){var w=Math.ceil(t.size/band),hit=null;if(w>maxW)throw new Error("Отбор „"+t.name+"“ е твърде голям за един ред");
    for(var k=0;k<bands.length&&!hit;k++)for(var j=0;j<bands[k].segs.length;j++){var g=bands[k].segs[j];if(g.c+w-1<=g.b){hit={B:bands[k],s0:g.c};g.c+=w+1;break}}
    if(!hit)throw new Error("Не стигат местата");
    var cells=[];for(var r=0;r<band;r++)for(var c=0;c<w;c++)cells.push([hit.B.r0+r,hit.s0+c]);cells=cells.slice(0,t.size);
    out[t.name]={sec:hit.B.sec.id,secName:hit.B.sec.name,r0:hit.B.r0,r1:hit.B.r0+band-1,s0:hit.s0,s1:hit.s0+w-1,cells:cells,i:t.i}});return out}
window.__allocateSeats=allocateSeats;
(function(){var D=window.SEATING||{teams:[]},SEC=D.sections||[],map=$("#smap"),leg=$("#sleg"),hi=null,A;
  if(D.example===false)$("#sex").remove();
  try{A=allocateSeats(D.teams||[],SEC)}catch(err){map.outerHTML='<div class="serr">⚠️ '+err.message+'</div>';return}
  var esc=function(x){return String(x).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})};
  var M=0;SEC.forEach(function(s){s.rows.forEach(function(n){M=Math.max(M,n)})});
  var occ={};Object.keys(A).forEach(function(n){A[n].cells.forEach(function(c){occ[A[n].sec+","+c[0]+","+c[1]]=n})});
  // half-seat columns, rows centred like the print; seat 1 on the right
  function col(n,s){return 2+(M-n)+2*(n-s)}
  var h="",g=1,gr={};
  SEC.slice().reverse().forEach(function(sec,si){
    if(si)h+='<div class="sep" style="grid-row:'+(g++)+';grid-column:1/-1"></div>';
    for(var r=1;r<=sec.rows.length;r++){var n=sec.rows[r-1];gr[sec.id+","+r]=g;
      h+='<div class="rn" style="grid-row:'+g+';grid-column:1">'+r+'</div><div class="rn" style="grid-row:'+g+';grid-column:'+(2*M+2)+'">'+r+'</div>';
      for(var s=1;s<=n;s++){var t=occ[sec.id+","+r+","+s],bl=isBlocked(sec,r,s);
        h+='<div class="seat'+(bl?' x':'')+(t?' t':'')+'"'+(t?' data-team="'+esc(t)+'" style="background:'+SEAT_COL[A[t].i%SEAT_COL.length]+';':' style="')+'grid-row:'+g+';grid-column:'+col(n,s)+'/span 2">'+s+'</div>'}
      g++}});
  Object.keys(A).forEach(function(n){var a=A[n],sec=SEC.filter(function(x){return x.id===a.sec})[0];
    var c0=Math.min(col(sec.rows[a.r0-1],a.s1),col(sec.rows[a.r1-1],a.s1)),c1=Math.max(col(sec.rows[a.r0-1],a.s0),col(sec.rows[a.r1-1],a.s0))+2;
    h+='<button class="blk" data-team="'+esc(n)+'" style="grid-row:'+gr[a.sec+","+a.r0]+'/'+(gr[a.sec+","+a.r1]+1)+';grid-column:'+c0+'/'+c1+';background:'+SEAT_COL[a.i%SEAT_COL.length]+'">'+esc(n)+'</button>'});
  map.style.gridTemplateColumns="44px repeat("+(2*M)+",1fr) 44px";map.innerHTML=h;
  leg.innerHTML=Object.keys(A).sort(function(a,b){return a.localeCompare(b,"bg")}).map(function(n){var a=A[n];return '<button class="li" data-team="'+esc(n)+'"><i style="background:'+SEAT_COL[a.i%SEAT_COL.length]+'"></i><div>'+esc(n)+'<small>Ред '+a.r0+'–'+a.r1+', места '+a.s0+'–'+a.s1+'</small></div></button>'}).join("");
  function set(n){hi=n;map.classList.toggle("dim",!!n);$$("#seating [data-team]").forEach(function(x){x.classList.toggle("hi",x.dataset.team===n)})}
  document.getElementById("seating").addEventListener("click",function(e){var t=e.target.closest("[data-team]");if(!t)return;set(hi===t.dataset.team?null:t.dataset.team)});
  window.__seating={A:A,set:set,reset:function(){set(null)}};
})();

/* ---------- storage + backend ---------- */
function load(k,d){try{var v=JSON.parse(localStorage.getItem(k));return v==null?d:v}catch(e){return d}}
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
var status={last:"—",ok:null,lastOk:null,err:""};
function tfetch(u,o,ms){return new Promise(function(res,rej){var t=setTimeout(function(){rej(new Error("timeout"))},ms);fetch(u,o).then(function(r){clearTimeout(t);res(r)},function(e){clearTimeout(t);rej(e)})})}
// online pre-check: person duplicate + team cap. Old servers ignore team/size → {duplicate} only. Timeout/offline → allowed (server decides).
function remoteCheck(k,team,size){var no={dup:false,full:false};if(!URL_||!navigator.onLine)return Promise.resolve(no);
  return tfetch(URL_+(URL_.indexOf("?")<0?"?":"&")+"check="+encodeURIComponent(k)+"&team="+encodeURIComponent(team)+"&size="+size,{method:"GET"},C.DUP_CHECK_TIMEOUT_MS||2500).then(function(r){return r.json()})
  .then(function(j){return {dup:!!(j&&j.duplicate),full:!!(j&&j.full),cap:j&&+j.cap||0}}).catch(function(){return no})}
var flushing=false;
function flush(){if(flushing||!URL_)return;var q=load(QKEY,[]);if(!q.length)return;flushing=true;var v=q[0];
  tfetch(URL_,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(v),redirect:"follow"},C.REQUEST_TIMEOUT_MS||8000)
  .then(function(r){if(!r.ok)throw new Error("HTTP "+r.status);return r.json()})
  .then(function(j){var drop=j&&j.ok===false&&(j.reason==="team_full"||j.reason==="invalid"||j.error==="invalid"); // final rejection: never retry
    if(!j||!(j.ok||j.duplicate||drop))throw new Error((j&&j.error)||"bad reply");
    var q2=load(QKEY,[]).filter(function(x){return x.id!==v.id});save(QKEY,q2);
    if(drop){var rj=load(RKEY,{}),why=j.reason||"invalid";rj[why]=(rj[why]||0)+1;save(RKEY,rj);
      var vd=load(VKEY,{});delete vd[v.key];save(VKEY,vd); // the vote did not count
      status.err=why==="team_full"?"отхвърлен: отбор „"+v.team+"“ е пълен":"отхвърлен: невалиден глас"}
    else{var s=load(SKEY,0)+1;save(SKEY,s);status.err=j.duplicate?"последният беше дубликат (сървър)":""}
    status.ok=true;status.lastOk=new Date();flushing=false;if(q2.length)flush();else fetchNames(true);})
  .catch(function(e){status.ok=false;status.err=String(e.message||e);flushing=false})
  .then(function(){status.last=new Date();if(adminOpen())renderAdmin()});}
setInterval(flush,(C.RETRY_SECONDS||30)*1000/Math.min(SPEED,10));addEventListener("online",flush);setTimeout(flush,1500);
window.__flush=flush;

/* ---------- hidden admin (long-press 5 s on logo) ---------- */
var lp=null,adm=$("#admin");function adminOpen(){return !adm.hidden}
$$(".logo").forEach(function(l){l.addEventListener("pointerdown",function(){clearTimeout(lp);lp=setTimeout(openAdmin,5000/Math.min(SPEED,10))});["pointerup","pointerleave","pointercancel"].forEach(function(t){l.addEventListener(t,function(){clearTimeout(lp)})})});
function openAdmin(){adm.hidden=false;clearInterval(tick);renderAdmin()}
function fmt(d){return d&&d.toLocaleTimeString?d.toLocaleTimeString("bg-BG"):"—"}
function renderAdmin(){var q=load(QKEY,[]),rj=load(RKEY,{}),D=window.SEATING||{};$("#ainfo").innerHTML="<div>Киоск: <b>"+KIOSK+"</b></div><div>Седмица: <b>"+weekKey()+"</b> (ср–вт) · карта: <b>"+escH(D.night||"—")+"</b> · отбори за гласуване: <b>"+TEAMS.length+"</b>"+(WEEK_OK?"":" · <b>⚠️ seating.js не е за тази седмица</b>")+"</div><div>Отхвърлени (пълен отбор): <b>"+(rj.team_full||0)+"</b>"+(rj.invalid?" · невалидни: <b>"+rj.invalid+"</b>":"")+"</div><div>Гласове в опашката: <b>"+q.length+"</b></div><div>Изпратени от този киоск: <b>"+load(SKEY,0)+"</b></div><div>Бекенд: <b>"+(URL_?(status.ok===null?"още не е проверен":status.ok?"✅ OK":"⚠️ грешка"):"⚠️ няма зададен WEB_APP_URL")+"</b></div><div>Мрежа: <b>"+(navigator.onLine?"онлайн":"офлайн")+"</b></div><div>Последен опит: "+fmt(status.last)+" · Последен успех: "+fmt(status.lastOk)+"</div>"+(status.err?"<div>Грешка: "+status.err.replace(/</g,"&lt;")+"</div>":"")}
$("#aflush").addEventListener("click",function(){flush();setTimeout(renderAdmin,1500)});
$("#areload").addEventListener("click",function(){location.reload()});
$("#aclose").addEventListener("click",function(){adm.hidden=true;arm()});
window.__admin={open:openAdmin,render:renderAdmin};
})();
