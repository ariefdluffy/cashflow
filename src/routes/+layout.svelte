<script lang="ts">
	import '../app.css';
	import Toast from '$lib/components/Toast.svelte';
	import { page } from '$app/stores';
	import { addToast } from '$lib/stores/toast';
	import { goto } from '$app/navigation';

	let { children } = $props();

	// Notifikasi berhasil login / logout lewat query param
	$effect(() => {
		const url = $page.url;
		const login = url.searchParams.get('login');
		const logout = url.searchParams.get('logout');

		if (login === 'success' || logout === 'success') {
			if (login === 'success') addToast('Login berhasil. Selamat datang!', 'success');
			if (logout === 'success') addToast('Anda telah logout.', 'info');

			const next = new URL(url);
			next.searchParams.delete('login');
			next.searchParams.delete('logout');
			goto(next.pathname + next.search + next.hash, { replaceState: true, noScroll: true });
		}
	});
</script>

{@render children()}
<Toast />
