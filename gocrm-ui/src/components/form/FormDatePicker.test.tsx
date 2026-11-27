import { describe, expect, it } from 'vitest';
import { parsePersianCalendarInput } from './FormDatePicker';

describe('parsePersianCalendarInput', () => {
  it('parses Persian digits into a local Gregorian date', () => {
    const date = parsePersianCalendarInput('۱۴۰۵/۰۹/۰۶');
    expect(date).not.toBeNull();
    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(10);
    expect(date?.getDate()).toBe(27);
  });

  it('accepts Arabic and Latin digits and common separators', () => {
    expect(parsePersianCalendarInput('١٤٠٥-٠٩-٠٦')?.getTime()).toBe(
      parsePersianCalendarInput('1405/9/6')?.getTime()
    );
  });

  it('rejects invalid and out-of-range dates', () => {
    expect(parsePersianCalendarInput('۱۴۰۵/۱۳/۰۱')).toBeNull();
    expect(parsePersianCalendarInput('۱۴۰۵/۱۲/۳۰')).toBeNull();
    expect(parsePersianCalendarInput('not-a-date')).toBeNull();
  });
});
