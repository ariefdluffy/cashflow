<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Chart, registerables } from 'chart.js';
	import type { ChartDataPoint } from '$lib/types';

	Chart.register(...registerables);

	interface Props {
		data: ChartDataPoint[];
		title?: string;
		type?: 'line' | 'bar';
		height?: number;
	}

	let { data, title = 'Cash Flow Chart', type = 'line', height = 300 }: Props = $props();

	let canvas: HTMLCanvasElement;
	let chart: Chart | null = null;

	$effect(() => {
		// React to data changes
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

		const labels = data.map(d => d.label);
		const incomeData = data.map(d => d.income);
		const expenseData = data.map(d => d.expense);

		chart = new Chart(ctx, {
			type,
			data: {
				labels,
				datasets: [
					{
						label: 'Pemasukan',
						data: incomeData,
						borderColor: '#22C55E',
						backgroundColor: 'rgba(34, 197, 94, 0.1)',
						fill: type === 'line',
						tension: 0.3,
						borderWidth: 2,
						pointRadius: 3,
						pointHoverRadius: 5
					},
					{
						label: 'Pengeluaran',
						data: expenseData,
						borderColor: '#EF4444',
						backgroundColor: 'rgba(239, 68, 68, 0.1)',
						fill: type === 'line',
						tension: 0.3,
						borderWidth: 2,
						pointRadius: 3,
						pointHoverRadius: 5
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				interaction: {
					mode: 'index',
					intersect: false
				},
				plugins: {
					legend: {
						position: 'top',
						labels: { usePointStyle: true, padding: 20 }
					}
				},
				scales: {
					x: {
						ticks: { maxTicksLimit: 10 },
						grid: { display: false }
					},
					y: {
						beginAtZero: true,
						ticks: {
							callback: (value) => 'Rp ' + (value as number).toLocaleString('id-ID')
						}
					}
				}
			}
		});
	}

	function updateChart() {
		if (!chart) return;
		chart.data.labels = data.map(d => d.label);
		chart.data.datasets[0].data = data.map(d => d.income);
		chart.data.datasets[1].data = data.map(d => d.expense);
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
