<script>
  import StatsLayout from '$lib/components/StatsLayout.svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  
  export let data;
  
  // Get manager_id from query string
  $: managerId = $page.url.searchParams.get("manager_id");
  $: selectedManager = data.managers?.find(m => m.manager_id == managerId);

  // Navigation items for manager section
  const withMgr = (path) =>
    managerId ? `${path}?manager_id=${managerId}` : path;

  const navItems = [
    { label: "All Time Scoring", href: withMgr("/managers/all_time_stats") },
    { label: "Regular Season Scoring", href: withMgr("/managers/reg_season_stats") },
    { label: "Playoff Scoring", href: withMgr("/managers/playoff_stats") },
    { label: "Ranking", href: withMgr("/managers/ranking") },
    { label: "Rivalries", href: withMgr("/managers/rivalries") },
    { label: "Draft Room", href: withMgr("/managers/drafts"), active: true },
    { label: "Biography", href: withMgr("/managers/bio") }
  ];

  function handleManagerSelect(e) {
    const id = e.target.value;
    if (id) {
      goto(`/managers/drafts?manager_id=${id}`);
    }
  }

  // Process draft data for the selected manager across all years
  $: draftHistory = processDraftHistory(data.draftPicks, managerId);
  $: maxRounds = Math.max(...(data.draftPicks?.map(pick => pick.round_number) || [0]));
  
  function processDraftHistory(picks, managerId) {
    if (!picks || !managerId) return { seasons: [], rounds: [] };
    
    // Get all picks for this manager
    const managerPicks = picks.filter(pick => pick.manager_id == managerId);
    
    // Get unique seasons and sort them
    const seasons = [...new Set(managerPicks.map(pick => pick.season_year))]
      .sort((a, b) => b - a); // Most recent first
    
    // Create grid structure: rounds × seasons
    const rounds = [];
    for (let round = 1; round <= maxRounds; round++) {
      const roundData = {
        round_number: round,
        picks: seasons.map(season => {
          const pick = managerPicks.find(p => 
            p.round_number === round && p.season_year === season
          );
          return {
            season_year: season,
            pick: pick || null
          };
        })
      };
      rounds.push(roundData);
    }
    
    return { seasons, rounds };
  }
</script>

<svelte:head>
  <title>Manager Draft History - Houston Fantasy Football League</title>
</svelte:head>

