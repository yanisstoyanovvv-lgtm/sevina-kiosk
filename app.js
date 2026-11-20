(function(){
"use strict";
var C=window.CONFIG||{};var qs=new URLSearchParams(location.search);
var KIOSK=qs.get("kiosk")||C.KIOSK_ID||"1";
var SPEED=parseFloat(qs.get("fast")||"1")||1;
var URL_=(qs.get("api")||C.WEB_APP_URL||"").trim();
var QKEY="sevina.voteQueue.v1",VKEY="sevina.voted.v1",SKEY="sevina.sent.v1",RKEY="sevina.rejected.v1";
var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return [].slice.call((r||document).querySelectorAll(s))};
var stage=$("#stage");
var TZ="Europe/Sofia";

/* ---------- scaling (9:16, letterbox) ---------- */
var baseH=0;
function fit(){var w=innerWidth,h=innerHeight;
  if(document.activeElement&&document.activeElement.tagName==="INPUT"&&baseH&&h<baseH)h=baseH;else baseH=h;
  var land=w>h&&cur==="seating";
  document.body.classList.toggle("land",!!land);
  var W=land?1920:1080,H=land?1080:1920;
  stage.style.width=W+"px";stage.style.height=H+"px";
  var s=Math.min(w/W,h/H);stage.style.transform="translate("+((w-W*s)/2)+"px,"+Math.max(0,(h-H*s)/2)+"px) scale("+s+")";}
addEventListener("resize",fit);fit();

/* ---------- block zoom / context menu / pull-to-refresh ---------- */
["gesturestart","gesturechange","contextmenu","dragstart","selectstart"].forEach(function(t){document.addEventListener(t,function(e){if(t==="selectstart"&&e.target.tagName==="INPUT")return;e.preventDefault()},{passive:false})});
document.addEventListener("touchmove",function(e){if(e.touches.length>1){e.preventDefault();return}if(!e.target.closest(".vscroll"))e.preventDefault()},{passive:false});
document.addEventListener("wheel",function(e){if(e.ctrlKey)e.preventDefault()},{passive:false});
var lastTouch=0;document.addEventListener("touchend",function(e){var n=Date.now();if(n-lastTouch<300&&e.target.tagName!=="INPUT")e.preventDefault();lastTouch=n},{passive:false});

/* ---------- clock (optional ?sim=YYYY-MM-DDTHH:MM as Europe/Sofia wall time) ---------- */
function sofia(ms){
  var d=new Date(ms==null?nowMs():ms);
  try{var o={};new Intl.DateTimeFormat("en-GB",{timeZone:TZ,year:"numeric",month:"2-digit",day:"2-digit",weekday:"short",hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"}).formatToParts(d).forEach(function(x){o[x.type]=x.value});
    return {y:+o.year,m:+o.month,d:+o.day,u:{Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6,Sun:7}[o.weekday],h:+o.hour,min:+o.minute,sec:+o.second};}
  catch(e){return {y:d.getFullYear(),m:d.getMonth()+1,d:d.getDate(),u:d.getDay()||7,h:d.getHours(),min:d.getMinutes(),sec:d.getSeconds()};}}
function ymd(y,m,d){return new Date(Date.UTC(y,m-1,d)).toISOString().slice(0,10)}
var SIM=null;
(function(){
  var s=qs.get("sim"); if(!s) return;
  var m=String(s).match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?$/); if(!m) return;
  var y=+m[1],mo=+m[2],d=+m[3],h=+(m[4]||0),mi=+(m[5]||0),se=+(m[6]||0);
  var guess=Date.UTC(y,mo-1,d,h-2,mi,se);
  for(var i=0;i<4;i++){var p=sofia(guess);var have=Date.UTC(p.y,p.m-1,p.d,p.h,p.min,p.sec||0);var want=Date.UTC(y,mo-1,d,h,mi,se);guess+=want-have;}
  SIM=guess;
})();
function nowMs(){return SIM!=null?SIM:Date.now()}
// 02:00 belongs to the previous calendar day.
function nightDay(ms){var p=sofia(ms==null?nowMs():ms); if(p.h<2){return {y:p.y,m:p.m,d:p.d-1,u:p.u===1?7:p.u-1,h:p.h,min:p.min,before2:true}} return {y:p.y,m:p.m,d:p.d,u:p.u,h:p.h,min:p.min,before2:false}}
function weekKey(ms){var n=nightDay(ms==null?nowMs():ms); var back=(n.u+2)%7; return ymd(n.y,n.m,n.d-back)} // Friday of the weekend
function nightDate(ms){var p=sofia((ms==null?nowMs():ms)-6*3600000); return ymd(p.y,p.m,p.d)} // before 06:00 = previous evening
function voteOpen(ms){var p=sofia(ms==null?nowMs():ms), n=nightDay(ms==null?nowMs():ms); if(n.u!==5&&n.u!==6) return false; if(p.h<2) return true; return p.h>=16}
window.__week={weekKey:weekKey,nightDate:nightDate,voteOpen:voteOpen,nowMs:nowMs,sofia:sofia};

/* ---------- navigation + inactivity timer ---------- */
var cur="home",deadline=0,total=0,tick=null;
function go(id){var nx=$("#"+id);if(!nx)return;var old=$(".screen.active");if(old===nx){arm();return}
  if(old){old.classList.remove("active");if(old.id==="vote")resetVote();if(old.id==="seating"&&window.__seating)window.__seating.reset();if(old.id==="klasirane"&&window.__standings)window.__standings.home()}
  nx.classList.add("active");cur=id;if(old&&old.id==="vote"&&window.__applyPending)window.__applyPending();var sc=$(".vscroll",nx);if(sc)sc.scrollTop=0;
  if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();fit();arm();
  if(id==="vote")syncVoteView();}
function arm(){var t=+($("#"+cur).dataset.t||0);clearInterval(tick);if(!t){deadline=0;return}
  total=t*1000/SPEED;deadline=Date.now()+total;render();tick=setInterval(render,250/Math.max(1,SPEED/4));}
function render(){if(!deadline)return;var left=deadline-Date.now(),scr=$("#"+cur);
  $$(".n",scr).forEach(function(n){n.textContent=Math.max(0,Math.ceil(left*SPEED/1000))});
  var b=$(".bar i",scr);if(b)b.style.transform="scaleX("+Math.max(0,left/total)+")";
  if(left<=0){clearInterval(tick);deadline=0;go("home")}}
function activity(){if(deadline&&!adminOpen())arm()}
["pointerdown","touchstart","keydown","input"].forEach(function(t){document.addEventListener(t,activity,{passive:true,capture:true})});
document.addEventListener("click",function(e){
  var g=e.target.closest("[data-go]"); if(!g) return;
  go(g.dataset.go);
});
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
var escH=function(x){return String(x).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})};

