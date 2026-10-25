(function(){
var STAGES=[
 {rx:-20,ry:-32,ex:0,lid:0,sc:1,sa:1,tg:0,
  t:"Термостат на элементе Пельтье",
  p:["Прокручивайте страницу: она стоит на месте, а вращается само устройство.","Компактный сухоблочный термостат для небольшого числа биологических образцов: нагрев и охлаждение одним элементом Пельтье."],
  n:"Эскиз по курсовому проекту. Размеры и компоновка условные."},
 {rx:-3,ry:0,ex:0,lid:0,sc:1,sa:1,tg:0,
  t:"Вид спереди",
  p:["Дисплей показывает заданную и текущую температуру и время выдержки. Кнопки: SET, ▲, ▼, START. Светодиод «Работа».","Внизу вентиляционные прорези: воздух подходит к радиатору.","Кнопки рабочие. SET выбирает режим из методик (37 °C на 24 ч и другие), ▲ и ▼ меняют заданную температуру на 1 °C, ▶ запускает и останавливает."],n:"Время ускорено: 1 с — это 1 мин нагрева или 30 мин выдержки."},
 {rx:-3,ry:-90,ex:0,lid:0,sc:1,sa:.3,tg:0,
  t:"Вид сбоку, на просвет",
  p:["Крышка откидывается на петле сзади.","Внутри слоями сверху вниз: термоблок, элемент Пельтье, радиатор. Сзади вентилятор, внизу плата управления."]},
 {rx:-88,ry:0,ex:0,lid:108,sc:1,sa:1,tg:0,
  t:"Вид сверху, крышка поднята",
  p:["В термоблоке шесть гнёзд (2×3) под пробирки 1,5 мл.","Между гнёздами в центре стоит датчик Pt100: он измеряет температуру самого блока."]},
 {rx:-24,ry:-38,ex:1,lid:0,sc:.6,sa:.18,tg:1,
  t:"Комплектующие по слоям",
  p:["Устройство разобрано по высоте. Номера на схеме:","1 крышка · 2 термоблок · 3 датчик Pt100 · 4 элемент Пельтье · 5 радиатор · 6 вентилятор · 7 плата STM32 + H-мост + MAX31865."]},
 {rx:-16,ry:28,ex:0,lid:0,sc:.95,sa:.3,tg:0,
  t:"Как это работает",
  p:["STM32F103C8 читает Pt100 через MAX31865, считает ПИД-регулятор и выдаёт ШИМ.","H-мост меняет направление тока через элемент Пельтье: блок нагревается или охлаждается. Вентилятор отводит тепло с радиатора."]}
];
var KEYS=["rx","ry","ex","lid","sc","sa","tg"], N=STAGES.length;
var root=document.getElementById("root"), k=2.5, pw=[], lidW=null, cur=0, tgt=0, shown=-1;

/* Размеры в мм; y вверх, z к зрителю. Центр устройства сдвигается на CY. */
var CY=48;
var PARTS=[
 {id:"body",shell:1,w:180,h:85,d:130,pos:[0,42.5,0],ex:[0,0]},
 {id:"block",n:2,name:"Термоблок Al",w:75,h:30,d:50,pos:[0,70,-5],ex:[75,0],c:"var(--alu)"},
 {id:"pt",n:3,name:"Датчик Pt100",w:3,h:32,d:3,pos:[0,71,-5],ex:[75,0],c:"var(--accent)",to:[46,-26]},
 {id:"pelt",n:4,name:"Элемент Пельтье",w:40,h:5,d:40,pos:[0,52.5,-5],ex:[46,0],c:"var(--cer)"},
 {id:"sink",n:5,name:"Радиатор",w:50,h:28,d:50,pos:[0,36,-5],ex:[18,0],c:"var(--sink)"},
 {id:"fan",n:6,name:"Вентилятор",w:40,h:32,d:22,pos:[0,36,-46],ex:[-4,-62],c:"var(--fan)"},
 {id:"pcb",n:7,name:"Плата STM32 + H-мост + MAX31865",w:100,h:3,d:60,pos:[0,8,21],ex:[-46,0],c:"var(--pcb)"}
];

function box(w,h,d,cls,fc,col){
  var W=w*k,H=h*k,D=d*k,b=document.createElement("div");
  b.className="box "+(cls||"");
  if(col)b.style.setProperty("--c",col);
  [["f",W,H,"translateZ("+D/2+"px)"],["b",W,H,"rotateY(180deg) translateZ("+D/2+"px)"],
   ["r",D,H,"rotateY(90deg) translateZ("+W/2+"px)"],["l",D,H,"rotateY(-90deg) translateZ("+W/2+"px)"],
   ["t",W,D,"rotateX(90deg) translateZ("+H/2+"px)"],["u",W,D,"rotateX(-90deg) translateZ("+H/2+"px)"]
  ].forEach(function(f){
    var e=document.createElement("div");e.className="face "+f[0];
    e.style.cssText="width:"+f[1]+"px;height:"+f[2]+"px;margin:"+(-f[2]/2)+"px 0 0 "+(-f[1]/2)+"px;transform:"+f[3];
    if(fc&&fc[f[0]])e.innerHTML=fc[f[0]];
    b.appendChild(e);
  });
  return b;
}
function pc(a,b){return a/b*100+"%"}
function slits(dir,gap){
  var g=gap*k;
  return "repeating-linear-gradient("+dir+",rgb(var(--ink-rgb)/.75) 0 1px,transparent 1px "+g+"px)";
}
function bodyFaces(){
  var f=11*k;
  var front='<div class="lcd" data-lcd="1" style="left:9%;top:36%;width:39%;height:33%;font-size:'+4.4*k+'px"></div>'
   +'<div class="dot led" data-led="1" style="left:53%;top:42%;width:'+4.8*k+'px;height:'+4.8*k+'px;background:var(--accent);border-color:var(--accent)"></div>'
   +[["SET",58,"set"],["▲",67,"up"],["▼",76,"down"],["▶",85,"go"]].map(function(b){return '<div class="dot btn" data-act="'+b[2]+'" style="left:'+b[1]+'%;top:62%;width:'+10.4*k+'px;height:'+10.4*k+'px;font-size:'+3.6*k+'px">'+b[0]+'</div>'}).join("")
   +'<div class="vent" style="left:10%;top:80%;width:80%;height:14%;background:'+slits("180deg",4.2)+'"></div>';
  var sideR='<div class="vent" style="left:68%;top:22%;width:24%;height:40%;background:'+slits("90deg",4.2)+'"></div>';
  var sideL='<div class="vent" style="left:8%;top:22%;width:24%;height:40%;background:'+slits("90deg",4.2)+'"></div>';
  var top='<div class="vent" style="left:24.4%;top:21.5%;width:51%;height:49%;border:1px solid rgb(var(--ink-rgb)/.6);background:repeating-linear-gradient(45deg,rgb(var(--ink-rgb)/.25) 0 1px,transparent 1px '+3*k+'px)"></div>';
  var back='<div class="dot" style="left:30%;top:50%;width:'+30*k+'px;height:'+30*k+'px;background:repeating-radial-gradient(circle,rgb(var(--ink-rgb)/.6) 0 1px,transparent 1px '+3*k+'px)"></div>'
   +'<div class="dot" style="left:82%;top:30%;width:'+11*k+'px;height:'+11*k+'px"></div>';
  return {f:front,r:sideR,l:sideL,t:top,b:back};
}
function blockFaces(){
  var wells="",pos=[[23,26],[50,26],[77,26],[23,74],[50,74],[77,74]];
  pos.forEach(function(p){wells+='<div class="dot" style="left:'+p[0]+'%;top:'+p[1]+'%;width:'+11.5*k+'px;height:'+11.5*k+'px;background:radial-gradient(circle,rgb(var(--ink-rgb)/.5),rgb(var(--ink-rgb)/.15))"></div>'});
  wells+='<div class="dot" style="left:50%;top:50%;width:'+4*k+'px;height:'+4*k+'px;background:var(--accent);border-color:var(--accent)"></div>';
  return {t:wells};
}
function finBg(){return {f:"",b:"",r:"",l:""}}
function build(){
  var wide=innerWidth>800;
  k=Math.min(innerWidth*(wide?.5:.62),innerHeight*(wide?.62:.46))/200;
  root.innerHTML="";pw=[];
  PARTS.forEach(function(p){
    var w=document.createElement("div");w.className="part";
    var fc=null,col=p.c;
    if(p.id==="body")fc=bodyFaces();
    if(p.id==="block")fc=blockFaces();
    var b=box(p.w,p.h,p.d,p.shell?"shell":"",fc,col);
    if(p.id==="sink"){b.querySelectorAll(".f,.b,.l,.r").forEach(function(e){e.style.background="repeating-linear-gradient(90deg,var(--sink) 0 "+2*k+"px,var(--fin) "+2*k+"px "+3.6*k+"px)"})}
    if(p.id==="fan"){b.querySelector(".f").style.background="repeating-radial-gradient(circle,#555 0 "+2*k+"px,var(--fan) "+2*k+"px "+4*k+"px)"}
    w.appendChild(b);
    var rec={p:p,w:w,b:b,tag:null};
    if(p.n){
      var t=document.createElement("div");t.className="tag";t.innerHTML="<i>"+p.n+"</i><span>"+p.name+"</span>";
      w.appendChild(t);rec.tag=t;
    }
    root.appendChild(w);pw.push(rec);
  });
  /* крышка: шарнир сзади, глубина z = -45 */
  var lw=document.createElement("div");lw.className="part";
  var inner=document.createElement("div");inner.className="part";
  var lb=box(110,24,80,"",{},"var(--lid)");
  lb.style.transform="translate3d(0,"+(-12*k)+"px,"+40*k+"px)";
  lw.appendChild(lb);
  var lt=document.createElement("div");lt.className="tag";lt.innerHTML="<i>1</i><span>Крышка</span>";
  lw.appendChild(lt);
  root.appendChild(lw);lidW={w:lw,tag:lt};
}
function sm(x){return x*x*(3-2*x)}
function state(f){
  var i=Math.max(0,Math.min(N-2,Math.floor(f))),fr=Math.min(1,f-i);
  var t=sm(Math.max(0,Math.min(1,(fr-.3)/.7))),a=STAGES[i],b=STAGES[i+1],s={};
  KEYS.forEach(function(q){s[q]=a[q]+(b[q]-a[q])*t});
  return s;
}
function frame(){
  cur+=(tgt-cur)*.13;
  if(Math.abs(tgt-cur)<.0004)cur=tgt;
  var s=state(cur);
  root.style.transform="scale("+s.sc+") rotateX("+s.rx+"deg) rotateY("+s.ry+"deg)";
  root.style.setProperty("--sa",s.sa);
  var shiftY=CY+s.ex*52;
  pw.forEach(function(r){
    var p=r.p,y=p.pos[1]+s.ex*p.ex[0]-shiftY,z=p.pos[2]+s.ex*p.ex[1];
    r.w.style.transform="translate3d("+p.pos[0]*k+"px,"+(-y*k)+"px,"+z*k+"px)";
    if(r.tag){
      var o=p.to||[0,0];
      r.tag.style.opacity=s.tg;
      r.tag.style.transform="translate3d("+(p.w/2+4)*k+"px,0,0) rotateY("+(-s.ry)+"deg) rotateX("+(-s.rx)+"deg) translate("+o[0]+"px,"+(o[1]-11)+"px)";
    }
  });
  var ly=85+s.ex*95-shiftY;
  lidW.w.style.transform="translate3d(0,"+(-ly*k)+"px,"+(-45*k)+"px) rotateX("+s.lid+"deg)";
  lidW.tag.style.opacity=s.tg;
  lidW.tag.style.transform="translate3d("+55*k+"px,"+(-12*k)+"px,"+40*k+"px) rotateX("+(-s.lid)+"deg) rotateY("+(-s.ry)+"deg) rotateX("+(-s.rx)+"deg) translate(0,-11px)";
  var idx=Math.max(0,Math.min(N-1,Math.round(cur)));
  if(idx!==shown)show(idx);
  if(cur!==tgt)requestAnimationFrame(frame);else running=false;
}
var running=false;
function kick(){if(!running){running=true;requestAnimationFrame(frame)}}
function onScroll(){
  var max=document.getElementById("main").offsetHeight-innerHeight;
  var y=Math.max(0,Math.min(max,scrollY));
  tgt=y/innerHeight;
  document.getElementById("bar").style.width=(max?y/max*100:0)+"%";
  document.getElementById("hint").style.opacity=y>40?0:1;
  kick();
}
var panel=document.getElementById("panel"), nav=document.getElementById("nav");
STAGES.forEach(function(){nav.appendChild(document.createElement("b"))});
function show(i){
  shown=i;var S=STAGES[i];
  panel.innerHTML='<div class="fade"><h1>'+S.t+'</h1>'+S.p.map(function(x){return"<p>"+x+"</p>"}).join("")+(S.n?'<p class="note">'+S.n+"</p>":"")+"</div>";
  [].forEach.call(nav.children,function(b,j){b.className=j===i?"on":""});
}
var PRE=[[37,24,"ч"],[37,48,"ч"],[50,1,"ч"],[65,30,"мин"],[70,30,"мин"]];
function holdOf(i){var p=PRE[i];return p[2]==="ч"?p[1]*3600:p[1]*60}
var sim={T:24,amb:24,pi:0,set:37,hold:24*3600,left:24*3600,run:false,reached:false,st:"СТОП"};
function fmt(s){s=Math.max(0,Math.round(s));var h=Math.floor(s/3600),m=Math.floor(s%3600/60),c=s%60;return (h<10?"0":"")+h+":"+(m<10?"0":"")+m+":"+(c<10?"0":"")+c}
function lcdUpdate(){
  var l=root.querySelector("[data-lcd]");if(!l)return;
  var s=sim,Tn=s.T+(s.reached?Math.sin(Date.now()/700)*.04:0);
  l.innerHTML='<div style="font-size:1.35em;line-height:1.1">'+Tn.toFixed(1)+' °C</div><div style="font-size:.68em;opacity:.85">Тзад '+s.set+' °C</div><div style="font-size:.68em;opacity:.85">'+s.st+' '+fmt(s.run?s.left:s.hold)+'</div>';
  var d=root.querySelector("[data-led]");
  if(d){var c=s.run?(s.reached?"var(--accent)":"#e0a02b"):"transparent";d.style.background=c;d.style.borderColor=s.run?c:"rgb(var(--ink-rgb)/.8)"}
  var g=root.querySelector('[data-act="go"]');if(g)g.textContent=s.run?"■":"▶";
}
function act(a){
  var s=sim;
  if(a==="up"||a==="down"){s.set=Math.max(4,Math.min(70,s.set+(a==="up"?1:-1)));s.reached=false}
  else if(a==="set"){s.pi=(s.pi+1)%PRE.length;s.set=PRE[s.pi][0];s.hold=holdOf(s.pi);s.left=s.hold;s.reached=false}
  else if(a==="go"){
    if(s.run){s.run=false;s.reached=false;s.st="СТОП";s.left=s.hold}
    else{s.run=true;s.reached=false;s.left=s.hold}
  }
  if(!s.run&&a!=="go")s.st="СТОП";
  lcdUpdate();
}
root.addEventListener("click",function(e){var b=e.target.closest&&e.target.closest("[data-act]");if(b)act(b.getAttribute("data-act"))});
setInterval(function(){
  var s=sim,dt=.1,sp=60,target=s.run?s.set:s.amb,tau=s.run?120:900;
  s.T+=(target-s.T)*(1-Math.exp(-dt*sp/tau));
  if(s.run){
    var e=s.set-s.T;
    if(!s.reached&&Math.abs(e)<=.1)s.reached=true;
    if(s.reached){
      s.st="ВЫДЕРЖКА";s.left-=dt*1800;
      if(s.left<=0){s.left=0;s.run=false;s.reached=false;s.st="ГОТОВО"}
    }else s.st=e>0?"НАГРЕВ":"ОХЛАЖД";
  }
  lcdUpdate();
},100);
build();show(0);lcdUpdate();onScroll();cur=tgt;kick();
addEventListener("scroll",onScroll,{passive:true});
addEventListener("resize",function(){build();lcdUpdate();onScroll();cur=tgt;kick()});
})();