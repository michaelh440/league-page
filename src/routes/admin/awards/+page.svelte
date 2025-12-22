<script>
  import { enhance } from '$app/forms';
  
  export let data;
  
  let editingAward = null;
  let showAddForm = false;
  let newAward = {
    award_key: '',
    award_name: '',
    award_description: '',
    award_category: 'weekly',
    icon_emoji: '🏆',
    sort_order: 999
  };

  function startEdit(award) {
    editingAward = { ...award };
  }

  function cancelEdit() {
    editingAward = null;
  }

  function toggleAddForm() {
    showAddForm = !showAddForm;
    if (!showAddForm) {
      newAward = {
        award_key: '',
        award_name: '',
        award_description: '',
        award_category: 'weekly',
        icon_emoji: '🏆',
        sort_order: 999
      };
    }
  }
</script>

<svelte:head>
  <title>Manage Awards | Admin</title>
</svelte:head>

<div class="admin-container">
  <div class="page-header">
    <h1>🏆 Manage Awards</h1>
    <p class="subtitle">Enable or disable awards shown on the public awards page</p>
  </div>

  <div class="actions-bar">
    <button class="btn btn-primary" on:click={toggleAddForm}>
      {showAddForm ? '✕ Cancel' : '+ Add Custom Award'}
    </button>
  </div>

  {#if showAddForm}
    <div class="add-form-container">
      <h3>Add New Award</h3>
      <form method="POST" action="?/addAward" use:enhance class="add-form">
        <div class="form-row">
          <div class="form-group">
            <label for="award_key">Award Key (unique identifier)</label>
            <input 
              type="text" 
              id="award_key" 
              name="award_key" 
              bind:value={newAward.award_key}
              placeholder="e.g., custom_award_name"
              required
            />
          </div>
          <div class="form-group">
            <label for="award_name">Display Name</label>
            <input 
              type="text" 
              id="award_name" 
              name="award_name" 
              bind:value={newAward.award_name}
              placeholder="e.g., Best Comeback"
              required
            />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="award_category">Category</label>
            <select id="award_category" name="award_category" bind:value={newAward.award_category}>
              <option value="weekly">Weekly</option>
              <option value="seasonal">Seasonal</option>
              <option value="positional">Positional</option>
              <option value="career">Career</option>
            </select>
          </div>
          <div class="form-group">
            <label for="icon_emoji">Icon Emoji</label>
            <input 
              type="text" 
              id="icon_emoji" 
              name="icon_emoji" 
              bind:value={newAward.icon_emoji}
              placeholder="🏆"
            />
          </div>
          <div class="form-group">
            <label for="sort_order">Sort Order</label>
            <input 
              type="number" 
              id="sort_order" 
              name="sort_order" 
              bind:value={newAward.sort_order}
            />
          </div>
        </div>
        <div class="form-group full-width">
          <label for="award_description">Description</label>
          <textarea 
            id="award_description" 
            name="award_description" 
            bind:value={newAward.award_description}
            placeholder="Description of the award..."
            rows="2"
          ></textarea>
        </div>
        <button type="submit" class="btn btn-success">Add Award</button>
      </form>
    </div>
  {/if}

  {#each Object.entries(data.awardsByCategory) as [category, awards]}
    <div class="category-section">
      <div class="category-header">
        <h2>{data.categoryLabels[category] || category}</h2>
        <div class="bulk-actions">
          <form method="POST" action="?/bulkToggleCategory" use:enhance>
            <input type="hidden" name="category" value={category} />
            <input type="hidden" name="is_enabled" value="true" />
            <button type="submit" class="btn btn-sm btn-outline">Enable All</button>
          </form>
          <form method="POST" action="?/bulkToggleCategory" use:enhance>
            <input type="hidden" name="category" value={category} />
            <input type="hidden" name="is_enabled" value="false" />
            <button type="submit" class="btn btn-sm btn-outline btn-danger">Disable All</button>
          </form>
        </div>
      </div>

      <div class="awards-grid">
        {#each awards as award}
          <div class="award-card" class:disabled={!award.is_enabled}>
            {#if editingAward?.award_id === award.award_id}
              <!-- Edit Mode -->
              <form method="POST" action="?/updateAward" use:enhance on:submit={cancelEdit} class="edit-form">
                <input type="hidden" name="award_id" value={award.award_id} />
                <div class="form-group">
                  <label>Name</label>
                  <input type="text" name="award_name" bind:value={editingAward.award_name} />
                </div>
                <div class="form-group">
                  <label>Description</label>
                  <textarea name="award_description" bind:value={editingAward.award_description} rows="2"></textarea>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>Emoji</label>
                    <input type="text" name="icon_emoji" bind:value={editingAward.icon_emoji} />
                  </div>
                  <div class="form-group">
                    <label>Sort</label>
                    <input type="number" name="sort_order" bind:value={editingAward.sort_order} />
                  </div>
                </div>
                <div class="form-actions">
                  <button type="submit" class="btn btn-sm btn-success">Save</button>
                  <button type="button" class="btn btn-sm btn-outline" on:click={cancelEdit}>Cancel</button>
                </div>
              </form>
            {:else}
              <!-- View Mode -->
              <div class="award-header">
                <span class="award-emoji">{award.icon_emoji || '🏆'}</span>
                <div class="award-info">
                  <h3>{award.award_name}</h3>
                  <p class="award-key">{award.award_key}</p>
                </div>
                <form method="POST" action="?/toggleAward" use:enhance class="toggle-form">
                  <input type="hidden" name="award_id" value={award.award_id} />
                  <input type="hidden" name="is_enabled" value={!award.is_enabled} />
                  <button type="submit" class="toggle-btn" class:enabled={award.is_enabled}>
                    {award.is_enabled ? 'ON' : 'OFF'}
                  </button>
                </form>
              </div>
              <p class="award-description">{award.award_description || 'No description'}</p>
              <div class="award-footer">
                <span class="sort-order">Order: {award.sort_order}</span>
                <button class="btn btn-sm btn-outline" on:click={() => startEdit(award)}>
                  Edit
                </button>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/each}
</div>

<style>
  .admin-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  .page-header {
    margin-bottom: 2rem;
  }

  .page-header h1 {
    font-size: 2rem;
    color: #1a1a2e;
    margin-bottom: 0.5rem;
  }

  .subtitle {
    color: #6c757d;
    font-size: 1rem;
  }

  .actions-bar {
    margin-bottom: 1.5rem;
  }

  .add-form-container {
    background: #f8f9fa;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 2rem;
    border: 1px solid #e9ecef;
  }

  .add-form-container h3 {
    margin-bottom: 1rem;
    color: #1a1a2e;
  }

  .add-form, .edit-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .form-row {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    flex: 1;
    min-width: 150px;
  }

  .form-group.full-width {
    flex-basis: 100%;
  }

  .form-group label {
    font-size: 0.85rem;
    font-weight: 500;
    color: #495057;
  }

  .form-group input,
  .form-group select,
  .form-group textarea {
    padding: 0.5rem;
    border: 1px solid #ced4da;
    border-radius: 6px;
    font-size: 0.9rem;
  }

  .form-group input:focus,
  .form-group select:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: #003366;
    box-shadow: 0 0 0 2px rgba(0, 51, 102, 0.1);
  }

  .category-section {
    margin-bottom: 2.5rem;
  }

  .category-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid #003366;
  }

  .category-header h2 {
    font-size: 1.25rem;
    color: #003366;
    margin: 0;
  }

  .bulk-actions {
    display: flex;
    gap: 0.5rem;
  }

  .awards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1rem;
  }

  .award-card {
    background: white;
    border-radius: 12px;
    padding: 1rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    border: 1px solid #e9ecef;
    transition: all 0.2s ease;
  }

  .award-card:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  }

  .award-card.disabled {
    opacity: 0.6;
    background: #f8f9fa;
  }

  .award-header {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }

  .award-emoji {
    font-size: 2rem;
    line-height: 1;
  }

  .award-info {
    flex: 1;
  }

  .award-info h3 {
    font-size: 1rem;
    font-weight: 600;
    color: #1a1a2e;
    margin: 0 0 0.25rem 0;
  }

  .award-key {
    font-size: 0.75rem;
    color: #6c757d;
    font-family: monospace;
    margin: 0;
  }

  .toggle-form {
    margin: 0;
  }

  .toggle-btn {
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    border: none;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    background: #dc3545;
    color: white;
  }

  .toggle-btn.enabled {
    background: #28a745;
  }

  .toggle-btn:hover {
    transform: scale(1.05);
  }

  .award-description {
    font-size: 0.85rem;
    color: #495057;
    margin: 0 0 0.75rem 0;
    line-height: 1.4;
  }

  .award-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 0.75rem;
    border-top: 1px solid #e9ecef;
  }

  .sort-order {
    font-size: 0.75rem;
    color: #6c757d;
  }

  .form-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
  }

  /* Button Styles */
  .btn {
    padding: 0.5rem 1rem;
    border-radius: 6px;
    border: none;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-sm {
    padding: 0.25rem 0.75rem;
    font-size: 0.8rem;
  }

  .btn-primary {
    background: #003366;
    color: white;
  }

  .btn-primary:hover {
    background: #004080;
  }

  .btn-success {
    background: #28a745;
    color: white;
  }

  .btn-success:hover {
    background: #218838;
  }

  .btn-outline {
    background: transparent;
    border: 1px solid #ced4da;
    color: #495057;
  }

  .btn-outline:hover {
    background: #f8f9fa;
  }

  .btn-outline.btn-danger {
    border-color: #dc3545;
    color: #dc3545;
  }

  .btn-outline.btn-danger:hover {
    background: #dc3545;
    color: white;
  }

  /* Mobile Styles */
  @media (max-width: 768px) {
    .admin-container {
      padding: 1rem;
    }

    .category-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .awards-grid {
      grid-template-columns: 1fr;
    }

    .form-row {
      flex-direction: column;
    }
  }
</style>