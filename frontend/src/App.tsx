import {useState, useEffect, useCallback, useMemo, useRef} from 'react'
import type {ReactNode, DragEvent, ChangeEvent, FormEvent, CSSProperties} from 'react'
import {
  Activity, ArrowDownRight, ArrowRight, ArrowUpRight, BarChart3, Bell, CalendarDays,
  Check, ChevronDown, ChevronLeft, ChevronRight, Clock3, CloudUpload, Copy, Download,
  FileVideo2, FolderOpen, Globe2, Image as ImageIcon, Instagram, LayoutDashboard,
  Linkedin, ListFilter, Menu, Moon, MoreHorizontal, Music2, Pencil, Plus, Search,
  Settings2, ShieldCheck, Sparkles, Sun, Trash2, TrendingUp, UsersRound,
  WandSparkles, X, Youtube, Zap
} from 'lucide-react'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer,
  Tooltip, XAxis, YAxis
} from 'recharts'
import {api,json} from './api'
import {t,intlLocales} from './i18n'
import type {Analytics,Asset,CaptionVariant,Client,Kind,Lang,Page,Platform,Post,PostPayload,Status} from './types'

type Theme='dark'|'light'
type ClientFilter=number|'all'
type Notify=(message:string,kind?:'success'|'error')=>void
type Translator=(key:string)=>string
const platformList:Platform[]=['instagram','tiktok','youtube','linkedin']
const statusList:Status[]=['draft','scheduled','published']
const kinds:Kind[]=['post','reel','story','video','carousel']
const platformNames:Record<Platform,string>={instagram:'Instagram',tiktok:'TikTok',youtube:'YouTube',linkedin:'LinkedIn'}
const chartColors:Record<Platform,string>={instagram:'#AF81EF',tiktok:'#4CD6C2',youtube:'#FF8E94',linkedin:'#86A8FF'}
const locales:Lang[]=['tr','de','en']
const defaultAnalytics:Analytics={summary:{impressions:0,reach:0,engagements:0,views:0,followers_gained:0,engagement_rate:0},daily:[],platforms:[],source:{demo_entries:0,manual_entries:0},days:30}
function dateISO(date:Date){const y=date.getFullYear();return `${y}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`}
function addDays(date:Date,days:number){const d=new Date(date);d.setDate(d.getDate()+days);return d}
function mondayOf(date:Date){const d=new Date(date);d.setHours(0,0,0,0);d.setDate(d.getDate()-((d.getDay()+6)%7));return d}
function localDateTime(date:Date){return `${dateISO(date)}T${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`}
function abbrev(s:string){return s.trim().split(/\s+/).slice(0,2).map(x=>x[0]?.toUpperCase()||'').join('')}
function prettyNum(n:number,lang:Lang,compact=true){return new Intl.NumberFormat(intlLocales[lang],compact?{notation:'compact',maximumFractionDigits:1}:{maximumFractionDigits:0}).format(n)}
function formatDate(s:string|null,lang:Lang,opts?:Intl.DateTimeFormatOptions){if(!s)return '—';const d=new Date(s.length===10?`${s}T12:00:00`:s);return new Intl.DateTimeFormat(intlLocales[lang],opts||{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(d)}
function PlatformIcon({p,size=15}:{p:Platform,size?:number}){return p==='instagram'?<Instagram size={size}/>:p==='youtube'?<Youtube size={size}/>:p==='linkedin'?<Linkedin size={size}/>:<Music2 size={size}/>}
function PlatformPill({p,small=false}:{p:Platform,small?:boolean}){return <span className={`platform-pill platform-${p} ${small?'small':''}`}><PlatformIcon p={p} size={small?12:14}/>{!small&&platformNames[p]}</span>}
function StatusPill({status,tr}:{status:Status,tr:Translator}){return <span className={`status-pill status-${status}`}><span className="status-dot"/>{tr(status)}</span>}
function ClientAvatar({client,size='normal'}:{client:Client,size?:'normal'|'large'|'small'}){return <span className={`avatar avatar-${size}`} style={{'--avatar':client.color} as CSSProperties}>{abbrev(client.name)}</span>}
function TitleArea({eyebrow,title,desc,action}:{eyebrow:string,title:string,desc:string,action?:ReactNode}){return <div className="title-area"><div><p className="eyebrow"><span className="mini-dot"/>{eyebrow}</p><h1>{title}</h1><p className="page-subtitle">{desc}</p></div>{action&&<div className="title-actions">{action}</div>}</div>}
function Panel({children,className='',style}:{children:ReactNode,className?:string,style?:React.CSSProperties}){return <section className={`panel ${className}`} style={style}>{children}</section>}
function SectionHeading({title,right,sub}:{title:string,right?:ReactNode,sub?:string}){return <div className="panel-header"><div><h2>{title}</h2>{sub&&<span className="muted tiny">{sub}</span>}</div>{right&&<div className="panel-actions">{right}</div>}</div>}
function Empty({icon,children}:{icon:ReactNode,children:ReactNode}){return <div className="empty-state"><span className="empty-icon">{icon}</span><p>{children}</p></div>}
function Modal({title,onClose,children,width='normal'}:{title:string,onClose:()=>void,children:ReactNode,width?:'normal'|'wide'}){return <div className="modal-backdrop" onMouseDown={onClose}><div className={`modal modal-${width}`} role="dialog" aria-modal="true" aria-label={title} onMouseDown={e=>e.stopPropagation()}><div className="modal-head"><h2>{title}</h2><button className="icon-button" aria-label="Close" onClick={onClose}><X size={19}/></button></div>{children}</div></div>}
function Button({children,onClick,variant='primary',icon:Icon,disabled,type='button',className=''}:{children:ReactNode,onClick?:()=>void,variant?:'primary'|'secondary'|'ghost'|'danger',icon?:typeof Plus,disabled?:boolean,type?:'button'|'submit',className?:string}){return <button type={type} disabled={disabled} className={`btn ${variant} ${className}`} onClick={onClick}>{Icon&&<Icon size={16}/>}<span>{children}</span></button>}
function ChartTooltip({active,payload,label,lang}:{active?:boolean,payload?:Array<{name:string,value:number,color?:string}>,label?:string,lang:Lang}){if(!active||!payload?.length)return null;return <div className="chart-tooltip"><span>{label?.includes('-')?formatDate(label,lang,{day:'numeric',month:'short'}):label}</span>{payload.map(p=><p key={p.name}><span style={{background:p.color||'#A59EFF'}} className="legend-swatch"/>{p.name}: <strong>{prettyNum(p.value,lang,false)}</strong></p>)}</div>}

function PostEditor({post,clients,assets,selectedClient,save,onClose,tr,lang}:{post:Post|null,clients:Client[],assets:Asset[],selectedClient:ClientFilter,save:(payload:PostPayload,id?:number)=>Promise<void>,onClose:()=>void,tr:Translator,lang:Lang}){
 const now=new Date();now.setHours(now.getHours()+1,0,0,0)
 const [clientId,setClientId]=useState<number>(post?.client_id|| (selectedClient==='all'?clients[0]?.id: selectedClient)||0)
 const [platform,setPlatform]=useState<Platform>(post?.platform||'instagram')
 const [title,setTitle]=useState(post?.title||'')
 const [caption,setCaption]=useState(post?.caption||'')
 const [kind,setKind]=useState<Kind>(post?.content_type||'reel')
 const [status,setStatus]=useState<Status>(post?.status||'draft')
 const [scheduledAt,setScheduledAt]=useState(post?.scheduled_at?.slice(0,16)||localDateTime(now))
 const [assetId,setAssetId]=useState<number|null>(post?.asset_id||null)
 const [busy,setBusy]=useState(false)
 const [error,setError]=useState('')
 async function submit(event:FormEvent){event.preventDefault();if(!clientId||!title.trim()){setError(tr('formRequired'));return}if(status==='scheduled'&&!scheduledAt){setError(tr('dateRequired'));return}
  setBusy(true);setError('')
  try{await save({client_id:clientId,platform,title:title.trim(),caption,content_type:kind,status,scheduled_at:status==='draft'?null:scheduledAt?`${scheduledAt}:00`:null,asset_id:assetId},post?.id);onClose()}catch(e){setError((e as Error).message)}finally{setBusy(false)}
 }
 return <Modal title={post?tr('edit'):tr('newPost')} onClose={onClose} width="wide"><form onSubmit={submit} className="form-grid">
   <label className="field"><span>{tr('client')}</span><select value={clientId} onChange={e=>{setClientId(+e.target.value);setAssetId(null)}} required>{clients.map(c=><option value={c.id} key={c.id}>{c.name}</option>)}</select></label>
   <label className="field"><span>{tr('platform')}</span><select value={platform} onChange={e=>setPlatform(e.target.value as Platform)}>{platformList.map(p=><option key={p} value={p}>{platformNames[p]}</option>)}</select></label>
   <label className="field field-full"><span>{tr('postTitle')}</span><input required maxLength={220} value={title} onChange={e=>setTitle(e.target.value)} placeholder={lang==='tr'?'Bu içeriğe bir başlık ver…':lang==='de'?'Titel deines Beitrags…':'Give your content a title…'}/></label>
   <label className="field field-full"><span>{tr('caption')}</span><textarea rows={6} value={caption} maxLength={10000} onChange={e=>setCaption(e.target.value)} placeholder="✨ …"/></label>
   <label className="field"><span>{tr('type')}</span><select value={kind} onChange={e=>setKind(e.target.value as Kind)}>{kinds.map(k=><option key={k} value={k}>{tr(k)}</option>)}</select></label>
   <label className="field"><span>{tr('status')}</span><select value={status} onChange={e=>setStatus(e.target.value as Status)}>{statusList.map(s=><option key={s} value={s}>{tr(s)}</option>)}</select></label>
   {status!=='draft'&&<label className="field"><span>{tr('scheduleDate')}</span><input type="datetime-local" value={scheduledAt} onChange={e=>setScheduledAt(e.target.value)} required={status==='scheduled'}/></label>}
   <label className="field"><span>{tr('attachMedia')}</span><select value={assetId??''} onChange={e=>setAssetId(e.target.value?+e.target.value:null)}><option value="">{tr('withoutMedia')}</option>{assets.filter(a=>a.client_id===clientId).map(a=><option key={a.id} value={a.id}>{a.filename}</option>)}</select></label>
   {error&&<div className="inline-error field-full">{error}</div>}
   <div className="modal-footer field-full"><Button onClick={onClose} variant="secondary">{tr('cancel')}</Button><Button type="submit" disabled={busy} icon={Check}>{busy?tr('loading'):tr('save')}</Button></div>
  </form></Modal>
}

function ClientEditor({client,save,onClose,tr}:{client:Client|null,save:(data:object,id?:number)=>Promise<void>,onClose:()=>void,tr:Translator}){
 const [name,setName]=useState(client?.name||'')
 const [industry,setIndustry]=useState(client?.industry||'')
 const [brandVoice,setBrandVoice]=useState(client?.brand_voice||'professional')
 const [color,setColor]=useState(client?.color||'#8B8CFF')
 const [accounts,setAccounts]=useState<Record<string,string>>(client?.accounts||{})
 const [busy,setBusy]=useState(false);const [error,setError]=useState('')
 async function submit(e:FormEvent){e.preventDefault();setBusy(true);setError('');try{await save({name,industry,brand_voice:brandVoice,color,accounts},client?.id);onClose()}catch(err){setError((err as Error).message)}finally{setBusy(false)}}
 return <Modal title={client?tr('edit'):tr('addClient')} onClose={onClose}><form className="form-grid" onSubmit={submit}>
  <label className="field field-full"><span>{tr('clientName')}</span><input required minLength={2} maxLength={140} value={name} onChange={e=>setName(e.target.value)} placeholder="Studio / Brand…"/></label>
  <label className="field field-full"><span>{tr('industry')}</span><input value={industry} maxLength={100} onChange={e=>setIndustry(e.target.value)} placeholder="Creative · Wellness · Consulting"/></label>
  <label className="field"><span>{tr('brandVoice')}</span><select value={brandVoice} onChange={e=>setBrandVoice(e.target.value)}>{['professional','friendly','luxury','playful'].map(k=><option key={k} value={k}>{tr(k)}</option>)}</select></label>
  <label className="field"><span>Brand color</span><div className="color-input"><input type="color" value={color} onChange={e=>setColor(e.target.value)}/><span>{color}</span></div></label>
  <div className="field-full field-title">{tr('socialAccounts')}</div>
  {platformList.map(p=><label className="field" key={p}><span>{platformNames[p]}</span><input value={accounts[p]||''} onChange={e=>setAccounts({...accounts,[p]:e.target.value})} placeholder="@handle / profile" maxLength={200}/></label>)}
  {error&&<div className="inline-error field-full">{error}</div>}
  <div className="modal-footer field-full"><Button variant="secondary" onClick={onClose}>{tr('cancel')}</Button><Button disabled={busy} type="submit" icon={Check}>{busy?tr('loading'):tr('save')}</Button></div>
 </form></Modal>
}
function MetricEditor({clients,selectedClient,onClose,onSaved,tr}:{clients:Client[],selectedClient:ClientFilter,onClose:()=>void,onSaved:()=>void,tr:Translator}){
 const [clientId,setClientId]=useState(selectedClient==='all'?clients[0]?.id||0:selectedClient)
 const [platform,setPlatform]=useState<Platform>('instagram')
 const [day,setDay]=useState(dateISO(new Date()))
 const [values,setValues]=useState({impressions:0,reach:0,engagements:0,views:0,followers_gained:0})
 const [busy,setBusy]=useState(false);const [error,setError]=useState('')
 async function save(e:FormEvent){e.preventDefault();setBusy(true);setError('');try{await api('/metrics',json('POST',{client_id:clientId,platform,day,...values}));onSaved();onClose()}catch(err){setError((err as Error).message)}finally{setBusy(false)}}
 return <Modal title={tr('addMetric')} onClose={onClose}><form className="form-grid" onSubmit={save}>
   <label className="field"><span>{tr('client')}</span><select value={clientId} onChange={e=>setClientId(+e.target.value)}>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
   <label className="field"><span>{tr('platform')}</span><select value={platform} onChange={e=>setPlatform(e.target.value as Platform)}>{platformList.map(p=><option key={p} value={p}>{platformNames[p]}</option>)}</select></label>
   <label className="field field-full"><span>{tr('metricDay')}</span><input type="date" required max={dateISO(new Date())} value={day} onChange={e=>setDay(e.target.value)}/></label>
   {(['impressions','reach','engagements','views','followers_gained'] as const).map(k=><label className="field" key={k}><span>{tr(k==='engagements'?'engagements':k==='followers_gained'?'followersGained':k)}</span><input required type="number" min={0} max={1000000000} value={values[k]} onChange={e=>setValues({...values,[k]:+e.target.value})}/></label>)}
   <p className="muted tiny field-full">{tr('metricManualNote')}</p>
   {error&&<div className="inline-error field-full">{error}</div>}
   <div className="modal-footer field-full"><Button variant="secondary" onClick={onClose}>{tr('cancel')}</Button><Button type="submit" icon={Check} disabled={busy}>{tr('save')}</Button></div>
 </form></Modal>
}

function Dashboard({clients,posts,analytics,lang,tr,onPage,onNew}:{clients:Client[],posts:Post[],analytics:Analytics,lang:Lang,tr:Translator,onPage:(p:Page)=>void,onNew:()=>void}){
 const mid=Math.floor(analytics.daily.length/2)
 const older=analytics.daily.slice(0,mid)
 const newer=analytics.daily.slice(mid)
 const total=(items:typeof older,key:'impressions'|'engagements')=>items.reduce((sum,item)=>sum+item[key],0)
 const previousImpressions=total(older,'impressions')
 const impressionChange=previousImpressions>0?(total(newer,'impressions')-previousImpressions)/previousImpressions*100:null
 const prevRate=previousImpressions?total(older,'engagements')/previousImpressions*100:0
 const nextImpressions=total(newer,'impressions')
 const currentRate=nextImpressions?total(newer,'engagements')/nextImpressions*100:0
 const engagementChange=previousImpressions>0?currentRate-prevRate:null
 const stats=[{name:'totalImpressions',value:prettyNum(analytics.summary.impressions,lang),icon:Activity,color:'lavender',trend:impressionChange===null?'':`${impressionChange>=0?'+':''}${impressionChange.toFixed(1)}%`,isPositive:impressionChange===null||impressionChange>=0},{name:'engagementRate',value:`${analytics.summary.engagement_rate.toFixed(1)}%`,icon:TrendingUp,color:'mint',trend:engagementChange===null?'':`${engagementChange>=0?'+':''}${engagementChange.toFixed(1)} pp`,isPositive:engagementChange===null||engagementChange>=0},{name:'scheduledPosts',value:String(posts.filter(p=>p.status==='scheduled').length),icon:CalendarDays,color:'orange',trend:'',isPositive:true},{name:'totalClients',value:String(clients.length),icon:UsersRound,color:'rose',trend:'',isPositive:true}]
 const future=posts.filter(p=>p.status==='scheduled'&&p.scheduled_at&&p.scheduled_at.slice(0,10)>=dateISO(new Date())).sort((a,b)=>(a.scheduled_at||'').localeCompare(b.scheduled_at||'')).slice(0,5)
 const chartData=analytics.daily.map(row=>({...row,short:formatDate(row.day,lang,{day:'2-digit',month:'short'})}))
 const periodLabel=analytics.days===7?tr('last7Days'):analytics.days===90?tr('last90Days'):tr('last30Days')
 return <><TitleArea eyebrow="SOCIAL INTELLIGENCE / 01" title={tr('dashboardHeadline')} desc={tr('dashboardDesc')} action={<Button onClick={onNew} icon={Plus}>{tr('newPost')}</Button>}/>
  <div className="metrics-grid">{stats.map((s,i)=><div className="metric-card" key={s.name} style={{animationDelay:`${i*75}ms`}}><div className="metric-top"><span>{tr(s.name)}</span><span className={`metric-icon ${s.color}`}><s.icon size={19}/></span></div><strong>{s.value}</strong><div className="metric-bottom">{s.trend?<span className={`metric-trend ${s.isPositive?'':'negative'}`}>{s.isPositive?<ArrowUpRight size={13}/>:<ArrowDownRight size={13}/>} {s.trend}</span>:<span className="metric-neutral"><span className="live-dot"/>{tr('ready')}</span>}<span className="muted tiny">{periodLabel}</span></div></div>)}</div>
  <div className="dashboard-grid">
   <Panel className="chart-panel"><SectionHeading title={tr('growthChart')} sub={periodLabel} right={<div className="chart-legend"><span className="legend-item"><i style={{background:'#A6A0FF'}}/>{tr('impressions')}</span><span className="legend-item"><i style={{background:'#55D5BF'}}/>{tr('reach')}</span></div>}/><div className="line-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{top:15,right:12,left:-17,bottom:0}}><defs><linearGradient id="impFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#A6A0FF" stopOpacity={.3}/><stop offset="95%" stopColor="#A6A0FF" stopOpacity={0}/></linearGradient><linearGradient id="reachFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#55D5BF" stopOpacity={.12}/><stop offset="95%" stopColor="#55D5BF" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="4 6" vertical={false} stroke="var(--grid)"/><XAxis dataKey="short" axisLine={false} tickLine={false} tick={{fill:'var(--text-muted)',fontSize:10}} minTickGap={16}/><YAxis axisLine={false} tickLine={false} tick={{fill:'var(--text-muted)',fontSize:10}} tickFormatter={v=>prettyNum(v,lang)}/><Tooltip content={<ChartTooltip lang={lang}/>}/><Area type="monotone" dataKey="impressions" name={tr('impressions')} stroke="#A6A0FF" strokeWidth={2.5} fill="url(#impFill)" animationDuration={1100}/><Area type="monotone" dataKey="reach" name={tr('reach')} stroke="#55D5BF" strokeWidth={2} fill="url(#reachFill)" animationDuration={1300}/></AreaChart></ResponsiveContainer></div></Panel>
   <Panel className="platform-panel"><SectionHeading title={tr('platformBreakdown')} sub={tr('impressions')}/><div className="platform-bars">{analytics.platforms.map(p=>{const max=Math.max(...analytics.platforms.map(x=>x.impressions),1);return <div className="platform-bar-row" key={p.platform}><div className="bar-label"><PlatformIcon p={p.platform}/><span>{platformNames[p.platform]}</span><strong>{prettyNum(p.impressions,lang)}</strong></div><div className="bar-track"><div className="bar-fill" style={{width:`${p.impressions/max*100}%`,background:chartColors[p.platform]}}/></div></div>})}</div><div className="platform-foot"><div className="small-ring"><TrendingUp size={21}/></div><p>{tr('engagementRate')}<strong>{analytics.summary.engagement_rate.toFixed(2)}%</strong></p><ArrowUpRight size={17}/></div></Panel>
  </div>
  <div className="dashboard-bottom">
   <Panel><SectionHeading title={tr('upcoming')} right={<button className="text-button" onClick={()=>onPage('calendar')}>{tr('viewAll')} <ArrowRight size={15}/></button>}/>{future.length===0?<Empty icon={<CalendarDays/>}>{tr('noUpcoming')}</Empty>:<div className="upcoming-list">{future.map(post=>{const client=clients.find(c=>c.id===post.client_id);return <div className="upcoming-item" key={post.id}><span className="upcoming-time"><strong>{formatDate(post.scheduled_at,lang,{day:'2-digit',month:'short'})}</strong><small>{formatDate(post.scheduled_at,lang,{hour:'2-digit',minute:'2-digit'})}</small></span><span className="upcoming-data"><strong>{post.title}</strong><small>{client?.name||''}</small></span><PlatformPill p={post.platform} small/></div>})}</div>}</Panel>
   <Panel className="quick-panel"><SectionHeading title={tr('quickActions')}/><button className="quick-action" onClick={onNew}><span className="quick-icon lavender"><Plus size={18}/></span><span>{tr('makeContent')}</span><ArrowUpRight size={16}/></button><button className="quick-action" onClick={()=>onPage('library')}><span className="quick-icon mint"><CloudUpload size={18}/></span><span>{tr('uploadAsset')}</span><ArrowUpRight size={16}/></button><button className="quick-action" onClick={()=>onPage('studio')}><span className="quick-icon orange"><WandSparkles size={18}/></span><span>{tr('generateCaption')}</span><ArrowUpRight size={16}/></button></Panel>
  </div>
  {analytics.source.demo_entries>0&&<div className="demo-notice"><Sparkles size={15}/><strong>{tr('sampleData')}</strong><span>{tr('sampleExplanation')}</span></div>}
 </>
}

function Calendar({posts,clients,lang,tr,onMove,onEdit}:{posts:Post[],clients:Client[],lang:Lang,tr:Translator,onMove:(post:Post,iso:string|null)=>void,onEdit:(post:Post)=>void}){
 const [start,setStart]=useState(mondayOf(new Date()));const [over,setOver]=useState('')
 const days=useMemo(()=>Array.from({length:7},(_,i)=>addDays(start,i)),[start]);const draft=posts.filter(p=>p.status==='draft')
 const dateLabel=`${formatDate(dateISO(start),lang,{day:'numeric',month:'long'})} — ${formatDate(dateISO(days[6]),lang,{day:'numeric',month:'long',year:'numeric'})}`
 function handleDrop(e:DragEvent,id:string){e.preventDefault();setOver('');const post=posts.find(p=>String(p.id)===e.dataTransfer.getData('text/post-id'));if(post)onMove(post,id==='draft'?null:id)}
 function card(post:Post){const client=clients.find(c=>c.id===post.client_id);return <div className={`calendar-card ${post.status==='draft'?'calendar-draft':''}`} key={post.id} draggable onDragStart={e=>{e.dataTransfer.setData('text/post-id',String(post.id));e.dataTransfer.effectAllowed='move'}} onClick={()=>onEdit(post)} title={post.caption}><span className="card-top"><PlatformIcon p={post.platform} size={14}/><span>{post.scheduled_at?.slice(11,16)||'· · ·'}</span><MoreHorizontal size={14}/></span><strong>{post.title}</strong><span className="calendar-brand"><i style={{background:client?.color||'#aaa'}}/>{client?.name||''}</span></div>}
 return <><TitleArea eyebrow="EDITORIAL PLANNER / 02" title={tr('calendarHeadline')} desc={tr('calendarDesc')}/>
 <div className="calendar-toolbar"><div className="calendar-month"><CalendarDays size={20}/><strong>{dateLabel}</strong></div><div className="toolbar-right"><button className="icon-button" title={tr('previous')} onClick={()=>setStart(addDays(start,-7))}><ChevronLeft size={18}/></button><button className="today-button" onClick={()=>setStart(mondayOf(new Date()))}>{tr('today')}</button><button className="icon-button" title={tr('next')} onClick={()=>setStart(addDays(start,7))}><ChevronRight size={18}/></button></div></div>
 <div className="calendar-scroll"><div className="week-grid">{days.map((day,index)=>{const iso=dateISO(day);const list=posts.filter(p=>p.status!=='draft'&&p.scheduled_at?.slice(0,10)===iso).sort((a,b)=>(a.scheduled_at||'').localeCompare(b.scheduled_at||''));const isToday=iso===dateISO(new Date());return <div key={iso} className={`day-column ${isToday?'is-today':''} ${over===iso?'is-over':''}`} onDragOver={e=>{e.preventDefault();setOver(iso)}} onDragLeave={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node))setOver('')}} onDrop={e=>handleDrop(e,iso)}><div className="day-heading"><span>{new Intl.DateTimeFormat(intlLocales[lang],{weekday:'short'}).format(day)}</span><strong className={isToday?'active-date':''}>{day.getDate()}</strong></div><div className="day-cards">{list.map(card)}{list.length===0&&<p className="no-day-post">{tr('noPostsDay')}</p>}{over===iso&&<span className="drop-indicator"><Plus size={15}/>{tr('dropHere')}</span>}</div><div className="day-footer">{String(index+1).padStart(2,'0')}</div></div>})}</div></div>
 <Panel className={`draft-pool ${over==='draft'?'is-over':''}`}><SectionHeading title={tr('unplanned')} sub={`${draft.length} ${tr('posts')}`}/><div className="draft-container" onDragOver={e=>{e.preventDefault();setOver('draft')}} onDragLeave={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node))setOver('')}} onDrop={e=>handleDrop(e,'draft')}>{draft.length===0?<p className="muted tiny">{tr('dropHere')}</p>:draft.map(card)}</div><p className="muted tiny calendar-help"><Settings2 size={13}/>{tr('dragTip')}</p></Panel>
 </>
}

