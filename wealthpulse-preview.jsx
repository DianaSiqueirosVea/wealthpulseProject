/**
 * WealthPulse — Personal Finance Dashboard (Preview)
 * Login: demo / demo123
 */
import { useState, useReducer, useContext, createContext, useMemo, useCallback, useEffect } from "react";
import {
  PieChart, Pie, Cell, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, CartesianGrid
} from "recharts";

const CATEGORIES = ["Housing","Food","Transport","Entertainment","Health","Utilities","Shopping","Subscriptions"];
const CAT_ICONS = { Housing:"🏠", Food:"🍽️", Transport:"🚗", Entertainment:"🎬", Health:"💊", Utilities:"⚡", Shopping:"🛍️", Subscriptions:"📺" };
const CAT_COLORS = { Housing:"#6366f1", Food:"#f59e0b", Transport:"#3b82f6", Entertainment:"#ec4899", Health:"#10b981", Utilities:"#8b5cf6", Shopping:"#f97316", Subscriptions:"#14b8a6" };
const SHORT_MONTHS = ["Jan","Feb","Mar"];
const MONTH_NAMES = ["January","February","March"];
const MONTHLY_INCOME = 6500;

function generateTransactions() {
  const descs = {
    Housing:["Rent payment","Home insurance","Maintenance fee","Cleaning service"],
    Food:["Whole Foods","Trader Joe's","Restaurant dinner","Coffee shop","Lunch delivery","Grocery run","Bakery"],
    Transport:["Gas station","Uber ride","Metro pass","Parking garage","Car wash","Toll fees"],
    Entertainment:["Movie tickets","Concert tickets","Streaming service","Book purchase","Museum entry"],
    Health:["Pharmacy","Gym membership","Doctor copay","Vitamins","Dental visit"],
    Utilities:["Electric bill","Water bill","Internet","Phone bill","Gas bill"],
    Shopping:["Amazon order","Clothing store","Electronics","Home decor","Gift purchase"],
    Subscriptions:["Netflix","Spotify","Cloud storage","News subscription","Software license"]
  };
  const ranges = { Housing:[1200,1800], Food:[8,120], Transport:[5,80], Entertainment:[10,60], Health:[15,200], Utilities:[30,150], Shopping:[15,250], Subscriptions:[8,50] };
  const txns = [];
  let id = 1;
  [0,1,2].forEach(mi => {
    const daysInMonth = new Date(2026,mi+1,0).getDate();
    CATEGORIES.forEach(cat => {
      const count = cat==="Housing"?1:cat==="Utilities"?2:cat==="Subscriptions"?2:Math.floor(Math.random()*4)+2;
      for(let i=0;i<count;i++){
        const day=Math.floor(Math.random()*daysInMonth)+1;
        const [lo,hi]=ranges[cat];
        const amount=+(lo+Math.random()*(hi-lo)).toFixed(2);
        const desc=descs[cat][Math.floor(Math.random()*descs[cat].length)];
        txns.push({id:id++,date:`2026-${String(mi+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`,description:desc,amount,category:cat});
      }
    });
  });
  return txns.sort((a,b)=>b.date.localeCompare(a.date));
}

const FUNDS = [
  {id:"uslc",name:"US Large Cap Index",type:"Index",risk:"Medium",expenseRatio:0.03,monthlyReturns:[1.2,0.8,-0.5,1.5,2.0,0.3,-1.0,1.8,0.6,1.1,-0.3,1.4]},
  {id:"intl",name:"International Equity",type:"Equity",risk:"High",expenseRatio:0.12,monthlyReturns:[0.9,-0.7,1.3,0.5,1.8,-1.2,2.1,0.4,-0.8,1.6,0.7,1.0]},
  {id:"bond",name:"Bond Fund",type:"Fixed Income",risk:"Low",expenseRatio:0.05,monthlyReturns:[0.3,0.4,0.2,0.5,0.3,0.4,0.2,0.3,0.5,0.4,0.3,0.2]},
  {id:"tech",name:"Tech Growth",type:"Sector",risk:"High",expenseRatio:0.15,monthlyReturns:[2.5,1.2,-2.0,3.1,1.5,-0.8,2.8,-1.5,2.0,1.8,-0.5,3.0]},
  {id:"reit",name:"Real Estate REIT",type:"Real Estate",risk:"Medium",expenseRatio:0.08,monthlyReturns:[0.8,0.5,0.9,-0.3,1.2,0.6,0.4,1.0,-0.2,0.7,0.8,0.5]},
  {id:"emrg",name:"Emerging Markets",type:"Equity",risk:"High",expenseRatio:0.18,monthlyReturns:[1.5,-1.0,2.0,-0.5,1.8,-1.5,2.5,0.3,-0.7,1.9,1.2,-0.8]},
];

const FUND_COLORS=["#10b981","#6366f1","#f59e0b","#ec4899","#3b82f6","#f97316"];
const RISK_COLORS={Low:"color: #34d399; background: rgba(52,211,153,0.1)",Medium:"color: #fbbf24; background: rgba(251,191,36,0.1)",High:"color: #f87171; background: rgba(248,113,113,0.1)"};
const fmt=n=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(n);
const fmtPct=n=>`${n>=0?"+":""}${n.toFixed(2)}%`;
const getMonthTxns=(txns,m)=>{const ms=String(m+1).padStart(2,"0");return txns.filter(t=>t.date.startsWith(`2026-${ms}`))};
const getCatTotal=(txns,cat)=>txns.filter(t=>t.category===cat).reduce((s,t)=>s+t.amount,0);
const getFundReturn=(fund,months)=>fund.monthlyReturns.slice(-months).reduce((acc,r)=>acc*(1+r/100),1)-1;

const AppContext=createContext();
const init={isAuth:false,user:{name:"Alex Morgan",email:"alex@wealthpulse.demo",currency:"USD"},transactions:generateTransactions(),budgets:{Housing:2000,Food:600,Transport:300,Entertainment:200,Health:300,Utilities:400,Shopping:400,Subscriptions:150},selectedFunds:[],portfolioAlloc:{},activeTab:"dashboard",selectedMonth:2};

