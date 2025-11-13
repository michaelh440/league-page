<script>
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	
	export let data;
	export let form;
	
	let { leagues, managers, stats } = data;
	
	// Form state
	let showAddForm = false;
	let editingLeague = null;
	let deleteConfirm = null;
	
	// Form fields
	let formPlatformId = '';
	let formPlatform = 'sleeper';
	let formLeagueName = '';
	let formCommissionerId = '';
	let formMaxTeams = 12;
	let formRegSeasonLength = 14;
	let formScoringType = 'Half-PPR';
	let formLeagueYear = new Date().getFullYear();
	
	// Reactive statements
	$: leagues = data.leagues;
	$: managers = data.managers;
	$: stats = data.stats;
	
	// Reset form
	function resetForm() {
		showAddForm = false;
		editingLeague = null;
		formPlatformId = '';
		formPlatform = 'sleeper';
		formLeagueName = '';
		formCommissionerId = '';
		formMaxTeams = 12;
		formRegSeasonLength = 14;
		formScoringType = 'Half-PPR';
		formLeagueYear = new Date().getFullYear();
	}
	
	// Start editing
	function startEdit(league) {
		editingLeague = league.league_id;
		showAddForm = true;
		formPlatformId = league.platform_id;
		formPlatform = league.platform;
		formLeagueName = league.league_name;
		formCommissionerId = league.commissioner_id?.toString() || '';
		formMaxTeams = league.max_teams;
		formRegSeasonLength = league.reg_season_length;
		formScoringType = league.scoring_type;
		formLeagueYear = league.league_year;
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
	
	// Get commissioner display name
	function getCommissionerName(league) {
		if (!league.commissioner_id) return 'None';
		return league.commissioner_name || league.commissioner_real_name || `Manager ${league.commissioner_id}`;
	}
</script>

<svelte:head>
	<title>Admin - Manage Leagues</title>
</svelte:head>

<div class="admin-container">
	<!-- Header with Back Button -->
	<div class="page-nav">
		<a href="/admin" class="back-link">← Back to Dashboard</a>
	</div>
	
	<div class="admin-header">
		<div>
			<h1>🏈 League Management</h1>
			<p>Manage fantasy football leagues across all platforms</p>
		</div>
		<button class="btn-add" on:click={() => { showAddForm = !showAddForm; if (!showAddForm) resetForm(); }}>
			{showAddForm ? '✕ Cancel' : '+ Add New League'}
		</button>
	</div>
	
	<!-- Stats Cards -->
	<div class="stats-grid">
		<div class="stat-card">
			<div class="stat-label">Total Leagues</div>
			<div class="stat-value">{stats?.total_leagues || 0}</div>
		</div>
		<div class="stat-card">
			<div class="stat-label">Platforms</div>
			<div class="stat-value">{stats?.platforms_count || 0}</div>
		</div>
		<div class="stat-card">
			<div class="stat-label">Total Team Slots</div>
			<div class="stat-value">{stats?.total_team_slots || 0}</div>
		</div>
		<div class="stat-card">
			<div class="stat-label">Avg Season Length</div>
			<div class="stat-value">{Math.round(stats?.avg_season_length || 0)} wks</div>
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
			<h2>{editingLeague ? 'Edit League' : 'Add New League'}</h2>
			<form 
				method="POST" 
				action="?/{editingLeague ? 'update' : 'add'}"
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
				{#if editingLeague}
					<input type="hidden" name="league_id" value={editingLeague} />
				{/if}
				
				<div class="form-group">
					<label for="league_name">League Name *</label>
					<input 
						type="text" 
						id="league_name"
						name="league_name" 
						bind:value={formLeagueName}
						placeholder="2024 Dynasty League"
						required
					/>
				</div>
				
				<div class="form-row">
					<div class="form-group">
						<label for="platform">Platform *</label>
						<select 
							id="platform"
							name="platform" 
							bind:value={formPlatform}
							required
						>
							<option value="sleeper">Sleeper</option>
							<option value="yahoo">Yahoo</option>
							<option value="espn">ESPN</option>
						</select>
					</div>
					
					<div class="form-group">
						<label for="platform_id">Platform League ID *</label>
						<input 
							type="text" 
							id="platform_id"
							name="platform_id" 
							bind:value={formPlatformId}
							placeholder="1234567890"
							required
						/>
						<small>The unique ID from {formPlatform}</small>
					</div>
				</div>
				
				<div class="form-row">
					<div class="form-group">
						<label for="league_year">League Year *</label>
						<input 
							type="number" 
							id="league_year"
							name="league_year" 
							bind:value={formLeagueYear}
							min="2000"
							max="2100"
							required
						/>
					</div>
					
					<div class="form-group">
						<label for="commissioner_id">Commissioner</label>
						<select 
							id="commissioner_id"
							name="commissioner_id" 
							bind:value={formCommissionerId}
						>
							<option value="">None</option>
							{#each managers as manager}
								<option value={manager.manager_id}>
									{manager.username || manager.real_name || `Manager ${manager.manager_id}`}
								</option>
							{/each}
						</select>
					</div>
				</div>
				
				<div class="form-row">
					<div class="form-group">
						<label for="max_teams">Max Teams *</label>
						<input 
							type="number" 
							id="max_teams"
							name="max_teams" 
							bind:value={formMaxTeams}
							min="2"
							max="32"
							required
						/>
					</div>
					
					<div class="form-group">
						<label for="reg_season_length">Regular Season Length (weeks) *</label>
						<input 
							type="number" 
							id="reg_season_length"
							name="reg_season_length" 
							bind:value={formRegSeasonLength}
							min="1"
							max="18"
							required
						/>
					</div>
				</div>
				
				<div class="form-group">
					<label for="scoring_type">Scoring Type *</label>
					<select 
						id="scoring_type"
						name="scoring_type" 
						bind:value={formScoringType}
						required
					>
						<option value="PPR">PPR (Point Per Reception)</option>
						<option value="Half-PPR">Half-PPR</option>
						<option value="Standard">Standard (No PPR)</option>
					</select>
				</div>
				
				<div class="form-actions">
					<button type="submit" class="btn-primary">
						{editingLeague ? 'Update League' : 'Create League'}
					</button>
					<button type="button" class="btn-secondary" on:click={resetForm}>
						Cancel
					</button>
				</div>
			</form>
		</div>
	{/if}
	
	<!-- Leagues Table -->
	<div class="table-card">
		<h2>All Leagues</h2>
		
		{#if leagues.length === 0}
			<div class="empty-state">
				<p>🏈 No leagues yet</p>
				<p>Click "Add New League" to get started!</p>
			</div>
		{:else}
			<div class="table-responsive">
				<table>
					<thead>
						<tr>
							<th>League Name</th>
							<th>Platform</th>
							<th>Year</th>
							<th>Commissioner</th>
							<th>Teams</th>
							<th>Scoring</th>
							<th>Seasons</th>
							<th>Active</th>
							<th>Created</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each leagues as league (league.league_id)}
							<tr>
								<td>
									<strong>{league.league_name}</strong>
									<div class="platform-id">{league.platform_id}</div>
								</td>
								<td>
									<span class="platform-badge" style="background: {getPlatformColor(league.platform)}">
										{league.platform}
									</span>
								</td>
								<td>{league.league_year}</td>
								<td>{getCommissionerName(league)}</td>
								<td>
									{league.total_teams || 0} / {league.max_teams}
									<small>({league.reg_season_length} wks)</small>
								</td>
								<td>
									<span class="scoring-badge">{league.scoring_type}</span>
								</td>
								<td>{league.season_count || 0}</td>
								<td>
									{#if league.active_season_count > 0}
										<span class="status-badge status-active">● {league.active_season_count}</span>
									{:else}
										<span class="status-badge status-inactive">○ 0</span>
									{/if}
								</td>
								<td>{formatDate(league.created_at)}</td>
								<td>
									<div class="action-buttons">
										<button 
											class="btn-icon" 
											title="Edit"
											on:click={() => startEdit(league)}
										>
											✏️
										</button>
										
										<button 
											class="btn-icon btn-danger" 
											title="Delete"
											on:click={() => deleteConfirm = league.league_id}
										>
											🗑️
										</button>
									</div>
									
									{#if deleteConfirm === league.league_id}
										<div class="delete-confirm">
											<p>Delete {league.league_name}?</p>
											<form method="POST" action="?/delete" use:enhance={() => {
												return async ({ update }) => {
													await update();
													await invalidateAll();
													deleteConfirm = null;
												};
											}}>
												<input type="hidden" name="league_id" value={league.league_id} />
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
	
	.action-buttons {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}
	
	.platform-id {
		font-size: 0.75rem;
		color: #999;
		margin-top: 0.25rem;
		font-family: monospace;
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
	
	.scoring-badge {
		display: inline-block;
		background: #f3f4f6;
		color: #374151;
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.75rem;
		font-weight: 600;
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
		
		.table-responsive {
			overflow-x: scroll;
		}
		
		.form-actions {
			flex-direction: column;
		}
	}
</style>