function Content({posts,clients,assets,lang,tr,onNew,onEdit,onDelete}:{posts:Post[],clients:Client[],assets:Asset[],lang:Lang,tr:Translator,onNew:()=>void,onEdit:(p:Post)=>void,onDelete:(p:Post)=>void}){
 const [search,setSearch]=useState('');const [status,setStatus]=useState<Status|'all'>('all');const [platform,setPlatform]=useState<Platform|'all'>('all')
 const filtered=posts.filter(p=>(status==='all'||p.status===status)&&(platform==='all'||p.platform===platform)&&`${p.title} ${p.caption}`.toLowerCase().includes(search.toLowerCase())).sort((a,b)=>(b.scheduled_at||b.created_at).localeCompare(a.scheduled_at||a.created_at))
 return <><TitleArea eyebrow="CONTENT MANAGER / 03" title={tr('contentHeadline')} desc={tr('contentDesc')} action={<Button icon={Plus} onClick={onNew}>{tr('newPost')}</Button>}/>
 <Panel className="content-panel"><div className="filters-row"><div className="search-wrap"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder={tr('searchContent')}/></div><div className="filter-group"><ListFilter size={17}/><select value={status} onChange={e=>setStatus(e.target.value as Status|'all')}><option value="all">{tr('all')}</option>{statusList.map(s=><option key={s} value={s}>{tr(s)}</option>)}</select><select value={platform} onChange={e=>setPlatform(e.target.value as Platform|'all')}><option value="all">{tr('all')}</option>{platformList.map(p=><option key={p} value={p}>{platformNames[p]}</option>)}</select></div></div>
 {filtered.length===0?<Empty icon={<FolderOpen/>}>{tr('noContent')}</Empty>:<div className="table-scroll"><table className="content-table"><thead><tr><th>{tr('posts')}</th><th>{tr('client')}</th><th>{tr('platform')}</th><th>{tr('status')}</th><th>{tr('scheduleDate')}</th><th/></tr></thead><tbody>{filtered.map(p=>{const client=clients.find(c=>c.id===p.client_id);const asset=assets.find(a=>a.id===p.asset_id);return <tr key={p.id}><td><div className="post-cell"><div className="post-thumbnail">{asset?.mime_type.startsWith('image/')?<img src={asset.url} alt=""/>:asset?.mime_type.startsWith('video/')?<FileVideo2 size={20}/>:<ImageIcon size={19}/>}</div><div className="post-cell-text"><strong>{p.title}</strong><small>{tr(p.content_type)} · {p.caption.slice(0,65)||'—'}</small></div></div></td><td><div className="table-client">{client&&<ClientAvatar client={client} size="small"/>}<span>{client?.name||'—'}</span></div></td><td><PlatformPill p={p.platform}/></td><td><StatusPill status={p.status} tr={tr}/></td><td className="nowrap muted">{formatDate(p.scheduled_at,lang)}</td><td><div className="row-actions"><button className="icon-button" title={tr('edit')} onClick={()=>onEdit(p)}><Pencil size={15}/></button><button className="icon-button danger-icon" title={tr('delete')} onClick={()=>onDelete(p)}><Trash2 size={15}/></button></div></td></tr>})}</tbody></table></div>}
 <div className="list-footer"><span>{filtered.length} {tr('posts')}</span><span>{tr('localFirst')} <span className="live-dot"/></span></div></Panel></>
}

