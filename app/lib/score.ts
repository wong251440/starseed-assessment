import assessment from '../data/assessment.json';

export type Answer = number | string | string[];
export type Answers = Record<string, Answer>;

const data = assessment as any;
const clamp = (n: number, min = 0, max = 1) => Math.min(max, Math.max(min, n));
const mean = (values: number[]) => values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
const optionValue = (collection: any[], id: string, answer: Answer) => collection.find((q) => q.id === id)?.options?.find((o: any) => o.id === answer)?.value;

const sat = (values: number[]) => values.sort((a, b) => b - a).reduce((sum, v, i) => sum + v * ([1, .6, .3][i] ?? .15), 0);

function signatureFit(answers: Answers, onlySlots?: string[]) {
  const result: Record<string, number> = {};
  for (const lineage of data.lineages) {
    const groups: Record<string, { pos: number[]; neg: number[]; max: number[] }> = {};
    for (const q of data.questions.signature) {
      if (onlySlots && !onlySlots.includes(q.slot)) continue;
      const answer = answers[q.id];
      if (typeof answer !== 'string' || answer === 'NA') continue;
      const r = optionValue(data.questions.signature, q.id, answer);
      const m = data.signatureMatrix[lineage.code][q.slot] ?? 0;
      if (!m || typeof r !== 'number') continue;
      const group = data.mechanismGroups[q.slot];
      const bucket = groups[group] ??= { pos: [], neg: [], max: [] };
      const maxEvidence = data.qWeights[q.slot] * Math.abs(m) / 2;
      const evidence = maxEvidence * r * Math.sign(m);
      (evidence >= 0 ? bucket.pos : bucket.neg).push(Math.abs(evidence));
      bucket.max.push(maxEvidence);
    }
    let support = 0, contradiction = 0, maximum = 0;
    Object.values(groups).forEach((g) => { support += sat(g.pos); contradiction += sat(g.neg); maximum += sat(g.max); });
    result[lineage.code] = maximum ? 100 * clamp((support - .65 * contradiction) / maximum) : 0;
  }
  return result;
}

function prototypeFit(dimensions: Array<number | null>, onlyDimensions?: number[]) {
  const result: Record<string, number> = {};
  for (const lineage of data.lineages) {
    let weighted = 0, denom = 0;
    lineage.prototype.forEach((p: number, i: number) => {
      if (p === 0 || dimensions[i] === null || (onlyDimensions && !onlyDimensions.includes(i))) return;
      const coverage = data.questions.core.filter((q: any) => q.dimension === i + 1 && typeof dimensions[i] === 'number').length / 3;
      const w = Math.abs(p) * coverage;
      weighted += w * Math.abs((dimensions[i] as number) - p);
      denom += 2 * w;
    });
    result[lineage.code] = denom ? 100 * (1 - weighted / denom) : 0;
  }
  return result;
}

function pairwiseMargin(a: string, b: string, answers: Answers) {
  let top = 0, bottom = 0;
  for (const q of data.questions.signature) {
    const answer = answers[q.id];
    const r = typeof answer === 'string' ? optionValue(data.questions.signature, q.id, answer) : null;
    if (typeof r !== 'number') continue;
    const delta = (data.signatureMatrix[a][q.slot] ?? 0) - (data.signatureMatrix[b][q.slot] ?? 0);
    top += data.qWeights[q.slot] * r * delta;
    bottom += data.qWeights[q.slot] * Math.abs(delta);
  }
  return bottom ? top / bottom : 0;
}

function seeded(seed = 0x51a7) {
  let x = seed >>> 0;
  return () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return (x >>> 0) / 4294967296; };
}

