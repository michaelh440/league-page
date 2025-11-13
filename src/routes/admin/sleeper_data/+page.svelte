<script>
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	export let data;
	export let form;

	let selectedLeague = '';
	let selectedSeason = '';
	let selectedWeek = 1;
	let syncingLeague = false;
	let syncingRosters = false;
	let syncingMatchups = false;
	let syncingFullSeason = false;

	$: filteredSeasons = selectedLeague
		? data.seasons.filter(s => s.league_id === parseInt(selectedLeague))
		: data.seasons;

	$: selectedSeasonData = selectedSeason
		? data.seasons.find(s => s.season_id === parseInt(selectedSeason))
		: null;

	function formatDate(dateString) {
		if (!dateString) return 'Never';
		return new Date(dateString).toLocaleString();
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

	<!-- Sync Controls -->
	<div class="sync-section">
		<h2>Sync Controls</h2>

		<!-- League Selection -->
		<div class="form-group">
			<label for="league-select">Select League:</label>
			<select id="league-select" bind:value={selectedLeague}>
				<option value="">-- Select a Sleeper League --</option>
				{#each data.leagues as league}
					<option value={league.league_id}>
						{league.league_name} ({league.season_year}) - ID: {league.sleeper_league_id}
					</option>
				{/each}
			</select>
		</div>

		<!-- Season Selection -->
		{#if selectedLeague}
			<div class="form-group">
				<label for="season-select">Select Season:</label>
				<select id="season-select" bind:value={selectedSeason}>
					<option value="">-- Select a Season --</option>
					{#each filteredSeasons as season}
						<option value={season.season_id}>
							{season.season_year} Season - {season.team_count} teams
							{#if season.is_active}
								<span class="badge">ACTIVE</span>
							{/if}
						</option>
					{/each}
				</select>
			</div>
		{/if}

		<!-- Sync Rosters/Teams -->
		{#if selectedSeason && selectedSeasonData}
			<div class="sync-card">
				<h3>📋 Sync Teams/Rosters</h3>
				<p>Import all teams and managers from Sleeper for this season.</p>
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
					<input type="hidden" name="league_id" value={selectedLeague} />
					<button type="submit" class="btn btn-primary" disabled={syncingRosters}>
						{syncingRosters ? '⏳ Syncing...' : '🔄 Sync Rosters'}
					</button>
				</form>
			</div>

			<!-- Sync Single Week Matchups -->
			<div class="sync-card">
				<h3>⚔️ Sync Week Matchups</h3>
				<p>Import matchup data for a specific week.</p>
				<div class="form-group">
					<label for="week-select">Select Week:</label>
					<select id="week-select" bind:value={selectedWeek}>
						{#each Array(17) as _, i}
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
				<h3>🚀 Full Season Sync</h3>
				<p class="warning-text">
					⚠️ This will sync all rosters AND all matchups (weeks 1-17). This may take several minutes.
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
					<input type="hidden" name="league_id" value={selectedLeague} />
					<button type="submit" class="btn btn-danger" disabled={syncingFullSeason}>
						{syncingFullSeason ? '⏳ Syncing Full Season...' : '🚀 Sync Entire Season'}
					</button>
				</form>
			</div>
		{/if}
	</div>

	<!-- Leagues List -->
	<div class="list-section">
		<h2>Available Sleeper Leagues</h2>
		{#if data.leagues.length === 0}
			<p class="empty-state">No Sleeper leagues found. Add a Sleeper league first.</p>
		{:else}
			<div class="leagues-grid">
				{#each data.leagues as league}
					<div class="league-card">
						<div class="league-header">
							<h3>{league.league_name}</h3>
							<span class="badge badge-blue">Sleeper</span>
						</div>
						<div class="league-info">
							<div class="info-row">
								<span class="label">Season:</span>
								<span class="value">{league.season_year}</span>
							</div>
							<div class="info-row">
								<span class="label">League ID:</span>
								<span class="value">{league.sleeper_league_id}</span>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Help Section -->
	<div class="help-section">
		<h2>📖 How to Use</h2>
		<ol class="help-list">
			<li><strong>Select a League:</strong> Choose the Sleeper league you want to sync from.</li>
			<li><strong>Select a Season:</strong> Choose which season/year to sync data for.</li>
			<li>
				<strong>Sync Rosters First:</strong> Always sync rosters/teams before syncing matchups. This imports
				all managers and their teams.
			</li>
			<li>
				<strong>Sync Matchups:</strong> Sync individual weeks or use "Full Season Sync" to import all
				matchup data at once.
			</li>
			<li><strong>Monitor Progress:</strong> Check the stats dashboard to see your sync progress.</li>
		</ol>
	</div>
</div>

<style>
	.container {
		max-width: 1400px;
		margin: 0 auto;
		padding: 2rem;
	}

	.header {
		margin-bottom: 2rem;
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
		margin-bottom: 2rem;
		font-weight: 500;
	}

	.alert-success {
		background-color: #d4edda;
		color: #155724;
		border: 1px solid #c3e6cb;
	}

	.alert-error {
		background-color: #f8d7da;
		color: #721c24;
		border: 1px solid #f5c6cb;
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
		border: 2px solid #e0e0e0;
		border-radius: 12px;
		padding: 1.5rem;
		text-align: center;
		transition: all 0.3s ease;
	}

	.stat-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 6px 12px rgba(0, 49, 107, 0.1);
		border-color: #00316b;
	}

	.stat-icon {
		font-size: 2.5rem;
		margin-bottom: 0.5rem;
	}

	.stat-value {
		font-size: 2rem;
		font-weight: bold;
		color: #00316b;
		margin-bottom: 0.5rem;
	}

	.stat-label {
		color: #666;
		font-size: 0.9rem;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	/* Sync Section */
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
		font-size: 1.5rem;
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
		border-radius: 8px;
		font-size: 1rem;
		background: white;
		cursor: pointer;
		transition: border-color 0.3s ease;
	}

	.form-group select:focus {
		outline: none;
		border-color: #00316b;
	}

	.sync-card {
		background: #f8f9fa;
		border: 2px solid #e0e0e0;
		border-radius: 8px;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.sync-card h3 {
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

	.btn {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		display: inline-block;
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-primary {
		background-color: #00316b;
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		background-color: #00254f;
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 49, 107, 0.2);
	}

	.btn-danger {
		background-color: #dc3545;
		color: white;
	}

	.btn-danger:hover:not(:disabled) {
		background-color: #c82333;
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(220, 53, 69, 0.2);
	}

	.badge {
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
	}

	.badge-blue {
		background-color: #00316b;
		color: white;
	}

	/* Lists Section */
	.list-section {
		background: white;
		border: 2px solid #e0e0e0;
		border-radius: 12px;
		padding: 2rem;
		margin-bottom: 2rem;
	}

	.list-section h2 {
		color: #00316b;
		margin-top: 0;
		margin-bottom: 1.5rem;
		font-size: 1.5rem;
	}

	.empty-state {
		text-align: center;
		padding: 3rem;
		color: #999;
		font-size: 1.1rem;
	}

	.leagues-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1.5rem;
	}

	.league-card {
		background: #f8f9fa;
		border: 2px solid #e0e0e0;
		border-radius: 8px;
		padding: 1.5rem;
		transition: all 0.3s ease;
	}

	.league-card:hover {
		border-color: #00316b;
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 49, 107, 0.1);
	}

	.league-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.league-header h3 {
		margin: 0;
		color: #00316b;
		font-size: 1.1rem;
	}

	.league-info {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.info-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.info-row .label {
		color: #666;
		font-size: 0.9rem;
	}

	.info-row .value {
		color: #333;
		font-weight: 600;
	}

	/* Help Section */
	.help-section {
		background: #f8f9fa;
		border: 2px solid #e0e0e0;
		border-radius: 12px;
		padding: 2rem;
	}

	.help-section h2 {
		color: #00316b;
		margin-top: 0;
		margin-bottom: 1rem;
	}

	.help-list {
		margin: 0;
		padding-left: 1.5rem;
	}

	.help-list li {
		margin-bottom: 1rem;
		line-height: 1.6;
		color: #555;
	}

	.help-list strong {
		color: #00316b;
	}

	@media (max-width: 768px) {
		.container {
			padding: 1rem;
		}

		.stats-grid {
			grid-template-columns: 1fr;
		}

		.leagues-grid {
			grid-template-columns: 1fr;
		}
	}
</style>