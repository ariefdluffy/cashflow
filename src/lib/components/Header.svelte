<script lang="ts">
	import { lastSync, connected } from '$lib/stores/stats';

	let darkMode = $state(false);

	function toggleDark() {
		darkMode = !darkMode;
		document.documentElement.classList.toggle('dark', darkMode);
	}

	function formatDate(timestamp: string): string {
		if (!timestamp) return '-';
		try {
			return new Date(timestamp).toLocaleDateString('id-ID', {
				day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
			});
		} catch {
			return timestamp;
		}
	}
</script>

<header class="glass sticky top-0 z-50 px-4 sm:px-6 lg:px-8 py-3 border-b border-(--border-color)">
	<div class="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
		<div class="flex items-center gap-3">
			<div class="w-8 h-8 rounded-lg bg-(--color-primary) flex items-center justify-center">
				<span class="text-white font-bold text-sm">CF</span>
			</div>
			<div>
				<h1 class="text-lg font-bold text-(--text-color)">Cash Flow Dashboard</h1>
				<p class="text-xs text-slate-500 dark:text-slate-400">
					Last Sync: {formatDate($lastSync)}
				</p>
			</div>
		</div>

		<div class="flex items-center gap-4">
			<!-- Connection Status -->
			<div class="flex items-center gap-2 text-sm">
				<span class="inline-block w-2 h-2 rounded-full {
					$connected ? 'bg-(--color-success)' : 'bg-(--color-danger)'
				} animate-pulse"></span>
				<span class="text-slate-600 dark:text-slate-300">
					{$connected ? 'Connected' : 'Disconnected'}
				</span>
			</div>

			<!-- Dark Mode Toggle -->
			<button
				onclick={toggleDark}
				class="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
				aria-label="Toggle dark mode"
			>
				{#if darkMode}
					<svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd" />
					</svg>
				{:else}
					<svg class="w-5 h-5 text-slate-600" fill="currentColor" viewBox="0 0 20 20">
						<path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
					</svg>
				{/if}
			</button>
		</div>
	</div>
</header>
