<script>
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	
	export let data;
	export let form;
	
	let { syncHistory, leagues, stagingCounts, recentActivity } = data;
	
	// Form state
	let showSyncForm = false;
	let selectedLeague = '';
	let selectedSeason = '';
	let selectedWeek = '';
	
	// Reactive statements
	$: syncHistory = data.syncHistory;
	$: leagues = data.leagues;
	$: stagingCounts = data.stagingCounts;
	$: recentActivity = data.recentActivity;
	
	// Format date
	function formatDate(dateString) {
		if (!dateString) return 'Never';
		return new Date(dateString).toLocaleString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
	
	// Format number with commas
	function formatNumber(num) {
		return num?.toLocaleString() || '0';
	}
</script>

<svelte:head>
	<title>Admin - Sleeper Data Integration</title>
</svelte:head>

<div class="admin-container">
	<!-- Header with Back Button -->
	<div class="page-nav">
		<a href="/admin" class="back-link">← Back to Dashboard</a>
	</div>
	
	<div class="admin-header">
		<div>
			<h1>⚡ Sleeper Data Integration</h1>
			<p>Sync and manage data from Sleeper fantasy football platform</p>
		</div>
	</div>
	
	{#if form?.error}
		<div class="alert alert-error">
			❌ {form.error}
		</div>
	{/if}
	
	{#if form?.success}
		<div class="alert alert-success">
			✅ {form.message}
		</div>
	{/if}
	
	<!-- Quick Actions -->
	<div class="actions-card">
		<h2>Quick Actions</h2>
		<div class="actions-grid">
			<button class="action-btn action-primary" on:click={() => showSyncForm = !showSyncForm}>
				🔄 Sync League Data
			</button>
			<button class="action-btn action-secondary">
				📊 View Sync Logs
			</button>
			<button class="action-btn action-secondary">
				⚙️ Sync Settings
			</button>
		</div>
	</div>
	
	<!-- Sync Form -->
	{#if showSyncForm}
		<div class="form-card">
			<h2>Sync Sleeper Data</h2>
			<p class="help-text">Select a league and week to sync data from Sleeper</p>
			
			<form 
				method="POST" 
				action="?/syncWeek"
				use:enhance={() => {
					return async ({ result, update }) => {
						await update();
						if (result.type === 'success') {
							showSyncForm = false;
							await invalidateAll();
						}
					};
				}}
			>
				<div class="form-group">
					<label for="league_id">League *</label>
					<select 
						id="league_id"
						name="league_id" 
						bind:value={selectedLeague}
						required
					>
						<option value="">Select League</option>
						{#each leagues as league}
							<option value={league.league_id}>
								{league.league_name} ({league.league_year})
							</option>
						{/each}
					</select>
				</div>
				
				<div class="form-row">
					<div class="form-group">
						<label for="season_id">Season ID</label>
						<input 
							type="number" 
							id="season_id"
							name="season_id" 
							bind:value={selectedSeason}
							placeholder="12"
						/>
					</div>
					
					<div class="form-group">
						<label for="week">Week *</label>
						<input 
							type="number" 
							id="week"
							name="week" 
							bind:value={selectedWeek}
							min="1"
							max="18"
							placeholder="1-18"
							required
						/>
					</div>
				</div>
				
				<div class="form-actions">
					<button type="submit" class="btn-primary">
						🔄 Start Sync
					</button>
					<button type="button" class="btn-secondary" on:click={() => showSyncForm = false}>
						Cancel
					</button>
				</div>
			</form>
			
			<div class="info-box">
				<strong>Note:</strong> This will fetch data from Sleeper API and import it into the database. 
				The sync process may take a few minutes depending on the amount of data.
			</div>
		</div>
	{/if}
	
	<!-- Sync Status Overview -->
	<div class="grid-2-col">
		<div class="card">
			<h2>📊 Data Overview</h2>
			<div class="stats-list">
				{#each syncHistory as stat}
					<div class="stat-row">
						<div class="stat-info">
							<span class="stat-label">{stat.table_name}</span>
							<span class="stat-date">Last sync: {formatDate(stat.last_sync)}</span>
						</div>
						<span class="stat-count">{formatNumber(stat.record_count)}</span>
					</div>
				{/each}
			</div>
		</div>
		
		<div class="card">
			<h2>🗄️ Staging Tables</h2>
			<div class="stats-list">
				<div class="stat-row">
					<div class="stat-info">
						<span class="stat-label">Staging Matchups</span>
						<span class="stat-date">Pending records</span>
					</div>
					<div class="stat-actions">
						<span class="stat-count">{formatNumber(stagingCounts.staging_sleeper_matchups)}</span>
						{#if stagingCounts.staging_sleeper_matchups > 0}
							<form method="POST" action="?/processStaging" use:enhance={() => {
								return async ({ update }) => {
									await update();
									await invalidateAll();
								};
							}}>
								<input type="hidden" name="table_name" value="staging_sleeper_matchups" />
								<button type="submit" class="btn-icon" title="Process">▶️</button>
							</form>
							<form method="POST" action="?/clearStaging" use:enhance={() => {
								return async ({ update }) => {
									await update();
									await invalidateAll();
								};
							}}>
								<input type="hidden" name="table_name" value="staging_sleeper_matchups" />
								<button type="submit" class="btn-icon btn-danger" title="Clear">🗑️</button>
							</form>
						{/if}
					</div>
				</div>
				
				<div class="stat-row">
					<div class="stat-info">
						<span class="stat-label">Staging Rosters</span>
						<span class="stat-date">Pending records</span>
					</div>
					<div class="stat-actions">
						<span class="stat-count">{formatNumber(stagingCounts.staging_sleeper_rosters)}</span>
						{#if stagingCounts.staging_sleeper_rosters > 0}
							<form method="POST" action="?/processStaging" use:enhance={() => {
								return async ({ update }) => {
									await update();
									await invalidateAll();
								};
							}}>
								<input type="hidden" name="table_name" value="staging_sleeper_rosters" />
								<button type="submit" class="btn-icon" title="Process">▶️</button>
							</form>
							<form method="POST" action="?/clearStaging" use:enhance={() => {
								return async ({ update }) => {
									await update();
									await invalidateAll();
								};
							}}>
								<input type="hidden" name="table_name" value="staging_sleeper_rosters" />
								<button type="submit" class="btn-icon btn-danger" title="Clear">🗑️</button>
							</form>
						{/if}
					</div>
				</div>
			</div>
			
			<div class="info-box">
				<strong>Staging tables</strong> hold temporary data before it's processed and moved to main tables.
			</div>
		</div>
	</div>
	
	<!-- Sleeper Leagues -->
	<div class="card">
		<h2>🏈 Sleeper Leagues</h2>
		
		{#if leagues.length === 0}
			<div class="empty-state">
				<p>⚡ No Sleeper leagues configured</p>
				<p>Add a league with platform set to "Sleeper" in the Leagues section</p>
			</div>
		{:else}
			<div class="table-responsive">
				<table>
					<thead>
						<tr>
							<th>League Name</th>
							<th>Platform ID</th>
							<th>Year</th>
							<th>Seasons</th>
							<th>Teams</th>
							<th>Status</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each leagues as league}
							<tr>
								<td><strong>{league.league_name}</strong></td>
								<td class="mono">{league.platform_id}</td>
								<td>{league.league_year}</td>
								<td>{league.season_count || 0}</td>
								<td>{league.team_count || 0}</td>
								<td>
									{#if league.has_active_season}
										<span class="status-badge status-active">● Active</span>
									{:else}
										<span class="status-badge status-inactive">○ Inactive</span>
									{/if}
								</td>
								<td>
									<form method="POST" action="?/syncLeague" use:enhance={() => {
										return async ({ update }) => {
											await update();
											await invalidateAll();
										};
									}}>
										<input type="hidden" name="league_id" value={league.league_id} />
										<button type="submit" class="btn-sync" title="Sync League">
											🔄 Sync
										</button>
									</form>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
	
	<!-- Recent Activity -->
	<div class="card">
		<h2>📋 Recent Activity</h2>
		
		{#if recentActivity.length === 0}
			<div class="empty-state-small">
				<p>No recent activity</p>
			</div>
		{:else}
			<div class="activity-list">
				{#each recentActivity as activity}
					<div class="activity-item">
						<div class="activity-icon">⚡</div>
						<div class="activity-content">
							<div class="activity-description">{activity.description}</div>
							<div class="activity-date">{formatDate(activity.created_at)}</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	.admin-container {
		max-width: 1400px;
		margin: 0 auto;
		padding: 2rem;
	}
	
	.page-nav {
		margin-bottom: 1rem;
	}
	
	.back-link {
		color: #3b82f6;
		text-decoration: none;
		font-weight: 500;
		font-size: 0.95rem;
		transition: color 0.2s;
	}
	
	.back-link:hover {
		color: #2563eb;
		text-decoration: underline;
	}
	
	.admin-header {
		margin-bottom: 2rem;
		padding-bottom: 1rem;
		border-bottom: 2px solid #00316b;
	}
	
	.admin-header h1 {
		color: #00316b;
		margin: 0 0 0.5rem 0;
		font-size: 2rem;
	}
	
	.admin-header p {
		color: #666;
		margin: 0;
	}
	
	/* Alerts */
	.alert {
		padding: 1rem;
		border-radius: 8px;
		margin-bottom: 1rem;
		font-weight: 500;
	}
	
	.alert-error {
		background-color: #fee;
		color: #c00;
		border: 1px solid #fcc;
	}
	
	.alert-success {
		background-color: #efe;
		color: #070;
		border: 1px solid #cfc;
	}
	
	/* Actions Card */
	.actions-card {
		background: white;
		border: 2px solid #00316b;
		border-radius: 12px;
		padding: 2rem;
		margin-bottom: 2rem;
	}
	
	.actions-card h2 {
		color: #00316b;
		margin: 0 0 1.5rem 0;
	}
	
	.actions-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
	}
	
	.action-btn {
		padding: 1.5rem;
		border: 2px solid;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		text-align: center;
	}
	
	.action-primary {
		background: #00316b;
		border-color: #00316b;
		color: white;
	}
	
	.action-primary:hover {
		background: #0055aa;
		transform: translateY(-2px);
	}
	
	.action-secondary {
		background: white;
		border-color: #e5e7eb;
		color: #374151;
	}
	
	.action-secondary:hover {
		border-color: #00316b;
		color: #00316b;
	}
	
	/* Grid Layouts */
	.grid-2-col {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem;
		margin-bottom: 2rem;
	}
	
	/* Cards */
	.card {
		background: white;
		border: 2px solid #e5e7eb;
		border-radius: 12px;
		padding: 2rem;
		margin-bottom: 2rem;
	}
	
	.card h2 {
		color: #00316b;
		margin: 0 0 1.5rem 0;
		font-size: 1.25rem;
	}
	
	/* Stats List */
	.stats-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	
	.stat-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		background: #f9fafb;
		border-radius: 8px;
	}
	
	.stat-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	
	.stat-label {
		font-weight: 600;
		color: #374151;
		text-transform: capitalize;
	}
	
	.stat-date {
		font-size: 0.875rem;
		color: #6b7280;
	}
	
	.stat-count {
		font-size: 1.5rem;
		font-weight: 700;
		color: #00316b;
	}
	
	.stat-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	
	/* Buttons */
	button {
		cursor: pointer;
		border: none;
		border-radius: 6px;
		font-weight: 600;
		transition: all 0.2s;
	}
	
	.btn-primary {
		background-color: #00316b;
		color: white;
		padding: 0.75rem 1.5rem;
		font-size: 1rem;
	}
	
	.btn-primary:hover {
		background-color: #0055aa;
	}
	
	.btn-secondary {
		background-color: #6c757d;
		color: white;
		padding: 0.75rem 1.5rem;
		font-size: 1rem;
	}
	
	.btn-secondary:hover {
		background-color: #5a6268;
	}
	
	.btn-sync {
		background-color: #00ceb8;
		color: white;
		padding: 0.5rem 1rem;
		font-size: 0.875rem;
	}
	
	.btn-sync:hover {
		background-color: #00b5a0;
	}
	
	.btn-icon {
		background: white;
		border: 1px solid #ddd;
		padding: 0.5rem;
		font-size: 1rem;
	}
	
	.btn-icon:hover {
		background-color: #f8f9fa;
		transform: scale(1.1);
	}
	
	.btn-danger {
		color: #c00;
	}
	
	.btn-danger:hover {
		background-color: #fee;
		border-color: #fcc;
	}
	
	/* Form */
	.form-card {
		background: white;
		border: 2px solid #00316b;
		border-radius: 12px;
		padding: 2rem;
		margin-bottom: 2rem;
	}
	
	.form-card h2 {
		color: #00316b;
		margin-top: 0;
		margin-bottom: 0.5rem;
	}
	
	.help-text {
		color: #666;
		margin: 0 0 1.5rem 0;
	}
	
	.form-group {
		margin-bottom: 1.5rem;
	}
	
	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}
	
	label {
		display: block;
		font-weight: 600;
		color: #333;
		margin-bottom: 0.5rem;
	}
	
	input[type="text"],
	input[type="number"],
	select {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #ddd;
		border-radius: 6px;
		font-size: 1rem;
	}
	
	input:focus,
	select:focus {
		outline: none;
		border-color: #00316b;
		box-shadow: 0 0 0 3px rgba(0, 49, 107, 0.1);
	}
	
	.form-actions {
		display: flex;
		gap: 1rem;
		margin-top: 2rem;
	}
	
	.info-box {
		background: #eff6ff;
		border: 1px solid #bfdbfe;
		border-radius: 8px;
		padding: 1rem;
		margin-top: 1.5rem;
		font-size: 0.875rem;
		color: #1e40af;
	}
	
	.info-box strong {
		font-weight: 600;
	}
	
	/* Table */
	.table-responsive {
		overflow-x: auto;
	}
	
	table {
		width: 100%;
		border-collapse: collapse;
	}
	
	th {
		text-align: left;
		padding: 0.75rem;
		background: #f9fafb;
		border-bottom: 2px solid #e5e7eb;
		font-weight: 600;
		color: #374151;
		font-size: 0.875rem;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}
	
	td {
		padding: 1rem 0.75rem;
		border-bottom: 1px solid #e5e7eb;
		color: #1f2937;
	}
	
	tbody tr:hover {
		background: #f9fafb;
	}
	
	.mono {
		font-family: 'Courier New', monospace;
		font-size: 0.875rem;
		color: #6b7280;
	}
	
	.status-badge {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.75rem;
		font-weight: 600;
	}
	
	.status-badge.status-active {
		background: #d1fae5;
		color: #065f46;
	}
	
	.status-badge.status-inactive {
		background: #f3f4f6;
		color: #6b7280;
	}
	
	/* Activity List */
	.activity-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	
	.activity-item {
		display: flex;
		align-items: start;
		gap: 1rem;
		padding: 1rem;
		background: #f9fafb;
		border-radius: 8px;
	}
	
	.activity-icon {
		font-size: 1.5rem;
	}
	
	.activity-content {
		flex: 1;
	}
	
	.activity-description {
		font-weight: 500;
		color: #374151;
		margin-bottom: 0.25rem;
	}
	
	.activity-date {
		font-size: 0.875rem;
		color: #6b7280;
	}
	
	/* Empty States */
	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
		color: #666;
	}
	
	.empty-state p:first-child {
		font-size: 3rem;
		margin-bottom: 1rem;
	}
	
	.empty-state p:last-child {
		font-size: 1.25rem;
		color: #999;
	}
	
	.empty-state-small {
		text-align: center;
		padding: 2rem;
		color: #999;
	}
	
	@media (max-width: 1200px) {
		.grid-2-col {
			grid-template-columns: 1fr;
		}
		
		.actions-grid {
			grid-template-columns: 1fr;
		}
	}
	
	@media (max-width: 768px) {
		.admin-container {
			padding: 1rem;
		}
		
		.form-row {
			grid-template-columns: 1fr;
		}
		
		.table-responsive {
			overflow-x: scroll;
		}
		
		.form-actions {
			flex-direction: column;
		}
	}
</style>