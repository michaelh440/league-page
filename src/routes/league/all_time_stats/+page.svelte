<!--script>
    import Card from '$lib/components/StatCard.svelte';

    let selected = "alltimescoring"; // default to All Time Scoring

    const navCards = [
        { id: "alltimescoring", label: "All Time Scoring" },
        { id: "blowout", label: "Largest Blowout / Narrowest Win" },
        { id: "winloss", label: "Win/Loss Percentages" },
        { id: "points", label: "Potential vs Actual Points" },
        { id: "records", label: "League Records" },
        { id: "streaks", label: "Longest Streaks" },
        { id: "headtohead", label: "Head-to-Head Records" },
        { id: "champions", label: "Championships" },
        { id: "playoffs", label: "Playoff Appearances" },
        { id: "misc", label: "Miscellaneous" }
    ];

    function selectCard(id) {
        selected = id;
    }
</script>

<div class="page-layout">
    <!-- Sidebar >
    <aside class="sidebar">
        {#each navCards as card}
            <button
                class="nav-card {selected === card.id ? 'active' : ''}"
                on:click={() => selectCard(card.id)}
            >
                {card.label}
            </button>
        {/each}
    </aside>

    <!-- Main Content >
    <main class="content">
        <div style="text-align: center;">
            <h3 class="text-2xl font-bold mb-4" style="align:center;">All-Time Stats</h3>
        </div>
        {#if selected === "alltimescoring"}
            <div class="content-grid">
                <!-- Row 1 >
                <Card size="lg" title="All Time Highest Game Score">
                    <p class="text-gray-600">Coming Soon</p>
                </Card>
                <Card size="lg" title="All Time Lowest Game Score">
                    <p class="text-gray-600">Coming Soon</p>
                </Card>

                <!-- Row 2 >
                <Card size="lg" title="All Time Highest Season Score">
                    <p class="text-gray-600">Coming Soon</p>
                </Card>
                <Card size="lg" title="All Time Lowest Season Score">
                    <p class="text-gray-600">Coming Soon</p>
                </Card>

                <!-- Row 3 >
                <Card size="lg" title="Largest Blowout All Time">
                    <p class="text-gray-600">Coming Soon</p>
                </Card>
                <Card size="lg" title="Closest Nailbiter All Time">
                    <p class="text-gray-600">Coming Soon</p>
                </Card>

                <!-- Row 4 >
                <Card size="lg" title="Winning Percentage All Time">
                    <p class="text-gray-600">Coming Soon</p>
                </Card>
                <Card size="lg" title="Potential Points All Time">
                    <p class="text-gray-600">Coming Soon</p>
                </Card>
            </div>
        {:else}
            <div class="content-grid">
                <Card size="lg"><p class="text-gray-600">Coming Soon</p></Card>
                <Card size="lg"><p class="text-gray-600">Coming Soon</p></Card>
                <Card size="lg"><p class="text-gray-600">Coming Soon</p></Card>
                <Card size="lg"><p class="text-gray-600">Coming Soon</p></Card>
            </div>
        {/if}
    </main>
</div>

<style>
  .page-layout {
    display: flex;
    gap: 2rem;
  }

  .sidebar {
    flex: 0 0 12%; /* left column */
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-left: 0.5rem;
    margin-top: 1rem;
  }

  .nav-card {
    display: block;
    padding: 0.8rem;
    text-align: center;
    font-weight: bold;
    text-decoration: none;
    color: white;
    background: linear-gradient(135deg, #007bff, #0056b3);
    border-radius: 6px;
    transition: background 0.2s ease, transform 0.1s ease;
  }

  .nav-card:hover { background: #0056b3; transform: translateY(-2px); }
  .nav-card.active { background: silver; color: #222; }

  .content {
    flex: 1;
  }

  .content-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
</style-->


<script>
  import StatsLayout from '$lib/components/StatsLayout.svelte';
  import StatCard from '$lib/components/StatCard.svelte';

  export let data;

  const navItems = [
    { label: "All Time Scoring", href: "/league/all_time_stats", active: true },
    { label: "Regular Season Scoring", href: "/league/reg_season_stats" },
    { label: "Playoff Scoring", href: "/league/playoff_stats" },
    { label: "Streaks", href: "/league/streaks" },
    { label: "Potential Points", href: "/league/potential_points" },
    { label: "Ranking", href: "/league/ranking" },
    { label: "Rivalries", href: "/league/rivalries" },
    { label: "Trophy Room", href: "/league/trophy_room" },
    { label: "Draft Room", href: "/league/drafts" }
  ];
</script>

<StatsLayout title="All-Time Scoring" {navItems}>
  <div class="content-grid">

    <!-- Row 1 -->
    <StatCard size="lg">
      <table class="stats-table">
        <thead>
          <tr><th class="table-title" colspan="4">All-Time Highest Game Score</th></tr>
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
          <tr><th class="table-title" colspan="4">All-Time Lowest Game Score</th></tr>
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
          <tr><th class="table-title" colspan="3">All-Time Highest Season Score</th></tr>
          <tr><th>#</th><th>Team</th><th>Total Points</th></tr>
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
              <td>{row.total_points}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </StatCard>

    <StatCard size="lg">
      <table class="stats-table">
        <thead>
          <tr><th class="table-title" colspan="3">All-Time Lowest Season Score</th></tr>
          <tr><th>#</th><th>Team</th><th>Total Points</th></tr>
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
          <tr><th class="table-title" colspan="4">Largest Blowout All Time</th></tr>
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
          <tr><th class="table-title" colspan="4">Closest Nailbiter All Time</th></tr>
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
          <tr><th class="table-title" colspan="5">All-Time Winning Percentage Leaders</th></tr>
          <tr><th>#</th><th>Team</th><th>Record</th><th>Win %</th></tr>
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
          <tr><th class="table-title">Potential Points All Time</th></tr>
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
