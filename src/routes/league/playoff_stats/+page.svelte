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
</script>

<StatsLayout title="Playoff Scoring" {navItems}>
  <div class="content-grid">

    <!-- Row 1 -->
    <StatCard size="lg">
      <table class="stats-table">
        <thead>
          <tr><th class="table-title" colspan="4">Highest Playoff Game Score</th></tr>
          <tr><th>#</th><th>Team</th><th>Week</th><th>Points</th></tr>
        </thead>
        <tbody>
          {#each data.highestGame as row, i}
            <tr>
              <td>{i + 1}</td>
              <td class="team-cell">
                {#if row.team_logo}
                  <img src={row.team_logo} alt={row.team_name} class="team-logo" />
                {/if}
                {row.team_name}
              </td>
              <td>{row.year} Week {row.week}</td>
              <td>{row.score}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </StatCard>

    <StatCard size="lg">
      <table class="stats-table">
        <thead>
          <tr><th class="table-title" colspan="4">Lowest Playoff Game Score</th></tr>
          <tr><th>#</th><th>Team</th><th>Week</th><th>Points</th></tr>
        </thead>
        <tbody>
          {#each data.lowestGame as row, i}
            <tr>
              <td>{i + 1}</td>
              <td class="team-cell">
                {#if row.team_logo}
                  <img src={row.team_logo} alt={row.team_name} class="team-logo" />
                {/if}
                {row.team_name}
              </td>
              <td>{row.year} Week {row.week}</td>
              <td>{row.score}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </StatCard>

    <!-- Row 2 -->
    <StatCard size="lg">
      <table class="stats-table">
        <thead>
          <tr><th class="table-title" colspan="4">Highest Playoff Season Score</th></tr>
          <tr><th>#</th><th>Team</th><th>Season</th><th>Total Points</th></tr>
        </thead>
        <tbody>
          {#each data.highestSeason as row, i}
            <tr>
              <td>{i + 1}</td>
              <td class="team-cell">
                {#if row.team_logo}
                  <img src={row.team_logo} alt={row.team_name} class="team-logo" />
                {/if}
                {row.team_name}
              </td>
              <td>{row.year}</td>
              <td>{row.total_points}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </StatCard>

    <StatCard size="lg">
      <table class="stats-table">
        <thead>
          <tr><th class="table-title" colspan="4">Lowest Playoff Season Score</th></tr>
          <tr><th>#</th><th>Team</th><th>Season</th><th>Total Points</th></tr>
        </thead>
        <tbody>
          {#each data.lowestSeason as row, i}
            <tr>
              <td>{i + 1}</td>
              <td class="team-cell">
                {#if row.team_logo}
                  <img src={row.team_logo} alt={row.team_name} class="team-logo" />
                {/if}
                {row.team_name}
              </td>
              <td>{row.year}</td>
              <td>{row.total_points}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </StatCard>

    <!-- Row 3 -->
    <StatCard size="lg">
      <table class="stats-table">
        <thead>
          <tr><th class="table-title" colspan="4">Largest Playoff Blowouts</th></tr>
          <tr><th>#</th><th>Matchup</th><th>Week</th><th>Margin</th></tr>
        </thead>
        <tbody>
          {#each data.blowout as row, i}
            <tr>
              <td>{i + 1}</td>
              <td class="team-cell">
                {#if row.team1_logo}
                  <img src={row.team1_logo} alt={row.team1_name} class="team-logo" />
                {/if}
                {row.team1_name} ({row.team1_score})
                <span style="margin: 0 0.4rem;">vs</span>
                {#if row.team2_logo}
                  <img src={row.team2_logo} alt={row.team2_name} class="team-logo" />
                {/if}
                {row.team2_name} ({row.team2_score})
              </td>
              <td>{row.year} Week {row.week}</td>
              <td>{row.margin}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </StatCard>

    <StatCard size="lg">
      <table class="stats-table">
        <thead>
          <tr><th class="table-title" colspan="4">Closest Playoff Nailbiters</th></tr>
          <tr><th>#</th><th>Matchup</th><th>Week</th><th>Margin</th></tr>
        </thead>
        <tbody>
          {#each data.nailbiter as row, i}
            <tr>
              <td>{i + 1}</td>
              <td class="team-cell">
                {#if row.team1_logo}
                  <img src={row.team1_logo} alt={row.team1_name} class="team-logo" />
                {/if}
                {row.team1_name} ({row.team1_score})
                <span style="margin: 0 0.4rem;">vs</span>
                {#if row.team2_logo}
                  <img src={row.team2_logo} alt={row.team2_name} class="team-logo" />
                {/if}
                {row.team2_name} ({row.team2_score})
              </td>
              <td>{row.year} Week {row.week}</td>
              <td>{row.margin}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </StatCard>

    <!-- Row 4 -->
    <StatCard size="lg">
      <table class="stats-table">
        <thead>
          <tr><th class="table-title" colspan="5">Playoff Winning Percentage Leaders</th></tr>
          <tr><th>#</th><th>Team</th><th>Season</th><th>Record</th><th>Win %</th></tr>
        </thead>
        <tbody>
          {#each data.winPct as row, i}
            <tr>
              <td>{i + 1}</td>
              <td class="team-cell">
                {#if row.team_logo}
                  <img src={row.team_logo} alt={row.team_name} class="team-logo" />
                {/if}
                {row.team_name}
              </td>
              <td>{row.year}</td>
              <td>{row.wins}-{row.losses}-{row.ties}</td>
              <td>{(row.win_pct * 100).toFixed(1)}%</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </StatCard>

    <StatCard size="lg">
      <table class="stats-table">
        <thead>
          <tr><th class="table-title" colspan="1">Playoff Potential Points</th></tr>
        </thead>
        <tbody>
          <tr><td class="text-gray-600">Coming Soon</td></tr>
        </tbody>
      </table>
    </StatCard>
  <p style="height:20px"></p>
  </div>
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

  .stats-table th.table-title {
    text-align: center !important;
    background-color: #003366 !important;
    color: white !important;
    font-size: 1rem;
    font-weight: bold;
    padding: 0.6rem;
    }
</style>
