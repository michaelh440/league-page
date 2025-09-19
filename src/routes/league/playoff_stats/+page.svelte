<script>
  import StatsLayout from '$lib/components/StatsLayout.svelte';
  import StatCard from '$lib/components/StatCard.svelte';

  export let data;

  const navItems = [
    { label: "All Time Scoring", href: "/league/all_time_stats" },
    { label: "Regular Season Scoring", href: "/league/reg_season_stats" },
    { label: "Playoff Scoring", href: "/league/playoff_stats", active: true },
    { label: "Streaks", href: "/league/streaks" },
    { label: "Potential Points", href: "/league/potential_points" },
    { label: "Ranking", href: "/league/ranking" },
    { label: "Rivalries", href: "/league/rivalries" },
    { label: "Trophy Room", href: "/league/trophy_room" },
    { label: "Draft Room", href: "/league/drafts" }
  ];

  // Helper function to format scores to 2 decimal places
  function formatScore(score) {
    return parseFloat(score).toFixed(2);
  }

  // Debug logging to check data structure
  console.log('Playoff stats data:', {
    highestGame: data.highestGame?.slice(0,3),
    lowestGame: data.lowestGame?.slice(0,3), 
    highestSeason: data.highestSeason?.slice(0,3),
    lowestSeason: data.lowestSeason?.slice(0,3),
    blowout: data.blowout?.slice(0,3),
    nailbiter: data.nailbiter?.slice(0,3),
    winPct: data.winPct?.slice(0,3)
  });
</script>

<StatsLayout title="Playoff Scoring" {navItems}>
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
                {row.team_name || 'Unknown Team'}
              </td>
              <td>{row.year || 'N/A'} Week {row.week || 'N/A'}</td>
              <td>{formatScore(row.score || 0)}</td>
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
                {row.team_name || 'Unknown Team'}
              </td>
              <td>{row.year || 'N/A'} Week {row.week || 'N/A'}</td>
              <td>{formatScore(row.score || 0)}</td>
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
                {row.team_name || 'Unknown Team'}
              </td>
              <td>{row.year || 'N/A'}</td>
              <td>{formatScore(row.total_points || 0)}</td>
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
                {row.team_name || 'Unknown Team'}
              </td>
              <td>{row.year || 'N/A'}</td>
              <td>{formatScore(row.total_points || 0)}</td>
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
                {row.team_name || 'Unknown Team'}
              </td>
              <td>{row.wins || 0}-{row.losses || 0}-{row.ties || 0}</td>
              <td>{((row.win_pct || 0) * 100).toFixed(1)}%</td>
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
  <p style="height:20px"></p>
</StatsLayout>

<style>
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
