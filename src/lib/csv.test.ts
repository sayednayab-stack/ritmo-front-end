import { describe, expect, it } from 'vitest';
import { csvCell, toCsv } from './csv';

describe('csvCell', () => {
  it('quotes and escapes embedded quotes', () => expect(csvCell('a "b" c')).toBe('"a ""b"" c"'));
  it('renders null/undefined as empty', () => {
    expect(csvCell(null)).toBe('""');
    expect(csvCell(undefined)).toBe('""');
  });
  it.each(['=1+1', '+SUM(A1)', '-2+3', '@cmd', '\tx', '\rx'])('neutralizes formula starter %j', (v) => {
    expect(csvCell(v)).toBe(`"'${v}"`);
  });
  it('leaves normal values and numbers alone', () => {
    expect(csvCell('Priya Sharma')).toBe('"Priya Sharma"');
    expect(csvCell(42)).toBe('"42"');
  });
});

describe('toCsv', () => {
  it('joins header and rows', () => {
    expect(toCsv(['a', 'b'], [[1, '=x']])).toBe('"a","b"\n"1","\'=x"');
  });
});
