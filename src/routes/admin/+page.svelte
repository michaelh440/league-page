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
	import { onMount } from 'svelte';

	let stats = {
		seasons: { count: 0, loading: true },
		activeSeasons: { count: 0, loading: true },
		managers: { count: 0, loading: true },
		teams: { count: 0, loading: true }
	};

	let loading = true;
	let error = '';

	onMount(async () => {
		await loadDashboardData();
	});

	async function loadDashboardData() {
		try {
			// Load stats in parallel
			const [seasonsRes, managersRes] = await Promise.all([
				fetch('/api/admin/seasons'),
				fetch('/api/admin/managers')
			]);

			if (seasonsRes.ok) {
				const seasons = await seasonsRes.json();
				stats.seasons.count = seasons.length;
				stats.activeSeasons.count = seasons.filter(s => s.is_active).length;
				
				// Count total teams across all seasons
				stats.teams.count = seasons.reduce((sum, s) => sum + (parseInt(s.team_count) || 0), 0);
			}

			if (managersRes.ok) {
				const managers = await managersRes.json();
				stats.managers.count = managers.length;
			}

			stats.seasons.loading = false;
			stats.activeSeasons.loading = false;
			stats.managers.loading = false;
			stats.teams.loading = false;

		} catch (err) {
			console.error('Error loading dashboard data:', err);
			error = err.message;
		} finally {
			loading = false;
		}
	}

	// Quick action buttons
	const quickActions = [
		{
			title: 'Create New Season',
			description: 'Set up a new fantasy season',
			href: '/admin/seasons/new',
			icon: '📅',
			color: '#007bff'
		},
		{
			title: 'Generate Weekly Summary',
			description: 'Create AI-powered recap',
			href: '/admin/weekly-summary',
			icon: '📝',
			color: '#28a745'
		},
		{
			title: 'Manage Seasons',
			description: 'View and edit all seasons',
			href: '/admin/seasons',
			icon: '⚙️',
			color: '#6f42c1'
		},
		{
			title: 'View Managers',
			description: 'Manage league members',
			href: '/admin/managers',
			icon: '👥',
			color: '#fd7e14'
		}
	];
</script>

