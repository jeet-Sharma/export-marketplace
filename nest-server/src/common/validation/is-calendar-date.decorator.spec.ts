import { validate } from 'class-validator';
import {
  IsCalendarDate,
  isCalendarDate,
} from './is-calendar-date.decorator.js';

class TestDto {
  @IsCalendarDate()
  date!: string;
}

describe('isCalendarDate', () => {
  it('accepts valid dates', () => {
    expect(isCalendarDate('2027-12-31')).toBe(true);
    expect(isCalendarDate('2024-02-29')).toBe(true); // Leap year
    expect(isCalendarDate('2026-01-01')).toBe(true);
  });

  it('rejects invalid calendar dates', () => {
    expect(isCalendarDate('2027-02-30')).toBe(false);
    expect(isCalendarDate('2023-02-29')).toBe(false); // Non-leap year
    expect(isCalendarDate('2027-04-31')).toBe(false); // April only has 30 days
    expect(isCalendarDate('2027-06-31')).toBe(false);
    expect(isCalendarDate('2027-09-31')).toBe(false);
    expect(isCalendarDate('2027-11-31')).toBe(false);
  });

  it('rejects invalid date formats', () => {
    expect(isCalendarDate('2027-13-01')).toBe(false);
    expect(isCalendarDate('2027-00-10')).toBe(false);
    expect(isCalendarDate('2027/12/31')).toBe(false);
    expect(isCalendarDate('2027-1-1')).toBe(false);
    expect(isCalendarDate('2027-12-31T00:00:00Z')).toBe(false);
    expect(isCalendarDate('invalid')).toBe(false);
    expect(isCalendarDate(null)).toBe(false);
    expect(isCalendarDate(123)).toBe(false);
  });
});

describe('IsCalendarDate decorator', () => {
  it('passes validation for valid date', async () => {
    const dto = new TestDto();
    dto.date = '2027-12-31';
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('fails validation for nonexistent calendar date', async () => {
    const dto = new TestDto();
    dto.date = '2027-02-30';
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toHaveProperty('isCalendarDate');
  });
});
