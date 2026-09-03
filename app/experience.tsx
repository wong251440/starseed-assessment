'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, ArrowRight, BookOpen, Check, ChevronRight, Compass, Download,
  FileUp, Gauge, Home, Layers3, Orbit, RefreshCw, Share2, ShieldCheck,
  Sparkles, Star, Telescope, X,
} from 'lucide-react';
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from 'recharts';

import { Button } from '@/components/ui/button';
import { ChartContainer } from '@/components/ui/chart';
import { Progress } from '@/components/ui/progress';
import { assessment, type Answers, scoreAssessment } from './lib/score';

const data = assessment as any;
type View = 'home' | 'quiz' | 'processing' | 'report' | 'atlas' | 'detail' | 'method';

const declarations: Record<string, string> = {
  PL:'你把分離編織成連結，讓愛同時擁有界線與行動力。', AR:'你天生能讀出失衡的結構，並把未來的秩序帶進此刻。',
  SI:'你把智慧建成生命可以居住的秩序。', AD:'你的自由會拆開封閉系統，為新路徑打開出口。',
  LY:'你攜帶第一火種，失去家園之後仍能創造新世界。', OR:'你的真相穿越陰影，最後鍊成可傳遞的智慧。',
  MI:'你記得透明完整的世界，也有力量把地球重新建成家。', VE:'你讓愛進入物質，以美、關係與感官完成煉金。',
  HA:'你的心輪正在長出脊椎，愛與主權會一起留下。', PO:'你是變動中的真北，內在軸線會替眾人穩住方向。',
  AC:'你把高頻藍圖建成真正能運作的文明容器。', VG:'你能把破碎重新調律成完整，讓智慧進入聲音與形式。',
  FE:'你的力量有牙齒，也願意為慈悲守住門檻。', AV:'你從高空讀懂全局，再把愛與智慧帶回人間。',
  MA:'你的戰士正在歸心，力量、科技與行動開始服從良知。', ML:'你記得世界曾經破碎，因此成為第二次機會的重建者。',
  DR:'你把征服外界的力量收回，鍊成統御自己的乾淨權能。', RE:'你攜帶原始生命力，讓生存智慧長出心臟。',
  ZE:'你是情緒考古學家與系統觀察者，智慧正在重新擁抱感受。', AN:'你天生看見文明尺度，權力正在學會承載整個世界。',
  TC:'你能讓不同主權在同一張桌上共存，建立真正的共同世界。', AT:'你守住關鍵門檻，辨識時機，帶領生命穿越轉折。',
};

