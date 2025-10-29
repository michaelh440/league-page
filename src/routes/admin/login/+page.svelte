<script>
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let username = '';
	let password = '';
	let error = '';
	let loading = false;

	onMount(() => {
		checkAuth();
	});

	async function checkAuth() {
		try {
			const response = await fetch('/api/admin/auth/check');
			if (response.ok) {
				goto('/admin');
			}
		} catch (err) {
			// Not logged in, stay on login page
		}
	}

	async function handleLogin(e) {
		e.preventDefault(); // Prevent default form submission
		error = '';
		loading = true;

		try {
			const response = await fetch('/api/admin/auth/login', {
				method: 'POST', // Explicitly set POST
				headers: {
					'Content-Type': 'application/json'
				},
				credentials: 'include', // Include cookies
				body: JSON.stringify({ username, password })
			});

			const data = await response.json();

			if (response.ok) {
				// Login successful, redirect to admin
				window.location.href = '/admin'; // Use window.location for hard redirect
			} else {
				error = data.error || 'Invalid credentials';
			}
		} catch (err) {
			console.error('Login error:', err);
			error = 'Network error. Please try again.';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Admin Login - Fantasy Football</title>
</svelte:head>

<div class="login-container">
	<div class="login-card">
		<!-- Logo/Title -->
		<div class="login-header">
			<div class="logo-circle">
				<svg class="lock-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
				</svg>
			</div>
			<h1 class="login-title">Admin Login</h1>
			<p class="login-subtitle">Fantasy Football League Management</p>
		</div>

		<!-- Error Message -->
		{#if error}
			<div class="error-message">
				<svg class="error-icon" fill="currentColor" viewBox="0 0 20 20">
					<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
				</svg>
				<p>{error}</p>
			</div>
		{/if}

		<!-- Login Form -->
		<form on:submit|preventDefault={handleLogin} class="login-form" method="POST" action="/api/admin/auth/login">
			<!-- Username Field -->
			<div class="form-group">
				<label for="username">Username</label>
				<input
					type="text"
					id="username"
					name="username"
					bind:value={username}
					required
					disabled={loading}
					placeholder="Enter your username"
					autocomplete="username"
				/>
			</div>

			<!-- Password Field -->
			<div class="form-group">
				<label for="password">Password</label>
				<input
					type="password"
					id="password"
					name="password"
					bind:value={password}
					required
					disabled={loading}
					placeholder="Enter your password"
					autocomplete="current-password"
				/>
			</div>

			<!-- Submit Button -->
			<button type="submit" disabled={loading} class="submit-button">
				{#if loading}
					<span class="loading-content">
						<svg class="spinner" fill="none" viewBox="0 0 24 24">
							<circle class="spinner-circle" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="spinner-path" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						Signing in...
					</span>
				{:else}
					Sign In
				{/if}
			</button>
		</form>

		<!-- Footer Note -->
		<div class="login-footer">
			<p class="footer-note">Default credentials: admin / admin123</p>
			<p class="footer-warning">⚠️ Change the default password after first login</p>
		</div>
	</div>

	<!-- Additional Info -->
	<div class="help-text">
		<p>Need help? Contact your league administrator</p>
	</div>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
	}

	.login-container {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 20px;
	}

	.login-card {
		width: 100%;
		max-width: 420px;
		background: white;
		border-radius: 16px;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
		padding: 40px 32px;
	}

	.login-header {
		text-align: center;
		margin-bottom: 32px;
	}

	.logo-circle {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 64px;
		height: 64px;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 50%;
		margin-bottom: 16px;
	}

	.lock-icon {
		width: 32px;
		height: 32px;
		color: white;
	}

	.login-title {
		font-size: 28px;
		font-weight: 700;
		color: #1a202c;
		margin: 0 0 8px 0;
	}

	.login-subtitle {
		color: #718096;
		margin: 0;
		font-size: 14px;
	}

	.error-message {
		display: flex;
		align-items: center;
		padding: 12px 16px;
		background-color: #fff5f5;
		border: 1px solid #feb2b2;
		border-radius: 8px;
		margin-bottom: 24px;
	}

	.error-icon {
		width: 20px;
		height: 20px;
		color: #f56565;
		margin-right: 8px;
		flex-shrink: 0;
	}

	.error-message p {
		font-size: 14px;
		color: #c53030;
		margin: 0;
	}

	.login-form {
		margin-bottom: 24px;
	}

	.form-group {
		margin-bottom: 20px;
	}

	.form-group label {
		display: block;
		font-size: 14px;
		font-weight: 500;
		color: #2d3748;
		margin-bottom: 8px;
	}

	.form-group input {
		width: 100%;
		padding: 12px 16px;
		border: 2px solid #e2e8f0;
		border-radius: 8px;
		font-size: 16px;
		transition: all 0.2s;
		box-sizing: border-box;
	}

	.form-group input:focus {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}

	.form-group input:disabled {
		background-color: #f7fafc;
		cursor: not-allowed;
		opacity: 0.6;
	}

	.form-group input::placeholder {
		color: #a0aec0;
	}

	.submit-button {
		width: 100%;
		padding: 14px 16px;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		font-weight: 600;
		font-size: 16px;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s;
		box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);
	}

	.submit-button:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 6px 12px rgba(102, 126, 234, 0.4);
	}

	.submit-button:active:not(:disabled) {
		transform: translateY(0);
	}

	.submit-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	.loading-content {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.spinner {
		width: 20px;
		height: 20px;
		margin-right: 8px;
		animation: spin 1s linear infinite;
	}

	.spinner-circle {
		opacity: 0.25;
	}

	.spinner-path {
		opacity: 0.75;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.login-footer {
		text-align: center;
		padding-top: 16px;
		border-top: 1px solid #e2e8f0;
	}

	.footer-note {
		font-size: 12px;
		color: #718096;
		margin: 0 0 4px 0;
	}

	.footer-warning {
		font-size: 12px;
		color: #ed8936;
		margin: 0;
	}

	.help-text {
		margin-top: 24px;
		text-align: center;
	}

	.help-text p {
		font-size: 14px;
		color: white;
		margin: 0;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
	}

	/* Responsive */
	@media (max-width: 480px) {
		.login-card {
			padding: 32px 24px;
		}

		.login-title {
			font-size: 24px;
		}
	}
</style>