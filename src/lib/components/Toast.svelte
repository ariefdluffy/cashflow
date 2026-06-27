<script lang="ts">
	import { fly } from 'svelte/transition';
	import { toasts, removeToast } from '$lib/stores/toast';

	const icons = { success: '✅', error: '⚠️', info: 'ℹ️' } as const;
</script>

<div class="fixed top-4 right-4 z-100 flex flex-col gap-2 w-[min(92vw,360px)] pointer-events-none">
	{#each $toasts as toast (toast.id)}
		<div
			in:fly={{ x: 360, duration: 250 }}
			out:fly={{ x: 360, duration: 200 }}
			class="pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl border border-(--border-color) bg-(--card-bg) shadow-lg"
			role="status"
		>
			<span class="text-base">{icons[toast.type]}</span>
			<span class="text-sm font-medium flex-1 text-(--text-color)">{toast.message}</span>
			<button
				onclick={() => removeToast(toast.id)}
				class="text-slate-400 hover:text-(--text-color) cursor-pointer text-lg leading-none"
				aria-label="Tutup notifikasi"
			>×</button>
		</div>
	{/each}
</div>
