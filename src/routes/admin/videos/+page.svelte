<script>
  import { enhance } from '$app/forms';
  
  export let data;
  export let form;
  
  const { videos, seasons } = data;
  
  // State for editing
  let editingVideo = null;
  let showAddForm = false;
  
  // Form data
  let formData = {
    video_id: '',
    season_id: '',
    week: '',
    video_url: '',
    thumbnail_url: ''
  };
  
  // Reset form
  function resetForm() {
    formData = {
      video_id: '',
      season_id: seasons.length > 0 ? seasons[0].season_id : '',
      week: '',
      video_url: '',
      thumbnail_url: ''
    };
    editingVideo = null;
    showAddForm = false;
  }
  
  // Start editing a video
  function startEdit(video) {
    editingVideo = video.video_id;
    formData = {
      video_id: video.video_id,
      season_id: video.season_id,
      week: video.week,
      video_url: video.video_url,
      thumbnail_url: video.thumbnail_url || ''
    };
    showAddForm = false;
  }
  
  // Cancel editing
  function cancelEdit() {
    resetForm();
  }
  
  // Show add form
  function showAdd() {
    resetForm();
    showAddForm = true;
    formData.season_id = seasons.length > 0 ? seasons[0].season_id : '';
  }
  
  // Get video thumbnail
  function getThumbnail(video) {
    if (video.thumbnail_url) return video.thumbnail_url;
    
    const url = video.video_url;
    if (!url) return '/video-placeholder.png';
    
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      let videoId = '';
      if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1]?.split('?')[0]?.split('/')[0];
      } else if (url.includes('youtube.com')) {
        try {
          const urlObj = new URL(url);
          videoId = urlObj.searchParams.get('v');
        } catch (e) {
          const match = url.match(/[?&]v=([^&]+)/);
          videoId = match ? match[1] : '';
        }
      }
      if (videoId) {
        return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      }
    }
    
    return '/video-placeholder.png';
  }
  
  // Format date
  function formatDate(date) {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }
  
  // Get season year from season_id
  function getSeasonYear(season_id) {
    const season = seasons.find(s => s.season_id === season_id);
    return season ? season.season_year : '';
  }
</script>

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
    font-size: 2rem;
    margin: 0;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 1rem;
  }

  .btn-primary {
    background: #00316b;
    color: white;
  }

  .btn-primary:hover {
    background: #004080;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 49, 107, 0.3);
  }

  .btn-success {
    background: #10b981;
    color: white;
  }

  .btn-success:hover {
    background: #059669;
  }

  .btn-warning {
    background: #f59e0b;
    color: white;
  }

  .btn-warning:hover {
    background: #d97706;
  }

  .btn-danger {
    background: #ef4444;
    color: white;
  }

  .btn-danger:hover {
    background: #dc2626;
  }

  .btn-secondary {
    background: #6b7280;
    color: white;
  }

  .btn-secondary:hover {
    background: #4b5563;
  }

  .btn-small {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  }

  /* Alert messages */
  .alert {
    padding: 1rem;
    border-radius: 6px;
    margin-bottom: 1.5rem;
  }

  .alert-success {
    background: #d1fae5;
    color: #065f46;
    border: 1px solid #10b981;
  }

  .alert-error {
    background: #fee2e2;
    color: #991b1b;
    border: 1px solid #ef4444;
  }

  /* Form styles */
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

  .form-label {
    display: block;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: #374151;
  }

  .form-input,
  .form-select {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 1rem;
    transition: border 0.2s;
  }

  .form-input:focus,
  .form-select:focus {
    outline: none;
    border-color: #00316b;
    box-shadow: 0 0 0 3px rgba(0, 49, 107, 0.1);
  }

  .form-actions {
    display: flex;
    gap: 1rem;
    margin-top: 1.5rem;
  }

  /* Video grid */
  .videos-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.5rem;
  }

  .video-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: all 0.2s;
  }

  .video-card.editing {
    border: 2px solid #f59e0b;
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
  }

  .video-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .video-thumbnail {
    position: relative;
    padding-bottom: 56.25%;
    height: 0;
    overflow: hidden;
    background: #f3f4f6;
  }

  .video-thumbnail img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .video-info {
    padding: 1rem;
  }

  .video-title {
    font-weight: 600;
    color: #00316b;
    margin-bottom: 0.5rem;
    font-size: 1rem;
  }

  .video-meta {
    font-size: 0.875rem;
    color: #6b7280;
    margin-bottom: 0.25rem;
  }

  .video-status {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
    margin-top: 0.5rem;
  }

  .status-completed {
    background: #d1fae5;
    color: #065f46;
  }

  .status-pending {
    background: #fef3c7;
    color: #92400e;
  }

  .video-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #e5e7eb;
  }

  .featured-badge {
    background: #fbbf24;
    color: #78350f;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 700;
    display: inline-block;
    margin-top: 0.5rem;
  }

  @media (max-width: 768px) {
    .admin-container {
      padding: 1rem;
    }

    .admin-header {
      flex-direction: column;
      gap: 1rem;
      align-items: flex-start;
    }

    .videos-grid {
      grid-template-columns: 1fr;
    }

    .form-actions {
      flex-direction: column;
    }

    .btn {
      width: 100%;
    }
  }