function reducer(s,a){switch(a.type){
  case "LOGIN":return{...s,isAuth:true};
  case "LOGOUT":return{...init,transactions:generateTransactions()};
  case "SET_TAB":return{...s,activeTab:a.payload};
  case "SET_MONTH":return{...s,selectedMonth:a.payload};
  case "ADD_TXN":return{...s,transactions:[a.payload,...s.transactions].sort((a,b)=>b.date.localeCompare(a.date))};
  case "SET_BUDGET":return{...s,budgets:{...s.budgets,[a.payload.cat]:a.payload.amt}};
  case "UPDATE_PROFILE":return{...s,user:{...s.user,...a.payload}};
  case "TOGGLE_FUND":{const id=a.payload;const sel=s.selectedFunds.includes(id)?s.selectedFunds.filter(f=>f!==id):s.selectedFunds.length<3?[...s.selectedFunds,id]:s.selectedFunds;return{...s,selectedFunds:sel}};
  default:return s;
}}

/* --- Shared UI --- */
const Card=({children,className="",onClick})=>(
  <div onClick={onClick} className={className} style={{borderRadius:16,border:"1px solid rgba(255,255,255,0.06)",background:"linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))",backdropFilter:"blur(20px)",boxShadow:"0 8px 32px rgba(0,0,0,0.3)",padding:20,...(onClick?{cursor:"pointer"}:{})}}>
    {children}
  </div>
);

const ChartTip=({active,payload,label,formatter})=>{
  if(!active||!payload?.length)return null;
  return(<div style={{background:"rgba(30,41,59,0.95)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"6px 10px",fontSize:11}}>
    {label&&<p style={{color:"#94a3b8",marginBottom:4}}>{label}</p>}
    {payload.map((p,i)=><p key={i} style={{color:p.color||p.fill,fontWeight:600}}>{p.name}: {formatter?formatter(p.value):p.value}</p>)}
  </div>);
};

function MonthBtn({m}){
  const{state,dispatch}=useContext(AppContext);
  return <button onClick={()=>dispatch({type:"SET_MONTH",payload:m})} style={{padding:"6px 16px",borderRadius:8,fontSize:12,fontWeight:500,transition:"all 0.2s",background:state.selectedMonth===m?"rgba(16,185,129,0.15)":"transparent",color:state.selectedMonth===m?"#34d399":"#94a3b8",border:"none",cursor:"pointer"}}>{SHORT_MONTHS[m]}</button>;
}

/* --- LOGIN --- */
function LoginScreen({onLogin}){
  const[user,setUser]=useState("");const[pass,setPass]=useState("");const[error,setError]=useState("");const[show,setShow]=useState(false);
  useEffect(()=>{setTimeout(()=>setShow(true),50)},[]);
  const submit=()=>{if(user==="demo"&&pass==="demo123")onLogin();else setError("Invalid credentials. Use demo / demo123")};
  const inp={width:"100%",padding:"10px 16px",borderRadius:12,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",color:"#fff",fontSize:14,outline:"none"};
  return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#0a0e1a",fontFamily:"'DM Sans',system-ui,sans-serif",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:-160,left:-160,width:384,height:384,background:"rgba(16,185,129,0.08)",borderRadius:"50%",filter:"blur(120px)"}}/>
      <div style={{position:"absolute",bottom:-160,right:-160,width:384,height:384,background:"rgba(99,102,241,0.08)",borderRadius:"50%",filter:"blur(120px)"}}/>
      <div style={{position:"relative",zIndex:10,width:"100%",maxWidth:420,padding:"0 24px",opacity:show?1:0,transform:show?"translateY(0)":"translateY(32px)",transition:"all 0.7s"}}>
        <Card>
          <div style={{textAlign:"center",marginBottom:32}}>
            <div style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:64,height:64,borderRadius:16,background:"linear-gradient(135deg,#10b981,#14b8a6)",marginBottom:16,boxShadow:"0 4px 20px rgba(16,185,129,0.3)"}}>
              <span style={{fontSize:28}}>📈</span>
            </div>
            <h1 style={{fontSize:24,fontWeight:700,color:"#fff",margin:0}}>WealthPulse</h1>
            <p style={{fontSize:13,color:"#64748b",marginTop:4}}>Personal Finance Dashboard</p>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div>
              <label style={{fontSize:10,color:"#64748b",textTransform:"uppercase",letterSpacing:1.5,fontWeight:600,display:"block",marginBottom:6}}>Username</label>
              <input value={user} onChange={e=>{setUser(e.target.value);setError("")}} placeholder="demo" style={inp} onKeyDown={e=>e.key==="Enter"&&submit()} />
            </div>
            <div>
              <label style={{fontSize:10,color:"#64748b",textTransform:"uppercase",letterSpacing:1.5,fontWeight:600,display:"block",marginBottom:6}}>Password</label>
              <input type="password" value={pass} onChange={e=>{setPass(e.target.value);setError("")}} placeholder="demo123" style={inp} onKeyDown={e=>e.key==="Enter"&&submit()} />
            </div>
            {error&&<p style={{color:"#f87171",fontSize:12,textAlign:"center",margin:0}}>{error}</p>}
            <button onClick={submit} style={{width:"100%",padding:"10px",borderRadius:12,background:"linear-gradient(135deg,#059669,#0d9488)",color:"#fff",fontWeight:600,fontSize:14,border:"none",cursor:"pointer",boxShadow:"0 4px 20px rgba(16,185,129,0.25)"}}>Sign In</button>
          </div>
          <p style={{textAlign:"center",fontSize:10,color:"#475569",marginTop:24}}>Credentials: <span style={{color:"#94a3b8"}}>demo</span> / <span style={{color:"#94a3b8"}}>demo123</span></p>
        </Card>
      </div>
    </div>
  );
}

