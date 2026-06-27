<script lang="ts">
	let { form } = $props();
</script>

<svelte:head><title>Login — Cash Flow Dashboard</title></svelte:head>

<div class="min-h-screen flex items-center justify-center px-4 py-12">
	<div class="card w-full max-w-sm space-y-6">
		<div class="text-center space-y-2">
			<div class="w-14 h-14 rounded-xl bg-(--color-primary) flex items-center justify-center mx-auto shadow-lg">
				<span class="text-white font-bold text-2xl">💰</span>
			</div>
			<h1 class="text-xl font-bold text-(--text-color)">Cash Flow Dashboard</h1>
			<p class="text-sm text-slate-500 dark:text-slate-400">Masuk dengan nomor user Anda</p>
		</div>

		<form method="POST" class="space-y-4">
			<div class="space-y-1.5">
				<label for="nomor" class="block text-sm font-medium text-(--text-color)">Nomor User</label>
				<input
					id="nomor"
					name="nomor"
					type="text"
					autocomplete="username"
					value={form?.nomor ?? ''}
					placeholder="Contoh: 12345"
					class="w-full px-3 py-2.5 rounded-lg border border-(--border-color) bg-(--card-bg) text-(--text-color) focus:outline-none focus:ring-2 focus:ring-(--color-primary)/50 transition-shadow"
					required
				/>
			</div>

			{#if form?.error}
				<div class="flex items-center gap-2 text-sm text-(--color-danger) bg-(--color-danger)/10 rounded-lg px-3 py-2">
					<span>⚠️</span>
					<span>{form.error}</span>
				</div>
			{/if}

			<button
				type="submit"
				class="w-full py-2.5 rounded-lg bg-(--color-primary) text-white font-semibold hover:bg-blue-700 transition-colors cursor-pointer shadow-sm"
			>
				Masuk
			</button>
		</form>

		<p class="text-xs text-center text-slate-400 dark:text-slate-500">
			Hubungi admin jika nomor user belum terdaftar
		</p>
	</div>
</div>
