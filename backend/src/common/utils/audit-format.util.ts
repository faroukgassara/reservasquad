export function formatAuditMoney(
  amount: number | string | { toString(): string } | null | undefined,
): string {
  const num = Number(amount ?? 0);
  return `${(Number.isNaN(num) ? 0 : num).toFixed(3)} DT`;
}

export function formatAuditDate(d: Date | string | null | undefined): string {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return '—';
  try {
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'Africa/Tunis',
    });
  } catch {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
  }
}

export function formatAuditTime(d: Date | string | null | undefined): string {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return '—';
  try {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Africa/Tunis',
    });
  } catch {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
}

export function formatAuditDateTime(d: Date | string | null | undefined): string {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return '—';
  return `${formatAuditDate(date)} à ${formatAuditTime(date)}`;
}

export function formatProfessorName(
  prof: { firstName?: string | null; lastName?: string | null } | null | undefined,
): string {
  if (!prof) return 'Sans professeur';
  const full = `${prof.firstName || ''} ${prof.lastName || ''}`.trim();
  return full ? `Prof. ${full}` : 'Sans professeur';
}

export function formatReservationSlot(startAt: Date, endAt: Date): string {
  const dStart = new Date(startAt);
  const dEnd = new Date(endAt);
  const dateStr = formatAuditDate(dStart);
  const startH = formatAuditTime(dStart);
  const endH = formatAuditTime(dEnd);
  const dateEndStr = formatAuditDate(dEnd);

  if (dateStr === dateEndStr) {
    return `${dateStr} de ${startH} à ${endH}`;
  }
  return `du ${dateStr} ${startH} au ${dateEndStr} ${endH}`;
}

export function formatReservationLabel(reservation: {
  room?: { name: string } | null;
  startAt: Date;
  endAt: Date;
  title?: string | null;
}): string {
  const roomName = reservation.room?.name ? `Salle ${reservation.room.name}` : 'Salle';
  const slot = formatReservationSlot(reservation.startAt, reservation.endAt);
  const titlePart = reservation.title?.trim() ? ` ("${reservation.title.trim()}")` : '';
  return `${roomName}${titlePart} [${slot}]`;
}