/* --- SIDEBAR --- */
function Sidebar({activeTab,setTab,collapsed,setCollapsed,onLogout}){
  const items=[
    {id:"dashboard",label:"Dashboard",emoji:"🏠"},
    {id:"expenses",label:"Expenses",emoji:"🧾"},
    {id:"investments",label:"Investments",emoji:"📈"},
    {id:"budgets",label:"Budgets",emoji:"🎯"},
    {id:"settings",label:"Settings",emoji:"⚙️"},
  ];
  return(
    <aside style={{position:"fixed",top:0,left:0,height:"100%",zIndex:30,display:"flex",flexDirection:"column",borderRight:"1px solid rgba(255,255,255,0.06)",background:"rgba(11,15,26,0.85)",backdropFilter:"blur(24px)",transition:"width 0.3s",width:collapsed?68:220,overflow:"hidden"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"0 16px",height:56,borderBottom:"1px solid rgba(255,255,255,0.06)",flexShrink:0}}>
        <div style={{width:36,height:36,borderRadius:12,background:"linear-gradient(135deg,#10b981,#14b8a6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0,boxShadow:"0 2px 12px rgba(16,185,129,0.25)"}}>📈</div>
        {!collapsed&&<span style={{color:"#fff",fontWeight:700,fontSize:17,whiteSpace:"nowrap"}}>WealthPulse</span>}
      </div>
      <nav style={{flex:1,padding:"12px 8px",display:"flex",flexDirection:"column",gap:2}}>
        {items.map(item=>(
          <button key={item.id} onClick={()=>setTab(item.id)} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",borderRadius:12,fontSize:13,fontWeight:500,border:"none",cursor:"pointer",transition:"all 0.2s",width:"100%",textAlign:"left",background:activeTab===item.id?"rgba(16,185,129,0.1)":"transparent",color:activeTab===item.id?"#34d399":"#94a3b8"}}>
            <span style={{fontSize:16,flexShrink:0}}>{item.emoji}</span>
            {!collapsed&&<span>{item.label}</span>}
          </button>
        ))}
      </nav>
      <div style={{borderTop:"1px solid rgba(255,255,255,0.06)",padding:8,display:"flex",flexDirection:"column",gap:4}}>
        <button onClick={()=>setCollapsed(!collapsed)} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"8px 12px",borderRadius:12,color:"#64748b",background:"transparent",border:"none",cursor:"pointer",fontSize:11,width:"100%"}}>
          {collapsed?"→":"← Collapse"}
        </button>
        <button onClick={onLogout} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"8px 12px",borderRadius:12,color:"#64748b",background:"transparent",border:"none",cursor:"pointer",fontSize:12,width:"100%"}}>
          🚪{!collapsed&&" Sign Out"}
        </button>
      </div>
    </aside>
  );
}

/* --- STAT CARD --- */
function StatCard({label,value,sub,positive,icon}){
  return(<Card><div style={{display:"flex",alignItems:"start",gap:12}}>
    <div style={{width:44,height:44,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0,background:positive===true?"rgba(16,185,129,0.12)":positive===false?"rgba(239,68,68,0.12)":"rgba(99,102,241,0.12)"}}>{icon}</div>
    <div style={{minWidth:0}}>
      <p style={{fontSize:10,textTransform:"uppercase",letterSpacing:2,color:"#64748b",fontWeight:500,margin:0}}>{label}</p>
      <p style={{fontSize:20,fontWeight:700,color:"#fff",margin:"2px 0 0"}}>{value}</p>
      {sub&&<p style={{fontSize:11,margin:"2px 0 0",color:positive===true?"#34d399":positive===false?"#f87171":"#94a3b8"}}>{sub}</p>}
    </div>
  </div></Card>);
}

