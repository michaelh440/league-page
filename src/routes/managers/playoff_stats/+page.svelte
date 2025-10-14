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
    { label: "Biography", href: withMgr("/managers/bio")},
    { label: "All Time Scoring", href: withMgr("/managers/all_time_stats") },
    { label: "Regular Season Scoring", href: withMgr("/managers/reg_season_stats") },
    { label: "Playoff Scoring", href: withMgr("/managers/playoff_stats"), active: true },
    //{ label: "Streaks", href: withMgr("/managers/streaks") },
    //{ label: "Potential Points", href: withMgr("/managers/potential_points") },
    //{ label: "Ranking", href: withMgr("/managers/ranking") },
    { label: "Rivalries", href: withMgr("/managers/rivalries") },
    //{ label: "Trophy Room", href: withMgr("/managers/trophy_room") },
    { label: "Draft Room", href: withMgr("/managers/drafts") }
  ];

  function onSelect(e) {
  selectedManagerId = e.target.value;
  goto(withMgr("/managers/playoff_stats"));
}

  // Helper function to format scores to 2 decimal places
  function formatScore(score) {
    return parseFloat(score).toFixed(2);
  }
</script>

<StatsLayout title="Manager Playoff Scoring" {navItems}>
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
    <p class="hint">Pick a manager to load playoff stats.</p>
  {:else}
    <div class="content-grid">

      <!-- Row 1 -->
      <StatCard size="lg">
        <table class="stats-table">
          <thead>
            <tr><th class="table-title" colspan="4">Highest Playoff Game</th></tr>
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
                  <span class="team-name">{row.team_name || 'Unknown Team'}</span>
                </td>
                <td class="week-cell">{row.year || 'N/A'} Week {row.week || 'N/A'}</td>
                <td class="points-cell">{formatScore(row.score || 0)}</td>
              </tr>
            {:else}
              <tr><td colspan="4" class="text-center text-gray-600">No playoff data available</td></tr>
            {/each}
          </tbody>
        </table>
      </StatCard>

      <StatCard size="lg">
        <table class="stats-table">
          <thead>
            <tr><th class="table-title" colspan="4">Lowest Playoff Game</th></tr>
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
                  <span class="team-name">{row.team_name || 'Unknown Team'}</span>
                </td>
                <td class="week-cell">{row.year || 'N/A'} Week {row.week || 'N/A'}</td>
                <td class="points-cell">{formatScore(row.score || 0)}</td>
              </tr>
            {:else}
              <tr><td colspan="4" class="text-center text-gray-600">No playoff data available</td></tr>
            {/each}
          </tbody>
        </table>
      </StatCard>

      <!-- Row 2 -->
      <StatCard size="lg">
        <table class="stats-table">
          <thead>
            <tr><th class="table-title" colspan="4">Highest Playoff Season</th></tr>
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
                  <span class="team-name">{row.team_name || 'Unknown Team'}</span>
                </td>
                <td class="season-cell">{row.year || 'N/A'}</td>
                <td class="points-cell">{formatScore(row.total_points || 0)}</td>
              </tr>
            {:else}
              <tr><td colspan="4" class="text-center text-gray-600">No playoff data available</td></tr>
            {/each}
          </tbody>
        </table>
      </StatCard>

      <StatCard size="lg">
        <table class="stats-table">
          <thead>
            <tr><th class="table-title" colspan="4">Lowest Playoff Season</th></tr>
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
                  <span class="team-name">{row.team_name || 'Unknown Team'}</span>
                </td>
                <td class="season-cell">{row.year || 'N/A'}</td>
                <td class="points-cell">{formatScore(row.total_points || 0)}</td>
              </tr>
            {:else}
              <tr><td colspan="4" class="text-center text-gray-600">No playoff data available</td></tr>
            {/each}
          </tbody>
        </table>
      </StatCard>

      <!-- Row 3 -->
      <StatCard size="lg">
        <table class="stats-table">
          <thead>
            <tr><th class="table-title" colspan="4">Largest Playoff Blowout</th></tr>
            <tr><th>#</th><th>Matchup</th><th>Week</th><th>Margin</th></tr>
          </thead>
          <tbody>
            {#each (data.blowout || []).slice(0, 10) as row, i}
              <tr>
                <td>{i + 1}</td>
                <td class="matchup-cell">
                  <div class="matchup-display">
                    <div class="team-info">
                      {#if row.team1_logo}
                        <img src={row.team1_logo} alt={row.team1_name || 'Team 1'} class="team-logo" />
                      {/if}
                      <span class="team-name">{row.team1_name || 'Team 1'}</span>
                      <span class="score">({formatScore(row.team1_score || 0)})</span>
                    </div>
                    <span class="vs-text">vs</span>
                    <div class="team-info">
                      {#if row.team2_logo}
                        <img src={row.team2_logo} alt={row.team2_name || 'Team 2'} class="team-logo" />
                      {/if}
                      <span class="team-name">{row.team2_name || 'Team 2'}</span>
                      <span class="score">({formatScore(row.team2_score || 0)})</span>
                    </div>
                  </div>
                </td>
                <td class="week-cell">{row.year || 'N/A'} Week {row.week || 'N/A'}</td>
                <td class="margin-cell">{formatScore(row.margin || 0)}</td>
              </tr>
            {:else}
              <tr><td colspan="4" class="text-center text-gray-600">No playoff data available</td></tr>
            {/each}
          </tbody>
        </table>
      </StatCard>

      <StatCard size="lg">
        <table class="stats-table">
          <thead>
            <tr><th class="table-title" colspan="4">Closest Playoff Nailbiter</th></tr>
            <tr><th>#</th><th>Matchup</th><th>Week</th><th>Margin</th></tr>
          </thead>
          <tbody>
            {#each (data.nailbiter || []).slice(0, 10) as row, i}
              <tr>
                <td>{i + 1}</td>
                <td class="matchup-cell">
                  <div class="matchup-display">
                    <div class="team-info">
                      {#if row.team1_logo}
                        <img src={row.team1_logo} alt={row.team1_name || 'Team 1'} class="team-logo" />
                      {/if}
                      <span class="team-name">{row.team1_name || 'Team 1'}</span>
                      <span class="score">({formatScore(row.team1_score || 0)})</span>
                    </div>
                    <span class="vs-text">vs</span>
                    <div class="team-info">
                      {#if row.team2_logo}
                        <img src={row.team2_logo} alt={row.team2_name || 'Team 2'} class="team-logo" />
                      {/if}
                      <span class="team-name">{row.team2_name || 'Team 2'}</span>
                      <span class="score">({formatScore(row.team2_score || 0)})</span>
                    </div>
                  </div>
                </td>
                <td class="week-cell">{row.year || 'N/A'} Week {row.week || 'N/A'}</td>
                <td class="margin-cell">{formatScore(row.margin || 0)}</td>
              </tr>
            {:else}
              <tr><td colspan="4" class="text-center text-gray-600">No playoff data available</td></tr>
            {/each}
          </tbody>
        </table>
      </StatCard>

      <!-- Row 4 -->
      <StatCard size="lg">
        <table class="stats-table">
          <thead>
            <tr><th class="table-title" colspan="4">Playoff Winning Percentage</th></tr>
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
                  <span class="team-name">{row.team_name || 'Unknown Team'}</span>
                </td>
                <td class="record-cell">{row.wins || 0}-{row.losses || 0}-{row.ties || 0}</td>
                <td class="percentage-cell">{((row.win_pct || 0) * 100).toFixed(1)}%</td>
              </tr>
            {:else}
              <tr><td colspan="4" class="text-center text-gray-600">No playoff data available</td></tr>
            {/each}
          </tbody>
        </table>
      </StatCard>

      <StatCard size="lg">
        <table class="stats-table">
          <thead>
            <tr><th class="table-title">Potential Playoff Points</th></tr>
          </thead>
          <tbody>
            <tr><td class="text-gray-600 text-center">Coming Soon</td></tr>
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
    gap: 1.5rem;
    margin-bottom: 2rem;
  }
  
  .stats-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    background: white;
  }
  
  .stats-table th,
  .stats-table td {
    border: 1px solid #dee2e6;
    padding: 0.75rem 0.5rem;
    color: #212529;
  }
  
  .stats-table th {
    text-align: center;
    background: #f8f9fa;
    font-weight: 600;
    color: #495057;
    font-size: 0.9rem;
  }
  
  .stats-table td {
    text-align: left;
    background: white;
    color: #212529;
  }
  
  .stats-table tbody tr:nth-child(odd) {
    background: white;
  }
  
  .stats-table tbody tr:nth-child(even) {
    background: #f8f9fa;
  }
  
  .stats-table tr:hover {
    background: #e3f2fd !important;
  }
  
  .table-title {
    text-align: center !important;
    background: linear-gradient(135deg, #003366, #004080) !important;
    color: white !important;
    font-size: 1rem;
    font-weight: bold;
    padding: 0.75rem;
  }
  
  .team-cell {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .team-logo {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #e9ecef;
    flex-shrink: 0;
  }
  
  .team-name {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
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

  .score {
    color: #666;
    font-size: 0.85em;
  }
  
  .vs-text {
    text-align: center;
    font-weight: bold;
    color: #6c757d;
    font-size: 0.7rem;
    margin: 0.1rem 0;
  }
  
  .text-center {
    text-align: center;
  }
  
  .text-gray-600 {
    color: #6c757d;
  }

  /* Mobile Styles */
  @media (max-width: 768px) {
    .toolbar {
      flex-direction: column;
      gap: 0.5rem;
      padding: 0.75rem;
      margin-bottom: 1rem;
    }

    .manager-select {
      min-width: 160px;
      font-size: 0.9rem;
      padding: 0.4rem 0.75rem;
    }

    .content-grid {
      grid-template-columns: 1fr; /* Single column on mobile */
      gap: 1rem;
      margin-bottom: 1rem;
      padding: 0 0.5rem;
    }

    .stats-table {
      font-size: 0.8rem;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
    }

    .stats-table th,
    .stats-table td {
      padding: 0.6rem 0.4rem;
      color: #212529;
      line-height: 1.4;
    }

    .stats-table th {
      font-size: 0.85rem;
      background: #e9ecef;
      color: #495057;
      font-weight: 700;
    }

    .stats-table tbody tr:nth-child(odd) {
      background: white;
    }
    
    .stats-table tbody tr:nth-child(even) {
      background: #f1f3f4;
    }

    .table-title {
      font-size: 0.95rem;
      padding: 0.75rem;
      background: linear-gradient(135deg, #003366, #004080) !important;
      color: white !important;
    }

    .team-logo {
      width: 22px;
      height: 22px;
    }

    .team-name {
      font-size: 0.85rem;
      font-weight: 500;
      color: #212529;
    }

    .team-cell {
      gap: 0.4rem;
    }

    .matchup-display {
      font-size: 0.75rem;
    }

    .team-info {
      gap: 0.3rem;
    }

    .score {
      font-size: 0.8em;
      color: #495057;
      font-weight: 500;
    }

    .vs-text {
      font-size: 0.7rem;
      color: #6c757d;
      font-weight: 600;
      margin: 0.15rem 0;
    }

    .points-cell,
    .margin-cell,
    .percentage-cell {
      font-weight: 600;
      color: #007bff;
    }

    .record-cell {
      font-weight: 500;
      color: #495057;
    }

    /* Keep important columns visible */
    .week-cell,
    .season-cell {
      font-size: 0.75rem;
      color: #6c757d;
    }

    .hint {
      font-size: 1rem;
      padding: 1.5rem;
      margin-top: 0.5rem;
    }
  }

  /* Tablet styles */
  @media (max-width: 1024px) and (min-width: 769px) {
    .content-grid {
      gap: 1rem;
    }

    .stats-table {
      font-size: 0.8rem;
    }

    .stats-table th,
    .stats-table td {
      padding: 0.6rem 0.4rem;
    }
  }

  /* Very small mobile screens */
  @media (max-width: 480px) {
    .stats-table {
      font-size: 0.7rem;
    }

    .stats-table th,
    .stats-table td {
      padding: 0.4rem 0.2rem;
    }

    .team-logo {
      width: 18px;
      height: 18px;
    }

    .table-title {
      font-size: 0.85rem;
      padding: 0.5rem;
    }

    .matchup-display {
      font-size: 0.65rem;
    }

    .manager-select {
      min-width: 140px;
      font-size: 0.85rem;
    }

    .toolbar {
      padding: 0.5rem;
    }
  }
</style>