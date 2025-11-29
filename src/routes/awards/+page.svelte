<script>
  import StatsLayout from '$lib/components/StatsLayout.svelte';
  import StatCard from '$lib/components/StatCard.svelte';

  export let data;

  const navItems = [
    { label: "All Time Scoring", href: "/league/all_time_stats" },
    { label: "Regular Season Scoring", href: "/league/reg_season_stats" },
    { label: "Playoff Scoring", href: "/league/playoff_stats" },
    { label: "Streaks", href: "/league/streaks" },
    { label: "Ranking", href: "/league/ranking" },
    { label: "Rivalries", href: "/league/rivalries" },
    { label: "Awards", href: "/awards", active: true },
    { label: "Draft Room", href: "/drafts/previous_seasons" }
  ];

  // Helper function to format scores to 2 decimal places
  function formatScore(score) {
    if (score === null || score === undefined) return '0.00';
    return parseFloat(score).toFixed(2);
  }

  // Check if an award is enabled
  function isEnabled(key) {
    return data.enabledKeys?.includes(key);
  }
</script>

<StatsLayout title="League Awards" {navItems}>
  <div class="awards-intro">
    <p>Historical records and achievements across the league's history.</p>
  </div>

  <div class="content-grid">
    <!-- Weekly High Score -->
    {#if isEnabled('weekly_high_score') && data.weeklyHighScore?.length}
      <StatCard size="lg">
        <div class="table-wrapper">
          <table class="stats-table">
            <thead>
              <tr><th class="table-title" colspan="4">🏆 Weekly High Score</th></tr>
              <tr><th>#</th><th>Team</th><th>Week</th><th>Points</th></tr>
            </thead>
            <tbody>
              {#each data.weeklyHighScore.slice(0, 10) as row, i}
                <tr>
                  <td>{i + 1}</td>
                  <td class="team-cell">
                    {#if row.team_logo}
                      <img src={row.team_logo} alt={row.team_name || 'Team'} class="team-logo" />
                    {/if}
                    <span class="team-name">{row.team_name || 'Unknown Team'}</span>
                  </td>
                  <td class="week-cell">{row.season_year || 'N/A'} Week {row.week || 'N/A'}</td>
                  <td class="points-cell">{formatScore(row.score)}</td>
                </tr>
              {:else}
                <tr><td colspan="4" class="text-center text-gray-600">No data available</td></tr>
              {/each}
            </tbody>
          </table>
        </div>
      </StatCard>
    {/if}

    <!-- Weekly Low Score -->
    {#if isEnabled('weekly_low_score') && data.weeklyLowScore?.length}
      <StatCard size="lg">
        <div class="table-wrapper">
          <table class="stats-table">
            <thead>
              <tr><th class="table-title" colspan="4">💩 Weekly Low Score</th></tr>
              <tr><th>#</th><th>Team</th><th>Week</th><th>Points</th></tr>
            </thead>
            <tbody>
              {#each data.weeklyLowScore.slice(0, 10) as row, i}
                <tr>
                  <td>{i + 1}</td>
                  <td class="team-cell">
                    {#if row.team_logo}
                      <img src={row.team_logo} alt={row.team_name || 'Team'} class="team-logo" />
                    {/if}
                    <span class="team-name">{row.team_name || 'Unknown Team'}</span>
                  </td>
                  <td class="week-cell">{row.season_year || 'N/A'} Week {row.week || 'N/A'}</td>
                  <td class="points-cell">{formatScore(row.score)}</td>
                </tr>
              {:else}
                <tr><td colspan="4" class="text-center text-gray-600">No data available</td></tr>
              {/each}
            </tbody>
          </table>
        </div>
      </StatCard>
    {/if}

    <!-- Season Most Points -->
    {#if isEnabled('season_most_points') && data.seasonMostPoints?.length}
      <StatCard size="lg">
        <div class="table-wrapper">
          <table class="stats-table">
            <thead>
              <tr><th class="table-title" colspan="4">👑 Season Most Points</th></tr>
              <tr><th>#</th><th>Team</th><th>Season</th><th>Total Points</th></tr>
            </thead>
            <tbody>
              {#each data.seasonMostPoints.slice(0, 10) as row, i}
                <tr>
                  <td>{i + 1}</td>
                  <td class="team-cell">
                    {#if row.team_logo}
                      <img src={row.team_logo} alt={row.team_name || 'Team'} class="team-logo" />
                    {/if}
                    <span class="team-name">{row.team_name || 'Unknown Team'}</span>
                  </td>
                  <td class="season-cell">{row.season_year || 'N/A'}</td>
                  <td class="points-cell">{formatScore(row.total_points)}</td>
                </tr>
              {:else}
                <tr><td colspan="4" class="text-center text-gray-600">No data available</td></tr>
              {/each}
            </tbody>
          </table>
        </div>
      </StatCard>
    {/if}

    <!-- Season Least Points -->
    {#if isEnabled('season_least_points') && data.seasonLeastPoints?.length}
      <StatCard size="lg">
        <div class="table-wrapper">
          <table class="stats-table">
            <thead>
              <tr><th class="table-title" colspan="4">📉 Season Least Points</th></tr>
              <tr><th>#</th><th>Team</th><th>Season</th><th>Total Points</th></tr>
            </thead>
            <tbody>
              {#each data.seasonLeastPoints.slice(0, 10) as row, i}
                <tr>
                  <td>{i + 1}</td>
                  <td class="team-cell">
                    {#if row.team_logo}
                      <img src={row.team_logo} alt={row.team_name || 'Team'} class="team-logo" />
                    {/if}
                    <span class="team-name">{row.team_name || 'Unknown Team'}</span>
                  </td>
                  <td class="season-cell">{row.season_year || 'N/A'}</td>
                  <td class="points-cell">{formatScore(row.total_points)}</td>
                </tr>
              {:else}
                <tr><td colspan="4" class="text-center text-gray-600">No data available</td></tr>
              {/each}
            </tbody>
          </table>
        </div>
      </StatCard>
    {/if}

    <!-- Season Most Wins -->
    {#if isEnabled('season_most_wins') && data.seasonMostWins?.length}
      <StatCard size="lg">
        <div class="table-wrapper">
          <table class="stats-table">
            <thead>
              <tr><th class="table-title" colspan="4">🥇 Most Wins in a Season</th></tr>
              <tr><th>#</th><th>Team</th><th>Season</th><th>Record</th></tr>
            </thead>
            <tbody>
              {#each data.seasonMostWins.slice(0, 10) as row, i}
                <tr>
                  <td>{i + 1}</td>
                  <td class="team-cell">
                    {#if row.team_logo}
                      <img src={row.team_logo} alt={row.team_name || 'Team'} class="team-logo" />
                    {/if}
                    <span class="team-name">{row.team_name || 'Unknown Team'}</span>
                  </td>
                  <td class="season-cell">{row.season_year || 'N/A'}</td>
                  <td class="record-cell">{row.record || `${row.wins}-${row.losses}-${row.ties}`}</td>
                </tr>
              {:else}
                <tr><td colspan="4" class="text-center text-gray-600">No data available</td></tr>
              {/each}
            </tbody>
          </table>
        </div>
      </StatCard>
    {/if}

    <!-- Season Least Wins -->
    {#if isEnabled('season_least_wins') && data.seasonLeastWins?.length}
      <StatCard size="lg">
        <div class="table-wrapper">
          <table class="stats-table">
            <thead>
              <tr><th class="table-title" colspan="4">😬 Least Wins in a Season</th></tr>
              <tr><th>#</th><th>Team</th><th>Season</th><th>Record</th></tr>
            </thead>
            <tbody>
              {#each data.seasonLeastWins.slice(0, 10) as row, i}
                <tr>
                  <td>{i + 1}</td>
                  <td class="team-cell">
                    {#if row.team_logo}
                      <img src={row.team_logo} alt={row.team_name || 'Team'} class="team-logo" />
                    {/if}
                    <span class="team-name">{row.team_name || 'Unknown Team'}</span>
                  </td>
                  <td class="season-cell">{row.season_year || 'N/A'}</td>
                  <td class="record-cell">{row.record || `${row.wins}-${row.losses}-${row.ties}`}</td>
                </tr>
              {:else}
                <tr><td colspan="4" class="text-center text-gray-600">No data available</td></tr>
              {/each}
            </tbody>
          </table>
        </div>
      </StatCard>
    {/if}

    <!-- Positional Awards Section -->
    {#if isEnabled('season_qb_most_points') && data.seasonQbPoints?.length}
      <StatCard size="lg">
        <div class="table-wrapper">
          <table class="stats-table">
            <thead>
              <tr><th class="table-title" colspan="5">🎯 Best QB Season</th></tr>
              <tr><th>#</th><th>Manager</th><th>Player</th><th>Season</th><th>Points</th></tr>
            </thead>
            <tbody>
              {#each data.seasonQbPoints.slice(0, 10) as row, i}
                <tr>
                  <td>{i + 1}</td>
                  <td class="team-cell">
                    {#if row.team_logo}
                      <img src={row.team_logo} alt={row.team_name || 'Team'} class="team-logo" />
                    {/if}
                    <span class="team-name">{row.team_name || 'Unknown'}</span>
                  </td>
                  <td class="player-cell">{row.player_name || 'Unknown'}</td>
                  <td class="season-cell">{row.season_year || 'N/A'}</td>
                  <td class="points-cell">{formatScore(row.total_points)}</td>
                </tr>
              {:else}
                <tr><td colspan="5" class="text-center text-gray-600">No data available</td></tr>
              {/each}
            </tbody>
          </table>
        </div>
      </StatCard>
    {/if}

    {#if isEnabled('season_rb_most_points') && data.seasonRbPoints?.length}
      <StatCard size="lg">
        <div class="table-wrapper">
          <table class="stats-table">
            <thead>
              <tr><th class="table-title" colspan="5">🏃 Best RB Season</th></tr>
              <tr><th>#</th><th>Manager</th><th>Player</th><th>Season</th><th>Points</th></tr>
            </thead>
            <tbody>
              {#each data.seasonRbPoints.slice(0, 10) as row, i}
                <tr>
                  <td>{i + 1}</td>
                  <td class="team-cell">
                    {#if row.team_logo}
                      <img src={row.team_logo} alt={row.team_name || 'Team'} class="team-logo" />
                    {/if}
                    <span class="team-name">{row.team_name || 'Unknown'}</span>
                  </td>
                  <td class="player-cell">{row.player_name || 'Unknown'}</td>
                  <td class="season-cell">{row.season_year || 'N/A'}</td>
                  <td class="points-cell">{formatScore(row.total_points)}</td>
                </tr>
              {:else}
                <tr><td colspan="5" class="text-center text-gray-600">No data available</td></tr>
              {/each}
            </tbody>
          </table>
        </div>
      </StatCard>
    {/if}

    {#if isEnabled('season_wr_most_points') && data.seasonWrPoints?.length}
      <StatCard size="lg">
        <div class="table-wrapper">
          <table class="stats-table">
            <thead>
              <tr><th class="table-title" colspan="5">✋ Best WR Season</th></tr>
              <tr><th>#</th><th>Manager</th><th>Player</th><th>Season</th><th>Points</th></tr>
            </thead>
            <tbody>
              {#each data.seasonWrPoints.slice(0, 10) as row, i}
                <tr>
                  <td>{i + 1}</td>
                  <td class="team-cell">
                    {#if row.team_logo}
                      <img src={row.team_logo} alt={row.team_name || 'Team'} class="team-logo" />
                    {/if}
                    <span class="team-name">{row.team_name || 'Unknown'}</span>
                  </td>
                  <td class="player-cell">{row.player_name || 'Unknown'}</td>
                  <td class="season-cell">{row.season_year || 'N/A'}</td>
                  <td class="points-cell">{formatScore(row.total_points)}</td>
                </tr>
              {:else}
                <tr><td colspan="5" class="text-center text-gray-600">No data available</td></tr>
              {/each}
            </tbody>
          </table>
        </div>
      </StatCard>
    {/if}

    {#if isEnabled('season_te_most_points') && data.seasonTePoints?.length}
      <StatCard size="lg">
        <div class="table-wrapper">
          <table class="stats-table">
            <thead>
              <tr><th class="table-title" colspan="5">🤲 Best TE Season</th></tr>
              <tr><th>#</th><th>Manager</th><th>Player</th><th>Season</th><th>Points</th></tr>
            </thead>
            <tbody>
              {#each data.seasonTePoints.slice(0, 10) as row, i}
                <tr>
                  <td>{i + 1}</td>
                  <td class="team-cell">
                    {#if row.team_logo}
                      <img src={row.team_logo} alt={row.team_name || 'Team'} class="team-logo" />
                    {/if}
                    <span class="team-name">{row.team_name || 'Unknown'}</span>
                  </td>
                  <td class="player-cell">{row.player_name || 'Unknown'}</td>
                  <td class="season-cell">{row.season_year || 'N/A'}</td>
                  <td class="points-cell">{formatScore(row.total_points)}</td>
                </tr>
              {:else}
                <tr><td colspan="5" class="text-center text-gray-600">No data available</td></tr>
              {/each}
            </tbody>
          </table>
        </div>
      </StatCard>
    {/if}

    {#if isEnabled('season_k_most_points') && data.seasonKPoints?.length}
      <StatCard size="lg">
        <div class="table-wrapper">
          <table class="stats-table">
            <thead>
              <tr><th class="table-title" colspan="5">🦶 Best K Season</th></tr>
              <tr><th>#</th><th>Manager</th><th>Player</th><th>Season</th><th>Points</th></tr>
            </thead>
            <tbody>
              {#each data.seasonKPoints.slice(0, 10) as row, i}
                <tr>
                  <td>{i + 1}</td>
                  <td class="team-cell">
                    {#if row.team_logo}
                      <img src={row.team_logo} alt={row.team_name || 'Team'} class="team-logo" />
                    {/if}
                    <span class="team-name">{row.team_name || 'Unknown'}</span>
                  </td>
                  <td class="player-cell">{row.player_name || 'Unknown'}</td>
                  <td class="season-cell">{row.season_year || 'N/A'}</td>
                  <td class="points-cell">{formatScore(row.total_points)}</td>
                </tr>
              {:else}
                <tr><td colspan="5" class="text-center text-gray-600">No data available</td></tr>
              {/each}
            </tbody>
          </table>
        </div>
      </StatCard>
    {/if}

    {#if isEnabled('season_def_most_points') && data.seasonDefPoints?.length}
      <StatCard size="lg">
        <div class="table-wrapper">
          <table class="stats-table">
            <thead>
              <tr><th class="table-title" colspan="5">🛡️ Best DEF Season</th></tr>
              <tr><th>#</th><th>Manager</th><th>Player</th><th>Season</th><th>Points</th></tr>
            </thead>
            <tbody>
              {#each data.seasonDefPoints.slice(0, 10) as row, i}
                <tr>
                  <td>{i + 1}</td>
                  <td class="team-cell">
                    {#if row.team_logo}
                      <img src={row.team_logo} alt={row.team_name || 'Team'} class="team-logo" />
                    {/if}
                    <span class="team-name">{row.team_name || 'Unknown'}</span>
                  </td>
                  <td class="player-cell">{row.player_name || 'Unknown'}</td>
                  <td class="season-cell">{row.season_year || 'N/A'}</td>
                  <td class="points-cell">{formatScore(row.total_points)}</td>
                </tr>
              {:else}
                <tr><td colspan="5" class="text-center text-gray-600">No data available</td></tr>
              {/each}
            </tbody>
          </table>
        </div>
      </StatCard>
    {/if}
  </div>
</StatsLayout>

<style>
  .awards-intro {
    text-align: center;
    margin-bottom: 2rem;
    color: #6c757d;
  }

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

  .player-cell {
    font-weight: 500;
    color: #495057;
  }

  .points-cell {
    font-weight: 600;
    color: #007bff;
    text-align: right;
  }

  .record-cell {
    font-weight: 500;
    color: #495057;
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

    .team-cell {
      min-width: 130px;
      max-width: 130px;
    }
  }
</style>