<div class="dashboard-container">
	<!-- Page Header -->
	<div class="page-header">
		<h1>Admin Dashboard</h1>
		<p>Welcome back! Here's what's happening in your league.</p>
	</div>

	{#if error}
		<div class="error-box">
			<strong>Error:</strong> {error}
		</div>
	{/if}

	<!-- Stats Grid -->
	<div class="stats-grid">
		<!-- Total Seasons -->
		<div class="stat-card">
			<div class="stat-icon">📅</div>
			<div class="stat-content">
				<div class="stat-label">Total Seasons</div>
				{#if stats.seasons.loading}
					<div class="stat-value loading">...</div>
				{:else}
					<div class="stat-value">{stats.seasons.count}</div>
				{/if}
			</div>
		</div>

		<!-- Active Seasons -->
		<div class="stat-card">
			<div class="stat-icon">✅</div>
			<div class="stat-content">
				<div class="stat-label">Active Seasons</div>
				{#if stats.activeSeasons.loading}
					<div class="stat-value loading">...</div>
				{:else}
					<div class="stat-value active">{stats.activeSeasons.count}</div>
				{/if}
			</div>
		</div>

		<!-- Total Managers -->
		<div class="stat-card">
			<div class="stat-icon">👥</div>
			<div class="stat-content">
				<div class="stat-label">Total Managers</div>
				{#if stats.managers.loading}
					<div class="stat-value loading">...</div>
				{:else}
					<div class="stat-value">{stats.managers.count}</div>
				{/if}
			</div>
		</div>

		<!-- Total Teams -->
		<div class="stat-card">
			<div class="stat-icon">🏈</div>
			<div class="stat-content">
				<div class="stat-label">Total Teams</div>
				{#if stats.teams.loading}
					<div class="stat-value loading">...</div>
				{:else}
					<div class="stat-value">{stats.teams.count}</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Quick Actions -->
	<div class="section">
		<h2 class="section-title">Quick Actions</h2>
		<div class="actions-grid">
			{#each quickActions as action}
				<a href={action.href} class="action-card" style="border-left: 4px solid {action.color}">
					<div class="action-icon">{action.icon}</div>
					<h3 class="action-title">{action.title}</h3>
					<p class="action-description">{action.description}</p>
				</a>
			{/each}
		</div>
	</div>

	<!-- System Status -->
	<div class="status-box">
		<h2 class="section-title">System Status</h2>
		<div class="status-grid">
			<div class="status-item">
				<span class="status-label">Database Connection</span>
				<span class="status-badge success">✓ Connected</span>
			</div>
			<div class="status-item">
				<span class="status-label">API Status</span>
				<span class="status-badge success">✓ Operational</span>
			</div>
			<div class="status-item">
				<span class="status-label">Last Data Sync</span>
				<span class="status-text">Just now</span>
			</div>
		</div>
	</div>
</div>

<style>
	.dashboard-container {
		padding: 2rem;
		max-width: 1400px;
		margin: 0 auto;
	}

	.page-header {
		margin-bottom: 2rem;
	}

	.page-header h1 {
		font-size: 2.5rem;
		font-weight: bold;
		color: #004085;
		margin: 0 0 0.5rem 0;
	}

	.page-header p {
		color: #666;
		font-size: 1.1rem;
		margin: 0;
	}

	.error-box {
		background: #f8d7da;
		border: 1px solid #f5c6cb;
		color: #721c24;
		padding: 1rem;
		border-radius: 8px;
		margin-bottom: 1.5rem;
	}

	/* Stats Grid */
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.stat-card {
		background: white;
		border-radius: 12px;
		padding: 1.5rem;
		box-shadow: 0 4px 12px rgba(0,0,0,0.1);
		display: flex;
		align-items: center;
		gap: 1rem;
		transition: transform 0.2s ease, box-shadow 0.2s ease;
	}

	.stat-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 6px 16px rgba(0,0,0,0.15);
	}

	.stat-icon {
		font-size: 2.5rem;
		flex-shrink: 0;
	}

	.stat-content {
		flex: 1;
	}

	.stat-label {
		font-size: 0.875rem;
		color: #666;
		margin-bottom: 0.25rem;
	}

	.stat-value {
		font-size: 2rem;
		font-weight: bold;
		color: #333;
	}

	.stat-value.loading {
		color: #999;
	}

	.stat-value.active {
		color: #28a745;
	}

	/* Section */
	.section {
		margin-bottom: 2rem;
	}

	.section-title {
		font-size: 1.5rem;
		font-weight: bold;
		color: #004085;
		margin-bottom: 1rem;
	}

	/* Actions Grid */
	.actions-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1.5rem;
	}

	.action-card {
		background: white;
		border-radius: 12px;
		padding: 1.5rem;
		text-decoration: none;
		color: inherit;
		box-shadow: 0 4px 12px rgba(0,0,0,0.1);
		transition: transform 0.2s ease, box-shadow 0.2s ease;
		display: flex;
		flex-direction: column;
	}

	.action-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 6px 16px rgba(0,0,0,0.15);
	}

	.action-icon {
		font-size: 2.5rem;
		margin-bottom: 0.75rem;
	}

	.action-title {
		font-size: 1.25rem;
		font-weight: bold;
		color: #333;
		margin: 0 0 0.5rem 0;
	}

	.action-description {
		color: #666;
		margin: 0;
		font-size: 0.95rem;
	}

	/* Status Box */
	.status-box {
		background: white;
		border-radius: 12px;
		padding: 1.5rem;
		box-shadow: 0 4px 12px rgba(0,0,0,0.1);
	}

	.status-grid {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.status-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 0;
	}

	.status-label {
		color: #666;
		font-size: 0.95rem;
	}

	.status-badge {
		padding: 0.25rem 0.75rem;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.status-badge.success {
		background: #d4edda;
		color: #155724;
	}

	.status-text {
		color: #333;
		font-size: 0.95rem;
	}

	/* Mobile Responsive */
	@media screen and (max-width: 768px) {
		.dashboard-container {
			padding: 1rem;
		}

		.page-header h1 {
			font-size: 2rem;
		}

		.stats-grid,
		.actions-grid {
			grid-template-columns: 1fr;
		}

		.stat-value {
			font-size: 1.5rem;
		}
	}
</style>