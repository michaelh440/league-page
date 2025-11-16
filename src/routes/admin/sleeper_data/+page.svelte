<script>
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	export let data;
	export let form;

	let selectedSeason = '';
	let selectedWeek = 1;
	let archiveType = 'regular';
	let isArchiving = false;
	let dataStatus = null;
	let loadingStatus = false;

	$: selectedSeasonData = selectedSeason
		? data.seasons.find(s => s.season_id === parseInt(selectedSeason))
		: null;

	// Load data status when season is selected
	$: if (selectedSeasonData && selectedSeasonData.sleeper_league_id) {
		loadDataStatus(selectedSeasonData.season_id, selectedSeasonData.season_year);
	}

	// Auto-detect archive type based on selected week
	$: archiveType = selectedWeek >= 15 ? 'playoff' : 'regular';

	async function loadDataStatus(seasonId, seasonYear) {
		loadingStatus = true;
		try {
			const response = await fetch(`/api/sleeper-status?season_id=${seasonId}&season_year=${seasonYear}`);
			if (response.ok) {
				dataStatus = await response.json();
			}
		} catch (error) {
			console.error('Error loading data status:', error);
		}
		loadingStatus = false;
	}

	async function archiveWeek() {
		if (isArchiving) return;
		
		isArchiving = true;
		const endpoint = archiveType === 'regular' ? '/api/archive_rosters_stats' : '/api/archive_playoff';
		
		try {
			const response = await fetch(
				`${endpoint}?league_id=${selectedSeasonData.sleeper_league_id}&season=${selectedSeasonData.season_year}&week=${selectedWeek}`
			);
			const result = await response.json();
			
			if (result.success) {
				form = { 
					success: true, 
					message: `Week ${selectedWeek} archived: ${result.staged.teams || result.staged.rosters} teams, ${result.staged.stats} stats staged. ${result.processed.playerRecords || result.processed.rosters} player records processed.`
				};
				await loadDataStatus(selectedSeasonData.season_id, selectedSeasonData.season_year);
			} else {
				form = { success: false, error: result.error };
			}
		} catch (error) {
			form = { success: false, error: error.message };
		}
		
		isArchiving = false;
	}

	function formatDate(dateString) {
		if (!dateString) return 'Never';
		return new Date(dateString).toLocaleString();
	}

	function getStatusColor(staging, production) {
		if (production > 0) return 'green';
		if (staging > 0) return 'yellow';
		return 'gray';
	}

	function getStatusText(staging, production) {
		if (production > 0 && staging === 0) return 'Processed';
		if (production > 0 && staging > 0) return 'Partial';
		if (staging > 0 && production === 0) return 'Staged';
		return 'Missing';
	}
</script>

