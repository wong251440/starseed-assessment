import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd(), '..');
const outline = fs.readFileSync(path.join(root, '設計大綱.txt'), 'utf8').replaceAll('\r\n', '\n');
const outDir = path.join(process.cwd(), 'app', 'data');
fs.mkdirSync(outDir, { recursive: true });

const clean = (value = '') => value
  .replace(/^>\s?/gm, '')
  .replace(/\*\*/g, '')
  .replace(/`/g, '')
  .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
  .replace(/\s+/g, ' ')
  .trim();
const num = (value) => Number(String(value).replace('−', '-').replace('+', ''));
const between = (start, end) => outline.slice(outline.indexOf(start), outline.indexOf(end, outline.indexOf(start)));

const lineages = [
  ['PL','昴宿星文明','Pleiadian','獨立','A'], ['AR','大角星文明','Arcturian','獨立','A'],
  ['SI','天狼星文明','Sirian','獨立','A'], ['AD','仙女座文明','Andromedan','獨立','A'],
  ['LY','天琴座文明','Lyran','天琴家族','A'], ['OR','獵戶座文明','Orion','獵戶系統','A'],
  ['MI','明塔卡文明','Mintakan','獵戶系統','A−'], ['VE','金星文明','Venusian','獨立','B+'],
  ['HA','哈達爾文明','Hadarian','半人馬座群','B+'], ['PO','北極星文明','Polarian','獨立','B+'],
  ['AC','南門二文明','Alpha Centaurian','半人馬座群','B'], ['VG','織女星文明','Vegan','天琴家族','B'],
  ['FE','烏爾瑪文明','Feline / Urmah','天琴家族','B+'], ['AV','藍鳥文明','Avian / Blue Avian','獨立','B'],
  ['MA','火星文明','Martian','獨立','C+'], ['ML','瑪爾戴克文明','Maldekian','獨立','C+'],
  ['DR','天龍族文明','Draconian','天龍家族','B'], ['RE','爬蟲族文明','Reptilian','天龍家族','C+'],
  ['ZE','澤塔／灰人文明','Zeta / Grey','獨立','B'], ['AN','阿努納奇／尼比魯文明','Anunnaki / Nibiruan','阿努納奇家族','C'],
  ['TC','天倉五文明','Tau Cetian','獨立','C+'], ['AT','心宿二文明','Antarian','獨立','C+'],
].map((x, i) => ({ code:x[0], name:x[1], english:x[2], family:x[3], lore:x[4], icon:`civilizations/${i === 5 ? '6.1' : i + 1}.png`, index:i + 1 }));

const protoBlock = between('# B. 22 × 12 Prototype Matrix v1.0', '# C. Lore confidence');
for (const lineage of lineages) {
  const row = protoBlock.split('\n').find((line) => line.includes(`**${lineage.english}**`));
  if (!row) throw new Error(`Missing prototype ${lineage.english}`);
  const cells = row.split('|').slice(2, -1).map((v) => v.trim());
  lineage.prototype = cells.slice(0, 12).map(num);
}

const signatureMatrix = Object.fromEntries(lineages.map((x) => [x.code, {}]));
for (const [a, b] of [['## Matrix A','## Matrix B'],['## Matrix B','## Matrix C'],['## Matrix C','# 13.']]) {
  const block = between(a, b);
  const lines = block.split('\n').filter((line) => /^\| (H|A|W|P|F|S|L|X)\d/.test(line));
  const header = block.split('\n').find((line) => line.startsWith('| Slot |'));
  const codes = header.split('|').slice(2, -1).map((v) => v.trim());
  for (const line of lines) {
    const cells = line.split('|').slice(1, -1).map((v) => v.trim());
    const id = cells[0];
    codes.forEach((code, i) => { signatureMatrix[code][id] = num(cells[i + 1]); });
  }
}

function blocks(source, pattern) {
  const matches = [...source.matchAll(pattern)];
  return matches.map((m, i) => ({ id:m[1], title:clean(m[2]), body:source.slice(m.index, matches[i + 1]?.index ?? source.length) }));
}

const signatureSource = between('# H1｜Care Channel', '# 題目品質權重 q');
const signature = blocks(signatureSource, /^# ((?:H|A|W|P|F|S|L|X)\d)｜([^\n]+)/gm).map(({id, body}) => {
  const q = clean(body.match(/### 正式題目\n\n([\s\S]*?)\n\n\| 選項/)?.[1]);
  const options = [...body.matchAll(/^\| ([ABCD])\s+\|\s*(.*?)\s*\|\s*([+−-]?[0-9.]+)\s*\|/gm)]
    .map((m) => ({ id:m[1], text:clean(m[2]), value:num(m[3]) }));
  return { id:`SIG_${id}`, slot:id, type:'signature', question:q, options, allowNA:['H3','F2','L1'].includes(id) };
});

const coreSource = between('## C01｜Interpersonal Signal Detection', '# 4. 36×12 Design Loading Blueprint');
const core = blocks(coreSource, /^## (C\d{2})｜([^\n]+)/gm).map(({id, body}, i) => {
  const q = clean(body.match(/### 題目\n\n([\s\S]*?)\n\n\*\*−端\*\*/)?.[1]);
  const negative = clean(body.match(/\*\*−端\*\*\n\n([\s\S]*?)\n\n\*\*\+端\*\*/)?.[1]);
  const positive = clean(body.match(/\*\*\+端\*\*\n\n([\s\S]*?)\n\n###/)?.[1]);
  return { id, type:'core', dimension:Math.floor(i / 3) + 1, question:q, negative, positive };
});

const genericSource = between('# G1｜Pre-label Chronology', '# 5. 三個真正的 Resonance domain');
const generic = blocks(genericSource, /^# (G\d)｜([^\n]+)/gm).map(({id, body}) => {
  const q = clean(body.match(/### 正式題目\n\n([\s\S]*?)\n\n\*\*A\*\*/)?.[1]);
  const options = ['A','B','C','D'].map((letter) => {
    const next = letter === 'D' ? '(?:###|---|$)' : `\\*\\*${String.fromCharCode(letter.charCodeAt(0) + 1)}\\*\\*`;
    const m = body.match(new RegExp(`\\*\\*${letter}\\*\\*\\n\\n([\\s\\S]*?)\\n\\n${next}`));
    return { id:letter, text:clean(m?.[1].split(/\n\n`[RI] =/)[0]), value:[1,.67,.33,0]['ABCD'.indexOf(letter)] };
  });
  if (Number(id.slice(1)) >= 7) options.forEach((o, i) => { o.value = [0,.33,.67,1][i]; });
  return { id:`GEN_${id}`, gate:id, type:'generic', question:q, options, allowNA:['G1','G2'].includes(id) };
});

