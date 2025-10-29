<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	
	let user = null;
	let loading = true;
	let changingPassword = false;
	let passwordForm = {
		currentPassword: '',
		newPassword: '',
		confirmPassword: ''
	};
	let passwordMessage = '';
	let passwordError = '';

	onMount(async () => {
		await checkAuth();
	});

	async function checkAuth() {
		try {
			const res = await fetch('/api/admin/auth/check', {
				credentials: 'include'
			});
			
			if (res.ok) {
				const data = await res.json();
				user = data.user;
			} else {
				goto('/admin/login');
			}
		} catch (err) {
			console.error('Auth check failed:', err);
			goto('/admin/login');
		} finally {
			loading = false;
		}
	}

	async function handlePasswordChange(e) {
		e.preventDefault();
		passwordMessage = '';
		passwordError = '';

		// Validation
		if (passwordForm.newPassword.length < 8) {
			passwordError = 'New password must be at least 8 characters';
			return;
		}

		if (passwordForm.newPassword !== passwordForm.confirmPassword) {
			passwordError = 'New passwords do not match';
			return;
		}

		changingPassword = true;

		try {
			const res = await fetch('/api/admin/auth/change_password', {
				method: 'POST',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					currentPassword: passwordForm.currentPassword,
					newPassword: passwordForm.newPassword
				})
			});

			const data = await res.json();

			if (res.ok) {
				passwordMessage = 'Password changed successfully!';
				passwordForm = {
					currentPassword: '',
					newPassword: '',
					confirmPassword: ''
				};
			} else {
				passwordError = data.error || 'Failed to change password';
			}
		} catch (err) {
			console.error('Password change failed:', err);
			passwordError = 'An error occurred. Please try again.';
		} finally {
			changingPassword = false;
		}
	}
</script>

