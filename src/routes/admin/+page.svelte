<!-- src/routes/admin/+page.svelte -->
<!--script>
  const adminTools = [
    {
      title: 'Fix Data Issues',
      description: 'Review and confirm Yahoo points staging data',
      link: '/admin/confirm_yahoo_points_staging',
      icon: '🔧',
      color: 'linear-gradient(135deg, #dc2626, #991b1b)'
    },
    {
      title: 'Generate Summaries',
      description: 'Create AI-powered weekly recaps and videos',
      link: '/admin/weekly_summary',
      icon: '📊',
      color: 'linear-gradient(135deg, #2563eb, #1d4ed8)'
    }
  ];
</script>

<h2 class="page-title">⚙️ Admin Dashboard</h2>

<p class="subtitle">Manage league data and content</p>

<div class="admin-grid">
  {#each adminTools as tool}
    <a class="admin-card" href={tool.link} style="background: {tool.color}">
      <div class="card-icon">{tool.icon}</div>
      <div class="card-header">{tool.title}</div>
      <div class="card-body">
        <p>{tool.description}</p>
      </div>
      <div class="card-footer">
        <span class="arrow">→</span>
      </div>
    </a>
  {/each}
</div>

<style>
  .page-title {
    text-align: center;
    margin: 2rem 0 0.5rem;
    font-size: 2rem;
    font-weight: bold;
    color: #004085;
  }

  .subtitle {
    text-align: center;
    margin: 0 0 2rem;
    font-size: 1.1rem;
    color: #666;
  }

  .admin-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 2rem;
    padding: 0 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .admin-card {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    text-decoration: none;
    border-radius: 12px;
    overflow: hidden;
    color: white;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    min-height: 220px;
    position: relative;
  }

  .admin-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 6px 16px rgba(0,0,0,0.2);
  }

  .card-icon {
    text-align: center;
    padding: 1.5rem 1rem 0.5rem;
    font-size: 3rem;
  }

  .card-header {
    text-align: center;
    padding: 0 1rem 0.5rem;
    font-size: 1.5rem;
    font-weight: bold;
    letter-spacing: 0.5px;
  }

  .card-body {
    text-align: center;
    padding: 0 1.5rem 1rem;
    font-size: 1rem;
    flex-grow: 1;
  }

  .card-body p {
    margin: 0;
    color: #e0e0e0;
    line-height: 1.4;
  }

  .card-footer {
    text-align: center;
    padding: 1rem;
    background: rgba(0,0,0,0.15);
    font-size: 1.5rem;
    font-weight: bold;
  }

  .arrow {
    display: inline-block;
    transition: transform 0.2s ease;
  }

  .admin-card:hover .arrow {
    transform: translateX(4px);
  }

  /* Mobile styles */
  @media screen and (max-width: 768px) {
    .page-title {
      color: white !important;
      font-size: 1.75rem;
    }

    .subtitle {
      color: #e0e0e0 !important;
    }

    .admin-grid {
      grid-template-columns: 1fr;
      padding: 0 1rem;
      gap: 1.5rem;
    }

    .card-icon {
      font-size: 2.5rem;
    }

    .card-header {
      font-size: 1.3rem;
    }
  }

  /* Very small screens */
  @media screen and (max-width: 480px) {
    .page-title {
      color: white !important;
      font-size: 1.5rem;
    }

    .subtitle {
      color: #e0e0e0 !important;
      font-size: 1rem;
    }
  }
</style-->

<script>
	import { page } from '$app/stores';
	
	// Current route for active link highlighting
	$: currentPath = $page.url.pathname;
	
	// Navigation items
	const navItems = [
		{ href: '/admin', label: 'Dashboard', icon: '📊' },
		{ href: '/admin/seasons', label: 'Seasons', icon: '📅' },
		{ href: '/admin/weekly-summary', label: 'Weekly Summary', icon: '📝' },
		{ href: '/admin/managers', label: 'Managers', icon: '👥' },
		{ href: '/admin/settings', label: 'Settings', icon: '⚙️' }
	];
	
	function isActive(path) {
		if (path === '/admin') {
			return currentPath === '/admin';
		}
		return currentPath.startsWith(path);
	}
</script>