/* ---------- this weekend's nights + teams (seating.js) ---------- */
/* topics: seating can come from the sheet („Резервации“, ?config=1) – see "remote config" below. */
var D0=window.SEATING||{};window.SEATING=D0;
var NIGHTS=[],CUR_WEEK=weekKey(),WEEK_OK=true,NIGHT=null,allT=[];
var BUILTIN={nights:D0.nights,teams:D0.teams,example:D0.example}; // seating.js = last-resort fallback
function pickNights(){
  CUR_WEEK=weekKey();NIGHT=null;WEEK_OK=true;
  NIGHTS=(D0.nights||[]).filter(function(n){return n&&n.teams});
  if(NIGHTS.length){
    var srt=NIGHTS.filter(function(n){return n.date}).sort(function(a,b){return a.date<b.date?-1:1}),td=nightDate();
    NIGHT=srt.filter(function(n){return n.date===td})[0]||srt.filter(function(n){return n.date>td})[0]||srt[srt.length-1]||NIGHTS[0];
    D0.teams=NIGHT.teams;D0.seats=NIGHT.seats||null;D0.night=NIGHT.label||NIGHT.date;
    var wk=NIGHTS.filter(function(n){return n.date&&weekKey(Date.parse(n.date+"T12:00:00+02:00"))===CUR_WEEK});
    WEEK_OK=wk.length>0;
    allT=(NIGHT.teams||[]).slice();
  }else{allT=D0.teams||[];D0.seats=null}
}
pickNights();

function fillKakvo(){
  var card=$("#kakvo-card"); if(!card) return;
  var lines=[];
  if(NIGHT&&NIGHT.type==="themed"){
    lines.push("<p>🎭 Тази вечер е тематична: "+(NIGHT.theme?escH(NIGHT.theme):"темата на вечерта")+".</p>");
  }else if(NIGHT&&NIGHT.type==="gk"){
    lines.push("<p>📚 Тази вечер играем куиз с общи знания.</p>");
  }else{
    lines.push("<p>📚 В петък играем тематичен куиз, в събота – с общи знания.</p>");
  }
  lines.push("<p>🍹 Идваш, сядаш с отбора си и си избираш нещо за пиене и хапване.</p>");
  lines.push("<p>📝 Всеки отбор получава листите за отговори и си избира име.</p>");
  if(NIGHT&&NIGHT.type==="themed"){
    lines.push("<p>❓ Играем 6 рунда по темата.</p>");
  }else{
    lines.push("<p>❓ Играем 6 рунда с различни въпроси – картинки, музика, видео, логика и истории.</p>");
  }
  lines.push("<p>⏱️ Всеки въпрос е на екрана с таймер.</p>");
  lines.push("<p>✅ След всеки рунд събираме листите и ги точкуваме.</p>");
  lines.push("<p>🔄 След всеки 2 рунда има почивка.</p>");
  lines.push("<p>🏆 В края обявяваме класирането място по място, от последното до първото, а точките влизат и в сезонното класиране.</p>");
  card.innerHTML=lines.join("");
}
fillKakvo();

function syncVoteView(){
  var on=voteOpen(), btn=$("#btn-vote"), home=$("#home"), form=$("#vform"), closed=$("#vclosed"), vote=$("#vote");
  if(btn) btn.hidden=false;
  if(home){home.classList.add("six");home.classList.remove("five")}
  if(vote) vote.classList.toggle("closed",!on);
  if(form) form.hidden=!on;
  if(closed) closed.hidden=on;
  if(!on&&cur==="vote") showClosedTally();
}
syncVoteView();
setInterval(syncVoteView,30000);

/* ---------- vote form ---------- */
var TEAM_BY={},TEAMS=[];
function buildTeams(){var k0;for(k0 in TEAM_BY)delete TEAM_BY[k0];TEAMS.length=0;
allT.forEach(function(t){if(!t||!norm(t.name))return;var k=key(t.name),s=Math.max(1,parseInt(t.size,10)||0);
  if(TEAM_BY[k])TEAM_BY[k].size=Math.max(TEAM_BY[k].size,s);else{TEAM_BY[k]={name:norm(t.name),size:s};TEAMS.push(TEAM_BY[k])}});
TEAMS.sort(function(a,b){return a.name.localeCompare(b.name,"bg")});}
buildTeams();
window.__teams=TEAMS;
var form=$("#vform"),fn=$("#fname"),ft=$("#fteam"),ftv=$("#fteamv"),sub=$("#vsubmit"),pick=$("#tpick"),tlist=$("#tlist"),nsug=$("#nsug"),theme="",teamSel="";
var touched={name:false,team:false};
function teamErr(){if(!TEAMS.length)return "Няма отбори в списъка за този уикенд – попитай водещия.";return teamSel&&TEAM_BY[key(teamSel)]?"":"Моля, първо избери отбора си."}
function upd(){var en=check(fn.value,"name"),et=teamErr();
  show(fn,$("#ename"),touched.name?en:"");show(ft,$("#eteam"),touched.team||!TEAMS.length?et:"");
  sub.disabled=!!(en||et||!theme||!voteOpen());if(!sub.disabled)$("#eform").textContent="";return !sub.disabled}
function show(inp,el,m){el.textContent=m;inp.classList.toggle("bad",!!m)}
function setTeam(n){teamSel=n||"";ftv.textContent=teamSel||"Избери отбора си";ftv.classList.toggle("ph",!teamSel);
  $$(".topt",tlist).forEach(function(o){o.classList.toggle("sel",o.dataset.team===teamSel);o.setAttribute("aria-selected",o.dataset.team===teamSel)})}
function renderTeamList(){tlist.innerHTML=TEAMS.length?TEAMS.map(function(t){return '<button type="button" class="topt" role="option" data-team="'+escH(t.name)+'">'+escH(t.name)+'</button>'}).join(""):'<div class="tempty">Няма отбори в списъка за този уикенд.</div>';ft.disabled=!TEAMS.length;if(teamSel)setTeam(teamSel);}
renderTeamList();
function openPick(){if(!TEAMS.length)return;hideSug();if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();pick.hidden=false;ft.classList.add("open");}
function closePick(){pick.hidden=true;ft.classList.remove("open")}
ft.addEventListener("click",function(){if(pick.hidden)openPick();else closePick()});
tlist.addEventListener("click",function(e){var o=e.target.closest(".topt");if(!o)return;touched.team=true;setTeam(o.dataset.team);closePick();upd()});
$("#tclose").addEventListener("click",closePick);

var NKEY="sevina.teamNames.v1",LKEY="sevina.localNames.v1",MAXSUG=5,namesBusy=false;
function fetchNames(force){if(!URL_||namesBusy||!navigator.onLine)return;var c=load(NKEY,null);if(!force&&c&&Date.now()-c.at<60000)return;namesBusy=true;
  tfetch(URL_+(URL_.indexOf("?")<0?"?":"&")+"names=1&_="+Date.now(),{method:"GET"},C.TALLY_TIMEOUT_MS||12000).then(function(r){return r.json()})
  .then(function(j){if(j&&j.ok&&j.names){save(NKEY,{at:Date.now(),week:j.week||CUR_WEEK,names:j.names});if(document.activeElement===fn)renderSug()}}).catch(function(){}).then(function(){namesBusy=false})}
function rememberName(name,team){var L=load(LKEY,{}),tk=key(team);L[tk]=L[tk]||{};L[tk][key(name)]={n:name,ts:Date.now()};save(LKEY,L)}
function votedThisWeek(k){var v=load(VKEY,{});return !!v[k]&&weekKey(v[k])===weekKey()}
function teamNames(team){var tk=key(team),c=load(NKEY,null),L=load(LKEY,{})[tk]||{},m={},out=[],wkNow=weekKey(),srvWeek=c&&c.week===wkNow;
  ((c&&c.names&&c.names[tk])||[]).forEach(function(x){var nk=key(x.n);if(!nk||m[nk])return;m[nk]={n:x.n,t:!!(x.t&&srvWeek)};out.push(m[nk])});
  Object.keys(L).forEach(function(nk){if(m[nk])return;m[nk]={n:L[nk].n,t:false};out.push(m[nk])});
  out.forEach(function(x){if(votedThisWeek(key(x.n)+"|"+tk))x.t=true});return out}
