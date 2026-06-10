<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Chart, registerables } from 'chart.js';
	import type { CategoryData } from '$lib/types';

	Chart.register(...registerables);

	interface Props {
		data: CategoryData[];
		title?: string;
		height?: number;
	}

	let { data, title = 'Pengeluaran per Kategori', height = 300 }: Props = $props();

	let canvas: HTMLCanvasElement;
	let chart: Chart | null = null;

	const COLORS = [
		'#2563EB', '#22C55E', '#EF4444', '#F59E0B', '#8B5CF6',
		'#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'
	];

	$effect(() => {
		if (data.length === 0) return;
		if (chart) {
			updateChart();
		} else if (canvas) {
			createChart();
		}
	});

	function createChart() {
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		chart = new Chart(ctx, {
			type: 'doughnut',
			data: {
				labels: data.map(d => d.kategori),
				datasets: [{
					data: data.map(d => d.total),
					backgroundColor: COLORS.slice(0, data.length),
					borderWidth: 2,
					borderColor: 'transparent'
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				cutoff: 10,
				plugins: {
					legend: {
						position: 'right',
						labels: {
							usePointStyle: true,
							padding: 15,
							font: { size: 11 }
						}
					},
					tooltip: {
						callbacks: {
							label: (ctx) => {
								const item = data[ctx.dataIndex];
								return `${item.kategori}: Rp ${item.total.toLocaleString('id-ID')} (${item.persentase}%)`;
							}
						}
					}
				}
			}
		});
	}

	function updateChart() {
		if (!chart) return;
		chart.data.labels = data.map(d => d.kategori);
		chart.data.datasets[0].data = data.map(d => d.total);
		chart.data.datasets[0].backgroundColor = COLORS.slice(0, data.length);
		chart.update('none');
	}

	onDestroy(() => {
		chart?.destroy();
	});
</script>

<div class="card">
	<div class="flex items-center justify-between mb-4">
		<h3 class="text-sm font-semibold text-(--text-color)">{title}</h3>
	</div>
	<div style="height: {height}px">
		<canvas bind:this={canvas}></canvas>
	</div>
</div>
