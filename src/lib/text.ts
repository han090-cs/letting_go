// Pure, DOM-free text logic so it can be unit-tested (see text.test.ts).

/* ---------- script detection ---------- */
export const hasMyanmar=(s:string)=>/[\u1000-\u109F]/.test(s);

export function fontFor(text:string):string{
  if(hasMyanmar(text))return '"Noto Sans Myanmar","Myanmar Text","Myanmar MN",Padauk,sans-serif';
  if(/[\u0600-\u06FF]/.test(text))return '"Noto Sans Arabic",system-ui,sans-serif';
  return 'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif';
}

/* ---------- segmentation ---------- */
type SegCtor=new(l?:string,o?:{granularity:string})=>{segment:(s:string)=>Iterable<{segment:string}>};

// One grapheme-ish cluster: a base char plus combining marks / virama stacks / ZWJ sequences.
const CLUSTER=/\P{M}(?:\u1039\P{M}|\p{M}|\u200d\P{M})*/gu;

/** Break an over-long token into pieces of at most 6 clusters so it never overflows the screen. */
export function splitLong(p:string):string[]{
  if([...p].length<=16)return [p];
  const cs=p.match(CLUSTER)||[p],out:string[]=[];
  for(let i=0;i<cs.length;i+=6)out.push(cs.slice(i,i+6).join(''));
  return out;
}

/** Merge neighbouring pieces so there are never more than `cap`; nothing is ever dropped. */
export function capPieces(pieces:string[],cap:number,glue=''):string[]{
  if(pieces.length<=cap)return pieces;
  const per=Math.ceil(pieces.length/cap),out:string[]=[];
  for(let i=0;i<pieces.length;i+=per)out.push(pieces.slice(i,i+per).join(glue));
  return out;
}

export function chunkLatin(text:string,cap=90):string[]{
  let segs:string[];
  try{
    const S=(Intl as unknown as {Segmenter?:SegCtor}).Segmenter;
    segs=S?[...new S(undefined,{granularity:'word'}).segment(text)].map(x=>x.segment):text.split(/(\s+)/);
  }catch{segs=text.split(/(\s+)/)}
  const out:string[]=[];let buf='';
  const flush=()=>{const s=buf.trim();if(s)out.push(s);buf=''};
  // One word per piece (so each word falls on its own); unspaced scripts (CJK, Thai) fall two characters at a time.
  const UNSPACED=/[\u0e00-\u0e7f\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/;
  for(const s of segs){buf+=s;if(/^\s+$/.test(s)||(UNSPACED.test(buf)&&[...buf.trim()].length>=2))flush()}
  flush();
  return capPieces(out.flatMap(splitLong),cap,' ');
}

// Burmese syllable break (standard "sylbreak" rule, no regex lookbehind for old Safari):
// a syllable starts at a consonant that is not followed by asat/virama and not preceded by virama.
const MY_OTHER='ဣဤဥဦဧဩဪဿ၌၍၎၏';
export function mySyllables(tok:string):string[]{
  const cs=[...tok],out:string[]=[];let cur='';
  for(let i=0;i<cs.length;i++){
    const c=cs[i],prev=cs[i-1],next=cs[i+1];
    const start=(c>='က'&&c<='အ'&&next!=='်'&&next!=='္'&&prev!=='္')||MY_OTHER.includes(c);
    if(start&&cur){out.push(cur);cur=''}
    cur+=c;
  }
  if(cur)out.push(cur);
  return out;
}

export function chunkText(text:string,cap=140):string[]{
  if(!hasMyanmar(text))return chunkLatin(text);
  const out:string[]=[];
  for(const tok of text.split(/\s+/).filter(Boolean))out.push(...(hasMyanmar(tok)?mySyllables(tok):[tok]));
  return capPieces(out,cap);
}

/* ---------- wish lantern: break a wish into lines that fit on the lantern ---------- */
/** Pieces a line may break between: words, or Burmese syllables. `sp` = a space follows the piece. */
export function wishUnits(text:string):{s:string;sp:boolean}[]{
  const out:{s:string;sp:boolean}[]=[];
  for(const tok of text.trim().split(/\s+/).filter(Boolean)){
    const parts=hasMyanmar(tok)?mySyllables(tok):[tok];
    parts.forEach((s,i)=>out.push({s,sp:i===parts.length-1}));
  }
  return out;
}
/** Greedy line wrap with a caller-supplied width measure. Never drops text. */
export function wrapWish(text:string,maxW:number,measure:(s:string)=>number):string[]{
  const lines:string[]=[];let cur='';
  for(const u of wishUnits(text)){
    const next=cur+u.s;
    if(cur&&measure(next)>maxW){lines.push(cur.trim());cur=''}
    cur+=u.s+(u.sp?' ':'');
  }
  if(cur.trim())lines.push(cur.trim());
  return lines;
}

/* ---------- safety: everything runs locally, nothing is sent anywhere ---------- */
const CRISIS_LATIN=/suicid|kill myself|end my life|want to die|wanna die|don'?t want to (?:live|be here)|self[- ]?harm|hurt myself|quitarme la vida|matarme|quiero morir|me tuer|en finir avec la vie|envie de mourir|死にたい|自殺|消えたい|想死|自杀|不想活|죽고 싶|자살|انتحر|أريد أن أموت|أنهي حياتي/i;
// Burmese is matched with all whitespace and zero-width characters removed, because people
// often type spaces inside phrases.
const CRISIS_MY=/သေချင်|သေပစ်ချင်|သေသွားချင်|မရှင်ချင်တော့|မနေချင်တော့|အသက်မရှင်ချင်|ဘဝကိုအဆုံးသတ်|ဘဝအဆုံးသတ်|ကိုယ့်ကိုယ်ကိုသတ်|ကိုယ့်ကိုယ်ကိုထိခိုက်|ကိုယ်ကိုယ်ကိုသတ်|သတ်သေ/;
export function isCrisis(text:string):boolean{
  if(CRISIS_LATIN.test(text))return true;
  return CRISIS_MY.test(text.replace(/[\s\u200b-\u200d\u2060\ufeff]/g,''));
}

// Zawgyi (legacy encoding) heuristics: Zawgyi-only code points, or the vowel sign ေ typed *before*
// its consonant at the start of a word (Unicode stores it after).
const ZAWGYI=/[\u1060-\u1097]|(?:^|\s)\u1031[\u1000-\u1021]/;
export const looksZawgyi=(text:string)=>ZAWGYI.test(text);