function suggest(team,typed){var q=key(typed),lo=norm(typed).toLocaleLowerCase("bg");if(!team||!q)return [];
  return teamNames(team).filter(function(x){return key(x.n).indexOf(q)===0||x.n.toLocaleLowerCase("bg").indexOf(lo)>=0}).slice(0,MAXSUG)}
function hl(n,typed){var lo=n.toLocaleLowerCase("bg"),t=norm(typed).toLocaleLowerCase("bg"),i=t?lo.indexOf(t):-1;
  if(i<0)return escH(n);return escH(n.slice(0,i))+"<b>"+escH(n.slice(i,i+t.length))+"</b>"+escH(n.slice(i+t.length))}
function renderSug(){var s=suggest(teamSel,fn.value);if(!s.length||document.activeElement!==fn){hideSug();return}
  nsug.hidden=false;nsug.innerHTML=(s.some(function(x){return x.t})?'<div class="nsh">Вече гласували този уикенд</div>':"")+s.map(function(x){return '<button type="button" class="ns'+(x.t?" done":"")+'" role="option" data-name="'+escH(x.n)+'">'+hl(x.n,fn.value)+(x.t?"<small>гласувал</small>":"")+"</button>"}).join("")}
function hideSug(){nsug.hidden=true;nsug.innerHTML=""}
nsug.addEventListener("mousedown",function(e){e.preventDefault();var b=e.target.closest(".ns");if(!b)return;fn.value=b.getAttribute("data-name")||"";hideSug();touched.name=true;upd()});
fn.addEventListener("input",function(){if(fn.value.length>2)touched.name=true;upd();renderSug()});
fn.addEventListener("focus",function(){fetchNames();renderSug()});
fn.addEventListener("blur",function(){setTimeout(function(){if(document.activeElement!==fn)hideSug()},200);if(fn.value)touched.name=true;upd()});
fn.addEventListener("keydown",function(e){if(e.key==="Enter"){e.preventDefault();fn.blur()}});
var themesBox=$("#vform .themes");
themesBox.addEventListener("click",function(e){var b=e.target.closest(".theme");if(!b)return;theme=b.dataset.theme;$$(".theme").forEach(function(x){x.classList.toggle("sel",x===b);x.setAttribute("aria-pressed",x===b)});if(document.activeElement)document.activeElement.blur();upd()});
/* ---------- vote topics (from the „Теми“ tab via ?config=1 / ?tally=1; sheet list only, cached) ---------- */
var TOPKEY="sevina.topics.v2",MAX_TOPICS=10;
var TOPICS=[];
var TOPIC_SRC="зареждане",TOPIC_AT=null,pendingTopics=null;
function tLen(s){return s.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g,"_").length}   // emoji = 1
function tKey(s){return norm(s).toLocaleLowerCase("bg")}
function topicIdx(list,s){var k=tKey(s);for(var i=0;i<list.length;i++)if(tKey(list[i])===k)return i;return -1}
function cleanTopics(a){var out=[];(a||[]).forEach(function(x){x=norm(String(x==null?"":x));if(x&&topicIdx(out,x)<0&&out.length<MAX_TOPICS)out.push(x)});return out}
function renderTopics(){
  var wait=$("#topics-wait");
  themesBox.innerHTML="";
  if(!TOPICS.length){
    if(wait){wait.hidden=false;wait.textContent=(TOPIC_SRC==="грешка"||navigator.onLine===false)?"Темите ще се покажат след връзка с интернет.":"Зареждане на темите…";}
    if(theme)theme="";
    return;
  }
  if(wait)wait.hidden=true;
  var col=0,many=TOPICS.length>6,LIM=many?19:18;themesBox.classList.toggle("many",many);
  TOPICS.forEach(function(t,i){var b=document.createElement("button");b.type="button";b.className="theme";b.dataset.theme=t;b.textContent=t;
    var wide=tLen(t)>LIM;var next=TOPICS[i+1];
    // a short topic alone at the end of a row (last one, or next is wide) also spans the row
    if(!wide&&col===0&&(next==null||tLen(next)>LIM))wide=true;
    if(wide){b.classList.add("wide");var L=tLen(t);if(L>34)b.classList.add("xlong");else if(L>27)b.classList.add("long");col=0}else col=(col+1)%2;
    if(theme&&tKey(theme)===tKey(t)){b.classList.add("sel");b.setAttribute("aria-pressed","true")}
    themesBox.appendChild(b)});
  if(theme&&topicIdx(TOPICS,theme)<0){theme="";}
}
// Apply a new list; while someone is filling in the vote form, wait until they leave the screen.
function setTopics(list,src){var l=cleanTopics(list);if(!l.length)return false;
  TOPIC_SRC=src||"таблица";TOPIC_AT=new Date();save(TOPKEY,{list:l,at:Date.now()});
  if(l.join("\n")===TOPICS.join("\n"))return false;
  if(cur==="vote"&&!form.hidden&&TOPICS.length){pendingTopics=l;return false}
  TOPICS=l;pendingTopics=null;renderTopics();upd();
  if(cur==="vote"&&form.hidden)showClosedTally();
  return true}
(function(){var c=load(TOPKEY,null);if(c&&c.list){var l=cleanTopics(c.list);if(l.length){TOPICS=l;TOPIC_SRC="кеш"}}renderTopics()})();
window.__topics={set:setTopics,get list(){return TOPICS},get pending(){return pendingTopics}};