const insights: Record<string, { gifts:string[]; shadows:string[]; key:string }> = {
  PL:{gifts:['情緒共振','關係修復','直覺感知'],shadows:['過度付出','吸收他人情緒','害怕衝突'],key:'讓和平保留真實。'},
  AR:{gifts:['系統建構','模式辨識','能量校準'],shadows:['完美主義','分析過度','心腦分離'],key:'讓智慧長出溫度。'},
  SI:{gifts:['長期守護','古老知識','結構忠誠'],shadows:['責任過重','情緒內收','固守形式'],key:'讓秩序繼續呼吸。'},
  AD:{gifts:['主權意識','打開限制','跨域視角'],shadows:['難以落地','承諾壓力','快速抽離'],key:'把自由建成可以停留的家。'},
  LY:{gifts:['開路創建','勇氣點燃','自主領導'],shadows:['驕傲','過度獨立','拒絕脆弱'],key:'允許別人走進你的火光。'},
  OR:{gifts:['真相辨識','辯證思考','暗影整合'],shadows:['分析停滯','情緒抽離','永遠質疑'],key:'讓真相開始流動。'},
  MI:{gifts:['清澈共感','希望重建','水域共鳴'],shadows:['理想化','逃離混濁','被負面淹沒'],key:'在不完美裡建造樂園。'},
  VE:{gifts:['美感鍊金','具身感受','關係和諧'],shadows:['討好','浪漫投射','消融自我'],key:'讓美麗保留邊界。'},
  HA:{gifts:['無條件之愛','深度連結','創傷陪伴'],shadows:['依附','天真信任','為愛失去自己'],key:'愛得深，也站得穩。'},
  PO:{gifts:['穩定混亂','方向感','整合兩極'],shadows:['疏離','僵化','扛起所有責任'],key:'成為可以移動的北方。'},
  AC:{gifts:['長程規劃','實際建造','文明整合'],shadows:['僵硬','過度修正未來','低自發性'],key:'在資料之外信任生命。'},
  VG:{gifts:['創意調律','知識療癒','自然敏感'],shadows:['退縮','不連續','害怕再次失去'],key:'你自己就是那個文明。'},
  FE:{gifts:['主權守護','榮譽感','安靜威嚴'],shadows:['孤獨','驕傲','守護變控制'],key:'把王者的力量交給慈悲。'},
  AV:{gifts:['高空視角','訊息傳譯','自由守護'],shadows:['離地','情緒升空','替人決定'],key:'住進身體，讓智慧被觸摸。'},
  MA:{gifts:['迅速行動','突破阻力','強韌守護'],shadows:['急躁','怒火','以戰鬥換安全'],key:'卸下盔甲，力量仍在。'},
  ML:{gifts:['災難預警','生態責任','重建韌性'],shadows:['倖存者罪惡','過度警戒','以控制換安全'],key:'看見危險，也相信生命。'},
  DR:{gifts:['權力素養','戰略秩序','暗影承載'],shadows:['控制','威嚇','不能示弱'],key:'你已懂征服，現在鍊成主權。'},
  RE:{gifts:['適應力','本能判讀','資源建造'],shadows:['操控','過勞','身份變色'],key:'讓原始力量成為生命盟友。'},
  ZE:{gifts:['精密觀察','資料分析','科學洞察'],shadows:['解離','社交疏離','情感難以整合'],key:'讓感受進入你的知識系統。'},
  AN:{gifts:['文明尺度','組織權威','技術建構'],shadows:['權力負擔','掌控','壓迫記憶'],key:'從管理世界走向承載世界。'},
  TC:{gifts:['多方視角','協作解題','主權外交'],shadows:['過度妥協','延遲衝突','忘記自身立場'],key:'共識也要保留你的聲音。'},
  AT:{gifts:['戰略時機','警覺守護','榮譽責任'],shadows:['過度保護','高警戒','安全式控制'],key:'守門，同時允許生命通過。'},
};

function hash(value: string) { let n = 2166136261; for (const c of value) n = Math.imul(n ^ c.charCodeAt(0), 16777619); return n >>> 0; }
function shuffled<T extends {id:string}>(items: T[], seed: string) { return [...items].sort((a,b)=>hash(seed+a.id)-hash(seed+b.id)); }

function orderedQuestions() {
  const core = [0,1,2].flatMap((facet) => Array.from({length:12},(_,d)=>data.questions.core[d*3+facet]));
  const sig = [0,1,2,3].flatMap((offset) => data.questions.signature.filter((_:any,i:number)=>i%4===offset));
  const pools: Record<string, any[]> = { core, signature:sig, generic:[...data.questions.generic], mission:[...data.questions.mission], polarity:[...data.questions.polarity], quality:[...data.questions.quality] };
  const rhythm = ['core','signature','core','generic','signature','core','mission','core','signature','quality','core','polarity'];
  const result:any[]=[]; let cursor=0;
  while (result.length < 84) {
    const desired = rhythm[cursor++ % rhythm.length];
    const key = pools[desired]?.length ? desired : Object.keys(pools).find((k)=>pools[k].length);
    if (!key) break;
    result.push(pools[key].shift());
  }
  return result;
}

