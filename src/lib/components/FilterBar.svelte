<script lang="ts">
	import { filterStore } from '$lib/stores/filters';
	import type { FilterParams } from '$lib/types';

	const presets: { value: FilterParams['preset']; label: string }[] = [
		{ value: 'today', label: 'Hari Ini' },
		{ value: '7days', label: '7 Hari' },
		{ value: '30days', label: '30 Hari' },
		{ value: 'this-month', label: 'Bulan Ini' },
		{ value: 'this-year', label: 'Tahun Ini' },
		{ value: 'all', label: 'Semua' },
	];

	let currentPreset = $state<FilterParams['preset']>('today');
	let startDate = $state('');
	let endDate = $state('');
	let showCustom = $state(false);

	// Pakai update() biar user yang login (di-set di page) tetap terkunci
	function setPreset(preset: FilterParams['preset']) {
		currentPreset = preset;
		showCustom = preset === 'custom';
		filterStore.update((f) => ({ ...f, preset, startDate: null, endDate: null }));
	}

	function applyCustom() {
		if (startDate && endDate) {
			filterStore.update((f) => ({ ...f, preset: 'custom', startDate, endDate }));
		}
	}

	// Restore from store
	$effect(() => {
		const unsub = filterStore.subscribe((f) => {
			currentPreset = f.preset;
			if (f.preset === 'custom') {
				showCustom = true;
				startDate = f.startDate || '';
				endDate = f.endDate || '';
			}
		});
		return unsub;
	});
</script>

<div class="card space-y-3">
	<div class="flex flex-wrap items-center gap-2">
		{#each presets as p}
			<button
				onclick={() => setPreset(p.value)}
				class="px-3 py-1.5 text-sm font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap {
					currentPreset === p.value
						? 'bg-(--color-primary) text-white shadow-sm'
						: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
				}"
			>
				{p.label}
			</button>
		{/each}

		<button
			onclick={() => setPreset('custom')}
			class="px-3 py-1.5 text-sm font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap {
				showCustom
					? 'bg-(--color-primary) text-white shadow-sm'
					: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
			}"
		>
			Custom Range
		</button>
	</div>

	{#if showCustom}
		<div class="flex flex-wrap items-center gap-3 pt-2">
			<div class="flex items-center gap-2">
				<label for="start-date" class="text-sm text-slate-500">Dari:</label>
				<input
					id="start-date"
					type="date"
					bind:value={startDate}
					class="px-2 py-1 text-sm rounded-lg border border-(--border-color) bg-(--card-bg) text-(--text-color) focus:outline-none focus:ring-2 focus:ring-(--color-primary)/50"
				/>
			</div>
			<div class="flex items-center gap-2">
				<label for="end-date" class="text-sm text-slate-500">Sampai:</label>
				<input
					id="end-date"
					type="date"
					bind:value={endDate}
					class="px-2 py-1 text-sm rounded-lg border border-(--border-color) bg-(--card-bg) text-(--text-color) focus:outline-none focus:ring-2 focus:ring-(--color-primary)/50"
				/>
			</div>
			<button
				onclick={applyCustom}
				disabled={!startDate || !endDate}
				class="px-4 py-1.5 text-sm font-medium rounded-lg bg-(--color-primary) text-white hover:bg-blue-700 transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
			>
				Terapkan
			</button>
		</div>
	{/if}
</div>