var vs=$("#vote .vscroll"),fwrap=fn.closest(".acwrap");
fn.addEventListener("focus",function(){vs.classList.add("kb");var y=function(){vs.scrollTop=Math.max(0,fwrap.offsetTop-260)};setTimeout(y,60);setTimeout(y,400)});
document.addEventListener("focusout",function(){setTimeout(function(){if(!document.activeElement||document.activeElement.tagName!=="INPUT"){vs.classList.remove("kb");fit()}},50)});
function resetVote(){form.reset();theme="";closePick();hideSug();setTeam("");touched={name:false,team:false};$$(".theme").forEach(function(x){x.classList.remove("sel")});$$(".err",form).forEach(function(e){e.textContent=""});$$(".field").forEach(function(f){f.classList.remove("bad")});sub.disabled=true;vs.classList.remove("kb");busy=false;upd()}
upd();
(function(){var v=load(VKEY,{}),w=weekKey(),ch=false;for(var k in v)if(typeof v[k]!=="number"||weekKey(v[k])!==w){delete v[k];ch=true}if(ch)save(VKEY,v)})();
function localTeamCount(tk){var v=load(VKEY,{}),w=weekKey(),n=0;for(var k in v)if(k.slice(k.indexOf("|")+1)===tk&&weekKey(v[k])===w)n++;return n}
var busy=false;
form.addEventListener("submit",function(e){e.preventDefault();touched={name:true,team:true};if(!voteOpen()){$("#eform").textContent="Гласуването е отворено в петък и събота от 16:00 до 02:00.";busy=false;return}
  if(!upd()){if(!theme)$("#eform").textContent="Избери тема, за която гласуваш.";return}
  if(busy)return;busy=true;hideSug();var T=TEAM_BY[key(teamSel)],name=norm(fn.value),team=T.name,size=T.size,k=key(name)+"|"+key(team);
  if(votedThisWeek(k)){dup(name,team);busy=false;return}
  if(localTeamCount(key(team))>=size){full(team,size);busy=false;return}
  remoteCheck(k,team,size).then(function(r){if(r.closed){$("#eform").textContent="Гласуването е отворено в петък и събота от 16:00 до 02:00.";busy=false;return}
    if(r.dup){dup(name,team);busy=false;return}
    if(r.full){full(team,r.cap||size);busy=false;return}
    var voted=load(VKEY,{});voted[k]=nowMs();save(VKEY,voted);rememberName(name,team);
    var v={id:KIOSK+"-"+Date.now()+"-"+Math.random().toString(36).slice(2,7),ts:new Date(nowMs()).toISOString(),kiosk:KIOSK,name:name,team:team,size:size,theme:theme,key:k,ua:navigator.userAgent};
    var q=load(QKEY,[]);q.push(v);save(QKEY,q);flush();busy=false;go("thanks");$("#tbars").innerHTML="";$("#tnote").textContent="…";setTimeout(showTally,900);});
});
document.addEventListener("click",function(e){var g=e.target.closest('[data-go="vote"]');if(g)fetchNames()});setTimeout(function(){fetchNames(true)},2500);
var TKEY="sevina.tally.v1";
function tallyEls(bars,noteEl){return {bars:bars||$("#tbars"),note:noteEl||$("#tnote")}}
function drawTally(t,note,bars,noteEl,noQueue,only){var el=tallyEls(bars,noteEl);
  // keyed on topic TEXT: current topics first, then any other topic that already has votes
  var names=(only||TOPICS).slice(),w=weekKey(),k0;if(!only&&t)for(k0 in t)if(t[k0]>0&&topicIdx(names,k0)<0)names.push(k0);
  var q=noQueue?[]:load(QKEY,[]).filter(function(v){return weekKey(Date.parse(v.ts))===w});var c={};names.forEach(function(n){c[n]=(t&&t[n])||0});q.forEach(function(v){var i=topicIdx(names,v.theme);if(i<0){names.push(v.theme);c[v.theme]=0;i=names.length-1}c[names[i]]++});
  var tot=names.reduce(function(a,n){return a+c[n]},0),mx=Math.max.apply(null,names.map(function(n){return c[n]}));
  if(el.bars) el.bars.innerHTML=names.map(function(n){var pc=tot?Math.round(c[n]*100/tot):0;return '<div class="tb'+(c[n]===mx&&mx>0?' lead':'')+'" data-theme="'+escH(n)+'"><div class="bl"><span>'+escH(n)+'</span><b>'+c[n]+' · '+pc+'%</b></div><div class="bt"><i style="width:'+pc+'%"></i></div></div>'}).join("");
  if(el.note) el.note.textContent=note||"";}
function showTally(bars,noteEl){var el=tallyEls(bars,noteEl);var cache=load(TKEY,null);if(cache&&cache.week&&cache.week!==weekKey())cache={t:{},week:weekKey()};
  if(el.bars) el.bars.innerHTML="";if(el.note) el.note.textContent="Зареждане на резултатите…";
  var off=function(){if(cache)drawTally(cache.t,"Последни известни резултати – ще се обновят след връзка с интернет.",el.bars,el.note);else{if(el.bars)el.bars.innerHTML="";if(el.note)el.note.textContent="Резултатите ще се покажат след връзка с интернет."}};
  if(!URL_){off();return}
  var got=false,attempts=0,ms=C.TALLY_TIMEOUT_MS||12000;
  function apply(j){if(!j||!j.ok||!j.tallies)return false;got=true;if(j.topics)setTopics(j.topics,"sheet");save(TKEY,{t:j.tallies,at:Date.now(),week:j.week||weekKey(),last:j.last||null});
    if(!j.open&&!j.total&&j.last&&j.last.results&&j.last.results.length){drawLast(j.last,el);return true}
    drawTally(j.tallies,"",el.bars,el.note);return true}
  function failOrRetry(){if(got)return;if(attempts<2){doFetch();return}off()}
  function doFetch(){attempts++;var url=URL_+(URL_.indexOf("?")<0?"?":"&")+"tally=1&_="+Date.now();
    var settled=false,to=setTimeout(function(){if(settled||got)return;settled=true;failOrRetry()},ms);
    fetch(url).then(function(r){return r.json()}).then(function(j){clearTimeout(to);
      if(apply(j)){settled=true;return}
      if(!settled){settled=true;failOrRetry()}
    }).catch(function(){clearTimeout(to);if(got||settled)return;settled=true;failOrRetry()})}
  doFetch();}
function showClosedTally(){showTally($("#vtbars"),$("#vtnote"))}
// After Monday's archive the live tally is reset; while voting is closed show the last round instead.
function drawLast(L,el){var t={},names=[];L.results.forEach(function(r){names.push(r.t);t[r.t]=+r.votes||0});
  var p=String(L.date||"").split("-"),dm=p.length===3?p[2]+"."+p[1]:"";
  drawTally(t,"Резултати от последното гласуване"+(dm?" (уикенд "+dm+")":"")+(L.winner?" – печели „"+L.winner+"“ 🏆":"")+". Новото гласуване започва в петък от 16:00.",el.bars,el.note,true,names)}
window.__showTally=showTally;
function dup(name,team){$("#eform").textContent="Вече има глас от „"+name+"“ от отбор „"+team+"“ този уикенд. Всеки гласува само веднъж през уикенда – благодарим! 🙂";toast("Този човек вече е гласувал 🙂")}
function full(team,n){$("#eform").textContent=n===1?"Отбор „"+team+"“ вече е подал своя 1 глас този уикенд 🙂":"Отбор „"+team+"“ вече е подал всички "+n+" гласа този уикенд 🙂";toast("Отборът вече е гласувал изцяло 🙂")}
var tT;function toast(m){var t=$("#toast");t.textContent=m;t.classList.add("show");clearTimeout(tT);tT=setTimeout(function(){t.classList.remove("show")},3500)}

