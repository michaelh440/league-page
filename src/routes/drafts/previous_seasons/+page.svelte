<script>
  import StatsLayout from '$lib/components/StatsLayout.svelte';
  
  export let data;
  
  const navItems = [
    { label: "All Time Scoring", href: "/league/all_time_stats" },
    { label: "Regular Season Scoring", href: "/league/reg_season_stats" },
    { label: "Playoff Scoring", href: "/league/playoff_stats" },
    { label: "Streaks", href: "/league/streaks" },
    //{ label: "Potential Points", href: "/league/potential_points" },
    { label: "Ranking", href: "/league/ranking" },
    { label: "Rivalries", href: "/league/rivalries" },
    //{ label: "Trophy Room", href: "/league/trophy_room" },
    { label: "Draft Room", href: "/league/drafts", active: true }
  ];

  // Process draft data into grid format
  $: draftGrid = processDraftData(data.draftPicks, data.participants);
  $: maxRounds = Math.max(...(data.draftPicks?.map(pick => pick.round_number) || [0]));
  
  function processDraftData(picks, participants) {
    if (!picks || !participants) return { rounds: [], managers: [] };
    
    // Sort participants by draft position
    const sortedManagers = [...participants].sort((a, b) => a.draft_position - b.draft_position);
    
    // Create grid structure
    const rounds = [];
    for (let round = 1; round <= maxRounds; round++) {
      const roundPicks = picks
        .filter(pick => pick.round_number === round)
        .sort((a, b) => a.pick_in_round - b.pick_in_round);
      
      const roundData = {
        round_number: round,
        picks: sortedManagers.map(manager => {
          const pick = roundPicks.find(p => p.manager_id === manager.manager_id);
          return {
            manager_id: manager.manager_id,
            pick: pick || null
          };
        })
      };
      
      rounds.push(roundData);
    }
    
    return { rounds, managers: sortedManagers };
  }

  // Season selector
  let selectedSeason = data.selectedSeason || '';
  
  function onSeasonChange(e) {
    const season = e.target.value;
    if (season) {
      window.location.href = `/league/drafts?season=${season}`;
    }
  }
</script>