function Library({clients,assets,selectedClient,onUpload,onDelete,lang,tr}:{clients:Client[],assets:Asset[],selectedClient:ClientFilter,onUpload:(file:File,clientId:number)=>Promise<void>,onDelete:(asset:Asset)=>void,lang:Lang,tr:Translator}){
 const [active,setActive]=useState<'all'|'images'|'videos'>('all');const [uploadClient,setUploadClient]=useState(selectedClient==='all'?clients[0]?.id||0:selectedClient)
 const [busy,setBusy]=useState(false);const input=useRef<HTMLInputElement>(null)
 useEffect(()=>{if(selectedClient!=='all')setUploadClient(selectedClient)},[selectedClient])
 const filtered=assets.filter(a=>active==='all'||(active==='images'?a.mime_type.startsWith('image/'):a.mime_type.startsWith('video/')))
 async function upload(e:ChangeEvent<HTMLInputElement>){const file=e.target.files?.[0];if(!file||!uploadClient)return;setBusy(true);try{await onUpload(file,uploadClient)}finally{setBusy(false);e.target.value=''}}
 return <><TitleArea eyebrow="ASSET COLLECTION / 04" title={tr('libraryHeadline')} desc={tr('libraryDesc')} action={<Button icon={CloudUpload} onClick={()=>input.current?.click()} disabled={busy||clients.length===0}>{busy?tr('uploading'):tr('upload')}</Button>}/>
  <Panel className="library-panel"><div className="library-toolbar"><div className="tabs">{(['all','images','videos'] as const).map(k=><button key={k} className={active===k?'active':''} onClick={()=>setActive(k)}>{tr(k==='all'?'allMedia':k)}</button>)}</div><div className="library-select"><span>{tr('client')}:</span><select value={uploadClient} onChange={e=>setUploadClient(+e.target.value)}>{clients.map(c=><option value={c.id} key={c.id}>{c.name}</option>)}</select></div></div>
   <input type="file" ref={input} hidden accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm,.mov" onChange={upload}/>
   <div className="media-drop" onClick={()=>input.current?.click()} role="button" tabIndex={0} onKeyDown={e=>{if(e.key==='Enter')input.current?.click()}}><div className="upload-bubble"><CloudUpload size={27}/></div><strong>{tr('uploadInstructions')}</strong><span>{tr('uploadSub')}</span></div>
   {filtered.length===0?<Empty icon={<ImageIcon/>}>{tr('noMedia')}</Empty>:<div className="asset-grid">{filtered.map(asset=>{const c=clients.find(x=>x.id===asset.client_id);return <div className="asset-item" key={asset.id}><div className="asset-preview">{asset.mime_type.startsWith('image/')?<img loading="lazy" src={asset.url} alt={asset.filename}/>:<video src={asset.url} controls preload="metadata"/>}</div><div className="asset-details"><strong title={asset.filename}>{asset.filename}</strong><div><span>{c?.name||''}</span><span>{(asset.size_bytes/1024/1024).toFixed(1)} MB</span></div><div className="asset-action-row"><small>{formatDate(asset.created_at,lang,{day:'numeric',month:'short',year:'numeric'})}</small><button title={tr('delete')} className="icon-button danger-icon" onClick={()=>onDelete(asset)}><Trash2 size={15}/></button></div></div></div>})}</div>}
  </Panel></>
}