/* --- DASHBOARD --- */
function DashboardTab(){
  const{state}=useContext(AppContext);
  const{transactions,selectedMonth,budgets}=state;
  const mt=useMemo(()=>getMonthTxns(transactions,selectedMonth),[transactions,selectedMonth]);
  const pt=useMemo(()=>selectedMonth>0?getMonthTxns(transactions,selectedMonth-1):[],[transactions,selectedMonth]);
  const totalSpent=mt.reduce((s,t)=>s+t.amount,0);
  const prevSpent=pt.reduce((s,t)=>s+t.amount,0);
  const net=MONTHLY_INCOME-totalSpent;
  const chg=prevSpent?((totalSpent-prevSpent)/prevSpent*100):0;
  const catData=CATEGORIES.map(c=>({name:c,value:+getCatTotal(mt,c).toFixed(2),color:CAT_COLORS[c]})).filter(d=>d.value>0);
  const dailyCum=useMemo(()=>{const days=new Date(2026,selectedMonth+1,0).getDate();const dt={};mt.forEach(t=>{const d=parseInt(t.date.slice(-2));dt[d]=(dt[d]||0)+t.amount});let cum=0;return Array.from({length:days},(_,i)=>{cum+=(dt[i+1]||0);return{day:i+1,amount:+cum.toFixed(2)}})},[mt,selectedMonth]);
  const mComp=[0,1,2].map(m=>({month:SHORT_MONTHS[m],total:+getMonthTxns(transactions,m).reduce((s,t)=>s+t.amount,0).toFixed(2),income:MONTHLY_INCOME}));
  const budgetAlerts=CATEGORIES.map(cat=>{const spent=getCatTotal(mt,cat);const budget=budgets[cat]||0;return{cat,spent,budget,pct:budget?(spent/budget*100):0}}).filter(b=>b.pct>50).sort((a,b)=>b.pct-a.pct).slice(0,4);

  return(<div style={{display:"flex",flexDirection:"column",gap:20}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
      <h2 style={{fontSize:24,fontWeight:700,color:"#fff",margin:0}}>Overview</h2>
      <div style={{display:"flex",background:"rgba(255,255,255,0.04)",borderRadius:12,padding:4,border:"1px solid rgba(255,255,255,0.06)"}}>{[0,1,2].map(m=><MonthBtn key={m} m={m}/>)}</div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:16}}>
      <StatCard label="Monthly Income" value={fmt(MONTHLY_INCOME)} icon="💰"/>
      <StatCard label="Total Spent" value={fmt(totalSpent)} sub={`${chg>=0?"↑":"↓"} ${Math.abs(chg).toFixed(1)}% vs last month`} positive={chg<=0} icon="💸"/>
      <StatCard label="Net Savings" value={fmt(net)} positive={net>0} icon="🏦"/>
      <StatCard label="Transactions" value={mt.length} sub={`across ${catData.length} categories`} icon="📊"/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:16}}>
      <Card>
        <p style={{fontSize:13,fontWeight:600,color:"#cbd5e1",marginBottom:16}}>Spending by Category</p>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart><Pie data={catData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" stroke="none">{catData.map((d,i)=><Cell key={i} fill={d.color}/>)}</Pie><Tooltip content={<ChartTip formatter={fmt}/>}/></PieChart>
        </ResponsiveContainer>
        <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:8}}>{catData.map(d=><span key={d.name} style={{display:"flex",alignItems:"center",gap:4,fontSize:10,color:"#94a3b8"}}><span style={{width:8,height:8,borderRadius:4,background:d.color,display:"inline-block"}}/>{d.name}</span>)}</div>
      </Card>
      <Card>
        <p style={{fontSize:13,fontWeight:600,color:"#cbd5e1",marginBottom:16}}>Cumulative Spending</p>
        <ResponsiveContainer width="100%" height={230}>
          <AreaChart data={dailyCum}>
            <defs><linearGradient id="cg1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
            <XAxis dataKey="day" tick={{fill:"#64748b",fontSize:10}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fill:"#64748b",fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`$${(v/1000).toFixed(1)}k`}/>
            <Tooltip content={<ChartTip formatter={fmt}/>}/>
            <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} fill="url(#cg1)" name="Spent"/>
          </AreaChart>
        </ResponsiveContainer>
      </Card>
      <Card>
        <p style={{fontSize:13,fontWeight:600,color:"#cbd5e1",marginBottom:16}}>Monthly Comparison</p>
        <ResponsiveContainer width="100%" height={230}>
          <BarChart data={mComp} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
            <XAxis dataKey="month" tick={{fill:"#64748b",fontSize:11}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fill:"#64748b",fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`$${(v/1000).toFixed(1)}k`}/>
            <Tooltip content={<ChartTip formatter={fmt}/>}/>
            <Bar dataKey="total" fill="#6366f1" radius={[6,6,0,0]} name="Spending"/>
            <Bar dataKey="income" fill="#10b981" radius={[6,6,0,0]} name="Income" opacity={0.4}/>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
    {budgetAlerts.length>0&&<Card>
      <p style={{fontSize:13,fontWeight:600,color:"#cbd5e1",marginBottom:12}}>Budget Alerts</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:12}}>
        {budgetAlerts.map(b=><div key={b.cat} style={{display:"flex",alignItems:"center",gap:12,padding:12,borderRadius:12,background:"rgba(255,255,255,0.02)"}}>
          <span style={{fontSize:18}}>{CAT_ICONS[b.cat]}</span>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:4}}>
              <span style={{color:"#e2e8f0",fontWeight:500}}>{b.cat}</span>
              <span style={{color:b.pct>90?"#f87171":b.pct>70?"#fbbf24":"#94a3b8"}}>{fmt(b.spent)} / {fmt(b.budget)}</span>
            </div>
            <div style={{width:"100%",height:6,borderRadius:3,background:"rgba(255,255,255,0.06)",overflow:"hidden"}}>
              <div style={{height:"100%",borderRadius:3,transition:"all 0.5s",width:`${Math.min(b.pct,100)}%`,background:b.pct>90?"#ef4444":b.pct>70?"#f59e0b":"#10b981",boxShadow:b.pct>90?"0 0 8px rgba(239,68,68,0.4)":"none"}}/>
            </div>
          </div>
        </div>)}
      </div>
    </Card>}
    <Card>
      <p style={{fontSize:13,fontWeight:600,color:"#cbd5e1",marginBottom:12}}>Recent Transactions</p>
      {mt.slice(0,6).map(t=><div key={t.id} style={{display:"flex",alignItems:"center",gap:12,padding:"8px 4px",borderBottom:"1px solid rgba(255,255,255,0.03)"}}>
        <span style={{fontSize:16}}>{CAT_ICONS[t.category]}</span>
        <div style={{flex:1,minWidth:0}}>
          <p style={{fontSize:13,color:"#fff",margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.description}</p>
          <p style={{fontSize:10,color:"#64748b",margin:0}}>{t.category} · {t.date}</p>
        </div>
        <span style={{fontSize:13,fontWeight:600,color:"#f87171",fontVariantNumeric:"tabular-nums"}}>-{fmt(t.amount)}</span>
      </div>)}
    </Card>
  </div>);
}

