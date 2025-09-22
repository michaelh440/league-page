<script>
  import StatsLayout from '$lib/components/StatsLayout.svelte';
  import StatCard from '$lib/components/StatCard.svelte';
  import { goto } from '$app/navigation';

  export let data;

  // Make sure selectedManagerId is properly set from the data
  let selectedManagerId = data.managerId?.toString() ?? '';

  const withMgr = (path) =>
    selectedManagerId ? `${path}?managerId=${selectedManagerId}` : path;

  const navItems = [
    { label: "All Time Scoring", href: withMgr("/managers/all_time_stats") },
    { label: "Regular Season Scoring", href: withMgr("/managers/reg_season_stats"), active: true },
    { label: "Playoff Scoring", href: withMgr("/managers/playoff_stats") },
    //{ label: "Streaks", href: withMgr("/managers/streaks") },
    //{ label: "Potential Points", href: withMgr("/managers/potential_points") },
    //{ label: "Ranking", href: withMgr("/managers/ranking") },
    { label: "Rivalries", href: withMgr("/managers/rivalries") },
    //{ label: "Trophy Room", href: withMgr("/managers/trophy_room") },
    { label: "Draft Room", href: withMgr("/managers/drafts") }
  ];

  function onSelect(e) {
    selectedManagerId = e.target.value;
    goto(withMgr("/managers/reg_season_stats"));
  }

  // Helper function to format scores to 2 decimal places
  function formatScore(score) {
    return parseFloat(score).toFixed(2);
  }
</script>