<StatsLayout title="Draft Room" {navItems}>
  <div class="draft-header">
    <div class="season-selector">
      <label for="season">Season:&nbsp;</label>
      <select id="season" bind:value={selectedSeason} on:change={onSeasonChange} class="season-select">
        <option value="" disabled>Select a season...</option>
        {#each data.availableSeasons as season}
          <option value={season.season_year}>{season.season_year} Season</option>
        {/each}
      </select>
    </div>
  </div>

  {#if !selectedSeason}
    <div class="no-season">
      <p>Please select a season to view the draft.</p>
    </div>
  {:else if draftGrid.rounds.length === 0}
    <div class="no-data">
      <p>No draft data available for {selectedSeason}.</p>
    </div>
  {:else}
    <!-- Position Legend and Draft Info -->
    <div class="legend-and-info">
      <div class="legend">
        <span class="legend-title">Position Colors:</span>
        {#each data.positionColors as pos}
          <span class="legend-item" style="background-color: {pos.background_color}; color: {pos.color_hex};">
            {pos.position}
          </span>
        {/each}
      </div>
      
      <div class="draft-summary">
        <h2>{selectedSeason} Draft</h2>
        {#if data.draftInfo}
          <p>
            {data.draftInfo.total_rounds} Rounds • 
            {data.participants?.length || 0} Teams •
            {data.draftInfo.draft_type === 'snake' ? 'Snake Draft' : 'Linear Draft'}
          </p>
        {/if}
      </div>
    </div>

    <!-- Draft Grid -->
    <div class="draft-container">
      <div class="draft-grid">
        <!-- Header Row with Manager Names -->
        <div class="grid-header">
          <div class="round-header">Round</div>
          {#each draftGrid.managers as manager}
            <div class="manager-header">
              <div class="manager-info">
                {#if manager.manager_logo}
                  <img src={manager.manager_logo} alt={manager.manager_name} class="manager-logo" />
                {/if}
                <div class="manager-details">
                  <div class="manager-name">{manager.manager_name}</div>
                  <div class="draft-position">Pick #{manager.draft_position}</div>
                </div>
              </div>
            </div>
          {/each}
        </div>

        <!-- Draft Rounds -->
        {#each draftGrid.rounds as round}
          <div class="grid-row">
            <div class="round-cell">
              <span class="round-number">{round.round_number}</span>
            </div>
            {#each round.picks as managerPick}
              <div class="pick-cell">
                {#if managerPick.pick}
                  <div 
                    class="pick-content"
                    style="background-color: {managerPick.pick.background_color}; color: {managerPick.pick.color_hex};"
                  >
                    <div class="player-name">{managerPick.pick.player_name}</div>
                    <div class="player-details">
                      <span class="position">{managerPick.pick.position}</span>
                      <span class="team">({managerPick.pick.player_nfl_team})</span>
                    </div>
                    <div class="pick-number">#{managerPick.pick.pick_number}</div>
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
</StatsLayout>

<style>
  .draft-header {
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

  .season-selector {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .season-selector label {
    font-weight: bold;
    color: #495057;
    font-size: 1rem;
  }

  .season-select {
    padding: 0.5rem 1rem;
    font-size: 1rem;
    border: 2px solid #ced4da;
    border-radius: 6px;
    background: white;
    color: #495057;
    min-width: 180px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .season-select:hover {
    border-color: #007bff;
    box-shadow: 0 2px 4px rgba(0, 123, 255, 0.1);
  }

  .season-select:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25);
  }

  .season-select option {
    padding: 0.5rem;
    background: white;
    color: #495057;
  }

  .season-select option:disabled {
    color: #6c757d;
    font-style: italic;
  }

  .draft-info h2 {
    margin: 0;
    color: #003366;
  }

  .draft-info p {
    margin: 0.25rem 0 0 0;
    color: #666;
    font-size: 0.9rem;
  }

  .no-season, .no-data {
    text-align: center;
    padding: 3rem;
    color: #666;
    font-size: 1.1rem;
  }

  .legend-and-info {
    display: flex;
    align-items: center;
    margin-bottom: 1rem;
    padding: 0.75rem;
    background: #f8f9fa;
    border-radius: 6px;
    position: relative;
  }

  .legend {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .draft-summary {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    text-align: center;
  }

  .draft-summary h2 {
    margin: 0 0 0.25rem 0;
    color: #003366;
    font-size: 1.5rem;
  }

  .draft-summary p {
    margin: 0;
    color: #666;
    font-size: 0.9rem;
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

  .draft-container {
    overflow-x: auto;
    max-width: 100vw;
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
    width: 60px;
    padding: 0.75rem 0.4rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-right: 1px solid #fff;
    font-size: 0.8rem;
  }

  .manager-header {
    flex: 1;
    min-width: 110px;
    padding: 0.6rem;
    border-right: 1px solid #fff;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .manager-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.2rem;
  }

  .manager-logo {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    object-fit: cover;
  }

  .manager-details {
    text-align: center;
  }

  .manager-name {
    font-size: 0.8rem;
    font-weight: bold;
    line-height: 1.1;
  }

  .draft-position {
    font-size: 0.7rem;
    opacity: 0.9;
  }

  .grid-row {
    display: flex;
    border-top: 1px solid #ddd;
  }

  .grid-row:nth-child(even) {
    background: #f9f9f9;
  }

  .round-cell {
    width: 60px;
    padding: 0.6rem 0.4rem;
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
    min-width: 110px;
    min-height: 65px;
    border-right: 1px solid #ddd;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.4rem;
  }

  .pick-content {
    width: 100%;
    height: 100%;
    border-radius: 5px;
    padding: 0.4rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    position: relative;
    border: 1px solid rgba(0,0,0,0.1);
  }

  .player-name {
    font-weight: bold;
    font-size: 0.8rem;
    line-height: 1.1;
    margin-bottom: 0.2rem;
  }

  .player-details {
    font-size: 0.7rem;
    opacity: 0.9;
  }

  .position {
    font-weight: bold;
  }

  .team {
    margin-left: 0.2rem;
  }

  .pick-number {
    position: absolute;
    top: 0.2rem;
    right: 0.2rem;
    font-size: 0.65rem;
    opacity: 0.8;
  }

  .empty-pick {
    color: #ccc;
    font-size: 1.1rem;
  }

  @media (max-width: 768px) {
    .draft-header {
      flex-direction: column;
      gap: 1rem;
      align-items: stretch;
    }

    .legend {
      flex-direction: column;
      align-items: flex-start;
    }

    .manager-header {
      min-width: 80px;
      padding: 0.5rem;
    }

    .pick-cell {
      min-width: 80px;
      min-height: 55px;
      padding: 0.3rem;
    }

    .player-name {
      font-size: 0.7rem;
    }

    .player-details {
      font-size: 0.65rem;
    }

    .manager-name {
      font-size: 0.75rem;
    }

    .manager-logo {
      width: 24px;
      height: 24px;
    }

    .round-header {
      width: 50px;
      font-size: 0.75rem;
    }

    .round-cell {
      width: 50px;
    }
  }
</style>