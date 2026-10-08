export function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function calendarCells(year: number, month: number): (number | null)[] {
  const days = new Date(year, month + 1, 0).getDate();
  const leading = (new Date(year, month, 1).getDay() + 6) % 7;
  const count = Math.ceil((leading + days) / 7) * 7;
  return Array.from({ length: count }, (_, index) => {
    const day = index - leading + 1;
    return day >= 1 && day <= days ? day : null;
  });
}
