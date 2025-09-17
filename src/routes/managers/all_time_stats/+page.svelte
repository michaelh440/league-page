<!--script>
  import StatsLayout from '$lib/components/StatsLayout.svelte';
  import StatCard from '$lib/components/StatCard.svelte';
  import { goto } from '$app/navigation';

  export let data;
  const { managers, managerId, stats } = data;

  // Local variable for binding
  let selectedManagerId = managerId ?? "";

  const navItems = [
    { label: "List", href: "/managers" },
    { label: "Individual Manager Bio", href: "/managers/bio" },
    { label: "Manager All Time Stats", href: "/managers/all_time_stats", active: true },
    { label: "Manager Regular Season Stats", href: "/managers/regular-season" },
    { label: "Manager Playoff Stats", href: "/managers/playoffs" },
    { label: "Matchups/Rivalries", href: "/managers/rivalries" },
    { label: "Manager Trophy Room", href: "/managers/trophies" },
    { label: "Manager Draft Room", href: "/managers/drafts" }
  ];

  function handleChange(event) {
    const id = event.target.value;
    if (id) {
      goto(`/managers/all_time_stats?manager_id=${id}`);
    } else {
      goto(`/managers/all_time_stats`);
    }
  }
</script>

<StatsLayout title="Manager All-Time Stats" {navItems}>
  <div class="selector">
    <label for="manager">Select Manager: </label>
    <select id="manager" on:change={handleChange} bind:value={selectedManagerId}>
      <option value="">-- choose a manager --</option>
      {#each managers as m}
        <option value={m.manager_id}>{m.name}</option>
      {/each}
    </select>
  </div>

  {#if stats}
    <!-- same StatCard tables as before >
  {:else}
    <p class="empty">Select a manager to view stats</p>
  {/if}
</StatsLayout-->


<script>
  import StatsLayout from '$lib/components/StatsLayout.svelte';
  import StatCard from '$lib/components/StatCard.svelte';
  import { goto } from '$app/navigation';

  export let data;

  let selectedManagerId = data.managerId ?? '';

  const withMgr = (path) =>
    selectedManagerId ? `${path}?managerId=${selectedManagerId}` : path;

  const navItems = [
    { label: "All Time Scoring", href: withMgr("/managers/all_time_stats"), active: true },
    { label: "Regular Season Scoring", href: withMgr("/managers/reg_season_stats") },
    { label: "Playoff Scoring", href: withMgr("/managers/playoff_stats") },
    { label: "Streaks", href: withMgr("/managers/streaks") },
    { label: "Potential Points", href: withMgr("/managers/potential_points") },
    { label: "Ranking", href: withMgr("/managers/ranking") },
    { label: "Rivalries", href: withMgr("/managers/rivalries") },
    { label: "Trophy Room", href: withMgr("/managers/trophy_room") },
    { label: "Draft Room", href: withMgr("/managers/drafts") }
  ];

  function onSelect(e) {
    selectedManagerId = e.target.value;
    goto(withMgr("/managers/all_time_stats"));
  }
</script>

<StatsLayout title="Manager All-Time Scoring" {navItems}>
  <div class="toolbar">
    <label for="manager">Manager:&nbsp;</label>
    <select id="manager" on:change={onSelect} bind:value={selectedManagerId}>
      <option value="" disabled selected={!selectedManagerId}>Select a manager…</option>
      {#each data.managers as m}
        <option value={m.manager_id}>{m.name}</option>
      {/each}
    </select>
  </div>

  {#if !selectedManagerId}
    <p class="hint">Pick a manager to load stats.</p>
  {:else}
    <div class="content-grid">
      <!-- Highest Game -->
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

      <!-- Lowest Game -->
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

      <!-- Highest Season -->
      <StatCard size="lg">
        <table class="stats-table">
          <thead>
            <tr><th class="table-title" colspan="4">All-Time Highest Season Score</th></tr>
            <tr><th>#</th><th>Team</th><th>Year</th><th>Points</th></tr>
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
                <td>{row.points}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </StatCard>

      <!-- Lowest Season -->
      <StatCard size="lg">
        <table class="stats-table">
          <thead>
            <tr><th class="table-title" colspan="4">All-Time Lowest Season Score</th></tr>
            <tr><th>#</th><th>Team</th><th>Year</th><th>Points</th></tr>
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
                <td>{row.points}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </StatCard>

      <!-- Largest Blowout -->
      <StatCard size="lg">
        <table class="stats-table">
          <thead>
            <tr><th class="table-title" colspan="5">All-Time Largest Blowout</th></tr>
            <tr><th>#</th><th>Winner</th><th>Loser</th><th>Week</th><th>Margin</th></tr>
          </thead>
          <tbody>
            {#each data.blowout as row, i}
              <tr>
                <td>{i + 1}</td>
                <td>{row.winner}</td>
                <td>{row.loser}</td>
                <td>{row.year} Week {row.week}</td>
                <td>{row.margin}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </StatCard>

      <!-- Closest Nailbiter -->
      <StatCard size="lg">
        <table class="stats-table">
          <thead>
            <tr><th class="table-title" colspan="5">All-Time Closest Nailbiter</th></tr>
            <tr><th>#</th><th>Winner</th><th>Loser</th><th>Week</th><th>Margin</th></tr>
          </thead>
          <tbody>
            {#each data.nailbiter as row, i}
              <tr>
                <td>{i + 1}</td>
                <td>{row.winner}</td>
                <td>{row.loser}</td>
                <td>{row.year} Week {row.week}</td>
                <td>{row.margin}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </StatCard>

      <!-- Winning Percentage -->
      <StatCard size="lg">
        <table class="stats-table">
          <thead>
            <tr><th class="table-title" colspan="3">All-Time Winning Percentage</th></tr>
            <tr><th>Team</th><th>Wins</th><th>Win %</th></tr>
          </thead>
          <tbody>
            {#each data.winPct as row}
              <tr>
                <td class="team-cell">
                  {#if row.team_logo}
                    <img src={row.team_logo} alt={row.team_name} class="team-logo" />
                  {/if}
                  {row.team_name}
                </td>
                <td>{row.wins}</td>
                <td>{row.win_pct}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </StatCard>
    </div>
  {/if}
</StatsLayout>

<style>
  .toolbar { display:flex; align-items:center; gap:.5rem; margin-bottom:.75rem; }
  .hint { color:#666; margin-top:.5rem; }
  .content-grid { display:grid; grid-template-columns: repeat(2,1fr); gap:1rem; }
  .stats-table { width:100%; border-collapse:collapse; font-size:.85rem; }
  .stats-table th, .stats-table td { border:1px solid #ddd; padding:.35rem .5rem; }
  .stats-table th { text-align:center; background:#f5f5f5; font-weight:bold; }
  .table-title { text-align:center; background:#003366; color:#fff; font-size:1.1rem; font-weight:bold; padding:.6rem; }
  .team-cell { display:flex; align-items:center; gap:.5rem; }
  .team-logo { width:22px; height:22px; border-radius:50%; object-fit:cover; }

  .stats-table th.table-title {
    text-align: center !important;
    background-color: #003366 !important;
    color: white !important;
    font-size: 1rem;
    font-weight: bold;
    padding: 0.6rem;
    }
</style>
