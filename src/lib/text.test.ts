import {describe,expect,it} from 'vitest';
import {capPieces,chunkText,fontFor,isCrisis,looksZawgyi,mySyllables,splitLong,wrapWish} from './text';

const squash=(s:string)=>s.replace(/\s+/g,'');

describe('Burmese syllables',()=>{
  it('splits a simple sentence',()=>{
    expect(mySyllables('ငါစိတ်ညစ်တယ်')).toEqual(['ငါ','စိတ်','ညစ်','တယ်']);
  });
  it('keeps kinzi / stacked consonants together',()=>{
    expect(mySyllables('အင်္ဂလိပ်')).toEqual(['အင်္ဂ','လိပ်']);
  });
  it('never loses a character',()=>{
    const s='ကျွန်ုပ်၏ဘဝသည် လှပပါသည်။';
    expect(mySyllables(s).join('')).toBe(s);
  });
});

describe('chunking',()=>{
  it('never drops text, even when very long',()=>{
    const long=Array.from({length:600},(_,i)=>`word${i}`).join(' ');
    const out=chunkText(long);
    expect(out.length).toBeLessThanOrEqual(90);
    expect(squash(out.join(''))).toBe(squash(long));
  });
  it('caps Burmese pieces without dropping any',()=>{
    const my='စိတ်ညစ်တယ် '.repeat(120);
    const out=chunkText(my);
    expect(out.length).toBeLessThanOrEqual(140);
    expect(squash(out.join(''))).toBe(squash(my));
  });
  it('capPieces is a no-op under the cap',()=>{
    expect(capPieces(['a','b'],5)).toEqual(['a','b']);
  });
  it('splitLong keeps emoji and combining marks intact',()=>{
    const s='👨‍👩‍👧‍👦'.repeat(8);
    expect(splitLong(s).join('')).toBe(s);
  });
});

describe('safety check',()=>{
  it('detects English, Spanish, Japanese and Burmese phrases',()=>{
    for(const s of ['I want to die','quiero morir','死にたい','သေချင်တယ်','သေ ချင် တယ်','ကိုယ့်ကိုယ်ကို သတ်ချင်တယ်'])
      expect(isCrisis(s),s).toBe(true);
  });
  it('does not fire on ordinary text',()=>{
    for(const s of ['I had a long day','အလုပ်တွေ များလို့ ပင်ပန်းတယ်','This deadline is killing me softly'])
      expect(isCrisis(s),s).toBe(false);
  });
});

describe('Zawgyi heuristic',()=>{
  it('flags a leading vowel sign typed before its consonant',()=>{
    expect(looksZawgyi('ေအာင္')).toBe(true);
  });
  it('accepts normal Unicode Burmese',()=>{
    expect(looksZawgyi('စိတ်ညစ်တယ်။ ကျွန်တော် အိမ်ပြန်မယ်')).toBe(false);
  });
});

describe('fonts',()=>{
  it('chooses a Myanmar font stack for Burmese',()=>{
    expect(fontFor('မင်္ဂလာပါ')).toContain('Noto Sans Myanmar');
    expect(fontFor('hello')).not.toContain('Myanmar');
  });
});

describe('word-by-word falling',()=>{
  it('gives every English word its own piece',()=>{
    expect(chunkText('I feel so tired today, really')).toEqual(['I','feel','so','tired','today,','really']);
  });
  it('splits unspaced text into short pieces without losing any',()=>{
    const t='今日はとても疲れました';
    const out=chunkText(t);
    expect(out.length).toBeGreaterThan(1);
    expect(out.join('')).toBe(t);
  });
});

describe('wish lantern wrapping',()=>{
  const m=(s:string)=>[...s].length;
  it('wraps words and never drops text',()=>{
    const t='may everyone I love sleep well tonight';
    const lines=wrapWish(t,12,m);
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.join(' ')).toBe(t);
  });
  it('wraps Burmese by syllable without losing characters',()=>{
    const t='ကျန်းမာပါစေ ပျော်ရွှင်ပါစေ';
    const lines=wrapWish(t,6,m);
    expect(lines.length).toBeGreaterThan(1);
    expect(squash(lines.join(''))).toBe(squash(t));
  });
  it('returns nothing for blank input',()=>{expect(wrapWish('   ',10,m)).toEqual([])});
});
