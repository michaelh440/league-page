<script>
  let leagueId = '1045478045957693440';
  let season = 2024;
  let startingWeek = 1;
  let totalWeeks = 16;
  let isArchiving = false;
  let results = [];
  let summary = {
    totalStaged: { rosters: 0, stats: 0 },
    totalProcessed: { rosters: 0, stats: 0 }
  };

  async function startArchive() {
    if (isArchiving) return;
    
    isArchiving = true;
    results = [];
    summary = {
      totalStaged: { rosters: 0, stats: 0 },
      totalProcessed: { rosters: 0, stats: 0 }
    };

    const endWeek = startingWeek + totalWeeks - 1;

    for (let week = startingWeek; week <= endWeek; week++) {
      try {
        const response = await fetch(
          `/api/archive_rosters_stats?league_id=${leagueId}&season=${season}&week=${week}`
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
</script>

<div class="container">
  <h1>Archive Rosters and Stats</h1>
  
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
      <label for="startingWeek">Starting Week:</label>
      <input 
        id="startingWeek"
        type="number" 
        bind:value={startingWeek} 
        min="1"
        max="18"
        disabled={isArchiving}
      />
    </div>
    
    <div class="input-group">
      <label for="totalWeeks">Total Weeks:</label>
      <input 
        id="totalWeeks"
        type="number" 
        bind:value={totalWeeks} 
        min="1"
        max="18"
        disabled={isArchiving}
      />
    </div>
    
    <button 
      on:click={startArchive} 
      disabled={isArchiving}
      class="start-button"
    >
      {isArchiving ? 'Archiving...' : 'Start Archive'}
    </button>
    
    <p class="info">
      Will archive weeks {startingWeek} through {startingWeek + totalWeeks - 1}
    </p>
  </div>
  
  {#if results.length > 0}
    <div class="summary">
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
          <h3>Week {result.week}</h3>
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
      <div class="progress-bar" style="width: {(results.length / totalWeeks) * 100}%"></div>
    </div>
  {/if}
</div>

<style>
  .container {
    max-width: 800px;
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
    margin-bottom: 1rem;
  }
  
  .input-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #555;
  }
  
  .input-group input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
  }
  
  .start-button {
    width: 100%;
    padding: 1rem;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    margin-top: 1rem;
  }
  
  .start-button:hover:not(:disabled) {
    background: #0056b3;
  }
  
  .start-button:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
  
  .info {
    margin-top: 1rem;
    color: #666;
    font-style: italic;
    text-align: center;
  }
  
  .summary {
    background: #e8f5e9;
    padding: 1.5rem;
    border-radius: 8px;
    margin-bottom: 2rem;
  }
  
  .summary h2 {
    margin-top: 0;
    color: #2e7d32;
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
    color: #2e7d32;
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
    background: linear-gradient(90deg, #4caf50, #81c784);
    transition: width 0.3s ease;
  }
</style>