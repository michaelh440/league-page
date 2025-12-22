<script>
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	
	export let data;
	export let form;
	
	let { seasons, stats } = data;
	
	// Selection state for bulk operations
	let selectedSeasons = new Set();
	let selectAll = false;
	
	// Reactive statements
	$: seasons = data.seasons;
	$: stats = data.stats;
	
	// Toggle individual selection
	function toggleSelection(seasonId) {
		if (selectedSeasons.has(seasonId)) {
			selectedSeasons.delete(seasonId);
		} else {
			selectedSeasons.add(seasonId);
		}
		selectedSeasons = selectedSeasons; // Trigger reactivity
		
		// Update selectAll state
		selectAll = selectedSeasons.size === seasons.length;
	}
	
	// Toggle all selections
	function toggleSelectAll() {
		if (selectAll) {
			selectedSeasons = new Set();
		} else {
			selectedSeasons = new Set(seasons.map(s => s.season_id));
		}
		selectAll = !selectAll;
	}
	
	// Clear selections after form submission
	function clearSelections() {
		selectedSeasons = new Set();
		selectAll = false;
	}
	
	// Get manager display name
	function getManagerName(season) {
		if (season.disputed_championship) return 'DISPUTED';
		if (!season.manager_id) return 'No Champion';
		return season.username || season.real_name || `Manager ${season.manager_id}`;
	}
	
	// Get row status class
	function getRowClass(season) {
		if (season.disputed_championship) return 'disputed-row';
		if (!season.manager_id) return 'no-champion-row';
		return '';
	}
</script>

<svelte:head>
	<title>Admin - Disputed Championships</title>
</svelte:head>

