import { addDays, isWeekend, differenceInDays, isAfter, isBefore } from "date-fns";

/**
 * Feriados nacionais brasileiros (fixos)
 * Formato: MM-DD
 */
const FIXED_HOLIDAYS = [
  "01-01", // Ano Novo
  "04-21", // Tiradentes
  "05-01", // Dia do Trabalho
  "09-07", // Independência
  "10-12", // Nossa Senhora Aparecida
  "11-02", // Finados
  "11-20", // Consciência Negra
  "12-25", // Natal
];

/**
 * Calcula a data de Páscoa para um ano específico (Algoritmo de Computus)
 */
function getEasterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

/**
 * Retorna feriados móveis brasileiros para um ano específico
 */
function getMovableHolidays(year: number): Date[] {
  const easter = getEasterDate(year);
  const holidays: Date[] = [];

  // Sexta-feira Santa (2 dias antes da Páscoa)
  holidays.push(addDays(easter, -2));

  // Corpus Christi (60 dias após a Páscoa)
  holidays.push(addDays(easter, 60));

  // Carnaval (47 dias antes da Páscoa)
  holidays.push(addDays(easter, -47));

  return holidays;
}

/**
 * Verifica se uma data é feriado brasileiro
 */
export function isHoliday(date: Date): boolean {
  const monthDay = `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

  // Verifica feriados fixos
  if (FIXED_HOLIDAYS.includes(monthDay)) {
    return true;
  }

  // Verifica feriados móveis
  const movableHolidays = getMovableHolidays(date.getFullYear());
  return movableHolidays.some(
    (holiday) =>
      holiday.getFullYear() === date.getFullYear() &&
      holiday.getMonth() === date.getMonth() &&
      holiday.getDate() === date.getDate()
  );
}

/**
 * Verifica se uma data é dia útil (não é fim de semana nem feriado)
 */
export function isBusinessDay(date: Date): boolean {
  return !isWeekend(date) && !isHoliday(date);
}

function isSuspensionDay(date: Date, suspensionDates: Date[]): boolean {
  return suspensionDates.some(
    (suspensionDate) =>
      suspensionDate.getFullYear() === date.getFullYear() &&
      suspensionDate.getMonth() === date.getMonth() &&
      suspensionDate.getDate() === date.getDate()
  );
}

/**
 * Calcula a data final adicionando dias úteis a uma data inicial
 * Considerando fins de semana e feriados brasileiros
 *
 * @param startDate - Data inicial
 * @param businessDays - Número de dias úteis a adicionar
 * @param includeStartDay - Se deve contar o dia inicial como dia útil
 * @returns Data final calculada
 */
export function addBusinessDays(
  startDate: Date,
  businessDays: number,
  includeStartDay: boolean = false,
  suspensionDates: Date[] = []
): Date {
  let currentDate = new Date(startDate);
  let daysAdded = 0;

  // Se não deve incluir o dia inicial, começa do próximo dia
  if (!includeStartDay) {
    currentDate = addDays(currentDate, 1);
  }

  // Adiciona dias úteis até atingir a quantidade desejada
  while (daysAdded < businessDays) {
    if (isBusinessDay(currentDate) && !isSuspensionDay(currentDate, suspensionDates)) {
      daysAdded++;
    }
    if (daysAdded < businessDays) {
      currentDate = addDays(currentDate, 1);
    }
  }

  return currentDate;
}

/**
 * Calcula o número de dias úteis entre duas datas
 */
export function countBusinessDays(startDate: Date, endDate: Date): number {
  let count = 0;
  let currentDate = new Date(startDate);

  while (isBefore(currentDate, endDate) || currentDate.getTime() === endDate.getTime()) {
    if (isBusinessDay(currentDate)) {
      count++;
    }
    currentDate = addDays(currentDate, 1);
  }

  return count;
}

/**
 * Calcula dias úteis restantes até uma data final
 */
export function getBusinessDaysUntil(targetDate: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);

  if (isBefore(targetDate, today)) {
    return -countBusinessDays(targetDate, today);
  }

  return countBusinessDays(today, targetDate);
}

/**
 * Determina o nível de urgência baseado em dias úteis restantes
 */
export function getUrgencyLevel(businessDaysUntil: number): "critical" | "high" | "medium" | "low" {
  if (businessDaysUntil <= 0) return "critical";
  if (businessDaysUntil <= 1) return "critical";
  if (businessDaysUntil <= 3) return "high";
  if (businessDaysUntil <= 7) return "medium";
  return "low";
}