function sampleAnswers(): Answers {
  const answers: Answers = {};
  const target = data.lineages.find((l:any)=>l.code==='AR');
  data.questions.core.forEach((q:any)=>{ const p=target.prototype[q.dimension-1]; answers[q.id]=Math.round(4+3*p); });
  data.questions.signature.forEach((q:any)=>{ const m=data.signatureMatrix.AR[q.slot]; const sorted=[...q.options].sort((a:any,b:any)=>(m>=0?b.value-a.value:a.value-b.value)); answers[q.id]=sorted[0].id; });
  data.questions.generic.forEach((q:any,i:number)=>answers[q.id]=i<6?'A':'A');
  data.questions.mission.forEach((q:any)=>answers[q.id]=[...q.options].sort((a:any,b:any)=>['MB','MT','MG','MC','MH','ML'].indexOf(a.mission)-['MB','MT','MG','MC','MH','ML'].indexOf(b.mission)).map((o:any)=>o.mission));
  data.questions.polarity.forEach((q:any)=>answers[q.id]='B');
  data.questions.quality.forEach((q:any,i:number)=>answers[q.id]=q.type==='quality-scale'?(target.prototype[q.compare-1]>=0?6:2):(i===4?'B':'A'));
  return answers;
}

function validateImportedAnswers(answers: Answers, questions: any[]) {
  for (const q of questions) {
    const value = answers[q.id];
    if (value === undefined) throw new Error(`缺少題目：${q.id}`);
    if (q.type === 'core' || q.type === 'quality-scale') {
      if (value !== 'NA' && (!Number.isInteger(value) || value < 1 || value > 7)) throw new Error(`答案值不正確：${q.id}`);
      continue;
    }
    if (q.type === 'mission') {
      const allowed = q.options.map((option:any)=>option.mission);
      if (!Array.isArray(value) || value.length !== 4 || new Set(value).size !== 4 || value.some((item:string)=>!allowed.includes(item))) throw new Error(`排序答案不正確：${q.id}`);
      continue;
    }
    const allowed = q.options?.map((option:any)=>option.id) ?? [];
    if (!allowed.includes(value) && !(q.allowNA && value === 'NA')) throw new Error(`答案值不正確：${q.id}`);
  }
}

function Metric({label,value,suffix='',tone='cyan'}:{label:string;value:number;suffix?:string;tone?:string}) {
  return <div className="metric-card"><p>{label}</p><strong className={`tone-${tone}`}>{Math.round(value)}{suffix}</strong></div>;
}

function Header({onHome,onAtlas}:{onHome:()=>void;onAtlas:()=>void}) {
  return <nav className="site-nav"><button onClick={onHome} className="brand"><span><Orbit /></span>星源圖譜</button><button onClick={onAtlas} className="nav-pill"><Telescope />22 文明圖鑑</button></nav>;
}