<StatsLayout title="Manager Draft History" {navItems}>
  <div class="draft-container">
    <div class="toolbar">
      <label for="manager-select">Manager:</label>
      <select id="manager-select" on:change={handleManagerSelect} value={managerId || ""} class="manager-select">
        <option value="">Choose a manager...</option>
        {#each data.managers || [] as manager}
          <option value={manager.manager_id}>
            {manager.manager_name}
          </option>
        {/each}
      </select>
    </div>

    {#if !managerId}
      <div class="no-selection">
        <div class="selection-prompt">
          <h3>Select a Manager</h3>
          <p>Choose a manager from the dropdown above to view their draft history across all seasons.</p>
        </div>
      </div>
    {:else if !selectedManager}
      <div class="no-data">
        <p>Manager not found.</p>
      </div>
    {:else if draftHistory.seasons.length === 0}
      <div class="no-data">
        <p>No draft data available for {selectedManager.manager_name}.</p>
      </div>
    {:else}
      <!-- Manager Info and Legend -->
      <div class="manager-info-section">
        <div class="manager-header">
          {#if selectedManager.manager_logo}
            <img src={selectedManager.manager_logo} alt={selectedManager.manager_name} class="manager-avatar" />
          {/if}
          <div class="manager-details">
            <h2>{selectedManager.manager_name}</h2>
            <p>{draftHistory.seasons.length} Draft{draftHistory.seasons.length !== 1 ? 's' : ''} • {maxRounds} Rounds Each</p>
          </div>
        </div>
        
        <div class="legend">
          <span class="legend-title">Position Colors:</span>
          {#each data.positionColors || [] as pos}
            <span class="legend-item" style="background-color: {pos.background_color}; color: {pos.color_hex};">
              {pos.position}
            </span>
          {/each}
        </div>
      </div>

      <!-- Draft History Grid -->
      <div class="draft-grid-container">
        <div class="draft-grid">
          <!-- Header Row with Season Years -->
          <div class="grid-header">
            <div class="round-header">Round</div>
            {#each draftHistory.seasons as season}
              <div class="season-header">
                <div class="season-year">{season}</div>
              </div>
            {/each}
          </div>

          <!-- Draft Rounds -->
          {#each draftHistory.rounds as round}
            <div class="grid-row">
              <div class="round-cell">
                <span class="round-number">{round.round_number}</span>
              </div>
              {#each round.picks as seasonPick}
                <div class="pick-cell">
                  {#if seasonPick.pick}
                    <div 
                      class="pick-content"
                      style="background-color: {seasonPick.pick.background_color}; color: {seasonPick.pick.color_hex};"
                    >
                      <div class="player-name">{seasonPick.pick.player_name}</div>
                      <div class="player-details">
                        <span class="position">{seasonPick.pick.position}</span>
                        <span class="team">({seasonPick.pick.player_nfl_team})</span>
                      </div>
                      <div class="pick-number">#{seasonPick.pick.pick_number}</div>
                    </div>
                  {:else}
                    <div class="empty-pick">-</div>
                  {/if}
                </div>
              {/each}
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</StatsLayout>

<style>
  .draft-container {
    max-width: 1000px;
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

  .no-selection, .no-data {
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

  .manager-info-section {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  .manager-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .manager-avatar {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    border: 2px solid #fbbf24;
    object-fit: cover;
    background: #f3f4f6;
  }

  .manager-details h2 {
    margin: 0 0 0.25rem 0;
    color: #1f2937;
    font-size: 1.6rem;
    font-weight: bold;
  }

  .manager-details p {
    margin: 0;
    color: #6b7280;
    font-size: 0.9rem;
  }

  .legend {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .legend-title {
    font-weight: bold;
    color: #333;
  }

  .legend-item {
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.85rem;
    font-weight: bold;
    border: 1px solid #ddd;
  }

  .draft-grid-container {
    overflow-x: auto;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .draft-grid {
    display: flex;
    flex-direction: column;
    min-width: fit-content;
    border: 2px solid #ddd;
    border-radius: 8px;
    background: white;
  }

  .grid-header {
    display: flex;
    background: #003366;
    color: white;
    font-weight: bold;
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .round-header {
    width: 80px;
    padding: 1rem 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-right: 1px solid #fff;
    font-size: 0.9rem;
  }

  .season-header {
    flex: 1;
    min-width: 140px;
    padding: 1rem;
    border-right: 1px solid #fff;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .season-year {
    font-size: 1rem;
    font-weight: bold;
  }

  .grid-row {
    display: flex;
    border-top: 1px solid #ddd;
  }

  .grid-row:nth-child(even) {
    background: #f9f9f9;
  }

  .round-cell {
    width: 80px;
    padding: 0.75rem 0.5rem;
    border-right: 1px solid #ddd;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f0f0f0;
    font-weight: bold;
  }

  .round-number {
    font-size: 1rem;
    color: #003366;
  }

  .pick-cell {
    flex: 1;
    min-width: 140px;
    min-height: 75px;
    border-right: 1px solid #ddd;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem;
  }

  .pick-content {
    width: 100%;
    height: 100%;
    border-radius: 6px;
    padding: 0.5rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    position: relative;
    border: 1px solid rgba(0,0,0,0.1);
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }

  .player-name {
    font-weight: bold;
    font-size: 0.85rem;
    line-height: 1.2;
    margin-bottom: 0.25rem;
  }

  .player-details {
    font-size: 0.75rem;
    opacity: 0.9;
    line-height: 1.2;
  }

  .position {
    font-weight: bold;
  }

  .team {
    margin-left: 0.2rem;
  }

  .pick-number {
    position: absolute;
    top: 0.25rem;
    right: 0.25rem;
    font-size: 0.7rem;
    opacity: 0.8;
    font-weight: bold;
  }

  .empty-pick {
    color: #ccc;
    font-size: 1.2rem;
    font-weight: bold;
  }

  @media (max-width: 768px) {
    .draft-container {
      padding-right: 1rem;
    }

    .manager-header {
      flex-direction: column;
      text-align: center;
      gap: 0.5rem;
    }

    .manager-avatar {
      width: 50px;
      height: 50px;
    }

    .legend {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }

    .season-header {
      min-width: 100px;
      padding: 0.75rem;
    }

    .pick-cell {
      min-width: 100px;
      min-height: 65px;
      padding: 0.3rem;
    }

    .player-name {
      font-size: 0.75rem;
    }

    .player-details {
      font-size: 0.7rem;
    }

    .round-header {
      width: 60px;
      font-size: 0.8rem;
    }

    .round-cell {
      width: 60px;
    }
  }
</style>