/* ---------- season standings ---------- */
var SKEY_ST="sevina.standings.v1";
var F1_POINTS=[25,18,15,12,10,8,6,4,3,2]; // 11th+ = 1; change this array to adjust the table
function f1Pts(place){place=+place||0;if(place<1)return 0;return place<=F1_POINTS.length?F1_POINTS[place-1]:1}
function f1Blurb(){return "Точки по място: "+F1_POINTS.join(", ")+", от 11-о → 1."}
var STAND=null;          // "friday" | "saturday"
var STAND_VIEW="home";   // home | list | team | night
var STAND_TEAM=null;
var STAND_NIGHT=null;
var POD_COL={1:"#FFD54F",2:"#d9dde6",3:"#e09a5a"};
var BG_MONTHS=["януари","февруари","март","април","май","юни","юли","август","септември","октомври","ноември","декември"];
function ruleText(kind,data){
  if(kind==="friday"){
    var n=(data&&data.bestOf)||20;
    return "Броят се най-добрите "+n+" петъка · избери отбор за повече информация";
  }
  return "Избери отбор за повече информация";
}
function fmtPts(n){return (Math.round((+n||0)*10)/10)+" т."}
function fmtScore(v){if(v==null||v==="")return "—";var n=+v;return isNaN(n)?"—":String(Math.round(n*10)/10)}
function fmtPen(v){var n=+v||0;if(!n)return "—";return (n<0?"−":"+")+Math.abs(n)}
function fmtSofiaDate(iso){
  var m=/^(\d{4})-(\d{2})-(\d{2})/.exec(iso||"");
  if(!m) return iso||"";
  return parseInt(m[3],10)+" "+BG_MONTHS[parseInt(m[2],10)-1];
}
function nightTheme(n){
  if(!n) return "";
  if(n.theme) return String(n.theme).trim();
  var t=String(n.label||"");
  t=t.replace(/\(?\s*MEGA\s*1st\s*\)?/ig,"");
  t=t.replace(/^\s*\d{1,2}(\.\d{1,2}(\.\d{2,4})?|\s+[а-яА-Я]+\.?)?\s*/,"");
  t=t.replace(/^[\s\-–—·:|,]+/,"").replace(/[\s\-–—·:|,]+$/,"");
  return t.trim();
}
function fmtNightTitle(n){
  if(!n) return "Вечер";
  var d=n.date?fmtSofiaDate(n.date):"";
  var themed=(n.type==="themed")||(STAND==="friday");
  if(themed){var th=nightTheme(n); if(d&&th) return d+" · "+th; if(th) return th;}
  if(d) return d;
  return String(n.label||"").replace(/\(?\s*MEGA\s*1st\s*\)?/ig,"").trim()||"Вечер";
}
function nightKey(n){return (n&&(n.date||n.label))||""}
function playedLabel(kind,n){
  n=+n||0;
  if(kind==="friday") return n===1?"1 петък":n+" петъка";
  return n===1?"1 събота":n+" съботи";
}
function kindTitle(kind){return kind==="friday"?"Петък – тематични":"Събота – обща култура"}
function fillStandBlurbs(){
  var cache=load(SKEY_ST,null), n=(cache&&cache.friday&&cache.friday.bestOf)||20;
  var f=$("#sblurb-fri"), s=$("#sblurb-sat");
  /* blurbs are static intro text now (16.11) */

}
function standPanel(which){
  ["home","list","team","night"].forEach(function(k){
    var el=$("#stand-"+k);
    if(el) el.hidden=(k!==which);
  });
  var box=$("#stand-"+which);
  var sc=box&&$(".vscroll",box);
  if(sc) sc.scrollTop=0;
}
function standCache(){return load(SKEY_ST,null)}
function standData(kind){var c=standCache();return c&&c[kind]}
function findTeam(kind,name){
  var rows=(standData(kind)&&standData(kind).rows)||[];
  var k=key(name);
  for(var i=0;i<rows.length;i++) if(key(rows[i].team)===k) return rows[i];
  return null;
}
function findNight(kind,nk){
  var data=standData(kind), nights=(data&&data.nights)||[];
  var i,n;
  for(i=0;i<nights.length;i++) if(nightKey(nights[i])===nk) return nights[i];
  var rows=(data&&data.rows)||[], results=[], label="", date="";
  rows.forEach(function(r){
    (r.nights||[]).forEach(function(x){
      if(nightKey(x)!==nk) return;
      label=x.label||label; date=x.date||date;
      if(x.absent) return;
      results.push({team:r.team, raw:x.raw, penalty:x.penalty, final:x.final, place:x.nightPlace||0, points:x.score});
    });
  });
  if(!results.length&&!label&&!date) return null;
  results.sort(function(a,b){return (a.place||99)-(b.place||99)||a.team.localeCompare(b.team,"bg")});
  return {date:date, label:label, type:kind==="friday"?"themed":"gk", results:results};
}

function showStandHome(){
  STAND=null; STAND_VIEW="home"; STAND_TEAM=null; STAND_NIGHT=null;
  standPanel("home");
  var title=$("#stand-title"), b=$("#sback");
  if(title) title.textContent="Сезонно класиране";
  if(b){b.setAttribute("data-go","home");b.textContent="← Начало"}
  fillStandBlurbs();
}
function showStandList(kind){
  STAND=kind; STAND_VIEW="list"; STAND_TEAM=null; STAND_NIGHT=null;
  standPanel("list");
  var title=$("#stand-title"), b=$("#sback");
  if(title) title.textContent=kindTitle(kind);
  if(b){b.removeAttribute("data-go");b.textContent="← Назад"}
  drawStandList(kind);
}
function drawStandList(kind){
  var data=standData(kind), list=$("#slist"), rule=$("#srule"), note=$("#snote");
  if(rule){rule.textContent=ruleText(kind,data);rule.hidden=!rule.textContent;}
  if(!list) return;
  if(!data||!data.rows||!data.rows.length){
    list.innerHTML='<div class="sempty">Още няма класиране за този сезон. Точките влизат след първата вечер.</div>';
    if(note) note.textContent="";
    return;
  }
  list.innerHTML=data.rows.map(function(r){
    var place=+r.place||0;
    var played=r.played!=null?r.played:(r.nights||[]).filter(function(n){return !n.absent}).length;
    var top=place>=1&&place<=3;
    var col=top?(' style="--c:'+POD_COL[place]+'"'):"";
    return '<button type="button" class="srow'+(top?" pod":"")+'"'+col+' data-stand-team="'+escH(r.team)+'"><div class="sleft"><span class="srank">'+place+'</span><div class="sname-blk"><b>'+escH(r.team)+'</b><span class="splayed">'+escH(playedLabel(kind,played))+'</span></div></div><span class="stotal">'+fmtPts(r.total)+'</span></button>';
  }).join("");
  if(note) note.textContent=standCache()&&standCache().offline?"Последни известни резултати – ще се обновят след връзка с интернет.":"";
}
function showStandTeam(team){
  STAND_VIEW="team"; STAND_TEAM=team; STAND_NIGHT=null;
  standPanel("team");
  var title=$("#stand-title"), b=$("#sback");
  if(title) title.textContent=team;
  if(b){b.removeAttribute("data-go");b.textContent="← Назад"}
  drawStandTeam();
}
function drawStandTeam(){
  var kind=STAND, row=findTeam(kind,STAND_TEAM), list=$("#stteams"), rule=$("#trule");
  if(rule){
    if(!row) rule.textContent="";
    else rule.textContent="Избери вечер за пълен резултат";
  }
  if(!list) return;
  var nights=row&&row.nights||[];
  if(!nights.length){
    list.innerHTML='<div class="sempty">Няма записани вечери за този отбор.</div>';
    return;
  }
  list.innerHTML=nights.map(function(n){
    var dropped=!!n.dropped, abs=!!n.absent;
    var cls="srow snight"+(dropped||abs?" dim":"");
    var body;
    if(abs) body="Отсъствие";
    else {
      var bits=[];
      if(n.final!=null&&n.final!=="") bits.push("Финал "+fmtScore(n.final));
      if(n.nightPlace) bits.push(n.nightPlace+" място");
      if(dropped) bits.push("не влиза");
      body=bits.join(" · ");
    }
    return '<button type="button" class="'+cls+'" data-stand-night="'+escH(nightKey(n))+'"><div class="sname-blk"><b>'+escH(fmtNightTitle(n))+'</b><span class="splayed">'+escH(body)+'</span></div><span class="stotal">'+(abs?"0 т.":fmtPts(n.score))+'</span></button>';
  }).join("");
}
function showStandNight(nk){
  STAND_VIEW="night"; STAND_NIGHT=nk;
  standPanel("night");
  var n=findNight(STAND,nk);
  var title=$("#stand-title"), b=$("#sback");
  if(title) title.textContent=n?fmtNightTitle(n):"Протокол";
  if(b){b.removeAttribute("data-go");b.textContent="← Назад"}
  drawStandNight();
}
function drawStandNight(){
  var n=findNight(STAND,STAND_NIGHT), list=$("#stnight"), rule=$("#nrule");
  if(rule) rule.textContent="Сума, наказание, финал, място и точки за сезона.";
  if(!list) return;
  var res=n&&n.results||[];
  if(!res.length){
    list.innerHTML='<div class="sempty">Няма протокол за тази вечер.</div>';
    return;
  }
  list.innerHTML=res.map(function(r){
    var place=+r.place||0;
    var top=place>=1&&place<=3;
    var col=top?(' style="--c:'+POD_COL[place]+'"'):"";
    var pen=fmtPen(r.penalty);
    var bits="Сума "+fmtScore(r.raw)+(pen!=="—"?" · Наказ. "+pen:"")+" · Финал "+fmtScore(r.final!=null&&r.final!==""?r.final:r.raw);
    return '<div class="srow'+(top?" pod":"")+'"'+col+'><div class="sleft"><span class="srank">'+place+'</span><div class="sname-blk"><b>'+escH(r.team)+'</b><span class="splayed">'+escH(bits)+'</span></div></div><span class="stotal">'+fmtPts(r.points)+'</span></div>';
  }).join("");
}
function redrawStand(){
  if(STAND_VIEW==="list"&&STAND) drawStandList(STAND);
  else if(STAND_VIEW==="team"&&STAND_TEAM) drawStandTeam();
  else if(STAND_VIEW==="night"&&STAND_NIGHT) drawStandNight();
  fillStandBlurbs();
}

