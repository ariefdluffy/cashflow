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

	function getTheme() {
		const style = getComputedStyle(document.documentElement);
		const isDark = document.documentElement.classList.contains('dark');
		return {
			income: style.getPropertyValue('--color-success').trim() || '#22C55E',
			expense: style.getPropertyValue('--color-danger').trim() || '#EF4444',
			net: style.getPropertyValue('--color-primary').trim() || '#2563EB',
			text: style.getPropertyValue('--text-color').trim() || '#1E293B',
			cardBg: style.getPropertyValue('--card-bg').trim() || '#FFFFFF',
			gridColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
			tooltipBg: isDark ? 'rgba(15,23,42,0.95)' : 'rgba(30,41,59,0.95)',
			tooltipText: isDark ? '#F1F5F9' : '#F8FAFC',
		};
	}

	function getGradients(ctx: CanvasRenderingContext2D, theme: ReturnType<typeof getTheme>) {
		const h = canvas.clientHeight || height;
		const incomeGrad = ctx.createLinearGradient(0, 0, 0, h);
		incomeGrad.addColorStop(0, theme.income + '4D');
		incomeGrad.addColorStop(1, theme.income + '0D');

		const expenseGrad = ctx.createLinearGradient(0, 0, 0, h);
		expenseGrad.addColorStop(0, theme.expense + '4D');
		expenseGrad.addColorStop(1, theme.expense + '0D');

		return { incomeGrad, expenseGrad };
	}

	function createChart() {
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const theme = getTheme();
		const labels = data.map(d => d.label);
		const incomeData = data.map(d => d.income);
		const expenseData = data.map(d => d.expense);
		const netData = data.map(d => d.income - d.expense);
		const isBar = type === 'bar';

		const { incomeGrad, expenseGrad } = getGradients(ctx, theme);

		const datasets: any[] = [
			{
				label: 'Pemasukan',
				data: incomeData,
				borderColor: theme.income,
				backgroundColor: isBar ? theme.income + 'CC' : incomeGrad,
				borderRadius: isBar ? { topLeft: 8, topRight: 8, bottomLeft: 0, bottomRight: 0 } : undefined,
				borderSkipped: isBar ? false : undefined,
				fill: !isBar,
				tension: 0.4,
				borderWidth: 2,
				pointRadius: isBar ? 0 : 4,
				pointHoverRadius: 6,
				pointBackgroundColor: theme.income,
				pointBorderColor: theme.cardBg,
				pointBorderWidth: 2,
				barPercentage: 0.65,
				categoryPercentage: 0.8,
			},
			{
				label: 'Pengeluaran',
				data: expenseData,
				borderColor: theme.expense,
				backgroundColor: isBar ? theme.expense + 'CC' : expenseGrad,
				borderRadius: isBar ? { topLeft: 8, topRight: 8, bottomLeft: 0, bottomRight: 0 } : undefined,
				borderSkipped: isBar ? false : undefined,
				fill: !isBar,
				tension: 0.4,
				borderWidth: 2,
				pointRadius: isBar ? 0 : 4,
				pointHoverRadius: 6,
				pointBackgroundColor: theme.expense,
				pointBorderColor: theme.cardBg,
				pointBorderWidth: 2,
				barPercentage: 0.65,
				categoryPercentage: 0.8,
			}
		];

		if (isBar && showNet) {
			datasets.push({
				label: 'Saldo Bersih',
				data: netData,
				type: 'line',
				borderColor: theme.net,
				backgroundColor: theme.net + '1A',
				fill: false,
				tension: 0.4,
				borderWidth: 3,
				borderDash: [8, 4],
				pointRadius: 5,
				pointBackgroundColor: theme.net,
				pointBorderColor: '#fff',
				pointBorderWidth: 2.5,
				pointHoverRadius: 7
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
						align: 'end',
						labels: {
							usePointStyle: true,
							padding: 20,
							font: { size: 12, family: "'Inter', system-ui, sans-serif" },
							color: theme.text
						}
					},
					tooltip: {
						backgroundColor: theme.tooltipBg,
						titleColor: theme.tooltipText,
						bodyColor: theme.tooltipText,
						padding: 12,
						cornerRadius: 12,
						titleFont: { size: 12, family: "'Inter', system-ui, sans-serif" },
						bodyFont: { size: 12, family: "'Inter', system-ui, sans-serif" },
						boxPadding: 4,
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
							font: { size: 11, family: "'Inter', system-ui, sans-serif" },
							color: theme.text + '99',
							maxRotation: isBar ? 45 : 0
						}
					},
					y: {
						beginAtZero: true,
						grid: {
							color: theme.gridColor,
							drawTicks: false,
						},
						border: { display: false },
						ticks: {
							font: { size: 11, family: "'Inter', system-ui, sans-serif" },
							color: theme.text + '99',
							padding: 8,
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
		const theme = getTheme();
		const isBar = type === 'bar';

		chart.data.labels = data.map(d => d.label);
		chart.data.datasets[0].data = data.map(d => d.income);
		chart.data.datasets[1].data = data.map(d => d.expense);

		// Update colors biar ngikut theme (dark mode etc)
		chart.data.datasets[0].backgroundColor = isBar ? theme.income + 'CC' : undefined;
		chart.data.datasets[0].borderColor = theme.income;
		chart.data.datasets[1].backgroundColor = isBar ? theme.expense + 'CC' : undefined;
		chart.data.datasets[1].borderColor = theme.expense;

		if (isBar && showNet && chart.data.datasets[2]) {
			chart.data.datasets[2].data = data.map(d => d.income - d.expense);
			chart.data.datasets[2].borderColor = theme.net;
			chart.data.datasets[2].pointBackgroundColor = theme.net;
		}

		// Sync theme ke options
		const legendLabels = chart.options.plugins?.legend?.labels as any;
		if (legendLabels) legendLabels.color = theme.text;

		const xTicks = chart.options.scales?.x?.ticks as any;
		if (xTicks) xTicks.color = theme.text + '99';

		const yTicks = chart.options.scales?.y?.ticks as any;
		if (yTicks) yTicks.color = theme.text + '99';

		const yGrid = chart.options.scales?.y?.grid as any;
		if (yGrid) yGrid.color = theme.gridColor;

		const tooltip = chart.options.plugins?.tooltip as any;
		if (tooltip) {
			tooltip.backgroundColor = theme.tooltipBg;
			tooltip.titleColor = theme.tooltipText;
			tooltip.bodyColor = theme.tooltipText;
		}

		chart.update('none');
	}

	$effect(() => {
		if (data.length === 0) return;
		if (chart) {
			updateChart();
		} else if (canvas) {
			createChart();
		}
	});

	// Auto-sync kalo dark mode toggle
	let observer: MutationObserver | null = null;
	onMount(() => {
		observer = new MutationObserver(() => {
			if (chart) updateChart();
		});
		observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
	});

	onDestroy(() => {
		observer?.disconnect();
		chart?.destroy();
	});
</script>

<div class="card relative overflow-hidden">
	<!-- Accent bar di atas — konsisten sama StatCard -->
	<div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-(--color-primary) to-blue-400"></div>
	<div class="flex items-center justify-between mb-4">
		<h3 class="text-sm font-semibold text-(--text-color)">{title}</h3>
	</div>
	<div style="height: {height}px">
		<canvas bind:this={canvas}></canvas>
	</div>
</div>
