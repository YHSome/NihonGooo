const source = document.querySelector('#source');
const translateButton = document.querySelector('#translateButton');
const exampleButton = document.querySelector('#exampleButton');
const result = document.querySelector('#result');
const emptyState = document.querySelector('#emptyState');
const answer = document.querySelector('#answer');
const wordList = document.querySelector('#wordList');
const japaneseSentence = document.querySelector('#japaneseSentence');
const sentenceReading = document.querySelector('#sentenceReading');
const sentenceKana = document.querySelector('#sentenceKana');
const sentenceMeaning = document.querySelector('#sentenceMeaning');
const copyButton = document.querySelector('#copyButton');
let tokenizer;
let currentNote = '';

const particleNames = {
  'は':'提示主题','が':'提示主语','を':'宾语标记','に':'时间／目的地／对象','へ':'方向','で':'动作场所／手段','と':'共同对象／引用','の':'所属／修饰','も':'也／同样','から':'起点／因为','まで':'终点／直到','より':'比较基准','や':'不完全列举','か':'疑问','ね':'确认语气','よ':'告知语气','て':'连接／请求','しか':'限定','だけ':'限定','でも':'举例／让步','ので':'原因','のに':'转折','ばかり':'限定','くらい':'程度','ぐらい':'程度'
};
const auxiliaryNames = {
  'ます':'礼貌体（现在／将来肯定）', 'です':'礼貌判断', 'だ':'普通体判断', 'ない':'否定', 'た':'过去／完成', 'ている':'正在／持续', 'れる':'被动／可能／尊敬', 'られる':'被动／可能／尊敬', 'たい':'想要…', 'う':'意志／推测', 'よう':'意志／推测', 'でしょう':'推测／确认', 'でしょうか':'礼貌询问', 'ません':'礼貌否定', 'ました':'礼貌过去', 'ませんでした':'礼貌过去否定'
};
const learnerGlossary = {
  '日本語':'日语', '勉強':'学习', 'する':'做／进行', 'いる':'在／持续', '行く':'去', '来る':'来', '友達':'朋友', '明日':'明天', '今日':'今天', '昨日':'昨天', '東京':'东京', '私':'我', 'あなた':'你', '人':'人', '本':'书', '水':'水', '食べる':'吃', '飲む':'喝', '見る':'看', '聞く':'听／问', '話す':'说', '読む':'读', '書く':'写', '好き':'喜欢', '大好き':'非常喜欢', '大きい':'大', '小さい':'小'
};

function loadTokenizer() {
  return new Promise((resolve, reject) => {
    if (tokenizer) return resolve(tokenizer);
    if (!window.kuromoji) return reject(new Error('日语分词组件未能加载。请检查网络后重试。'));
    kuromoji.builder({ dicPath: 'https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/dict/' }).build((err, built) => {
      if (err) reject(new Error('日语词典加载失败。请检查网络后重试。'));
      else { tokenizer = built; resolve(built); }
    });
  });
}

function containsJapanese(text) { return /[\u3040-\u30ff\u3400-\u9fff]/.test(text); }

async function translateText(text, from, to) {
  if (new TextEncoder().encode(text).length > 500) {
    throw new Error('公开翻译服务每次最多支持 500 字节，请将内容拆成更短的句子。');
  }
  const url = new URL('https://api.mymemory.translated.net/get');
  url.search = new URLSearchParams({ q:text, langpair:`${from}|${to}`, mt:'1' });
  const response = await fetch(url);
  if (!response.ok) throw new Error('翻译服务暂时不可用，请稍后重试。');
  const data = await response.json();
  if (data.responseStatus !== 200 || !data.responseData?.translatedText) {
    throw new Error('翻译服务未返回有效结果，请稍后重试。');
  }
  const decoded = document.createElement('textarea');
  decoded.innerHTML = data.responseData.translatedText;
  return decoded.value;
}

