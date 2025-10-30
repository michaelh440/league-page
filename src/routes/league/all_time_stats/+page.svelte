<script>
  import StatsLayout from '$lib/components/StatsLayout.svelte';
  import StatCard from '$lib/components/StatCard.svelte';

  export let data;

  const navItems = [
    { label: "All Time Scoring", href: "/league/all_time_stats", active: true },
    { label: "Regular Season Scoring", href: "/league/reg_season_stats" },
    { label: "Playoff Scoring", href: "/league/playoff_stats" },
    { label: "Streaks", href: "/league/streaks" },
    //{ label: "Potential Points", href: "/league/potential_points" },
    { label: "Ranking", href: "/league/ranking" },
    { label: "Rivalries", href: "/league/rivalries" },
    //{ label: "Trophy Room", href: "/league/trophy_room" },
    { label: "Draft Room", href: "/league/drafts" }
  ];

  // Helper function to format scores to 2 decimal places
  function formatScore(score) {
    return parseFloat(score).toFixed(2);
  }
</script>

<StatsLayout title="All-Time Scoring" {navItems}>
  <div class="content-grid">

    <!-- Row 1 -->
    <StatCard size="lg">
      <div class="table-wrapper">
        <table class="stats-table">
          <thead>
            <tr><th class="table-title" colspan="4">All-Time Highest Game Score</th></tr>
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
              <tr><td colspan="4" class="text-center text-gray-600">No data available</td></tr>
            {/each}
          </tbody>
        </table>
      </div>
    </StatCard>

    <StatCard size="lg">
      <div class="table-wrapper">
        <table class="stats-table">
          <thead>
            <tr><th class="table-title" colspan="4">All-Time Lowest Game Score</th></tr>
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
              <tr><td colspan="4" class="text-center text-gray-600">No data available</td></tr>
            {/each}
          </tbody>
        </table>
      </div>
    </StatCard>

    <!-- Row 2 -->
    <StatCard size="lg">
      <div class="table-wrapper">
        <table class="stats-table">
          <thead>
            <tr><th class="table-title" colspan="4">All-Time Highest Season Score</th></tr>
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
              <tr><td colspan="4" class="text-center text-gray-600">No data available</td></tr>
            {/each}
          </tbody>
        </table>
      </div>
    </StatCard>

    <StatCard size="lg">
      <div class="table-wrapper">
        <table class="stats-table">
          <thead>
            <tr><th class="table-title" colspan="4">All-Time Lowest Season Score</th></tr>
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
              <tr><td colspan="4" class="text-center text-gray-600">No data available</td></tr>
            {/each}
          </tbody>
        </table>
      </div>
    </StatCard>

    <!-- Row 3 -->
    <StatCard size="lg">
      <div class="table-wrapper">
        <table class="stats-table">
          <thead>
            <tr><th class="table-title" colspan="4">Largest Blowout All Time</th></tr>
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
              <tr><td colspan="4" class="text-center text-gray-600">No data available</td></tr>
            {/each}
          </tbody>
        </table>
      </div>
    </StatCard>

    <StatCard size="lg">
      <div class="table-wrapper">
        <table class="stats-table">
          <thead>
            <tr><th class="table-title" colspan="4">Closest Nailbiter All Time</th></tr>
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
              <tr><td colspan="4" class="text-center text-gray-600">No data available</td></tr>
            {/each}
          </tbody>
        </table>
      </div>
    </StatCard>

    <!-- Row 4 -->
    <StatCard size="lg">
      <div class="table-wrapper">
        <table class="stats-table">
          <thead>
            <tr><th class="table-title" colspan="4">All-Time Winning Percentage Leaders</th></tr>
            <tr><th>#</th><th>Team</th><th>Record</th><th>Win %</th></tr>
          </thead>
          <tbody>
            {#each (data.winPct || []).slice(0, 10) as row, i}
              <tr>
                <td>{i + 1}</td>
                <td class="team-cell">
                  {#if row.team_logo}
                    <img src={row.team_logo} alt={row.manager_name || 'Team'} class="team-logo" />
                  {/if}
                  <span class="team-name">{row.manager_name || 'Unknown Team'}</span>
                </td>
                <td class="record-cell">{row.wins || 0}-{row.losses || 0}-{row.ties || 0}</td>
                <td class="percentage-cell">{((row.win_pct || 0) * 100).toFixed(1)}%</td>
              </tr>
            {:else}
              <tr><td colspan="4" class="text-center text-gray-600">No data available</td></tr>
            {/each}
          </tbody>
        </table>
      </div>
    </StatCard>

    <StatCard size="lg">
      <div class="table-wrapper">
        <table class="stats-table">
          <thead>
            <tr><th class="table-title">Potential Points All Time</th></tr>
          </thead>
          <tbody>
            <tr><td class="text-gray-600 text-center">Coming Soon</td></tr>
          </tbody>
        </table>
      </div>
    </StatCard>
  </div>
</StatsLayout>

<style>
  .content-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
    margin-bottom: 2rem;
  }
  
  /* Table wrapper for horizontal scroll */
  .table-wrapper {
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    border-radius: 8px;
  }

  .table-wrapper::-webkit-scrollbar {
    height: 6px;
  }

  .table-wrapper::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }

  .table-wrapper::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 3px;
  }

  .table-wrapper::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
  
  .stats-table {
    width: 100%;
    min-width: 500px;
    border-collapse: collapse;
    font-size: 0.85rem;
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
    .content-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
      margin-bottom: 1rem;
      padding: 0 0.5rem;
    }

    .table-wrapper {
      border-radius: 8px;
      scrollbar-width: thin;
      scrollbar-color: #888 #f1f1f1;
    }

    .stats-table {
      min-width: 400px;
      font-size: 0.8rem;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
    }

    .stats-table th,
    .stats-table td {
      padding: 0.6rem 0.4rem;
      color: #212529;
      line-height: 1.4;
    }

    /* Fix table column widths for mobile */
    .stats-table th:nth-child(1),
    .stats-table td:nth-child(1) {
      width: 35px;
      min-width: 35px;
      max-width: 35px;
      padding: 0.6rem 0.25rem;
    }

    .stats-table th:nth-child(2),
    .stats-table td:nth-child(2) {
      width: 140px;
      min-width: 140px;
      max-width: 140px;
    }

    .stats-table th:nth-child(3),
    .stats-table td:nth-child(3) {
      width: 90px;
      min-width: 90px;
    }

    .stats-table th:nth-child(4),
    .stats-table td:nth-child(4) {
      width: 70px;
      min-width: 70px;
      text-align: right;
      padding-right: 0.5rem;
    }

    .stats-table th {
      font-size: 0.75rem;
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
      font-size: 0.9rem;
      padding: 0.6rem;
      background: linear-gradient(135deg, #003366, #004080) !important;
      color: white !important;
    }

    .team-logo {
      width: 20px;
      height: 20px;
    }

    .team-name {
      font-size: 0.75rem;
      font-weight: 500;
      color: #212529;
      flex: 1;
      min-width: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .team-cell {
      gap: 0.3rem;
      min-width: 140px;
      max-width: 140px;
    }

    .matchup-cell {
      min-width: 180px;
      max-width: 180px;
    }

    .matchup-display {
      font-size: 0.7rem;
    }

    .team-info {
      gap: 0.25rem;
    }

    .score {
      font-size: 0.75em;
      color: #495057;
      font-weight: 500;
    }

    .vs-text {
      font-size: 0.65rem;
      color: #6c757d;
      font-weight: 600;
      margin: 0.1rem 0;
    }

    .points-cell,
    .margin-cell,
    .percentage-cell {
      font-weight: 600;
      color: #007bff;
      text-align: right;
    }

    .record-cell {
      font-weight: 500;
      color: #495057;
      font-size: 0.75rem;
    }

    .week-cell,
    .season-cell {
      font-size: 0.7rem;
      color: #495057;
      white-space: nowrap;
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
      min-width: 380px;
      font-size: 0.7rem;
    }

    .stats-table th,
    .stats-table td {
      padding: 0.5rem 0.3rem;
    }

    .stats-table th:nth-child(1),
    .stats-table td:nth-child(1) {
      width: 30px;
      min-width: 30px;
      max-width: 30px;
      padding: 0.5rem 0.2rem;
    }

    .stats-table th:nth-child(2),
    .stats-table td:nth-child(2) {
      width: 130px;
      min-width: 130px;
      max-width: 130px;
    }

    .team-logo {
      width: 18px;
      height: 18px;
    }

    .table-title {
      font-size: 0.8rem;
      padding: 0.5rem;
    }

    .matchup-display {
      font-size: 0.65rem;
    }

    .team-cell {
      min-width: 130px;
      max-width: 130px;
    }

    .matchup-cell {
      min-width: 160px;
      max-width: 160px;
    }
  }
</style>