{#if loading}
	<div class="loading-container">
		<div class="loading-content">
			<div class="spinner"></div>
			<p class="loading-text">Loading...</p>
		</div>
	</div>
{:else if user}
	<div class="profile-container">
		<h1 class="page-title">Profile Settings</h1>

		<!-- User Info Card -->
		<div class="card">
			<h2 class="card-title">Account Information</h2>
			
			<div class="info-grid">
				<div class="info-item">
					<label class="info-label">Username</label>
					<p class="info-value">{user.username}</p>
				</div>

				<div class="info-item">
					<label class="info-label">Email</label>
					<p class="info-value">{user.email}</p>
				</div>

				<div class="info-item">
					<label class="info-label">Role</label>
					<p class="info-value">{user.role}</p>
				</div>

				<div class="info-item">
					<label class="info-label">Permissions</label>
					<div class="permissions-badges">
						{#if user.is_admin}
							<span class="badge badge-admin">Admin</span>
						{/if}
						{#if user.can_edit_profile}
							<span class="badge badge-edit">Edit Profile</span>
						{/if}
						{#if user.can_view_stats}
							<span class="badge badge-stats">View Stats</span>
						{/if}
						{#if user.can_manage_seasons}
							<span class="badge badge-seasons">Manage Seasons</span>
						{/if}
						{#if user.can_manage_managers}
							<span class="badge badge-managers">Manage Managers</span>
						{/if}
					</div>
				</div>
			</div>
		</div>

		<!-- Change Password Card -->
		<div class="card">
			<h2 class="card-title">Change Password</h2>

			{#if passwordMessage}
				<div class="alert alert-success">{passwordMessage}</div>
			{/if}

			{#if passwordError}
				<div class="alert alert-error">{passwordError}</div>
			{/if}

			<form on:submit={handlePasswordChange}>
				<div class="form-grid">
					<div class="form-group">
						<label for="currentPassword" class="form-label">
							Current Password
						</label>
						<input
							id="currentPassword"
							type="password"
							bind:value={passwordForm.currentPassword}
							required
							autocomplete="current-password"
							class="form-input"
						/>
					</div>

					<div class="form-group">
						<label for="newPassword" class="form-label">
							New Password
						</label>
						<input
							id="newPassword"
							type="password"
							bind:value={passwordForm.newPassword}
							required
							minlength="8"
							autocomplete="new-password"
							class="form-input"
						/>
						<p class="form-hint">Must be at least 8 characters</p>
					</div>

					<div class="form-group">
						<label for="confirmPassword" class="form-label">
							Confirm New Password
						</label>
						<input
							id="confirmPassword"
							type="password"
							bind:value={passwordForm.confirmPassword}
							required
							minlength="8"
							autocomplete="new-password"
							class="form-input"
						/>
					</div>

					<button
						type="submit"
						disabled={changingPassword}
						class="submit-button"
						class:disabled={changingPassword}
					>
						{#if changingPassword}
							Changing Password...
						{:else}
							Change Password
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<style>
	/* Loading State */
	.loading-container {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 400px;
	}

	.loading-content {
		text-align: center;
	}

	.spinner {
		border: 4px solid #f3f4f6;
		border-top: 4px solid #8b5cf6;
		border-radius: 50%;
		width: 40px;
		height: 40px;
		animation: spin 1s linear infinite;
		margin: 0 auto 16px;
	}

	.loading-text {
		color: #6b7280;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	/* Main Container */
	.profile-container {
		max-width: 800px;
		margin: 0 auto;
	}

	.page-title {
		font-size: 2rem;
		font-weight: bold;
		color: #1f2937;
		margin-bottom: 2rem;
	}

	/* Card Styles */
	.card {
		background: white;
		border-radius: 8px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		padding: 2rem;
		margin-bottom: 2rem;
	}

	.card-title {
		font-size: 1.5rem;
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 1.5rem;
	}

	/* Info Section */
	.info-grid {
		display: grid;
		gap: 1rem;
	}

	.info-item {
		margin-bottom: 0.5rem;
	}

	.info-label {
		display: block;
		font-weight: 500;
		color: #374151;
		margin-bottom: 0.5rem;
	}

	.info-value {
		color: #6b7280;
		font-size: 1rem;
		margin: 0;
	}

	/* Permissions Badges */
	.permissions-badges {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 0.5rem;
	}

	.badge {
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.badge-admin {
		background: #fef3c7;
		color: #92400e;
	}

	.badge-edit {
		background: #dbeafe;
		color: #1e40af;
	}

	.badge-stats {
		background: #dcfce7;
		color: #166534;
	}

	.badge-seasons {
		background: #e9d5ff;
		color: #6b21a8;
	}

	.badge-managers {
		background: #fce7f3;
		color: #9f1239;
	}

	/* Alerts */
	.alert {
		padding: 1rem;
		border-radius: 6px;
		margin-bottom: 1.5rem;
	}

	.alert-success {
		background: #dcfce7;
		border: 1px solid #86efac;
		color: #166534;
	}

	.alert-error {
		background: #fee2e2;
		border: 1px solid #fca5a5;
		color: #991b1b;
	}

	/* Form Styles */
	.form-grid {
		display: grid;
		gap: 1.5rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
	}

	.form-label {
		display: block;
		font-weight: 500;
		color: #374151;
		margin-bottom: 0.5rem;
	}

	.form-input {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 1rem;
		transition: all 0.2s;
	}

	.form-input:focus {
		border-color: #8b5cf6;
		outline: none;
		box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
	}

	.form-hint {
		margin-top: 0.5rem;
		font-size: 0.875rem;
		color: #6b7280;
	}

	/* Submit Button */
	.submit-button {
		width: 100%;
		background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
		color: white;
		font-weight: 600;
		padding: 0.75rem 1.5rem;
		border-radius: 6px;
		border: none;
		cursor: pointer;
		transition: all 0.2s;
		font-size: 1rem;
	}

	.submit-button:hover:not(.disabled) {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
	}

	.submit-button.disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	/* Responsive */
	@media (max-width: 640px) {
		.page-title {
			font-size: 1.5rem;
		}

		.card {
			padding: 1.5rem;
		}

		.card-title {
			font-size: 1.25rem;
		}
	}
</style>