function AnalyticsPage({analytics,lang,tr,onMetric,days,setDays,selectedClient}:{analytics:Analytics,lang:Lang,tr:Translator,onMetric:()=>void,days:number,setDays:(n:number)=>void,selectedClient:ClientFilter}){
 const chartData=analytics.daily.map(row=>({...row,short:formatDate(row.day,lang,{day:'2-digit',month:'short'})}))
 const metrics=[{name:'totalImpressions',value:analytics.summary.impressions,icon:Activity},{name:'totalReach',value:analytics.summary.reach,icon:ArrowUpRight},{name:'engagements',value:analytics.summary.engagements,icon:Zap},{name:'followersGained',value:analytics.summary.followers_gained,icon:UsersRound}]
 return <><TitleArea eyebrow="PERFORMANCE LAB / 05" title={tr('analyticsHeadline')} desc={tr('analyticsDesc')} action={<div className="title-actions"><a className="btn secondary" href={`/api/reports/metrics.csv?days=${days}${selectedClient==='all'?'':`&client_id=${selectedClient}`}`} download><Download size={16}/><span>{tr('exportReport')}</span></a><Button icon={Plus} onClick={onMetric}>{tr('addMetric')}</Button></div>}/>
 <div className="analytics-toolbar"><div className="period-select"><Clock3 size={15}/>{tr('period')}<select value={days} onChange={e=>setDays(+e.target.value)}><option value={7}>{tr('last7Days')}</option><option value={30}>{tr('last30Days')}</option><option value={90}>{tr('last90Days')}</option></select></div><div className="source-tags">{analytics.source.demo_entries>0&&<span className="source-demo"><span/>{tr('sampleData')}</span>}{analytics.source.manual_entries>0&&<span className="source-manual"><span/>{tr('manualData')}</span>}</div></div>
 <div className="analytics-metrics">{metrics.map((m,i)=><div key={m.name} className="analytics-metric" style={{animationDelay:`${i*80}ms`}}><div className="analytics-icon"><m.icon size={20}/></div><span>{tr(m.name)}</span><strong>{prettyNum(m.value,lang)}</strong></div>)}</div>
 <Panel className="analytics-chart"><SectionHeading title={tr('contentPerformance')} sub={days===7?tr('last7Days'):days===90?tr('last90Days'):tr('last30Days')}/><div className="analytics-chart-inner"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{top:15,right:10,bottom:0,left:-19}}><defs><linearGradient id="anaGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#AAA1FF" stopOpacity={.4}/><stop offset="100%" stopColor="#AAA1FF" stopOpacity={0}/></linearGradient></defs><CartesianGrid vertical={false} stroke="var(--grid)" strokeDasharray="4 7"/><XAxis dataKey="short" tick={{fill:'var(--text-muted)',fontSize:11}} axisLine={false} tickLine={false} minTickGap={20}/><YAxis tick={{fill:'var(--text-muted)',fontSize:11}} axisLine={false} tickLine={false} tickFormatter={v=>prettyNum(v,lang)}/><Tooltip content={<ChartTooltip lang={lang}/>}/><Area name={tr('impressions')} type="monotone" dataKey="impressions" stroke="#AAA1FF" strokeWidth={3} fill="url(#anaGradient)" animationDuration={1300}/></AreaChart></ResponsiveContainer></div></Panel>
 <Panel><SectionHeading title={tr('platformComparison')}/><div className="analytics-chart-inner smaller"><ResponsiveContainer width="100%" height="100%"><BarChart data={analytics.platforms.map(p=>({...p,name:platformNames[p.platform]}))} barSize={44} margin={{top:15,right:8,bottom:0,left:-19}}><CartesianGrid vertical={false} stroke="var(--grid)" strokeDasharray="4 7"/><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill:'var(--text-muted)',fontSize:11}}/><YAxis tickFormatter={v=>prettyNum(v,lang)} axisLine={false} tickLine={false} tick={{fill:'var(--text-muted)',fontSize:11}}/><Tooltip content={<ChartTooltip lang={lang}/>}/><Bar dataKey="impressions" name={tr('impressions')} radius={[8,8,2,2]} animationDuration={1100}>{analytics.platforms.map(p=><Cell key={p.platform} fill={chartColors[p.platform]}/>)}</Bar></BarChart></ResponsiveContainer></div></Panel>
 {analytics.source.demo_entries>0&&<div className="demo-notice"><Sparkles size={16}/><strong>{tr('sampleData')}</strong><span>{tr('sampleExplanation')}</span></div>}
 </>
}