export default function Experience() {
  const questions = useMemo(orderedQuestions, []);
  const [view,setView]=useState<View>('home');
  const [answers,setAnswers]=useState<Answers>({});
  const [index,setIndex]=useState(0);
  const [report,setReport]=useState<any>(null);
  const [selected,setSelected]=useState<any>(data.lineages[0]);
  const [ranked,setRanked]=useState<string[]>([]);
  const [seed]=useState('星源圖譜-v1');
  const [notice,setNotice]=useState('');
  const [isSample,setIsSample]=useState(false);
  const inputRef=useRef<HTMLInputElement>(null);

  useEffect(()=>{ try { const saved=localStorage.getItem('starseed-progress-v1'); if(saved){const parsed=JSON.parse(saved);setAnswers(parsed.answers||{});setIndex(parsed.index||0);} } catch {} },[]);
  useEffect(()=>{ if(Object.keys(answers).length) localStorage.setItem('starseed-progress-v1',JSON.stringify({answers,index})); },[answers,index]);
  useEffect(()=>{
    const context=(document as any).modelContext; if(!context?.registerTool) return;
    const lifecycle=new AbortController();
    Promise.resolve(context.registerTool({name:'open_sample_report',title:'開啟報告範例',description:'在星源圖譜網站中產生並開啟完整的報告範例。',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(){const a=sampleAnswers();setReport(scoreAssessment(a));setIsSample(true);setView('report');window.scrollTo(0,0);return {status:'opened',report:'sample'};}},{signal:lifecycle.signal})).catch(()=>{});
    return ()=>lifecycle.abort();
  },[]);

  const start=()=>{setIsSample(false);const first=questions.findIndex((q:any)=>answers[q.id]===undefined);setIndex(first<0?0:first);setView('quiz');window.scrollTo(0,0)};
  const showSample=()=>{const a=sampleAnswers();setReport(scoreAssessment(a));setIsSample(true);setView('report');window.scrollTo(0,0)};
  const finish=(next:Answers)=>{setAnswers(next);setView('processing');window.setTimeout(()=>{setReport(scoreAssessment(next));setView('report');window.scrollTo(0,0)},1150)};
  const answer=(value:any)=>{const q=questions[index];const next={...answers,[q.id]:value};setAnswers(next);setRanked([]); if(index===questions.length-1) finish(next); else setIndex(index+1)};
  const openDetail=(l:any)=>{setSelected(l);setView('detail');window.scrollTo(0,0)};
  const goHome=()=>{setView('home');window.scrollTo(0,0)};
  const goAtlas=()=>{setView('atlas');window.scrollTo(0,0)};

  const exportAnswers=()=>{const blob=new Blob([JSON.stringify({format:'starseed-assessment-answers',version:1,answers},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='星源圖譜-答案.json';a.click();URL.revokeObjectURL(url);setNotice('答案已匯出');};
  const importAnswers=async(file?:File)=>{if(!file)return;try{const parsed=JSON.parse(await file.text());if(parsed.format!=='starseed-assessment-answers'||parsed.version!==1||typeof parsed.answers!=='object'||Array.isArray(parsed.answers))throw new Error('檔案格式或版本不正確');validateImportedAnswers(parsed.answers,questions);setAnswers(parsed.answers);setReport(scoreAssessment(parsed.answers));setIsSample(false);setView('report');setNotice('答案已匯入並完成判讀');window.scrollTo(0,0);}catch(e:any){setNotice(`無法匯入：${e.message}`)}};

  if(view==='quiz') return <Quiz questions={questions} index={index} answers={answers} seed={seed} ranked={ranked} setRanked={setRanked} onAnswer={answer} onBack={()=>index?setIndex(index-1):goHome()} />;
  if(view==='processing') return <Processing />;
  if(view==='report'&&report) return <Report report={report} sample={isSample} onHome={goHome} onAtlas={goAtlas} onDetail={openDetail} onExport={exportAnswers} onRestart={()=>{setAnswers({});setIndex(0);setIsSample(false);setView('quiz')}} onShare={async()=>{const text=`我的星源圖譜：${report.declaration.title}｜${Math.round(report.ranking[0].final)} 分`;if(navigator.share)await navigator.share({title:'星源圖譜',text,url:location.href});else{await navigator.clipboard.writeText(`${text} ${location.href}`);setNotice('結果連結已複製')}}} />;
  if(view==='atlas') return <Atlas onHome={goHome} onDetail={openDetail} />;
  if(view==='detail') return <Detail lineage={selected} onHome={goHome} onAtlas={goAtlas} />;
  if(view==='method') return <Method onHome={goHome} />;

  return <main className="cosmic-shell min-h-screen overflow-hidden text-white">
    <div className="px-5 pt-5 sm:px-8"><Header onHome={goHome} onAtlas={goAtlas}/></div>
    <section className="hero-grid mx-auto grid min-h-[calc(100vh-72px)] max-w-6xl items-center gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[1.08fr_.92fr] lg:py-16">
      <div className="relative z-10">
        <div className="eyebrow"><Sparkles/>84 題・12 維・22 種星際文明</div>
        <p className="mb-3 font-serif text-lg text-cyan-100/85">你的靈魂記得來處。</p>
        <h1 className="hero-title">找回你的<span className="cosmic-ink block">星際血脈</span></h1>
        <p className="hero-copy">穿越表面性格，讀取你的思考機制、關係模式、力量取向與深層鄉愁。你的 22 文明共振星圖，現在開始顯現。</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button onClick={start} className="primary-cta">{Object.keys(answers).length?'繼續測驗':'開始探索'}<ArrowRight/></Button>
          <Button onClick={showSample} variant="outline" className="secondary-cta"><BookOpen/>查看報告範例</Button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:flex">
          <button className="utility-link" onClick={()=>inputRef.current?.click()}><FileUp/>匯入答案</button>
          <button className="utility-link" onClick={exportAnswers} disabled={!Object.keys(answers).length}><Download/>匯出答案</button>
          <input ref={inputRef} type="file" accept="application/json" className="hidden" onChange={(e)=>importAnswers(e.target.files?.[0])}/>
        </div>
        <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-400"><span className="flex items-center gap-1.5"><ShieldCheck className="size-3.5"/>答案只留在你的裝置</span><button onClick={()=>setView('method')} className="flex items-center gap-1.5 hover:text-white"><Layers3 className="size-3.5"/>閱讀判讀方法</button></div>
      </div>
      <div className="hero-orbit"><div className="orb-glow"/><div className="orbit-ring absolute inset-[2%] rounded-full border border-cyan-100/20"/><div className="hero-medallion"><img src="civilizations/1.png" alt="昴宿星文明象徵"/></div><div className="hero-note"><p>多層分類系統</p><strong>原型 × 特徵 × 穩定性</strong></div></div>
    </section>
    <section className="feature-strip"><div><b>12</b><span>底層心理維度</span></div><div><b>24</b><span>文明差異機制</span></div><div><b>500</b><span>次穩定性重抽</span></div><div><b>100%</b><span>本機完成判讀</span></div></section>
    <section className="home-panel"><p className="section-kicker">你的完整星圖</p><h2>一份有深度、也有方向的文明報告</h2><div className="home-cards"><article><Compass/><h3>主文明與家族</h3><p>辨認單一主導、家族亞型、雙重共振與開放型星圖。</p></article><article><Gauge/><h3>使命與力量</h3><p>看見你最自然的貢獻方式，以及你如何分配自主權與利益。</p></article><article><Star/><h3>22 文明深度圖鑑</h3><p>每個文明都有獨立圖像、故事、天賦、陰影與進化鑰匙。</p></article></div></section>
    {notice&&<div className="toast-note" onClick={()=>setNotice('')}>{notice}<X/></div>}
  </main>;
}

function Quiz({questions,index,answers,seed,ranked,setRanked,onAnswer,onBack}:any){
  const q=questions[index]; const progress=((index+1)/questions.length)*100;
  const isScale=q.type==='core'||q.type==='quality-scale';
  const flipped=isScale&&hash(seed+q.id)%2===0;
  const options=q.options?shuffled(q.options,seed+q.id):[];
  const left=flipped?q.positive:q.negative, right=flipped?q.negative:q.positive;
  const selected=answers[q.id];
  return <main className="quiz-shell min-h-screen text-white"><header className="quiz-header"><button onClick={onBack} aria-label="上一題"><ArrowLeft/></button><div><Progress value={progress} className="quiz-progress"/><span>{index+1} / {questions.length}</span></div><span className="size-10"/></header><section className="question-wrap"><div className="question-number">題目 {String(index+1).padStart(2,'0')}</div><h1>{q.question}</h1>{q.intro&&<p className="question-intro">{q.intro}</p>}
  {isScale&&<div className="scale-card"><div className="scale-endpoints"><p>{left}</p><p>{right}</p></div><div className="scale-grid">{[1,2,3,4,5,6,7].map((pos)=>{const semantic=flipped?8-pos:pos;return <button key={pos} onClick={()=>onAnswer(semantic)} className={selected===semantic?'selected':''}><span>{pos}</span></button>})}</div><button onClick={()=>onAnswer('NA')} className="na-button">我目前無法判斷</button></div>}
  {q.type==='mission'&&<div className="ranking-card"><p>依最自然想投入的程度，由第一名排到第四名</p><div className="ranked-row">{[0,1,2,3].map((i)=><span key={i} className={ranked[i]?'filled':''}>{ranked[i]?`${i+1}｜${data.missions[ranked[i]]}`:`${i+1}`}</span>)}</div><div className="choice-list">{options.filter((o:any)=>!ranked.includes(o.mission)).map((o:any)=><button key={o.id} onClick={()=>{const next=[...ranked,o.mission];setRanked(next);if(next.length===4)setTimeout(()=>onAnswer(next),180)}}><span>{ranked.length+1}</span><div><b>{data.missions[o.mission]}</b><p>{o.text}</p></div><ChevronRight/></button>)}</div>{ranked.length>0&&<button onClick={()=>setRanked([])} className="na-button">重新排序</button>}</div>}
  {!isScale&&q.type!=='mission'&&<div className="choice-list">{options.map((o:any)=><button key={o.id} onClick={()=>onAnswer(o.id)} className={selected===o.id?'selected':''}><span>{String.fromCharCode(65+options.indexOf(o))}</span><p>{o.text}</p><ChevronRight/></button>)}{q.allowNA&&<button onClick={()=>onAnswer('NA')} className="na-choice"><span>—</span><p>我目前無法可靠判斷</p></button>}</div>}
  </section></main>;
}

function Processing(){return <main className="processing-shell"><div className="star-loader"><span/><span/><span/><Orbit/></div><p>星圖正在對齊</p><h1>你的文明訊號正在聚合</h1><div className="processing-steps"><span><Check/>12 維原型已定位</span><span><Check/>差異機制已交叉比對</span><span><Check/>穩定性正在驗證</span></div></main>}

function Report({report,sample,onHome,onAtlas,onDetail,onExport,onRestart,onShare}:any){const primary=report.ranking[0];const story=insights[primary.code];const radar=data.dimensions.map((name:string,i:number)=>({name:name.slice(0,4),value:Math.round(((report.dimensions[i]??0)+1)*50)}));const storyCards=[['核心本質',declarations[primary.code]],['關係與界線',`你以${story.gifts[0]}進入關係，也正在鍛鍊${story.shadows[0]}所要求的清晰界線。`],['壓力反應',`壓力升高時，${story.shadows.join('、')}會浮現；看見它們，你便能重新掌舵。`],['力量使用',`你的力量透過${story.gifts.join('、')}落地，行動越清楚，影響力越集中。`],['地球使命',`把${story.gifts[0]}帶進真實世界，讓天賦形成可被他人感受到的成果。`],['進化鑰匙',story.key]];return <main className="report-shell min-h-screen text-white"><div className="px-5 pt-5 sm:px-8"><Header onHome={onHome} onAtlas={onAtlas}/></div><section className="report-hero"><div className="report-icon"><img src={primary.icon} alt={`${primary.name}象徵`}/></div><div className="report-hero-copy">{sample&&<span className="sample-chip">報告範例</span>}<p className="section-kicker">你的星際血脈</p><h1>{report.declaration.title}</h1><h2>{report.declaration.subtitle}</h2><p>{declarations[primary.code]}</p><div className="hero-stats"><Metric label="文明契合" value={primary.final} suffix=""/><Metric label="身份共振" value={report.gate}/><Metric label="分類信心" value={report.confidence}/></div></div></section>
  <div className="report-body"><section className="report-section"><div className="section-heading"><div><p className="section-kicker">文明座標</p><h2>最接近你的五個文明</h2></div><p>契合值表示你在這套 22 文明原型內的接近程度。</p></div><div className="ranking-list">{report.ranking.slice(0,5).map((l:any,i:number)=><button key={l.code} onClick={()=>onDetail(l)}><span className="rank-no">0{i+1}</span><img src={l.icon} alt=""/><div><b>{l.name}</b><small>{l.family==='獨立'?'獨立文明':l.family}</small><div className="score-track"><i style={{width:`${l.final}%`}}/></div></div><strong>{Math.round(l.final)}</strong></button>)}</div></section>
  <section className="report-grid"><article className="chart-card"><p className="section-kicker">你的 12 維座標</p><h2>底層運作輪廓</h2><ChartContainer config={{value:{label:'強度',color:'#8ee9ff'}}} className="h-[330px] w-full"><RadarChart data={radar}><PolarGrid stroke="rgba(187,229,255,.18)"/><PolarAngleAxis dataKey="name" tick={{fill:'#b9c6dc',fontSize:11}}/><Radar dataKey="value" stroke="#8ee9ff" fill="#6f8cff" fillOpacity={.34}/></RadarChart></ChartContainer></article><article className="split-score-card"><p className="section-kicker">判讀分解</p><h2>原型與差異訊號</h2><div className="big-dual"><div><strong>{Math.round(primary.prototypeFit)}</strong><span>12 維原型契合</span></div><div><strong>{Math.round(primary.signatureFit)}</strong><span>文明特徵契合</span></div></div><dl><div><dt>與第二名差距</dt><dd>{report.gap.toFixed(1)}</dd></div><div><dt>差異一致性</dt><dd>{Math.round(Math.abs(report.margin)*100)}</dd></div><div><dt>500 次重抽穩定</dt><dd>{Math.round(report.stability*100)}%</dd></div><div><dt>移除單維仍一致</dt><dd>{Math.round(report.loo*100)}%</dd></div></dl></article></section>
  <section className="report-section"><p className="section-kicker">你的文明核心</p><h2>天賦會照亮道路，陰影會鍛造力量</h2><div className="gift-grid"><article><span>天賦</span><h3>你攜帶的天賦</h3>{story.gifts.map((x:string)=><p key={x}><Sparkles/>{x}</p>)}</article><article><span>陰影</span><h3>正在進化的陰影</h3>{story.shadows.map((x:string)=><p key={x}><Orbit/>{x}</p>)}</article></div><blockquote>{story.key}</blockquote></section>
  <section className="report-grid"><article className="chart-card"><p className="section-kicker">使命圖譜</p><h2>{report.missionLabel}</h2><div className="bar-list">{report.mission.map((m:any)=><div key={m.code}><span>{m.name}</span><i><b style={{width:`${m.score}%`}}/></i><strong>{Math.round(m.score)}</strong></div>)}</div></article><article className="chart-card"><p className="section-kicker">力量使用</p><h2>{report.polarity.label}</h2><div className="polarity-stack"><GaugeRow label="他人自主權尊重" value={(report.polarity.agency+1)*50}/><GaugeRow label="共享利益取向" value={(report.polarity.benefit+1)*50}/><GaugeRow label="整體取向" value={(report.polarity.overall+1)*50}/></div><p className="card-note">你的力量傾向把決定權、共同利益與行動效率放在這個位置。</p></article></section>
  <section className="story-section"><div className="story-lead"><p className="section-kicker">文明深層記憶</p><h2>{primary.subtitle}</h2><p>{declarations[primary.code]}</p></div><div className="story-columns">{storyCards.map(([title,body],i)=><article key={title} className={i===0?'wide':''}><span>0{i+1}</span><h3>{title}</h3><p>{body}</p></article>)}</div><Button onClick={()=>onDetail(primary)} className="primary-cta mx-auto mt-8">閱讀完整文明卷宗<ArrowRight/></Button></section>
  <section className="quality-panel"><div><p className="section-kicker">本次作答品質</p><h2>{report.qualityLabel}</h2><p>語意一致、作答變化、完成覆蓋與現實感共同形成這次判讀信心。</p></div><div className="quality-ring" style={{'--score':`${report.quality*3.6}deg`} as any}><strong>{Math.round(report.quality)}</strong><span>品質分</span></div><div className="quality-mini"><Metric label="語意一致" value={report.consistency*100}/><Metric label="作答響應" value={report.pattern*100}/><Metric label="完成覆蓋" value={report.coverage*100}/></div></section>
  <section className="other-worlds"><p className="section-kicker">繼續穿越星圖</p><h2>查看其他 21 個文明</h2><div className="world-row">{report.ranking.map((l:any)=><button key={l.code} onClick={()=>onDetail(l)}><img src={l.icon} alt=""/><span>{l.name}</span><b>{Math.round(l.final)}</b></button>)}</div></section>
  <section className="report-actions"><Button onClick={onExport} variant="outline" className="secondary-cta"><Download/>匯出答案</Button><Button onClick={onShare} variant="outline" className="secondary-cta"><Share2/>分享結果</Button><Button onClick={onRestart} variant="outline" className="secondary-cta"><RefreshCw/>重新測驗</Button></section></div></main>}

function GaugeRow({label,value}:{label:string;value:number}){return <div><span>{label}</span><div className="polarity-track"><i/><b style={{left:`${value}%`}}/></div><strong>{Math.round(value)}</strong></div>}

function Atlas({onHome,onDetail}:any){return <main className="atlas-shell min-h-screen text-white"><div className="px-5 pt-5 sm:px-8"><Header onHome={onHome} onAtlas={()=>{}}/></div><section className="atlas-hero"><p className="section-kicker">二十二文明</p><h1>22 文明星際圖鑑</h1><p>每一個文明都有獨立的歷史、力量結構、關係語言與進化方向。選擇一枚徽記，進入它的完整卷宗。</p></section><section className="atlas-grid">{data.lineages.map((l:any)=><button key={l.code} onClick={()=>onDetail(l)}><div><img src={l.icon} alt={`${l.name}象徵`}/><span>{String(l.index).padStart(2,'0')}</span></div><p>{l.family==='獨立'?'星際文明':l.family}</p><h2>{l.name}</h2><small>{l.english}</small><blockquote>{declarations[l.code]}</blockquote><i><ArrowRight/></i></button>)}</section></main>}

function Detail({lineage,onHome,onAtlas}:any){const info=insights[lineage.code];return <main className="detail-shell min-h-screen text-white"><div className="px-5 pt-5 sm:px-8"><Header onHome={onHome} onAtlas={onAtlas}/></div><section className="detail-hero"><div className="detail-medallion"><img src={lineage.icon} alt={`${lineage.name}象徵`}/></div><div><button onClick={onAtlas} className="back-link"><ArrowLeft/>返回 22 文明圖鑑</button><p className="section-kicker">{lineage.family==='獨立'?'獨立文明':lineage.family} · 資料共識 {lineage.lore}</p><h1>{lineage.name}</h1><h2>{lineage.english}</h2><p>{declarations[lineage.code]}</p><blockquote>{info.key}</blockquote></div></section><section className="detail-body"><div className="gift-grid"><article><span>天賦</span>{info.gifts.map((x:string)=><h3 key={x}>{x}</h3>)}</article><article><span>進化課題</span>{info.shadows.map((x:string)=><h3 key={x}>{x}</h3>)}</article></div><div className="prototype-card"><div><p className="section-kicker">12 維文明原型</p><h2>文明頻率座標</h2></div><div className="prototype-bars">{lineage.prototype.map((v:number,i:number)=><div key={i}><span>{data.dimensions[i]}</span><i><b style={{left:`${(v+1)*50}%`}}/></i><strong>{v>0?'+':''}{v}</strong></div>)}</div></div><article className="longform"><p className="section-kicker">文明卷宗</p><h2>{lineage.subtitle}</h2>{lineage.sections.map((s:any,i:number)=><section key={`${s.title}-${i}`}><span>{String(i+1).padStart(2,'0')}</span><div><h3>{s.title}</h3>{s.paragraphs.map((p:string,j:number)=><p key={j}>{p}</p>)}</div></section>)}</article></section></main>}

function Method({onHome}:any){return <main className="method-shell min-h-screen text-white"><div className="px-5 pt-5 sm:px-8"><Header onHome={onHome} onAtlas={()=>{}}/></div><article><p className="section-kicker">判讀引擎</p><h1>你的星圖如何被讀出來</h1><p className="lead">84 個回答會沿六條互不混算的軌道前進。文明契合、身份共振、使命、力量取向與作答品質各自保留完整訊息。</p>{[['36 題核心維度','定位關係共振、系統認知、主權、秩序、行動、複雜容納、歸屬、美感、生態、傳承、直覺與傳譯。'],['24 題差異機制','在相近文明之間比較你真正使用的底層方法，支持與反證都會進入判讀。'],['文明契合','12 維原型占 60%，差異特徵占 40%；分數表示文明原型內契合強度。'],['500 次穩定性驗證','固定種子重抽與逐維移除共同檢查主文明是否穩定出現。'],['獨立結果軌道','身份共振只控制語氣；使命、力量取向與品質只呈現各自結果，永遠不改文明排名。']].map(([h,p],i)=><section key={h}><span>0{i+1}</span><div><h2>{h}</h2><p>{p}</p></div></section>)}<Button onClick={onHome} className="primary-cta mt-10"><Home/>返回首頁</Button></article></main>}