/* --- EXPENSES --- */
function ExpensesTab(){
  const{state,dispatch}=useContext(AppContext);
  const[search,setSearch]=useState("");const[catF,setCatF]=useState("All");const[sortBy,setSortBy]=useState("date");const[sortDir,setSortDir]=useState("desc");const[showForm,setShowForm]=useState(false);
  const[fDate,setFDate]=useState("2026-03-15");const[fDesc,setFDesc]=useState("");const[fAmt,setFAmt]=useState("");const[fCat,setFCat]=useState("Food");
  const mt=useMemo(()=>getMonthTxns(state.transactions,state.selectedMonth),[state.transactions,state.selectedMonth]);
  const filtered=useMemo(()=>{let l=[...mt];if(catF!=="All")l=l.filter(t=>t.category===catF);if(search){const q=search.toLowerCase();l=l.filter(t=>t.description.toLowerCase().includes(q)||t.category.toLowerCase().includes(q)||t.date.includes(q))}l.sort((a,b)=>{if(sortBy==="date")return sortDir==="desc"?b.date.localeCompare(a.date):a.date.localeCompare(b.date);if(sortBy==="amount")return sortDir==="desc"?b.amount-a.amount:a.amount-b.amount;return 0});return l},[mt,catF,search,sortBy,sortDir]);
  const handleAdd=()=>{if(!fDesc||!fAmt)return;dispatch({type:"ADD_TXN",payload:{id:Date.now(),date:fDate,description:fDesc,amount:parseFloat(fAmt),category:fCat}});setFDesc("");setFAmt("");setShowForm(false)};
  const inp={padding:"8px 12px",borderRadius:12,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",color:"#fff",fontSize:13,outline:"none",minWidth:0};

  return(<div style={{display:"flex",flexDirection:"column",gap:16}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
      <h2 style={{fontSize:24,fontWeight:700,color:"#fff",margin:0}}>Expenses</h2>
      <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
        <div style={{display:"flex",background:"rgba(255,255,255,0.04)",borderRadius:12,padding:4,border:"1px solid rgba(255,255,255,0.06)"}}>{[0,1,2].map(m=><MonthBtn key={m} m={m}/>)}</div>
        <button onClick={()=>setShowForm(!showForm)} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 16px",borderRadius:12,background:"#059669",color:"#fff",fontSize:13,fontWeight:600,border:"none",cursor:"pointer"}}>+ Add Expense</button>
      </div>
    </div>
    {showForm&&<Card>
      <p style={{fontSize:13,fontWeight:600,color:"#cbd5e1",marginBottom:12}}>New Expense</p>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
        <input type="date" value={fDate} onChange={e=>setFDate(e.target.value)} style={{...inp,flex:"1 1 120px"}}/>
        <input value={fDesc} onChange={e=>setFDesc(e.target.value)} placeholder="Description" style={{...inp,flex:"2 1 150px"}}/>
        <input type="number" value={fAmt} onChange={e=>setFAmt(e.target.value)} placeholder="Amount" style={{...inp,flex:"1 1 100px"}}/>
        <select value={fCat} onChange={e=>setFCat(e.target.value)} style={{...inp,flex:"1 1 120px"}}>{CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}</select>
        <button onClick={handleAdd} style={{padding:"8px 20px",borderRadius:12,background:"#059669",color:"#fff",fontSize:13,fontWeight:600,border:"none",cursor:"pointer"}}>Save</button>
      </div>
    </Card>}
    <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search transactions…" style={{...inp,flex:"1 1 200px",maxWidth:300}}/>
      <select value={catF} onChange={e=>setCatF(e.target.value)} style={{...inp}}><option value="All">All Categories</option>{CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}</select>
      <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{...inp}}><option value="date">Sort: Date</option><option value="amount">Sort: Amount</option></select>
      <button onClick={()=>setSortDir(d=>d==="desc"?"asc":"desc")} style={{...inp,cursor:"pointer",background:"rgba(255,255,255,0.06)"}}>{sortDir==="desc"?"↓":"↑"}</button>
    </div>
    <Card className="!p-0" style={{padding:0,overflow:"hidden"}}>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",fontSize:13,borderCollapse:"collapse"}}>
          <thead><tr style={{borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
            <th style={{textAlign:"left",padding:"10px 16px",fontSize:10,textTransform:"uppercase",letterSpacing:2,color:"#64748b",fontWeight:500}}>Date</th>
            <th style={{textAlign:"left",padding:"10px 16px",fontSize:10,textTransform:"uppercase",letterSpacing:2,color:"#64748b",fontWeight:500}}>Description</th>
            <th style={{textAlign:"left",padding:"10px 16px",fontSize:10,textTransform:"uppercase",letterSpacing:2,color:"#64748b",fontWeight:500}}>Category</th>
            <th style={{textAlign:"right",padding:"10px 16px",fontSize:10,textTransform:"uppercase",letterSpacing:2,color:"#64748b",fontWeight:500}}>Amount</th>
          </tr></thead>
          <tbody>
            {filtered.map(t=><tr key={t.id} style={{borderBottom:"1px solid rgba(255,255,255,0.03)"}}>
              <td style={{padding:"10px 16px",color:"#94a3b8",fontVariantNumeric:"tabular-nums",whiteSpace:"nowrap"}}>{t.date}</td>
              <td style={{padding:"10px 16px",color:"#fff"}}>{t.description}</td>
              <td style={{padding:"10px 16px"}}><span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"3px 8px",borderRadius:8,fontSize:11,fontWeight:500,background:`${CAT_COLORS[t.category]}20`,color:CAT_COLORS[t.category]}}>{CAT_ICONS[t.category]} {t.category}</span></td>
              <td style={{padding:"10px 16px",textAlign:"right",color:"#f87171",fontWeight:600,fontVariantNumeric:"tabular-nums"}}>-{fmt(t.amount)}</td>
            </tr>)}
            {filtered.length===0&&<tr><td colSpan={4} style={{padding:"48px 16px",textAlign:"center",color:"#64748b"}}>No transactions found</td></tr>}
          </tbody>
        </table>
      </div>
      <div style={{padding:"10px 16px",borderTop:"1px solid rgba(255,255,255,0.06)",display:"flex",justifyContent:"space-between",fontSize:12,color:"#94a3b8"}}>
        <span>{filtered.length} transactions</span>
        <span>Total: <strong style={{color:"#fff"}}>{fmt(filtered.reduce((s,t)=>s+t.amount,0))}</strong></span>
      </div>
    </Card>
  </div>);
}

/* --- INVESTMENTS --- */
function InvestmentsTab(){
  const{state,dispatch}=useContext(AppContext);
  const[search,setSearch]=useState("");const[section,setSection]=useState("funds");
  const[calcFund,setCalcFund]=useState(FUNDS[0].id);const[calcAmt,setCalcAmt]=useState(10000);const[calcYrs,setCalcYrs]=useState(5);
  const[alloc,setAlloc]=useState(()=>{const o={};FUNDS.forEach(f=>o[f.id]=0);return o});
  const inp={padding:"8px 12px",borderRadius:12,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",color:"#fff",fontSize:13,outline:"none",width:"100%"};
  const filteredF=useMemo(()=>search?FUNDS.filter(f=>f.name.toLowerCase().includes(search.toLowerCase())||f.type.toLowerCase().includes(search.toLowerCase())):FUNDS,[search]);
  const FULL_MONTHS=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const compData=useMemo(()=>{if(!state.selectedFunds.length)return[];return Array.from({length:12},(_,i)=>{const p={month:FULL_MONTHS[i]};state.selectedFunds.forEach(fid=>{const f=FUNDS.find(x=>x.id===fid);p[f.name]=+((f.monthlyReturns.slice(0,i+1).reduce((a,r)=>a*(1+r/100),1)-1)*100).toFixed(2)});return p})},[state.selectedFunds]);
  const projData=useMemo(()=>{const f=FUNDS.find(x=>x.id===calcFund);const avg=f.monthlyReturns.reduce((s,r)=>s+r,0)/12/100;return Array.from({length:calcYrs+1},(_,y)=>({year:`Yr ${y}`,value:+(calcAmt*Math.pow(1+avg,y*12)).toFixed(2)}))},[calcFund,calcAmt,calcYrs]);
  const allocTotal=Object.values(alloc).reduce((s,v)=>s+v,0);
  const pieData=FUNDS.filter(f=>alloc[f.id]>0).map((f,i)=>({name:f.name,value:alloc[f.id],color:FUND_COLORS[i]}));
  const blended=useMemo(()=>{let t=0;FUNDS.forEach(f=>{if(alloc[f.id]>0){t+=(f.monthlyReturns.reduce((a,r)=>a*(1+r/100),1)-1)*(alloc[f.id]/100)}});return t*100},[alloc]);

  return(<div style={{display:"flex",flexDirection:"column",gap:16}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
      <h2 style={{fontSize:24,fontWeight:700,color:"#fff",margin:0}}>Investments</h2>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search funds…" style={{...inp,maxWidth:250}}/>
    </div>
    <div style={{display:"flex",gap:4,background:"rgba(255,255,255,0.04)",borderRadius:12,padding:4,border:"1px solid rgba(255,255,255,0.06)",overflowX:"auto"}}>
      {["funds","compare","calculator","portfolio"].map(t=><button key={t} onClick={()=>setSection(t)} style={{padding:"8px 16px",borderRadius:8,fontSize:12,fontWeight:500,border:"none",cursor:"pointer",whiteSpace:"nowrap",background:section===t?"rgba(16,185,129,0.12)":"transparent",color:section===t?"#34d399":"#94a3b8"}}>{t==="funds"?"Fund Cards":t==="compare"?"Compare":t==="calculator"?"Calculator":"Portfolio"}</button>)}
    </div>
    {section==="funds"&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:16}}>
      {filteredF.map((f,idx)=>{const r1=getFundReturn(f,1)*100,r3=getFundReturn(f,3)*100,r12=getFundReturn(f,12)*100;const sel=state.selectedFunds.includes(f.id);
        return(<Card key={f.id} onClick={()=>dispatch({type:"TOGGLE_FUND",payload:f.id})} style={{padding:20,borderRadius:16,border:`1px solid ${sel?"rgba(16,185,129,0.3)":"rgba(255,255,255,0.06)"}`,background:"linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))",backdropFilter:"blur(20px)",boxShadow:sel?"0 0 20px rgba(16,185,129,0.1)":"0 8px 32px rgba(0,0,0,0.3)",cursor:"pointer",transition:"all 0.2s"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
            <div><p style={{color:"#fff",fontWeight:600,fontSize:14,margin:0}}>{f.name}</p><p style={{fontSize:10,color:"#64748b",textTransform:"uppercase",letterSpacing:1,margin:"2px 0 0"}}>{f.type}</p></div>
            <span style={{fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:8,...Object.fromEntries(RISK_COLORS[f.risk].split(";").map(s=>s.trim().split(":").map(x=>x.trim())))}}>{f.risk}</span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
            {[["1M",r1],["3M",r3],["12M",r12]].map(([l,r])=><div key={l} style={{textAlign:"center",padding:8,borderRadius:8,background:"rgba(255,255,255,0.03)"}}><p style={{fontSize:10,color:"#64748b",margin:0}}>{l}</p><p style={{fontSize:14,fontWeight:700,color:r>=0?"#34d399":"#f87171",margin:0}}>{fmtPct(r)}</p></div>)}
          </div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#64748b"}}><span>ER: {f.expenseRatio}%</span>{sel&&<span style={{color:"#34d399",fontWeight:600}}>✓ Selected</span>}</div>
          <div style={{marginTop:12,height:48}}><ResponsiveContainer width="100%" height="100%"><AreaChart data={f.monthlyReturns.map((r,i)=>({m:i,v:f.monthlyReturns.slice(0,i+1).reduce((a,x)=>a*(1+x/100),1)}))}><defs><linearGradient id={`sp-${f.id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={FUND_COLORS[idx]} stopOpacity={0.3}/><stop offset="95%" stopColor={FUND_COLORS[idx]} stopOpacity={0}/></linearGradient></defs><Area type="monotone" dataKey="v" stroke={FUND_COLORS[idx]} strokeWidth={1.5} fill={`url(#sp-${f.id})`} dot={false}/></AreaChart></ResponsiveContainer></div>
        </Card>)
      })}
    </div>}
    {section==="compare"&&<Card>
      <p style={{fontSize:13,fontWeight:600,color:"#cbd5e1",margin:"0 0 4px"}}>Fund Comparison (12-Month)</p>
      <p style={{fontSize:11,color:"#64748b",margin:"0 0 16px"}}>Select up to 3 funds from Fund Cards</p>
      {state.selectedFunds.length===0?<div style={{padding:64,textAlign:"center",color:"#64748b",fontSize:13}}>Select funds to compare</div>:
      <ResponsiveContainer width="100%" height={300}><LineChart data={compData}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/><XAxis dataKey="month" tick={{fill:"#64748b",fontSize:10}} axisLine={false} tickLine={false}/><YAxis tick={{fill:"#64748b",fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`${v}%`}/><Tooltip content={<ChartTip formatter={v=>`${v.toFixed(2)}%`}/>}/><Legend wrapperStyle={{fontSize:10,color:"#94a3b8"}}/>{state.selectedFunds.map((fid,i)=>{const f=FUNDS.find(x=>x.id===fid);return<Line key={fid} type="monotone" dataKey={f.name} stroke={FUND_COLORS[i]} strokeWidth={2} dot={false}/>})}</LineChart></ResponsiveContainer>}
    </Card>}
    {section==="calculator"&&<Card>
      <p style={{fontSize:13,fontWeight:600,color:"#cbd5e1",marginBottom:16}}>Hypothetical Growth Calculator</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12,marginBottom:20}}>
        <div><label style={{fontSize:10,color:"#64748b",textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:4}}>Fund</label><select value={calcFund} onChange={e=>setCalcFund(e.target.value)} style={inp}>{FUNDS.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select></div>
        <div><label style={{fontSize:10,color:"#64748b",textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:4}}>Amount ($)</label><input type="number" value={calcAmt} onChange={e=>setCalcAmt(+e.target.value)} style={inp}/></div>
        <div><label style={{fontSize:10,color:"#64748b",textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:4}}>Years: {calcYrs}</label><input type="range" min={1} max={10} value={calcYrs} onChange={e=>setCalcYrs(+e.target.value)} style={{width:"100%",accentColor:"#10b981",marginTop:8}}/></div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={projData}><defs><linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/><XAxis dataKey="year" tick={{fill:"#64748b",fontSize:11}} axisLine={false} tickLine={false}/><YAxis tick={{fill:"#64748b",fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>fmt(v)}/><Tooltip content={<ChartTip formatter={fmt}/>}/><Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} fill="url(#pg)" name="Projected"/></AreaChart>
      </ResponsiveContainer>
      <div style={{marginTop:16,padding:12,borderRadius:12,background:"rgba(245,158,11,0.05)",border:"1px solid rgba(245,158,11,0.1)"}}><p style={{fontSize:10,color:"rgba(251,191,36,0.8)",margin:0}}>⚠️ Uses historical average returns with compound growth. Past performance doesn't guarantee future results. Not financial advice.</p></div>
    </Card>}
    {section==="portfolio"&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:16}}>
      <Card>
        <p style={{fontSize:13,fontWeight:600,color:"#cbd5e1",marginBottom:16}}>Allocate Funds</p>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {FUNDS.map(f=><div key={f.id} style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:11,color:"#cbd5e1",width:130,flexShrink:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.name}</span>
            <input type="range" min={0} max={100} step={5} value={alloc[f.id]||0} onChange={e=>setAlloc(p=>({...p,[f.id]:+e.target.value}))} style={{flex:1,accentColor:"#10b981"}}/>
            <span style={{fontSize:11,color:"#fff",width:36,textAlign:"right",fontVariantNumeric:"tabular-nums"}}>{alloc[f.id]||0}%</span>
          </div>)}
        </div>
        <p style={{marginTop:12,fontSize:14,fontWeight:700,color:allocTotal===100?"#34d399":"#f87171"}}>Total: {allocTotal}%{allocTotal!==100?" (must be 100%)":""}</p>
        <p style={{fontSize:12,color:"#94a3b8",marginTop:4}}>Blended Return: <strong style={{color:blended>=0?"#34d399":"#f87171"}}>{fmtPct(blended)}</strong></p>
      </Card>
      <Card>
        <p style={{fontSize:13,fontWeight:600,color:"#cbd5e1",marginBottom:16}}>Allocation</p>
        {pieData.length>0?<><ResponsiveContainer width="100%" height={220}><PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={85} paddingAngle={2} dataKey="value" stroke="none">{pieData.map((d,i)=><Cell key={i} fill={d.color}/>)}</Pie><Tooltip content={<ChartTip formatter={v=>`${v}%`}/>}/></PieChart></ResponsiveContainer><div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:8}}>{pieData.map(d=><span key={d.name} style={{display:"flex",alignItems:"center",gap:4,fontSize:10,color:"#94a3b8"}}><span style={{width:8,height:8,borderRadius:4,background:d.color,display:"inline-block"}}/>{d.name}: {d.value}%</span>)}</div></>:<div style={{padding:64,textAlign:"center",color:"#64748b",fontSize:13}}>Allocate percentages to see chart</div>}
      </Card>
    </div>}
  </div>);
}

