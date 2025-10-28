<script>
	import { page } from '$app/stores';
	
	$: currentPath = $page.url.pathname;
	
	const navItems = [
		{ href: '/admin', label: 'Dashboard', icon: '📊' },
		{ href: '/admin/seasons', label: 'Seasons', icon: '📅' },
		{ href: '/admin/weekly-summary', label: 'Weekly Summary', icon: '📝' },
		{ href: '/admin/managers', label: 'Managers', icon: '👥' },
	];
	
	function isActive(path) {
		if (path === '/admin') return currentPath === '/admin';
		return currentPath.startsWith(path);
	}
</script>

<!-- Admin Navigation -->
<div class="admin-nav">
	<div class="nav-container">
		<a href="/" class="logo">⚡ Fantasy League <span class="badge">ADMIN</span></a>
		
		<div class="nav-links">
			{#each navItems as item}
				<a href={item.href} class="nav-link {isActive(item.href) ? 'active' : ''}">
					{item.icon} {item.label}
				</a>
			{/each}
		</div>
		
		<a href="/" class="back-link">← Back to Site</a>
	</div>
</div>

<!-- Content -->
<div class="admin-content">
	<slot />
</div>

<style>
	:global(body) {
		margin: 0;
		background: #f5f5f5;
	}

	.admin-nav {
		background: white;
		border-bottom: 2px solid #ddd;
		padding: 1rem 0;
		position: sticky;
		top: 0;
		z-index: 100;
	}

	.nav-container {
		max-width: 1400px;
		margin: 0 auto;
		padding: 0 2rem;
		display: flex;
		align-items: center;
		gap: 2rem;
	}

	.logo {
		font-size: 1.25rem;
		font-weight: bold;
		color: #333;
		text-decoration: none;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.badge {
		background: #dc3545;
		color: white;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.75rem;
	}

	.nav-links {
		display: flex;
		gap: 0.5rem;
		flex: 1;
	}

	.nav-link {
		padding: 0.5rem 1rem;
		text-decoration: none;
		color: #666;
		border-radius: 6px;
		transition: all 0.2s;
	}

	.nav-link:hover {
		background: #f5f5f5;
		color: #333;
	}

	.nav-link.active {
		background: #007bff;
		color: white;
	}

	.back-link {
		color: #666;
		text-decoration: none;
	}

	.admin-content {
		max-width: 1400px;
		margin: 0 auto;
		padding: 2rem;
	}

	@media (max-width: 768px) {
		.nav-links {
			display: none;
		}
	}
</style>