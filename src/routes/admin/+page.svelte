<script>
	import { onMount } from 'svelte';

	let stats = {
		seasons: { total: 0, active: 0, loading: true },
		leagues: { total: 0, active: 0, loading: true },
		managers: { total: 0, loading: true },
		teams: { total: 0, loading: true },
		users: { total: 0, loading: true }
	};

	let systemStatus = {
		database: { status: 'checking', message: 'Checking...' },
		lastSync: 'Checking...'
	};

	onMount(async () => {
		await Promise.all([
			loadStats(),
			checkSystemStatus()
		]);
	});

	async function loadStats() {
		try {
			// Load all stats
			const [seasonsRes, activeSeasonsRes, managersRes, teamsRes, usersRes] = await Promise.all([
				fetch('/api/admin/stats/seasons'),
				fetch('/api/admin/stats/active_seasons'),
				fetch('/api/admin/stats/managers'),
				fetch('/api/admin/stats/teams'),
				fetch('/api/admin/stats/users')
			]);

			if (seasonsRes.ok) {
				const data = await seasonsRes.json();
				stats.seasons.total = data.count;
			}

			if (activeSeasonsRes.ok) {
				const data = await activeSeasonsRes.json();
				stats.seasons.active = data.count;
			}

			if (managersRes.ok) {
				const data = await managersRes.json();
				stats.managers.total = data.count;
			}

			if (teamsRes.ok) {
				const data = await teamsRes.json();
				stats.teams.total = data.count;
			}

			if (usersRes.ok) {
				const data = await usersRes.json();
				stats.users.total = data.count;
			}

			stats.seasons.loading = false;
			stats.managers.loading = false;
			stats.teams.loading = false;
			stats.users.loading = false;
		} catch (err) {
			console.error('Stats error:', err);
		}
	}

	async function checkSystemStatus() {
		try {
			// Simple check - if we can fetch users, database is connected
			const response = await fetch('/api/admin/users');
			if (response.ok) {
				systemStatus.database = { status: 'connected', message: 'Connected' };
			} else {
				systemStatus.database = { status: 'error', message: 'Error' };
			}
			systemStatus.lastSync = 'Just now';
		} catch (err) {
			systemStatus.database = { status: 'error', message: 'Disconnected' };
			systemStatus.lastSync = 'Failed';
		}
	}
</script>

<svelte:head>
	<title>Admin Dashboard - Fantasy Football</title>
</svelte:head>

<div class="dashboard-container">
	<!-- Page Header -->
	<div class="page-header">
		<div>
			<h1>Admin Dashboard</h1>
			<p>Welcome back! Here's what's happening in your league.</p>
		</div>
	</div>
	<!--First Row-->
	<!-- Dashboard Grid -->
	<div class="dashboard-grid">
		<!-- Seasons Card -->
		<div class="card card-blue">
			<div class="card-header">
				<span class="card-label">Total Seasons</span>
				<span class="card-label">Active Seasons</span>
			</div>
			<div class="card-stats">
				<span class="card-number">{stats.seasons.total}</span>
				<span class="card-number accent">{stats.seasons.active}</span>
			</div>
			<div class="card-actions">
				<a href="/admin/seasons" class="disabled">Manage Seasons</a>
				<a href="/admin/seasons/new" class="disabled">Create New Season</a>
			</div>
		</div>

		<!-- Video Management Car -->
		<div class="card card-green">
			<div class="card-header">
				<span class="card-label">Total Videos</span>
			</div>
			<div class="card-stats">
				<span class="card-number">0</span>
			</div>
			<div class="card-actions">
				<a href="/admin/videos">Add New Video</a>
				<a href="/admin/videos/test">Test Video Connection</a>
			</div>
		</div>

		<!-- Sleeper Integration Card -->
		<div class="card card-purple">
			<div class="card-title">Sleeper Integration</div>
			<div class="card-actions">
				<a href="/admin/videos/test" class="disabled">Sleeper Archive Status</a>
				<a href="/admin/archive">Archive Stats</a>
			</div>
		</div>

		<!-- API List Card -->
		<div class="card card-orange">
			<div class="card-title">API Endpoints</div>
			<div class="card-actions">
				<a href="/admin/api_list">API List</a>
			</div>
		</div>

		<!-- System Status Card -->
		<div class="card card-gray">
			<div class="card-title">System Status</div>
			<div class="status-grid">
				<div class="status-row">
					<span>Database Connection</span>
					<span class="status-badge status-{systemStatus.database.status}">
						✓ {systemStatus.database.message}
					</span>
				</div>
				<div class="status-row">
					<span>API Status</span>
					<span class="status-badge status-connected">✓ Operational</span>
				</div>
				<div class="status-row">
					<span>Last Data Sync</span>
					<span>{systemStatus.lastSync}</span>
				</div>
			</div>
		</div>


		<!-- Second Row -->
		<!-- Leagues Card -->
		<div class="card card-blue">
			<div class="card-header">
				<span class="card-label">Total Leagues</span>
				<span class="card-label">Active Leagues</span>
			</div>
			<div class="card-stats">
				<span class="card-number">4</span>
				<span class="card-number accent">1</span>
			</div>
			<div class="card-actions">
				<a href="/admin/leagues" class="disabled">Manage Leagues</a>
				<a href="/admin/leagues/new" class="disabled">Add New League</a>
			</div>
		</div>

		<!-- Weekly Summary Card -->
		<div class="card card-green">
			<div class="card-header">
				<span class="card-label">Total Weekly Summaries</span>
			</div>
			<div class="card-stats">
				<span class="card-number">0</span>
			</div>
			<div class="card-actions">
				<a href="/admin/weekly_summary">Generate Weekly Summary</a>
			</div>
		</div>
		
		<!-- Yahoo Stats Card-->
		<div class="card card-purple">
			<div class="card-title">Yahoo Stats</div>
			<div class="card-actions">
				<a href="/admin/confirm_yahoo_points_staging">Confirm Yahoo Positions</a>
			</div>
		</div>

		<!-- Blank Placeholder Card (completely empty) for alignment -->
		<div class="card card-placeholder">
			<!-- Intentionally blank -->
		</div>

		<!-- Blank Placeholder Card (completely empty) for alignment -->
		<div class="card card-placeholder">
			<!-- Intentionally blank -->
		</div>

		<!-- Third Row-->
		<!-- Managers Card -->
		<div class="card card-blue">
			<div class="card-header">
				<span class="card-label">Total Managers</span>
			</div>
			<div class="card-stats">
				<span class="card-number">{stats.managers.total}</span>
			</div>
			<div class="card-actions">
				<a href="/admin/managers" class="disabled">View Managers</a>
				<a href="/admin/managers/new" class="disabled">Add New Managers</a>
			</div>
		</div>

		<!-- Blank Placeholder Card (completely empty) for alignment -->
		<div class="card card-placeholder">
			<!-- Intentionally blank -->
		</div>
		
		<!-- Managers Card -->
		<div class="card card-purple">
			<div class="card-header">
				<span class="card-label">SQL Pages</span>
			</div>
			<div class="card-actions">
				<a href="/admin/sql" class="disabled">SQL Insertion</a>
			</div>
		</div>
		
		<!-- Blank Placeholder Card (completely empty) for alignment -->
		<div class="card card-placeholder">
			<!-- Intentionally blank -->
		</div>

		<!-- Blank Placeholder Card (completely empty) for alignment -->
		<div class="card card-placeholder">
			<!-- Intentionally blank -->
		</div>

		<!-- Fourth Row-->
		<!-- Teams Card -->
		<div class="card card-blue">
			<div class="card-header">
				<span class="card-label">Total Teams</span>
			</div>
			<div class="card-stats">
				<span class="card-number">{stats.teams.total}</span>
			</div>
			<div class="card-actions">
				<a href="/admin/teams" class="disabled">View Teams</a>
				<a href="/admin/teams/new" class="disabled">Add New Teams</a>
			</div>
		</div>
	</div>
