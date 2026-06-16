"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  LayoutDashboard, CheckSquare, RefreshCw, Clock, Calendar, FileText,
  Sparkles, Settings, Plus, Trash2, Check, X, Play, Pause, RotateCcw,
  Search, Flame, Target, Pencil, Bell, BarChart2, Archive, RotateCw,
  Pin, Tag, Filter, AlarmClock, Repeat, Star, ChevronDown, ChevronUp,
  CheckCircle2, AlertCircle, BookOpen, Coffee, Sunrise, Sunset, Moon,
  SortAsc, Save, Download, Upload, Hash, TrendingUp, Zap, Info, Eye
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════════
//  STORAGE LAYER — clean abstraction, all keys namespaced "ff_"
// ═══════════════════════════════════════════════════════════════════
const DB = {
  get(key, fallback = null) {
    try { const v = localStorage.getItem(`ff_${key}`); return v !== null ? JSON.parse(v) : fallback; } catch { return fallback; }
  },
  set(key, val) { try { localStorage.setItem(`ff_${key}`, JSON.stringify(val)); } catch {} },
  del(key) { try { localStorage.removeItem(`ff_${key}`); } catch {} },
};

function useStore(key, init) {
  const [val, setVal] = useState(() => DB.get(key, typeof init === "function" ? init() : init));
  const set = useCallback((updater) => {
    setVal(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      DB.set(key, next);
      return next;
    });
  }, [key]);
  return [val, set];
}