function fetchStandings(force){
  var cache=standCache();
  fillStandBlurbs();
  redrawStand();
  if(!URL_||!navigator.onLine){if(cache){cache.offline=true;save(SKEY_ST,cache);fillStandBlurbs();redrawStand()} return}
  if(!force&&cache&&Date.now()-(cache.at||0)<60000) return;
  var url=URL_+(URL_.indexOf("?")<0?"?":"&")+"standings=1&_="+Date.now();
  tfetch(url,{method:"GET"},C.TALLY_TIMEOUT_MS||12000).then(function(r){return r.json()}).then(function(j){
    if(!j||!j.ok) return;
    save(SKEY_ST,{at:Date.now(),friday:j.friday||{rows:[]},saturday:j.saturday||{rows:[]}});
    fillStandBlurbs();
    redrawStand();
  }).catch(function(){if(cache){cache.offline=true;save(SKEY_ST,cache);fillStandBlurbs();redrawStand()}});
}
$$(".sbtn").forEach(function(b){b.addEventListener("click",function(){showStandList(b.dataset.stand)})});
$("#sback").addEventListener("click",function(e){
  if(STAND_VIEW==="night"){e.preventDefault();e.stopPropagation();showStandTeam(STAND_TEAM);arm();return}
  if(STAND_VIEW==="team"){e.preventDefault();e.stopPropagation();showStandList(STAND);arm();return}
  if(STAND_VIEW==="list"){e.preventDefault();e.stopPropagation();showStandHome();arm()}
});
var standRoot=$("#klasirane");
if(standRoot) standRoot.addEventListener("click",function(e){
  var t=e.target.closest("[data-stand-team]");
  if(t){showStandTeam(t.getAttribute("data-stand-team"));return}
  var n=e.target.closest("[data-stand-night]");
  if(n){showStandNight(n.getAttribute("data-stand-night"))}
});
document.addEventListener("click",function(e){if(e.target.closest('[data-go="klasirane"]')){showStandHome();fetchStandings(true)}});
setTimeout(function(){fetchStandings(true)},2800);
showStandHome();
window.__standings={draw:showStandList,home:showStandHome,team:showStandTeam,night:showStandNight,fetch:fetchStandings,get tab(){return STAND},get view(){return STAND_VIEW}};

