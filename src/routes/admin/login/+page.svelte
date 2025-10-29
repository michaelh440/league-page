<script>
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let username = '';
	let password = '';
	let error = '';
	let loading = false;

	onMount(() => {
		// Check if already logged in
		checkAuth();
	});

	async function checkAuth() {
		try {
			const response = await fetch('/api/admin/auth/check');
			if (response.ok) {
				// Already logged in, redirect to admin
				goto('/admin');
			}
		} catch (err) {
			// Not logged in, stay on login page
		}
	}

	async function handleLogin(e) {
		e.preventDefault();
		error = '';
		loading = true;

		try {
			const response = await fetch('/api/admin/auth/login', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ username, password })
			});

			const data = await response.json();

			if (response.ok) {
				// Login successful, redirect to admin
				goto('/admin');
			} else {
				error = data.error || 'Invalid credentials';
			}
		} catch (err) {
			error = 'Network error. Please try again.';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Admin Login - Fantasy Football</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
	<div class="max-w-md w-full">
		<!-- Login Card -->
		<div class="bg-white rounded-2xl shadow-xl p-8">
			<!-- Logo/Title -->
			<div class="text-center mb-8">
				<div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-4">
					<svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
					</svg>
				</div>
				<h1 class="text-3xl font-bold text-gray-900">Admin Login</h1>
				<p class="text-gray-600 mt-2">Fantasy Football League Management</p>
			</div>

			<!-- Error Message -->
			{#if error}
				<div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
					<div class="flex items-center">
						<svg class="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
						</svg>
						<p class="text-sm text-red-700">{error}</p>
					</div>
				</div>
			{/if}

			<!-- Login Form -->
			<form on:submit={handleLogin}>
				<div class="space-y-6">
					<!-- Username Field -->
					<div>
						<label for="username" class="block text-sm font-medium text-gray-700 mb-2">
							Username
						</label>
						<input
							type="text"
							id="username"
							bind:value={username}
							required
							disabled={loading}
							class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
							placeholder="Enter your username"
						/>
					</div>

					<!-- Password Field -->
					<div>
						<label for="password" class="block text-sm font-medium text-gray-700 mb-2">
							Password
						</label>
						<input
							type="password"
							id="password"
							bind:value={password}
							required
							disabled={loading}
							class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
							placeholder="Enter your password"
						/>
					</div>

					<!-- Submit Button -->
					<button
						type="submit"
						disabled={loading}
						class="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
					>
						{#if loading}
							<span class="flex items-center justify-center">
								<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
								Signing in...
							</span>
						{:else}
							Sign In
						{/if}
					</button>
				</div>
			</form>

			<!-- Footer Note -->
			<div class="mt-6 text-center">
				<p class="text-xs text-gray-500">
					Default credentials: admin / admin123
				</p>
				<p class="text-xs text-gray-500 mt-1">
					⚠️ Change the default password after first login
				</p>
			</div>
		</div>

		<!-- Additional Info -->
		<div class="mt-6 text-center">
			<p class="text-sm text-gray-600">
				Need help? Contact your league administrator
			</p>
		</div>
	</div>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
	}
</style>
