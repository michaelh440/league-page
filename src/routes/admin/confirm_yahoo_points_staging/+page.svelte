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
  let aiSuggestions = {}; // Map of player_id -> suggestion
  let aiLoading = false;
  let playerLimit = 100;

  // Filter players
  $: filteredPlayers = (data.players || []).filter(player => {
    const matchesSearch = player.player_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    switch (filterType) {
      case 'missing':
        return player.position === null;
      case 'wrt':
        return player.lineup_slot === 'W/R/T';
      case 'bench':
        return player.lineup_slot === 'BN';
      default:
        return true;
    }
  });

  // Players missing positions (limited for display)
  $: playersNeedingPosition = filteredPlayers
    .filter(p => p.position === null)
    .slice(0, playerLimit);

  function selectPlayer(player) {
    selectedPlayer = player;
    selectedPosition = player.position || '';
  }

  let aiFormElement;

  async function runAIDetection() {
    if (playersNeedingPosition.length === 0) {
      alert('No players need position detection');
      return;
    }

    console.log('Starting AI detection...');
    console.log('Players to analyze:', playersNeedingPosition.length);
    
    aiLoading = true;
    aiSuggestions = {}; // Clear previous suggestions
    
    // Trigger the form submission
    if (aiFormElement) {
      aiFormElement.requestSubmit();
    }
  }

  function handleAIResponse() {
    return async ({ result, update }) => {
      console.log('Form action result:', result);
      
      if (result.type === 'success' && result.data) {
        const data = result.data;
        console.log('Success data:', data);
        
        if (data.success && data.suggestions && Array.isArray(data.suggestions)) {
          console.log('Processing', data.suggestions.length, 'suggestions');
          
          // Convert array to map for easy lookup
          data.suggestions.forEach(suggestion => {
            aiSuggestions[suggestion.player_id] = {
              ...suggestion,
              edited: false
            };
          });
          aiSuggestions = { ...aiSuggestions }; // Trigger reactivity
          console.log('AI suggestions stored:', Object.keys(aiSuggestions).length);
        } else {
          console.error('Unexpected data structure:', data);
          alert('Received response but in unexpected format: ' + (data.message || 'No suggestions'));
        }
      } else if (result.type === 'failure') {
        console.error('Form action failed:', result);
        alert('AI detection failed: ' + (result.data?.message || 'Unknown error'));
      }
      
      aiLoading = false;
      await update();
    };
  }

  function changeSuggestion(playerId, newPosition) {
    if (aiSuggestions[playerId]) {
      aiSuggestions[playerId].position = newPosition;
      aiSuggestions[playerId].edited = true;
      aiSuggestions[playerId].confidence = 'edited';
      aiSuggestions = { ...aiSuggestions }; // Trigger reactivity
    }
  }

  function getConfidenceColor(confidence) {
    return {
      'high': '#28a745',
      'medium': '#ffc107',
      'low': '#dc3545',
      'edited': '#007bff'
    }[confidence] || '#6c757d';
  }

  // Reactive statement to check if we have suggestions
  $: hasAnySuggestions = Object.keys(aiSuggestions).length > 0;
  $: suggestionCount = Object.keys(aiSuggestions).length;

  function getSuggestionsToApply() {
    return Object.entries(aiSuggestions)
      .map(([player_id, suggestion]) => ({
        player_id: parseInt(player_id),
        position: suggestion.position,
        source: suggestion.edited ? 'manual_admin' : 'ai_detected'
      }));
  }
</script>

