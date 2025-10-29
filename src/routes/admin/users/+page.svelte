<script>
	import { onMount } from 'svelte';

	let users = [];
	let loading = true;
	let error = '';
	let success = '';
	
	// Modal state
	let showModal = false;
	let modalMode = 'create'; // 'create' or 'edit'
	let editingUser = null;
	
	// Form data
	let formData = {
		username: '',
		email: '',
		password: '',
		role: 'manager',
		is_admin: false,
		can_edit_profile: true,
		can_view_stats: true,
		can_manage_seasons: false,
		can_manage_managers: false,
		is_active: true
	};

	onMount(() => {
		loadUsers();
	});

	async function loadUsers() {
		loading = true;
		error = '';
		
		try {
			const response = await fetch('/api/admin/users');
			const data = await response.json();
			
			if (response.ok) {
				users = data.users || [];
			} else {
				error = data.error || 'Failed to load users';
			}
		} catch (err) {
			error = 'Network error loading users';
			console.error('Load users error:', err);
		} finally {
			loading = false;
		}
	}

	function openCreateModal() {
		modalMode = 'create';
		editingUser = null;
		formData = {
			username: '',
			email: '',
			password: '',
			role: 'manager',
			is_admin: false,
			can_edit_profile: true,
			can_view_stats: true,
			can_manage_seasons: false,
			can_manage_managers: false,
			is_active: true
		};
		showModal = true;
	}

	function openEditModal(user) {
		modalMode = 'edit';
		editingUser = user;
		formData = {
			username: user.username,
			email: user.email,
			password: '', // Don't pre-fill password
			role: user.role,
			is_admin: user.is_admin,
			can_edit_profile: user.can_edit_profile,
			can_view_stats: user.can_view_stats,
			can_manage_seasons: user.can_manage_seasons,
			can_manage_managers: user.can_manage_managers,
			is_active: user.is_active
		};
		showModal = true;
	}

	function closeModal() {
		showModal = false;
		editingUser = null;
		error = '';
		success = '';
	}

	async function handleSubmit(e) {
		e.preventDefault();
		error = '';
		success = '';

		// Validation
		if (modalMode === 'create' && !formData.password) {
			error = 'Password is required for new users';
			return;
		}

		if (modalMode === 'create' && formData.password.length < 8) {
			error = 'Password must be at least 8 characters';
			return;
		}

		try {
			const url = modalMode === 'create' 
				? '/api/admin/users'
				: `/api/admin/users/${editingUser.user_id}`;
			
			const method = modalMode === 'create' ? 'POST' : 'PUT';
			
			const body = modalMode === 'create' || formData.password
				? formData
				: { ...formData, password: undefined }; // Don't send empty password on edit

			const response = await fetch(url, {
				method,
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(body)
			});

			const data = await response.json();

			if (response.ok) {
				success = modalMode === 'create' ? 'User created successfully' : 'User updated successfully';
				await loadUsers();
				setTimeout(() => {
					closeModal();
				}, 1500);
			} else {
				error = data.error || 'Failed to save user';
			}
		} catch (err) {
			error = 'Network error saving user';
			console.error('Save user error:', err);
		}
	}

	async function toggleUserStatus(user) {
		try {
			const response = await fetch(`/api/admin/users/${user.user_id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					...user,
					is_active: !user.is_active
				})
			});

			if (response.ok) {
				await loadUsers();
			} else {
				const data = await response.json();
				error = data.error || 'Failed to update user status';
			}
		} catch (err) {
			error = 'Network error updating user status';
			console.error('Toggle status error:', err);
		}
	}

	async function deleteUser(user) {
		if (!confirm(`Are you sure you want to delete user "${user.username}"? This action cannot be undone.`)) {
			return;
		}

		try {
			const response = await fetch(`/api/admin/users/${user.user_id}`, {
				method: 'DELETE'
			});

			const data = await response.json();

			if (response.ok) {
				success = 'User deleted successfully';
				await loadUsers();
				setTimeout(() => {
					success = '';
				}, 3000);
			} else {
				error = data.error || 'Failed to delete user';
			}
		} catch (err) {
			error = 'Network error deleting user';
			console.error('Delete user error:', err);
		}
	}

	function getRoleBadgeColor(role) {
		switch (role) {
			case 'super_admin': return 'badge-purple';
			case 'admin': return 'badge-blue';
			case 'manager': return 'badge-green';
			default: return 'badge-gray';
		}
	}
</script>

<svelte:head>
	<title>Users - Admin</title>
</svelte:head>

<div class="users-container">
	<!-- Header -->
	<div class="page-header">
		<div>
			<h1>Users</h1>
			<p>Manage user accounts and permissions</p>
		</div>
		<button class="btn-primary" on:click={openCreateModal}>
			<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			Add User
		</button>
	</div>

	<!-- Success Message -->
	{#if success && !showModal}
		<div class="alert alert-success">
			<svg class="icon" fill="currentColor" viewBox="0 0 20 20">
				<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
			</svg>
			{success}
		</div>
	{/if}

	<!-- Error Message -->
	{#if error && !showModal}
		<div class="alert alert-error">
			<svg class="icon" fill="currentColor" viewBox="0 0 20 20">
				<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
			</svg>
			{error}
		</div>
	{/if}

	<!-- Loading State -->
	{#if loading}
		<div class="loading-container">
			<div class="spinner"></div>
			<p>Loading users...</p>
		</div>
	{:else}
		<!-- Users Table -->
		<div class="table-container">
			<table class="users-table">
				<thead>
					<tr>
						<th>Username</th>
						<th>Email</th>
						<th>Role</th>
						<th>Admin</th>
						<th>Status</th>
						<th>Created</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each users as user (user.user_id)}
						<tr>
							<td class="username-cell">
								<div class="user-avatar">{user.username.charAt(0).toUpperCase()}</div>
								<span>{user.username}</span>
							</td>
							<td>{user.email}</td>
							<td>
								<span class="badge {getRoleBadgeColor(user.role)}">
									{user.role.replace('_', ' ')}
								</span>
							</td>
							<td>
								{#if user.is_admin}
									<span class="badge badge-purple">Yes</span>
								{:else}
									<span class="badge badge-gray">No</span>
								{/if}
							</td>
							<td>
								<button 
									class="status-toggle {user.is_active ? 'active' : 'inactive'}"
									on:click={() => toggleUserStatus(user)}
								>
									{user.is_active ? 'Active' : 'Inactive'}
								</button>
							</td>
							<td>{new Date(user.created_at).toLocaleDateString()}</td>
							<td>
								<div class="action-buttons">
									<button class="btn-icon" on:click={() => openEditModal(user)} title="Edit user">
										<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
										</svg>
									</button>
									<button class="btn-icon btn-danger" on:click={() => deleteUser(user)} title="Delete user">
										<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
										</svg>
									</button>
								</div>
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="7" class="empty-state">
								No users found. Click "Add User" to create one.
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<!-- Modal -->
{#if showModal}
	<div class="modal-overlay" on:click={closeModal}>
		<div class="modal" on:click|stopPropagation>
			<div class="modal-header">
				<h2>{modalMode === 'create' ? 'Add New User' : 'Edit User'}</h2>
				<button class="close-button" on:click={closeModal}>
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			{#if success}
				<div class="alert alert-success">
					<svg class="icon" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
					</svg>
					{success}
				</div>
			{/if}

			{#if error}
				<div class="alert alert-error">
					<svg class="icon" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
					</svg>
					{error}
				</div>
			{/if}

			<form on:submit={handleSubmit}>
				<div class="form-grid">
					<!-- Username -->
					<div class="form-group">
						<label for="username">Username *</label>
						<input
							type="text"
							id="username"
							bind:value={formData.username}
							required
							disabled={modalMode === 'edit'}
							placeholder="Enter username"
						/>
					</div>

					<!-- Email -->
					<div class="form-group">
						<label for="email">Email *</label>
						<input
							type="email"
							id="email"
							bind:value={formData.email}
							required
							placeholder="user@example.com"
						/>
					</div>

					<!-- Password -->
					<div class="form-group">
						<label for="password">
							Password {modalMode === 'create' ? '*' : '(leave blank to keep current)'}
						</label>
						<input
							type="password"
							id="password"
							bind:value={formData.password}
							required={modalMode === 'create'}
							placeholder={modalMode === 'create' ? 'Min 8 characters' : 'Leave blank to keep current'}
						/>
					</div>

					<!-- Role -->
					<div class="form-group">
						<label for="role">Role *</label>
						<select id="role" bind:value={formData.role} required>
							<option value="manager">Manager</option>
							<option value="admin">Admin</option>
							<option value="super_admin">Super Admin</option>
						</select>
					</div>
				</div>

				<!-- Permissions -->
				<div class="permissions-section">
					<h3>Permissions</h3>
					<div class="permissions-grid">
						<label class="checkbox-label">
							<input type="checkbox" bind:checked={formData.is_admin} />
							<span>Admin Access</span>
						</label>

						<label class="checkbox-label">
							<input type="checkbox" bind:checked={formData.can_edit_profile} />
							<span>Can Edit Profile</span>
						</label>

						<label class="checkbox-label">
							<input type="checkbox" bind:checked={formData.can_view_stats} />
							<span>Can View Stats</span>
						</label>

						<label class="checkbox-label">
							<input type="checkbox" bind:checked={formData.can_manage_seasons} />
							<span>Can Manage Seasons</span>
						</label>

						<label class="checkbox-label">
							<input type="checkbox" bind:checked={formData.can_manage_managers} />
							<span>Can Manage Managers</span>
						</label>

						<label class="checkbox-label">
							<input type="checkbox" bind:checked={formData.is_active} />
							<span>Active Account</span>
						</label>
					</div>
				</div>

				<!-- Modal Actions -->
				<div class="modal-actions">
					<button type="button" class="btn-secondary" on:click={closeModal}>
						Cancel
					</button>
					<button type="submit" class="btn-primary">
						{modalMode === 'create' ? 'Create User' : 'Save Changes'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<style>
	.users-container {
		padding: 24px;
		max-width: 1400px;
		margin: 0 auto;
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 24px;
	}

	.page-header h1 {
		font-size: 28px;
		font-weight: 700;
		color: #1a202c;
		margin: 0 0 4px 0;
	}

	.page-header p {
		color: #718096;
		margin: 0;
	}

	.btn-primary {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 20px;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
	}

	.btn-primary .icon {
		width: 20px;
		height: 20px;
	}

	.alert {
		display: flex;
		align-items: center;
		padding: 12px 16px;
		border-radius: 8px;
		margin-bottom: 20px;
	}

	.alert-success {
		background: #f0fdf4;
		border: 1px solid #86efac;
		color: #166534;
	}

	.alert-error {
		background: #fff5f5;
		border: 1px solid #feb2b2;
		color: #c53030;
	}

	.alert .icon {
		width: 20px;
		height: 20px;
		margin-right: 12px;
	}

	.loading-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 60px 20px;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 4px solid #e2e8f0;
		border-top-color: #667eea;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.loading-container p {
		margin-top: 16px;
		color: #718096;
	}

	.table-container {
		background: white;
		border-radius: 12px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		overflow: hidden;
	}

	.users-table {
		width: 100%;
		border-collapse: collapse;
	}

	.users-table thead {
		background: #f7fafc;
		border-bottom: 2px solid #e2e8f0;
	}

	.users-table th {
		padding: 12px 16px;
		text-align: left;
		font-size: 12px;
		font-weight: 600;
		color: #4a5568;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.users-table td {
		padding: 16px;
		border-bottom: 1px solid #e2e8f0;
	}

	.users-table tbody tr:hover {
		background: #f7fafc;
	}

	.username-cell {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.user-avatar {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		font-size: 14px;
	}

	.badge {
		display: inline-block;
		padding: 4px 12px;
		border-radius: 12px;
		font-size: 12px;
		font-weight: 600;
	}

	.badge-purple {
		background: #ede9fe;
		color: #6b21a8;
	}

	.badge-blue {
		background: #dbeafe;
		color: #1e40af;
	}

	.badge-green {
		background: #d1fae5;
		color: #065f46;
	}

	.badge-gray {
		background: #f3f4f6;
		color: #4b5563;
	}

	.status-toggle {
		padding: 4px 12px;
		border-radius: 12px;
		font-size: 12px;
		font-weight: 600;
		border: none;
		cursor: pointer;
		transition: all 0.2s;
	}

	.status-toggle.active {
		background: #d1fae5;
		color: #065f46;
	}

	.status-toggle.inactive {
		background: #fee2e2;
		color: #991b1b;
	}

	.action-buttons {
		display: flex;
		gap: 8px;
	}

	.btn-icon {
		padding: 8px;
		border: 1px solid #e2e8f0;
		background: white;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-icon svg {
		width: 18px;
		height: 18px;
		color: #4a5568;
	}

	.btn-icon:hover {
		background: #f7fafc;
		border-color: #cbd5e0;
	}

	.btn-icon.btn-danger:hover {
		background: #fff5f5;
		border-color: #feb2b2;
	}

	.btn-icon.btn-danger:hover svg {
		color: #e53e3e;
	}

	.empty-state {
		text-align: center;
		padding: 40px 20px;
		color: #718096;
	}

	/* Modal Styles */
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
		z-index: 100;
		padding: 20px;
	}

	.modal {
		background: white;
		border-radius: 12px;
		max-width: 600px;
		width: 100%;
		max-height: 90vh;
		overflow-y: auto;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 24px;
		border-bottom: 1px solid #e2e8f0;
	}

	.modal-header h2 {
		font-size: 20px;
		font-weight: 600;
		color: #1a202c;
		margin: 0;
	}

	.close-button {
		padding: 8px;
		border: none;
		background: none;
		cursor: pointer;
		color: #718096;
	}

	.close-button svg {
		width: 20px;
		height: 20px;
	}

	.modal form {
		padding: 24px;
	}

	.form-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 16px;
		margin-bottom: 24px;
	}

	.form-group {
		display: flex;
		flex-direction: column;
	}

	.form-group label {
		font-size: 14px;
		font-weight: 500;
		color: #2d3748;
		margin-bottom: 6px;
	}

	.form-group input,
	.form-group select {
		padding: 10px 12px;
		border: 2px solid #e2e8f0;
		border-radius: 8px;
		font-size: 14px;
		transition: all 0.2s;
	}

	.form-group input:focus,
	.form-group select:focus {
		outline: none;
		border-color: #667eea;
	}

	.form-group input:disabled {
		background: #f7fafc;
		cursor: not-allowed;
	}

	.permissions-section {
		margin-bottom: 24px;
		padding-top: 24px;
		border-top: 1px solid #e2e8f0;
	}

	.permissions-section h3 {
		font-size: 16px;
		font-weight: 600;
		color: #1a202c;
		margin: 0 0 16px 0;
	}

	.permissions-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 12px;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 8px;
		cursor: pointer;
	}

	.checkbox-label input[type="checkbox"] {
		width: 18px;
		height: 18px;
		cursor: pointer;
	}

	.checkbox-label span {
		font-size: 14px;
		color: #2d3748;
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 12px;
		padding-top: 24px;
		border-top: 1px solid #e2e8f0;
	}

	.btn-secondary {
		padding: 10px 20px;
		background: white;
		color: #4a5568;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-secondary:hover {
		background: #f7fafc;
	}

	@media (max-width: 768px) {
		.page-header {
			flex-direction: column;
			gap: 16px;
		}

		.form-grid,
		.permissions-grid {
			grid-template-columns: 1fr;
		}

		.table-container {
			overflow-x: auto;
		}

		.users-table {
			min-width: 800px;
		}
	}
</style>