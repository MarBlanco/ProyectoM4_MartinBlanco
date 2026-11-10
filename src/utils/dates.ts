import dayjs from 'dayjs';

// Formato de almacenamiento de dueDate.
export const DUE_DATE_FORMAT = 'YYYY-MM-DD';

// dueDate (YYYY-MM-DD) -> "20/11/2026".
export function formatDueDate(dueDate: string): string {
    return dayjs(dueDate).format('DD/MM/YYYY');
}

export function todayString(): string {
    return dayjs().format(DUE_DATE_FORMAT);
}