function classificationLabel(top: any, second: any, gap: number, margin: number) {
  if (top.final < 60) return { mode:'open', title:'開放型星圖', subtitle:'三股文明力量正在共同塑形' };
  if (top.family !== '獨立' && top.family === second.family && gap < 6) {
    return { mode:'family', title:`${top.family}主導`, subtitle:gap >= 3 ? `${top.name}亞型正在浮現` : '亞型仍在交會' };
  }
  const canResolve = gap >= 6 || (gap >= 3 ? Math.abs(margin) >= .2 : Math.abs(margin) >= .3);
  if (!canResolve && top.family !== second.family) return { mode:'dual', title:`${top.name} × ${second.name}`, subtitle:'雙重文明共振' };
  return { mode:'single', title:top.name, subtitle:top.final >= 70 ? '你的主文明已清晰顯現' : '你的最強暫定共振' };
}

export function scoreAssessment(answers: Answers) {
  const dimensions = Array.from({ length: 12 }, (_, i) => {
    const values = data.questions.core.filter((q: any) => q.dimension === i + 1).map((q: any) => answers[q.id]).filter((v: any) => typeof v === 'number').map((v: number) => (v - 4) / 3);
    return values.length >= 2 ? mean(values) : null;
  });
  const proto = prototypeFit(dimensions);
  const sig = signatureFit(answers);
  const ranking = data.lineages.map((l: any) => ({ ...l, prototypeFit:proto[l.code], signatureFit:sig[l.code], final:.6 * proto[l.code] + .4 * sig[l.code] })).sort((a: any, b: any) => b.final - a.final);
  const gap = ranking[0].final - ranking[1].final;
  const margin = pairwiseMargin(ranking[0].code, ranking[1].code, answers);

  const gen = Object.fromEntries(data.questions.generic.map((q: any) => [q.gate, optionValue(data.questions.generic, q.id, answers[q.id])]).filter(([,v]) => typeof v === 'number')) as Record<string, number>;
  const domainP = mean([gen.G1, gen.G2].filter(Number.isFinite));
  const domainS = mean([gen.G3, gen.G4].filter(Number.isFinite));
  const domainR = mean([gen.G5, gen.G6].filter(Number.isFinite));
  const inflation = mean([gen.G7, gen.G8].filter(Number.isFinite));
  const gate = Number.isFinite(domainP) && Number.isFinite(domainS) && Number.isFinite(domainR) ? 100 * Math.cbrt(domainP * domainS * domainR) * (1 - .5 * inflation) : 0;
  const gateLabel = gate >= 75 ? '強烈身份共振' : gate >= 60 ? '中度身份共振' : gate >= 45 ? '曖昧身份共振' : '低身份共振';

  const missionRaw: Record<string, number[]> = Object.fromEntries(Object.keys(data.missions).map((k) => [k, []]));
  data.questions.mission.forEach((q: any) => {
    const answer = answers[q.id];
    if (!Array.isArray(answer)) return;
    const points = [1,.33,-.33,-1];
    answer.forEach((code, i) => missionRaw[code]?.push(points[i]));
  });
  const mission = Object.entries(missionRaw).map(([code, values]) => ({ code, name:data.missions[code], score:50 * (1 + mean(values)) })).sort((a, b) => b.score - a.score);
  const missionLabel = mission[0].score >= 60 && mission[1].score >= 60 && Math.abs(mission[0].score - mission[1].score) < 7.5 ? `${mission[0].name} × ${mission[1].name}` : mission[0].score >= 65 && mission[0].score - mission[1].score >= 10 ? mission[0].name : '多功能使命圖譜';

  const pol = data.questions.polarity.map((q: any) => optionValue(data.questions.polarity, q.id, answers[q.id]) ?? 0);
  const agency = mean(pol.slice(0, 2)), benefit = mean(pol.slice(2)), overall = mean([agency, benefit]);
  const polarityLabel = overall >= .4 ? '關係／服務導向' : overall >= .15 ? '關係導向傾斜' : overall <= -.4 ? '強自我／控制導向' : overall <= -.15 ? '自我／控制導向傾斜' : '混合取向';

  const semantic = data.questions.quality.filter((q: any) => q.type === 'quality-scale').map((q: any) => {
    const v = answers[q.id];
    const d = dimensions[q.compare - 1];
    return typeof v === 'number' && d !== null ? 1 - Math.abs((v - 4) / 3 - d) / 2 : .5;
  });
  const corePositions = data.questions.core.map((q: any) => answers[q.id]).filter((v: any) => typeof v === 'number') as number[];
  const frequencies = Array.from({length:7},(_,i)=>corePositions.filter((v)=>v===i+1).length);
  const pMode = corePositions.length ? Math.max(...frequencies) / corePositions.length : 1;
  let longest = 0, run = 0, previous = -1;
  corePositions.forEach((v) => { run = v === previous ? run + 1 : 1; previous = v; longest = Math.max(longest, run); });
  const cMode = pMode <= .45 ? 1 : pMode >= .8 ? 0 : (.8 - pMode) / .35;
  const cRun = longest <= 7 ? 1 : longest >= 16 ? 0 : (16 - longest) / 9;
  const pattern = Math.sqrt(cMode * cRun);
  const allQuestions = Object.values(data.questions).flat() as any[];
  const coverage = allQuestions.filter((q) => answers[q.id] !== undefined).length / 84;
  const ideal = mean(data.questions.quality.filter((q: any) => q.type === 'quality-choice').map((q: any) => optionValue(data.questions.quality, q.id, answers[q.id]) ?? .5));
  const consistency = mean(semantic), realism = 1 - .4 * ideal;
  const quality = 100 * (.45 * consistency + .25 * pattern + .2 * coverage + .1 * realism);
  const qualityLabel = quality >= 80 ? '高品質作答' : quality >= 65 ? '可用' : quality >= 50 ? '需謹慎解讀' : '本次資料不穩定';

  const sigGroups = Object.values(data.mechanismGroups) as string[];
  const rand = seeded(); let wins = 0;
  for (let r = 0; r < 500; r++) {
    const dims = Array.from({length:12}, () => Math.floor(rand() * 12));
    const chosenGroups = Array.from({length:sigGroups.length}, () => sigGroups[Math.floor(rand() * sigGroups.length)]);
    const slots = data.questions.signature.filter((q: any) => chosenGroups.includes(data.mechanismGroups[q.slot])).map((q: any) => q.slot);
    const bp = prototypeFit(dimensions, dims), bs = signatureFit(answers, slots);
    const winner = data.lineages.map((l: any) => ({code:l.code, v:.6 * bp[l.code] + .4 * bs[l.code]})).sort((a:any,b:any)=>b.v-a.v)[0].code;
    if (winner === ranking[0].code) wins++;
  }
  const stability = wins / 500;
  const looWinners = Array.from({length:12}, (_, omit) => {
    const bp = prototypeFit(dimensions, Array.from({length:12},(_,i)=>i).filter((i)=>i!==omit));
    return data.lineages.map((l:any)=>({code:l.code,v:.6*bp[l.code]+.4*sig[l.code]})).sort((a:any,b:any)=>b.v-a.v)[0].code;
  });
  const loo = looWinners.filter((code) => code === ranking[0].code).length / 12;
  const confidence = 100 * Math.pow(Math.max(.0001, coverage * consistency * stability * clamp(gap / 10) * clamp(.5 + Math.abs(margin))), 1 / 5);
  const confidenceLabel = quality < 50 ? '低' : confidence >= 80 ? '很高' : confidence >= 65 ? '高' : confidence >= 50 ? '中等' : '有限';

  return { dimensions, ranking, gap, margin, gate, gateLabel, inflation, mission, missionLabel, polarity:{agency,benefit,overall,label:polarityLabel}, quality, qualityLabel, consistency, pattern, coverage, stability, loo, confidence, confidenceLabel, declaration:classificationLabel(ranking[0], ranking[1], gap, margin) };
}

export { assessment };
