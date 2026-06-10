<script lang="ts">
	interface Props {
		title: string;
		value: string;
		icon?: string;
		color?: string;
		trend?: 'up' | 'down' | 'neutral';
		trendValue?: string;
	}

	let { title, value, icon = '💰', color = 'primary', trend, trendValue }: Props = $props();

	const colorMap: Record<string, string> = {
		primary: 'from-(--color-primary) to-blue-400',
		success: 'from-(--color-success) to-green-400',
		danger: 'from-(--color-danger) to-red-400',
		warning: 'from-amber-500 to-yellow-400',
		info: 'from-violet-500 to-purple-400'
	};

	const trendColors: Record<string, string> = {
		up: 'text-(--color-success)',
		down: 'text-(--color-danger)',
		neutral: 'text-slate-500'
	};
</script>

<div class="card relative overflow-hidden group">
	<!-- Color accent bar -->
	<div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r {colorMap[color] || colorMap.primary}"></div>

	<div class="flex items-start justify-between">
		<div class="space-y-1">
			<p class="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
			<p class="text-2xl font-bold text-(--text-color) tracking-tight">{value}</p>
			{#if trend}
				<p class="text-xs font-medium {trendColors[trend]} flex items-center gap-1">
					{#if trend === 'up'}↑{:else if trend === 'down'}↓{:else}→{/if}
					{trendValue}
				</p>
			{/if}
		</div>
		<span class="text-2xl opacity-60">{icon}</span>
	</div>
</div>