<div class="admin-container">
	<!-- Header with Back Button -->
	<div class="page-nav">
		<a href="/admin" class="back-link">← Back to Dashboard</a>
	</div>
	
	<div class="admin-header">
		<div>
			<h1>🏆 Disputed Championships</h1>
			<p>Mark championships that should not be credited to any manager</p>
		</div>
	</div>
	
	<!-- Stats Cards -->
	<div class="stats-grid">
		<div class="stat-card">
			<div class="stat-label">Total Seasons</div>
			<div class="stat-value">{stats?.total_seasons || 0}</div>
		</div>
		<div class="stat-card">
			<div class="stat-label">Disputed Championships</div>
			<div class="stat-value disputed">{stats?.disputed_count || 0}</div>
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
	
	<!-- Info Box -->
	<div class="info-box">
		<h3>ℹ️ About Disputed Championships</h3>
		<p>
			Marking a season as "disputed" will remove that championship from:
		</p>
		<ul>
			<li>The Wall of Champions on the home page</li>
			<li>The Championship counts in the rankings page</li>
			<li>Manager championship statistics</li>
		</ul>
		<p>
			Use this for seasons where the championship result is contested, 
			the league had issues, or the winner should not receive credit.
		</p>
	</div>
	
	<!-- Bulk Actions -->
	{#if selectedSeasons.size > 0}
		<div class="bulk-actions">
			<span class="selection-count">{selectedSeasons.size} season(s) selected</span>
			<form 
				method="POST" 
				action="?/bulkUpdate"
				use:enhance={() => {
					return async ({ update }) => {
						await update();
						await invalidateAll();
						clearSelections();
					};
				}}
			>
				{#each [...selectedSeasons] as seasonId}
					<input type="hidden" name="season_ids" value={seasonId} />
				{/each}
				<button type="submit" name="action" value="dispute" class="btn-bulk btn-dispute">
					⚠️ Mark as Disputed
				</button>
				<button type="submit" name="action" value="restore" class="btn-bulk btn-restore">
					✅ Restore Championships
				</button>
			</form>
			<button class="btn-clear" on:click={clearSelections}>
				Clear Selection
			</button>
		</div>
	{/if}
	
	<!-- Seasons Table -->
	<div class="table-card">
		<h2>All Seasons</h2>
		
		{#if seasons.length === 0}
			<div class="empty-state">
				<p>🏆 No seasons found</p>
				<p>Add seasons in the Season Management page first.</p>
			</div>
		{:else}
			<div class="table-responsive">
				<table>
					<thead>
						<tr>
							<th class="checkbox-col">
								<input 
									type="checkbox" 
									checked={selectAll}
									on:change={toggleSelectAll}
									title="Select all"
								/>
							</th>
							<th>Year</th>
							<th>Champion</th>
							<th>League</th>
							<th>Status</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each seasons as season (season.season_id)}
							<tr class={getRowClass(season)}>
								<td class="checkbox-col">
									<input 
										type="checkbox" 
										checked={selectedSeasons.has(season.season_id)}
										on:change={() => toggleSelection(season.season_id)}
									/>
								</td>
								<td>
									<strong>{season.season_year}</strong>
								</td>
								<td class="champion-cell">
									{#if season.disputed_championship}
										<span class="disputed-badge">⚠️ DISPUTED</span>
									{:else if season.manager_id}
										<div class="champion-info">
											{#if season.logo_url}
												<img 
													src={season.logo_url} 
													alt={getManagerName(season)} 
													class="champion-avatar" 
												/>
											{/if}
											<span>{getManagerName(season)}</span>
										</div>
									{:else}
										<span class="no-champion">No Champion Recorded</span>
									{/if}
								</td>
								<td>{season.league_name || 'Unknown'}</td>
								<td>
									{#if season.disputed_championship}
										<span class="status-badge status-disputed">⚠️ Disputed</span>
									{:else}
										<span class="status-badge status-valid">✓ Valid</span>
									{/if}
								</td>
								<td>
									<form 
										method="POST" 
										action="?/toggleDisputed"
										use:enhance={() => {
											return async ({ update }) => {
												await update();
												await invalidateAll();
											};
										}}
									>
										<input type="hidden" name="season_id" value={season.season_id} />
										<input type="hidden" name="current_status" value={season.disputed_championship} />
										
										{#if season.disputed_championship}
											<button type="submit" class="btn-action btn-restore-single" title="Restore Championship">
												✅ Restore
											</button>
										{:else}
											<button type="submit" class="btn-action btn-dispute-single" title="Mark as Disputed">
												⚠️ Dispute
											</button>
										{/if}
									</form>
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
		max-width: 1200px;
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
	
	.stat-value.disputed {
		color: #dc2626;
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
	
	/* Info Box */
	.info-box {
		background: #f0f9ff;
		border: 1px solid #0ea5e9;
		border-radius: 8px;
		padding: 1.5rem;
		margin-bottom: 2rem;
	}
	
	.info-box h3 {
		color: #0369a1;
		margin: 0 0 0.75rem 0;
		font-size: 1.1rem;
	}
	
	.info-box p {
		color: #0c4a6e;
		margin: 0 0 0.5rem 0;
		line-height: 1.5;
	}
	
	.info-box ul {
		color: #0c4a6e;
		margin: 0.5rem 0;
		padding-left: 1.5rem;
	}
	
	.info-box li {
		margin-bottom: 0.25rem;
	}
	
	/* Bulk Actions */
	.bulk-actions {
		display: flex;
		align-items: center;
		gap: 1rem;
		background: #fef3c7;
		border: 1px solid #f59e0b;
		border-radius: 8px;
		padding: 1rem;
		margin-bottom: 1.5rem;
		flex-wrap: wrap;
	}
	
	.selection-count {
		font-weight: 600;
		color: #92400e;
	}
	
	.bulk-actions form {
		display: flex;
		gap: 0.5rem;
	}
	
	.btn-bulk {
		padding: 0.5rem 1rem;
		border-radius: 6px;
		font-weight: 600;
		font-size: 0.875rem;
		cursor: pointer;
		border: none;
		transition: all 0.2s;
	}
	
	.btn-dispute {
		background: #dc2626;
		color: white;
	}
	
	.btn-dispute:hover {
		background: #b91c1c;
	}
	
	.btn-restore {
		background: #16a34a;
		color: white;
	}
	
	.btn-restore:hover {
		background: #15803d;
	}
	
	.btn-clear {
		padding: 0.5rem 1rem;
		border-radius: 6px;
		font-weight: 500;
		font-size: 0.875rem;
		cursor: pointer;
		border: 1px solid #d1d5db;
		background: white;
		color: #374151;
	}
	
	.btn-clear:hover {
		background: #f3f4f6;
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
	
	.checkbox-col {
		width: 50px;
		text-align: center;
	}
	
	.checkbox-col input[type="checkbox"] {
		width: 18px;
		height: 18px;
		cursor: pointer;
	}
	
	/* Row states */
	.disputed-row {
		background: #fef2f2;
	}
	
	.disputed-row:hover {
		background: #fee2e2;
	}
	
	.no-champion-row {
		background: #fffbeb;
	}
	
	.no-champion-row:hover {
		background: #fef3c7;
	}
	
	/* Champion Cell */
	.champion-cell {
		min-width: 200px;
	}
	
	.champion-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	
	.champion-avatar {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		object-fit: cover;
		border: 2px solid #fbbf24;
	}
	
	.disputed-badge {
		display: inline-block;
		background: #dc2626;
		color: white;
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.8rem;
		font-weight: 600;
	}
	
	.no-champion {
		color: #9ca3af;
		font-style: italic;
	}
	
	/* Status Badges */
	.status-badge {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.8rem;
		font-weight: 600;
	}
	
	.status-disputed {
		background: #fee2e2;
		color: #dc2626;
	}
	
	.status-valid {
		background: #dcfce7;
		color: #16a34a;
	}
	
	/* Action Buttons */
	.btn-action {
		padding: 0.5rem 1rem;
		border-radius: 6px;
		font-weight: 600;
		font-size: 0.875rem;
		cursor: pointer;
		border: none;
		transition: all 0.2s;
	}
	
	.btn-dispute-single {
		background: #fef2f2;
		color: #dc2626;
		border: 1px solid #fecaca;
	}
	
	.btn-dispute-single:hover {
		background: #fee2e2;
		border-color: #dc2626;
	}
	
	.btn-restore-single {
		background: #dcfce7;
		color: #16a34a;
		border: 1px solid #bbf7d0;
	}
	
	.btn-restore-single:hover {
		background: #bbf7d0;
		border-color: #16a34a;
	}
	
	/* Empty State */
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
		font-size: 1.1rem;
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
		
		.stats-grid {
			grid-template-columns: 1fr;
		}
		
		.bulk-actions {
			flex-direction: column;
			align-items: stretch;
		}
		
		.bulk-actions form {
			flex-direction: column;
		}
		
		.table-responsive {
			overflow-x: scroll;
		}
	}
</style>