// ═══════════════════════════════════════════════════════════════════
//  UTILS
// ═══════════════════════════════════════════════════════════════════
const uid = () => Math.random().toString(36).slice(2, 9);
const toDs = (d = new Date()) => { const x = new Date(d); x.setHours(0,0,0,0); return x.toISOString().split("T")[0]; };
const todayDs = () => toDs();
const fmtSecs = s => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
const fmtDate = ds => ds ? new Date(ds+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"}) : "";
const isOverdue = ds => ds && ds < todayDs();

function calcStreak(completions = []) {
  const uniq = [...new Set(completions)].sort();
  if (!uniq.length) return 0;
  const td = todayDs();
  const yd = toDs(new Date(Date.now()-86400000));
  const last = uniq[uniq.length-1];
  if (last !== td && last !== yd) return 0;
  let streak = 0, check = new Date(last+"T12:00:00");
  for (let i = 0; i < 1000; i++) {
    if (uniq.includes(toDs(check))) { streak++; check.setDate(check.getDate()-1); }
    else break;
  }
  return streak;
}

function calcBestStreak(completions = []) {
  const uniq = [...new Set(completions)].sort();
  if (!uniq.length) return 0;
  let best = 1, cur = 1;
  for (let i = 1; i < uniq.length; i++) {
    const diff = (new Date(uniq[i]+"T12:00:00") - new Date(uniq[i-1]+"T12:00:00")) / 86400000;
    cur = diff === 1 ? cur+1 : 1; best = Math.max(best,cur);
  }
  return best;
}

const lastNDays = (n) => Array.from({length:n},(_,i)=>{
  const d=new Date(); d.setDate(d.getDate()-(n-1-i)); return toDs(d);
});

const greet = () => { const h=new Date().getHours(); return h<12?"Good morning":h<17?"Good afternoon":"Good evening"; };

// ═══════════════════════════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════════════════════════
const PCFG = {
  high:   {label:"High",   color:"#ef4444", bg:"rgba(239,68,68,0.12)"},
  medium: {label:"Medium", color:"#f59e0b", bg:"rgba(245,158,11,0.12)"},
  low:    {label:"Low",    color:"#6366f1", bg:"rgba(99,102,241,0.12)"},
};
const TCATS  = ["All","Work","Personal","Health","Study","Finance","Other"];
const NCATS  = ["All","Ideas","Work","Personal","Reference"];
const HICONS = ["🎯","💪","📚","🧘","🏃","💧","😴","✍️","🥗","🎸","🧠","🌿","📖","🧹","🚴","🎨"];
const PTEMPLATES = {
  "Deep Work":{"morning":["90-min deep work block","Silence phone & notifications"],"afternoon":["Review messages (30 min)","Second focus block"],"evening":["Plan tomorrow","Capture wins"]},
  "Balanced": {"morning":["Exercise 30 min","Top 3 tasks review"],"afternoon":["Meetings & collaboration","Lunch walk"],"evening":["Inbox zero","Journal"]},
  "Study":    {"morning":["Active recall (30 min)","Study session 1hr"],"afternoon":["Practice problems","Teach concept back"],"evening":["Review notes","Spaced repetition"]},
};

// ═══════════════════════════════════════════════════════════════════
//  LOGO MARK  — "Focal"
//  Thin ring · bold accent arc (top-right) · precise centre dot
//  Three elements, one clear idea: a point of focus in motion.
// ═══════════════════════════════════════════════════════════════════
function LogoMark({size=20}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{display:"block",flexShrink:0}}>
      {/* Full thin ring — structure */}
      <circle cx="12" cy="12" r="8.5"
        stroke="rgba(255,255,255,0.55)" strokeWidth="1.2"/>
      {/* Bold arc — top-right quadrant, motion/flow */}
      <path d="M12 3.5 A8.5 8.5 0 0 1 20.5 12"
        stroke="white" strokeWidth="2.6" strokeLinecap="round"/>
      {/* Centre dot — the focus point */}
      <circle cx="12" cy="12" r="2.6" fill="white"/>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  THEME
// ═══════════════════════════════════════════════════════════════════
const DARK  = {bg:"#08080f",surface:"#0f0f1e",elevated:"#171730",border:"rgba(255,255,255,0.07)",accent:"#7c6af7",accent2:"#22c55e",text:"#e8e8f0",muted:"#606080",card:"rgba(255,255,255,0.03)"};
const LIGHT = {bg:"#f2f2f7",surface:"#ffffff",elevated:"#e8e8f2",border:"rgba(0,0,0,0.08)",accent:"#6153e0",accent2:"#16a34a",text:"#0d0d1a",muted:"#8888aa",card:"rgba(0,0,0,0.02)"};

function getCSS(t) {
  return `*{box-sizing:border-box;margin:0;padding:0}
  :root{--bg:${t.bg};--surface:${t.surface};--elevated:${t.elevated};--border:${t.border};--accent:${t.accent};--accent2:${t.accent2};--text:${t.text};--muted:${t.muted};--card:${t.card}}
  html,body,#root{height:100%;font-family:'Outfit',system-ui,sans-serif}
  ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px}
  .card{background:var(--card);border:1px solid var(--border);border-radius:12px}
  .card-lg{background:var(--surface);border:1px solid var(--border);border-radius:16px}
  .inp{background:var(--elevated);border:1px solid var(--border);border-radius:8px;padding:9px 13px;color:var(--text);font-size:13px;outline:none;font-family:inherit;width:100%}
  .inp:focus{border-color:var(--accent)}
  .btn{border:none;border-radius:8px;cursor:pointer;font-family:inherit;font-size:13px;font-weight:600;padding:8px 16px;transition:all .15s ease}
  .btn:active{transform:scale(.97)}
  .btn-primary{background:var(--accent);color:#fff}
  .btn-ghost{background:var(--elevated);color:var(--muted)}
  .btn-danger{background:rgba(239,68,68,0.12);color:#ef4444;border:1px solid rgba(239,68,68,0.25)}
  .tag{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:6px;font-size:11px;font-weight:600}
  @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  .fade-up{animation:fadeUp .2s ease forwards}
  input[type=date]::-webkit-calendar-picker-indicator{filter:${t===DARK?"invert(1)":"none"};opacity:.4}
  button{cursor:pointer;transition:all .15s}
  select{background:var(--elevated);border:1px solid var(--border);border-radius:8px;padding:7px 10px;color:var(--text);font-size:13px;outline:none;font-family:inherit}
  textarea{resize:vertical}`;
}

// ═══════════════════════════════════════════════════════════════════
//  NAV + SIDEBAR
// ═══════════════════════════════════════════════════════════════════
const NAV = [
  {id:"dashboard", label:"Dashboard",  Icon:LayoutDashboard},
  {id:"tasks",     label:"Tasks",       Icon:CheckSquare},
  {id:"habits",    label:"Habits",      Icon:RefreshCw},
  {id:"focus",     label:"Focus",       Icon:Clock},
  {id:"planner",   label:"Planner",     Icon:Calendar},
  {id:"notes",     label:"Notes",       Icon:FileText},
  {id:"reminders", label:"Reminders",   Icon:Bell},
  {id:"ai",        label:"Flow AI",      Icon:Sparkles},
  {id:"analytics", label:"Analytics",   Icon:BarChart2},
  {id:"settings",  label:"Settings",    Icon:Settings},
];

// ── Responsive breakpoint hook ───────────────────────────────────
function useIsDesktop(bp=960) {
  const [desk,setDesk]=useState(()=>typeof window!=="undefined"?window.innerWidth>=bp:true);
  useEffect(()=>{
    const fn=()=>setDesk(window.innerWidth>=bp);
    window.addEventListener("resize",fn);
    return()=>window.removeEventListener("resize",fn);
  },[bp]);
  return desk;
}

// ── Shared nav-button style ──────────────────────────────────────
const navBtnStyle=(active)=>({
  display:"flex",alignItems:"center",gap:13,padding:"10px 15px",borderRadius:10,
  border:"none",cursor:"pointer",width:"100%",textAlign:"left",fontFamily:"inherit",
  background:active?"var(--accent)":"transparent",
  color:active?"#fff":"var(--muted)",
  fontSize:14,fontWeight:active?600:400,
});

// ── Shared sidebar internals ─────────────────────────────────────
function SidebarContent({view,setView,reminders=[],onNav}) {
  const pendingCount=reminders.filter(r=>!r.done&&!r.snoozed).length;
  const now=useClock();
  const timeStr=now.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",hour12:true});
  const [t,ap]=timeStr.split(" ");
  return (
    <>
      {/* Header with logo + clock */}
      <div style={{padding:"16px 16px 14px",display:"flex",alignItems:"center",gap:11,borderBottom:"1px solid var(--border)",flexShrink:0}}>
        <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#6a57f5,#a44af5 60%,#c03aff)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 3px 14px rgba(120,80,255,.45),inset 0 1px 0 rgba(255,255,255,.18)"}}>
          <LogoMark size={20}/>
        </div>
        <div style={{flex:1,minWidth:0}}>
          <span style={{color:"var(--text)",fontWeight:800,fontSize:16,letterSpacing:"-.5px",display:"block"}}>FocusFlow</span>
          <div style={{display:"flex",alignItems:"baseline",gap:3,marginTop:1}}>
            <span style={{color:"var(--muted)",fontSize:12,fontWeight:700,fontVariantNumeric:"tabular-nums"}}>{t}</span>
            <span style={{color:"var(--accent)",fontSize:9,fontWeight:700}}>{ap}</span>
          </div>
        </div>
      </div>
      <nav style={{flex:1,padding:"10px 8px",display:"flex",flexDirection:"column",gap:2,overflowY:"auto"}}>
        {NAV.map(({id,label,Icon})=>(
          <button key={id} style={navBtnStyle(view===id)} onClick={()=>onNav(id)}>
            <Icon size={17} style={{flexShrink:0}}/>
            <span style={{flex:1}}>{label}</span>
            {id==="reminders"&&pendingCount>0&&<span style={{background:"#ef4444",color:"#fff",borderRadius:10,fontSize:10,fontWeight:700,padding:"1px 6px"}}>{pendingCount}</span>}
          </button>
        ))}
      </nav>
      <div style={{padding:"14px 18px",borderTop:"1px solid var(--border)"}}>
        <p style={{color:"var(--muted)",fontSize:11,letterSpacing:"0.4px",textAlign:"center"}}>
          Built by <span style={{color:"var(--accent)",fontWeight:700,letterSpacing:0}}>Pounar</span>
        </p>
      </div>
    </>
  );
}

function Sidebar({view,setView,open,setOpen,reminders=[],persistent=false}) {
  if(persistent) {
    // Desktop: always-visible left rail, part of the normal document flow
    return (
      <aside style={{width:230,flexShrink:0,height:"100%",display:"flex",flexDirection:"column",background:"var(--surface)",borderRight:"1px solid var(--border)"}}>
        <SidebarContent view={view} setView={setView} reminders={reminders} onNav={id=>setView(id)}/>
      </aside>
    );
  }

  // Mobile: overlay drawer (unchanged behaviour)
  return (
    <>
      {open&&<div onClick={()=>setOpen(false)} style={{position:"fixed",inset:0,zIndex:40,background:"rgba(0,0,0,0.55)",backdropFilter:"blur(2px)",animation:"fadeIn .2s ease"}}/>}
      <aside style={{position:"fixed",top:0,left:0,height:"100vh",width:242,zIndex:50,display:"flex",flexDirection:"column",background:"var(--surface)",borderRight:"1px solid var(--border)",transform:open?"translateX(0)":"translateX(-100%)",transition:"transform .3s cubic-bezier(.4,0,.2,1)",boxShadow:open?"8px 0 40px rgba(0,0,0,0.4)":"none"}}>
        <div style={{display:"flex",flexDirection:"column",flex:1,overflow:"hidden"}}>
          <div style={{display:"flex",alignItems:"center",padding:"20px 16px 16px",borderBottom:"1px solid var(--border)",flexShrink:0,gap:11}}>
            <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#6a57f5,#a44af5 60%,#c03aff)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 3px 14px rgba(120,80,255,.45)"}}>
              <LogoMark size={20}/>
            </div>
            <span style={{color:"var(--text)",fontWeight:800,fontSize:16,letterSpacing:"-.5px",flex:1}}>FocusFlow</span>
            <button onClick={()=>setOpen(false)} style={{width:28,height:28,borderRadius:7,background:"var(--elevated)",border:"none",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--muted)"}}><X size={14}/></button>
          </div>
          <nav style={{flex:1,padding:"10px 8px",display:"flex",flexDirection:"column",gap:2,overflowY:"auto"}}>
            {NAV.map(({id,label,Icon})=>{
              const pending=id==="reminders"&&reminders.filter(r=>!r.done&&!r.snoozed).length;
              return (
                <button key={id} style={navBtnStyle(view===id)} onClick={()=>{setView(id);setOpen(false);}}>
                  <Icon size={17} style={{flexShrink:0}}/>
                  <span style={{flex:1}}>{label}</span>
                  {pending>0&&<span style={{background:"#ef4444",color:"#fff",borderRadius:10,fontSize:10,fontWeight:700,padding:"1px 6px"}}>{pending}</span>}
                </button>
              );
            })}
          </nav>
          <div style={{padding:"14px 18px",borderTop:"1px solid var(--border)",flexShrink:0}}>
            <p style={{color:"var(--muted)",fontSize:11,letterSpacing:"0.4px",textAlign:"center"}}>
              Built by <span style={{color:"var(--accent)",fontWeight:700,letterSpacing:0}}>Pounar</span>
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  MICRO COMPONENTS
// ═══════════════════════════════════════════════════════════════════
function EmptyState({icon:Icon,title,sub,action,onAction}) {
  return (
    <div style={{textAlign:"center",padding:"52px 24px",color:"var(--muted)"}}>
      <Icon size={32} style={{margin:"0 auto 12px",display:"block",opacity:.25}}/>
      <p style={{fontSize:15,fontWeight:600,color:"var(--muted)",marginBottom:4}}>{title}</p>
      {sub&&<p style={{fontSize:13,opacity:.7,marginBottom:action?16:0}}>{sub}</p>}
      {action&&<button className="btn btn-primary" onClick={onAction}>{action}</button>}
    </div>
  );
}

function Badge({label,color,bg}) {
  return <span className="tag" style={{color,background:bg||color+"20"}}>{label}</span>;
}

function Toggle({on,onToggle}) {
  return (
    <button onClick={onToggle} style={{width:42,height:24,borderRadius:12,border:"none",background:on?"var(--accent)":"var(--elevated)",position:"relative",transition:"background .2s",flexShrink:0}}>
      <div style={{width:18,height:18,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:on?21:3,transition:"left .2s",boxShadow:"0 1px 4px rgba(0,0,0,.3)"}}/>
    </button>
  );
}

function MiniChart({data,color="#7c6af7",h=44}) {
  const max = Math.max(...data,1);
  const w = 100/data.length;
  return (
    <svg width="100%" height={h} style={{overflow:"visible"}}>
      {data.map((v,i)=>(
        <rect key={i} x={`${i*w+0.5}%`} y={h-Math.max((v/max)*h,v>0?3:0)} width={`${w-1}%`} height={Math.max((v/max)*h,v>0?3:0)} rx={3} fill={color} opacity={i===data.length-1?1:.55}/>
      ))}
    </svg>
  );
}

function LineChart({data,color="#7c6af7",h=80}) {
  const max = Math.max(...data,1);
  if(data.length<2) return <div style={{height:h,display:"flex",alignItems:"center",justifyContent:"center"}}><p style={{color:"var(--muted)",fontSize:12}}>Not enough data yet</p></div>;
  const pts = data.map((v,i)=>`${(i/(data.length-1))*100},${h-(v/max)*h}`).join(" ");
  return (
    <svg width="100%" height={h} style={{overflow:"visible"}}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke"/>
      {data.map((v,i)=>(<circle key={i} cx={`${(i/(data.length-1))*100}%`} cy={h-(v/max)*h} r="3" fill={color} opacity={v>0?1:.3}/>))}
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  DASHBOARD
// ═══════════════════════════════════════════════════════════════════
function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id); }, []);
  return now;
}

function Dashboard({tasks,habits,sessions,notes,planner,reminders,setView}) {
  const td = todayDs();
  const now = useClock();
  const doneToday    = tasks.filter(t=>t.done&&t.completedAt?.startsWith(td)).length;
  const activeTasks  = tasks.filter(t=>!t.done&&!t.archived).length;
  const overdueCount = tasks.filter(t=>!t.done&&!t.archived&&isOverdue(t.dueDate)).length;
  const habitsToday  = habits.filter(h=>(h.completions||[]).includes(td)).length;
  const focusMin     = sessions.filter(s=>s.date===td&&s.type==="focus").reduce((a,s)=>a+s.duration,0);
  const maxStreak    = habits.length?Math.max(...habits.map(h=>h.streak||0)):0;
  const pendRem      = reminders.filter(r=>!r.done).length;

  // Productivity score (0-100)
  const habitScore   = habits.length ? (habitsToday/habits.length)*35 : 0;
  const taskScore    = Math.min(doneToday*10,35);
  const focusScore   = Math.min((focusMin/120)*30,30);
  const prodScore    = Math.round(habitScore+taskScore+focusScore);

  // 7-day charts
  const last7 = lastNDays(7);
  const taskChart  = last7.map(ds=>tasks.filter(t=>t.completedAt?.startsWith(ds)).length);
  const focusChart = last7.map(ds=>sessions.filter(s=>s.date===ds&&s.type==="focus").reduce((a,s)=>a+s.duration,0));

  const scoreColor = prodScore>=70?"#22c55e":prodScore>=40?"#f59e0b":"#ef4444";

  const timeStr = now.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",hour12:true});
  const [timePart, ampm] = timeStr.split(" ");
  const dateStr = now.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"});

  const greetEmoji = now.getHours()<12?"🌤️":now.getHours()<17?"☀️":"🌙";

  return (
    <div style={{padding:"28px 32px",maxWidth:900}} className="fade-up">

      {/* ── Greeting header ── */}
      <div style={{marginBottom:28}}>
        <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:5}}>
          <span style={{fontSize:24}}>{greetEmoji}</span>
          <h1 style={{fontSize:28,fontWeight:800,letterSpacing:"-0.8px",lineHeight:1,margin:0,color:"var(--text)"}}>{greet()}</h1>
        </div>
        <p style={{color:"var(--muted)",fontSize:15,fontWeight:500,letterSpacing:"0.1px",margin:0}}>{dateStr}</p>
      </div>

      {/* Top stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(145px,1fr))",gap:12,marginBottom:20}}>
        {[
          {label:"Productivity",value:`${prodScore}%`,Icon:TrendingUp,color:scoreColor,bg:scoreColor+"18",click:"analytics"},
          {label:"Active Tasks", value:activeTasks,   Icon:CheckSquare,color:"#7c6af7",bg:"rgba(124,106,247,.12)",click:"tasks"},
          {label:"Habits Done",  value:`${habitsToday}/${habits.length}`,Icon:RefreshCw,color:"#22c55e",bg:"rgba(34,197,94,.12)",click:"habits"},
          {label:"Focus Today",  value:`${focusMin}m`, Icon:Clock,      color:"#e879f9",bg:"rgba(232,121,249,.12)",click:"focus"},
        ].map(({label,value,Icon,color,bg,click})=>(
          <div key={label} className="card" style={{padding:"16px 18px",cursor:"pointer"}} onClick={()=>setView(click)}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
              <span style={{color:"var(--muted)",fontSize:11,fontWeight:600,letterSpacing:.5,textTransform:"uppercase"}}>{label}</span>
              <div style={{width:28,height:28,borderRadius:7,background:bg,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <Icon size={13} color={color}/>
              </div>
            </div>
            <div style={{color:"var(--text)",fontSize:26,fontWeight:800,lineHeight:1}}>{value}</div>
          </div>
        ))}
      </div>

      {/* Alerts row */}
      <div style={{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap"}}>
        {overdueCount>0&&<div style={{display:"flex",alignItems:"center",gap:7,padding:"8px 14px",borderRadius:9,background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.25)",cursor:"pointer"}} onClick={()=>setView("tasks")}>
          <AlertCircle size={13} color="#ef4444"/><span style={{color:"#ef4444",fontSize:12,fontWeight:600}}>{overdueCount} overdue task{overdueCount>1?"s":""}</span>
        </div>}
        {pendRem>0&&<div style={{display:"flex",alignItems:"center",gap:7,padding:"8px 14px",borderRadius:9,background:"rgba(245,158,11,0.1)",border:"1px solid rgba(245,158,11,0.25)",cursor:"pointer"}} onClick={()=>setView("reminders")}>
          <Bell size={13} color="#f59e0b"/><span style={{color:"#f59e0b",fontSize:12,fontWeight:600}}>{pendRem} pending reminder{pendRem>1?"s":""}</span>
        </div>}
        {maxStreak>=7&&<div style={{display:"flex",alignItems:"center",gap:7,padding:"8px 14px",borderRadius:9,background:"rgba(34,197,94,0.1)",border:"1px solid rgba(34,197,94,0.25)"}}>
          <Flame size={13} color="#22c55e"/><span style={{color:"#22c55e",fontSize:12,fontWeight:600}}>{maxStreak}-day streak! 🔥</span>
        </div>}
      </div>

      {/* Charts */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:20}}>
        <div className="card" style={{padding:"16px 18px"}}>
          <p style={{color:"var(--muted)",fontSize:11,fontWeight:600,letterSpacing:.5,textTransform:"uppercase",marginBottom:12}}>Tasks Completed — 7d</p>
          <MiniChart data={taskChart} color="var(--accent)"/>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
            {last7.map((ds,i)=><span key={i} style={{color:"var(--muted)",fontSize:9,flex:1,textAlign:"center"}}>{"SMTWTFS"[new Date(ds+"T12:00:00").getDay()]}</span>)}
          </div>
        </div>
        <div className="card" style={{padding:"16px 18px"}}>
          <p style={{color:"var(--muted)",fontSize:11,fontWeight:600,letterSpacing:.5,textTransform:"uppercase",marginBottom:12}}>Focus Time (min) — 7d</p>
          <MiniChart data={focusChart} color="#e879f9"/>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
            {last7.map((ds,i)=><span key={i} style={{color:"var(--muted)",fontSize:9,flex:1,textAlign:"center"}}>{"SMTWTFS"[new Date(ds+"T12:00:00").getDay()]}</span>)}
          </div>
        </div>
      </div>

      {/* Up next */}
      <div className="card" style={{padding:"16px 20px"}}>
        <p style={{color:"var(--muted)",fontSize:11,fontWeight:600,letterSpacing:.5,textTransform:"uppercase",marginBottom:12}}>Up Next</p>
        {tasks.filter(t=>!t.done&&!t.archived).slice(0,4).length===0
          ?<p style={{color:"var(--muted)",fontSize:13,padding:"8px 0"}}>All clear! 🎉 Add tasks to get started.</p>
          :tasks.filter(t=>!t.done&&!t.archived).sort((a,b)=>{const po={high:0,medium:1,low:2};return po[a.priority]-po[b.priority];}).slice(0,4).map(t=>(
            <div key={t.id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:PCFG[t.priority].color,flexShrink:0}}/>
              <span style={{color:"var(--text)",fontSize:13,flex:1}}>{t.title}</span>
              {t.dueDate&&<span style={{color:isOverdue(t.dueDate)?"#ef4444":"var(--muted)",fontSize:11}}>{fmtDate(t.dueDate)}</span>}
            </div>
          ))
        }
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  TASKS
// ═══════════════════════════════════════════════════════════════════
function TasksView({tasks,setTasks}) {
  const [form,setForm]     = useState({title:"",priority:"medium",category:"Personal",dueDate:"",recurring:"none",notes:""});
  const [showAdd,setShowAdd]= useState(false);
  const [search,setSearch]  = useState("");
  const [filter,setFilter]  = useState("active");
  const [catFilter,setCat]  = useState("All");
  const [sort,setSort]      = useState("created");
  const [editId,setEditId]  = useState(null);
  const [showArch,setArch]  = useState(false);

  const newTask = () => {
    if(!form.title.trim()) return;
    setTasks(p=>[...p,{id:uid(),title:form.title.trim(),priority:form.priority,category:form.category,dueDate:form.dueDate||null,recurring:form.recurring==="none"?null:form.recurring,notes:form.notes,done:false,archived:false,completedAt:null,createdAt:new Date().toISOString()}]);
    setForm({title:"",priority:"medium",category:"Personal",dueDate:"",recurring:"none",notes:""});
    setShowAdd(false);
  };

  const toggle = id => setTasks(p=>p.map(t=>t.id===id?{...t,done:!t.done,completedAt:!t.done?new Date().toISOString():null}:t));
  const del    = id => setTasks(p=>p.filter(t=>t.id!==id));
  const arch   = id => setTasks(p=>p.map(t=>t.id===id?{...t,archived:true,done:false}:t));
  const restore= id => setTasks(p=>p.map(t=>t.id===id?{...t,archived:false}:t));
  const save   = (id,data) => { setTasks(p=>p.map(t=>t.id===id?{...t,...data}:t)); setEditId(null); };

  const shown = useMemo(()=>{
    let list = tasks.filter(t=>showArch?t.archived:!t.archived);
    if(filter==="active") list=list.filter(t=>!t.done);
    if(filter==="done")   list=list.filter(t=>t.done);
    if(filter==="overdue")list=list.filter(t=>!t.done&&isOverdue(t.dueDate));
    if(catFilter!=="All") list=list.filter(t=>t.category===catFilter);
    if(search) list=list.filter(t=>t.title.toLowerCase().includes(search.toLowerCase())||t.notes?.toLowerCase().includes(search.toLowerCase()));
    if(sort==="priority") list=[...list].sort((a,b)=>({high:0,medium:1,low:2}[a.priority]-{high:0,medium:1,low:2}[b.priority]));
    if(sort==="due")      list=[...list].sort((a,b)=>(a.dueDate||"9")<(b.dueDate||"9")?-1:1);
    if(sort==="alpha")    list=[...list].sort((a,b)=>a.title.localeCompare(b.title));
    return list;
  },[tasks,filter,catFilter,search,sort,showArch]);

  const counts = {
    active:  tasks.filter(t=>!t.done&&!t.archived).length,
    done:    tasks.filter(t=>t.done&&!t.archived).length,
    overdue: tasks.filter(t=>!t.done&&!t.archived&&isOverdue(t.dueDate)).length,
  };

  return (
    <div style={{padding:"28px 32px",maxWidth:720}} className="fade-up">
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
        <h1 style={{color:"var(--text)",fontSize:22,fontWeight:800,flex:1}}>Tasks</h1>
        <button className="btn btn-ghost" onClick={()=>setArch(!showArch)} style={{display:"flex",alignItems:"center",gap:6,fontSize:12}}>
          <Archive size={13}/>{showArch?"Active":"Archive"}
        </button>
        <button className="btn btn-primary" onClick={()=>setShowAdd(!showAdd)} style={{display:"flex",alignItems:"center",gap:6}}>
          <Plus size={14}/>New Task
        </button>
      </div>

      {/* Add form */}
      {showAdd&&(
        <div className="card-lg" style={{padding:18,marginBottom:18}}>
          <input className="inp" value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))}
            onKeyDown={e=>e.key==="Enter"&&newTask()} placeholder="Task title…" style={{marginBottom:10}}/>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
            {Object.entries(PCFG).map(([k,v])=>(
              <button key={k} onClick={()=>setForm(p=>({...p,priority:k}))} style={{padding:"5px 12px",borderRadius:6,fontSize:12,fontFamily:"inherit",border:`1.5px solid ${form.priority===k?v.color:"var(--border)"}`,background:form.priority===k?v.bg:"transparent",color:form.priority===k?v.color:"var(--muted)"}}>
                {v.label}
              </button>
            ))}
            <select value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))}>
              {TCATS.filter(c=>c!=="All").map(c=><option key={c}>{c}</option>)}
            </select>
            <select value={form.recurring} onChange={e=>setForm(p=>({...p,recurring:e.target.value}))}>
              {["none","daily","weekly","monthly"].map(r=><option key={r}>{r}</option>)}
            </select>
            <input type="date" className="inp" style={{width:"auto",padding:"5px 10px"}} value={form.dueDate} onChange={e=>setForm(p=>({...p,dueDate:e.target.value}))}/>
          </div>
          <textarea className="inp" value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} placeholder="Notes (optional)…" rows={2} style={{marginBottom:10}}/>
          <div style={{display:"flex",gap:8}}>
            <button className="btn btn-primary" onClick={newTask}>Add Task</button>
            <button className="btn btn-ghost" onClick={()=>setShowAdd(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Filters row */}
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>
        <div style={{display:"flex",alignItems:"center",gap:6,background:"var(--elevated)",borderRadius:8,padding:"7px 11px",flex:1,minWidth:150}}>
          <Search size={13} color="var(--muted)"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search tasks…" style={{background:"transparent",border:"none",outline:"none",color:"var(--text)",fontSize:13,flex:1,fontFamily:"inherit"}}/>
          {search&&<button onClick={()=>setSearch("")} style={{background:"none",border:"none",color:"var(--muted)",padding:0}}><X size={12}/></button>}
        </div>
        <select value={sort} onChange={e=>setSort(e.target.value)} style={{width:"auto"}}>
          <option value="created">Newest</option>
          <option value="priority">Priority</option>
          <option value="due">Due date</option>
          <option value="alpha">A → Z</option>
        </select>
      </div>

      <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
        {["active","done","overdue"].map(f=>(
          <button key={f} onClick={()=>setFilter(f)} style={{padding:"5px 13px",borderRadius:8,border:"none",fontFamily:"inherit",background:filter===f?"var(--accent)":"var(--elevated)",color:filter===f?"#fff":"var(--muted)",fontSize:12,fontWeight:filter===f?600:400}}>
            {f.charAt(0).toUpperCase()+f.slice(1)} {counts[f]>0&&`(${counts[f]})`}
          </button>
        ))}
        {TCATS.slice(1).map(c=>(
          <button key={c} onClick={()=>setCat(catFilter===c?"All":c)} style={{padding:"5px 12px",borderRadius:8,border:"none",fontFamily:"inherit",background:catFilter===c?"rgba(124,106,247,0.15)":"var(--elevated)",color:catFilter===c?"var(--accent)":"var(--muted)",fontSize:12}}>
            {c}
          </button>
        ))}
      </div>

      {/* Task list */}
      {shown.length===0?<EmptyState icon={CheckSquare} title="No tasks here" sub={filter==="overdue"?"Great — you're all caught up!":"Add a task to get started."}/>:
        <div style={{display:"flex",flexDirection:"column",gap:7}}>
          {shown.map(task=>(
            <TaskCard key={task.id} task={task} onToggle={()=>toggle(task.id)} onDelete={()=>del(task.id)}
              onArchive={()=>arch(task.id)} onRestore={()=>restore(task.id)}
              onEdit={()=>setEditId(task.id)} onSave={(d)=>save(task.id,d)}
              editing={editId===task.id} showArch={showArch}/>
          ))}
        </div>
      }
    </div>
  );
}

