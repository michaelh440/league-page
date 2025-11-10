<script>
  let leagueId = '1045478045957693440';
  let season = 2024;
  let archiveType = 'regular'; // 'regular' or 'playoff'
  let startingWeek = 1;
  let totalWeeks = 14;
  let isArchiving = false;
  let results = [];
  let summary = {
    totalStaged: { rosters: 0, stats: 0 },
    totalProcessed: { rosters: 0, stats: 0 }
  };

  // Update starting week based on archive type
  $: if (archiveType === 'playoff' && startingWeek < 15) {
    startingWeek = 15;
  } else if (archiveType === 'regular' && startingWeek > 14) {
    startingWeek = 1;
  }

  async function startArchive() {
    if (isArchiving) return;
    
    isArchiving = true;
    results = [];
    summary = {
      totalStaged: { rosters: 0, stats: 0 },
      totalProcessed: { rosters: 0, stats: 0 }
    };

    const endWeek = startingWeek + totalWeeks - 1;
    const endpoint = archiveType === 'regular' ? '/api/archive_rosters_stats' : '/api/archive_playoff';

    for (let week = startingWeek; week <= endWeek; week++) {
      try {
        const response = await fetch(
          `${endpoint}?league_id=${leagueId}&season=${season}&week=${week}`
        );
        const data = await response.json();
        
        if (data.success) {
          results.push({
            week,
            success: true,
            staged: data.staged,
            processed: data.processed
          });
          
          // Update summary
          summary.totalStaged.rosters += data.staged.rosters;
          summary.totalStaged.stats += data.staged.stats;
          summary.totalProcessed.rosters += data.processed.rosters;
          summary.totalProcessed.stats += data.processed.stats;
        } else {
          results.push({
            week,
            success: false,
            error: data.error
          });
        }
      } catch (error) {
        results.push({
          week,
          success: false,
          error: error.message
        });
      }
      
      // Trigger reactivity
      results = results;
      summary = summary;
      
      // Wait 1 second between requests to avoid overwhelming the server
      if (week < endWeek) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    isArchiving = false;
  }

  // Helper to get week range constraints based on archive type
  $: weekConstraints = archiveType === 'regular' 
    ? { min: 1, max: 14 } 
    : { min: 15, max: 18 };
</script>

<div class="container">
  <h1>Archive Fantasy Football Data</h1>
  
  <div class="config">
    <div class="input-group">
      <label for="leagueId">League ID:</label>
      <input 
        id="leagueId"
        type="text" 
        bind:value={leagueId} 
        disabled={isArchiving}
      />
    </div>
    
    <div class="input-group">
      <label for="season">Season:</label>
      <input 
        id="season"
        type="number" 
        bind:value={season} 
        disabled={isArchiving}
      />
    </div>
    
    <div class="input-group">
      <label for="archiveType">Archive Type:</label>
      <select 
        id="archiveType"
        bind:value={archiveType} 
        disabled={isArchiving}
        class="select-input"
      >
        <option value="regular">Regular Season</option>
        <option value="playoff">Playoffs</option>
      </select>
      <div class="help-text">
        {#if archiveType === 'regular'}
          Regular season data goes to <code>weekly_roster</code> and <code>player_fantasy_stats</code>
        {:else}
          Playoff data goes to <code>playoff_roster</code> and <code>playoff_fantasy_stats</code>
        {/if}
      </div>
    </div>
    
    <div class="input-group">
      <label for="startingWeek">Starting Week:</label>
      <input 
        id="startingWeek"
        type="number" 
        bind:value={startingWeek} 
        min={weekConstraints.min}
        max={weekConstraints.max}
        disabled={isArchiving}
      />
      <div class="help-text">
        {#if archiveType === 'regular'}
          Regular season weeks: 1-14
        {:else}
          Playoff weeks: 15-18
        {/if}
      </div>
    </div>
    
    <div class="input-group">
      <label for="totalWeeks">Total Weeks to Archive:</label>
      <input 
        id="totalWeeks"
        type="number" 
        bind:value={totalWeeks} 
        min="1"
        max="18"
        disabled={isArchiving}
      />
    </div>
    
    <div class="preview-box">
      <strong>Preview:</strong> Will archive 
      <span class="highlight">{archiveType === 'regular' ? 'Regular Season' : 'Playoff'}</span> 
      weeks <span class="highlight">{startingWeek}</span> through 
      <span class="highlight">{startingWeek + totalWeeks - 1}</span>
      for season <span class="highlight">{season}</span>
    </div>
    
    <button 
      on:click={startArchive} 
      disabled={isArchiving}
      class="start-button"
      class:regular={archiveType === 'regular'}
      class:playoff={archiveType === 'playoff'}
    >
      {isArchiving ? 'Archiving...' : `Start ${archiveType === 'regular' ? 'Regular Season' : 'Playoff'} Archive`}
    </button>
  </div>
  
  {#if results.length > 0}
    <div class="summary" class:regular={archiveType === 'regular'} class:playoff={archiveType === 'playoff'}>
      <h2>Summary</h2>
      <div class="summary-stats">
        <div class="stat">
          <span class="label">Weeks Processed:</span>
          <span class="value">{results.filter(r => r.success).length} / {results.length}</span>
        </div>
        <div class="stat">
          <span class="label">Total Rosters Staged:</span>
          <span class="value">{summary.totalStaged.rosters}</span>
        </div>
        <div class="stat">
          <span class="label">Total Rosters Processed:</span>
          <span class="value">{summary.totalProcessed.rosters}</span>
        </div>
        <div class="stat">
          <span class="label">Total Stats Staged:</span>
          <span class="value">{summary.totalStaged.stats}</span>
        </div>
        <div class="stat">
          <span class="label">Total Stats Processed:</span>
          <span class="value">{summary.totalProcessed.stats}</span>
        </div>
      </div>
    </div>
    
    <div class="results">
      <h2>Results by Week</h2>
      {#each results as result}
        <div class="result-item" class:success={result.success} class:error={!result.success}>
          <h3>
            Week {result.week}
            {#if archiveType === 'playoff'}
              <span class="badge playoff-badge">Playoff</span>
            {:else}
              <span class="badge regular-badge">Regular</span>
            {/if}
          </h3>
          {#if result.success}
            <div class="result-details">
              <div class="detail">
                <span class="label">Staged:</span>
                <span class="value">
                  {result.staged.rosters} rosters, {result.staged.stats} stats
                </span>
              </div>
              <div class="detail">
                <span class="label">Processed:</span>
                <span class="value">
                  {result.processed.rosters} rosters, {result.processed.stats} stats
                </span>
              </div>
            </div>
          {:else}
            <div class="error-message">
              Error: {result.error}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
  
  {#if isArchiving}
    <div class="progress">
      <div 
        class="progress-bar" 
        class:regular={archiveType === 'regular'}
        class:playoff={archiveType === 'playoff'}
        style="width: {(results.length / totalWeeks) * 100}%"
      ></div>
    </div>
  {/if}
</div>

<style>
  .container {
    max-width: 900px;
    margin: 0 auto;
    padding: 2rem;
  }
  
  h1 {
    color: #333;
    margin-bottom: 2rem;
  }
  
  .config {
    background: #f5f5f5;
    padding: 1.5rem;
    border-radius: 8px;
    margin-bottom: 2rem;
  }
  
  .input-group {
    margin-bottom: 1.5rem;
  }
  
  .input-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #555;
  }
  
  .input-group input,
  .select-input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
    background: white;
  }
  
  .select-input {
    cursor: pointer;
  }
  
  .help-text {
    margin-top: 0.5rem;
    font-size: 0.875rem;
    color: #666;
    font-style: italic;
  }
  
  .help-text code {
    background: #e0e0e0;
    padding: 0.125rem 0.375rem;
    border-radius: 3px;
    font-family: 'Courier New', monospace;
    font-size: 0.85rem;
  }
  
  .preview-box {
    background: white;
    padding: 1rem;
    border-radius: 4px;
    border: 2px solid #007bff;
    margin: 1.5rem 0;
    font-size: 1rem;
  }
  
  .preview-box .highlight {
    font-weight: 700;
    color: #007bff;
  }
  
  .start-button {
    width: 100%;
    padding: 1rem;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.3s;
  }
  
  .start-button.regular {
    background: #007bff;
  }
  
  .start-button.regular:hover:not(:disabled) {
    background: #0056b3;
  }
  
  .start-button.playoff {
    background: #9c27b0;
  }
  
  .start-button.playoff:hover:not(:disabled) {
    background: #7b1fa2;
  }
  
  .start-button:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
  
  .summary {
    padding: 1.5rem;
    border-radius: 8px;
    margin-bottom: 2rem;
  }
  
  .summary.regular {
    background: #e3f2fd;
  }
  
  .summary.playoff {
    background: #f3e5f5;
  }
  
  .summary h2 {
    margin-top: 0;
  }
  
  .summary.regular h2 {
    color: #1976d2;
  }
  
  .summary.playoff h2 {
    color: #7b1fa2;
  }
  
  .summary-stats {
    display: grid;
    gap: 1rem;
  }
  
  .stat {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem;
    background: white;
    border-radius: 4px;
  }
  
  .stat .label {
    font-weight: 500;
    color: #555;
  }
  
  .stat .value {
    font-weight: 700;
  }
  
  .summary.regular .stat .value {
    color: #1976d2;
  }
  
  .summary.playoff .stat .value {
    color: #7b1fa2;
  }
  
  .results {
    margin-top: 2rem;
  }
  
  .result-item {
    background: white;
    border: 2px solid #ddd;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1rem;
  }
  
  .result-item.success {
    border-color: #4caf50;
  }
  
  .result-item.error {
    border-color: #f44336;
    background: #ffebee;
  }
  
  .result-item h3 {
    margin: 0 0 0.5rem 0;
    color: #333;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .badge {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
    font-weight: 600;
  }
  
  .regular-badge {
    background: #2196f3;
    color: white;
  }
  
  .playoff-badge {
    background: #9c27b0;
    color: white;
  }
  
  .result-details {
    display: grid;
    gap: 0.5rem;
  }
  
  .detail {
    display: flex;
    justify-content: space-between;
  }
  
  .detail .label {
    color: #666;
  }
  
  .detail .value {
    font-weight: 600;
    color: #333;
  }
  
  .error-message {
    color: #d32f2f;
    font-weight: 500;
  }
  
  .progress {
    width: 100%;
    height: 30px;
    background: #e0e0e0;
    border-radius: 15px;
    overflow: hidden;
    margin-top: 1rem;
  }
  
  .progress-bar {
    height: 100%;
    transition: width 0.3s ease;
  }
  
  .progress-bar.regular {
    background: linear-gradient(90deg, #2196f3, #64b5f6);
  }
  
  .progress-bar.playoff {
    background: linear-gradient(90deg, #9c27b0, #ce93d8);
  }
</style>