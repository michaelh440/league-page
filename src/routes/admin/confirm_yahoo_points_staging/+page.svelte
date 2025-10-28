<script>
  import StatsLayout from '$lib/components/StatsLayout.svelte';
  import StatCard from '$lib/components/StatCard.svelte';
  import { enhance } from '$app/forms';

  export let data;
  export let form;

  const navItems = [
    { label: "Confirm Yahoo Points", href: "/admin/confirm_yahoo_points_staging", active: true }
  ];

  let selectedPlayer = null;
  let selectedPosition = '';
  let searchTerm = '';
  let filterType = 'all';

  // Filter players based on search and filter type
  $: filteredPlayers = (data.players || []).filter(player => {
    const matchesSearch = player.player_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    switch (filterType) {
      case 'missing':
        return player.position === null;
      case 'wrt':
        return player.selected_position === 'W/R/T';
      case 'bench':
        return player.selected_position === 'BN';
      default:
        return true;
    }
  });

  function selectPlayer(player) {
    selectedPlayer = player;
    selectedPosition = player.position || '';
  }
</script>

<StatsLayout title="Confirm Yahoo Player Positions" {navItems}>
  <div class="content-grid">
    
    <!-- Stats Summary Row -->
    <StatCard size="sm">
      <div class="stat-summary">
        <div class="stat-label">Total Players</div>
        <div class="stat-value">{data.summary.totalPlayers}</div>
      </div>
    </StatCard>

    <StatCard size="sm">
      <div class="stat-summary">
        <div class="stat-label">Missing Position</div>
        <div class="stat-value highlight-warning">{data.summary.missingPosition}</div>
      </div>
    </StatCard>

    <StatCard size="sm">
      <div class="stat-summary">
        <div class="stat-label">W/R/T Slots</div>
        <div class="stat-value">{data.summary.wrtSlots}</div>
      </div>
    </StatCard>

    <StatCard size="sm">
      <div class="stat-summary">
        <div class="stat-label">Bench Slots</div>
        <div class="stat-value">{data.summary.benchSlots}</div>
      </div>
    </StatCard>

    <!-- Search and Filter Controls -->
    <StatCard size="full">
      <div class="controls-wrapper">
        <div class="search-box">
          <input 
            type="text" 
            placeholder="Search players..." 
            bind:value={searchTerm}
          />
        </div>
        
        <div class="filter-buttons">
          <button 
            class:active={filterType === 'all'} 
            on:click={() => filterType = 'all'}
          >
            All Players
          </button>
          <button 
            class:active={filterType === 'missing'} 
            on:click={() => filterType = 'missing'}
          >
            Missing Position
          </button>
          <button 
            class:active={filterType === 'wrt'} 
            on:click={() => filterType = 'wrt'}
          >
            W/R/T Slots
          </button>
          <button 
            class:active={filterType === 'bench'} 
            on:click={() => filterType = 'bench'}
          >
            Bench Slots
          </button>
        </div>
      </div>
    </StatCard>

    <!-- Message Display -->
    {#if form?.success}
      <StatCard size="full">
        <div class="message-box success">
          ✓ {form.message}
        </div>
      </StatCard>
    {/if}

    {#if form?.error}
      <StatCard size="full">
        <div class="message-box error">
          ✗ {form.message}
        </div>
      </StatCard>
    {/if}

    <!-- Player List -->
    <StatCard size="lg">
      <div class="table-wrapper">
        <table class="stats-table">
          <thead>
            <tr><th class="table-title" colspan="5">Players Needing Position Assignment</th></tr>
            <tr>
              <th>Player Name</th>
              <th>Current Position</th>
              <th>Slot</th>
              <th>Rows</th>
              <th>Weeks</th>
            </tr>
          </thead>
          <tbody>
            {#each filteredPlayers as player}
              <tr 
                class:selected={selectedPlayer?.player_name === player.player_name}
                on:click={() => selectPlayer(player)}
              >
                <td class="player-name-cell">{player.player_name}</td>
                <td class="position-cell">
                  {#if player.position}
                    <span class="badge badge-position">{player.position}</span>
                  {:else}
                    <span class="badge badge-missing">NULL</span>
                  {/if}
                </td>
                <td class="slot-cell">{player.selected_position || 'N/A'}</td>
                <td class="count-cell">{player.row_count}</td>
                <td class="weeks-cell">{player.weeks_played}</td>
              </tr>
            {:else}
              <tr><td colspan="5" class="text-center text-gray-600">No players found</td></tr>
            {/each}
          </tbody>
        </table>
      </div>
    </StatCard>

    <!-- Update Form -->
    <StatCard size="lg">
      <div class="form-wrapper">
        <div class="form-title">Update Player Position</div>
        
        {#if selectedPlayer}
          <form method="POST" action="?/updatePosition" use:enhance>
            <input type="hidden" name="playerName" value={selectedPlayer.player_name} />
            
            <div class="form-group">
              <label>Selected Player:</label>
              <div class="selected-player-display">{selectedPlayer.player_name}</div>
            </div>

            <div class="form-group">
              <label>Current Position:</label>
              <div class="current-position-display">
                {#if selectedPlayer.position}
                  <span class="badge badge-position">{selectedPlayer.position}</span>
                {:else}
                  <span class="badge badge-missing">Not Set</span>
                {/if}
              </div>
            </div>

            <div class="form-group">
              <label>New Position:</label>
              <select name="position" bind:value={selectedPosition} required>
                <option value="">-- Select Position --</option>
                <option value="QB">QB - Quarterback</option>
                <option value="RB">RB - Running Back</option>
                <option value="WR">WR - Wide Receiver</option>
                <option value="TE">TE - Tight End</option>
                <option value="K">K - Kicker</option>
                <option value="DEF">DEF - Defense</option>
              </select>
            </div>

            <div class="form-info">
              This will update <strong>{selectedPlayer.row_count}</strong> row(s) for {selectedPlayer.player_name}
            </div>

            <button type="submit" class="submit-button" disabled={!selectedPosition}>
              Update Position
            </button>
          </form>
        {:else}
          <div class="no-selection">
            Select a player from the list to update their position
          </div>
        {/if}
      </div>
    </StatCard>

  </div>
</StatsLayout>

<style>
  .content-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  /* Stat Summary Cards */
  .stat-summary {
    text-align: center;
    padding: 1rem;
  }

  .stat-label {
    font-size: 0.85rem;
    color: #6c757d;
    font-weight: 600;
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .stat-value {
    font-size: 2rem;
    font-weight: 700;
    color: #003366;
  }

  .highlight-warning {
    color: #dc3545;
  }

  /* Controls */
  .controls-wrapper {
    padding: 1rem;
    display: flex;
    gap: 1rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .search-box {
    flex: 1;
    min-width: 200px;
  }

  .search-box input {
    width: 100%;
    padding: 0.5rem 1rem;
    border: 1px solid #ced4da;
    border-radius: 4px;
    font-size: 0.9rem;
  }

  .filter-buttons {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .filter-buttons button {
    padding: 0.5rem 1rem;
    border: 1px solid #ced4da;
    background: white;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.85rem;
    transition: all 0.2s;
  }

  .filter-buttons button:hover {
    background: #f8f9fa;
  }

  .filter-buttons button.active {
    background: #003366;
    color: white;
    border-color: #003366;
  }

  /* Message Box */
  .message-box {
    padding: 1rem;
    border-radius: 4px;
    font-weight: 500;
    text-align: center;
  }

  .message-box.success {
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
  }

  .message-box.error {
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  }

  /* Table Styles */
  .table-wrapper {
    overflow-x: auto;
    border-radius: 8px;
  }

  .stats-table {
    width: 100%;
    border-collapse: collapse;
    background: white;
  }

  .stats-table th {
    padding: 0.75rem;
    text-align: left;
    font-weight: 600;
    background: #e9ecef;
    color: #495057;
    font-size: 0.85rem;
  }

  .table-title {
    background: linear-gradient(135deg, #003366, #004080) !important;
    color: white !important;
    text-align: center !important;
    font-size: 1rem;
    padding: 1rem;
  }

  .stats-table td {
    padding: 0.75rem;
    border-top: 1px solid #dee2e6;
    font-size: 0.9rem;
  }

  .stats-table tbody tr {
    cursor: pointer;
    transition: background 0.2s;
  }

  .stats-table tbody tr:hover {
    background: #f8f9fa;
  }

  .stats-table tbody tr.selected {
    background: #e3f2fd;
  }

  .player-name-cell {
    font-weight: 600;
    color: #212529;
  }

  .badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .badge-position {
    background: #d4edda;
    color: #155724;
  }

  .badge-missing {
    background: #f8d7da;
    color: #721c24;
  }

  .count-cell,
  .weeks-cell {
    text-align: center;
    color: #6c757d;
    font-weight: 500;
  }

  .text-center {
    text-align: center;
  }

  .text-gray-600 {
    color: #6c757d;
  }

  /* Form Styles */
  .form-wrapper {
    padding: 1.5rem;
  }

  .form-title {
    font-size: 1.1rem;
    font-weight: 700;
    color: #003366;
    margin-bottom: 1.5rem;
    text-align: center;
  }

  .form-group {
    margin-bottom: 1.25rem;
  }

  .form-group label {
    display: block;
    font-weight: 600;
    color: #495057;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
  }

  .selected-player-display,
  .current-position-display {
    padding: 0.75rem;
    background: #f8f9fa;
    border-radius: 4px;
    font-weight: 500;
  }

  .form-group select {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ced4da;
    border-radius: 4px;
    font-size: 0.9rem;
    background: white;
  }

  .form-info {
    padding: 0.75rem;
    background: #e7f3ff;
    border-left: 3px solid #007bff;
    border-radius: 4px;
    font-size: 0.85rem;
    color: #004085;
    margin-bottom: 1rem;
  }

  .submit-button {
    width: 100%;
    padding: 0.75rem;
    background: linear-gradient(135deg, #003366, #004080);
    color: white;
    border: none;
    border-radius: 4px;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: opacity 0.2s;
  }

  .submit-button:hover:not(:disabled) {
    opacity: 0.9;
  }

  .submit-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .no-selection {
    text-align: center;
    padding: 2rem;
    color: #6c757d;
    font-style: italic;
  }

  /* Mobile Styles */
  @media (max-width: 768px) {
    .content-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
      padding: 0 0.5rem;
    }

    .controls-wrapper {
      flex-direction: column;
      align-items: stretch;
    }

    .search-box {
      min-width: 100%;
    }

    .filter-buttons {
      justify-content: stretch;
    }

    .filter-buttons button {
      flex: 1;
      min-width: 0;
    }

    .stats-table {
      font-size: 0.8rem;
    }

    .stats-table th,
    .stats-table td {
      padding: 0.5rem 0.4rem;
    }

    .stat-value {
      font-size: 1.5rem;
    }
  }
</style>