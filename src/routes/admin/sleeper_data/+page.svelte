<script>
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	export let data;
	export let form;

	let selectedSeason = '';
	let selectedWeek = 1;
	let syncingRosters = false;
	let syncingMatchups = false;
	let syncingFullSeason = false;
	let dataStatus = null;
	let loadingStatus = false;

	$: selectedSeasonData = selectedSeason
		? data.seasons.find(s => s.season_id === parseInt(selectedSeason))
		: null;

	// Load data status when season is selected
	$: if (selectedSeasonData && selectedSeasonData.sleeper_league_id) {
		loadDataStatus(selectedSeasonData.season_id, selectedSeasonData.sleeper_league_id);
	}

	async function loadDataStatus(seasonId, sleeperLeagueId) {
		loadingStatus = true;
		try {
			// This would need to be an API call in real implementation
			// For now, using fetch to a custom endpoint
			const response = await fetch(`/api/sleeper-status?season_id=${seasonId}&sleeper_league_id=${sleeperLeagueId}`);
			if (response.ok) {
				dataStatus = await response.json();
			}
		} catch (error) {
			console.error('Error loading data status:', error);
		}
		loadingStatus = false;
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
		<p class="subtitle">Sync fantasy football data from Sleeper API</p>
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
			<div class="stat-icon">👥</div>
			<div class="stat-value">{data.stats.total_managers}</div>
			<div class="stat-label">Synced Managers</div>
		</div>
		<div class="stat-card">
			<div class="stat-icon">🏆</div>
			<div class="stat-value">{data.stats.total_teams}</div>
			<div class="stat-label">Synced Teams</div>
		</div>
		<div class="stat-card">
			<div class="stat-icon">⚔️</div>
			<div class="stat-value">{data.stats.total_matchups}</div>
			<div class="stat-label">Synced Matchups</div>
		</div>
		<div class="stat-card">
			<div class="stat-icon">🔄</div>
			<div class="stat-value">{formatDate(data.stats.last_sync)}</div>
			<div class="stat-label">Last Sync</div>
		</div>
	</div>

	<!-- Season Selection -->
	<div class="sync-section">
		<h2>Select Season to Sync</h2>

		<div class="form-group">
			<label for="season-select">Choose a Season:</label>
			<select id="season-select" bind:value={selectedSeason}>
				<option value="">-- Select a Season --</option>
				{#each data.seasons as season}
					<option value={season.season_id}>
						{season.league_name} - {season.season_year} 
						({season.team_count} teams, {season.matchup_count} matchups)
						{#if season.is_active}⭐ ACTIVE{/if}
						{#if season.platform} - {season.platform}{/if}
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
						<span class="value badge badge-blue">{selectedSeasonData.platform || 'Not Set'}</span>
					</div>
					<div class="info-item">
						<span class="label">Sleeper League ID:</span>
						<span class="value">{selectedSeasonData.sleeper_league_id || 'Not Set'}</span>
					</div>
				</div>
			</div>

			{#if !selectedSeasonData.sleeper_league_id}
				<div class="alert alert-warning">
					⚠️ This season doesn't have a Sleeper League ID set. You need to add the Sleeper League ID 
					to the league's platform_id field before syncing.
				</div>
			{:else}
				<!-- Data Status Dashboard -->
				<div class="status-dashboard">
					<h3>📋 Data Status Dashboard</h3>
					{#if loadingStatus}
						<p class="loading">Loading data status...</p>
					{:else if dataStatus}
						<!-- Season-Level Data -->
						<div class="status-section">
							<h4>Season-Level Data</h4>
							<div class="status-grid">
								<div class="status-item">
									<div class="status-label">👥 Teams/Rosters</div>
									<div class="status-bars">
										<div class="status-bar">
											<span class="bar-label">Staging:</span>
											<div class="bar-container">
												<div class="bar bar-staging" style="width: {dataStatus.seasonStaging.teams > 0 ? '100%' : '0%'}"></div>
												<span class="bar-count">{dataStatus.seasonStaging.teams}</span>
											</div>
										</div>
										<div class="status-bar">
											<span class="bar-label">Production:</span>
											<div class="bar-container">
												<div class="bar bar-production" style="width: {dataStatus.seasonProduction.teams > 0 ? '100%' : '0%'}"></div>
												<span class="bar-count">{dataStatus.seasonProduction.teams}</span>
											</div>
										</div>
									</div>
									<span class="status-badge status-{getStatusColor(dataStatus.seasonStaging.teams, dataStatus.seasonProduction.teams)}">
										{getStatusText(dataStatus.seasonStaging.teams, dataStatus.seasonProduction.teams)}
									</span>
								</div>

								<div class="status-item">
									<div class="status-label">🏈 League Data</div>
									<div class="status-bars">
										<div class="status-bar">
											<span class="bar-label">Staging:</span>
											<div class="bar-container">
												<div class="bar bar-staging" style="width: {dataStatus.seasonStaging.league > 0 ? '100%' : '0%'}"></div>
												<span class="bar-count">{dataStatus.seasonStaging.league}</span>
											</div>
										</div>
									</div>
									<span class="status-badge status-{getStatusColor(dataStatus.seasonStaging.league, 1)}">
										{getStatusText(dataStatus.seasonStaging.league, 1)}
									</span>
								</div>

								<div class="status-item">
									<div class="status-label">📋 Drafts</div>
									<div class="status-bars">
										<div class="status-bar">
											<span class="bar-label">Staging:</span>
											<div class="bar-container">
												<div class="bar bar-staging" style="width: {dataStatus.seasonStaging.drafts > 0 ? '100%' : '0%'}"></div>
												<span class="bar-count">{dataStatus.seasonStaging.drafts}</span>
											</div>
										</div>
									</div>
									<span class="status-badge status-{getStatusColor(dataStatus.seasonStaging.drafts, 0)}">
										{getStatusText(dataStatus.seasonStaging.drafts, 0)}
									</span>
								</div>

								<div class="status-item">
									<div class="status-label">🎯 Draft Picks</div>
									<div class="status-bars">
										<div class="status-bar">
											<span class="bar-label">Staging:</span>
											<div class="bar-container">
												<div class="bar bar-staging" style="width: {dataStatus.seasonStaging.draftPicks > 0 ? '100%' : '0%'}"></div>
												<span class="bar-count">{dataStatus.seasonStaging.draftPicks}</span>
											</div>
										</div>
									</div>
									<span class="status-badge status-{getStatusColor(dataStatus.seasonStaging.draftPicks, 0)}">
										{getStatusText(dataStatus.seasonStaging.draftPicks, 0)}
									</span>
								</div>

								<div class="status-item">
									<div class="status-label">👤 Users/Managers</div>
									<div class="status-bars">
										<div class="status-bar">
											<span class="bar-label">Staging:</span>
											<div class="bar-container">
												<div class="bar bar-staging" style="width: {dataStatus.seasonStaging.users > 0 ? '100%' : '0%'}"></div>
												<span class="bar-count">{dataStatus.seasonStaging.users}</span>
											</div>
										</div>
										<div class="status-bar">
											<span class="bar-label">Production:</span>
											<div class="bar-container">
												<div class="bar bar-production" style="width: {dataStatus.seasonProduction.managers > 0 ? '100%' : '0%'}"></div>
												<span class="bar-count">{dataStatus.seasonProduction.managers}</span>
											</div>
										</div>
									</div>
									<span class="status-badge status-{getStatusColor(dataStatus.seasonStaging.users, dataStatus.seasonProduction.managers)}">
										{getStatusText(dataStatus.seasonStaging.users, dataStatus.seasonProduction.managers)}
									</span>
								</div>
							</div>
						</div>

						<!-- Weekly Data -->
						<div class="status-section">
							<h4>Weekly Data Status</h4>
							<div class="weekly-status">
								<!-- Matchups -->
								<div class="weekly-item">
									<h5>⚔️ Matchups</h5>
									<div class="week-grid">
										{#each Array(18) as _, i}
											{@const week = i + 1}
											{@const staging = dataStatus.weeklyStaging.matchups?.[week] || 0}
											{@const production = dataStatus.weeklyProduction.matchups?.[week] || 0}
											<div class="week-box status-{getStatusColor(staging, production)}" title="Week {week}: {staging} staging, {production} production">
												<div class="week-label">W{week}</div>
												<div class="week-counts">
													<span class="staging-count">{staging}</span>
													<span class="production-count">{production}</span>
												</div>
											</div>
										{/each}
									</div>
								</div>

								<!-- Rosters -->
								<div class="weekly-item">
									<h5>📊 Weekly Rosters</h5>
									<div class="week-grid">
										{#each Array(18) as _, i}
											{@const week = i + 1}
											{@const staging = dataStatus.weeklyStaging.rosters?.[week] || 0}
											{@const production = dataStatus.weeklyProduction.rosters?.[week] || 0}
											<div class="week-box status-{getStatusColor(staging, production)}" title="Week {week}: {staging} staging, {production} production">
												<div class="week-label">W{week}</div>
												<div class="week-counts">
													<span class="staging-count">{staging}</span>
													<span class="production-count">{production}</span>
												</div>
											</div>
										{/each}
									</div>
								</div>

								<!-- Player Stats -->
								<div class="weekly-item">
									<h5>📈 Player Fantasy Stats</h5>
									<div class="week-grid">
										{#each Array(18) as _, i}
											{@const week = i + 1}
											{@const staging = dataStatus.weeklyStaging.playerStats?.[week] || 0}
											<div class="week-box status-{getStatusColor(staging, 0)}" title="Week {week}: {staging} staging">
												<div class="week-label">W{week}</div>
												<div class="week-counts">
													<span class="staging-count">{staging}</span>
												</div>
											</div>
										{/each}
									</div>
								</div>

								<!-- Playoffs -->
								<div class="weekly-item">
									<h5>🏆 Playoffs (Weeks 15-18)</h5>
									<div class="week-grid">
										{#each Array(4) as _, i}
											{@const week = i + 15}
											{@const staging = dataStatus.weeklyStaging.playoffs?.[week] || 0}
											<div class="week-box status-{getStatusColor(staging, 0)}" title="Week {week}: {staging} staging">
												<div class="week-label">W{week}</div>
												<div class="week-counts">
													<span class="staging-count">{staging}</span>
												</div>
											</div>
										{/each}
									</div>
								</div>
							</div>
						</div>

						<!-- Legend -->
						<div class="legend">
							<h5>Legend:</h5>
							<div class="legend-items">
								<div class="legend-item">
									<span class="status-badge status-green">Processed</span>
									<span>Data in production tables</span>
								</div>
								<div class="legend-item">
									<span class="status-badge status-yellow">Staged</span>
									<span>Data in staging, needs processing</span>
								</div>
								<div class="legend-item">
									<span class="status-badge status-gray">Missing</span>
									<span>No data downloaded</span>
								</div>
							</div>
						</div>
					{:else}
						<p class="hint">Data status will appear here after loading...</p>
					{/if}
				</div>

				<!-- Sync Controls -->
				<div class="sync-controls">
					<h3>🔄 Sync Controls</h3>
					
					<!-- Sync Rosters/Teams -->
					<div class="sync-card">
						<h4>📋 Sync Teams/Rosters</h4>
						<p>Import all teams and managers from Sleeper for this season.</p>
						<p class="hint">💡 Do this first before syncing matchups!</p>
						<form
							method="POST"
							action="?/syncRosters"
							use:enhance={() => {
								syncingRosters = true;
								return async ({ update }) => {
									await update();
									await invalidateAll();
									syncingRosters = false;
								};
							}}
						>
							<input type="hidden" name="sleeper_league_id" value={selectedSeasonData.sleeper_league_id} />
							<input type="hidden" name="season_id" value={selectedSeason} />
							<input type="hidden" name="league_id" value={selectedSeasonData.league_id} />
							<button type="submit" class="btn btn-primary" disabled={syncingRosters}>
								{syncingRosters ? '⏳ Syncing...' : '🔄 Sync Rosters'}
							</button>
						</form>
					</div>

					<!-- Sync Single Week Matchups -->
					<div class="sync-card">
						<h4>⚔️ Sync Week Matchups</h4>
						<p>Import matchup data for a specific week.</p>
						<div class="form-group">
							<label for="week-select">Select Week:</label>
							<select id="week-select" bind:value={selectedWeek}>
								{#each Array(18) as _, i}
									<option value={i + 1}>Week {i + 1}</option>
								{/each}
							</select>
						</div>
						<form
							method="POST"
							action="?/syncMatchups"
							use:enhance={() => {
								syncingMatchups = true;
								return async ({ update }) => {
									await update();
									await invalidateAll();
									syncingMatchups = false;
								};
							}}
						>
							<input type="hidden" name="sleeper_league_id" value={selectedSeasonData.sleeper_league_id} />
							<input type="hidden" name="week" value={selectedWeek} />
							<input type="hidden" name="season_id" value={selectedSeason} />
							<button type="submit" class="btn btn-primary" disabled={syncingMatchups}>
								{syncingMatchups ? '⏳ Syncing...' : `🔄 Sync Week ${selectedWeek}`}
							</button>
						</form>
					</div>

					<!-- Full Season Sync -->
					<div class="sync-card sync-card-danger">
						<h4>🚀 Full Season Sync</h4>
						<p class="warning-text">
							⚠️ This will sync all rosters AND all matchups (weeks 1-18). This may take several minutes.
						</p>
						<form
							method="POST"
							action="?/syncFullSeason"
							use:enhance={() => {
								syncingFullSeason = true;
								return async ({ update }) => {
									await update();
									await invalidateAll();
									syncingFullSeason = false;
								};
							}}
						>
							<input type="hidden" name="sleeper_league_id" value={selectedSeasonData.sleeper_league_id} />
							<input type="hidden" name="season_id" value={selectedSeason} />
							<input type="hidden" name="league_id" value={selectedSeasonData.league_id} />
							<button type="submit" class="btn btn-danger" disabled={syncingFullSeason}>
								{syncingFullSeason ? '⏳ Syncing Full Season...' : '🚀 Sync Entire Season'}
							</button>
						</form>
					</div>
				</div>
			{/if}
		{/if}
	</div>
</div>

<style>
	/* Previous styles remain the same... */
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

	/* Status Dashboard */
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
		font-size: 1.2rem;
	}

	.status-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.status-item {
		background: #f8f9fa;
		border: 2px solid #e0e0e0;
		border-radius: 8px;
		padding: 1rem;
	}

	.status-label {
		font-weight: 600;
		color: #333;
		margin-bottom: 0.75rem;
		display: block;
	}

	.status-bars {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}

	.status-bar {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.bar-label {
		font-size: 0.85rem;
		color: #666;
		width: 80px;
	}

	.bar-container {
		flex: 1;
		height: 24px;
		background: #e0e0e0;
		border-radius: 4px;
		position: relative;
		overflow: hidden;
	}

	.bar {
		height: 100%;
		transition: width 0.3s ease;
	}

	.bar-staging {
		background: linear-gradient(90deg, #ffd700 0%, #ffed4e 100%);
	}

	.bar-production {
		background: linear-gradient(90deg, #28a745 0%, #34ce57 100%);
	}

	.bar-count {
		position: absolute;
		right: 8px;
		top: 50%;
		transform: translateY(-50%);
		font-size: 0.85rem;
		font-weight: 600;
		color: #333;
	}

	.status-badge {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
	}

	.status-green {
		background: #28a745;
		color: white;
	}

	.status-yellow {
		background: #ffc107;
		color: #333;
	}

	.status-gray {
		background: #6c757d;
		color: white;
	}

	/* Weekly Status */
	.weekly-status {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.weekly-item h5 {
		color: #00316b;
		margin-bottom: 1rem;
	}

	.week-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
		gap: 0.75rem;
	}

	.week-box {
		background: white;
		border: 2px solid #e0e0e0;
		border-radius: 8px;
		padding: 0.5rem;
		text-align: center;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.week-box:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	}

	.week-box.status-green {
		border-color: #28a745;
		background: #d4edda;
	}

	.week-box.status-yellow {
		border-color: #ffc107;
		background: #fff3cd;
	}

	.week-box.status-gray {
		border-color: #6c757d;
		background: #f8f9fa;
	}

	.week-label {
		font-weight: 600;
		color: #00316b;
		font-size: 0.85rem;
		margin-bottom: 0.25rem;
	}

	.week-counts {
		display: flex;
		justify-content: space-around;
		font-size: 0.75rem;
	}

	.staging-count {
		color: #856404;
	}

	.production-count {
		color: #155724;
		font-weight: 600;
	}

	/* Legend */
	.legend {
		margin-top: 2rem;
		padding: 1rem;
		background: #f8f9fa;
		border-radius: 8px;
	}

	.legend h5 {
		margin: 0 0 0.75rem 0;
		color: #00316b;
	}

	.legend-items {
		display: flex;
		gap: 2rem;
		flex-wrap: wrap;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.loading {
		text-align: center;
		padding: 2rem;
		color: #666;
		font-style: italic;
	}

	.hint {
		font-style: italic;
		color: #00316b;
	}

	/* Sync Controls */
	.sync-controls {
		background: white;
		border: 2px solid #e0e0e0;
		border-radius: 12px;
		padding: 2rem;
		margin-bottom: 2rem;
	}

	.sync-controls h3 {
		color: #00316b;
		margin-top: 0;
		margin-bottom: 1.5rem;
	}

	.sync-card {
		background: #f8f9fa;
		border: 2px solid #e0e0e0;
		border-radius: 8px;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.sync-card h4 {
		margin-top: 0;
		margin-bottom: 0.5rem;
		color: #00316b;
	}

	.sync-card p {
		margin-bottom: 1rem;
		color: #666;
	}

	.sync-card-danger {
		background: #fff5f5;
		border-color: #fc8181;
	}

	.warning-text {
		color: #c53030 !important;
		font-weight: 600;
	}

	/* Rest of your existing styles... */
</style>