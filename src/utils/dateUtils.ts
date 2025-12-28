/**
 * Normaliza uma data para o início do dia (00:00:00)
 * Trata strings no formato YYYY-MM-DD como datas locais, não UTC
 */
export function normalizeDate(date: Date | string): Date {
  if (typeof date === 'string') {
    // Se for string no formato YYYY-MM-DD, criar data local explicitamente
    const dateMatch = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (dateMatch) {
      const [, year, month, day] = dateMatch;
      const normalized = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 0, 0, 0, 0);
      return normalized;
    }
  }
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

/**
 * Retorna o fim do dia (23:59:59.999) para uma data
 */
export function getEndOfDay(date: Date | string): Date {
  const normalized = normalizeDate(date);
  const endOfDay = new Date(normalized);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay;
}
