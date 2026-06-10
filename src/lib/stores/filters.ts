import { writable } from 'svelte/store';
import type { FilterParams } from '$lib/types';

export const filterStore = writable<FilterParams>({
	startDate: null,
	endDate: null,
	preset: '30days'
});

/**
 * Calculate date range from a preset.
 */
export function getDateRange(preset: FilterParams['preset']): { startDate: string; endDate: string } {
	const now = new Date();
	const end = now.toISOString().split('T')[0];

	switch (preset) {
		case 'today': {
			return { startDate: end, endDate: end };
		}
		case '7days': {
			const start = new Date(now);
			start.setDate(start.getDate() - 7);
			return { startDate: start.toISOString().split('T')[0], endDate: end };
		}
		case '30days': {
			const start = new Date(now);
			start.setDate(start.getDate() - 30);
			return { startDate: start.toISOString().split('T')[0], endDate: end };
		}
		case 'this-month': {
			const start = new Date(now.getFullYear(), now.getMonth(), 1);
			return { startDate: start.toISOString().split('T')[0], endDate: end };
		}
		case 'this-year': {
			const start = new Date(now.getFullYear(), 0, 1);
			return { startDate: start.toISOString().split('T')[0], endDate: end };
		}
		default: {
			return { startDate: '2026-01-01', endDate: end };
		}
	}
}