function TaskCard({task,onToggle,onDelete,onArchive,onRestore,onEdit,onSave,editing,showArch}) {
  const [ed,setEd] = useState({title:task.title,priority:task.priority,dueDate:task.dueDate||"",notes:task.notes||""});
  const p = PCFG[task.priority];
  return (
    <div className="card" style={{padding:"12px 15px",opacity:task.done?0.6:1}}>
      {editing?(
        <div>
          <input className="inp" value={ed.title} onChange={e=>setEd(p=>({...p,title:e.target.value}))} style={{marginBottom:8}}/>
          <div style={{display:"flex",gap:7,marginBottom:8,flexWrap:"wrap"}}>
            {Object.entries(PCFG).map(([k,v])=>(
              <button key={k} onClick={()=>setEd(p=>({...p,priority:k}))} style={{padding:"4px 10px",borderRadius:6,fontSize:11,fontFamily:"inherit",border:`1.5px solid ${ed.priority===k?v.color:"var(--border)"}`,background:ed.priority===k?v.bg:"transparent",color:ed.priority===k?v.color:"var(--muted)"}}>
                {v.label}
              </button>
            ))}
            <input type="date" className="inp" value={ed.dueDate} onChange={e=>setEd(p=>({...p,dueDate:e.target.value}))} style={{width:"auto",padding:"4px 8px",fontSize:11}}/>
          </div>
          <textarea className="inp" value={ed.notes} onChange={e=>setEd(p=>({...p,notes:e.target.value}))} placeholder="Notes…" rows={2} style={{marginBottom:8}}/>
          <div style={{display:"flex",gap:7}}>
            <button className="btn btn-primary" style={{fontSize:12,padding:"5px 13px"}} onClick={()=>onSave(ed)}>Save</button>
            <button className="btn btn-ghost" style={{fontSize:12,padding:"5px 13px"}} onClick={onEdit}>Cancel</button>
          </div>
        </div>
      ):(
        <div style={{display:"flex",alignItems:"flex-start",gap:11}}>
          <button onClick={onToggle} style={{width:20,height:20,borderRadius:6,border:`2px solid ${task.done?p.color:"var(--border)"}`,background:task.done?p.color:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>
            {task.done&&<Check size={11} color="#fff"/>}
          </button>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
              <span style={{color:"var(--text)",fontSize:14,textDecoration:task.done?"line-through":"none"}}>{task.title}</span>
              <span className="tag" style={{color:p.color,background:p.bg,fontSize:10}}>{p.label}</span>
              {task.category&&<span className="tag" style={{color:"var(--muted)",background:"var(--elevated)",fontSize:10}}>{task.category}</span>}
              {task.recurring&&<span className="tag" style={{color:"#e879f9",background:"rgba(232,121,249,.1)",fontSize:10}}><Repeat size={8}/>{task.recurring}</span>}
            </div>
            {task.notes&&<p style={{color:"var(--muted)",fontSize:12,marginTop:3,lineHeight:1.5}}>{task.notes}</p>}
            {task.dueDate&&<p style={{color:isOverdue(task.dueDate)?"#ef4444":"var(--muted)",fontSize:11,marginTop:3}}>{isOverdue(task.dueDate)?"⚠ Overdue · ":""}{fmtDate(task.dueDate)}</p>}
          </div>
          <div style={{display:"flex",gap:4,flexShrink:0}}>
            {!showArch&&<button onClick={onEdit} style={{background:"none",border:"none",color:"var(--muted)",padding:4}}><Pencil size={13}/></button>}
            {!showArch&&<button onClick={onArchive} style={{background:"none",border:"none",color:"var(--muted)",padding:4}}><Archive size={13}/></button>}
            {showArch&&<button onClick={onRestore} style={{background:"none",border:"none",color:"var(--accent)",padding:4}}><RotateCw size={13}/></button>}
            <button onClick={onDelete} style={{background:"none",border:"none",color:"var(--muted)",padding:4}}><Trash2 size={13}/></button>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  HABITS
// ═══════════════════════════════════════════════════════════════════
function HabitsView({habits,setHabits}) {
  const [name,setName]   = useState("");
  const [icon,setIcon]   = useState("🎯");
  const [view,setView]   = useState("weekly"); // weekly | monthly
  const td = todayDs();
  const last7  = lastNDays(7);
  const last28 = lastNDays(28);

  const addHabit = () => {
    if(!name.trim()) return;
    setHabits(p=>[...p,{id:uid(),name:name.trim(),icon,streak:0,bestStreak:0,completions:[],createdAt:new Date().toISOString()}]);
    setName("");
  };

  const toggle = id => setHabits(p=>p.map(h=>{
    if(h.id!==id) return h;
    const comp = h.completions||[];
    const done = comp.includes(td);
    const newComp = done?comp.filter(c=>c!==td):[...comp,td];
    return {...h,completions:newComp,streak:calcStreak(newComp),bestStreak:Math.max(h.bestStreak||0,calcBestStreak(newComp))};
  }));

  const del = id => setHabits(p=>p.filter(h=>h.id!==id));

  const dayLabels7  = last7.map(ds=>"SMTWTFS"[new Date(ds+"T12:00:00").getDay()]);
  const dayLabels28 = last28.map(ds=>new Date(ds+"T12:00:00").getDate());

  const habitsToday = habits.filter(h=>(h.completions||[]).includes(td)).length;

  return (
    <div style={{padding:"28px 32px",maxWidth:780}} className="fade-up">
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
        <h1 style={{color:"var(--text)",fontSize:22,fontWeight:800,flex:1}}>Habits</h1>
        <div style={{color:"var(--muted)",fontSize:13}}>{habitsToday}/{habits.length} done today</div>
        <div style={{display:"flex",gap:4,background:"var(--elevated)",padding:3,borderRadius:8}}>
          {["weekly","monthly"].map(v=>(
            <button key={v} onClick={()=>setView(v)} style={{padding:"5px 12px",borderRadius:6,border:"none",fontFamily:"inherit",background:view===v?"var(--accent)":"transparent",color:view===v?"#fff":"var(--muted)",fontSize:12}}>
              {v.charAt(0).toUpperCase()+v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Add form */}
      <div className="card-lg" style={{padding:16,marginBottom:18}}>
        <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:10}}>
          {HICONS.map(i=>(
            <button key={i} onClick={()=>setIcon(i)} style={{fontSize:17,padding:"3px 5px",borderRadius:7,border:`2px solid ${icon===i?"var(--accent)":"transparent"}`,background:icon===i?"rgba(124,106,247,.12)":"transparent"}}>
              {i}
            </button>
          ))}
        </div>
        <div style={{display:"flex",gap:9}}>
          <input className="inp" value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addHabit()} placeholder="New habit…" style={{flex:1}}/>
          <button className="btn btn-primary" onClick={addHabit} style={{display:"flex",alignItems:"center",gap:6}}><Plus size={14}/>Add</button>
        </div>
      </div>

      {habits.length===0?<EmptyState icon={RefreshCw} title="No habits yet" sub="Add a habit above and start your streak today."/>:
        <div style={{display:"flex",flexDirection:"column",gap:13}}>
          {habits.map(h=>{
            const comp  = h.completions||[];
            const isDone= comp.includes(td);
            const days  = view==="weekly"?last7:last28;
            const lbs   = view==="weekly"?dayLabels7:dayLabels28;
            const compRate = days.length?Math.round((days.filter(d=>comp.includes(d)).length/days.length)*100):0;
            return (
              <div key={h.id} className="card-lg" style={{padding:"16px 18px"}}>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:13}}>
                  <span style={{fontSize:24}}>{h.icon}</span>
                  <div style={{flex:1}}>
                    <p style={{color:"var(--text)",fontSize:15,fontWeight:700}}>{h.name}</p>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginTop:3}}>
                      <span style={{display:"flex",alignItems:"center",gap:4,color:"#f59e0b",fontSize:12,fontWeight:600}}><Flame size={11}/>{h.streak||0} streak</span>
                      <span style={{color:"var(--muted)",fontSize:12}}>Best: {h.bestStreak||0}</span>
                      <span style={{color:"var(--muted)",fontSize:12}}>{compRate}% this {view==="weekly"?"week":"month"}</span>
                    </div>
                  </div>
                  <button onClick={()=>toggle(h.id)} style={{width:36,height:36,borderRadius:10,border:`2px solid ${isDone?"var(--accent2)":"var(--border)"}`,background:isDone?"rgba(34,197,94,.12)":"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    {isDone?<Check size={16} color="var(--accent2)"/>:<Plus size={16} color="var(--muted)"/>}
                  </button>
                  <button onClick={()=>del(h.id)} style={{background:"none",border:"none",color:"var(--muted)",padding:4}}><Trash2 size={14}/></button>
                </div>
                <div style={{display:"flex",gap:view==="weekly"?8:3}}>
                  {days.map((ds,i)=>{
                    const done=comp.includes(ds); const isT=ds===td;
                    return (
                      <div key={ds} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                        <div style={{width:"100%",aspectRatio:"1",borderRadius:view==="weekly"?7:4,background:done?"var(--accent2)":"var(--elevated)",border:isT?"1.5px solid var(--accent)":"none",opacity:done?1:.4}}/>
                        {view==="weekly"&&<span style={{color:"var(--muted)",fontSize:9,fontWeight:isT?700:400}}>{lbs[i]}</span>}
                        {view==="monthly"&&(i%7===0||i===0)&&<span style={{color:"var(--muted)",fontSize:8}}>{lbs[i]}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      }
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  FOCUS TIMER
// ═══════════════════════════════════════════════════════════════════
function FocusView({sessions,setSessions,settings,setSettings}) {
  const focusDur  = (settings.focusDur  || 25) * 60;
  const breakDur  = (settings.breakDur  || 5)  * 60;
  const lbDur     = (settings.lbDur     || 15) * 60;

  const [mode,setMode]   = useState(()=>DB.get("timer_mode","focus"));
  const [left,setLeft]   = useState(()=>{
    const saved = DB.get("timer_state",null);
    if(saved&&saved.mode) {
      const dur = saved.mode==="focus"?focusDur:saved.mode==="break"?breakDur:lbDur;
      if(saved.running&&saved.pausedAt) {
        const elapsed = Math.floor((Date.now()-saved.pausedAt)/1000);
        return Math.max(0,saved.left-elapsed);
      }
      return saved.left||dur;
    }
    return focusDur;
  });
  const [running,setRunning] = useState(false);
  const [cycles,setCycles]   = useState(()=>DB.get("timer_cycles",0));
  const td = todayDs();

  // Persist timer state
  useEffect(()=>{
    DB.set("timer_mode",mode);
    DB.set("timer_state",{mode,left,running,pausedAt:running?null:Date.now()});
  },[mode,left,running]);

  useEffect(()=>{ if(!running) return; const id=setInterval(()=>setLeft(t=>Math.max(0,t-1)),1000); return()=>clearInterval(id); },[running]);

  useEffect(()=>{
    if(left===0&&running) {
      setRunning(false);
      if(mode==="focus") {
        setSessions(p=>[...p,{id:uid(),date:td,duration:settings.focusDur||25,type:"focus",completedAt:new Date().toISOString()}]);
        const nc=cycles+1; setCycles(nc); DB.set("timer_cycles",nc);
        const next = nc%4===0?"longbreak":"break";
        switchMode(next);
      } else {
        switchMode("focus");
      }
    }
  },[left,running]);

  const switchMode = m => {
    const dur = m==="focus"?focusDur:m==="break"?breakDur:lbDur;
    setMode(m); setLeft(dur); setRunning(false);
    DB.set("timer_mode",m);
  };

  const reset = () => { setRunning(false); const dur=mode==="focus"?focusDur:mode==="break"?breakDur:lbDur; setLeft(dur); };

  const todaySess  = sessions.filter(s=>s.date===td&&s.type==="focus");
  const todayMin   = todaySess.reduce((a,s)=>a+s.duration,0);
  const totalMin   = sessions.filter(s=>s.type==="focus").reduce((a,s)=>a+s.duration,0);
  const total = mode==="focus"?focusDur:mode==="break"?breakDur:lbDur;
  const prog  = 1-(left/total);
  const R=96, C=2*Math.PI*R;
  const mColor = mode==="focus"?"#7c6af7":mode==="break"?"#22c55e":"#e879f9";

  return (
    <div style={{padding:"28px 32px",maxWidth:520,margin:"0 auto"}} className="fade-up">
      <div style={{marginBottom:28}}>
        <h1 style={{color:"var(--text)",fontSize:22,fontWeight:800}}>Focus Timer</h1>
        <p style={{color:"var(--muted)",fontSize:13,marginTop:3}}>{todaySess.length} sessions · {todayMin} min today · {totalMin} min total</p>
      </div>

      {/* Mode tabs */}
      <div style={{display:"flex",gap:6,marginBottom:36,background:"var(--elevated)",padding:4,borderRadius:12,width:"fit-content"}}>
        {[{id:"focus",label:"Focus"},{id:"break",label:"Break"},{id:"longbreak",label:"Long Break"}].map(({id,label})=>(
          <button key={id} onClick={()=>switchMode(id)} style={{padding:"7px 18px",borderRadius:9,border:"none",fontFamily:"inherit",background:mode===id?mColor:"transparent",color:mode===id?"#fff":"var(--muted)",fontSize:12,fontWeight:600}}>
            {label}
          </button>
        ))}
      </div>

      {/* Ring */}
      <div style={{position:"relative",width:240,height:240,margin:"0 auto 36px"}}>
        <svg width={240} height={240} style={{transform:"rotate(-90deg)"}}>
          <circle cx={120} cy={120} r={R} fill="none" stroke="var(--elevated)" strokeWidth={10}/>
          <circle cx={120} cy={120} r={R} fill="none" stroke={mColor} strokeWidth={10}
            strokeDasharray={C} strokeDashoffset={C*(1-prog)} strokeLinecap="round"
            style={{transition:"stroke-dashoffset .8s ease,stroke .3s"}}/>
        </svg>
        <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
          <div style={{color:"var(--text)",fontSize:46,fontWeight:800,letterSpacing:-2,fontVariantNumeric:"tabular-nums"}}>{fmtSecs(left)}</div>
          <div style={{color:"var(--muted)",fontSize:12,textTransform:"capitalize",marginTop:4}}>{mode==="longbreak"?"Long Break":mode}</div>
          <div style={{display:"flex",gap:4,marginTop:8}}>
            {Array.from({length:4},(_,i)=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:i<(cycles%4)?mColor:"var(--elevated)"}}/>)}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{display:"flex",gap:12,justifyContent:"center",marginBottom:32}}>
        <button onClick={reset} style={{width:48,height:48,borderRadius:13,background:"var(--elevated)",border:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--muted)"}}><RotateCcw size={18}/></button>
        <button onClick={()=>setRunning(!running)} style={{width:66,height:66,borderRadius:18,background:running?"rgba(239,68,68,.1)":mColor,border:running?"2px solid #ef4444":"none",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:running?"none":`0 8px 24px ${mColor}55`}}>
          {running?<Pause size={24} color="#ef4444"/>:<Play size={24} color="#fff" fill="#fff"/>}
        </button>
      </div>

      {/* Duration config */}
      <div className="card" style={{padding:"16px 18px",marginBottom:20}}>
        <p style={{color:"var(--muted)",fontSize:11,fontWeight:600,letterSpacing:.5,textTransform:"uppercase",marginBottom:12}}>Durations (minutes)</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
          {[{k:"focusDur",l:"Focus",def:25},{k:"breakDur",l:"Break",def:5},{k:"lbDur",l:"Long Break",def:15}].map(({k,l,def})=>(
            <div key={k}>
              <label style={{color:"var(--muted)",fontSize:11,display:"block",marginBottom:4}}>{l}</label>
              <input type="number" className="inp" value={settings[k]||def} min={1} max={120} style={{padding:"7px 10px"}}
                onChange={e=>{const v=Number(e.target.value); setSettings(p=>({...p,[k]:v})); if(mode===k.replace("Dur","")&&!running)setLeft(v*60);}}/>
            </div>
          ))}
        </div>
      </div>

      {/* Session log */}
      {todaySess.length>0&&(
        <div>
          <p style={{color:"var(--muted)",fontSize:11,fontWeight:600,letterSpacing:.5,textTransform:"uppercase",marginBottom:10}}>Today's Sessions</p>
          <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
            {todaySess.map((s,i)=>(
              <div key={s.id} style={{padding:"5px 11px",borderRadius:8,background:"var(--elevated)",color:"var(--muted)",fontSize:11}}>
                #{i+1} · {s.duration}m
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  PLANNER
// ═══════════════════════════════════════════════════════════════════
const PERIODS_CFG=[{id:"morning",label:"Morning",Icon:Sunrise,emoji:"🌅"},{id:"afternoon",label:"Afternoon",Icon:Coffee,emoji:"☀️"},{id:"evening",label:"Evening",Icon:Moon,emoji:"🌙"}];

function PlannerView({planner,setPlanner,tasks}) {
  const [input,setInput]   = useState("");
  const [period,setPeriod] = useState("morning");
  const [showTpl,setShowTpl]=useState(false);
  const [viewDate,setViewDate]=useState(todayDs());
  const day = planner[viewDate]||{morning:[],afternoon:[],evening:[]};

  const add = () => {
    if(!input.trim()) return;
    setPlanner(p=>({...p,[viewDate]:{...day,[period]:[...(day[period]||[]),{id:uid(),text:input.trim(),done:false}]}}));
    setInput("");
  };

  const toggle = (per,id) => setPlanner(p=>({...p,[viewDate]:{...day,[per]:day[per].map(i=>i.id===id?{...i,done:!i.done}:i)}}));
  const del    = (per,id) => setPlanner(p=>({...p,[viewDate]:{...day,[per]:day[per].filter(i=>i.id!==id)}}));
  const move   = (per,id,dir) => {
    const list=[...day[per]]; const idx=list.findIndex(i=>i.id===id);
    if(dir==="up"&&idx>0)[list[idx],list[idx-1]]=[list[idx-1],list[idx]];
    if(dir==="dn"&&idx<list.length-1)[list[idx],list[idx+1]]=[list[idx+1],list[idx]];
    setPlanner(p=>({...p,[viewDate]:{...day,[per]:list}}));
  };

  const applyTemplate = (name) => {
    const t=PTEMPLATES[name];
    setPlanner(p=>({...p,[viewDate]:{morning:[...(day.morning||[]),...t.morning.map(text=>({id:uid(),text,done:false}))],afternoon:[...(day.afternoon||[]),...t.afternoon.map(text=>({id:uid(),text,done:false}))],evening:[...(day.evening||[]),...t.evening.map(text=>({id:uid(),text,done:false}))]}}));
    setShowTpl(false);
  };

  const totalItems = Object.values(day).flat().length;
  const doneItems  = Object.values(day).flat().filter(i=>i.done).length;

  const todayStr=todayDs();
  const prevDay=()=>{const d=new Date(viewDate+"T12:00:00");d.setDate(d.getDate()-1);setViewDate(toDs(d));};
  const nextDay=()=>{const d=new Date(viewDate+"T12:00:00");d.setDate(d.getDate()+1);setViewDate(toDs(d));};

  return (
    <div style={{padding:"28px 32px",maxWidth:820}} className="fade-up">
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
        <h1 style={{color:"var(--text)",fontSize:22,fontWeight:800,flex:1}}>Daily Planner</h1>
        <button className="btn btn-ghost" style={{fontSize:12,display:"flex",alignItems:"center",gap:5}} onClick={()=>setShowTpl(!showTpl)}>Templates</button>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <button onClick={prevDay} style={{background:"none",border:"none",color:"var(--muted)",padding:4,fontSize:18}}>‹</button>
          <button onClick={()=>setViewDate(todayStr)} style={{color:viewDate===todayStr?"var(--accent)":"var(--muted)",background:viewDate===todayStr?"rgba(124,106,247,.1)":"var(--elevated)",border:"none",borderRadius:7,padding:"5px 11px",fontSize:12,fontFamily:"inherit",fontWeight:600}}>
            {viewDate===todayStr?"Today":fmtDate(viewDate)}
          </button>
          <button onClick={nextDay} style={{background:"none",border:"none",color:"var(--muted)",padding:4,fontSize:18}}>›</button>
        </div>
      </div>

      {/* Template picker */}
      {showTpl&&(
        <div className="card-lg" style={{padding:16,marginBottom:16}}>
          <p style={{color:"var(--muted)",fontSize:12,fontWeight:600,marginBottom:10}}>APPLY TEMPLATE</p>
          <div style={{display:"flex",gap:9,flexWrap:"wrap"}}>
            {Object.keys(PTEMPLATES).map(name=>(
              <button key={name} className="btn btn-ghost" style={{fontSize:13}} onClick={()=>applyTemplate(name)}>{name}</button>
            ))}
            <button className="btn btn-ghost" style={{fontSize:12,color:"var(--muted)"}} onClick={()=>setShowTpl(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Progress */}
      {totalItems>0&&(
        <div style={{marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
            <span style={{color:"var(--muted)",fontSize:12}}>{doneItems}/{totalItems} completed</span>
            <span style={{color:"var(--accent)",fontSize:12,fontWeight:600}}>{Math.round((doneItems/totalItems)*100)}%</span>
          </div>
          <div style={{height:4,background:"var(--elevated)",borderRadius:2}}>
            <div style={{height:"100%",borderRadius:2,background:"var(--accent)",width:`${(doneItems/totalItems)*100}%`,transition:"width .3s"}}/>
          </div>
        </div>
      )}

      {/* Quick add */}
      <div className="card-lg" style={{padding:16,marginBottom:20}}>
        <div style={{display:"flex",gap:7,marginBottom:10,flexWrap:"wrap"}}>
          {PERIODS_CFG.map(({id,emoji,label})=>(
            <button key={id} onClick={()=>setPeriod(id)} style={{padding:"6px 14px",borderRadius:8,border:"none",fontFamily:"inherit",background:period===id?"var(--accent)":"var(--elevated)",color:period===id?"#fff":"var(--muted)",fontSize:13}}>
              {emoji} {label}
            </button>
          ))}
        </div>
        <div style={{display:"flex",gap:9}}>
          <input className="inp" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()} placeholder={`Add to ${period}…`} style={{flex:1}}/>
          <button className="btn btn-primary" onClick={add}>Add</button>
        </div>
      </div>

      {/* Columns */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:14}}>
        {PERIODS_CFG.map(({id:per,emoji,label})=>{
          const items=day[per]||[];
          const done=items.filter(i=>i.done).length;
          return (
            <div key={per} className="card-lg" style={{padding:"16px 18px"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                <span style={{fontSize:18}}>{emoji}</span>
                <span style={{color:"var(--text)",fontSize:14,fontWeight:700,flex:1}}>{label}</span>
                <span style={{color:"var(--muted)",fontSize:12}}>{done}/{items.length}</span>
              </div>
              {items.length>0&&<div style={{height:3,background:"var(--elevated)",borderRadius:2,marginBottom:12}}><div style={{height:"100%",background:"var(--accent2)",borderRadius:2,width:`${items.length?done/items.length*100:0}%`,transition:"width .3s"}}/></div>}
              <div style={{display:"flex",flexDirection:"column",gap:7}}>
                {items.length===0&&<p style={{color:"var(--muted)",fontSize:12,padding:"8px 0",textAlign:"center"}}>Empty</p>}
                {items.map((item,idx)=>(
                  <div key={item.id} style={{display:"flex",alignItems:"center",gap:8}}>
                    <button onClick={()=>toggle(per,item.id)} style={{width:17,height:17,borderRadius:5,border:`2px solid ${item.done?"var(--accent2)":"var(--border)"}`,background:item.done?"rgba(34,197,94,.12)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      {item.done&&<Check size={9} color="var(--accent2)"/>}
                    </button>
                    <span style={{flex:1,color:item.done?"var(--muted)":"var(--text)",fontSize:13,textDecoration:item.done?"line-through":"none",lineHeight:1.4}}>{item.text}</span>
                    <div style={{display:"flex",gap:2,opacity:.5}}>
                      <button onClick={()=>move(per,item.id,"up")} style={{background:"none",border:"none",color:"var(--muted)",padding:"1px 3px",fontSize:12}} disabled={idx===0}>↑</button>
                      <button onClick={()=>move(per,item.id,"dn")} style={{background:"none",border:"none",color:"var(--muted)",padding:"1px 3px",fontSize:12}} disabled={idx===items.length-1}>↓</button>
                      <button onClick={()=>del(per,item.id)} style={{background:"none",border:"none",color:"var(--muted)",padding:2}}><X size={11}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  NOTES
// ═══════════════════════════════════════════════════════════════════
function NotesView({notes,setNotes}) {
  const [content,setContent] = useState("");
  const [catNew,setCatNew]   = useState("Ideas");
  const [search,setSearch]   = useState("");
  const [catFil,setCatFil]   = useState("All");
  const [editId,setEditId]   = useState(null);
  const [editData,setEditData]=useState({content:"",category:"Ideas"});
  const [sortPin,setSortPin] = useState(true);

  const add = () => {
    if(!content.trim()) return;
    setNotes(p=>[{id:uid(),content:content.trim(),category:catNew,pinned:false,createdAt:new Date().toISOString()},...p]);
    setContent("");
  };

  const del     = id => setNotes(p=>p.filter(n=>n.id!==id));
  const pin     = id => setNotes(p=>p.map(n=>n.id===id?{...n,pinned:!n.pinned}:n));
  const startEd = n  => { setEditId(n.id); setEditData({content:n.content,category:n.category}); };
  const saveEd  = id => { setNotes(p=>p.map(n=>n.id===id?{...n,...editData,updatedAt:new Date().toISOString()}:n)); setEditId(null); };

  const shown = useMemo(()=>{
    let list=notes.filter(n=>{
      if(catFil!=="All"&&n.category!==catFil) return false;
      if(search&&!n.content.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
    if(sortPin) list=[...list].sort((a,b)=>(b.pinned?1:0)-(a.pinned?1:0));
    return list;
  },[notes,catFil,search,sortPin]);

  const NOTE_TINTS=["rgba(124,106,247,.06)","rgba(34,197,94,.06)","rgba(245,158,11,.06)","rgba(239,68,68,.06)","rgba(232,121,249,.06)"];

  return (
    <div style={{padding:"28px 32px",maxWidth:900}} className="fade-up">
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
        <h1 style={{color:"var(--text)",fontSize:22,fontWeight:800,flex:1}}>Notes</h1>
        <span style={{color:"var(--muted)",fontSize:13}}>{notes.length} note{notes.length!==1?"s":""}</span>
        <button onClick={()=>setSortPin(!sortPin)} className="btn btn-ghost" style={{fontSize:12,display:"flex",alignItems:"center",gap:5}}>
          <Pin size={12}/>{sortPin?"Pinned first":"All equal"}
        </button>
      </div>

      {/* Add form */}
      <div className="card-lg" style={{padding:18,marginBottom:20}}>
        <textarea className="inp" value={content} onChange={e=>setContent(e.target.value)} placeholder="Write a note…" rows={3} style={{marginBottom:10,lineHeight:1.7}}/>
        <div style={{display:"flex",gap:9,alignItems:"center",flexWrap:"wrap"}}>
          <select value={catNew} onChange={e=>setCatNew(e.target.value)} style={{width:"auto"}}>
            {NCATS.filter(c=>c!=="All").map(c=><option key={c}>{c}</option>)}
          </select>
          <div style={{flex:1,display:"flex",alignItems:"center",gap:7,background:"var(--elevated)",borderRadius:8,padding:"8px 11px"}}>
            <Search size={13} color="var(--muted)"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…" style={{background:"transparent",border:"none",outline:"none",color:"var(--text)",fontSize:13,flex:1,fontFamily:"inherit"}}/>
            {search&&<button onClick={()=>setSearch("")} style={{background:"none",border:"none",color:"var(--muted)",padding:0}}><X size={12}/></button>}
          </div>
          <button className="btn btn-primary" onClick={add}>Save</button>
        </div>
        <div style={{display:"flex",gap:6,marginTop:10,flexWrap:"wrap"}}>
          {NCATS.map(c=>(
            <button key={c} onClick={()=>setCatFil(c)} style={{padding:"4px 11px",borderRadius:7,border:"none",fontFamily:"inherit",background:catFil===c?"var(--accent)":"var(--elevated)",color:catFil===c?"#fff":"var(--muted)",fontSize:11,fontWeight:catFil===c?600:400}}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {shown.length===0?<EmptyState icon={FileText} title="No notes found" sub={search?"Try a different search term.":"Write your first note above."}/>:
        <div style={{columns:"290px",gap:14}}>
          {shown.map((note,idx)=>(
            <div key={note.id} style={{borderRadius:13,padding:16,marginBottom:14,breakInside:"avoid",background:NOTE_TINTS[idx%NOTE_TINTS.length],border:`1px solid ${note.pinned?"var(--accent)":"var(--border)"}`}}>
              {editId===note.id?(
                <>
                  <textarea className="inp" value={editData.content} onChange={e=>setEditData(p=>({...p,content:e.target.value}))} autoFocus rows={4} style={{marginBottom:8,lineHeight:1.7}}/>
                  <div style={{display:"flex",gap:7,marginBottom:8}}>
                    <select value={editData.category} onChange={e=>setEditData(p=>({...p,category:e.target.value}))} style={{width:"auto",fontSize:12}}>
                      {NCATS.filter(c=>c!=="All").map(c=><option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div style={{display:"flex",gap:7}}>
                    <button className="btn btn-primary" style={{fontSize:12,padding:"5px 13px"}} onClick={()=>saveEd(note.id)}>Save</button>
                    <button className="btn btn-ghost" style={{fontSize:12,padding:"5px 13px"}} onClick={()=>setEditId(null)}>Cancel</button>
                  </div>
                </>
              ):(
                <>
                  <p style={{color:"var(--text)",fontSize:14,lineHeight:1.75,whiteSpace:"pre-wrap",marginBottom:11}}>{note.content}</p>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      {note.pinned&&<Pin size={10} color="var(--accent)"/>}
                      <span style={{color:"var(--muted)",fontSize:10,fontWeight:600}}>{note.category}</span>
                      <span style={{color:"var(--muted)",fontSize:10}}>· {new Date(note.createdAt).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</span>
                    </div>
                    <div style={{display:"flex",gap:4}}>
                      <button onClick={()=>pin(note.id)} style={{background:"none",border:"none",color:note.pinned?"var(--accent)":"var(--muted)",padding:4}}><Pin size={12}/></button>
                      <button onClick={()=>startEd(note)} style={{background:"none",border:"none",color:"var(--muted)",padding:4}}><Pencil size={12}/></button>
                      <button onClick={()=>del(note.id)} style={{background:"none",border:"none",color:"var(--muted)",padding:4}}><Trash2 size={12}/></button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      }
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  REMINDERS  — browser notification + in-session scheduling
// ═══════════════════════════════════════════════════════════════════
function RemindersView({reminders,setReminders}) {
  const [form,setForm]   = useState({title:"",desc:"",date:todayDs(),time:"09:00",recurring:"none"});
  const [showAdd,setAdd] = useState(false);
  const [editId,setEdit] = useState(null);
  const [notifPerm,setPerm]=useState(()=>typeof Notification!=="undefined"?Notification.permission:"denied");
  const [filter,setFilter]=useState("upcoming");

  const requestPerm = async () => {
    if(typeof Notification==="undefined") return;
    const p=await Notification.requestPermission();
    setPerm(p);
  };

  const scheduleNotif = (r) => {
    if(typeof Notification==="undefined"||Notification.permission!=="granted") return;
    const fireAt=new Date(r.datetime).getTime();
    const delay=fireAt-Date.now();
    if(delay<=0||delay>7*24*3600*1000) return; // only schedule within 7 days
    setTimeout(()=>{
      try{new Notification(r.title,{body:r.desc||"Reminder from FocusFlow",icon:"/favicon.ico"});}catch{}
    },delay);
  };

  const addReminder = () => {
    if(!form.title.trim()||!form.date||!form.time) return;
    const r={id:uid(),title:form.title.trim(),desc:form.desc,datetime:`${form.date}T${form.time}`,recurring:form.recurring==="none"?null:form.recurring,done:false,snoozed:false,createdAt:new Date().toISOString()};
    setReminders(p=>[...p,r]);
    scheduleNotif(r);
    setForm({title:"",desc:"",date:todayDs(),time:"09:00",recurring:"none"});
    setAdd(false);
  };

  const saveEdit = (id) => {
    setReminders(p=>p.map(r=>{
      if(r.id!==id) return r;
      const updated={...r,...form,datetime:`${form.date}T${form.time}`};
      scheduleNotif(updated); return updated;
    }));
    setEdit(null);
  };

  const markDone   = id => setReminders(p=>p.map(r=>r.id===id?{...r,done:true}:r));
  const snooze     = id => {
    const later=new Date(Date.now()+3600000).toISOString();
    setReminders(p=>p.map(r=>{
      if(r.id!==id) return r;
      const updated={...r,datetime:later,snoozed:true};
      scheduleNotif(updated); return updated;
    }));
  };
  const del    = id => setReminders(p=>p.filter(r=>r.id!==id));
  const unDone = id => setReminders(p=>p.map(r=>r.id===id?{...r,done:false}:r));

  const now=Date.now();
  const shown=useMemo(()=>{
    let list=[...reminders].sort((a,b)=>new Date(a.datetime)-new Date(b.datetime));
    if(filter==="upcoming") list=list.filter(r=>!r.done);
    if(filter==="done")     list=list.filter(r=>r.done);
    return list;
  },[reminders,filter]);

  const fmtDt=dt=>{
    const d=new Date(dt);
    return d.toLocaleDateString("en-US",{month:"short",day:"numeric"})+", "+d.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});
  };
  const isPast=dt=>new Date(dt).getTime()<now;

  return (
    <div style={{padding:"28px 32px",maxWidth:680}} className="fade-up">
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
        <h1 style={{color:"var(--text)",fontSize:22,fontWeight:800,flex:1}}>Reminders</h1>
        <button className="btn btn-primary" onClick={()=>setAdd(!showAdd)} style={{display:"flex",alignItems:"center",gap:6}}><Plus size={14}/>New</button>
      </div>

      {/* Notification permission banner */}
      {notifPerm!=="granted"&&(
        <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderRadius:11,background:"rgba(245,158,11,.08)",border:"1px solid rgba(245,158,11,.2)",marginBottom:18}}>
          <Bell size={16} color="#f59e0b"/>
          <p style={{color:"var(--text)",fontSize:13,flex:1}}>Enable notifications to receive reminders even when the tab is in background.</p>
          <button className="btn btn-ghost" style={{fontSize:12}} onClick={requestPerm}>Enable</button>
        </div>
      )}

      {/* Add / Edit form */}
      {(showAdd||editId)&&(
        <div className="card-lg" style={{padding:18,marginBottom:18}}>
          <p style={{color:"var(--muted)",fontSize:12,fontWeight:600,marginBottom:12}}>{editId?"EDIT REMINDER":"NEW REMINDER"}</p>
          <input className="inp" value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} placeholder="Reminder title…" style={{marginBottom:9}}/>
          <input className="inp" value={form.desc} onChange={e=>setForm(p=>({...p,desc:e.target.value}))} placeholder="Description (optional)…" style={{marginBottom:9}}/>
          <div style={{display:"flex",gap:9,marginBottom:9,flexWrap:"wrap"}}>
            <input type="date" className="inp" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))} style={{flex:1,minWidth:130}}/>
            <input type="time" className="inp" value={form.time} onChange={e=>setForm(p=>({...p,time:e.target.value}))} style={{flex:1,minWidth:100}}/>
            <select value={form.recurring} onChange={e=>setForm(p=>({...p,recurring:e.target.value}))} style={{flex:1,minWidth:100}}>
              {["none","daily","weekly"].map(r=><option key={r} value={r}>{r==="none"?"No repeat":r.charAt(0).toUpperCase()+r.slice(1)}</option>)}
            </select>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button className="btn btn-primary" onClick={editId?()=>saveEdit(editId):addReminder}>{editId?"Save Changes":"Add Reminder"}</button>
            <button className="btn btn-ghost" onClick={()=>{setAdd(false);setEdit(null);}}>Cancel</button>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{display:"flex",gap:6,marginBottom:16}}>
        {["upcoming","done","all"].map(f=>(
          <button key={f} onClick={()=>setFilter(f)} style={{padding:"5px 14px",borderRadius:8,border:"none",fontFamily:"inherit",background:filter===f?"var(--accent)":"var(--elevated)",color:filter===f?"#fff":"var(--muted)",fontSize:12,fontWeight:filter===f?600:400}}>
            {f.charAt(0).toUpperCase()+f.slice(1)}
          </button>
        ))}
      </div>

      {shown.length===0?<EmptyState icon={Bell} title={filter==="done"?"No completed reminders":"No reminders"} sub={filter==="upcoming"?"Add a reminder to stay on track.":""}/>:
        <div style={{display:"flex",flexDirection:"column",gap:9}}>
          {shown.map(r=>(
            <div key={r.id} className="card" style={{padding:"13px 16px",opacity:r.done?.65:1}}>
              <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:r.done?"var(--muted)":isPast(r.datetime)?"#ef4444":"var(--accent)",flexShrink:0,marginTop:5}}/>
                <div style={{flex:1}}>
                  <p style={{color:"var(--text)",fontSize:14,fontWeight:600,textDecoration:r.done?"line-through":"none"}}>{r.title}</p>
                  {r.desc&&<p style={{color:"var(--muted)",fontSize:12,marginTop:2}}>{r.desc}</p>}
                  <div style={{display:"flex",alignItems:"center",gap:8,marginTop:5,flexWrap:"wrap"}}>
                    <span style={{color:isPast(r.datetime)&&!r.done?"#ef4444":"var(--muted)",fontSize:11}}>{fmtDt(r.datetime)}</span>
                    {r.recurring&&<span className="tag" style={{color:"#e879f9",background:"rgba(232,121,249,.1)",fontSize:10}}><Repeat size={8}/>{r.recurring}</span>}
                    {r.snoozed&&<span className="tag" style={{color:"#f59e0b",background:"rgba(245,158,11,.1)",fontSize:10}}>snoozed</span>}
                    {isPast(r.datetime)&&!r.done&&<span className="tag" style={{color:"#ef4444",background:"rgba(239,68,68,.1)",fontSize:10}}>overdue</span>}
                  </div>
                </div>
                <div style={{display:"flex",gap:5,flexShrink:0,flexWrap:"wrap"}}>
                  {!r.done&&<>
                    <button className="btn btn-ghost" style={{fontSize:11,padding:"4px 9px"}} onClick={()=>{setEdit(r.id);setForm({title:r.title,desc:r.desc||"",date:r.datetime.split("T")[0],time:r.datetime.split("T")[1]?.slice(0,5)||"09:00",recurring:r.recurring||"none"});}}>Edit</button>
                    <button className="btn btn-ghost" style={{fontSize:11,padding:"4px 9px"}} onClick={()=>snooze(r.id)}>+1hr</button>
                    <button className="btn btn-primary" style={{fontSize:11,padding:"4px 9px"}} onClick={()=>markDone(r.id)}>Done</button>
                  </>}
                  {r.done&&<button className="btn btn-ghost" style={{fontSize:11,padding:"4px 9px"}} onClick={()=>unDone(r.id)}>Undo</button>}
                  <button onClick={()=>del(r.id)} style={{background:"none",border:"none",color:"var(--muted)",padding:4}}><Trash2 size={13}/></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      }
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  AI ASSISTANT  — Flow AI
// ═══════════════════════════════════════════════════════════════════
const FLOW_AI_WELCOME = {role:"assistant",content:"Hi! I'm Flow AI, your personal productivity co-pilot ✨\n\nI can build daily plans, suggest habit stacks, create study schedules, and more. What are you working on?"};

function AIView({tasks,setTasks,planner,setPlanner,habits,sessions,savedSuggestions,setSaved}) {
  // ── Persistent chat history ──
  const [msgs,setMsgs]   = useStore("ai_chat",[FLOW_AI_WELCOME]);
  const [input,setInput] = useState("");
  const [loading,setLoading]=useState(false);
  const [actions,setActions]=useState([]);
  const [confirmClear,setConfirmClear]=useState(false);
  const bottomRef=useRef(null);

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); },[msgs,loading]);

  const QUICK=["Plan my ideal productive day","Suggest a morning routine","Create a 7-day study schedule","Help me break my procrastination habit","Recommend 5 daily habits for focus"];

  // Detect if user message contains a plan/schedule and auto-extract it
  const extractPlanFromText=(text)=>{
    const lines=text.split("\n").map(l=>l.trim()).filter(Boolean);
    const planItems=[];
    lines.forEach(line=>{
      const clean=line.replace(/^[-•*\d.]+\s*/,"").trim();
      if(!clean||clean.length<5) return;
      if(/morning|wake|breakfast|exercise|meditat/i.test(clean)) planItems.push({type:"plan",period:"morning",text:clean});
      else if(/afternoon|lunch|meeting|work|focus session/i.test(clean)) planItems.push({type:"plan",period:"afternoon",text:clean});
      else if(/evening|dinner|wind|review|journal|sleep/i.test(clean)) planItems.push({type:"plan",period:"evening",text:clean});
    });
    return planItems;
  };

  const send=async(text)=>{
    const msg=(text||input).trim();
    if(!msg||loading) return;
    setInput(""); setActions([]);
    const newMsgs=[...msgs,{role:"user",content:msg}];
    setMsgs(newMsgs);
    setLoading(true);

    const ctx=`You are Flow AI — FocusFlow's personal productivity assistant. Sharp, warm, and concise.
Context: ${tasks.filter(t=>!t.done&&!t.archived).length} active tasks, ${habits.length} habits tracked, ${sessions.filter(s=>s.date===todayDs()&&s.type==="focus").reduce((a,s)=>a+s.duration,0)} focus minutes today.

When you have specific actionable items, append this JSON block at the very END of your message:
ACTIONS:[
  {"type":"task","title":"Task title","priority":"high|medium|low","category":"Work|Personal|Health|Study"},
  {"type":"plan","period":"morning|afternoon|evening","text":"Planner item"},
  {"type":"habit","name":"Habit name","icon":"emoji"}
]
Only include ACTIONS when you have concrete items. Max 200 words. Be specific and practical.`;

    try {
      const res=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:900,system:ctx,
          messages:newMsgs.filter(m=>m.role!=="system").map(m=>({role:m.role,content:m.content}))})
      });
      const data=await res.json();
      const full=data.content?.map(c=>c.text||"").join("")||"Sorry, couldn't process that.";
      const match=full.match(/ACTIONS:(\[[\s\S]*?\])/);
      let parsed=[];
      if(match){try{parsed=JSON.parse(match[1]);}catch{}}

      // Auto-detect plan items in the response text if none in ACTIONS
      const cleanText=full.replace(/ACTIONS:\[[\s\S]*?\]/,"").trim();
      if(parsed.length===0&&/plan|schedule|routine|morning|afternoon|evening/i.test(msg)){
        const auto=extractPlanFromText(cleanText);
        if(auto.length>0) parsed=auto;
      }

      setActions(parsed);
      const updatedMsgs=[...newMsgs,{role:"assistant",content:cleanText}];
      setMsgs(updatedMsgs); // auto-persisted via useStore
    } catch {
      setMsgs(p=>[...p,{role:"assistant",content:"Connection error — please try again."}]);
    } finally { setLoading(false); }
  };

  const addToTasks=(a)=>{
    setTasks(p=>[...p,{id:uid(),title:a.title,priority:a.priority||"medium",category:a.category||"Personal",dueDate:null,recurring:null,notes:"",done:false,archived:false,completedAt:null,createdAt:new Date().toISOString()}]);
    setActions(p=>p.filter(x=>x!==a));
  };

  const addToPlanner=(a)=>{
    const td=todayDs(); const per=a.period||"morning";
    setPlanner(p=>({...p,[td]:{morning:[],afternoon:[],evening:[],...(p[td]||{}),[per]:[...((p[td]||{})[per]||[]),{id:uid(),text:a.text,done:false}]}}));
    setActions(p=>p.filter(x=>x!==a));
  };

  // Save plan: adds ALL plan-type actions to planner at once
  const savePlan=(items)=>{
    const td=todayDs();
    const toAdd=items.filter(a=>a.type==="plan");
    if(!toAdd.length) return;
    setPlanner(prev=>{
      const day={morning:[],afternoon:[],evening:[],...(prev[td]||{})};
      toAdd.forEach(a=>{ const per=a.period||"morning"; day[per]=[...day[per],{id:uid(),text:a.text,done:false}]; });
      return {...prev,[td]:day};
    });
    setActions(p=>p.filter(a=>a.type!=="plan"));
  };

  const saveSuggestion=(a)=>{
    setSaved(p=>[...p,{...a,id:uid(),savedAt:new Date().toISOString()}]);
    setActions(p=>p.filter(x=>x!==a));
  };

  const clearChat=()=>{ setMsgs([FLOW_AI_WELCOME]); setActions([]); setConfirmClear(false); };

  const planActions=actions.filter(a=>a.type==="plan");

  return (
    <div style={{padding:"28px 32px",maxWidth:700,display:"flex",flexDirection:"column",height:"calc(100vh - 54px)"}} className="fade-up">

      {/* Header */}
      <div style={{marginBottom:16,flexShrink:0,display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:3}}>
            <div style={{width:28,height:28,borderRadius:8,background:"linear-gradient(135deg,#7c6af7,#a855f7)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Sparkles size={14} color="#fff"/>
            </div>
            <h1 style={{color:"var(--text)",fontSize:22,fontWeight:800,margin:0}}>Flow AI</h1>
          </div>
          <p style={{color:"var(--muted)",fontSize:13}}>Your personal productivity co-pilot · {msgs.length-1} message{msgs.length-1!==1?"s":""} saved</p>
        </div>
        <div style={{display:"flex",gap:7,flexShrink:0}}>
          {!confirmClear
            ? <button className="btn btn-ghost" style={{fontSize:12,display:"flex",alignItems:"center",gap:5,color:"var(--muted)"}} onClick={()=>setConfirmClear(true)}><Trash2 size={12}/>Clear chat</button>
            : <>
                <span style={{color:"var(--muted)",fontSize:12,alignSelf:"center"}}>Delete all history?</span>
                <button className="btn btn-danger" style={{fontSize:12,padding:"5px 12px"}} onClick={clearChat}>Yes, clear</button>
                <button className="btn btn-ghost" style={{fontSize:12,padding:"5px 12px"}} onClick={()=>setConfirmClear(false)}>Cancel</button>
              </>
          }
        </div>
      </div>

      {/* Saved suggestions strip */}
      {savedSuggestions.length>0&&(
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 13px",borderRadius:9,background:"rgba(124,106,247,.08)",border:"1px solid rgba(124,106,247,.2)",marginBottom:12,flexShrink:0}}>
          <Save size={13} color="var(--accent)"/>
          <span style={{color:"var(--accent)",fontSize:12,fontWeight:600}}>{savedSuggestions.length} saved suggestion{savedSuggestions.length>1?"s":""}</span>
          <button onClick={()=>setSaved([])} style={{marginLeft:"auto",background:"none",border:"none",color:"var(--muted)",fontSize:11,fontFamily:"inherit",cursor:"pointer"}}>Clear all</button>
        </div>
      )}

      {/* Messages */}
      <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:14,marginBottom:14,paddingRight:4}}>
        {msgs.map((m,i)=>(
          <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",gap:10}}>
            {m.role==="assistant"&&(
              <div style={{width:30,height:30,borderRadius:9,background:"linear-gradient(135deg,#7c6af7,#a855f7)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2}}>
                <Sparkles size={14} color="#fff"/>
              </div>
            )}
            <div style={{maxWidth:"84%",padding:"11px 15px",fontSize:14,lineHeight:1.75,whiteSpace:"pre-wrap",borderRadius:m.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",background:m.role==="user"?"var(--accent)":"var(--elevated)",color:"var(--text)"}}>
              {m.content}
            </div>
          </div>
        ))}

        {loading&&(
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <div style={{width:30,height:30,borderRadius:9,background:"linear-gradient(135deg,#7c6af7,#a855f7)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Sparkles size={14} color="#fff"/>
            </div>
            <div style={{padding:"11px 16px",background:"var(--elevated)",borderRadius:"16px 16px 16px 4px",display:"flex",gap:5,alignItems:"center"}}>
              {[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:"var(--muted)",animation:"pulse 1.2s infinite",animationDelay:`${i*.2}s`}}/>)}
              <span style={{color:"var(--muted)",fontSize:12,marginLeft:4}}>Flow AI is thinking…</span>
            </div>
          </div>
        )}

        {/* Action cards */}
        {actions.length>0&&(
          <div style={{background:"rgba(124,106,247,.07)",border:"1px solid rgba(124,106,247,.2)",borderRadius:14,padding:16}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
              <p style={{color:"var(--accent)",fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase"}}>✦ Suggested Actions</p>
              {planActions.length>1&&(
                <button className="btn btn-primary" style={{fontSize:11,padding:"4px 12px",display:"flex",alignItems:"center",gap:5}} onClick={()=>savePlan(actions)}>
                  <Calendar size={11}/>Save full plan ({planActions.length} items)
                </button>
              )}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {actions.map((a,i)=>(
                <div key={i} style={{display:"flex",alignItems:"flex-start",gap:11,padding:"10px 13px",background:"var(--surface)",borderRadius:10}}>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:3}}>
                      <span style={{fontSize:10,color:"var(--muted)",fontWeight:700,textTransform:"uppercase"}}>{a.type}</span>
                      {a.priority&&<span className="tag" style={{color:PCFG[a.priority]?.color,background:PCFG[a.priority]?.bg,fontSize:9}}>{a.priority}</span>}
                      {a.period&&<span className="tag" style={{color:"var(--muted)",background:"var(--elevated)",fontSize:9}}>{a.period}</span>}
                    </div>
                    <p style={{color:"var(--text)",fontSize:13}}>{a.title||a.text||a.name}</p>
                  </div>
                  <div style={{display:"flex",gap:5,flexShrink:0,flexWrap:"wrap"}}>
                    {a.type==="task"&&<button className="btn btn-primary" style={{fontSize:11,padding:"4px 10px"}} onClick={()=>addToTasks(a)}>+ Task</button>}
                    {a.type==="plan"&&<button className="btn btn-primary" style={{fontSize:11,padding:"4px 10px"}} onClick={()=>addToPlanner(a)}>+ Plan</button>}
                    <button className="btn btn-ghost" style={{fontSize:11,padding:"4px 10px",display:"flex",alignItems:"center",gap:4}} onClick={()=>saveSuggestion(a)}><Save size={10}/>Save</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Quick prompts — only when conversation is fresh */}
      {msgs.length<=1&&(
        <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:10,flexShrink:0}}>
          {QUICK.map(q=><button key={q} onClick={()=>send(q)} style={{padding:"6px 13px",borderRadius:8,background:"var(--elevated)",color:"var(--muted)",border:"1px solid var(--border)",fontSize:12,fontFamily:"inherit"}}>{q}</button>)}
        </div>
      )}

      {/* Input */}
      <div className="card-lg" style={{padding:"11px 15px",display:"flex",gap:9,alignItems:"flex-end",flexShrink:0}}>
        <textarea value={input} rows={1} onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}
          placeholder="Ask anything about productivity…"
          style={{flex:1,background:"transparent",border:"none",outline:"none",color:"var(--text)",fontSize:14,fontFamily:"inherit",resize:"none",maxHeight:100,lineHeight:1.5}}/>
        <button className="btn btn-primary" onClick={()=>send()} disabled={loading||!input.trim()} style={{opacity:loading||!input.trim()?.4:1,flexShrink:0}}>Send</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  ANALYTICS
// ═══════════════════════════════════════════════════════════════════
function AnalyticsView({tasks,habits,sessions,planner}) {
  const last30=lastNDays(30);
  const last14=lastNDays(14);
  const last7=lastNDays(7);

  // Task completion last 30 days
  const taskData30=last30.map(ds=>tasks.filter(t=>t.completedAt?.startsWith(ds)).length);
  // Focus time last 14 days
  const focusData14=last14.map(ds=>sessions.filter(s=>s.date===ds&&s.type==="focus").reduce((a,s)=>a+s.duration,0));
  // Total stats
  const totalDone=tasks.filter(t=>t.done).length;
  const totalActive=tasks.filter(t=>!t.done&&!t.archived).length;
  const totalFocusMin=sessions.filter(s=>s.type==="focus").reduce((a,s)=>a+s.duration,0);
  const avgFocusPerDay=sessions.length?(totalFocusMin/Math.max(1,[...new Set(sessions.map(s=>s.date))].length)).toFixed(0):0;
  const totalSessions=sessions.filter(s=>s.type==="focus").length;
  const habitsMax=habits.length?Math.max(...habits.map(h=>h.streak||0)):0;
  const bestHabit=habits.find(h=>h.streak===habitsMax);

  // Planner consistency (days with at least 1 item done)
  const plannerDays=last30.filter(ds=>{
    const d=planner[ds]||{}; return Object.values(d).flat().some(i=>i.done);
  }).length;

  // Habit completion rate last 7 days
  const habitRate7=habits.length&&last7.length
    ?Math.round((last7.reduce((a,ds)=>a+habits.filter(h=>(h.completions||[]).includes(ds)).length,0)/(habits.length*last7.length))*100):0;

  const StatCard=({label,value,sub,color="#7c6af7"})=>(
    <div className="card" style={{padding:"16px 18px"}}>
      <p style={{color:"var(--muted)",fontSize:11,fontWeight:600,letterSpacing:.5,textTransform:"uppercase",marginBottom:10}}>{label}</p>
      <p style={{color:color,fontSize:28,fontWeight:800,lineHeight:1}}>{value}</p>
      {sub&&<p style={{color:"var(--muted)",fontSize:12,marginTop:4}}>{sub}</p>}
    </div>
  );

  return (
    <div style={{padding:"28px 32px",maxWidth:860}} className="fade-up">
      <h1 style={{color:"var(--text)",fontSize:22,fontWeight:800,marginBottom:22}}>Analytics</h1>

      {/* Stat grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(155px,1fr))",gap:12,marginBottom:24}}>
        <StatCard label="Tasks Done"      value={totalDone}             sub={`${totalActive} still active`}  color="#7c6af7"/>
        <StatCard label="Focus Sessions"  value={totalSessions}         sub={`${avgFocusPerDay} min avg/day`} color="#e879f9"/>
        <StatCard label="Total Focus"     value={`${totalFocusMin}m`}   sub={`≈ ${(totalFocusMin/60).toFixed(1)} hrs`} color="#22c55e"/>
        <StatCard label="Top Streak"      value={habitsMax}             sub={bestHabit?`${bestHabit.icon} ${bestHabit.name}`:"—"} color="#f59e0b"/>
        <StatCard label="Habit Rate 7d"   value={`${habitRate7}%`}      sub="Completion rate"               color="#6366f1"/>
        <StatCard label="Planner Days"    value={plannerDays}           sub="Days with items done (30d)"     color="#ef4444"/>
      </div>

      {/* Charts */}
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        <div className="card-lg" style={{padding:"18px 20px"}}>
          <p style={{color:"var(--muted)",fontSize:11,fontWeight:600,letterSpacing:.5,textTransform:"uppercase",marginBottom:3}}>Task Completions — Last 30 Days</p>
          <p style={{color:"var(--text)",fontSize:22,fontWeight:700,marginBottom:14}}>{taskData30.reduce((a,v)=>a+v,0)} total</p>
          <MiniChart data={taskData30} color="var(--accent)" h={60}/>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
            <span style={{color:"var(--muted)",fontSize:10}}>{fmtDate(last30[0])}</span>
            <span style={{color:"var(--muted)",fontSize:10}}>Today</span>
          </div>
        </div>

        <div className="card-lg" style={{padding:"18px 20px"}}>
          <p style={{color:"var(--muted)",fontSize:11,fontWeight:600,letterSpacing:.5,textTransform:"uppercase",marginBottom:3}}>Focus Time (min) — Last 14 Days</p>
          <p style={{color:"var(--text)",fontSize:22,fontWeight:700,marginBottom:14}}>{focusData14.reduce((a,v)=>a+v,0)} min total</p>
          <LineChart data={focusData14} color="#e879f9" h={80}/>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
            <span style={{color:"var(--muted)",fontSize:10}}>{fmtDate(last14[0])}</span>
            <span style={{color:"var(--muted)",fontSize:10}}>Today</span>
          </div>
        </div>

        {habits.length>0&&(
          <div className="card-lg" style={{padding:"18px 20px"}}>
            <p style={{color:"var(--muted)",fontSize:11,fontWeight:600,letterSpacing:.5,textTransform:"uppercase",marginBottom:14}}>Habit Heat Map — Last 28 Days</p>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {habits.slice(0,6).map(h=>{
                const days28=lastNDays(28);
                const comp=h.completions||[];
                const rate=Math.round((days28.filter(d=>comp.includes(d)).length/28)*100);
                return (
                  <div key={h.id} style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:14,flexShrink:0}}>{h.icon}</span>
                    <span style={{color:"var(--muted)",fontSize:12,width:100,flexShrink:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h.name}</span>
                    <div style={{flex:1,display:"flex",gap:2}}>
                      {days28.map((ds,i)=>(
                        <div key={i} style={{flex:1,aspectRatio:"1",borderRadius:3,background:comp.includes(ds)?"var(--accent2)":"var(--elevated)",opacity:comp.includes(ds)?1:.35}}/>
                      ))}
                    </div>
                    <span style={{color:"var(--accent2)",fontSize:12,fontWeight:700,flexShrink:0,width:35,textAlign:"right"}}>{rate}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  SETTINGS
// ═══════════════════════════════════════════════════════════════════
function SettingsView({settings,setSettings,tasks,habits,sessions,notes,reminders}) {
  const [exportMsg,setExportMsg]=useState("");

  const exportData=()=>{
    const data={tasks,habits,sessions,notes,reminders,exportedAt:new Date().toISOString()};
    const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a"); a.href=url; a.download="focusflow-backup.json"; a.click();
    URL.revokeObjectURL(url); setExportMsg("Exported!"); setTimeout(()=>setExportMsg(""),2000);
  };

  const totalFocus=sessions.filter(s=>s.type==="focus").reduce((a,s)=>a+s.duration,0);
  const totalDone=tasks.filter(t=>t.done).length;
  const maxStreak=habits.length?Math.max(...habits.map(h=>h.bestStreak||0)):0;

  const Section=({title,children})=>(
    <div className="card-lg" style={{padding:"18px 22px",marginBottom:14}}>
      <p style={{color:"var(--text)",fontSize:14,fontWeight:700,marginBottom:14}}>{title}</p>
      {children}
    </div>
  );

  const Row=({label,sub,right})=>(
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid var(--border)"}}>
      <div><p style={{color:"var(--text)",fontSize:13,fontWeight:500}}>{label}</p>{sub&&<p style={{color:"var(--muted)",fontSize:12,marginTop:2}}>{sub}</p>}</div>
      <div>{right}</div>
    </div>
  );

  return (
    <div style={{padding:"28px 32px",maxWidth:620}} className="fade-up">
      <h1 style={{color:"var(--text)",fontSize:22,fontWeight:800,marginBottom:24}}>Settings</h1>

      <Section title="Appearance">
        <Row label="Theme" sub="Choose light or dark mode" right={
          <div style={{display:"flex",gap:5,background:"var(--elevated)",padding:3,borderRadius:9}}>
            {[{v:"dark",l:"🌙 Dark"},{v:"light",l:"☀️ Light"}].map(({v,l})=>(
              <button key={v} onClick={()=>setSettings(s=>({...s,theme:v}))} style={{padding:"6px 13px",borderRadius:7,border:"none",fontFamily:"inherit",background:settings.theme===v?"var(--accent)":"transparent",color:settings.theme===v?"#fff":"var(--muted)",fontSize:12,fontWeight:settings.theme===v?600:400}}>
                {l}
              </button>
            ))}
          </div>
        }/>
      </Section>

      <Section title="Lifetime Stats">
        {[
          {l:"Tasks completed",v:totalDone},
          {l:"Focus sessions",v:sessions.filter(s=>s.type==="focus").length},
          {l:"Total focus time",v:`${totalFocus} min`},
          {l:"Notes saved",v:notes.length},
          {l:"Habits tracked",v:habits.length},
          {l:"Best streak ever",v:`${maxStreak} days`},
        ].map(({l,v})=>(
          <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid var(--border)"}}>
            <span style={{color:"var(--muted)",fontSize:13}}>{l}</span>
            <span style={{color:"var(--text)",fontSize:13,fontWeight:700}}>{v}</span>
          </div>
        ))}
      </Section>

      <Section title="Notifications">
        <Row label="Browser notifications" sub={`Permission: ${typeof Notification!=="undefined"?Notification.permission:"unavailable"}`} right={
          <Toggle on={settings.notifications} onToggle={()=>{
            if(typeof Notification!=="undefined"&&Notification.permission!=="granted"){
              Notification.requestPermission().then(p=>setSettings(s=>({...s,notifications:p==="granted"})));
            } else setSettings(s=>({...s,notifications:!s.notifications}));
          }}/>
        }/>
      </Section>

      <Section title="Data">
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          <button className="btn btn-ghost" style={{display:"flex",alignItems:"center",gap:7}} onClick={exportData}>
            <Download size={13}/>{exportMsg||"Export Backup"}
          </button>
          <button className="btn btn-danger" onClick={()=>{
            if(window.confirm("Delete ALL FocusFlow data? This cannot be undone.")){
              ["tasks","habits","sessions","notes","planner","reminders","settings","timer_mode","timer_state","timer_cycles","ai_saved"].forEach(k=>DB.del(k));
              window.location.reload();
            }
          }}>Clear All Data</button>
        </div>
        <p style={{color:"var(--muted)",fontSize:12,marginTop:12}}>All data is stored locally in your browser. Export regularly to back it up.</p>
      </Section>
    </div>
  );
}

function TopBar({view,setSidebarOpen}) {
  const nav=NAV.find(n=>n.id===view);
  const [hovered,setHovered]=useState(false);
  const now=useClock();
  const timeStr=now.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",hour12:true});
  const [t,ap]=timeStr.split(" ");
  return (
    <header
      onClick={()=>setSidebarOpen(true)}
      onMouseEnter={()=>setHovered(true)}
      onMouseLeave={()=>setHovered(false)}
      style={{height:52,flexShrink:0,display:"flex",alignItems:"center",gap:13,padding:"0 22px",background:hovered?"rgba(124,106,247,0.06)":"var(--surface)",borderBottom:"1px solid var(--border)",zIndex:30,cursor:"pointer",userSelect:"none",transition:"background .15s ease"}}>
      <div style={{width:34,height:34,borderRadius:10,flexShrink:0,background:"linear-gradient(135deg,#6a57f5,#a44af5 60%,#c03aff)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 3px 14px rgba(120,80,255,.45),inset 0 1px 0 rgba(255,255,255,.18)",pointerEvents:"none"}}>
        <LogoMark size={20}/>
      </div>
      <div style={{display:"flex",alignItems:"baseline",gap:9,pointerEvents:"none"}}>
        <span style={{color:"var(--text)",fontWeight:800,fontSize:15,letterSpacing:"-.4px"}}>FocusFlow</span>
        {nav&&<><span style={{color:"var(--muted)",fontSize:13}}>·</span><span style={{color:"var(--muted)",fontSize:13,fontWeight:500}}>{nav.label}</span></>}
      </div>
      {/* Live clock — right side */}
      <div style={{marginLeft:"auto",display:"flex",alignItems:"baseline",gap:3,pointerEvents:"none",flexShrink:0}}>
        <span style={{color:"var(--text)",fontSize:13,fontWeight:700,letterSpacing:"-0.3px",fontVariantNumeric:"tabular-nums"}}>{t}</span>
        <span style={{color:"var(--accent)",fontSize:9,fontWeight:700}}>{ap}</span>
      </div>
    </header>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  ROOT APP
// ═══════════════════════════════════════════════════════════════════
export default function App() {
  const [view,setView]   = useState("dashboard");
  const [sideOpen,setSD] = useState(false);

  const [tasks,    setTasks]    = useStore("tasks",    []);
  const [habits,   setHabits]   = useStore("habits",   []);
  const [sessions, setSessions] = useStore("sessions", []);
  const [notes,    setNotes]    = useStore("notes",    []);
  const [planner,  setPlanner]  = useStore("planner",  {});
  const [reminders,setRem]      = useStore("reminders",[]);
  const [aiSaved,  setSaved]    = useStore("ai_saved", []);
  const [settings, setSettings] = useStore("settings", {theme:"dark",notifications:false,focusDur:25,breakDur:5,lbDur:15});

  // Load font
  useEffect(()=>{
    if(!document.getElementById("ff-font")){
      const l=document.createElement("link");
      l.id="ff-font"; l.rel="stylesheet";
      l.href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap";
      document.head.appendChild(l);
    }
  },[]);

  // Schedule reminders on mount
  useEffect(()=>{
    if(typeof Notification==="undefined"||Notification.permission!=="granted") return;
    const now=Date.now();
    reminders.filter(r=>!r.done&&new Date(r.datetime).getTime()>now).forEach(r=>{
      const delay=new Date(r.datetime).getTime()-now;
      if(delay<7*24*3600*1000){
        setTimeout(()=>{ try{new Notification(r.title,{body:r.desc||"Reminder from FocusFlow"});}catch{} },delay);
      }
    });
  },[]);

  const theme=settings.theme==="light"?LIGHT:DARK;
  const isDesktop=useIsDesktop();

  const VIEWS={
    dashboard: <Dashboard tasks={tasks} habits={habits} sessions={sessions} notes={notes} planner={planner} reminders={reminders} setView={setView}/>,
    tasks:     <TasksView tasks={tasks} setTasks={setTasks}/>,
    habits:    <HabitsView habits={habits} setHabits={setHabits}/>,
    focus:     <FocusView sessions={sessions} setSessions={setSessions} settings={settings} setSettings={setSettings}/>,
    planner:   <PlannerView planner={planner} setPlanner={setPlanner} tasks={tasks}/>,
    notes:     <NotesView notes={notes} setNotes={setNotes}/>,
    reminders: <RemindersView reminders={reminders} setReminders={setRem}/>,
    ai:        <AIView tasks={tasks} setTasks={setTasks} planner={planner} setPlanner={setPlanner} habits={habits} sessions={sessions} savedSuggestions={aiSaved} setSaved={setSaved}/>,
    analytics: <AnalyticsView tasks={tasks} habits={habits} sessions={sessions} planner={planner}/>,
    settings:  <SettingsView settings={settings} setSettings={setSettings} tasks={tasks} habits={habits} sessions={sessions} notes={notes} reminders={reminders}/>,
  };

  return (
    <>
      <style>{getCSS(theme)}</style>
      {isDesktop ? (
        /* ── DESKTOP: persistent left sidebar + content ── */
        <div style={{display:"flex",flexDirection:"row",height:"100vh",background:"var(--bg)",overflow:"hidden"}}>
          <Sidebar view={view} setView={setView} open={false} setOpen={()=>{}} reminders={reminders} persistent={true}/>
          <main style={{flex:1,overflowY:"auto",background:"var(--bg)"}}>
            {VIEWS[view]}
          </main>
        </div>
      ) : (
        /* ── MOBILE: top bar + overlay drawer ── */
        <div style={{display:"flex",flexDirection:"column",height:"100vh",background:"var(--bg)",overflow:"hidden"}}>
          <TopBar view={view} setSidebarOpen={setSD}/>
          <div style={{flex:1,overflow:"hidden",position:"relative"}}>
            <Sidebar view={view} setView={setView} open={sideOpen} setOpen={setSD} reminders={reminders} persistent={false}/>
            <main style={{height:"100%",overflowY:"auto",background:"var(--bg)"}}>
              {VIEWS[view]}
            </main>
          </div>
        </div>
      )}
    </>
  );
}