<StatsLayout title="Confirm Yahoo Player Positions" {navItems}>
  <div class="content-grid">
    
    <!-- Confirm Button (Top Right) -->
    {#if hasAnySuggestions}
      <div class="confirm-button-container">
        <form method="POST" action="?/applyAISuggestions" use:enhance class="confirm-form-inline">
          <input type="hidden" name="suggestions" value={JSON.stringify(getSuggestionsToApply())} />
          <button type="submit" class="confirm-button-small">
            ✓ Confirm {suggestionCount}
          </button>
        </form>
      </div>
    {/if}
    
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

        <div class="limit-control">
          <label>Show:</label>
          <select bind:value={playerLimit}>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
          </select>
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

    <!-- Player List with AI Suggestions -->
    <StatCard size="full">
      <!-- Hidden form for AI detection -->
      <form 
        bind:this={aiFormElement}
        method="POST" 
        action="?/aiDetectPositions" 
        use:enhance={handleAIResponse}
        style="display: none;"
      >
        <input type="hidden" name="playerIds" value={JSON.stringify(playersNeedingPosition.map(p => p.player_id))} />
      </form>

      <div class="table-wrapper">
        <table class="stats-table">
          <thead>
            <tr><th class="table-title" colspan="7">Players Needing Position Assignment</th></tr>
            <tr>
              <th>Player Name</th>
              <th>Current Position</th>
              <th>Slot</th>
              <th>Rows</th>
              <th>Weeks</th>
              <th>
                <button 
                  class="ai-header-button" 
                  on:click={runAIDetection}
                  disabled={aiLoading || playersNeedingPosition.length === 0}
                >
                  {#if aiLoading}
                    ⏳ Analyzing...
                  {:else}
                    🤖 AI Suggestion
                  {/if}
                </button>
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each playersNeedingPosition as player}
              <tr 
                class:selected={selectedPlayer?.player_name === player.player_name}
                class:has-suggestion={aiSuggestions[player.player_id]}
              >
                <td class="player-name-cell">{player.player_name}</td>
                <td class="position-cell">
                  {#if player.position}
                    <span class="badge badge-position">{player.position}</span>
                  {:else}
                    <span class="badge badge-missing">NULL</span>
                  {/if}
                </td>
                <td class="slot-cell">{player.lineup_slot || 'N/A'}</td>
                <td class="count-cell">{player.row_count}</td>
                <td class="weeks-cell">{player.weeks_played}</td>
                <td class="ai-suggestion-cell">
                  {#if aiSuggestions[player.player_id]}
                    <div class="suggestion-container">
                      <select 
                        class="position-select"
                        value={aiSuggestions[player.player_id].position}
                        on:change={(e) => changeSuggestion(player.player_id, e.target.value)}
                      >
                        <option value="QB">QB</option>
                        <option value="RB">RB</option>
                        <option value="WR">WR</option>
                        <option value="TE">TE</option>
                        <option value="K">K</option>
                        <option value="DEF">DEF</option>
                      </select>
                      <span 
                        class="confidence-dot"
                        style="background-color: {getConfidenceColor(aiSuggestions[player.player_id].confidence)}"
                        title="{aiSuggestions[player.player_id].confidence} confidence: {aiSuggestions[player.player_id].reasoning}"
                      ></span>
                    </div>
                  {:else if aiLoading}
                    <span class="loading-text">...</span>
                  {:else}
                    <span class="no-suggestion">—</span>
                  {/if}
                </td>
                <td class="actions-cell">
                  <button 
                    class="manual-button"
                    on:click={() => selectPlayer(player)}
                    title="Manual edit"
                  >
                    ✏️
                  </button>
                </td>
              </tr>
            {:else}
              <tr><td colspan="7" class="text-center text-gray-600">No players found</td></tr>
            {/each}
          </tbody>
        </table>
      </div>
      
      {#if playersNeedingPosition.length === 0 && data.summary.missingPosition > 0}
        <div class="table-footer">
          Showing {playerLimit} of {data.summary.missingPosition} players. Increase limit to see more.
        </div>
      {/if}
    </StatCard>

    <!-- Manual Update Form (appears when player selected) -->
    {#if selectedPlayer}
      <StatCard size="lg">
        <div class="form-wrapper">
          <div class="form-title">Manual Position Update</div>
          
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
        </div>
      </StatCard>
    {/if}

  </div>
</StatsLayout>

<style>
  .confirm-button-container {
    position: absolute;
    top: 1rem;
    right: 1rem;
    z-index: 10;
  }

  .confirm-form-inline {
    margin: 0;
  }

  .confirm-button-small {
    padding: 0.5rem 1rem;
    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
    color: white;
    border: none;
    border-radius: 6px;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    white-space: nowrap;
    transition: transform 0.2s, box-shadow 0.2s;
    box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3);
  }

  .confirm-button-small:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(40, 167, 69, 0.4);
  }

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

  .limit-control {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .limit-control label {
    font-weight: 600;
    font-size: 0.9rem;
    color: #495057;
  }

  .limit-control select {
    padding: 0.5rem;
    border: 1px solid #ced4da;
    border-radius: 4px;
    font-size: 0.9rem;
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

  .ai-header-button {
    width: 100%;
    padding: 0.5rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 4px;
    font-weight: 600;
    font-size: 0.85rem;
    cursor: pointer;
    transition: opacity 0.2s;
  }

  .ai-header-button:hover:not(:disabled) {
    opacity: 0.9;
  }

  .ai-header-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .stats-table td {
    padding: 0.75rem;
    border-top: 1px solid #dee2e6;
    font-size: 0.9rem;
  }

  .stats-table tbody tr {
    transition: background 0.2s;
  }

  .stats-table tbody tr:hover {
    background: #f8f9fa;
  }

  .stats-table tbody tr.selected {
    background: #e3f2fd;
  }

  .stats-table tbody tr.has-suggestion {
    background: #f0fff4;
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

  /* AI Suggestion Cell */
  .ai-suggestion-cell {
    text-align: center;
  }

  .suggestion-container {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    justify-content: center;
  }

  .position-select {
    padding: 0.4rem 0.6rem;
    border: 2px solid #667eea;
    border-radius: 4px;
    font-weight: 600;
    font-size: 0.85rem;
    background: white;
    cursor: pointer;
  }

  .confidence-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    display: inline-block;
    cursor: help;
  }

  .loading-text {
    color: #6c757d;
    font-style: italic;
  }

  .no-suggestion {
    color: #dee2e6;
  }

  /* Actions Cell */
  .actions-cell {
    text-align: center;
  }

  .manual-button {
    padding: 0.4rem 0.6rem;
    background: #6c757d;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.85rem;
    transition: background 0.2s;
  }

  .manual-button:hover {
    background: #5a6268;
  }

  .table-footer {
    padding: 1rem;
    text-align: center;
    color: #6c757d;
    font-size: 0.9rem;
    background: #f8f9fa;
    border-top: 1px solid #dee2e6;
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

  /* Mobile Styles */
  @media (max-width: 768px) {
    .content-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
      padding: 0 0.5rem;
    }

    .confirm-section {
      flex-direction: column;
      text-align: center;
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