</style>

<svelte:head>
  <title>Video Admin - Fantasy League</title>
</svelte:head>

<div class="admin-container">
  <div class="admin-header">
    <h1>📹 Video Management</h1>
    {#if !showAddForm && !editingVideo}
      <button class="btn btn-primary" on:click={showAdd}>
        + Add New Video
      </button>
    {/if}
  </div>

  <!-- Success/Error Messages -->
  {#if form?.success}
    <div class="alert alert-success">
      ✓ {form.message}
    </div>
  {/if}

  {#if form?.error}
    <div class="alert alert-error">
      ✗ {form.error}
    </div>
  {/if}

  <!-- Add/Edit Form -->
  {#if showAddForm || editingVideo}
    <div class="form-card">
      <h2>{editingVideo ? 'Edit Video' : 'Add New Video'}</h2>
      
      <form method="POST" action="?/{editingVideo ? 'update' : 'add'}" use:enhance>
        {#if editingVideo}
          <input type="hidden" name="video_id" value={formData.video_id} />
        {/if}
        
        <div class="form-group">
          <label class="form-label" for="season_id">Season</label>
          <select 
            class="form-select" 
            id="season_id" 
            name="season_id" 
            bind:value={formData.season_id}
            required
          >
            {#each seasons as season}
              <option value={season.season_id}>{season.season_year}</option>
            {/each}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label" for="week">Week Number</label>
          <input 
            class="form-input" 
            type="number" 
            id="week" 
            name="week" 
            bind:value={formData.week}
            min="1"
            max="18"
            required
            placeholder="e.g., 9"
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="video_url">YouTube URL</label>
          <input 
            class="form-input" 
            type="url" 
            id="video_url" 
            name="video_url" 
            bind:value={formData.video_url}
            required
            placeholder="https://youtu.be/VIDEO_ID or https://www.youtube.com/watch?v=VIDEO_ID"
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="thumbnail_url">Thumbnail URL (optional)</label>
          <input 
            class="form-input" 
            type="url" 
            id="thumbnail_url" 
            name="thumbnail_url" 
            bind:value={formData.thumbnail_url}
            placeholder="Leave blank to auto-generate from YouTube"
          />
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-success">
            {editingVideo ? 'Update Video' : 'Add Video'}
          </button>
          <button type="button" class="btn btn-secondary" on:click={cancelEdit}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  {/if}

  <!-- Videos Grid -->
  <div class="videos-grid">
    {#each videos as video}
      <div class="video-card {editingVideo === video.video_id ? 'editing' : ''}">
        <div class="video-thumbnail">
          <img src={getThumbnail(video)} alt="Week {video.week} thumbnail" />
        </div>
        
        <div class="video-info">
          <div class="video-title">
            Week {video.week} - {video.season_year} Season
          </div>
          
          <div class="video-meta">
            <strong>URL:</strong> {video.video_url.substring(0, 40)}...
          </div>
          
          <div class="video-meta">
            <strong>Created:</strong> {formatDate(video.completed_at || video.created_at)}
          </div>
          
          <span class="video-status status-{video.generation_status}">
            {video.generation_status}
          </span>
          
          <!-- Show featured badge if this is the most recent -->
          {#if videos[0].video_id === video.video_id}
            <span class="featured-badge">★ FEATURED</span>
          {/if}

          <div class="video-actions">
            <button 
              class="btn btn-warning btn-small" 
              on:click={() => startEdit(video)}
            >
              Edit
            </button>
            
            {#if videos[0].video_id !== video.video_id}
              <form method="POST" action="?/setFeatured" use:enhance>
                <input type="hidden" name="video_id" value={video.video_id} />
                <button type="submit" class="btn btn-primary btn-small">
                  Set Featured
                </button>
              </form>
            {/if}
            
            <form method="POST" action="?/delete" use:enhance>
              <input type="hidden" name="video_id" value={video.video_id} />
              <button 
                type="submit" 
                class="btn btn-danger btn-small"
                on:click={(e) => {
                  if (!confirm('Are you sure you want to delete this video?')) {
                    e.preventDefault();
                  }
                }}
              >
                Delete
              </button>
            </form>
          </div>
        </div>
      </div>
    {:else}
      <div class="video-card">
        <div class="video-info">
          <p>No videos yet. Click "Add New Video" to get started!</p>
        </div>
      </div>
    {/each}
  </div>
</div>