/* ---------- seating (v19 map; team buttons in the courtyard) ---------- */
(function(){
  var D=window.SEATING||{}, teams=[];
  var place=$("#splace"), map=$("#smap"), sex=$("#sex"), curSvg=null;
  var seats=[];
  function readTeams(){teams=(D.teams||[]).filter(function(t){return t&&norm(t.name)});if(sex)sex.hidden=!D.example;
    // buttons: from the sheet = one per table/merged group (sheet order); from seating.js = one per team
    seats=(D.seats&&D.seats.length?D.seats:teams).filter(function(t){return t&&norm(t.name)})}
  readTeams();
  var mapUrl=(D.layout&&(D.layout.map||D.layout.svg))||"map-v19.svg";
  var hi=null;
  var MAX_TEAMS=16, COLS=2, ROWS=8;
  // Courtyard to the right of the hall, below Entrance 2 (SVG canvas units, 1600×1880)
  var BOX={x:977.4,y:854,w:520.6,h:872.8};
  function tableIds(t){
    if(!t) return [];
    var ids=t.tables&&t.tables.length?t.tables:t.table?[t.table]:[];
    // unknown ids (not on the map) are dropped safely
    return ids.map(function(x){return norm(String(x)).toUpperCase().replace(/^Т/,"T")}).filter(function(x){return /^T\d{1,2}$/.test(x)&&(!curSvg||map.querySelector('[data-table="'+x+'"],#'+x))});
  }
  function set(n){
    hi=n;
    var root=$("#seating");
    if(root) root.classList.toggle("picked",!!n);
    if(map) map.classList.toggle("dim",!!n);
    $$("#seating [data-team]").forEach(function(x){x.classList.toggle("hi",x.dataset.team===n)});
    var ids=[];
    if(n) seats.concat(teams).forEach(function(x){if(x.name===n)tableIds(x).forEach(function(id){if(ids.indexOf(id)<0)ids.push(id)})});
    $$("#smap .table").forEach(function(el){
      var id=el.getAttribute("data-table")||el.id;
      el.classList.toggle("hi", ids.indexOf(id)>=0);
    });
  }
  function showPlace(){
    if(place) place.hidden=false;
    if(map) map.hidden=true;
  }
  function wrapName(name, maxW, fontSize){
    var words=String(name).split(/\s+/).filter(Boolean);
    var lines=[], line="";
    var avg=fontSize*0.58;
    function width(s){return s.length*avg}
    words.forEach(function(w){
      var trial=line?line+" "+w:w;
      if(line&&width(trial)>maxW){lines.push(line);line=w;}
      else line=trial;
    });
    if(line) lines.push(line);
    if(lines.length>2){
      var keep=lines.slice(0,2);
      var last=keep[1];
      if(last.length>10) keep[1]=last.replace(/…$/,"").slice(0,Math.max(8,last.length-2))+"…";
      return keep;
    }
    return lines.length?lines:[name];
  }
  // darkfix: old Android WebViews (e.g. 105) with force-dark invert dark SVG
  // fills to near-white, but leave HTML backgrounds alone. So dark fills are
  // painted by HTML <div>s in <foreignObject>s; the SVG shape keeps its stroke.
  function htmlBox(ns, x, y, w, h, rx, color, cls){
    var fo=document.createElementNS(ns,"foreignObject");
    fo.setAttribute("x", x); fo.setAttribute("y", y);
    fo.setAttribute("width", w); fo.setAttribute("height", h);
    fo.setAttribute("class","hfill");
    var d=document.createElementNS("http://www.w3.org/1999/xhtml","div");
    if(cls) d.className=cls;
    d.style.cssText="width:100%;height:100%;border-radius:"+(+rx||0)+"px"+(color?";background:"+color:"");
    fo.appendChild(d);
    return fo;
  }
  function isDark(c){
    var m=/^#([0-9a-f]{6})$/i.exec(c||""); if(!m) return false;
    var n=parseInt(m[1],16), r=n>>16, g=(n>>8)&255, b=n&255;
    return (0.299*r+0.587*g+0.114*b)<140;
  }
  function htmlFills(svg){
    var ns=svg.namespaceURI;
    Array.prototype.slice.call(svg.querySelectorAll("rect")).forEach(function(r){
      var f=r.getAttribute("fill");
      if(!isDark(f)||r.closest(".table")||r.closest("clipPath")||r.getAttribute("transform")) return;
      var a=function(k){return r.getAttribute(k)||"0"};
      r.parentNode.insertBefore(htmlBox(ns, a("x"), a("y"), a("width"), a("height"), r.getAttribute("rx"), f), r);
      r.setAttribute("fill","none");
    });
  }
  function renderButtons(svg){
    var old=svg.querySelector("#team-btns");
    if(old) old.remove();
    var shown=seats.slice(0,MAX_TEAMS);
    if(!shown.length) return;
    var ns=svg.namespaceURI;
    var g=document.createElementNS(ns,"g");
    g.setAttribute("id","team-btns");
    var gapX=16, gapY=14;
    var cols=COLS, rows=ROWS;
    var bw=(BOX.w-(cols-1)*gapX)/cols;
    var bh=(BOX.h-(rows-1)*gapY)/rows;
    var n=shown.length;
    var usedRows=Math.min(rows, Math.ceil(n/cols));
    // pack from the top of the courtyard, sized for 8 rows so 16 teams always fit
    shown.forEach(function(t,i){
      var col=i%cols, row=Math.floor(i/cols);
      var x=BOX.x+col*(bw+gapX), y=BOX.y+row*(bh+gapY);
      var btn=document.createElementNS(ns,"g");
      btn.setAttribute("class","team-btn");
      btn.setAttribute("data-team", t.name);
      var tids=tableIds(t); if(tids.length) btn.setAttribute("data-tables", tids.join("+"));
      var rect=document.createElementNS(ns,"rect");
      rect.setAttribute("class","team-btn-bg");
      rect.setAttribute("x", x.toFixed(1));
      rect.setAttribute("y", y.toFixed(1));
      rect.setAttribute("width", bw.toFixed(1));
      rect.setAttribute("height", bh.toFixed(1));
      rect.setAttribute("rx", "18");
      btn.appendChild(htmlBox(ns, x, y, bw, bh, 18, null, "team-btn-fill"));
      btn.appendChild(rect);
      var pad=14, font=Math.max(28, Math.min(42, bh*0.34));
      var lines=wrapName(t.name, bw-pad*2, font);
      if(lines.length>1) font=Math.max(26, font*0.9);
      var lineH=font*1.15;
      var startY=y+bh/2-((lines.length-1)*lineH)/2+font*0.35;
      lines.forEach(function(ln,li){
        var text=document.createElementNS(ns,"text");
        text.setAttribute("class","team-btn-label");
        text.setAttribute("x", (x+bw/2).toFixed(1));
        text.setAttribute("y", (startY+li*lineH).toFixed(1));
        text.setAttribute("text-anchor","middle");
        text.setAttribute("font-size", font.toFixed(1));
        text.textContent=ln;
        btn.appendChild(text);
      });
      g.appendChild(btn);
    });
    svg.appendChild(g);
  }
  function mountMap(svgText){
    if(place) place.hidden=true;
    if(!map) return;
    map.hidden=false;
    map.innerHTML=svgText;
    var svg=map.querySelector("svg");curSvg=svg;
    if(svg){ try{ htmlFills(svg); }catch(e){} }
    tagTables();
  }
  function tagTables(){
    var by={};
    seats.forEach(function(t){tableIds(t).forEach(function(id){if(!by[id])by[id]=t.name})});
    $$("#smap .table").forEach(function(el){
      var id=el.getAttribute("data-table")||el.id;
      var name=by[id];
      if(name) el.setAttribute("data-team", name); else el.removeAttribute("data-team");
    });
    if(curSvg) renderButtons(curSvg);
    if(hi&&!seats.some(function(x){return x.name===hi})) hi=null;
    set(hi);
  }
  function loadMap(){
    var url=mapUrl+(mapUrl.indexOf("?")>=0?"&":"?")+"v=tonightonly";
    fetch(url,{cache:"reload"}).then(function(r){if(!r.ok)throw new Error("map");return r.text()})
      .then(function(txt){if(txt&&txt.indexOf("<svg")>=0) mountMap(txt); else showPlace();})
      .catch(function(){showPlace()});
  }
  if(D.layout===null) showPlace(); else loadMap();
  var seatEl=document.getElementById("seating");
  if(seatEl) seatEl.addEventListener("click",function(e){
    var t=e.target.closest("[data-team]");
    if(t){set(hi===t.dataset.team?null:t.dataset.team);return}
    // Unassigned table: clear the current highlight; ignore empty floor taps
    if(hi&&e.target.closest("#smap .table")) set(null);
  });
  window.__seating={set:set,reset:function(){set(null)},refresh:function(){readTeams();tagTables()},get teams(){return teams},get seats(){return seats}};
})();

/* ---------- remote config: topics + seating from the sheet (?config=1), polled ---------- */
var SEATKEY="sevina.seating.v1",SEAT_SRC=BUILTIN.nights?"seating.js":"няма",SEAT_AT=null,pendingSeat=null,CFG_ERR="";
function seatOk(s){return s&&s.source==="sheet"&&s.nights&&s.nights.length&&s.week}
function applySeating(s,src){
  if(!seatOk(s))return false;
  if(s.week<weekKey())return false;                       // stale (older weekend) → ignore
  var nights=s.nights.map(function(n){var o={date:String(n.date||""),type:n.type==="themed"?"themed":"gk",label:norm(n.label||n.date||""),
      teams:(n.teams||[]).filter(function(t){return t&&norm(t.name)}).map(function(t){var x={name:norm(String(t.name)).slice(0,50),size:Math.max(1,parseInt(t.size,10)||1)};
        if(t.tables&&t.tables.length)x.tables=t.tables.map(String);else if(t.table)x.table=String(t.table);return x})};
    // seats = one seating button per table / merged group, in the sheet's row order
    if(n.seats&&n.seats.length)o.seats=n.seats.filter(function(t){return t&&norm(t.name)}).map(function(t){return {name:norm(String(t.name)).slice(0,50),tables:(t.tables||[]).map(String)}});
    var th=norm(n.theme||"");
    if(!th)(BUILTIN.nights||[]).forEach(function(b){if(b&&b.date===o.date&&b.theme)th=b.theme});   // theme fallback: seating.js
    if(th)o.theme=th;return o});
  var sig=JSON.stringify(nights);
  SEAT_SRC=src;SEAT_AT=new Date();
  if(src!=="кеш")save(SEATKEY,{week:s.week,nights:nights,at:Date.now(),source:"sheet"});
  if(sig===JSON.stringify(D0.nights)&&D0.example===false)return false;
  if(cur==="vote"&&!form.hidden){pendingSeat={s:s,src:src};return false}
  D0.nights=nights;D0.example=false;pendingSeat=null;
  pickNights();buildTeams();renderTeamList();fillKakvo();
  if(teamSel&&!TEAM_BY[key(teamSel)])setTeam("");
  if(window.__seating&&window.__seating.refresh)window.__seating.refresh();
  upd();return true}
window.__applyPending=function(){if(pendingTopics){var l=pendingTopics;pendingTopics=null;setTopics(l,TOPIC_SRC)}
  if(pendingSeat){var p=pendingSeat;pendingSeat=null;applySeating(p.s,p.src)}};
