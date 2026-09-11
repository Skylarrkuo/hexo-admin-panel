import {describe,it,expect} from 'vitest';
import {siteInput,siteInputToIso} from './site-time';
import {diffLines,mergeThreeWay} from './text-diff';

describe('site time and version diffs',()=>{
  it('uses site civil time independent of browser timezone',()=>{
    expect(siteInput('2026-01-01T18:00:00Z','Asia/Shanghai')).toBe('2026-01-02T02:00');
    expect(siteInput('2026-01-01 18:00:00','Asia/Shanghai')).toBe('2026-01-01T18:00');
    expect(siteInputToIso('2026-01-02T02:00','Asia/Shanghai')).toBe('2026-01-01T18:00:00.000Z');
  });
  it('rejects ambiguous and nonexistent DST times',()=>{
    expect(()=>siteInputToIso('2026-03-08T02:30','America/New_York')).toThrow(/不存在/);
    expect(()=>siteInputToIso('2026-11-01T01:30','America/New_York')).toThrow(/重复/);
    expect(siteInputToIso('2026-11-01T03:30','America/New_York')).toBe('2026-11-01T08:30:00.000Z');
  });
  it('shows additions and removals and merges independent edits',()=>{
    expect(diffLines('a\nb','a\nc')).toEqual([{type:'same',text:'a'},{type:'remove',text:'b'},{type:'add',text:'c'}]);
    expect(mergeThreeWay('a\nb\nc','A\nb\nc','a\nb\nC')).toEqual({text:'A\nb\nC',conflicts:false});
    const conflict=mergeThreeWay('a','local','server');expect(conflict.conflicts).toBe(true);expect(conflict.text).toContain('local');expect(conflict.text).toContain('server');
  });
});