function kataToHira(value = '') { return value.replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60)); }
function kanaToRomaji(value = '') {
  const map = { 'きゃ':'kya','きゅ':'kyu','きょ':'kyo','しゃ':'sha','しゅ':'shu','しょ':'sho','ちゃ':'cha','ちゅ':'chu','ちょ':'cho','にゃ':'nya','にゅ':'nyu','にょ':'nyo','ひゃ':'hya','ひゅ':'hyu','ひょ':'hyo','みゃ':'mya','みゅ':'myu','みょ':'myo','りゃ':'rya','りゅ':'ryu','りょ':'ryo','ぎゃ':'gya','ぎゅ':'gyu','ぎょ':'gyo','じゃ':'ja','じゅ':'ju','じょ':'jo','びゃ':'bya','びゅ':'byu','びょ':'byo','ぴゃ':'pya','ぴゅ':'pyu','ぴょ':'pyo','ふぁ':'fa','ふぃ':'fi','ふぇ':'fe','ふぉ':'fo','てぃ':'ti','でぃ':'di','うぃ':'wi','うぇ':'we','うぉ':'wo','しぇ':'she','じぇ':'je','ちぇ':'che','つぁ':'tsa','つぃ':'tsi','つぇ':'tse','つぉ':'tso','あ':'a','い':'i','う':'u','え':'e','お':'o','か':'ka','き':'ki','く':'ku','け':'ke','こ':'ko','さ':'sa','し':'shi','す':'su','せ':'se','そ':'so','た':'ta','ち':'chi','つ':'tsu','て':'te','と':'to','な':'na','に':'ni','ぬ':'nu','ね':'ne','の':'no','は':'ha','ひ':'hi','ふ':'fu','へ':'he','ほ':'ho','ま':'ma','み':'mi','む':'mu','め':'me','も':'mo','や':'ya','ゆ':'yu','よ':'yo','ら':'ra','り':'ri','る':'ru','れ':'re','ろ':'ro','わ':'wa','を':'o','ん':'n','が':'ga','ぎ':'gi','ぐ':'gu','げ':'ge','ご':'go','ざ':'za','じ':'ji','ず':'zu','ぜ':'ze','ぞ':'zo','だ':'da','ぢ':'ji','づ':'zu','で':'de','ど':'do','ば':'ba','び':'bi','ぶ':'bu','べ':'be','ぼ':'bo','ぱ':'pa','ぴ':'pi','ぷ':'pu','ぺ':'pe','ぽ':'po','ゔ':'vu','ぁ':'a','ぃ':'i','ぅ':'u','ぇ':'e','ぉ':'o','ー':'-' };
  const kana = kataToHira(value); let output = '';
  for (let i=0; i<kana.length; i++) {
    const pair = kana.slice(i,i+2);
    if (map[pair]) { output += map[pair]; i++; continue; }
    if (kana[i] === 'っ') { const next = map[kana.slice(i+1,i+3)] || map[kana[i+1]] || ''; output += next ? next[0] : ''; continue; }
    output += map[kana[i]] ?? kana[i];
  }
  return output.replace(/n(?=[bmp])/g, 'm');
}
function tokenRomaji(token) {
  // は／へ are historically written this way when they act as particles,
  // but their modern pronunciation is wa／e.
  if (token.pos === '助詞' && token.surface_form === 'は') return 'wa';
  if (token.pos === '助詞' && token.surface_form === 'へ') return 'e';
  const kana = token.reading && token.reading !== '*' ? kataToHira(token.reading) : token.surface_form;
  return kanaToRomaji(kana);
}

function posDescription(token) {
  const pos = token.pos || '';
  if (pos === '助詞') return '助词';
  if (pos === '助動詞') return `助动词：${token.basic_form}`;
  if (pos === '記号') return '标点符号';
  if (pos === '動詞') return `动词（原形：${token.basic_form}）`;
  if (pos === '形容詞') return `形容词（原形：${token.basic_form}）`;
  if (pos === '名詞') return token.pos_detail_1 === '固有名詞' ? '专有名词' : '名词';
  if (pos === '副詞') return '副词';
  if (pos === '連体詞') return '连体词';
  if (pos === '接続詞') return '连接词';
  return pos || '词语';
}

