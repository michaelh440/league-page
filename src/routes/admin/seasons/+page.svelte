<script>
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	
	export let data;
	export let form;
	
	let { seasons, leagues, stats } = data;
	
	// Form state
	let showAddForm = false;
	let editingSeason = null;
	let deleteConfirm = null;
	
	// Form fields
	let formLeagueId = '';
	let formSeasonYear = new Date().getFullYear();
	let formPlatform = 'sleeper';
	let formIsActive = false;
	
	// Reactive statements
	$: seasons = data.seasons;
	$: leagues = data.leagues;
	$: stats = data.stats;
	
	// Reset form
	function resetForm() {
		showAddForm = false;
		editingSeason = null;
		formLeagueId = '';
		formSeasonYear = new Date().getFullYear();
		formPlatform = 'sleeper';
		formIsActive = false;
	}
	
	// Start editing
	function startEdit(season) {
		editingSeason = season.season_id;
		showAddForm = true;
		formLeagueId = season.league_id.toString();
		formSeasonYear = season.season_year;
		formPlatform = season.platform;
		formIsActive = season.is_active;
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
</script>

<svelte:head>
	<title>Admin - Manage Seasons</title>
</svelte:head>

<div class="admin-container">
	<!-- Header with Back Button -->
	<div class="page-nav">
		<a href="/admin" class="back-link">← Back to Dashboard</a>
	</div>
	
	<div class="admin-header">
		<div>
			<h1>⚡ Season Management</h1>
			<p>Manage fantasy football seasons across all leagues</p>
		</div>
		<button class="btn-add" on:click={() => { showAddForm = !showAddForm; if (!showAddForm) resetForm(); }}>
			{showAddForm ? '✕ Cancel' : '+ Add New Season'}
		</button>
	</div>
	
	<!-- Stats Cards -->
	<div class="stats-grid">
		<div class="stat-card">
			<div class="stat-label">Total Seasons</div>
			<div class="stat-value">{stats?.total_seasons || 0}</div>
		</div>
		<div class="stat-card">
			<div class="stat-label">Active Seasons</div>
			<div class="stat-value active">{stats?.active_seasons || 0}</div>
		</div>
		<div class="stat-card">
			<div class="stat-label">First Season</div>
			<div class="stat-value">{stats?.first_season || 'N/A'}</div>
		</div>
		<div class="stat-card">
			<div class="stat-label">Latest Season</div>
			<div class="stat-value">{stats?.latest_season || 'N/A'}</div>
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
			<h2>{editingSeason ? 'Edit Season' : 'Add New Season'}</h2>
			<form 
				method="POST" 
				action="?/{editingSeason ? 'update' : 'add'}"
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
				{#if editingSeason}
					<input type="hidden" name="season_id" value={editingSeason} />
				{/if}
				
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
				
				<div class="form-row">
					<div class="form-group">
						<label for="season_year">Season Year *</label>
						<input 
							type="number" 
							id="season_year"
							name="season_year" 
							bind:value={formSeasonYear}
							min="2000"
							max="2100"
							required
						/>
					</div>
					
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
				</div>
				
				<div class="form-group checkbox-group">
					<label>
						<input 
							type="checkbox" 
							name="is_active"
							bind:checked={formIsActive}
						/>
						<span>✓ Set as Active Season</span>
					</label>
					<small>Only one season per league can be active at a time</small>
				</div>
				
				<div class="form-actions">
					<button type="submit" class="btn-primary">
						{editingSeason ? 'Update Season' : 'Create Season'}
					</button>
					<button type="button" class="btn-secondary" on:click={resetForm}>
						Cancel
					</button>
				</div>
			</form>
		</div>
	{/if}
	
	<!-- Seasons Table -->
	<div class="table-card">
		<h2>All Seasons</h2>
		
		{#if seasons.length === 0}
			<div class="empty-state">
				<p>⚡ No seasons yet</p>
				<p>Click "Add New Season" to get started!</p>
			</div>
		{:else}
			<div class="table-responsive">
				<table>
					<thead>
						<tr>
							<th>Year</th>
							<th>League</th>
							<th>Platform</th>
							<th>Status</th>
							<th>Teams</th>
							<th>Videos</th>
							<th>Created</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each seasons as season (season.season_id)}
							<tr class:active-row={season.is_active}>
								<td>
									<strong>{season.season_year}</strong>
									{#if season.is_active}
										<span class="active-badge">Active</span>
									{/if}
								</td>
								<td>{season.league_name || 'Unknown League'}</td>
								<td>
									<span class="platform-badge" style="background: {getPlatformColor(season.platform)}">
										{season.platform}
									</span>
								</td>
								<td>
									{#if season.is_active}
										<span class="status-badge status-active">● Active</span>
									{:else}
										<span class="status-badge status-inactive">○ Inactive</span>
									{/if}
								</td>
								<td>{season.team_count || 0}</td>
								<td>{season.video_count || 0}</td>
								<td>{formatDate(season.created_at)}</td>
								<td>
									<div class="action-buttons">
										{#if !season.is_active}
											<form method="POST" action="?/toggleActive" use:enhance={() => {
												return async ({ update }) => {
													await update();
													await invalidateAll();
												};
											}}>
												<input type="hidden" name="season_id" value={season.season_id} />
												<input type="hidden" name="league_id" value={season.league_id} />
												<button type="submit" class="btn-icon" title="Set as Active">
													⚡
												</button>
											</form>
										{/if}
										
										<button 
											class="btn-icon" 
											title="Edit"
											on:click={() => startEdit(season)}
										>
											✏️
										</button>
										
										<button 
											class="btn-icon btn-danger" 
											title="Delete"
											on:click={() => deleteConfirm = season.season_id}
										>
											🗑️
										</button>
									</div>
									
									{#if deleteConfirm === season.season_id}
										<div class="delete-confirm">
											<p>Delete {season.season_year}?</p>
											<form method="POST" action="?/delete" use:enhance={() => {
												return async ({ update }) => {
													await update();
													await invalidateAll();
													deleteConfirm = null;
												};
											}}>
												<input type="hidden" name="season_id" value={season.season_id} />
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
	
	.stat-value.active {
		color: #10b981;
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
	
	.checkbox-group label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
	}
	
	.checkbox-group input[type="checkbox"] {
		width: auto;
		margin: 0;
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
	
	tbody tr.active-row {
		background: #f0fdf4;
	}
	
	tbody tr.active-row:hover {
		background: #dcfce7;
	}
	
	.action-buttons {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}
	
	.active-badge {
		display: inline-block;
		background: #10b981;
		color: white;
		padding: 0.25rem 0.5rem;
		border-radius: 12px;
		font-size: 0.75rem;
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