/* --- BUDGETS --- */
function BudgetsTab(){
  const{state,dispatch}=useContext(AppContext);
  const[search,setSearch]=useState("");
  const mt=useMemo(()=>getMonthTxns(state.transactions,state.selectedMonth),[state.transactions,state.selectedMonth]);
  const bd=CATEGORIES.map(cat=>{const spent=getCatTotal(mt,cat);const budget=state.budgets[cat]||0;return{cat,spent,budget,pct:budget?(spent/budget*100):0,rem:budget-spent}}).filter(b=>!search||b.cat.toLowerCase().includes(search.toLowerCase()));
  const totalB=Object.values(state.budgets).reduce((s,v)=>s+v,0);
  const totalS=mt.reduce((s,t)=>s+t.amount,0);
  const inp={padding:"6px 10px",borderRadius:8,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",color:"#fff",fontSize:12,outline:"none",width:80};

  return(<div style={{display:"flex",flexDirection:"column",gap:16}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
      <h2 style={{fontSize:24,fontWeight:700,color:"#fff",margin:0}}>Budgets</h2>
      <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…" style={{...inp,width:160}}/>
        <div style={{display:"flex",background:"rgba(255,255,255,0.04)",borderRadius:12,padding:4,border:"1px solid rgba(255,255,255,0.06)"}}>{[0,1,2].map(m=><MonthBtn key={m} m={m}/>)}</div>
      </div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:16}}>
      <StatCard label="Total Budget" value={fmt(totalB)} icon="🎯"/>
      <StatCard label="Total Spent" value={fmt(totalS)} positive={totalS<=totalB} icon="💳"/>
      <StatCard label="Remaining" value={fmt(totalB-totalS)} positive={totalB-totalS>0} icon="💰"/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16}}>
      {bd.map(b=><Card key={b.cat}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:18}}>{CAT_ICONS[b.cat]}</span><div><p style={{color:"#fff",fontWeight:600,fontSize:14,margin:0}}>{b.cat}</p><p style={{fontSize:10,color:"#64748b",margin:0}}>{fmt(b.spent)} of {fmt(b.budget)}</p></div></div>
          <span style={{fontSize:18,fontWeight:700,fontVariantNumeric:"tabular-nums",color:b.pct>100?"#f87171":b.pct>90?"#fbbf24":"#34d399"}}>{b.pct.toFixed(0)}%</span>
        </div>
        <div style={{width:"100%",height:8,borderRadius:4,background:"rgba(255,255,255,0.06)",overflow:"hidden",marginBottom:12}}>
          <div style={{height:"100%",borderRadius:4,transition:"all 0.5s",width:`${Math.min(b.pct,100)}%`,background:b.pct>100?"#ef4444":b.pct>90?"linear-gradient(90deg,#f59e0b,#ef4444)":b.pct>70?"#f59e0b":"#10b981",boxShadow:b.pct>90?"0 0 12px rgba(239,68,68,0.4)":"none"}}/>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:10,color:"#64748b"}}>Budget:</span>
          <input type="number" value={b.budget} min={0} step={50} onChange={e=>dispatch({type:"SET_BUDGET",payload:{cat:b.cat,amt:+e.target.value}})} style={inp}/>
          <span style={{fontSize:11,marginLeft:"auto",color:b.rem>=0?"#34d399":"#f87171"}}>{b.rem>=0?`${fmt(b.rem)} left`:`${fmt(Math.abs(b.rem))} over`}</span>
        </div>
      </Card>)}
    </div>
  </div>);
}