async function translateTokens(tokens) {
  const translatable = tokens.filter(t => t.pos !== '記号' && t.pos !== '助詞' && t.pos !== '助動詞' && /[ぁ-んァ-ン一-龯]/.test(t.surface_form));
  const unique = [...new Set(translatable.map(t => t.basic_form && t.basic_form !== '*' ? t.basic_form : t.surface_form))];
  const meanings = new Map();
  unique.forEach(term => { if (learnerGlossary[term]) meanings.set(term, learnerGlossary[term]); });
  await Promise.all(unique.filter(term => !meanings.has(term)).map(async term => {
    try { meanings.set(term, await translateText(term, 'ja', 'zh-CN')); }
    catch { meanings.set(term, '—'); }
  }));
  return meanings;
}

function render(tokens, meanings, japanese, chinese) {
  const reading = tokens.map(t => t.reading && t.reading !== '*' ? kataToHira(t.reading) : t.surface_form).join('');
  japaneseSentence.textContent = japanese;
  sentenceKana.textContent = `假名 · ${reading}`;
  sentenceReading.textContent = `ROMAJI · ${tokens.map(tokenRomaji).join(' ')}`;
  sentenceMeaning.textContent = chinese;
  wordList.replaceChildren();
  const noteLines = [`日语：${japanese}`, `假名：${reading}`, `罗马音：${kanaToRomaji(reading)}`, `中文：${chinese}`, '', '逐词对照：'];
  tokens.forEach(token => {
    const base = token.basic_form && token.basic_form !== '*' ? token.basic_form : token.surface_form;
    const kana = token.reading && token.reading !== '*' ? kataToHira(token.reading) : token.surface_form;
    const meaning = token.pos === '記号' ? '—' : (token.pos === '助詞' ? (particleNames[token.surface_form] || '语法连接') : token.pos === '助動詞' ? (auxiliaryNames[base] || `语法：${base}`) : (meanings.get(base) || '—'));
    const explanation = posDescription(token);
    const row = document.createElement('article');
    row.className = `word ${token.pos === '助詞' || token.pos === '助動詞' ? 'is-particle' : ''}`;
    const romaji = tokenRomaji(token);
    row.innerHTML = `<div class="word-jp">${escapeHtml(token.surface_form)}</div><div class="word-kana"><span class="romaji-above">${escapeHtml(romaji)}</span>${escapeHtml(kana)}</div><div class="word-meaning">${token.pos === '助詞' || token.pos === '助動詞' ? '<span class="tag">' + (token.pos === '助詞' ? '助' : '助动') + '</span>' : ''}${escapeHtml(meaning)}<span class="pos-note">${escapeHtml(explanation)}</span></div>`;
    wordList.append(row);
    noteLines.push(`${token.surface_form}｜${kana}｜${romaji}｜${meaning}（${explanation}）`);
  });
  currentNote = noteLines.join('\n');
  result.classList.remove('is-empty'); emptyState.hidden = true; answer.hidden = false; copyButton.disabled = false;
}
function escapeHtml(value) { const d = document.createElement('div'); d.textContent = value; return d.innerHTML; }

async function runTranslation() {
  const input = source.value.trim();
  if (!input) { source.focus(); return; }
  translateButton.disabled = true; translateButton.querySelector('span').textContent = '正在生成…';
  try {
    await loadTokenizer();
    const isJapanese = containsJapanese(input) && !/[\u4e00-\u9fff]/.test(input.replace(/[\u3040-\u30ff]/g, '')) ? true : /[ぁ-んァ-ン]/.test(input);
    const japanese = isJapanese ? input : await translateText(input, 'zh-CN', 'ja');
    const chinese = isJapanese ? await translateText(input, 'ja', 'zh-CN') : input;
    const tokens = tokenizer.tokenize(japanese);
    const meanings = await translateTokens(tokens);
    render(tokens, meanings, japanese, chinese);
  } catch (error) {
    alert(error.message || '暂时无法生成对照，请检查网络后再试。');
  } finally {
    translateButton.disabled = false; translateButton.querySelector('span').textContent = '生成逐词对照';
  }
}
translateButton.addEventListener('click', runTranslation);
source.addEventListener('keydown', event => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') runTranslation(); });
exampleButton.addEventListener('click', () => { source.value = '我明天要和朋友去东京。'; source.focus(); });
copyButton.addEventListener('click', async () => { try { await navigator.clipboard.writeText(currentNote); copyButton.textContent = '已复制 ✓'; setTimeout(() => copyButton.textContent = '复制笔记', 1600); } catch { alert('复制失败，请手动选择内容复制。'); } });
