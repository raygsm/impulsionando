export const CHRISMED_TIME_ZONE = 'America/Sao_Paulo' as const;

type ZonedClock = {
  date: string;
  time: string;
  weekday: number;
  hour: number;
};

export function getChrismedClock(now: Date = new Date()): ZonedClock {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: CHRISMED_TIME_ZONE,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hourCycle: 'h23', weekday: 'short',
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';
  const weekdays: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const hour = Number(value('hour'));
  return {
    date: `${value('year')}-${value('month')}-${value('day')}`,
    time: `${value('hour')}:${value('minute')}:${value('second')}`,
    weekday: weekdays[value('weekday')] ?? 0,
    hour,
  };
}

/** A slot expires exactly at its start: slot_start <= now is unavailable. */
export function isFutureChrismedSlot(date: string, time: string, now: Date = new Date()): boolean {
  const clock = getChrismedClock(now);
  const normalizedTime = /^\d{2}:\d{2}$/.test(time) ? `${time}:00` : time;
  return `${date}T${normalizedTime}` > `${clock.date}T${clock.time}`;
}

export function getChrismedGreeting(now: Date = new Date()): 'Olá' | 'Bom dia' | 'Boa tarde' | 'Boa noite' {
  const { hour } = getChrismedClock(now);
  if (hour < 6) return 'Olá';
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function isChrismedHumanOnline(now: Date = new Date()): boolean {
  const { weekday, hour } = getChrismedClock(now);
  if (weekday === 0) return false;
  if (weekday === 6) return hour >= 9 && hour < 13;
  return hour >= 9 && hour < 19;
}