/* --- SETTINGS --- */
function SettingsTab(){
  const{state,dispatch}=useContext(AppContext);
  const[name,setName]=useState(state.user.name);const[email,setEmail]=useState(state.user.email);const[currency,setCurrency]=useState(state.user.currency);const[saved,setSaved]=useState(false);
  const save=()=>{dispatch({type:"UPDATE_PROFILE",payload:{name,email,currency}});setSaved(true);setTimeout(()=>setSaved(false),2000)};
  const inp={width:"100%",padding:"10px 14px",borderRadius:12,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",color:"#fff",fontSize:14,outline:"none"};
  const[prefs,setPrefs]=useState({dark:true,notif:false,reports:true});

  return(<div style={{display:"flex",flexDirection:"column",gap:16,maxWidth:600}}>
    <h2 style={{fontSize:24,fontWeight:700,color:"#fff",margin:0}}>Settings</h2>
    <Card>
      <p style={{fontSize:13,fontWeight:600,color:"#cbd5e1",marginBottom:20}}>Profile Information</p>
      <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:24}}>
        <div style={{width:56,height:56,borderRadius:16,background:"linear-gradient(135deg,#10b981,#14b8a6)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:18,fontWeight:700,flexShrink:0}}>{name.split(" ").map(w=>w[0]).join("").slice(0,2)}</div>
        <div><p style={{color:"#fff",fontWeight:600,margin:0}}>{name}</p><p style={{fontSize:12,color:"#64748b",margin:0}}>{email}</p></div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div><label style={{fontSize:10,textTransform:"uppercase",letterSpacing:1.5,color:"#64748b",fontWeight:600,display:"block",marginBottom:6}}>Full Name</label><input value={name} onChange={e=>setName(e.target.value)} style={inp}/></div>
        <div><label style={{fontSize:10,textTransform:"uppercase",letterSpacing:1.5,color:"#64748b",fontWeight:600,display:"block",marginBottom:6}}>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} style={inp}/></div>
        <div><label style={{fontSize:10,textTransform:"uppercase",letterSpacing:1.5,color:"#64748b",fontWeight:600,display:"block",marginBottom:6}}>Currency</label><select value={currency} onChange={e=>setCurrency(e.target.value)} style={inp}><option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option></select></div>
        <button onClick={save} style={{padding:"10px 24px",borderRadius:12,background:"#059669",color:"#fff",fontWeight:600,fontSize:14,border:"none",cursor:"pointer",alignSelf:"flex-start",boxShadow:"0 4px 16px rgba(16,185,129,0.25)"}}>{saved?"✓ Saved!":"Save Changes"}</button>
      </div>
    </Card>
    <Card>
      <p style={{fontSize:13,fontWeight:600,color:"#cbd5e1",marginBottom:12}}>Preferences</p>
      {[["dark","Dark Mode","Always enabled for fintech theme"],["notif","Email Notifications","Receive budget alert emails"],["reports","Monthly Reports","Auto-generate reports"]].map(([k,label,desc])=>
        <div key={k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,0.03)"}}>
          <div><p style={{fontSize:13,color:"#fff",margin:0}}>{label}</p><p style={{fontSize:10,color:"#64748b",margin:0}}>{desc}</p></div>
          <button onClick={()=>setPrefs(p=>({...p,[k]:!p[k]}))} style={{width:40,height:20,borderRadius:10,border:"none",cursor:"pointer",position:"relative",background:prefs[k]?"#10b981":"#334155",transition:"background 0.2s"}}>
            <div style={{width:16,height:16,borderRadius:8,background:"#fff",position:"absolute",top:2,left:prefs[k]?22:2,transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.3)"}}/>
          </button>
        </div>
      )}
    </Card>
  </div>);
}

/* --- MAIN APP --- */
export default function App(){
  const[state,dispatch]=useReducer(reducer,init);
  const[collapsed,setCollapsed]=useState(false);
  if(!state.isAuth)return<LoginScreen onLogin={()=>dispatch({type:"LOGIN"})}/>;
  const setTab=t=>dispatch({type:"SET_TAB",payload:t});
  const render=()=>{switch(state.activeTab){case"dashboard":return<DashboardTab/>;case"expenses":return<ExpensesTab/>;case"investments":return<InvestmentsTab/>;case"budgets":return<BudgetsTab/>;case"settings":return<SettingsTab/>;default:return<DashboardTab/>}};

  return(
    <AppContext.Provider value={{state,dispatch}}>
      <div style={{minHeight:"100vh",background:"#0a0e1a",color:"#fff",fontFamily:"'DM Sans',system-ui,sans-serif"}}>
        <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0}}>
          <div style={{position:"absolute",top:0,right:0,width:500,height:500,background:"rgba(16,185,129,0.04)",borderRadius:"50%",filter:"blur(150px)"}}/>
          <div style={{position:"absolute",bottom:0,left:0,width:400,height:400,background:"rgba(99,102,241,0.04)",borderRadius:"50%",filter:"blur(150px)"}}/>
        </div>
        <Sidebar activeTab={state.activeTab} setTab={setTab} collapsed={collapsed} setCollapsed={setCollapsed} onLogout={()=>dispatch({type:"LOGOUT"})}/>
        <main style={{position:"relative",zIndex:10,transition:"margin-left 0.3s",marginLeft:collapsed?68:220,minHeight:"100vh"}}>
          <header style={{position:"sticky",top:0,zIndex:20,borderBottom:"1px solid rgba(255,255,255,0.06)",background:"rgba(10,14,26,0.8)",backdropFilter:"blur(20px)",padding:"12px 24px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div><h1 style={{fontSize:18,fontWeight:600,color:"#fff",margin:0,textTransform:"capitalize"}}>{state.activeTab}</h1><p style={{fontSize:10,color:"#64748b",margin:0}}>{MONTH_NAMES[state.selectedMonth]} 2026</p></div>
            <button onClick={()=>setTab("settings")} style={{width:36,height:36,borderRadius:12,background:"linear-gradient(135deg,#10b981,#14b8a6)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:12,fontWeight:700,border:"none",cursor:"pointer"}}>{state.user.name.split(" ").map(w=>w[0]).join("").slice(0,2)}</button>
          </header>
          <div style={{padding:24}}>{render()}</div>
          <footer style={{borderTop:"1px solid rgba(255,255,255,0.06)",padding:"16px 24px",textAlign:"center"}}><p style={{fontSize:10,color:"#475569",margin:0}}>This is a demo application. Not real financial advice. All data is fictional and resets on refresh.</p></footer>
        </main>
      </div>
    </AppContext.Provider>
  );
}
