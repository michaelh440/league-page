<script>
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import StatsLayout from '$lib/components/StatsLayout.svelte';

  export let data;
  let managers = data.managers;
  let manager = null;
  let selectElement;

  // Get manager_id from query string
  $: managerId = $page.url.searchParams.get("manager_id");
  $: manager = managers.find(m => m.manager_id == managerId);
  
  // Update select element when managerId changes
  $: if (selectElement && managerId) {
    selectElement.value = managerId;
  }

  // Navigation items for manager section
  const withMgr = (path) =>
    managerId ? `${path}?manager_id=${managerId}` : path;

  const navItems = [
    { label: "All Time Scoring", href: withMgr("/managers/all_time_stats") },
    { label: "Regular Season Scoring", href: withMgr("/managers/reg_season_stats") },
    { label: "Playoff Scoring", href: withMgr("/managers/playoff_stats") },
    //{ label: "Ranking", href: withMgr("/managers/ranking") },
    { label: "Rivalries", href: withMgr("/managers/rivalries") },
    { label: "Draft Room", href: withMgr("/managers/drafts") },
    //{ label: "Biography", href: withMgr("/managers/bio"), active: true }
  ];

  function handleSelect(e) {
    const id = e.target.value;
    if (id) {
      goto(`/managers/bio?manager_id=${id}`);
    }
  }

  // Helper function to format text with line breaks
  function formatText(text) {
    if (!text) return '';
    return text.replace(/\n/g, '<br>');
  }
</script>

<svelte:head>
  <title>Manager Biographies - Houston Fantasy Football League</title>
</svelte:head>

