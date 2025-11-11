<script>
	import { enhance } from '$app/forms';
	
	export let data;
	export let form;
	
	let { videos, seasons } = data;
	
	// Form state
	let showAddForm = false;
	let editingVideo = null;
	let deleteConfirm = null;
	
	// Form fields
	let formVideoUrl = '';
	let formSeasonId = '';
	let formWeek = '';
	let formIsFeatured = false;
	
	// Extract YouTube video ID from various URL formats
	function getYoutubeId(url) {
		if (!url) return null;
		const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
		const match = url.match(regExp);
		return match && match[2].length === 11 ? match[2] : url;
	}
	
	// Get YouTube thumbnail
	function getYoutubeThumbnail(url) {
		const videoId = getYoutubeId(url);
		return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
	}
	
	// Reset form
	function resetForm() {
		showAddForm = false;
		editingVideo = null;
		formVideoUrl = '';
		formSeasonId = '';
		formWeek = '';
		formIsFeatured = false;
	}
	
	// Start editing
	function startEdit(video) {
		editingVideo = video.video_id;
		showAddForm = true;
		formVideoUrl = video.video_url;
		formSeasonId = video.season_id.toString();
		formWeek = video.week.toString();
		formIsFeatured = video.is_featured;
	}
	
	// Format date
	function formatDate(dateString) {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Admin - Manage Videos</title>
</svelte:head>

<div class="admin-container">
	<div class="admin-header">
		<h1>📹 Video Management</h1>
		<button class="btn-add" on:click={() => { showAddForm = !showAddForm; if (!showAddForm) resetForm(); }}>
			{showAddForm ? '✕ Cancel' : '+ Add New Video'}
		</button>
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
			<h2>{editingVideo ? 'Edit Video' : 'Add New Video'}</h2>
			<form 
				method="POST" 
				action="?/{editingVideo ? 'update' : 'add'}"
				use:enhance={() => {
					return async ({ update }) => {
						await update();
						resetForm();
					};
				}}
			>
				{#if editingVideo}
					<input type="hidden" name="video_id" value={editingVideo} />
				{/if}
				
				<div class="form-group">
					<label for="video_url">YouTube Video URL *</label>
					<input 
						type="text" 
						id="video_url"
						name="video_url" 
						bind:value={formVideoUrl}
						placeholder="https://www.youtube.com/watch?v=..."
						required
					/>
					<small>Paste full YouTube URL or video ID</small>
				</div>
				
				<div class="form-row">
					<div class="form-group">
						<label for="season_id">Season *</label>
						<select 
							id="season_id"
							name="season_id" 
							bind:value={formSeasonId}
							required
						>
							<option value="">Select Season</option>
							{#each seasons as season}
								<option value={season.season_id}>
									{season.season_year} - {season.season_name}
								</option>
							{/each}
						</select>
					</div>
					
					<div class="form-group">
						<label for="week">Week *</label>
						<input 
							type="number" 
							id="week"
							name="week" 
							bind:value={formWeek}
							min="1"
							max="17"
							placeholder="1-17"
							required
						/>
					</div>
				</div>
				
				<div class="form-group checkbox-group">
					<label>
						<input 
							type="checkbox" 
							name="is_featured"
							value="true"
							bind:checked={formIsFeatured}
						/>
						<span>⭐ Set as Featured Video (shows on home page)</span>
					</label>
				</div>
				
				<div class="form-actions">
					<button type="submit" class="btn-primary">
						{editingVideo ? 'Update Video' : 'Add Video'}
					</button>
					<button type="button" class="btn-secondary" on:click={resetForm}>
						Cancel
					</button>
				</div>
			</form>
		</div>
	{/if}
	
	<!-- Video List -->
	<div class="videos-grid">
		{#each videos as video}
			<div class="video-card" class:featured={video.is_featured}>
				{#if video.is_featured}
					<div class="featured-badge">⭐ Featured</div>
				{/if}
				
				<div class="video-thumbnail">
					<img 
						src={getYoutubeThumbnail(video.video_url)} 
						alt={video.title}
					/>
					<div class="play-overlay">▶</div>
				</div>
				
				<div class="video-info">
					<h3>{video.title}</h3>
					<div class="video-meta">
						<span>📅 {formatDate(video.created_at)}</span>
						<span>🎬 Week {video.week}</span>
						<span>📺 {video.season_year}</span>
					</div>
					
					<div class="video-url">
						<a href={video.video_url} target="_blank" rel="noopener noreferrer">
							{video.video_url.substring(0, 50)}...
						</a>
					</div>
				</div>
				
				<div class="video-actions">
					{#if !video.is_featured}
						<form method="POST" action="?/setFeatured" use:enhance>
							<input type="hidden" name="video_id" value={video.video_id} />
							<button type="submit" class="btn-icon" title="Set as Featured">
								⭐
							</button>
						</form>
					{/if}
					
					<button 
						class="btn-icon" 
						title="Edit"
						on:click={() => startEdit(video)}
					>
						✏️
					</button>
					
					<button 
						class="btn-icon btn-danger" 
						title="Delete"
						on:click={() => deleteConfirm = video.video_id}
					>
						🗑️
					</button>
				</div>
				
				{#if deleteConfirm === video.video_id}
					<div class="delete-confirm">
						<p>Delete this video?</p>
						<form method="POST" action="?/delete" use:enhance>
							<input type="hidden" name="video_id" value={video.video_id} />
							<button type="submit" class="btn-danger-confirm">
								Yes, Delete
							</button>
						</form>
						<button 
							class="btn-secondary"
							on:click={() => deleteConfirm = null}
						>
							Cancel
						</button>
					</div>
				{/if}
			</div>
		{/each}
		
		{#if videos.length === 0}
			<div class="empty-state">
				<p>📹 No videos yet</p>
				<p>Click "Add New Video" to get started!</p>
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
	
	.admin-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
		padding-bottom: 1rem;
		border-bottom: 2px solid #00316b;
	}
	
	.admin-header h1 {
		color: #00316b;
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
		padding: 0.5rem 1rem;
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
		grid-template-columns: 2fr 1fr;
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
	
	/* Video Grid */
	.videos-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
		gap: 1.5rem;
	}
	
	.video-card {
		background: white;
		border: 2px solid #ddd;
		border-radius: 12px;
		overflow: hidden;
		transition: all 0.3s;
		position: relative;
	}
	
	.video-card:hover {
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
		transform: translateY(-4px);
	}
	
	.video-card.featured {
		border-color: #ffc107;
		box-shadow: 0 0 0 3px rgba(255, 193, 7, 0.2);
	}
	
	.featured-badge {
		position: absolute;
		top: 10px;
		right: 10px;
		background: #ffc107;
		color: #000;
		padding: 0.25rem 0.75rem;
		border-radius: 20px;
		font-weight: 700;
		font-size: 0.875rem;
		z-index: 1;
	}
	
	.video-thumbnail {
		position: relative;
		padding-top: 56.25%; /* 16:9 aspect ratio */
		background: #000;
		overflow: hidden;
	}
	
	.video-thumbnail img {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	
	.play-overlay {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: rgba(0, 0, 0, 0.7);
		color: white;
		width: 60px;
		height: 60px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.5rem;
		pointer-events: none;
	}
	
	.video-info {
		padding: 1rem;
	}
	
	.video-info h3 {
		margin: 0 0 0.5rem 0;
		color: #00316b;
		font-size: 1.1rem;
	}
	
	.video-meta {
		display: flex;
		gap: 1rem;
		font-size: 0.875rem;
		color: #666;
		margin-bottom: 0.5rem;
		flex-wrap: wrap;
	}
	
	.video-url {
		font-size: 0.75rem;
		color: #999;
		margin-top: 0.5rem;
	}
	
	.video-url a {
		color: #00316b;
		text-decoration: none;
	}
	
	.video-url a:hover {
		text-decoration: underline;
	}
	
	.video-actions {
		display: flex;
		gap: 0.5rem;
		padding: 1rem;
		border-top: 1px solid #eee;
		justify-content: flex-end;
	}
	
	.delete-confirm {
		background: #fee;
		border-top: 2px solid #fcc;
		padding: 1rem;
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}
	
	.delete-confirm p {
		margin: 0;
		flex: 1;
		font-weight: 600;
		color: #c00;
	}
	
	.empty-state {
		grid-column: 1 / -1;
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
	
	@media (max-width: 768px) {
		.admin-container {
			padding: 1rem;
		}
		
		.admin-header {
			flex-direction: column;
			gap: 1rem;
			align-items: stretch;
		}
		
		.form-row {
			grid-template-columns: 1fr;
		}
		
		.videos-grid {
			grid-template-columns: 1fr;
		}
		
		.form-actions {
			flex-direction: column;
		}
	}
</style>