function ClientsPage({clients,posts,lang,tr,onNew,onEdit,onDelete}:{clients:Client[],posts:Post[],lang:Lang,tr:Translator,onNew:()=>void,onEdit:(c:Client)=>void,onDelete:(c:Client)=>void}){
 return <><TitleArea eyebrow="BRAND PORTFOLIO / 06" title={tr('clientsHeadline')} desc={tr('clientsDesc')} action={<Button icon={Plus} onClick={onNew}>{tr('addClient')}</Button>}/>
 {clients.length===0?<Empty icon={<UsersRound/>}>{tr('noClients')}</Empty>:<div className="client-grid">{clients.map((c,i)=><Panel key={c.id} className="client-card" style={{animationDelay:`${i*75}ms`}}><div className="client-card-top"><ClientAvatar client={c} size="large"/><div className="client-actions"><button className="icon-button" onClick={()=>onEdit(c)} title={tr('edit')}><Pencil size={15}/></button><button className="icon-button danger-icon" onClick={()=>onDelete(c)} title={tr('delete')}><Trash2 size={15}/></button></div></div><h2>{c.name}</h2><p className="muted tiny">{c.industry||tr('industry')}</p><div className="client-socmed">{platformList.filter(p=>!!c.accounts[p]).map(p=><span key={p} title={`${platformNames[p]} ${c.accounts[p]}`}><PlatformIcon p={p}/></span>)}</div><div className="client-card-bottom"><div><strong>{posts.filter(p=>p.client_id===c.id).length}</strong><span>{tr('totalContent')}</span></div><div><strong>{posts.filter(p=>p.client_id===c.id&&p.status==='scheduled').length}</strong><span>{tr('scheduled')}</span></div><div><strong>{formatDate(c.created_at,lang,{month:'short',year:'numeric'})}</strong><span>{tr('day')}</span></div></div></Panel>)}</div>}
 </>
}

