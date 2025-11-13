<script>
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	
	export let data;
	export let form;
	
	let { teams, leagues, seasons, managers, stats } = data;
	
	// Form state
	let showAddForm = false;
	let editingTeam = null;
	let deleteConfirm = null;
	
	// Form fields
	let formLeagueId = '';
	let formSeasonId = '';
	let formManagerId = '';
	let formTeamName = '';
	let formPlatformTeamId = '';
	
	// Filtering
	let filterLeague = '';
	let filterSeason = '';
	let filterManager = '';
	
	// Reactive statements
	$: teams = data.teams;
	$: leagues = data.leagues;
	$: seasons = data.seasons;
	$: managers = data.managers;
	$: stats = data.stats;
	
	// Filtered teams
	$: filteredTeams = teams.filter(team => {
		if (filterLeague && team.league_id !== parseInt(filterLeague)) return false;
		if (filterSeason && team.season_id !== parseInt(filterSeason)) return false;
		if (filterManager && team.manager_id !== parseInt(filterManager)) return false;
		return true;
	});
	
	// Seasons for selected league
	$: availableSeasons = formLeagueId 
		? seasons.filter(s => s.league_id === parseInt(formLeagueId))
		: seasons;
	
	// Reset form
	function resetForm() {
		showAddForm = false;
		editingTeam = null;
		formLeagueId = '';
		formSeasonId = '';
		formManagerId = '';
		formTeamName = '';
		formPlatformTeamId = '';
	}
	
	// Start editing
	function startEdit(team) {
		editingTeam = team.team_id;
		showAddForm = true;
		formLeagueId = team.league_id.toString();
		formSeasonId = team.season_id.toString();
		formManagerId = team.manager_id.toString();
		formTeamName = team.team_name;
		formPlatformTeamId = team.platform_team_id || '';
	}
	
	// Format date
	function formatDate(dateString) {
		if (!dateString) return 'N/A';
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
	
	// Get platform badge color
	function getPlatformColor(platform) {
		switch(platform?.toLowerCase()) {
			case 'sleeper': return '#00ceb8';
			case 'yahoo': return '#6001d2';
			case 'espn': return '#ff0033';
			default: return '#999';
		}
	}
	
	// Get manager display name
	function getManagerName(team) {
		return team.manager_real_name || team.manager_username || 'Unknown';
	}
	
	// Clear filters
	function clearFilters() {
		filterLeague = '';
		filterSeason = '';
		filterManager = '';
	}
</script>

<svelte:head>
	<title>Admin - Manage Teams</title>
</svelte:head>

<div class="admin-container">
	<!-- Header with Back Button -->
	<div class="page-nav">
		<a href="/admin" class="back-link">← Back to Dashboard</a>
	</div>
	
	<div class="admin-header">
		<div>
			<h1>🏈 Team Management</h1>
			<p>Manage fantasy football teams across all leagues and seasons</p>
		</div>
		<button class="btn-add" on:click={() => { showAddForm = !showAddForm; if (!showAddForm) resetForm(); }}>
			{showAddForm ? '✕ Cancel' : '+ Add New Team'}
		</button>
	</div>
	
	<!-- Stats Cards -->
	<div class="stats-grid">
		<div class="stat-card">
			<div class="stat-label">Total Teams</div>
			<div class="stat-value">{stats?.total_teams || 0}</div>
		</div>
		<div class="stat-card">
			<div class="stat-label">Leagues</div>
			<div class="stat-value">{stats?.leagues_count || 0}</div>
		</div>
		<div class="stat-card">
			<div class="stat-label">Seasons</div>
			<div class="stat-value">{stats?.seasons_count || 0}</div>
		</div>
		<div class="stat-card">
			<div class="stat-label">Managers</div>
			<div class="stat-value">{stats?.managers_count || 0}</div>
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
	
	<!-- Add/Edit Form -->
	{#if showAddForm}
		<div class="form-card">
			<h2>{editingTeam ? 'Edit Team' : 'Add New Team'}</h2>
			<form 
				method="POST" 
				action="?/{editingTeam ? 'update' : 'add'}"
				use:enhance={() => {
					return async ({ result, update }) => {
						await update();
						if (result.type === 'success') {
							resetForm();
							await invalidateAll();
						}
					};
				}}
			>
				{#if editingTeam}
					<input type="hidden" name="team_id" value={editingTeam} />
				{/if}
				
				<div class="form-group">
					<label for="team_name">Team Name *</label>
					<input 
						type="text" 
						id="team_name"
						name="team_name" 
						bind:value={formTeamName}
						placeholder="The Destroyers"
						required
					/>
				</div>
				
				<div class="form-row">
					<div class="form-group">
						<label for="league_id">League *</label>
						<select 
							id="league_id"
							name="league_id" 
							bind:value={formLeagueId}
							required
						>
							<option value="">Select League</option>
							{#each leagues as league}
								<option value={league.league_id}>
									{league.league_name} ({league.platform})
								</option>
							{/each}
						</select>
					</div>
					
					<div class="form-group">
						<label for="season_id">Season *</label>
						<select 
							id="season_id"
							name="season_id" 
							bind:value={formSeasonId}
							required
							disabled={!formLeagueId}
						>
							<option value="">Select Season</option>
							{#each availableSeasons as season}
								<option value={season.season_id}>
									{season.season_display}
								</option>
							{/each}
						</select>
						{#if !formLeagueId}
							<small>Select a league first</small>
						{/if}
					</div>
				</div>
				
				<div class="form-row">
					<div class="form-group">
						<label for="manager_id">Manager *</label>
						<select 
							id="manager_id"
							name="manager_id" 
							bind:value={formManagerId}
							required
						>
							<option value="">Select Manager</option>
							{#each managers as manager}
								<option value={manager.manager_id}>
									{manager.real_name || manager.username}
								</option>
							{/each}
						</select>
					</div>
					
					<div class="form-group">
						<label for="platform_team_id">Platform Team ID</label>
						<input 
							type="text" 
							id="platform_team_id"
							name="platform_team_id" 
							bind:value={formPlatformTeamId}
							placeholder="Optional platform ID"
						/>
					</div>
				</div>
				
				<div class="form-actions">
					<button type="submit" class="btn-primary">
						{editingTeam ? 'Update Team' : 'Create Team'}
					</button>
					<button type="button" class="btn-secondary" on:click={resetForm}>
						Cancel
					</button>
				</div>
			</form>
		</div>
	{/if}
	
	<!-- Filters -->
	<div class="filters-card">
		<h3>Filter Teams</h3>
		<div class="filters-row">
			<div class="filter-group">
				<label for="filter_league">League</label>
				<select id="filter_league" bind:value={filterLeague}>
					<option value="">All Leagues</option>
					{#each leagues as league}
						<option value={league.league_id}>
							{league.league_name}
						</option>
					{/each}
				</select>
			</div>
			
			<div class="filter-group">
				<label for="filter_season">Season</label>
				<select id="filter_season" bind:value={filterSeason}>
					<option value="">All Seasons</option>
					{#each seasons as season}
						<option value={season.season_id}>
							{season.season_display}
						</option>
					{/each}
				</select>
			</div>
			
			<div class="filter-group">
				<label for="filter_manager">Manager</label>
				<select id="filter_manager" bind:value={filterManager}>
					<option value="">All Managers</option>
					{#each managers as manager}
						<option value={manager.manager_id}>
							{manager.real_name || manager.username}
						</option>
					{/each}
				</select>
			</div>
			
			<div class="filter-actions">
				<button class="btn-clear" on:click={clearFilters}>Clear Filters</button>
				<div class="filter-count">
					Showing {filteredTeams.length} of {teams.length} teams
				</div>
			</div>
		</div>
	</div>
	
	<!-- Teams Table -->
	<div class="table-card">
		<h2>All Teams</h2>
		
		{#if filteredTeams.length === 0}
			<div class="empty-state">
				{#if teams.length === 0}
					<p>🏈 No teams yet</p>
					<p>Click "Add New Team" to get started!</p>
				{:else}
					<p>🔍 No teams match your filters</p>
					<p>Try adjusting your filter criteria</p>
				{/if}
			</div>
		{:else}
			<div class="table-responsive">
				<table>
					<thead>
						<tr>
							<th>Team Name</th>
							<th>Manager</th>
							<th>League</th>
							<th>Season</th>
							<th>Platform</th>
							<th>Players</th>
							<th>Matchups</th>
							<th>Status</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each filteredTeams as team (team.team_id)}
							<tr class:active-season={team.season_is_active}>
								<td>
									<strong>{team.team_name}</strong>
									{#if team.platform_team_id}
										<div class="platform-id">{team.platform_team_id}</div>
									{/if}
								</td>
								<td>
									<div class="manager-cell">
										{#if team.manager_logo}
											<img src={team.manager_logo} alt={team.manager_username} class="manager-thumb" />
										{:else}
											<div class="manager-thumb-placeholder">
												{team.manager_username?.[0]?.toUpperCase() || 'M'}
											</div>
										{/if}
										<span>{getManagerName(team)}</span>
									</div>
								</td>
								<td>{team.league_name}</td>
								<td>
									{team.season_year}
									{#if team.season_is_active}
										<span class="active-badge">Active</span>
									{/if}
								</td>
								<td>
									<span class="platform-badge" style="background: {getPlatformColor(team.league_platform)}">
										{team.league_platform}
									</span>
								</td>
								<td>{team.player_count || 0}</td>
								<td>{team.matchup_count || 0}</td>
								<td>
									{#if team.season_is_active}
										<span class="status-badge status-active">● Active</span>
									{:else}
										<span class="status-badge status-inactive">○ Inactive</span>
									{/if}
								</td>
								<td>
									<div class="action-buttons">
										<button 
											class="btn-icon" 
											title="Edit"
											on:click={() => startEdit(team)}
										>
											✏️
										</button>
										
										<button 
											class="btn-icon btn-danger" 
											title="Delete"
											on:click={() => deleteConfirm = team.team_id}
										>
											🗑️
										</button>
									</div>
									
									{#if deleteConfirm === team.team_id}
										<div class="delete-confirm">
											<p>Delete {team.team_name}?</p>
											<form method="POST" action="?/delete" use:enhance={() => {
												return async ({ update }) => {
													await update();
													await invalidateAll();
													deleteConfirm = null;
												};
											}}>
												<input type="hidden" name="team_id" value={team.team_id} />
												<button type="submit" class="btn-danger-confirm">
													Yes
												</button>
											</form>
											<button 
												class="btn-secondary-small"
												on:click={() => deleteConfirm = null}
											>
												No
											</button>
										</div>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>

<style>
	.admin-container {
		max-width: 1600px;
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
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
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
	
	/* Stats Grid */
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 1.5rem;
		margin-bottom: 2rem;
	}
	
	.stat-card {
		background: white;
		border: 2px solid #e5e7eb;
		border-radius: 8px;
		padding: 1.5rem;
		text-align: center;
	}
	
	.stat-label {
		font-size: 0.875rem;
		color: #6b7280;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-bottom: 0.5rem;
	}
	
	.stat-value {
		font-size: 2.5rem;
		font-weight: 700;
		color: #00316b;
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
	
	/* Buttons */
	button {
		cursor: pointer;
		border: none;
		border-radius: 6px;
		padding: 0.75rem 1.5rem;
		font-size: 1rem;
		font-weight: 600;
		transition: all 0.2s;
	}
	
	.btn-add {
		background: linear-gradient(135deg, #00316b 0%, #0055aa 100%);
		color: white;
	}
	
	.btn-add:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 49, 107, 0.3);
	}
	
	.btn-primary {
		background-color: #00316b;
		color: white;
	}
	
	.btn-primary:hover {
		background-color: #0055aa;
	}
	
	.btn-secondary {
		background-color: #6c757d;
		color: white;
	}
	
	.btn-secondary:hover {
		background-color: #5a6268;
	}
	
	.btn-secondary-small {
		background-color: #6c757d;
		color: white;
		padding: 0.25rem 0.75rem;
		font-size: 0.875rem;
	}
	
	.btn-clear {
		background-color: #e5e7eb;
		color: #374151;
		padding: 0.5rem 1rem;
		font-size: 0.875rem;
	}
	
	.btn-clear:hover {
		background-color: #d1d5db;
	}
	
	.btn-icon {
		background: white;
		border: 1px solid #ddd;
		padding: 0.5rem 0.75rem;
		font-size: 1.2rem;
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
	
	.btn-danger-confirm {
		background-color: #dc3545;
		color: white;
		padding: 0.25rem 0.75rem;
		font-size: 0.875rem;
	}
	
	.btn-danger-confirm:hover {
		background-color: #c82333;
	}
	
	/* Form */
	.form-card {
		background: white;
		border: 2px solid #00316b;
		border-radius: 12px;
		padding: 2rem;
		margin-bottom: 2rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}
	
	.form-card h2 {
		color: #00316b;
		margin-top: 0;
		margin-bottom: 1.5rem;
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
	
	select:disabled {
		background-color: #f3f4f6;
		cursor: not-allowed;
	}
	
	small {
		display: block;
		color: #666;
		font-size: 0.875rem;
		margin-top: 0.25rem;
	}
	
	.form-actions {
		display: flex;
		gap: 1rem;
		margin-top: 2rem;
	}
	
	/* Filters */
	.filters-card {
		background: white;
		border: 2px solid #e5e7eb;
		border-radius: 12px;
		padding: 1.5rem;
		margin-bottom: 2rem;
	}
	
	.filters-card h3 {
		color: #00316b;
		margin: 0 0 1rem 0;
		font-size: 1.125rem;
	}
	
	.filters-row {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr auto;
		gap: 1rem;
		align-items: end;
	}
	
	.filter-group {
		display: flex;
		flex-direction: column;
	}
	
	.filter-group label {
		font-size: 0.875rem;
		margin-bottom: 0.5rem;
	}
	
	.filter-actions {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	
	.filter-count {
		font-size: 0.875rem;
		color: #666;
		text-align: center;
	}
	
	/* Table */
	.table-card {
		background: white;
		border: 2px solid #e5e7eb;
		border-radius: 12px;
		padding: 2rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
	}
	
	.table-card h2 {
		color: #00316b;
		margin-top: 0;
		margin-bottom: 1.5rem;
	}
	
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
	
	tbody tr.active-season {
		background: #f0fdf4;
	}
	
	tbody tr.active-season:hover {
		background: #dcfce7;
	}
	
	.action-buttons {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}
	
	.manager-cell {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	
	.manager-thumb {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		object-fit: cover;
	}
	
	.manager-thumb-placeholder {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: #00316b;
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		font-size: 0.875rem;
	}
	
	.platform-id {
		font-size: 0.75rem;
		color: #999;
		margin-top: 0.25rem;
		font-family: monospace;
	}
	
	.active-badge {
		display: inline-block;
		background: #10b981;
		color: white;
		padding: 0.125rem 0.5rem;
		border-radius: 12px;
		font-size: 0.7rem;
		font-weight: 600;
		margin-left: 0.5rem;
	}
	
	.platform-badge {
		display: inline-block;
		color: white;
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
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
	
	.delete-confirm {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		margin-top: 0.5rem;
		padding: 0.5rem;
		background: #fee;
		border-radius: 6px;
	}
	
	.delete-confirm p {
		margin: 0;
		flex: 1;
		font-weight: 600;
		color: #c00;
		font-size: 0.875rem;
	}
	
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
	
	@media (max-width: 1200px) {
		.stats-grid {
			grid-template-columns: repeat(2, 1fr);
		}
		
		.filters-row {
			grid-template-columns: 1fr 1fr;
		}
	}
	
	@media (max-width: 768px) {
		.admin-container {
			padding: 1rem;
		}
		
		.admin-header {
			flex-direction: column;
			gap: 1rem;
		}
		
		.stats-grid {
			grid-template-columns: 1fr;
		}
		
		.form-row {
			grid-template-columns: 1fr;
		}
		
		.filters-row {
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