const missionSource = between('# M1｜當一個重要計畫反覆卡住', '# 4. Mission scoring');
const mission = blocks(missionSource, /^# (M\d)｜([^\n]+)/gm).map(({id, title, body}) => {
  const intro = clean(body.slice(body.indexOf('\n') + 1, body.search(/### A/)));
  const options = [...body.matchAll(/### ([ABCD]) — ([^\n]+)\n\n([\s\S]*?)\n\n\*\*(?:Key：)?([A-Z]{2})\*\*/g)]
    .map((m) => ({ id:m[1], label:clean(m[2]), text:clean(m[3]), mission:m[4] }));
  return { id:`MISSION_${id}`, type:'mission', question:title, intro, options };
});

const polaritySource = between('# P1｜Guidance vs Agency', '# 8. Polarity scoring');
const polarity = blocks(polaritySource, /^# (P\d)｜([^\n]+)/gm).map(({id, body}) => {
  const q = clean(body.slice(body.indexOf('\n') + 1, body.search(/### A/)));
  const options = [...body.matchAll(/### ([ABCD])\n\n([\s\S]*?)\n\n\$\$\n([+−-]?[0-9.]+)\n\$\$/g)]
    .map((m) => ({ id:m[1], text:clean(m[2]), value:num(m[3]) }));
  return { id:`POL_${id}`, type:'polarity', question:q, options };
});

const qualitySource = between('# Q1｜System-thinking consistency probe', '# 15. General Self-Idealization Risk');
const quality = blocks(qualitySource, /^# (Q\d)｜([^\n]+)/gm).map(({id, body}) => {
  const n = Number(id.slice(1));
  if (n <= 4) {
    const q = clean(body.match(/### 題目\n\n([\s\S]*?)\n\n\*\*左端\*\*/)?.[1]);
    const negative = clean(body.match(/\*\*左端\*\*\n\n([\s\S]*?)\n\n\*\*右端\*\*/)?.[1]);
    const positive = clean(body.match(/\*\*右端\*\*\n\n([\s\S]*?)\n\n7-point/)?.[1]);
    return { id:`QUAL_${id}`, type:'quality-scale', question:q, negative, positive, compare:[2,3,6,12][n - 1] };
  }
  const q = clean(body.match(/### 題目\n\n([\s\S]*?)\n\n### A/)?.[1]);
  const options = [...body.matchAll(/### ([ABCD])\n\n([\s\S]*?)\n\n(?:Idealization risk:\n\n)?\$\$\n([0-9.]+)\n\$\$/g)]
    .map((m) => ({ id:m[1], text:clean(m[2]), value:num(m[3]) }));
  return { id:`QUAL_${id}`, type:'quality-choice', question:q, options };
});

const dimensions = ['關係共振','系統認知','自主主權','秩序守護','行動驅力','複雜容納','異鄉感','創造美感','生態水域','古老傳承','直覺感知','傳譯溝通'];
const missions = { MH:'療癒／修復', MT:'傳譯／教導', MB:'建構／架構', MG:'守護／承擔', ML:'解放／改革', MC:'催化／轉化' };
const mechanismGroups = { H1:'heart',H4:'heart',H2:'boundary',H3:'home',A1:'system',A2:'implement',A3:'observe',A4:'epistemic',W1:'role',W3:'role',W2:'action',W4:'action',W5:'code',P1:'power',P2:'scale',P3:'powerMission',F1:'freedom',F2:'freedom',S1:'stability',S2:'stability',L1:'loss',L2:'loss',X1:'continuity',X2:'creative' };
const qWeights = { H1:1,H2:.95,H3:.85,H4:.9,A1:1,A2:1,A3:1,A4:1,W1:1,W2:1,W3:.95,W4:1,W5:1,P1:1,P2:1,P3:1,F1:1,F2:.9,S1:1,S2:1,L1:.85,L2:1,X1:1,X2:1 };

const docs = lineages.map((lineage) => {
  const file = fs.readFileSync(path.join(root, '22文明文案', `${lineage.index}.md`), 'utf8').replaceAll('\r\n','\n');
  const headings = [...file.matchAll(/^(#{1,3})\s+(.+)$/gm)];
  const sections = headings.map((h, i) => {
    const raw = file.slice(h.index + h[0].length, headings[i + 1]?.index ?? file.length);
    const paras = raw.split(/\n\s*\n/).map(clean).filter((p) => p && !p.startsWith('[') && !p.startsWith('---') && !p.startsWith('|'));
    return { title:clean(h[2]), paragraphs:paras.slice(0, 4) };
  }).filter((s) => s.paragraphs.length);
  return { ...lineage, title:clean(headings[0]?.[2] ?? lineage.name), subtitle:clean(headings[1]?.[2] ?? ''), sections };
});

const payload = { lineages:docs, signatureMatrix, questions:{ core, signature, generic, mission, polarity, quality }, dimensions, missions, mechanismGroups, qWeights };
fs.writeFileSync(path.join(outDir, 'assessment.json'), JSON.stringify(payload));
console.log(JSON.stringify({ core:core.length, signature:signature.length, generic:generic.length, mission:mission.length, polarity:polarity.length, quality:quality.length, civilizations:docs.length }));