function CaptionStudio({clients,selectedClient,lang,tr,onUse,notify}:{clients:Client[],selectedClient:ClientFilter,lang:Lang,tr:Translator,onUse:(draft:CaptionVariant,platform:Platform,clientId:number)=>void,notify:Notify}){
 const [topic,setTopic]=useState('');const [platform,setPlatform]=useState<Platform>('instagram');const [tone,setTone]=useState('luxury');const [contentLang,setContentLang]=useState<Lang>(lang);const [cta,setCta]=useState('');const [clientId,setClientId]=useState(selectedClient==='all'?clients[0]?.id||0:selectedClient)
 const [variants,setVariants]=useState<CaptionVariant[]>([]);const [busy,setBusy]=useState(false)
 useEffect(()=>setContentLang(lang),[lang]);useEffect(()=>{if(selectedClient!=='all')setClientId(selectedClient)},[selectedClient])
 async function generate(e:FormEvent){e.preventDefault();if(topic.trim().length<3){notify(tr('topicRequired'),'error');return}setBusy(true);try{const result=await api<{variants:CaptionVariant[]}>('/captions/generate',json('POST',{topic,platform,tone,language:contentLang,call_to_action:cta}));setVariants(result.variants)}catch(error){notify((error as Error).message,'error')}finally{setBusy(false)}}
 async function copy(text:string){try{await navigator.clipboard.writeText(text);notify(tr('copied'))}catch{notify('Clipboard unavailable','error')}}
 return <><TitleArea eyebrow="CREATIVE ASSISTANT / 07" title={tr('studioHeadline')} desc={tr('studioDesc')}/><div className="studio-layout"><Panel className="studio-form-panel"><div className="studio-orb"><WandSparkles size={27}/></div><h2>Creative Brief</h2><p className="muted tiny">{tr('captionHint')}</p><form className="studio-form" onSubmit={generate}><label className="field"><span>{tr('client')}</span><select value={clientId} onChange={e=>setClientId(+e.target.value)}>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label className="field"><span>{tr('topic')}</span><textarea required minLength={3} rows={3} placeholder={tr('topicPlaceholder')} value={topic} onChange={e=>setTopic(e.target.value)}/></label><div className="form-grid"><label className="field"><span>{tr('platform')}</span><select value={platform} onChange={e=>setPlatform(e.target.value as Platform)}>{platformList.map(p=><option key={p} value={p}>{platformNames[p]}</option>)}</select></label><label className="field"><span>{tr('tone')}</span><select value={tone} onChange={e=>setTone(e.target.value)}>{['professional','friendly','luxury','playful'].map(x=><option key={x} value={x}>{tr(x)}</option>)}</select></label></div><label className="field"><span>{tr('language')}</span><div className="language-pills">{locales.map(l=><button key={l} type="button" onClick={()=>setContentLang(l)} className={contentLang===l?'active':''}>{l.toUpperCase()}</button>)}</div></label><label className="field"><span>{tr('cta')}</span><input value={cta} maxLength={180} onChange={e=>setCta(e.target.value)} placeholder={tr('ctaPlaceholder')}/></label><Button type="submit" disabled={busy} icon={Sparkles} className="full-width">{busy?tr('loading'):tr('generate')}</Button></form></Panel>
 <Panel className="studio-results"><SectionHeading title={tr('resultVariations')} right={<span className="variant-count">{variants.length} / 3</span>}/>{variants.length===0?<div className="studio-placeholder"><div className="placeholder-orb"><Sparkles size={40}/></div><h3>{tr('studioHeadline')}</h3><p className="muted">{tr('studioDesc')}</p><span className="placeholder-decoration">✧ &nbsp; ✦ &nbsp; ✧</span></div>:<div className="caption-variants">{variants.map((v,i)=><div className="caption-variant" key={i}><div className="variant-head"><span>0{i+1} <span>—</span> {platformNames[platform]}</span><button title={tr('copy')} className="icon-button" onClick={()=>copy(`${v.title}\n\n${v.caption}`)}><Copy size={16}/></button></div><h3>{v.title}</h3><p>{v.caption}</p><button className="text-button" onClick={()=>onUse(v,platform,clientId)}>{tr('usePost')} <ArrowRight size={15}/></button></div>)}</div>}</Panel></div></>
}

