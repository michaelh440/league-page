<script>
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	
	export let data;
	export let form;
	
	let { managers, stats } = data;
	
	// Form state
	let showAddForm = false;
	let editingManager = null;
	let deleteConfirm = null;
	let viewingManager = null;
	
	// Form fields - Basic
	let formUsername = '';
	let formEmail = '';
	let formRealName = '';
	let formTeamAlias = '';
	let formYearJoined = '';
	let formSleeperUserId = '';
	
	// Form fields - Profile
	let formLogoUrl = '';
	let formContactMethod = '';
	let formPhilosophy = '';
	let formFavoriteTeam = '';
	let formSignatureMoves = '';
	let formStrengths = '';
	let formWeaknesses = '';
	let formBiography = '';
	
	// Reactive statements
	$: managers = data.managers;
	$: stats = data.stats;
	
	// Reset form
	function resetForm() {
		showAddForm = false;
		editingManager = null;
		formUsername = '';
		formEmail = '';
		formRealName = '';
		formTeamAlias = '';
		formYearJoined = '';
		formSleeperUserId = '';
		formLogoUrl = '';
		formContactMethod = '';
		formPhilosophy = '';
		formFavoriteTeam = '';
		formSignatureMoves = '';
		formStrengths = '';
		formWeaknesses = '';
		formBiography = '';
	}
	
	// Start editing
	function startEdit(manager) {
		editingManager = manager.manager_id;
		showAddForm = true;
		formUsername = manager.username;
		formEmail = manager.email;
		formRealName = manager.real_name || '';
		formTeamAlias = manager.team_alias || '';
		formYearJoined = manager.year_joined?.toString() || '';
		formSleeperUserId = manager.sleeper_user_id || '';
		formLogoUrl = manager.logo_url || '';
		formContactMethod = manager.contact_method || '';
		formPhilosophy = manager.philosophy || '';
		formFavoriteTeam = manager.favorite_team || '';
		formSignatureMoves = manager.signature_moves || '';
		formStrengths = manager.strengths || '';
		formWeaknesses = manager.weaknesses || '';
		formBiography = manager.biography || '';
	}
	
	// View manager details
	function viewManager(manager) {
		viewingManager = manager;
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
	
	// Get display name
	function getDisplayName(manager) {
		return manager.real_name || manager.username;
	}
</script>

<svelte:head>
	<title>Admin - Manage Managers</title>
</svelte:head>

<div class="admin-container">
	<!-- Header with Back Button -->
	<div class="page-nav">
		<a href="/admin" class="back-link">← Back to Dashboard</a>
	</div>
	
	<div class="admin-header">
		<div>
			<h1>👥 Manager Management</h1>
			<p>Manage fantasy football league managers and their profiles</p>
		</div>
		<button class="btn-add" on:click={() => { showAddForm = !showAddForm; if (!showAddForm) resetForm(); }}>
			{showAddForm ? '✕ Cancel' : '+ Add New Manager'}
		</button>
	</div>
	
	<!-- Stats Cards -->
	<div class="stats-grid">
		<div class="stat-card">
			<div class="stat-label">Total Managers</div>
			<div class="stat-value">{stats?.total_managers || 0}</div>
		</div>
		<div class="stat-card">
			<div class="stat-label">With Join Year</div>
			<div class="stat-value">{stats?.managers_with_join_year || 0}</div>
		</div>
		<div class="stat-card">
			<div class="stat-label">Earliest Join</div>
			<div class="stat-value">{stats?.earliest_join_year || 'N/A'}</div>
		</div>
		<div class="stat-card">
			<div class="stat-label">Latest Join</div>
			<div class="stat-value">{stats?.latest_join_year || 'N/A'}</div>
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
			<h2>{editingManager ? 'Edit Manager' : 'Add New Manager'}</h2>
			<form 
				method="POST" 
				action="?/{editingManager ? 'update' : 'add'}"
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
				{#if editingManager}
					<input type="hidden" name="manager_id" value={editingManager} />
				{/if}
				
				<h3>Basic Information</h3>
				
				<div class="form-row">
					<div class="form-group">
						<label for="username">Username *</label>
						<input 
							type="text" 
							id="username"
							name="username" 
							bind:value={formUsername}
							placeholder="johndoe"
							required
						/>
					</div>
					
					<div class="form-group">
						<label for="email">Email *</label>
						<input 
							type="email" 
							id="email"
							name="email" 
							bind:value={formEmail}
							placeholder="john@example.com"
							required
						/>
					</div>
				</div>
				
				<div class="form-row">
					<div class="form-group">
						<label for="real_name">Real Name</label>
						<input 
							type="text" 
							id="real_name"
							name="real_name" 
							bind:value={formRealName}
							placeholder="John Doe"
						/>
					</div>
					
					<div class="form-group">
						<label for="team_alias">Team Alias</label>
						<input 
							type="text" 
							id="team_alias"
							name="team_alias" 
							bind:value={formTeamAlias}
							placeholder="The Destroyers"
						/>
					</div>
				</div>
				
				<div class="form-row">
					<div class="form-group">
						<label for="year_joined">Year Joined</label>
						<input 
							type="number" 
							id="year_joined"
							name="year_joined" 
							bind:value={formYearJoined}
							min="2000"
							max="2100"
							placeholder="2020"
						/>
					</div>
					
					<div class="form-group">
						<label for="sleeper_user_id">Sleeper User ID</label>
						<input 
							type="text" 
							id="sleeper_user_id"
							name="sleeper_user_id" 
							bind:value={formSleeperUserId}
							placeholder="1234567890"
						/>
					</div>
				</div>
				
				<h3>Profile & Contact</h3>
				
				<div class="form-row">
					<div class="form-group">
						<label for="logo_url">Logo URL</label>
						<input 
							type="url" 
							id="logo_url"
							name="logo_url" 
							bind:value={formLogoUrl}
							placeholder="https://example.com/logo.jpg"
						/>
					</div>
					
					<div class="form-group">
						<label for="contact_method">Contact Method</label>
						<input 
							type="text" 
							id="contact_method"
							name="contact_method" 
							bind:value={formContactMethod}
							placeholder="Email, Text, Phone"
						/>
					</div>
				</div>
				
				<div class="form-group">
					<label for="favorite_team">Favorite NFL Team</label>
					<input 
						type="text" 
						id="favorite_team"
						name="favorite_team" 
						bind:value={formFavoriteTeam}
						placeholder="Dallas Cowboys"
					/>
				</div>
				
				<h3>Manager Profile</h3>
				
				<div class="form-group">
					<label for="philosophy">Philosophy</label>
					<textarea 
						id="philosophy"
						name="philosophy" 
						bind:value={formPhilosophy}
						placeholder="My approach to fantasy football..."
						rows="2"
					></textarea>
				</div>
				
				<div class="form-group">
					<label for="signature_moves">Signature Moves</label>
					<textarea 
						id="signature_moves"
						name="signature_moves" 
						bind:value={formSignatureMoves}
						placeholder="Late-round QB strategy, waiver wire prowess..."
						rows="2"
					></textarea>
				</div>
				
				<div class="form-row">
					<div class="form-group">
						<label for="strengths">Strengths</label>
						<textarea 
							id="strengths"
							name="strengths" 
							bind:value={formStrengths}
							placeholder="Draft strategy, player evaluation..."
							rows="2"
						></textarea>
					</div>
					
					<div class="form-group">
						<label for="weaknesses">Weaknesses</label>
						<textarea 
							id="weaknesses"
							name="weaknesses" 
							bind:value={formWeaknesses}
							placeholder="Too loyal to players, impatient..."
							rows="2"
						></textarea>
					</div>
				</div>
				
				<div class="form-group">
					<label for="biography">Biography</label>
					<textarea 
						id="biography"
						name="biography" 
						bind:value={formBiography}
						placeholder="Manager's story, history in the league..."
						rows="3"
					></textarea>
				</div>
				
				<div class="form-actions">
					<button type="submit" class="btn-primary">
						{editingManager ? 'Update Manager' : 'Create Manager'}
					</button>
					<button type="button" class="btn-secondary" on:click={resetForm}>
						Cancel
					</button>
				</div>
			</form>
		</div>
	{/if}
	
	<!-- Manager Detail Modal -->
	{#if viewingManager}
		<div class="modal-overlay" on:click={() => viewingManager = null}>
			<div class="modal-content" on:click|stopPropagation>
				<button class="modal-close" on:click={() => viewingManager = null}>✕</button>
				
				<div class="manager-detail">
					<div class="manager-header">
						{#if viewingManager.logo_url || viewingManager.platform_logo_url}
							<img src={viewingManager.logo_url || viewingManager.platform_logo_url} alt={viewingManager.username} class="manager-avatar" />
						{:else}
							<div class="manager-avatar-placeholder">{viewingManager.username[0].toUpperCase()}</div>
						{/if}
						<div>
							<h2>{getDisplayName(viewingManager)}</h2>
							<p class="username">@{viewingManager.username}</p>
						</div>
					</div>
					
					<div class="manager-stats">
						<div class="stat-item">
							<span class="stat-label">Championships</span>
							<span class="stat-value">{viewingManager.championship_count || 0}</span>
						</div>
						<div class="stat-item">
							<span class="stat-label">Seasons Played</span>
							<span class="stat-value">{viewingManager.seasons_played || 0}</span>
						</div>
						<div class="stat-item">
							<span class="stat-label">Teams</span>
							<span class="stat-value">{viewingManager.team_count || 0}</span>
						</div>
						<div class="stat-item">
							<span class="stat-label">Joined</span>
							<span class="stat-value">{viewingManager.year_joined || 'N/A'}</span>
						</div>
					</div>
					
					{#if viewingManager.championship_years && viewingManager.championship_years.length > 0}
						<div class="section">
							<h3>🏆 Championship Years</h3>
							<div class="chip-list">
								{#each viewingManager.championship_years as year}
									<span class="chip chip-gold">{year}</span>
								{/each}
							</div>
						</div>
					{/if}
					
					{#if viewingManager.team_alias}
						<div class="section">
							<h3>Team Alias</h3>
							<p>{viewingManager.team_alias}</p>
						</div>
					{/if}
					
					{#if viewingManager.favorite_team}
						<div class="section">
							<h3>🏈 Favorite NFL Team</h3>
							<p>{viewingManager.favorite_team}</p>
						</div>
					{/if}
					
					{#if viewingManager.philosophy}
						<div class="section">
							<h3>Philosophy</h3>
							<p>{viewingManager.philosophy}</p>
						</div>
					{/if}
					
					{#if viewingManager.signature_moves}
						<div class="section">
							<h3>Signature Moves</h3>
							<p>{viewingManager.signature_moves}</p>
						</div>
					{/if}
					
					<div class="section-row">
						{#if viewingManager.strengths}
							<div class="section">
								<h3>💪 Strengths</h3>
								<p>{viewingManager.strengths}</p>
							</div>
						{/if}
						
						{#if viewingManager.weaknesses}
							<div class="section">
								<h3>⚠️ Weaknesses</h3>
								<p>{viewingManager.weaknesses}</p>
							</div>
						{/if}
					</div>
					
					{#if viewingManager.biography}
						<div class="section">
							<h3>Biography</h3>
							<p>{viewingManager.biography}</p>
						</div>
					{/if}
					
					<div class="section">
						<h3>Contact</h3>
						<p><strong>Email:</strong> {viewingManager.email}</p>
						{#if viewingManager.contact_method}
							<p><strong>Preferred:</strong> {viewingManager.contact_method}</p>
						{/if}
					</div>
				</div>
			</div>
		</div>
	{/if}
	
	<!-- Managers Table -->
	<div class="table-card">
		<h2>All Managers</h2>
		
		{#if managers.length === 0}
			<div class="empty-state">
				<p>👥 No managers yet</p>
				<p>Click "Add New Manager" to get started!</p>
			</div>
		{:else}
			<div class="table-responsive">
				<table>
					<thead>
						<tr>
							<th>Manager</th>
							<th>Email</th>
							<th>Team Alias</th>
							<th>Joined</th>
							<th>Championships</th>
							<th>Seasons</th>
							<th>Teams</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each managers as manager (manager.manager_id)}
							<tr>
								<td>
									<div class="manager-cell">
										{#if manager.logo_url || manager.platform_logo_url}
											<img src={manager.logo_url || manager.platform_logo_url} alt={manager.username} class="manager-thumb" />
										{:else}
											<div class="manager-thumb-placeholder">{manager.username[0].toUpperCase()}</div>
										{/if}
										<div>
											<strong>{getDisplayName(manager)}</strong>
											<div class="username-small">@{manager.username}</div>
										</div>
									</div>
								</td>
								<td>{manager.email}</td>
								<td>{manager.team_alias || '-'}</td>
								<td>{manager.year_joined || '-'}</td>
								<td>
									{#if manager.championship_count > 0}
										<span class="championship-badge">🏆 {manager.championship_count}</span>
									{:else}
										-
									{/if}
								</td>
								<td>{manager.seasons_played || 0}</td>
								<td>{manager.team_count || 0}</td>
								<td>
									<div class="action-buttons">
										<button 
											class="btn-icon" 
											title="View Profile"
											on:click={() => viewManager(manager)}
										>
											👁️
										</button>
										
										<button 
											class="btn-icon" 
											title="Edit"
											on:click={() => startEdit(manager)}
										>
											✏️
										</button>
										
										<button 
											class="btn-icon btn-danger" 
											title="Delete"
											on:click={() => deleteConfirm = manager.manager_id}
										>
											🗑️
										</button>
									</div>
									
									{#if deleteConfirm === manager.manager_id}
										<div class="delete-confirm">
											<p>Delete {manager.username}?</p>
											<form method="POST" action="?/delete" use:enhance={() => {
												return async ({ update }) => {
													await update();
													await invalidateAll();
													deleteConfirm = null;
												};
											}}>
												<input type="hidden" name="manager_id" value={manager.manager_id} />
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
	
	.form-card h3 {
		color: #00316b;
		margin: 2rem 0 1rem 0;
		padding-top: 1.5rem;
		border-top: 1px solid #e5e7eb;
		font-size: 1.25rem;
	}
	
	.form-card h3:first-of-type {
		margin-top: 0;
		padding-top: 0;
		border-top: none;
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
	input[type="email"],
	input[type="url"],
	input[type="number"],
	select,
	textarea {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #ddd;
		border-radius: 6px;
		font-size: 1rem;
		font-family: inherit;
	}
	
	textarea {
		resize: vertical;
	}
	
	input:focus,
	select:focus,
	textarea:focus {
		outline: none;
		border-color: #00316b;
		box-shadow: 0 0 0 3px rgba(0, 49, 107, 0.1);
	}
	
	.form-actions {
		display: flex;
		gap: 1rem;
		margin-top: 2rem;
		padding-top: 1.5rem;
		border-top: 1px solid #e5e7eb;
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
	
	.manager-cell {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	
	.manager-thumb {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		object-fit: cover;
	}
	
	.manager-thumb-placeholder {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: #00316b;
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		font-size: 1.25rem;
	}
	
	.username-small {
		font-size: 0.75rem;
		color: #999;
		margin-top: 0.25rem;
	}
	
	.championship-badge {
		display: inline-block;
		background: #ffc107;
		color: #000;
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.75rem;
		font-weight: 700;
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
	
	/* Modal */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 2rem;
	}
	
	.modal-content {
		background: white;
		border-radius: 12px;
		max-width: 800px;
		width: 100%;
		max-height: 90vh;
		overflow-y: auto;
		position: relative;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
	}
	
	.modal-close {
		position: sticky;
		top: 1rem;
		right: 1rem;
		float: right;
		background: #6c757d;
		color: white;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.5rem;
		padding: 0;
		z-index: 1;
	}
	
	.modal-close:hover {
		background: #5a6268;
	}
	
	.manager-detail {
		padding: 2rem;
	}
	
	.manager-header {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		margin-bottom: 2rem;
		padding-bottom: 1.5rem;
		border-bottom: 2px solid #e5e7eb;
	}
	
	.manager-avatar {
		width: 100px;
		height: 100px;
		border-radius: 50%;
		object-fit: cover;
		border: 4px solid #00316b;
	}
	
	.manager-avatar-placeholder {
		width: 100px;
		height: 100px;
		border-radius: 50%;
		background: #00316b;
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		font-size: 3rem;
		border: 4px solid #00316b;
	}
	
	.manager-header h2 {
		margin: 0;
		color: #00316b;
	}
	
	.username {
		color: #666;
		margin: 0.5rem 0 0 0;
		font-size: 1.125rem;
	}
	
	.manager-stats {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 1rem;
		margin-bottom: 2rem;
	}
	
	.stat-item {
		text-align: center;
		padding: 1rem;
		background: #f9fafb;
		border-radius: 8px;
	}
	
	.stat-item .stat-label {
		display: block;
		font-size: 0.875rem;
		color: #6b7280;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-bottom: 0.5rem;
	}
	
	.stat-item .stat-value {
		display: block;
		font-size: 1.75rem;
		font-weight: 700;
		color: #00316b;
	}
	
	.section {
		margin-bottom: 1.5rem;
	}
	
	.section h3 {
		color: #00316b;
		margin: 0 0 0.75rem 0;
		font-size: 1.125rem;
	}
	
	.section p {
		margin: 0;
		color: #374151;
		line-height: 1.6;
	}
	
	.section-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem;
	}
	
	.chip-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	
	.chip {
		display: inline-block;
		padding: 0.375rem 0.875rem;
		border-radius: 20px;
		font-size: 0.875rem;
		font-weight: 600;
	}
	
	.chip-gold {
		background: #ffc107;
		color: #000;
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
		
		.manager-stats {
			grid-template-columns: repeat(2, 1fr);
		}
		
		.section-row {
			grid-template-columns: 1fr;
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
		
		.manager-stats {
			grid-template-columns: 1fr;
		}
		
		.modal-overlay {
			padding: 1rem;
		}
		
		.manager-detail {
			padding: 1rem;
		}
		
		.manager-header {
			flex-direction: column;
			text-align: center;
		}
	}
</style>