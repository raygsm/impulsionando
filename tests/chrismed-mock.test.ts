import { describe, expect, it } from 'vitest';
import {
  buildChrismedMockCalendar,
  getChrismedOfficialTimes,
  type ChrismedModality,
} from './chrismed-mock';

const monday = new Date('2026-07-13T12:00:00');

function dayFor(modality: ChrismedModality, offset: number, durations?: Partial<Record<ChrismedModality, number>>) {
  return buildChrismedMockCalendar({
    startDate: monday,
    modality,
    durationMinutesByModality: durations,
  })[offset];
}

function seededState(iso: string, time: string): 'unavailable' | 'held' | 'free' {
  let h = 0;
  for (let i = 0; i < `${iso}|${time}`.length; i++) h = (h * 31 + `${iso}|${time}`.charCodeAt(i)) | 0;
  const seed = Math.abs(h) % 7;
  if (seed === 0) return 'unavailable';
  if (seed === 1) return 'held';
  return 'free';
}

describe('CHRISMED official scheduling grid', () => {
  it('keeps the exact official teleconsulta times by weekday, including duplicated Tuesday 15:50', () => {
    expect(getChrismedOfficialTimes('telemedicina', 1)).toEqual(['18:45', '19:15', '19:45', '20:15']);
    expect(getChrismedOfficialTimes('telemedicina', 2)).toEqual([
      '14:50',
      '15:20',
      '15:50',
      '15:50',
      '16:20',
      '16:50',
      '17:20',
      '17:50',
      '18:20',
    ]);
    expect(getChrismedOfficialTimes('telemedicina', 3)).toEqual(['18:45', '10:15', '19:45', '20:15']);
    expect(getChrismedOfficialTimes('telemedicina', 4)).toEqual(['18:45', '19:15', '19:45', '20:15']);
    expect(getChrismedOfficialTimes('telemedicina', 5)).toEqual(['08:30', '09:00', '09:30', '10:00', '10:30']);
    expect(getChrismedOfficialTimes('telemedicina', 6)).toEqual(['08:00', '08:30', '09:00', '09:30', '10:00', '10:30']);
  });

  it('applies modality-specific agenda days and leaves intervals without agenda empty', () => {
    expect(getChrismedOfficialTimes('presencial', 1)).toEqual([]);
    expect(getChrismedOfficialTimes('presencial', 2)).toEqual(getChrismedOfficialTimes('telemedicina', 2));
    expect(getChrismedOfficialTimes('presencial', 5)).toEqual(getChrismedOfficialTimes('telemedicina', 5));
    expect(getChrismedOfficialTimes('presencial', 6)).toEqual([]);

    expect(getChrismedOfficialTimes('domiciliar', 1)).toEqual([]);
    expect(getChrismedOfficialTimes('domiciliar', 2)).toEqual(getChrismedOfficialTimes('telemedicina', 2));
    expect(getChrismedOfficialTimes('domiciliar', 6)).toEqual(getChrismedOfficialTimes('telemedicina', 6));
  });

  it('preserves duplicated time occurrences with stable slot ids and independent render labels', () => {
    const tuesday = dayFor('telemedicina', 1);
    const duplicated = tuesday.slots.filter((slot) => slot.time === '15:50');

    expect(duplicated).toHaveLength(2);
    expect(duplicated.map((slot) => slot.occurrence)).toEqual([1, 2]);
    expect(new Set(duplicated.map((slot) => slot.id)).size).toBe(2);
    expect(duplicated.every((slot) => slot.startsAtMinutes === 15 * 60 + 50)).toBe(true);
  });

  it('uses iso|time seed consistently across modalities for same official slot', () => {
    const tuesdayIso = '2026-07-14';
    const seededTime = getChrismedOfficialTimes('telemedicina', 2).find((time) => seededState(tuesdayIso, time) !== 'free');
    expect(seededTime).toBeTruthy();

    const teleSlot = dayFor('telemedicina', 1).slots.find((slot) => slot.time === seededTime);
    const presencialSlot = dayFor('presencial', 1).slots.find((slot) => slot.time === seededTime);
    const domiciliarSlot = dayFor('domiciliar', 1).slots.find((slot) => slot.time === seededTime);

    expect(teleSlot?.state).not.toBe('available');
    expect(presencialSlot?.state).not.toBe('available');
    expect(domiciliarSlot?.state).not.toBe('available');
  });

  it('blocks crossed modality overlaps using the real consumed duration window', () => {
    const tuesdayIso = '2026-07-14';
    const blockerTime = getChrismedOfficialTimes('domiciliar', 2).find((time) => seededState(tuesdayIso, time) !== 'free');
    expect(blockerTime).toBeTruthy();

    const blockerStart = Number(blockerTime!.slice(0, 2)) * 60 + Number(blockerTime!.slice(3, 5));
    const overlappingTele = dayFor('telemedicina', 1, { domiciliar: 60 }).slots.find((slot) => (
      slot.startsAtMinutes > blockerStart && slot.startsAtMinutes < blockerStart + 60
    ));

    expect(overlappingTele).toBeTruthy();
    expect(overlappingTele?.state).toBe('unavailable');
    expect(overlappingTele?.blockedBy?.time).toBe(blockerTime);
    expect(overlappingTele?.blockedBy?.modality).toBe('domiciliar');
  });
});