<StatsLayout title="Manager Regular Season Scoring" {navItems}>
  <div class="toolbar">
    <label for="manager">Manager:&nbsp;</label>
    <select id="manager" on:change={onSelect} value={selectedManagerId} class="manager-select">
      <option value="" disabled>Select a manager…</option>
      {#each data.managers as m}
        <option value={m.manager_id.toString()}>{m.name}</option>
      {/each}
    </select>
  </div>

  {#if !selectedManagerId}
    <p class="hint">Pick a manager to load regular season stats.</p>
  {:else}
    <div class="content-grid">

      <!-- Row 1 -->
      <StatCard size="lg">
        <table class="stats-table">
          <thead>
            <tr><th class="table-title" colspan="4">Highest Game Score</th></tr>
            <tr><th>#</th><th>Team</th><th>Week</th><th>Points</th></tr>
          </thead>
          <tbody>
            {#each (data.highestGame || []).slice(0, 10) as row, i}
              <tr>
                <td>{i + 1}</td>
                <td class="team-cell">
                  {#if row.team_logo}
                    <img src={row.team_logo} alt={row.team_name || 'Team'} class="team-logo" />
                  {/if}
                  {row.team_name || 'Unknown Team'}
                </td>
                <td>{row.year || 'N/A'} Week {row.week || 'N/A'}</td>
                <td>{formatScore(row.score || 0)}</td>
              </tr>
            {:else}
              <tr><td colspan="4" class="text-center text-gray-600">No regular season data available</td></tr>
            {/each}
          </tbody>
        </table>
      </StatCard>

      <StatCard size="lg">
        <table class="stats-table">
          <thead>
            <tr><th class="table-title" colspan="4">Lowest Game Score</th></tr>
            <tr><th>#</th><th>Team</th><th>Week</th><th>Points</th></tr>
          </thead>
          <tbody>
            {#each (data.lowestGame || []).slice(0, 10) as row, i}
              <tr>
                <td>{i + 1}</td>
                <td class="team-cell">
                  {#if row.team_logo}
                    <img src={row.team_logo} alt={row.team_name || 'Team'} class="team-logo" />
                  {/if}
                  {row.team_name || 'Unknown Team'}
                </td>
                <td>{row.year || 'N/A'} Week {row.week || 'N/A'}</td>
                <td>{formatScore(row.score || 0)}</td>
              </tr>
            {:else}
              <tr><td colspan="4" class="text-center text-gray-600">No regular season data available</td></tr>
            {/each}
          </tbody>
        </table>
      </StatCard>

      <!-- Row 2 -->
      <StatCard size="lg">
        <table class="stats-table">
          <thead>
            <tr><th class="table-title" colspan="4">Highest Season Score</th></tr>
            <tr><th>#</th><th>Team</th><th>Season</th><th>Total Points</th></tr>
          </thead>
          <tbody>
            {#each (data.highestSeason || []).slice(0, 10) as row, i}
              <tr>
                <td>{i + 1}</td>
                <td class="team-cell">
                  {#if row.team_logo}
                    <img src={row.team_logo} alt={row.team_name || 'Team'} class="team-logo" />
                  {/if}
                  {row.team_name || 'Unknown Team'}
                </td>
                <td>{row.year || 'N/A'}</td>
                <td>{formatScore(row.total_points || 0)}</td>
              </tr>
            {:else}
              <tr><td colspan="4" class="text-center text-gray-600">No regular season data available</td></tr>
            {/each}
          </tbody>
        </table>
      </StatCard>

      <StatCard size="lg">
        <table class="stats-table">
          <thead>
            <tr><th class="table-title" colspan="4">Lowest Season Score</th></tr>
            <tr><th>#</th><th>Team</th><th>Season</th><th>Total Points</th></tr>
          </thead>
          <tbody>
            {#each (data.lowestSeason || []).slice(0, 10) as row, i}
              <tr>
                <td>{i + 1}</td>
                <td class="team-cell">
                  {#if row.team_logo}
                    <img src={row.team_logo} alt={row.team_name || 'Team'} class="team-logo" />
                  {/if}
                  {row.team_name || 'Unknown Team'}
                </td>
                <td>{row.year || 'N/A'}</td>
                <td>{formatScore(row.total_points || 0)}</td>
              </tr>
            {:else}
              <tr><td colspan="4" class="text-center text-gray-600">No regular season data available</td></tr>
            {/each}
          </tbody>
        </table>
      </StatCard>

      <!-- Row 3 -->
      <StatCard size="lg">
        <table class="stats-table">
          <thead>
            <tr><th class="table-title" colspan="4">Largest Blowout</th></tr>
            <tr><th>#</th><th>Matchup</th><th>Week</th><th>Margin</th></tr>
          </thead>
          <tbody>
            {#each (data.blowout || []).slice(0, 10) as row, i}
              <tr>
                <td>{i + 1}</td>
                <td class="team-cell">
                  <div class="matchup-display">
                    <div class="team-info">
                      {#if row.team1_logo}
                        <img src={row.team1_logo} alt={row.team1_name || 'Team 1'} class="team-logo" />
                      {/if}
                      {row.team1_name || 'Team 1'} ({formatScore(row.team1_score || 0)})
                    </div>
                    <span class="vs-text">vs</span>
                    <div class="team-info">
                      {#if row.team2_logo}
                        <img src={row.team2_logo} alt={row.team2_name || 'Team 2'} class="team-logo" />
                      {/if}
                      {row.team2_name || 'Team 2'} ({formatScore(row.team2_score || 0)})
                    </div>
                  </div>
                </td>
                <td>{row.year || 'N/A'} Week {row.week || 'N/A'}</td>
                <td>{formatScore(row.margin || 0)}</td>
              </tr>
            {:else}
              <tr><td colspan="4" class="text-center text-gray-600">No regular season data available</td></tr>
            {/each}
          </tbody>
        </table>
      </StatCard>

      <StatCard size="lg">
        <table class="stats-table">
          <thead>
            <tr><th class="table-title" colspan="4">Closest Nailbiter</th></tr>
            <tr><th>#</th><th>Matchup</th><th>Week</th><th>Margin</th></tr>
          </thead>
          <tbody>
            {#each (data.nailbiter || []).slice(0, 10) as row, i}
              <tr>
                <td>{i + 1}</td>
                <td class="team-cell">
                  <div class="matchup-display">
                    <div class="team-info">
                      {#if row.team1_logo}
                        <img src={row.team1_logo} alt={row.team1_name || 'Team 1'} class="team-logo" />
                      {/if}
                      {row.team1_name || 'Team 1'} ({formatScore(row.team1_score || 0)})
                    </div>
                    <span class="vs-text">vs</span>
                    <div class="team-info">
                      {#if row.team2_logo}
                        <img src={row.team2_logo} alt={row.team2_name || 'Team 2'} class="team-logo" />
                      {/if}
                      {row.team2_name || 'Team 2'} ({formatScore(row.team2_score || 0)})
                    </div>
                  </div>
                </td>
                <td>{row.year || 'N/A'} Week {row.week || 'N/A'}</td>
                <td>{formatScore(row.margin || 0)}</td>
              </tr>
            {:else}
              <tr><td colspan="4" class="text-center text-gray-600">No regular season data available</td></tr>
            {/each}
          </tbody>
        </table>
      </StatCard>

      <!-- Row 4 -->
      <StatCard size="lg">
        <table class="stats-table">
          <thead>
            <tr><th class="table-title" colspan="4">Winning Percentage Leaders</th></tr>
            <tr><th>#</th><th>Team</th><th>Record</th><th>Win %</th></tr>
          </thead>
          <tbody>
            {#each (data.winPct || []).slice(0, 10) as row, i}
              <tr>
                <td>{i + 1}</td>
                <td class="team-cell">
                  {#if row.team_logo}
                    <img src={row.team_logo} alt={row.team_name || 'Team'} class="team-logo" />
                  {/if}
                  {row.team_name || 'Unknown Team'}
                </td>
                <td>{row.wins || 0}-{row.losses || 0}-{row.ties || 0}</td>
                <td>{((row.win_pct || 0) * 100).toFixed(1)}%</td>
              </tr>
            {:else}
              <tr><td colspan="4" class="text-center text-gray-600">No regular season data available</td></tr>
            {/each}
          </tbody>
        </table>
      </StatCard>
    </div>
  {/if}
</StatsLayout>

<style>
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
  
  .manager-select option {
    padding: 0.5rem;
    background: white;
    color: #495057;
  }
  
  .manager-select option:disabled {
    color: #6c757d;
    font-style: italic;
  }
  
  .hint { 
    color: #666; 
    margin-top: 1rem; 
    text-align: center;
    font-size: 1.1rem;
    padding: 2rem;
    background: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e9ecef;
  }
  
  .content-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
  
  .stats-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;
  }
  
  .stats-table th,
  .stats-table td {
    border: 1px solid #ddd;
    padding: 0.35rem 0.5rem;
  }
  
  .stats-table th {
    text-align: center;
    background: #f5f5f5;
    font-weight: bold;
  }
  
  .stats-table td {
    text-align: left;
  }
  
  .stats-table tr:nth-child(even) {
    background: #fafafa;
  }
  
  .table-title {
    text-align: center;
    background-color: #003366;
    color: white;
    font-size: 1.1rem;
    font-weight: bold;
    padding: 0.6rem;
  }
  
  .team-cell {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .team-logo {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    object-fit: cover;
  }
  
  .matchup-display {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.8rem;
  }
  
  .team-info {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
  
  .vs-text {
    text-align: center;
    font-weight: bold;
    color: #666;
    font-size: 0.7rem;
  }
  
  .text-center {
    text-align: center;
  }
  
  .text-gray-600 {
    color: #666;
  }

  .stats-table th.table-title {
    text-align: center !important;
    background-color: #003366 !important;
    color: white !important;
    font-size: 1rem;
    font-weight: bold;
    padding: 0.6rem;
  }
</style>