<StatsLayout title="Manager Biographies" {navItems}>
  <div class="bio-container">
    <div class="toolbar">
      <label for="manager-select">Manager:</label>
      <select id="manager-select" bind:this={selectElement} on:change={handleSelect} class="manager-select">
        <option value="">Choose a manager...</option>
        {#each managers as m}
          <option value={m.manager_id}>
            {m.username || m.real_name}
          </option>
        {/each}
      </select>
    </div>

    {#if !managerId}
      <div class="no-selection">
        <div class="selection-prompt">
          <h3>Select a Manager</h3>
          <p>Choose a manager from the dropdown above to view their biography, philosophy, and league personality.</p>
        </div>
      </div>
    {:else if manager}
      <div class="manager-bio">
        <div class="bio-header">
          <div class="manager-avatar">
            <img 
              src={manager.logo_url || '/default-avatar.png'} 
              alt={manager.username || manager.real_name} 
              class="manager-logo" 
            />
            {#if manager.championships > 0}
              <div class="championship-badge">
                <span class="trophy">🏆</span>
                <span class="count">{manager.championships}</span>
              </div>
            {/if}
          </div>
          
          <div class="manager-info">
            <h2 class="manager-name">{manager.username || manager.real_name}</h2>
            {#if manager.team_alias}
              <p class="team-alias">"{manager.team_alias}"</p>
            {/if}
            
            <div class="manager-stats">
              <div class="stat-item">
                <span class="stat-label">Joined</span>
                <span class="stat-value">{manager.year_joined || 'Unknown'}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Championships</span>
                <span class="stat-value">{manager.championships}</span>
              </div>
              {#if manager.favorite_team}
                <div class="stat-item">
                  <span class="stat-label">Favorite Team</span>
                  <span class="stat-value">{manager.favorite_team}</span>
                </div>
              {/if}
            </div>
          </div>
        </div>

        <div class="bio-content">
          {#if manager.philosophy}
            <div class="bio-section">
              <h3 class="section-title">Philosophy</h3>
              <div class="section-content philosophy">
                <span class="quote-mark">"</span>
                <span class="quote-text">{manager.philosophy}</span>
                <span class="quote-mark">"</span>
              </div>
            </div>
          {/if}

          {#if manager.signature_moves}
            <div class="bio-section">
              <h3 class="section-title">Signature Moves</h3>
              <div class="section-content">
                {@html formatText(manager.signature_moves)}
              </div>
            </div>
          {/if}

          {#if manager.strengths}
            <div class="bio-section">
              <h3 class="section-title">Strengths</h3>
              <div class="section-content strengths">
                {@html formatText(manager.strengths)}
              </div>
            </div>
          {/if}

          {#if manager.weaknesses}
            <div class="bio-section">
              <h3 class="section-title">Weaknesses</h3>
              <div class="section-content weaknesses">
                {@html formatText(manager.weaknesses)}
              </div>
            </div>
          {/if}

          {#if manager.biography}
            <div class="bio-section">
              <h3 class="section-title">Biography</h3>
              <div class="section-content">
                {@html formatText(manager.biography)}
              </div>
            </div>
          {/if}

          {#if !manager.biography && !manager.philosophy && !manager.signature_moves && !manager.strengths && !manager.weaknesses}
            <div class="bio-section empty-bio">
              <div class="empty-message">
                <h3>Bio Coming Soon</h3>
                <p>This manager hasn't filled out their biography yet. Check back later for their entertaining takes on fantasy football!</p>
              </div>
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</StatsLayout>

<style>
  .bio-container {
    max-width: 900px;
    margin: 0 auto;
    padding-right: 2rem;
  }

  .toolbar { 
    display: flex; 
    align-items: center; 
    justify-content: center;
    gap: 0.75rem; 
    margin-bottom: 1.5rem; 
    padding: 1rem;
    background: linear-gradient(135deg, #f8f9fa, #e9ecef);
    border-radius: 8px;
    border: 1px solid #dee2e6;
  }
  
  .toolbar label {
    font-weight: bold;
    color: #495057;
    font-size: 1rem;
  }
  
  .manager-select {
    padding: 0.5rem 1rem;
    font-size: 1rem;
    border: 2px solid #ced4da;
    border-radius: 6px;
    background: white;
    color: #495057;
    min-width: 200px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .manager-select:hover {
    border-color: #007bff;
    box-shadow: 0 2px 4px rgba(0, 123, 255, 0.1);
  }
  
  .manager-select:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25);
  }

  .manager-bio {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  }

  .bio-header {
    background: linear-gradient(135deg, #f8fafc, #e2e8f0);
    padding: 2.5rem;
    display: flex;
    align-items: center;
    gap: 2rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .manager-avatar {
    position: relative;
  }

  .manager-logo {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    border: 4px solid #fbbf24;
    object-fit: cover;
    background: #f3f4f6;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .championship-badge {
    position: absolute;
    top: -8px;
    right: -8px;
    background: #fbbf24;
    border: 2px solid white;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }

  .championship-badge .trophy {
    font-size: 14px;
    line-height: 1;
  }

  .championship-badge .count {
    font-size: 10px;
    font-weight: bold;
    color: #92400e;
    line-height: 1;
  }

  .manager-info {
    flex: 1;
  }

  .manager-name {
    margin: 0 0 0.5rem 0;
    color: #1f2937;
    font-size: 2.2rem;
    font-weight: bold;
  }

  .team-alias {
    font-style: italic;
    color: #6b7280;
    font-size: 1.3rem;
    margin: 0 0 1.5rem 0;
  }

  .manager-stats {
    display: flex;
    gap: 2rem;
    flex-wrap: wrap;
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .stat-label {
    font-size: 0.85rem;
    color: #6b7280;
    text-transform: uppercase;
    font-weight: 600;
    letter-spacing: 0.5px;
  }

  .stat-value {
    font-size: 1.1rem;
    color: #1f2937;
    font-weight: 600;
  }

  .bio-content {
    padding: 2.5rem;
  }

  .bio-section {
    margin-bottom: 2.5rem;
  }

  .bio-section:last-child {
    margin-bottom: 0;
  }

  .section-title {
    color: #1f2937;
    margin: 0 0 1rem 0;
    font-size: 1.4rem;
    font-weight: 700;
    border-bottom: 2px solid #e5e7eb;
    padding-bottom: 0.5rem;
  }

  .section-content {
    color: #374151;
    line-height: 1.7;
    font-size: 1.05rem;
  }

  .philosophy {
    font-style: italic;
    position: relative;
    background: #f8fafc;
    padding: 1.5rem;
    border-radius: 12px;
    border-left: 4px solid #3b82f6;
  }

  .quote-mark {
    font-size: 1.5rem;
    color: #3b82f6;
    font-weight: bold;
  }

  .quote-text {
    margin: 0 0.5rem;
  }

  .strengths {
    background: #f0fdf4;
    padding: 1.5rem;
    border-radius: 12px;
    border-left: 4px solid #22c55e;
  }

  .weaknesses {
    background: #fef2f2;
    padding: 1.5rem;
    border-radius: 12px;
    border-left: 4px solid #ef4444;
  }

  .empty-bio {
    text-align: center;
    padding: 3rem;
  }

  .empty-message h3 {
    color: #6b7280;
    margin-bottom: 1rem;
    font-size: 1.5rem;
  }

  .empty-message p {
    color: #9ca3af;
    font-style: italic;
    margin: 0;
    font-size: 1.1rem;
  }

  .no-selection {
    text-align: center;
    padding: 4rem 2rem;
    background: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e9ecef;
  }

  .selection-prompt h3 {
    color: #6b7280;
    margin-bottom: 1rem;
    font-size: 1.8rem;
  }

  .selection-prompt p {
    color: #9ca3af;
    font-size: 1.1rem;
    margin: 0;
  }

  /* Responsive design */
  @media (max-width: 768px) {
    .bio-header {
      flex-direction: column;
      text-align: center;
      padding: 2rem;
    }

    .manager-logo {
      width: 100px;
      height: 100px;
    }

    .manager-name {
      font-size: 1.8rem;
    }

    .manager-stats {
      justify-content: center;
      gap: 1rem;
    }

    .bio-content {
      padding: 1.5rem;
    }

    .manager-select {
      min-width: 180px;
      font-size: 0.9rem;
    }
  }
</style>