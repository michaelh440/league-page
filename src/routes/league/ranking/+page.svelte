<script>
  import StatsLayout from '$lib/components/StatsLayout.svelte';
  
  export let data;

  const navItems = [
    { label: "All Time Scoring", href: "/league/all_time_stats"},
    { label: "Regular Season Scoring", href: "/league/reg_season_stats" },
    { label: "Playoff Scoring", href: "/league/playoff_stats" },
    { label: "Streaks", href: "/league/streaks" },
    //{ label: "Potential Points", href: "/league/potential_points" },
    { label: "Ranking", href: "/league/ranking", active: true  },
    { label: "Rivalries", href: "/league/rivalries" },
    //{ label: "Trophy Room", href: "/league/trophy_room" },
    { label: "Draft Room", href: "/drafts/previous_seasons" }
  ];
</script>

<StatsLayout title="Ranking" {navItems}>
  <div class="stats-container">
    
    <div class="stats-section">
      <div class="section-header">
        <h2>Championships</h2>
        <p>League champions by total titles</p>
      </div>
      
      <div class="table-wrapper">
        <table class="stats-table">
          <thead>
            <tr>
              <th class="rank-col">#</th>
              <th class="manager-col">Manager</th>
              <th class="stat-col">Championships</th>
              <th class="stat-col">Years</th>
            </tr>
          </thead>
          <tbody>
            {#each data.championships as manager, index}
              <tr class="stat-row">
                <td class="rank-cell">{index + 1}</td>
                <td class="manager-cell">
                  <div class="manager-info">
                    {#if manager.manager_logo}
                      <img src={manager.manager_logo} alt={manager.manager_name} class="manager-avatar" />
                    {/if}
                    <span class="manager-name">{manager.manager_name}</span>
                  </div>
                </td>
                <td class="stat-cell highlight">{manager.championships}</td>
                <td class="stat-cell">
                  {#if manager.championship_years}
                    {manager.championship_years.join(', ')}
                  {:else}
                    -
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>

    <div class="stats-section">
      <div class="section-header">
        <h2>Top Final Ranking</h2>
        <p>Best season finishes across all years</p>
      </div>
      
      <div class="table-wrapper">
        <table class="stats-table">
          <thead>
            <tr>
              <th class="rank-col">#</th>
              <th class="manager-col">Manager</th>
              <th class="stat-col">Best Finish</th>
              <th class="stat-col">Seasons</th>
              <th class="stat-col">Avg Finish</th>
            </tr>
          </thead>
          <tbody>
            {#each data.topFinalRanking as manager, index}
              <tr class="stat-row">
                <td class="rank-cell">{index + 1}</td>
                <td class="manager-cell">
                  <div class="manager-info">
                    {#if manager.manager_logo}
                      <img src={manager.manager_logo} alt={manager.manager_name} class="manager-avatar" />
                    {/if}
                    <span class="manager-name">{manager.manager_name}</span>
                  </div>
                </td>
                <td class="stat-cell">{manager.best_finish}</td>
                <td class="stat-cell">{manager.seasons_played}</td>
                <td class="stat-cell highlight">{parseFloat(manager.avg_finish).toFixed(1)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>

    <div class="stats-section">
      <div class="section-header">
        <h2>Top Regular Season Ranking</h2>
        <p>Best regular season finishes</p>
      </div>
      
      <div class="table-wrapper">
        <table class="stats-table">
          <thead>
            <tr>
              <th class="rank-col">#</th>
              <th class="manager-col">Manager</th>
              <th class="stat-col">Best Finish</th>
              <th class="stat-col">Seasons</th>
              <th class="stat-col">Avg Finish</th>
            </tr>
          </thead>
          <tbody>
            {#each data.topRegularSeasonRanking as manager, index}
              <tr class="stat-row">
                <td class="rank-cell">{index + 1}</td>
                <td class="manager-cell">
                  <div class="manager-info">
                    {#if manager.manager_logo}
                      <img src={manager.manager_logo} alt={manager.manager_name} class="manager-avatar" />
                    {/if}
                    <span class="manager-name">{manager.manager_name}</span>
                  </div>
                </td>
                <td class="stat-cell">{manager.best_regular_finish}</td>
                <td class="stat-cell">{manager.seasons_played}</td>
                <td class="stat-cell highlight">{parseFloat(manager.avg_regular_finish).toFixed(1)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>

    <div class="stats-section">
      <div class="section-header">
        <h2>Playoff Appearances</h2>
        <p>Most playoff berths earned</p>
      </div>
      
      <div class="table-wrapper">
        <table class="stats-table">
          <thead>
            <tr>
              <th class="rank-col">#</th>
              <th class="manager-col">Manager</th>
              <th class="stat-col">Appearances</th>
              <th class="stat-col">Total Seasons</th>
              <th class="stat-col">Playoff %</th>
            </tr>
          </thead>
          <tbody>
            {#each data.playoffAppearances as manager, index}
              <tr class="stat-row">
                <td class="rank-cell">{index + 1}</td>
                <td class="manager-cell">
                  <div class="manager-info">
                    {#if manager.manager_logo}
                      <img src={manager.manager_logo} alt={manager.manager_name} class="manager-avatar" />
                    {/if}
                    <span class="manager-name">{manager.manager_name}</span>
                  </div>
                </td>
                <td class="stat-cell">{manager.playoff_appearances}</td>
                <td class="stat-cell">{manager.total_seasons}</td>
                <td class="stat-cell highlight">{manager.playoff_percentage}%</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>

    

  </div>
</StatsLayout>

<style>
  .stats-container {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    padding: 0.5rem;
  }

  .stats-section {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    width: min(750px, 90vw);
    margin: 0 auto;
  }

  .section-header {
    background: linear-gradient(135deg, #003366, #004080);
    color: white;
    padding: 0.375rem 1.5rem;
    text-align: center;
  }

  .section-header h2 {
    margin: 0 0 0.125rem 0;
    font-size: 1.1rem;
    font-weight: 700;
  }

  .section-header p {
    margin: 0;
    font-size: 0.75rem;
    opacity: 0.9;
  }

  .table-wrapper {
    padding: 0;
  }

  .stats-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
    margin: 0;
  }

  .stats-table th {
    background: #f8f9fa;
    color: #495057;
    font-weight: 600;
    text-align: left;
    padding: 1rem;
    border-bottom: 2px solid #dee2e6;
  }

  .rank-col {
    width: 60px;
    text-align: center;
  }

  .manager-col {
    min-width: 160px;
  }

  .stat-col {
    width: 100px;
    text-align: center;
  }

  .stat-row {
    border-bottom: 1px solid #dee2e6;
    transition: background-color 0.2s ease;
  }

  .stat-row:hover {
    background: #f8f9fa;
  }

  .stat-row:nth-child(even) {
    background: #fafbfc;
  }

  .stat-row:nth-child(even):hover {
    background: #f0f1f2;
  }

  .rank-cell {
    text-align: center;
    padding: 1rem;
    font-weight: 600;
    color: #6c757d;
  }

  .manager-cell {
    padding: 1rem;
  }

  .manager-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .manager-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #e9ecef;
  }

  .manager-name {
    font-weight: 600;
    color: #495057;
  }

  .stat-cell {
    padding: 1rem;
    text-align: center;
    color: #6c757d;
  }

  .stat-cell.highlight {
    font-weight: 700;
    color: #003366;
    background: linear-gradient(45deg, #e3f2fd, #f3e5f5);
  }

  @media (max-width: 768px) {
    .stats-container {
      padding: 0;
      gap: 1rem;
    }

    .section-header {
      padding: 1rem;
    }

    .section-header h2 {
      font-size: 1.25rem;
    }

    .stats-table {
      font-size: 0.8rem;
    }

    .stats-table th,
    .rank-cell,
    .manager-cell,
    .stat-cell {
      padding: 0.75rem 0.5rem;
    }

    .manager-avatar {
      width: 28px;
      height: 28px;
    }

    .manager-info {
      gap: 0.5rem;
    }
  }
</style>