<div class="container">
	<div class="header">
		<h1>🏈 Sleeper Data Integration</h1>
		<p class="subtitle">Archive fantasy football data from Sleeper API to database</p>
	</div>

	{#if form?.success}
		<div class="alert alert-success">
			✅ {form.message}
		</div>
	{/if}

	{#if form?.error}
		<div class="alert alert-error">
			❌ Error: {form.error}
		</div>
	{/if}

	<!-- Stats Dashboard -->
	<div class="stats-grid">
		<div class="stat-card">
			<div class="stat-icon">🏆</div>
			<div class="stat-value">{data.stats.total_seasons}</div>
			<div class="stat-label">Total Seasons</div>
		</div>
		<div class="stat-card">
			<div class="stat-icon">📊</div>
			<div class="stat-value">{data.stats.total_rosters}</div>
			<div class="stat-label">Roster Records</div>
		</div>
		<div class="stat-card">
			<div class="stat-icon">📈</div>
			<div class="stat-value">{data.stats.total_stats}</div>
			<div class="stat-label">Player Stats</div>
		</div>
		<div class="stat-card">
			<div class="stat-icon">🔄</div>
			<div class="stat-value">{formatDate(data.stats.last_update)}</div>
			<div class="stat-label">Last Update</div>
		</div>
	</div>

	<!-- Season Selection -->
	<div class="sync-section">
		<h2>Select Season to Archive</h2>

		<div class="form-group">
			<label for="season-select">Choose a Season:</label>
			<select id="season-select" bind:value={selectedSeason}>
				<option value="">-- Select a Season --</option>
				{#each data.seasons as season}
					<option value={season.season_id}>
						{season.league_name} - {season.season_year}
						{#if season.platform === 'sleeper'}⭐ Sleeper{/if}
					</option>
				{/each}
			</select>
		</div>

		{#if selectedSeasonData}
			<div class="season-info">
				<h3>📊 Selected Season Info</h3>
				<div class="info-grid">
					<div class="info-item">
						<span class="label">League:</span>
						<span class="value">{selectedSeasonData.league_name}</span>
					</div>
					<div class="info-item">
						<span class="label">Year:</span>
						<span class="value">{selectedSeasonData.season_year}</span>
					</div>
					<div class="info-item">
						<span class="label">Platform:</span>
						<span class="value badge badge-blue">{selectedSeasonData.platform || 'Yahoo'}</span>
					</div>
					<div class="info-item">
						<span class="label">Sleeper League ID:</span>
						<span class="value">{selectedSeasonData.sleeper_league_id || 'N/A'}</span>
					</div>
				</div>
			</div>

			{#if selectedSeasonData.platform !== 'sleeper'}
				<div class="alert alert-warning">
					⚠️ This is a {selectedSeasonData.platform || 'Yahoo'} season. This page is for Sleeper data only.
				</div>
			{:else if !selectedSeasonData.sleeper_league_id}
				<div class="alert alert-warning">
					⚠️ This season doesn't have a Sleeper League ID set.
				</div>
			{:else}
				<!-- Data Status Dashboard -->
				<div class="status-dashboard">
					<h3>📋 Data Status Dashboard</h3>
					{#if loadingStatus}
						<p class="loading">Loading data status...</p>
					{:else if dataStatus}
						<!-- Weekly Data Grid -->
						<div class="status-section">
							<h4>Weekly Data Status</h4>
							<div class="weekly-grid">
								<!-- Header Row -->
								<div class="grid-header">Week</div>
								<div class="grid-header">Rosters</div>
								<div class="grid-header">Stats</div>
								<div class="grid-header">Type</div>
								<div class="grid-header">Status</div>

								<!-- Data Rows -->
								{#each Array(18) as _, i}
									{@const week = i + 1}
									{@const isPlayoff = week >= 15}
									{@const rosters = isPlayoff 
										? (dataStatus.playoffRosters?.[week] || 0)
										: (dataStatus.weeklyRosters?.[week] || 0)}
									{@const stats = isPlayoff
										? (dataStatus.playoffStats?.[week] || 0)
										: (dataStatus.playerStats?.[week] || 0)}
									{@const hasData = rosters > 0 || stats > 0}
									
									<div class="grid-cell week-cell">W{week}</div>
									<div class="grid-cell">{rosters > 0 ? rosters : '-'}</div>
									<div class="grid-cell">{stats > 0 ? stats : '-'}</div>
									<div class="grid-cell">
										<span class="badge badge-{isPlayoff ? 'purple' : 'blue'}">
											{isPlayoff ? 'Playoff' : 'Regular'}
										</span>
									</div>
									<div class="grid-cell">
										<span class="status-badge status-{hasData ? 'green' : 'gray'}">
											{hasData ? '✓' : '✗'}
										</span>
									</div>
								{/each}
							</div>
						</div>

						<!-- Summary Stats -->
						<div class="summary-grid">
							<div class="summary-card">
								<h4>📊 Regular Season</h4>
								<div class="summary-stat">
									<span class="label">Weeks with data:</span>
									<span class="value">{dataStatus.regularWeeksCount || 0} / 14</span>
								</div>
								<div class="summary-stat">
									<span class="label">Total rosters:</span>
									<span class="value">{dataStatus.totalRegularRosters || 0}</span>
								</div>
								<div class="summary-stat">
									<span class="label">Total stats:</span>
									<span class="value">{dataStatus.totalRegularStats || 0}</span>
								</div>
							</div>

							<div class="summary-card">
								<h4>🏆 Playoffs</h4>
								<div class="summary-stat">
									<span class="label">Weeks with data:</span>
									<span class="value">{dataStatus.playoffWeeksCount || 0} / 4</span>
								</div>
								<div class="summary-stat">
									<span class="label">Total rosters:</span>
									<span class="value">{dataStatus.totalPlayoffRosters || 0}</span>
								</div>
								<div class="summary-stat">
									<span class="label">Total stats:</span>
									<span class="value">{dataStatus.totalPlayoffStats || 0}</span>
								</div>
							</div>
						</div>

						<!-- Staging Tables Status -->
						<div class="status-section">
							<h4>🗃️ Staging Tables (Unprocessed Data)</h4>
							<div class="staging-grid">
								<div class="staging-item">
									<span class="label">Weekly Rosters:</span>
									<span class="value">{dataStatus.stagingRosters || 0}</span>
								</div>
								<div class="staging-item">
									<span class="label">Player Stats:</span>
									<span class="value">{dataStatus.stagingStats || 0}</span>
								</div>
							</div>
							{#if (dataStatus.stagingRosters > 0 || dataStatus.stagingStats > 0)}
								<p class="hint">⚠️ You have unprocessed data in staging tables. Run archival to process it.</p>
							{/if}
						</div>
					{:else}
						<p class="hint">Select a season to view data status...</p>
					{/if}
				</div>

				<!-- Week Detail View -->
				<div class="week-detail-section">
					<h3>🔍 Week Detail View</h3>
					<p>Select a week to see detailed staging vs production data:</p>
					
					<div class="form-group">
						<label for="detail-week-select">Select Week:</label>
						<select id="detail-week-select" bind:value={selectedWeek}>
							{#each Array(18) as _, i}
								<option value={i + 1}>Week {i + 1}</option>
							{/each}
						</select>
					</div>

					{#if dataStatus}
						{@const isPlayoff = selectedWeek >= 15}
						{@const stagingRosters = dataStatus.stagingByWeek?.rosters?.[selectedWeek] || 0}
						{@const stagingStats = dataStatus.stagingByWeek?.stats?.[selectedWeek] || 0}
						{@const prodRosters = isPlayoff 
							? (dataStatus.playoffRosters?.[selectedWeek] || 0)
							: (dataStatus.weeklyRosters?.[selectedWeek] || 0)}
						{@const prodStats = isPlayoff
							? (dataStatus.playoffStats?.[selectedWeek] || 0)
							: (dataStatus.playerStats?.[selectedWeek] || 0)}

						<div class="week-detail-grid">
							<div class="week-detail-card">
								<h4>📦 Staging Tables</h4>
								<div class="detail-stat">
									<span class="label">Rosters (unprocessed):</span>
									<span class="value {stagingRosters > 0 ? 'has-data' : 'no-data'}">
										{stagingRosters}
									</span>
								</div>
								<div class="detail-stat">
									<span class="label">Player Stats (unprocessed):</span>
									<span class="value {stagingStats > 0 ? 'has-data' : 'no-data'}">
										{stagingStats}
									</span>
								</div>
								{#if stagingRosters > 0 || stagingStats > 0}
									<p class="status-message warning">⚠️ Unprocessed data available</p>
								{:else}
									<p class="status-message success">✓ No unprocessed data</p>
								{/if}
							</div>

							<div class="week-detail-card">
								<h4>✅ Production Tables</h4>
								<div class="detail-stat">
									<span class="label">{isPlayoff ? 'Playoff Rosters' : 'Weekly Rosters'}:</span>
									<span class="value {prodRosters > 0 ? 'has-data' : 'no-data'}">
										{prodRosters}
									</span>
								</div>
								<div class="detail-stat">
									<span class="label">{isPlayoff ? 'Playoff Stats' : 'Player Stats'}:</span>
									<span class="value {prodStats > 0 ? 'has-data' : 'no-data'}">
										{prodStats}
									</span>
								</div>
								{#if prodRosters > 0 || prodStats > 0}
									<p class="status-message success">✓ Data processed</p>
								{:else}
									<p class="status-message warning">⚠️ No processed data</p>
								{/if}
							</div>

							<div class="week-detail-card">
								<h4>📊 Week Summary</h4>
								<div class="detail-stat">
									<span class="label">Week Type:</span>
									<span class="value">
										<span class="badge badge-{isPlayoff ? 'purple' : 'blue'}">
											{isPlayoff ? 'Playoff' : 'Regular Season'}
										</span>
									</span>
								</div>
								<div class="detail-stat">
									<span class="label">Target Tables:</span>
									<span class="value small-text">
										{isPlayoff ? 'playoff_roster, playoff_fantasy_stats' : 'weekly_roster, player_fantasy_stats'}
									</span>
								</div>
								{#if stagingRosters > 0 || stagingStats > 0}
									<p class="status-message info">💡 Ready to archive</p>
								{:else if prodRosters > 0 || prodStats > 0}
									<p class="status-message success">✓ Complete</p>
								{:else}
									<p class="status-message">No data for this week</p>
								{/if}
							</div>
						</div>
					{/if}
				</div>

				<!-- Archive Controls -->
				<div class="sync-controls">
					<h3>🔄 Archive Week Data</h3>
					
					<div class="archive-card">
						<h4>📥 Archive Week {selectedWeek}</h4>
						<p>Fetch and archive data for <strong>Week {selectedWeek}</strong> from Sleeper.</p>
						
						<div class="archive-preview">
							<p><strong>Auto-detected Type:</strong> 
								<span class="badge badge-{archiveType === 'playoff' ? 'purple' : 'blue'}">
									{archiveType === 'playoff' ? 'Playoff' : 'Regular Season'}
								</span>
							</p>
							<p><strong>Will archive to:</strong></p>
							<ul>
								<li><code>{archiveType === 'regular' ? 'weekly_roster' : 'playoff_roster'}</code></li>
								<li><code>{archiveType === 'regular' ? 'player_fantasy_stats' : 'playoff_fantasy_stats'}</code></li>
							</ul>
						</div>

						<button 
							type="button" 
							class="btn btn-primary" 
							disabled={isArchiving}
							on:click={archiveWeek}
						>
							{isArchiving ? '⏳ Archiving...' : `🔄 Archive Week ${selectedWeek}`}
						</button>
					</div>

					<!-- Bulk Archive Link -->
					<div class="archive-card archive-card-info">
						<h4>📦 Bulk Archive</h4>
						<p>For archiving multiple weeks at once, use the dedicated archive page.</p>
						<a href="/admin/archive" class="btn btn-secondary">
							Go to Bulk Archive Page →
						</a>
					</div>
				</div>
			{/if}
		{/if}
	</div>
</div>

<style>
	.container {
		max-width: 1400px;
		margin: 0 auto;
		padding: 2rem;
	}

	.header h1 {
		color: #00316b;
		margin: 0 0 0.5rem 0;
		font-size: 2rem;
	}

	.subtitle {
		color: #666;
		font-size: 1.1rem;
		margin: 0;
	}

	.alert {
		padding: 1rem;
		border-radius: 8px;
		margin-bottom: 1.5rem;
	}

	.alert-success {
		background: #d4edda;
		border: 1px solid #c3e6cb;
		color: #155724;
	}

	.alert-error {
		background: #f8d7da;
		border: 1px solid #f5c6cb;
		color: #721c24;
	}

	.alert-warning {
		background: #fff3cd;
		border: 1px solid #ffeeba;
		color: #856404;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.stat-card {
		background: white;
		border: 2px solid #e0e0e0;
		border-radius: 12px;
		padding: 1.5rem;
		text-align: center;
	}

	.stat-icon {
		font-size: 2.5rem;
		margin-bottom: 0.5rem;
	}

	.stat-value {
		font-size: 2rem;
		font-weight: 700;
		color: #00316b;
		margin-bottom: 0.25rem;
	}

	.stat-label {
		color: #666;
		font-size: 0.9rem;
	}

	.sync-section {
		background: white;
		border: 2px solid #e0e0e0;
		border-radius: 12px;
		padding: 2rem;
		margin-bottom: 2rem;
	}

	.sync-section h2 {
		color: #00316b;
		margin-top: 0;
		margin-bottom: 1.5rem;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-group label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 600;
		color: #333;
	}

	.form-group select {
		width: 100%;
		padding: 0.75rem;
		border: 2px solid #ddd;
		border-radius: 6px;
		font-size: 1rem;
	}

	.season-info {
		background: #f8f9fa;
		border: 2px solid #e0e0e0;
		border-radius: 8px;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.season-info h3 {
		margin-top: 0;
		color: #00316b;
	}

	.info-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}

	.info-item {
		display: flex;
		justify-content: space-between;
		padding: 0.5rem;
		background: white;
		border-radius: 4px;
	}

	.info-item .label {
		color: #666;
		font-weight: 500;
	}

	.info-item .value {
		font-weight: 600;
		color: #00316b;
	}

	.badge {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.85rem;
		font-weight: 600;
	}

	.badge-blue {
		background: #2196f3;
		color: white;
	}

	.badge-purple {
		background: #9c27b0;
		color: white;
	}

	.status-dashboard {
		background: white;
		border: 2px solid #e0e0e0;
		border-radius: 12px;
		padding: 2rem;
		margin-bottom: 2rem;
	}

	.status-dashboard h3 {
		color: #00316b;
		margin-top: 0;
		margin-bottom: 1.5rem;
	}

	.status-section {
		margin-bottom: 2rem;
	}

	.status-section h4 {
		color: #00316b;
		margin-bottom: 1rem;
	}

	.weekly-grid {
		display: grid;
		grid-template-columns: 60px 100px 100px 100px 80px;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.grid-header {
		font-weight: 600;
		color: #00316b;
		padding: 0.5rem;
		background: #f8f9fa;
		border-radius: 4px;
		text-align: center;
	}

	.grid-cell {
		padding: 0.5rem;
		border: 1px solid #e0e0e0;
		border-radius: 4px;
		text-align: center;
		font-size: 0.9rem;
	}

	.week-cell {
		font-weight: 600;
		background: #f8f9fa;
	}

	.status-badge {
		display: inline-block;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-weight: 600;
		font-size: 0.85rem;
	}

	.status-green {
		background: #28a745;
		color: white;
	}

	.status-gray {
		background: #6c757d;
		color: white;
	}

	.summary-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.summary-card {
		background: #f8f9fa;
		border: 2px solid #e0e0e0;
		border-radius: 8px;
		padding: 1.5rem;
	}

	.summary-card h4 {
		margin-top: 0;
		color: #00316b;
	}

	.summary-stat {
		display: flex;
		justify-content: space-between;
		padding: 0.5rem 0;
		border-bottom: 1px solid #dee2e6;
	}

	.summary-stat:last-child {
		border-bottom: none;
	}

	.summary-stat .label {
		color: #666;
	}

	.summary-stat .value {
		font-weight: 600;
		color: #00316b;
	}

	.staging-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.staging-item {
		display: flex;
		justify-content: space-between;
		padding: 0.75rem;
		background: #fff3cd;
		border: 1px solid #ffeeba;
		border-radius: 4px;
	}

	.staging-item .label {
		color: #856404;
		font-weight: 500;
	}

	.staging-item .value {
		font-weight: 700;
		color: #856404;
	}

	.week-detail-section {
		background: white;
		border: 2px solid #e0e0e0;
		border-radius: 12px;
		padding: 2rem;
		margin-bottom: 2rem;
	}

	.week-detail-section h3 {
		color: #00316b;
		margin-top: 0;
		margin-bottom: 1rem;
	}

	.week-detail-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1.5rem;
		margin-top: 1.5rem;
	}

	.week-detail-card {
		background: #f8f9fa;
		border: 2px solid #e0e0e0;
		border-radius: 8px;
		padding: 1.5rem;
	}

	.week-detail-card h4 {
		margin-top: 0;
		color: #00316b;
		margin-bottom: 1rem;
	}

	.detail-stat {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 0;
		border-bottom: 1px solid #dee2e6;
	}

	.detail-stat:last-of-type {
		border-bottom: none;
	}

	.detail-stat .label {
		color: #666;
		font-weight: 500;
	}

	.detail-stat .value {
		font-weight: 700;
		font-size: 1.1rem;
	}

	.detail-stat .value.has-data {
		color: #28a745;
	}

	.detail-stat .value.no-data {
		color: #6c757d;
	}

	.detail-stat .value.small-text {
		font-size: 0.85rem;
		font-family: monospace;
		color: #00316b;
	}

	.status-message {
		margin-top: 1rem;
		padding: 0.75rem;
		border-radius: 4px;
		font-weight: 600;
		text-align: center;
	}

	.status-message.success {
		background: #d4edda;
		color: #155724;
		border: 1px solid #c3e6cb;
	}

	.status-message.warning {
		background: #fff3cd;
		color: #856404;
		border: 1px solid #ffeeba;
	}

	.status-message.info {
		background: #d1ecf1;
		color: #0c5460;
		border: 1px solid #bee5eb;
	}

	.sync-controls {
		background: white;
		border: 2px solid #e0e0e0;
		border-radius: 12px;
		padding: 2rem;
	}

	.sync-controls h3 {
		color: #00316b;
		margin-top: 0;
		margin-bottom: 1.5rem;
	}

	.archive-card {
		background: #f8f9fa;
		border: 2px solid #e0e0e0;
		border-radius: 8px;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.archive-card h4 {
		margin-top: 0;
		color: #00316b;
	}

	.archive-card-info {
		background: #e3f2fd;
		border-color: #2196f3;
	}

	.archive-preview {
		background: white;
		border: 1px solid #dee2e6;
		border-radius: 4px;
		padding: 1rem;
		margin-bottom: 1rem;
	}

	.archive-preview p {
		margin: 0.5rem 0;
	}

	.archive-preview ul {
		margin: 0.5rem 0 0 0;
		padding-left: 1.5rem;
	}

	.archive-preview li {
		margin: 0.25rem 0;
	}

	.archive-preview code {
		font-family: monospace;
		color: #00316b;
		background: #f0f0f0;
		padding: 0.125rem 0.375rem;
		border-radius: 3px;
	}

	.btn {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 6px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s;
		text-decoration: none;
		display: inline-block;
	}

	.btn-primary {
		background: #2196f3;
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		background: #1976d2;
	}

	.btn-primary:disabled {
		background: #ccc;
		cursor: not-allowed;
	}

	.btn-secondary {
		background: #6c757d;
		color: white;
	}

	.btn-secondary:hover {
		background: #5a6268;
	}

	.loading {
		text-align: center;
		padding: 2rem;
		color: #666;
		font-style: italic;
	}

	.hint {
		font-style: italic;
		color: #666;
		font-size: 0.9rem;
	}
</style>