(function(){var c=load(SEATKEY,null);if(c&&c.week>=weekKey())applySeating({source:"sheet",week:c.week,nights:c.nights},"кеш")})();
var cfgBusy=false;
function markTopicsFailed(){if(TOPICS.length)return;TOPIC_SRC="грешка";renderTopics()}
function fetchConfig(){if(!URL_||cfgBusy)return;
  if(navigator.onLine===false){markTopicsFailed();return}
  cfgBusy=true;
  tfetch(URL_+(URL_.indexOf("?")<0?"?":"&")+"config=1&_="+Date.now(),{method:"GET"},C.TALLY_TIMEOUT_MS||12000).then(function(r){return r.json()}).then(function(j){
    CFG_ERR="";if(!j||!j.ok){CFG_ERR=(j&&j.error)||"грешка";markTopicsFailed();return}
    if(j.topics&&j.topics.source==="sheet")setTopics(j.topics.list,"таблица");
    if(j.seating)applySeating(j.seating,"таблица");
    if(!TOPICS.length)markTopicsFailed();
  }).catch(function(e){CFG_ERR=String(e&&e.message||e);markTopicsFailed()}).then(function(){cfgBusy=false})}
setTimeout(fetchConfig,1500);setInterval(fetchConfig,(C.CONFIG_POLL_SECONDS||60)*1000);
addEventListener("online",fetchConfig);document.addEventListener("visibilitychange",function(){if(!document.hidden)fetchConfig()});
window.__config={fetch:fetchConfig,applySeating:applySeating};

/* ---------- storage + backend ---------- */
function load(k,d){try{var v=JSON.parse(localStorage.getItem(k));return v==null?d:v}catch(e){return d}}
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
var status={last:"—",ok:null,lastOk:null,err:""};
function tfetch(u,o,ms){return new Promise(function(res,rej){var t=setTimeout(function(){rej(new Error("timeout"))},ms);fetch(u,o).then(function(r){clearTimeout(t);res(r)},function(e){clearTimeout(t);rej(e)})})}
function remoteCheck(k,team,size){var no={dup:false,full:false,closed:false};if(!URL_||!navigator.onLine)return Promise.resolve(no);
  var url=URL_+(URL_.indexOf("?")<0?"?":"&")+"check="+encodeURIComponent(k)+"&team="+encodeURIComponent(team)+"&size="+encodeURIComponent(size)+"&_="+Date.now();
  return tfetch(url,{method:"GET"},C.DUP_CHECK_TIMEOUT_MS||2500).then(function(r){return r.json()}).then(function(j){
    if(j&&j.reason==="closed") return {dup:false,full:false,closed:true};
    return {dup:!!(j&&j.duplicate),full:!!(j&&j.full),cap:j&&j.cap,closed:false};
  }).catch(function(){return no})}
var flushing=false;
function flush(){if(flushing||!URL_)return;var q=load(QKEY,[]);if(!q.length)return;flushing=true;var v=q[0];
  tfetch(URL_,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(v)},C.REQUEST_TIMEOUT_MS||15000)
    .then(function(r){return r.json()}).then(function(j){
      status.last=new Date();status.ok=!!(j&&(j.ok||j.reason==="closed"||j.duplicate||j.reason));
      if(j&&j.ok){status.lastOk=status.last;status.err="";q=load(QKEY,[]).filter(function(x){return x.id!==v.id});save(QKEY,q);save(SKEY,load(SKEY,0)+1)}
      else if(j&&(j.reason==="team_full"||j.duplicate||j.reason==="invalid"||j.reason==="closed")){
        var rj=load(RKEY,{});rj[j.reason]=(rj[j.reason]||0)+1;save(RKEY,rj);
        q=load(QKEY,[]).filter(function(x){return x.id!==v.id});save(QKEY,q);
        var vd=load(VKEY,{});delete vd[v.key];save(VKEY,vd);
        status.err=j.reason||j.error||"";
      }else status.err=(j&&(j.error||j.reason))||"unknown";
    }).catch(function(e){status.last=new Date();status.ok=false;status.err=String(e&&e.message||e)})
    .then(function(){flushing=false;if(load(QKEY,[]).length)setTimeout(flush,500)});
}
setInterval(flush,(C.RETRY_SECONDS||30)*1000); addEventListener("online",flush); setTimeout(flush,2000);

/* ---------- admin (hold brain logo 5s) ---------- */
var lp=null,adm=$("#admin");function adminOpen(){return !adm.hidden}
$$(".logo").forEach(function(l){l.addEventListener("pointerdown",function(){clearTimeout(lp);lp=setTimeout(openAdmin,5000/Math.min(SPEED,10))});["pointerup","pointerleave","pointercancel"].forEach(function(t){l.addEventListener(t,function(){clearTimeout(lp)})})});
function openAdmin(){adm.hidden=false;clearInterval(tick);renderAdmin()}
function fmt(d){return d&&d.toLocaleTimeString?d.toLocaleTimeString("bg-BG"):"—"}
function renderAdmin(){var q=load(QKEY,[]),rj=load(RKEY,{}),D=window.SEATING||{};
  $("#ainfo").innerHTML="<div>Киоск: <b>"+KIOSK+"</b></div>"+
    "<div>Уикенд: <b>"+weekKey()+"</b> (петък) · гласуване: <b>"+(voteOpen()?"отворено":"затворено")+"</b> (пт–сб 16:00–02:00) · карта: <b>"+escH(D.night||"—")+"</b> · отбори за гласуване: <b>"+TEAMS.length+"</b>"+(WEEK_OK?"":" · <b>⚠️ seating.js не е за този уикенд</b>")+"</div>"+
    "<div>Отхвърлени (пълен отбор): <b>"+(rj.team_full||0)+"</b>"+(rj.invalid?" · невалидни: <b>"+rj.invalid+"</b>":"")+(rj.closed?" · извън прозореца: <b>"+rj.closed+"</b>":"")+"</div>"+
    "<div>Гласове в опашката: <b>"+q.length+"</b></div><div>Изпратени от този киоск: <b>"+load(SKEY,0)+"</b></div>"+
    "<div>Бекенд: <b>"+(URL_?(status.ok===null?"още не е проверен":status.ok?"✅ OK":"⚠️ грешка"):"⚠️ няма зададен WEB_APP_URL")+"</b></div>"+
    "<div>Теми: <b>"+escH(TOPIC_SRC)+"</b> ("+TOPICS.length+")"+(TOPIC_AT?" · "+fmt(TOPIC_AT):"")+" · Места/резервации: <b>"+escH(SEAT_SRC)+"</b>"+(SEAT_AT?" · "+fmt(SEAT_AT):"")+(CFG_ERR?" · ⚠️ "+escH(CFG_ERR):"")+"</div>"+
    "<div>Мрежа: <b>"+(navigator.onLine?"онлайн":"офлайн")+"</b></div>"+
    "<div>Последен опит: "+fmt(status.last)+" · Последен успех: "+fmt(status.lastOk)+"</div>"+(status.err?"<div>Грешка: "+status.err.replace(/</g,"&lt;")+"</div>":"")}
$("#aflush").addEventListener("click",function(){flush();setTimeout(renderAdmin,1500)});
$("#areload").addEventListener("click",function(){location.reload()});
$("#aclose").addEventListener("click",function(){adm.hidden=true;arm()});
window.__admin={open:openAdmin,render:renderAdmin};
})();