</div>

<style>
	.dashboard-container {
		padding: 32px;
		max-width: 1600px;
		margin: 0 auto;
	}

	.page-header {
		margin-bottom: 32px;
	}

	.page-header h1 {
		font-size: 32px;
		font-weight: 700;
		color: #1e40af;
		margin: 0 0 8px 0;
	}

	.page-header p {
		color: #6b7280;
		font-size: 16px;
		margin: 0;
	}

	.dashboard-grid {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 24px;
	}

	.card {
		background: white;
		border-radius: 8px;
		padding: 24px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		border-left: 4px solid;
		transition: transform 0.2s, box-shadow 0.2s;
	}

	.card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.card-blue {
		border-left-color: #3b82f6;
	}

	.card-green {
		border-left-color: #10b981;
	}

	.card-orange {
		border-left-color: #f97316;
	}

	.card-gray {
		border-left-color: #6b7280;
	}

	.card-placeholder {
		background: transparent;
		border: none;
		box-shadow: none;
		min-height: 200px;
		border-left: none;
	}

	.card-placeholder:hover {
		transform: none;
		box-shadow: none;
		border-color: #d1d5db;
	}

	.card-empty {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		min-height: 200px;
	}

	.card-title {
		font-size: 18px;
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 16px;
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		margin-bottom: 12px;
	}

	.card-label {
		font-size: 13px;
		color: #6b7280;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.card-stats {
		display: flex;
		justify-content: space-between;
		margin-bottom: 20px;
	}

	.card-number {
		font-size: 36px;
		font-weight: 700;
		color: #1f2937;
	}

	.card-number.accent {
		color: #10b981;
	}

	.card-actions {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding-top: 16px;
		border-top: 1px solid #e5e7eb;
	}

	.card-actions a {
		color: #3b82f6;
		text-decoration: none;
		font-size: 14px;
		font-weight: 500;
		transition: color 0.2s;
	}

	.card-actions a:hover {
		color: #2563eb;
		text-decoration: underline;
	}

	.status-grid {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.status-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 14px;
	}

	.status-row span:first-child {
		color: #6b7280;
	}

	.status-badge {
		padding: 4px 12px;
		border-radius: 12px;
		font-size: 12px;
		font-weight: 600;
	}

	.status-badge.status-connected {
		background: #d1fae5;
		color: #065f46;
	}

	.status-badge.status-checking {
		background: #fef3c7;
		color: #92400e;
	}

	.status-badge.status-error {
		background: #fee2e2;
		color: #991b1b;
	}

	.empty-message {
		color: #9ca3af;
		font-size: 14px;
		text-align: center;
		margin: 0;
	}

	@media (max-width: 1400px) {
		.dashboard-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	@media (max-width: 900px) {
		.dashboard-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (max-width: 768px) {
		.dashboard-container {
			padding: 16px;
		}

		.dashboard-grid {
			grid-template-columns: 1fr;
			gap: 16px;
		}

		.card {
			padding: 20px;
		}

		.page-header h1 {
			font-size: 24px;
		}

		.card-number {
			font-size: 28px;
		}
	}
</style>