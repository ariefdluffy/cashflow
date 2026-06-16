import { writable } from 'svelte/store';
import type { FilterParams } from '$lib/types';

export const filterStore = writable<FilterParams>({
	startDate: null,
	endDate: null,
	preset: 'today',
	user: null
});

/**
 * Calculate date range from a preset.
 */
function toLocalDateString(d: Date): string {
	const year = d.getFullYear();
	const month = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

export function getDateRange(preset: FilterParams['preset']): { startDate: string; endDate: string } {
	const now = new Date();
	const end = toLocalDateString(now);

	switch (preset) {
		case 'today': {
			return { startDate: end, endDate: end };
		}
		case '7days': {
			const start = new Date(now);
			start.setDate(start.getDate() - 7);
			return { startDate: toLocalDateString(start), endDate: end };
		}
		case '30days': {
			const start = new Date(now);
			start.setDate(start.getDate() - 30);
			return { startDate: toLocalDateString(start), endDate: end };
		}
		case 'this-month': {
			const start = new Date(now.getFullYear(), now.getMonth(), 1);
			return { startDate: toLocalDateString(start), endDate: end };
		}
		case 'this-year': {
			const start = new Date(now.getFullYear(), 0, 1);
			return { startDate: toLocalDateString(start), endDate: end };
		}
		default: {
			return { startDate: '2026-01-01', endDate: end };
		}
	}
}
