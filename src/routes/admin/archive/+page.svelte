<script>
  let leagueID = '1045478045957693440';
  let season = 2024;
  let totalWeeks = 16;
  let currentWeek = 0;
  let isRunning = false;
  let results = [];
  let errors = [];

  async function archiveWeek(week) {
    const url = `/api/archive_rosters_stats?league_id=${leagueID}&season=${season}&week=${week}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        results.push({
          week,
          staged: data.staged,
          processed: data.processed
        });
      } else {
        errors.push({
          week,
          error: data.error
        });
      }
      
      return data;
    } catch (error) {
      errors.push({
        week,
        error: error.message
      });
      throw error;
    }
  }

  async function archiveAllWeeks() {
    isRunning = true;
    results = [];
    errors = [];
    currentWeek = 0;

    for (let week = 1; week <= totalWeeks; week++) {
      currentWeek = week;
      console.log(`Archiving week ${week}...`);
      
      try {
        await archiveWeek(week);
        // Small delay between requests to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error archiving week ${week}:`, error);
        // Continue with next week even if one fails
      }
    }

    isRunning = false;
    currentWeek = 0;
  }

  function getTotalStaged() {
    return {
      rosters: results.reduce((sum, r) => sum + (r.staged?.rosters || 0), 0),
      stats: results.reduce((sum, r) => sum + (r.staged?.stats || 0), 0)
    };
  }

  function getTotalProcessed() {
    return {
      rosters: results.reduce((sum, r) => sum + (r.processed?.rosters || 0), 0),
      stats: results.reduce((sum, r) => sum + (r.processed?.stats || 0), 0)
    };
  }
</script>

<div class="container">
  <h1>Archive Rosters & Player Stats</h1>
  
  <div class="config">
    <div class="field">
      <label for="leagueID">League ID:</label>
      <input id="leagueID" type="text" bind:value={leagueID} disabled={isRunning} />
    </div>
    
    <div class="field">
      <label for="season">Season:</label>
      <input id="season" type="number" bind:value={season} disabled={isRunning} />
    </div>
    
    <div class="field">
      <label for="weeks">Total Weeks:</label>
      <input id="weeks" type="number" bind:value={totalWeeks} disabled={isRunning} />
    </div>
  </div>

  <div class="actions">
    <button on:click={archiveAllWeeks} disabled={isRunning}>
      {#if isRunning}
        Archiving Week {currentWeek} of {totalWeeks}...
      {:else}
        Start Archive
      {/if}
    </button>
  </div>

  {#if isRunning}
    <div class="progress">
      <div class="progress-bar" style="width: {(currentWeek / totalWeeks) * 100}%"></div>
      <span class="progress-text">{currentWeek} / {totalWeeks} weeks</span>
    </div>
  {/if}

  {#if results.length > 0}
    <div class="summary">
      <h2>Summary</h2>
      <div class="stats">
        <div class="stat-box">
          <h3>Staged</h3>
          <p>Rosters: {getTotalStaged().rosters}</p>
          <p>Stats: {getTotalStaged().stats}</p>
        </div>
        <div class="stat-box">
          <h3>Processed</h3>
          <p>Rosters: {getTotalProcessed().rosters}</p>
          <p>Stats: {getTotalProcessed().stats}</p>
        </div>
      </div>
    </div>

    <div class="results">
      <h2>Week Results</h2>
      <table>
        <thead>
          <tr>
            <th>Week</th>
            <th>Rosters Staged</th>
            <th>Stats Staged</th>
            <th>Rosters Processed</th>
            <th>Stats Processed</th>
          </tr>
        </thead>
        <tbody>
          {#each results as result}
            <tr>
              <td>{result.week}</td>
              <td>{result.staged?.rosters || 0}</td>
              <td>{result.staged?.stats || 0}</td>
              <td>{result.processed?.rosters || 0}</td>
              <td>{result.processed?.stats || 0}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}

  {#if errors.length > 0}
    <div class="errors">
      <h2>Errors</h2>
      <ul>
        {#each errors as error}
          <li>
            <strong>Week {error.week}:</strong> {error.error}
          </li>
        {/each}
      </ul>
    </div>
  {/if}
</div>

<style>
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    font-family: system-ui, -apple-system, sans-serif;
  }

  h1 {
    font-size: 2rem;
    margin-bottom: 2rem;
    color: #333;
  }

  h2 {
    font-size: 1.5rem;
    margin: 2rem 0 1rem;
    color: #444;
  }

  .config {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  label {
    font-weight: 600;
    color: #555;
  }

  input {
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
  }

  input:disabled {
    background: #f5f5f5;
    cursor: not-allowed;
  }

  .actions {
    margin-bottom: 2rem;
  }

  button {
    padding: 0.75rem 2rem;
    font-size: 1rem;
    font-weight: 600;
    color: white;
    background: #0066cc;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.2s;
  }

  button:hover:not(:disabled) {
    background: #0052a3;
  }

  button:disabled {
    background: #999;
    cursor: not-allowed;
  }

  .progress {
    position: relative;
    width: 100%;
    height: 40px;
    background: #f0f0f0;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 2rem;
  }

  .progress-bar {
    height: 100%;
    background: #0066cc;
    transition: width 0.3s;
  }

  .progress-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-weight: 600;
    color: #333;
  }

  .summary {
    margin-bottom: 2rem;
  }

  .stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .stat-box {
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 4px;
    border: 1px solid #e0e0e0;
  }

  .stat-box h3 {
    margin: 0 0 0.5rem;
    font-size: 1rem;
    color: #666;
  }

  .stat-box p {
    margin: 0.25rem 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #333;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    background: white;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }

  th, td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid #e0e0e0;
  }

  th {
    background: #f8f9fa;
    font-weight: 600;
    color: #555;
  }

  tbody tr:hover {
    background: #f8f9fa;
  }

  .errors {
    margin-top: 2rem;
    padding: 1rem;
    background: #fff3cd;
    border: 1px solid #ffc107;
    border-radius: 4px;
  }

  .errors h2 {
    margin-top: 0;
    color: #856404;
  }

  .errors ul {
    margin: 0;
    padding-left: 1.5rem;
  }

  .errors li {
    margin: 0.5rem 0;
    color: #856404;
  }
</style>