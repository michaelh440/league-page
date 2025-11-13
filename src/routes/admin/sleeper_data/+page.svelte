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
						{#if season.sleeper_league_id} - Sleeper ID: {season.sleeper_league_id}{/if}
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
					<div class="info-item">
						<span class="label">Teams Synced:</span>
						<span class="value">{selectedSeasonData.team_count}</span>
					</div>
					<div class="info-item">
						<span class="label">Matchups Synced:</span>
						<span class="value">{selectedSeasonData.matchup_count}</span>
					</div>
				</div>
			</div>

			{#if !selectedSeasonData.sleeper_league_id}
				<div class="alert alert-warning">
					⚠️ This season doesn't have a Sleeper League ID set. You need to add the Sleeper League ID 
					to the league's platform_id field before syncing.
				</div>
			{:else}
				<!-- Sync Rosters/Teams -->
				<div class="sync-card">
					<h3>📋 Sync Teams/Rosters</h3>
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
					<h3>⚔️ Sync Week Matchups</h3>
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
					<h3>🚀 Full Season Sync</h3>
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
			{/if}
		{/if}
	</div>

	<!-- All Seasons List -->
	<div class="list-section">
		<h2>All Seasons</h2>
		{#if data.seasons.length === 0}
			<p class="empty-state">No seasons found. Create a season first in "Manage Seasons".</p>
		{:else}
			<div class="seasons-table">
				<table>
					<thead>
						<tr>
							<th>League</th>
							<th>Year</th>
							<th>Platform</th>
							<th>Sleeper ID</th>
							<th>Teams</th>
							<th>Matchups</th>
							<th>Status</th>
						</tr>
					</thead>
					<tbody>
						{#each data.seasons as season}
							<tr class:selected={selectedSeason == season.season_id}>
								<td>{season.league_name}</td>
								<td>{season.season_year}</td>
								<td>
									{#if season.platform}
										<span class="badge badge-blue">{season.platform}</span>
									{:else}
										<span class="badge badge-gray">Not Set</span>
									{/if}
								</td>
								<td>{season.sleeper_league_id || '-'}</td>
								<td>{season.team_count}</td>
								<td>{season.matchup_count}</td>
								<td>
									{#if season.is_active}
										<span class="badge badge-green">ACTIVE</span>
									{:else}
										<span class="badge badge-gray">Inactive</span>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>

	<!-- Help Section -->
	<div class="help-section">
		<h2>📖 How to Use</h2>
		<ol class="help-list">
			<li>
				<strong>Setup League:</strong> Make sure your league has a Sleeper League ID set in the 
				platform_id field (you can set this in "Manage Leagues").
			</li>
			<li><strong>Select Season:</strong> Choose the season you want to sync from the dropdown above.</li>
			<li>
				<strong>Sync Rosters First:</strong> Always sync rosters/teams before syncing matchups. 
				This imports all managers and their teams.
			</li>
			<li>
				<strong>Sync Matchups:</strong> Sync individual weeks as they complete, or use "Full Season Sync" 
				to import all weeks at once.
			</li>
			<li>
				<strong>Monitor Progress:</strong> The table below shows which seasons have data synced 
				(team count and matchup count).
			</li>
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

	.alert-warning {
		background-color: #fff3cd;
		color: #856404;
		border: 1px solid #ffeaa7;
		margin-top: 1rem;
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

	.season-info {
		background: #f8f9fa;
		border: 2px solid #e0e0e0;
		border-radius: 8px;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.season-info h3 {
		margin-top: 0;
		margin-bottom: 1rem;
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
		align-items: center;
	}

	.info-item .label {
		color: #666;
		font-size: 0.9rem;
	}

	.info-item .value {
		color: #333;
		font-weight: 600;
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

	.hint {
		font-style: italic;
		color: #00316b !important;
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

	.badge-green {
		background-color: #28a745;
		color: white;
	}

	.badge-gray {
		background-color: #6c757d;
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

	.seasons-table {
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	th {
		background: #f8f9fa;
		padding: 1rem;
		text-align: left;
		font-weight: 600;
		color: #00316b;
		border-bottom: 2px solid #e0e0e0;
	}

	td {
		padding: 1rem;
		border-bottom: 1px solid #e0e0e0;
	}

	tr.selected {
		background: #e3f2fd;
	}

	tbody tr:hover {
		background: #f8f9fa;
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

		.info-grid {
			grid-template-columns: 1fr;
		}
	}
</style>