<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	
	let user = null;
	let loading = true;
	let mobileMenuOpen = false;
	let userMenuOpen = false;

	onMount(async () => {
		await checkAuth();
	});

	async function checkAuth() {
		try {
			const res = await fetch('/api/admin/auth/check', {
				credentials: 'include'
			});
			
			if (res.ok) {
				const data = await res.json();
				user = data.user;
			} else {
				goto('/admin/login');
			}
		} catch (err) {
			console.error('Auth check failed:', err);
			goto('/admin/login');
		} finally {
			loading = false;
		}
	}

	async function handleLogout() {
		try {
			const res = await fetch('/api/admin/auth/logout', {
				method: 'POST',
				credentials: 'include'
			});

			if (res.ok) {
				window.location.href = '/admin/login';
			}
		} catch (err) {
			console.error('Logout failed:', err);
		}
	}

	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}

	function toggleUserMenu() {
		userMenuOpen = !userMenuOpen;
	}

	function isActive(path) {
		return $page.url.pathname === path || $page.url.pathname.startsWith(path + '/');
	}
</script>

{#if loading}
	<div class="loading-container">
		<div class="loading-content">
			<div class="spinner"></div>
			<p class="loading-text">Loading...</p>
		</div>
	</div>
{:else}
	<div class="admin-container">
		<!-- Top Navigation Bar -->
		<nav class="top-nav">
			<div class="nav-inner">
				<div class="nav-content">
					<!-- Logo/Title -->
					<div class="logo-section">
						<svg class="logo-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
						</svg>
						<h1 class="logo-text">Fantasy League Admin</h1>
					</div>

					<!-- Desktop Navigation -->
					<div class="desktop-nav">
						<a 
							href="/admin" 
							class="nav-link"
							class:active={isActive('/admin') && !isActive('/admin/users') && !isActive('/admin/profile')}
						>
							Dashboard
						</a>
						{#if user?.can_manage_managers || user?.is_admin}
							<a 
								href="/admin/users" 
								class="nav-link"
								class:active={isActive('/admin/users')}
							>
								Users
							</a>
						{/if}

						<!-- User Menu -->
						<div class="user-menu-container">
							<button
								on:click={toggleUserMenu}
								class="user-menu-button"
							>
								<svg class="user-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
								</svg>
								<span>{user?.username || 'Account'}</span>
								<svg class="chevron-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
								</svg>
							</button>

							{#if userMenuOpen}
								<div class="user-dropdown">
									<div class="dropdown-content">
										<a
											href="/admin/profile"
											class="dropdown-link"
											on:click={() => userMenuOpen = false}
										>
											<svg class="dropdown-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
											</svg>
											<span>Profile & Settings</span>
										</a>
										
										<hr class="dropdown-divider" />
										
										<button
											on:click={handleLogout}
											class="dropdown-button logout-button"
										>
											<svg class="dropdown-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
											</svg>
											<span>Logout</span>
										</button>
									</div>
								</div>
							{/if}
						</div>
					</div>

					<!-- Mobile Menu Button -->
					<button
						on:click={toggleMobileMenu}
						class="mobile-menu-button"
					>
						<svg class="menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							{#if mobileMenuOpen}
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							{:else}
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
							{/if}
						</svg>
					</button>
				</div>

				<!-- Mobile Navigation Menu -->
				{#if mobileMenuOpen}
					<div class="mobile-menu">
						<div class="mobile-menu-links">
							<a 
								href="/admin" 
								class="mobile-nav-link"
								class:active={isActive('/admin') && !isActive('/admin/users') && !isActive('/admin/profile')}
								on:click={() => mobileMenuOpen = false}
							>
								Dashboard
							</a>
							{#if user?.can_manage_managers || user?.is_admin}
								<a 
									href="/admin/users" 
									class="mobile-nav-link"
									class:active={isActive('/admin/users')}
									on:click={() => mobileMenuOpen = false}
								>
									Users
								</a>
							{/if}
							<a 
								href="/admin/profile" 
								class="mobile-nav-link"
								class:active={isActive('/admin/profile')}
								on:click={() => mobileMenuOpen = false}
							>
								Profile & Settings
							</a>
							
							<hr class="mobile-divider" />
							
							<button
								on:click={handleLogout}
								class="mobile-logout-button"
							>
								<svg class="logout-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
								</svg>
								<span>Logout</span>
							</button>
						</div>
					</div>
				{/if}
			</div>
		</nav>

		<!-- Main Content Area -->
		<main class="main-content">
			<slot />
		</main>
	</div>
{/if}

<style>
	/* Loading State */
	.loading-container {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100vh;
	}

	.loading-content {
		text-align: center;
	}

	.spinner {
		border: 4px solid #f3f4f6;
		border-top: 4px solid #8b5cf6;
		border-radius: 50%;
		width: 40px;
		height: 40px;
		animation: spin 1s linear infinite;
		margin: 0 auto 16px;
	}

	.loading-text {
		color: #6b7280;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	/* Main Container */
	.admin-container {
		min-height: 100vh;
		background: #f9fafb;
	}

	/* Top Navigation */
	.top-nav {
		background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.nav-inner {
		max-width: 1280px;
		margin: 0 auto;
		padding: 1rem 1.5rem;
	}

	.nav-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	/* Logo Section */
	.logo-section {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.logo-icon {
		width: 32px;
		height: 32px;
		color: white;
	}

	.logo-text {
		color: white;
		font-size: 1.5rem;
		font-weight: bold;
		margin: 0;
	}

	/* Desktop Navigation */
	.desktop-nav {
		display: none;
		align-items: center;
		gap: 1rem;
	}

	.nav-link {
		color: white;
		text-decoration: none;
		padding: 0.5rem 1rem;
		border-radius: 6px;
		font-weight: 500;
		transition: background 0.2s;
		background: transparent;
	}

	.nav-link:hover {
		background: rgba(255, 255, 255, 0.2);
	}

	.nav-link.active {
		background: rgba(255, 255, 255, 0.2);
	}

	/* User Menu */
	.user-menu-container {
		position: relative;
	}

	.user-menu-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: rgba(255, 255, 255, 0.1);
		color: white;
		padding: 0.5rem 1rem;
		border-radius: 6px;
		border: 1px solid rgba(255, 255, 255, 0.2);
		cursor: pointer;
		font-weight: 500;
		transition: background 0.2s;
		font-size: 1rem;
	}

	.user-menu-button:hover {
		background: rgba(255, 255, 255, 0.2);
	}

	.user-icon {
		width: 20px;
		height: 20px;
	}

	.chevron-icon {
		width: 16px;
		height: 16px;
	}

	.user-dropdown {
		position: absolute;
		right: 0;
		top: 100%;
		margin-top: 0.5rem;
		background: white;
		border-radius: 8px;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
		min-width: 200px;
		z-index: 50;
		overflow: hidden;
	}

	.dropdown-content {
		padding: 0.5rem 0;
	}

	.dropdown-link {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		color: #374151;
		text-decoration: none;
		transition: background 0.2s;
	}

	.dropdown-link:hover {
		background: #f3f4f6;
	}

	.dropdown-button {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		padding: 0.75rem 1rem;
		text-align: left;
		border: none;
		background: transparent;
		cursor: pointer;
		transition: background 0.2s;
		font-size: 1rem;
	}

	.logout-button {
		color: #dc2626;
	}

	.logout-button:hover {
		background: #fee2e2;
	}

	.dropdown-icon {
		width: 20px;
		height: 20px;
	}

	.dropdown-divider {
		margin: 0.5rem 0;
		border: none;
		border-top: 1px solid #e5e7eb;
	}

	/* Mobile Menu Button */
	.mobile-menu-button {
		display: none;
		color: white;
		background: transparent;
		border: none;
		cursor: pointer;
		padding: 0.5rem;
	}

	.menu-icon {
		width: 24px;
		height: 24px;
	}

	/* Mobile Menu */
	.mobile-menu {
		display: none;
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid rgba(255, 255, 255, 0.2);
	}

	.mobile-menu-links {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.mobile-nav-link {
		color: white;
		text-decoration: none;
		padding: 0.75rem 1rem;
		border-radius: 6px;
		font-weight: 500;
		transition: background 0.2s;
		background: transparent;
	}

	.mobile-nav-link.active {
		background: rgba(255, 255, 255, 0.2);
	}

	.mobile-divider {
		margin: 0.5rem 0;
		border: none;
		border-top: 1px solid rgba(255, 255, 255, 0.2);
	}

	.mobile-logout-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: white;
		text-align: left;
		padding: 0.75rem 1rem;
		border-radius: 6px;
		font-weight: 500;
		background: rgba(220, 38, 38, 0.2);
		border: 1px solid rgba(220, 38, 38, 0.3);
		cursor: pointer;
		width: 100%;
		font-size: 1rem;
	}

	.logout-icon {
		width: 20px;
		height: 20px;
	}

	/* Main Content */
	.main-content {
		max-width: 1280px;
		margin: 0 auto;
		padding: 2rem 1.5rem;
	}

	/* Responsive Styles */
	@media (min-width: 768px) {
		.desktop-nav {
			display: flex !important;
		}
		.mobile-menu-button {
			display: none !important;
		}
	}

	@media (max-width: 767px) {
		.mobile-menu-button {
			display: block !important;
		}
		.mobile-menu {
			display: block !important;
		}
	}
</style>