<div class="admin-wrapper">
	<!-- Top Navigation Bar -->
	<nav class="top-nav">
		<div class="nav-container">
			<div class="nav-content">
				<!-- Left: Logo and Nav -->
				<div class="nav-left">
					<!-- Logo -->
					<div class="logo-section">
						<a href="/" class="logo-link">
							⚡ Fantasy League
						</a>
						<span class="admin-badge">ADMIN</span>
					</div>
					
					<!-- Desktop Navigation -->
					<div class="desktop-nav">
						{#each navItems as item}
							<a
								href={item.href}
								class="nav-link {isActive(item.href) ? 'active' : ''}"
							>
								<span class="nav-icon">{item.icon}</span>
								{item.label}
							</a>
						{/each}
					</div>
				</div>
				
				<!-- Right: User Menu -->
				<div class="nav-right">
					<a href="/" class="back-link">
						← Back to Site
					</a>
					
					<!-- Future: User dropdown -->
					<div class="user-avatar">
						A
					</div>
				</div>
			</div>
		</div>
		
		<!-- Mobile Navigation -->
		<div class="mobile-nav">
			{#each navItems as item}
				<a
					href={item.href}
					class="mobile-nav-link {isActive(item.href) ? 'active' : ''}"
				>
					<span class="nav-icon">{item.icon}</span>
					{item.label}
				</a>
			{/each}
		</div>
	</nav>
	
	<!-- Main Content Area -->
	<main class="main-content">
		<slot />
	</main>
	
	<!-- Footer -->
	<footer class="footer">
		<div class="footer-container">
			<div class="footer-content">
				<div>
					<p>Fantasy Football League Admin Panel</p>
				</div>
				<div>
					<p>© {new Date().getFullYear()} All rights reserved</p>
				</div>
			</div>
		</div>
	</footer>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
	}

	.admin-wrapper {
		min-height: 100vh;
		background: #f5f5f5;
		display: flex;
		flex-direction: column;
	}

	/* Top Navigation */
	.top-nav {
		background: white;
		border-bottom: 2px solid #e0e0e0;
		position: sticky;
		top: 0;
		z-index: 100;
	}

	.nav-container {
		max-width: 1400px;
		margin: 0 auto;
		padding: 0 1.5rem;
	}

	.nav-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		height: 64px;
	}

	.nav-left {
		display: flex;
		align-items: center;
		gap: 2rem;
	}

	.logo-section {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.logo-link {
		font-size: 1.25rem;
		font-weight: bold;
		color: #333;
		text-decoration: none;
	}

	.admin-badge {
		padding: 0.25rem 0.5rem;
		background: #dc3545;
		color: white;
		font-size: 0.75rem;
		font-weight: 600;
		border-radius: 4px;
	}

	.desktop-nav {
		display: flex;
		gap: 0.5rem;
	}

	.nav-link {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		text-decoration: none;
		color: #666;
		font-size: 0.95rem;
		font-weight: 500;
		border-radius: 8px;
		transition: all 0.2s ease;
	}

	.nav-link:hover {
		background: #f5f5f5;
		color: #333;
	}

	.nav-link.active {
		background: #e3f2fd;
		color: #007bff;
	}

	.nav-icon {
		font-size: 1.1rem;
	}

	.nav-right {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.back-link {
		color: #666;
		text-decoration: none;
		font-size: 0.95rem;
	}

	.back-link:hover {
		color: #333;
	}

	.user-avatar {
		width: 36px;
		height: 36px;
		background: #007bff;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-weight: 600;
	}

	/* Mobile Navigation */
	.mobile-nav {
		display: none;
		border-top: 1px solid #e0e0e0;
		padding: 0.5rem;
	}

	.mobile-nav-link {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		text-decoration: none;
		color: #666;
		font-size: 0.95rem;
		font-weight: 500;
		border-radius: 8px;
		transition: all 0.2s ease;
	}

	.mobile-nav-link:hover {
		background: #f5f5f5;
		color: #333;
	}

	.mobile-nav-link.active {
		background: #e3f2fd;
		color: #007bff;
	}

	/* Main Content */
	.main-content {
		flex: 1;
		max-width: 1400px;
		width: 100%;
		margin: 0 auto;
		padding: 2rem 1.5rem;
	}

	/* Footer */
	.footer {
		background: white;
		border-top: 2px solid #e0e0e0;
		margin-top: 3rem;
	}

	.footer-container {
		max-width: 1400px;
		margin: 0 auto;
		padding: 1.5rem;
	}

	.footer-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		color: #666;
		font-size: 0.875rem;
	}

	.footer-content p {
		margin: 0;
	}

	/* Mobile Responsive */
	@media screen and (max-width: 768px) {
		.desktop-nav {
			display: none;
		}

		.mobile-nav {
			display: flex;
			flex-direction: column;
			gap: 0.25rem;
		}

		.main-content {
			padding: 1rem;
		}

		.footer-content {
			flex-direction: column;
			gap: 0.5rem;
			text-align: center;
		}

		.logo-link {
			font-size: 1rem;
		}

		.back-link {
			display: none;
		}
	}
</style>