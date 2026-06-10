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
		showNet?: boolean;
	}

	let { data, title = 'Cash Flow Chart', type = 'line', height = 300, showNet = false }: Props = $props();

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

	function getGradients(ctx: CanvasRenderingContext2D) {
		const h = canvas.clientHeight || height;
		const incomeGrad = ctx.createLinearGradient(0, 0, 0, h);
		incomeGrad.addColorStop(0, '#22C55E');
		incomeGrad.addColorStop(1, '#16A34A');

		const expenseGrad = ctx.createLinearGradient(0, 0, 0, h);
		expenseGrad.addColorStop(0, '#EF4444');
		expenseGrad.addColorStop(1, '#DC2626');

		return { incomeGrad, expenseGrad };
	}

	function createChart() {
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const labels = data.map(d => d.label);
		const incomeData = data.map(d => d.income);
		const expenseData = data.map(d => d.expense);
		const netData = data.map(d => d.income - d.expense);

		const isBar = type === 'bar';

		// Gradient fills utk bar chart
		const { incomeGrad, expenseGrad } = getGradients(ctx);

		const datasets: any[] = [
			{
				label: 'Pemasukan',
				data: incomeData,
				borderColor: '#22C55E',
				backgroundColor: isBar ? incomeGrad : 'rgba(34, 197, 94, 0.1)',
				borderRadius: isBar ? 4 : undefined,
				borderSkipped: isBar ? false : undefined,
				fill: !isBar,
				tension: 0.3,
				borderWidth: 2,
				pointRadius: isBar ? 0 : 3,
				pointHoverRadius: 5
			},
			{
				label: 'Pengeluaran',
				data: expenseData,
				borderColor: '#EF4444',
				backgroundColor: isBar ? expenseGrad : 'rgba(239, 68, 68, 0.1)',
				borderRadius: isBar ? 4 : undefined,
				borderSkipped: isBar ? false : undefined,
				fill: !isBar,
				tension: 0.3,
				borderWidth: 2,
				pointRadius: isBar ? 0 : 3,
				pointHoverRadius: 5
			}
		];

		// Net balance line overlay utk bar chart
		if (isBar && showNet) {
			datasets.push({
				label: 'Saldo Bersih',
				data: netData,
				type: 'line',
				borderColor: '#6366F1',
				backgroundColor: 'rgba(99, 102, 241, 0.1)',
				fill: false,
				tension: 0.4,
				borderWidth: 2.5,
				borderDash: [6, 3],
				pointRadius: 4,
				pointBackgroundColor: '#6366F1',
				pointBorderColor: '#fff',
				pointBorderWidth: 2,
				pointHoverRadius: 6
			});
		}

		chart = new Chart(ctx, {
			type,
			data: { labels, datasets },
			options: {
				responsive: true,
				maintainAspectRatio: false,
				animation: {
					duration: 800,
					easing: 'easeOutQuart'
				},
				interaction: {
					mode: 'index',
					intersect: false
				},
				plugins: {
					legend: {
						position: 'top',
						labels: {
							usePointStyle: true,
							padding: 20,
							font: { size: 12 }
						}
					},
					tooltip: {
						backgroundColor: 'rgba(0,0,0,0.8)',
						padding: 12,
						cornerRadius: 8,
						callbacks: {
							label: (ctx) => {
								const val = ctx.parsed.y;
								return ctx.dataset.label + ': Rp ' + val.toLocaleString('id-ID');
							}
						}
					}
				},
				scales: {
					x: {
						grid: { display: false },
						ticks: {
							maxTicksLimit: isBar ? labels.length : 10,
							font: { size: 11 },
							maxRotation: isBar ? 45 : 0
						}
					},
					y: {
						beginAtZero: true,
						grid: {
							color: 'rgba(0,0,0,0.06)'
						},
						ticks: {
							font: { size: 11 },
							callback: (value) => {
								const v = value as number;
								if (v >= 1_000_000) return 'Rp ' + (v / 1_000_000).toFixed(1) + 'Jt';
								if (v >= 1_000) return 'Rp ' + (v / 1_000).toFixed(0) + 'Rb';
								return 'Rp ' + v.toLocaleString('id-ID');
							}
						}
					}
				}
			}
		});
	}

	function updateChart() {
		if (!chart) return;
		const isBar = type === 'bar';

		chart.data.labels = data.map(d => d.label);
		chart.data.datasets[0].data = data.map(d => d.income);
		chart.data.datasets[1].data = data.map(d => d.expense);

		// Update gradients pas resize
		if (isBar) {
			const ctx = canvas?.getContext('2d');
			if (ctx) {
				const { incomeGrad, expenseGrad } = getGradients(ctx);
				chart.data.datasets[0].backgroundColor = incomeGrad;
				chart.data.datasets[1].backgroundColor = expenseGrad;
			}
		}

		// Update net line dataset kalo ada
		if (isBar && showNet && chart.data.datasets[2]) {
			chart.data.datasets[2].data = data.map(d => d.income - d.expense);
		}

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
