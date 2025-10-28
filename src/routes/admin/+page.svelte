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
			color: 'blue'
		},
		{
			title: 'Generate Weekly Summary',
			description: 'Create AI-powered recap',
			href: '/admin/weekly-summary',
			icon: '📝',
			color: 'green'
		},
		{
			title: 'Manage Seasons',
			description: 'View and edit all seasons',
			href: '/admin/seasons',
			icon: '⚙️',
			color: 'purple'
		},
		{
			title: 'View Managers',
			description: 'Manage league members',
			href: '/admin/managers',
			icon: '👥',
			color: 'orange'
		}
	];
</script>

<div class="space-y-6">
	<!-- Page Header -->
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
		<p class="mt-2 text-gray-600">Welcome back! Here's what's happening in your league.</p>
	</div>

	{#if error}
		<div class="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
			<strong class="font-semibold">Error:</strong> {error}
		</div>
	{/if}

	<!-- Stats Grid -->
	<div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
		<!-- Total Seasons -->
		<div class="bg-white overflow-hidden shadow rounded-lg">
			<div class="p-5">
				<div class="flex items-center">
					<div class="flex-shrink-0">
						<div class="text-3xl">📅</div>
					</div>
					<div class="ml-5 w-0 flex-1">
						<dl>
							<dt class="text-sm font-medium text-gray-500 truncate">
								Total Seasons
							</dt>
							<dd class="flex items-baseline">
								{#if stats.seasons.loading}
									<div class="text-2xl font-semibold text-gray-400">...</div>
								{:else}
									<div class="text-2xl font-semibold text-gray-900">
										{stats.seasons.count}
									</div>
								{/if}
							</dd>
						</dl>
					</div>
				</div>
			</div>
		</div>

		<!-- Active Seasons -->
		<div class="bg-white overflow-hidden shadow rounded-lg">
			<div class="p-5">
				<div class="flex items-center">
					<div class="flex-shrink-0">
						<div class="text-3xl">✅</div>
					</div>
					<div class="ml-5 w-0 flex-1">
						<dl>
							<dt class="text-sm font-medium text-gray-500 truncate">
								Active Seasons
							</dt>
							<dd class="flex items-baseline">
								{#if stats.activeSeasons.loading}
									<div class="text-2xl font-semibold text-gray-400">...</div>
								{:else}
									<div class="text-2xl font-semibold text-green-600">
										{stats.activeSeasons.count}
									</div>
								{/if}
							</dd>
						</dl>
					</div>
				</div>
			</div>
		</div>

		<!-- Total Managers -->
		<div class="bg-white overflow-hidden shadow rounded-lg">
			<div class="p-5">
				<div class="flex items-center">
					<div class="flex-shrink-0">
						<div class="text-3xl">👥</div>
					</div>
					<div class="ml-5 w-0 flex-1">
						<dl>
							<dt class="text-sm font-medium text-gray-500 truncate">
								Total Managers
							</dt>
							<dd class="flex items-baseline">
								{#if stats.managers.loading}
									<div class="text-2xl font-semibold text-gray-400">...</div>
								{:else}
									<div class="text-2xl font-semibold text-gray-900">
										{stats.managers.count}
									</div>
								{/if}
							</dd>
						</dl>
					</div>
				</div>
			</div>
		</div>

		<!-- Total Teams -->
		<div class="bg-white overflow-hidden shadow rounded-lg">
			<div class="p-5">
				<div class="flex items-center">
					<div class="flex-shrink-0">
						<div class="text-3xl">🏈</div>
					</div>
					<div class="ml-5 w-0 flex-1">
						<dl>
							<dt class="text-sm font-medium text-gray-500 truncate">
								Total Teams
							</dt>
							<dd class="flex items-baseline">
								{#if stats.teams.loading}
									<div class="text-2xl font-semibold text-gray-400">...</div>
								{:else}
									<div class="text-2xl font-semibold text-gray-900">
										{stats.teams.count}
									</div>
								{/if}
							</dd>
						</dl>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Quick Actions -->
	<div class="mt-8">
		<h2 class="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
			{#each quickActions as action}
				<a
					href={action.href}
					class="block p-6 rounded-lg border-2 border-gray-200 hover:border-gray-300 hover:shadow-md transition-all bg-white"
				>
					<div class="text-3xl mb-3">{action.icon}</div>
					<h3 class="text-lg font-semibold mb-1 text-gray-900">{action.title}</h3>
					<p class="text-sm text-gray-600">{action.description}</p>
				</a>
			{/each}
		</div>
	</div>

	<!-- System Status -->
	<div class="bg-white shadow rounded-lg p-6 mt-8">
		<h2 class="text-lg font-semibold text-gray-900 mb-4">System Status</h2>
		<div class="space-y-3">
			<div class="flex items-center justify-between">
				<span class="text-sm text-gray-600">Database Connection</span>
				<span class="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
					✓ Connected
				</span>
			</div>
			<div class="flex items-center justify-between">
				<span class="text-sm text-gray-600">API Status</span>
				<span class="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
					✓ Operational
				</span>
			</div>
			<div class="flex items-center justify-between">
				<span class="text-sm text-gray-600">Last Data Sync</span>
				<span class="text-sm text-gray-900">Just now</span>
			</div>
		</div>
	</div>
</div>