export default function App(){
 const [lang,setLang]=useState<Lang>(()=>{const v=localStorage.getItem('socialos-lang');return v==='en'||v==='de'?v:'tr'})
 const [theme,setTheme]=useState<Theme>(()=>localStorage.getItem('socialos-theme')==='light'?'light':'dark')
 const [page,setPage]=useState<Page>('dashboard')
 const [selectedClient,setSelectedClient]=useState<ClientFilter>('all')
 const [days,setDays]=useState(30)
 const [clients,setClients]=useState<Client[]>([]);const [posts,setPosts]=useState<Post[]>([]);const [assets,setAssets]=useState<Asset[]>([]);const [analytics,setAnalytics]=useState<Analytics>(defaultAnalytics)
 const [loading,setLoading]=useState(true);const [error,setError]=useState('')
 const [editor,setEditor]=useState<Post|null|false>(false);const [clientEditor,setClientEditor]=useState<Client|null|false>(false);const [metricEditor,setMetricEditor]=useState(false)
 const [toast,setToast]=useState<{message:string,kind:'success'|'error'}|null>(null);const [mobileOpen,setMobileOpen]=useState(false)
 const tr=useCallback((key:string)=>t(lang,key),[lang]);
 useEffect(()=>{document.documentElement.dataset.theme=theme;localStorage.setItem('socialos-theme',theme)},[theme])
 useEffect(()=>{document.documentElement.lang=lang;localStorage.setItem('socialos-lang',lang)},[lang])
 const notify:Notify=useCallback((message,kind='success')=>{setToast({message,kind})},[])
 useEffect(()=>{if(!toast)return;const timer=setTimeout(()=>setToast(null),3500);return()=>clearTimeout(timer)},[toast])
 const refresh=useCallback(async()=>{
  try{const suffix=selectedClient==='all'?'':`?client_id=${selectedClient}`;const anaSuffix=`?days=${days}${selectedClient==='all'?'':`&client_id=${selectedClient}`}`
   const [newClients,newPosts,newAssets,newAnalytics]=await Promise.all([api<Client[]>('/clients'),api<Post[]>(`/posts${suffix}`),api<Asset[]>(`/assets${suffix}`),api<Analytics>(`/analytics${anaSuffix}`)])
   setClients(newClients);setPosts(newPosts);setAssets(newAssets);setAnalytics(newAnalytics);setError('')
  }catch(err){setError((err as Error).message)}finally{setLoading(false)}
 },[selectedClient,days])
 useEffect(()=>{void refresh()},[refresh])
 async function savePost(payload:PostPayload,id?:number){await api(`/posts${id?`/${id}`:''}`,json(id?'PATCH':'POST',payload));notify(tr(id?'postSaved':'postCreated'));await refresh()}
 async function deletePost(post:Post){if(!window.confirm(tr('confirmDeletePost')))return;try{await api(`/posts/${post.id}`,{method:'DELETE'});notify(tr('postDeleted'));await refresh()}catch(err){notify((err as Error).message,'error')}}
 async function movePost(post:Post,day:string|null){const time=post.scheduled_at?.slice(11,19)||'09:00:00';try{await api(`/posts/${post.id}`,json('PATCH',{status:day?'scheduled':'draft',scheduled_at:day?`${day}T${time}`:null}));notify(tr('postSaved'));await refresh()}catch(err){notify((err as Error).message,'error')}}
 async function saveClient(body:object,id?:number){await api(`/clients${id?`/${id}`:''}`,json(id?'PATCH':'POST',body));notify(tr(id?'clientSaved':'clientCreated'));await refresh()}
 async function deleteClient(client:Client){if(!window.confirm(tr('confirmDeleteClient')))return;try{await api(`/clients/${client.id}`,{method:'DELETE'});if(selectedClient===client.id)setSelectedClient('all');notify(tr('clientDeleted'));await refresh()}catch(err){notify((err as Error).message,'error')}}
 async function upload(file:File,clientId:number){try{const body=new FormData();body.append('client_id',String(clientId));body.append('file',file);await api('/assets',{method:'POST',body});notify(tr('assetUploaded'));await refresh()}catch(err){notify((err as Error).message,'error')}}
 async function deleteAsset(asset:Asset){if(!window.confirm(tr('confirmDeleteAsset')))return;try{await api(`/assets/${asset.id}`,{method:'DELETE'});notify(tr('assetDeleted'));await refresh()}catch(err){notify((err as Error).message,'error')}}
 const allVisiblePosts=posts
 const pageEntries:[Page,typeof LayoutDashboard][]=[['dashboard',LayoutDashboard],['calendar',CalendarDays],['content',FolderOpen],['library',ImageIcon],['analytics',BarChart3],['clients',UsersRound],['studio',WandSparkles]]
 function goPage(next:Page){setPage(next);setMobileOpen(false)}
 const focusedClient=selectedClient==='all'?null:clients.find(c=>c.id===selectedClient)
 if(loading)return <div className="app-loading"><div className="loading-logo"><Sparkles size={29}/></div><h2>Frameera Social OS</h2><div className="loading-bar"><span/></div></div>
 return <div className="app-shell">
  {mobileOpen&&<button className="mobile-overlay" aria-label="Close" onClick={()=>setMobileOpen(false)}/>}
  <aside className={`sidebar ${mobileOpen?'mobile-open':''}`}>
   <div className="sidebar-brand"><span className="brand-symbol"><span className="brand-inner"><Sparkles size={20}/></span></span><div><strong>FRAMEERA<span className="brand-thin">/OS</span></strong><small>SOCIAL COMMAND CENTER</small></div><button className="mobile-close icon-button" aria-label={tr('close')} onClick={()=>setMobileOpen(false)}><X size={18}/></button></div>
   <div className="workspace-switcher"><span className="switcher-icon"><Zap size={19}/></span><span><strong>Social Studio</strong><small>{tr('agencyMode')}</small></span><ChevronDown size={15}/></div>
   <div className="sidebar-group-label">{tr('navigation')}</div>
   <nav className="sidebar-nav">{pageEntries.slice(0,6).map(([id,Icon])=><button key={id} className={`nav-item ${page===id?'active':''}`} onClick={()=>goPage(id)}><Icon size={19} strokeWidth={page===id?2.2:1.7}/><span>{tr(id)}</span>{id==='content'&&<i className="nav-count">{posts.length}</i>}</button>)}</nav>
   <div className="sidebar-group-label secondary-label">{tr('tools')}</div><nav className="sidebar-nav"><button className={`nav-item ${page==='studio'?'active':''}`} onClick={()=>goPage('studio')}><WandSparkles size={19}/><span>{tr('studio')}</span><span className="nav-sparkle">✦</span></button></nav>
   <div className="sidebar-spacer"/>
   <div className="sidebar-note"><span className="sidebar-note-icon"><ShieldCheck size={16}/></span><div><strong>{tr('localFirst')}</strong><small>{tr('postingNote')}</small></div></div>
   <div className="sidebar-user"><span className="user-avatar">F</span><div><strong>Frameera Studio</strong><small>Creative workspace</small></div><MoreHorizontal size={16}/></div>
  </aside>
  <div className="main-layout"><header className="topbar"><div className="topbar-left"><button className="mobile-menu icon-button" onClick={()=>setMobileOpen(true)} aria-label={tr('openMenu')}><Menu size={21}/></button><span className="breadcrumb-muted">{tr('workspace')}</span><ChevronRight size={14}/><span className="breadcrumb-current">{tr(page)}</span></div>
   <div className="topbar-right"><div className="client-switch"><UsersRound size={16}/><select aria-label={tr('client')} value={selectedClient} onChange={e=>setSelectedClient(e.target.value==='all'?'all':+e.target.value)}><option value="all">{tr('allClients')}</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select><ChevronDown size={13}/></div><span className="topbar-divider"/><div className="lang-selector"><Globe2 size={15}/><select aria-label={tr('language')} value={lang} onChange={e=>setLang(e.target.value as Lang)}>{locales.map(l=><option key={l} value={l}>{l.toUpperCase()}</option>)}</select></div><button className="icon-button theme-toggle" title={theme==='dark'?'Light mode':'Dark mode'} onClick={()=>setTheme(theme==='dark'?'light':'dark')}>{theme==='dark'?<Sun size={18}/>:<Moon size={18}/>}</button><span className="topbar-divider"/><span className="topbar-avatar">F</span></div>
  </header>
  <main className="content-area">{error&&<div className="api-warning"><Bell size={17}/><span>{tr('errorLoading')} <small>{error}</small></span><button onClick={()=>void refresh()}>{tr('tryAgain')}</button></div>}
    {page==='dashboard'&&<Dashboard clients={clients} posts={allVisiblePosts} analytics={analytics} lang={lang} tr={tr} onPage={goPage} onNew={()=>setEditor(null)}/>}
    {page==='calendar'&&<Calendar posts={allVisiblePosts} clients={clients} lang={lang} tr={tr} onMove={movePost} onEdit={setEditor}/>}
    {page==='content'&&<Content posts={allVisiblePosts} clients={clients} assets={assets} lang={lang} tr={tr} onNew={()=>setEditor(null)} onEdit={setEditor} onDelete={deletePost}/>}
    {page==='library'&&<Library clients={clients} assets={assets} selectedClient={selectedClient} onUpload={upload} onDelete={deleteAsset} lang={lang} tr={tr}/>}
    {page==='analytics'&&<AnalyticsPage analytics={analytics} lang={lang} tr={tr} onMetric={()=>setMetricEditor(true)} days={days} setDays={setDays} selectedClient={selectedClient}/>}
    {page==='clients'&&<ClientsPage clients={clients} posts={posts} lang={lang} tr={tr} onNew={()=>setClientEditor(null)} onEdit={setClientEditor} onDelete={deleteClient}/>}
    {page==='studio'&&<CaptionStudio clients={clients} selectedClient={selectedClient} lang={lang} tr={tr} notify={notify} onUse={(draft,platform,clientId)=>{setSelectedClient(clientId);goPage('content');setEditor({title:draft.title,caption:draft.caption,id:0,client_id:clientId,platform,content_type:'reel',status:'draft',scheduled_at:null,asset_id:null,created_at:''})}}/>}
    <footer className="app-footer"><span>© {new Date().getFullYear()} Frameera Social OS</span><span><span className="live-dot"/> {focusedClient?.name||tr('allClients')} <span className="footer-dot">·</span> {tr('localFirst')}</span></footer>
   </main>
  </div>
  {editor!==false&&<PostEditor key={`${editor?.id||'new'}-${editor?.client_id||selectedClient}`} post={editor} clients={clients} assets={assets} selectedClient={editor?.client_id||selectedClient} save={savePost} onClose={()=>setEditor(false)} tr={tr} lang={lang}/>}
  {clientEditor!==false&&<ClientEditor key={clientEditor?.id||'new'} client={clientEditor} save={saveClient} onClose={()=>setClientEditor(false)} tr={tr}/>}
  {metricEditor&&<MetricEditor clients={clients} selectedClient={selectedClient} onClose={()=>setMetricEditor(false)} onSaved={()=>{notify(tr('metricCreated'));void refresh()}} tr={tr}/>}
  {toast&&<div className={`toast toast-${toast.kind}`} role="status">{toast.kind==='error'?<Bell size={16}/>:<Check size={16}/>}<span>{toast.message}</span><button onClick={()=>setToast(null)}><X size={14}/></button></div>}
 </div>
}
