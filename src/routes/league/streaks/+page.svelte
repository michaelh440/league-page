<script>
  import StatsLayout from '$lib/components/StatsLayout.svelte';
  
  export let data;

  const navItems = [
    { label: "All Time Scoring", href: "/league/all_time_stats"},
    { label: "Regular Season Scoring", href: "/league/reg_season_stats" },
    { label: "Playoff Scoring", href: "/league/playoff_stats" },
    { label: "Streaks", href: "/league/streaks", active: true },
    //{ label: "Potential Points", href: "/league/potential_points" },
    { label: "Ranking", href: "/league/ranking" },
    { label: "Rivalries", href: "/league/rivalries" },
    { label: "Trophy Room", href: "/league/trophy_room" },
    { label: "Draft Room", href: "/league/drafts" }
  ];

  function formatStreakPeriod(start_season, start_week, end_season, end_week) {
    if (start_season === end_season) {
      return `${start_season} (Weeks ${start_week}-${end_week})`;
    }
    return `${start_season} Week ${start_week} - ${end_season} Week ${end_week}`;
  }

  function formatSeasonPeriod(season_year, start_week, end_week) {
    return `${season_year} (Weeks ${start_week}-${end_week})`;
  }

  function formatScope(scope) {
    if (scope === 'playoffs') return 'Playoffs';
    if (scope === 'regular_season') return 'Regular';
    return scope;
  }
</script>

<StatsLayout title="Streaks" {navItems}>
  <div class="content-grid">
    
    <!-- Current Hot Streaks -->
    {#if data.currentHotStreaks && data.currentHotStreaks.length > 0}
      <div class="stat-card">
        <table class="stats-table">
          <thead>
            <tr><th class="table-title hot-title" colspan="5">🔥 Current Hot Streaks</th></tr>
            <tr>
              <th>#</th>
              <th>Manager</th>
              <th>Streak</th>
              <th>Week</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            {#each data.currentHotStreaks as manager, index}
              <tr>
                <td>{index + 1}</td>
                <td class="manager-cell">
                  <div class="manager-info">
                    {#if manager.manager_logo}
                      <img src={manager.manager_logo} alt={manager.manager_name} class="manager-avatar" />
                    {/if}
                    <div class="manager-details">
                      <span class="manager-name">{manager.manager_name}</span>
                      {#if manager.team_name}
                        <span class="team-name">{manager.team_name}</span>
                      {/if}
                    </div>
                  </div>
                </td>
                <td class="streak-cell hot-streak">{manager.streak_length}W</td>
                <td class="period-cell">{manager.season_year} W{manager.start_week}-{manager.current_week}</td>
                <td class="scope-cell">
                  <span class="badge {manager.streak_scope === 'playoffs' ? 'playoff-badge' : 'regular-badge'}">
                    {formatScope(manager.streak_scope)}
                  </span>
                </td>
              </tr>
            {:else}
              <tr><td colspan="5" class="text-center text-gray-600">No current hot streaks</td></tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}

    <!-- Current Cold Streaks -->
    {#if data.currentColdStreaks && data.currentColdStreaks.length > 0}
      <div class="stat-card">
        <table class="stats-table">
          <thead>
            <tr><th class="table-title cold-title" colspan="5">🧊 Current Cold Streaks</th></tr>
            <tr>
              <th>#</th>
              <th>Manager</th>
              <th>Streak</th>
              <th>Week</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            {#each data.currentColdStreaks as manager, index}
              <tr>
                <td>{index + 1}</td>
                <td class="manager-cell">
                  <div class="manager-info">
                    {#if manager.manager_logo}
                      <img src={manager.manager_logo} alt={manager.manager_name} class="manager-avatar" />
                    {/if}
                    <div class="manager-details">
                      <span class="manager-name">{manager.manager_name}</span>
                      {#if manager.team_name}
                        <span class="team-name">{manager.team_name}</span>
                      {/if}
                    </div>
                  </div>
                </td>
                <td class="streak-cell cold-streak">{manager.streak_length}L</td>
                <td class="period-cell">{manager.season_year} W{manager.start_week}-{manager.current_week}</td>
                <td class="scope-cell">
                  <span class="badge {manager.streak_scope === 'playoffs' ? 'playoff-badge' : 'regular-badge'}">
                    {formatScope(manager.streak_scope)}
                  </span>
                </td>
              </tr>
            {:else}
              <tr><td colspan="5" class="text-center text-gray-600">No current cold streaks</td></tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}

    <!-- All Time Winning Streaks -->
    <div class="stat-card">
      <table class="stats-table">
        <thead>
          <tr><th class="table-title" colspan="4">All Time Winning Streaks</th></tr>
          <tr>
            <th>#</th>
            <th>Manager</th>
            <th>Streak</th>
            <th>Period</th>
          </tr>
        </thead>
        <tbody>
          {#each data.allTimeWinningStreaks as manager, index}
            <tr>
              <td>{index + 1}</td>
              <td class="manager-cell">
                <div class="manager-info">
                  {#if manager.manager_logo}
                    <img src={manager.manager_logo} alt={manager.manager_name} class="manager-avatar" />
                  {/if}
                  <span class="manager-name">{manager.manager_name}</span>
                </div>
              </td>
              <td class="streak-cell winning-streak">{manager.streak_length}W</td>
              <td class="period-cell">
                {formatStreakPeriod(manager.start_season, manager.start_week, manager.end_season, manager.end_week)}
              </td>
            </tr>
          {:else}
            <tr><td colspan="4" class="text-center text-gray-600">No data available</td></tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- All Time Losing Streaks -->
    <div class="stat-card">
      <table class="stats-table">
        <thead>
          <tr><th class="table-title" colspan="4">All Time Losing Streaks</th></tr>
          <tr>
            <th>#</th>
            <th>Manager</th>
            <th>Streak</th>
            <th>Period</th>
          </tr>
        </thead>
        <tbody>
          {#each data.allTimeLosingStreaks as manager, index}
            <tr>
              <td>{index + 1}</td>
              <td class="manager-cell">
                <div class="manager-info">
                  {#if manager.manager_logo}
                    <img src={manager.manager_logo} alt={manager.manager_name} class="manager-avatar" />
                  {/if}
                  <span class="manager-name">{manager.manager_name}</span>
                </div>
              </td>
              <td class="streak-cell losing-streak">{manager.streak_length}L</td>
              <td class="period-cell">
                {formatStreakPeriod(manager.start_season, manager.start_week, manager.end_season, manager.end_week)}
              </td>
            </tr>
          {:else}
            <tr><td colspan="4" class="text-center text-gray-600">No data available</td></tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Regular Season Winning Streaks -->
    <div class="stat-card">
      <table class="stats-table">
        <thead>
          <tr><th class="table-title" colspan="4">Regular Season Winning Streaks</th></tr>
          <tr>
            <th>#</th>
            <th>Manager</th>
            <th>Streak</th>
            <th>Period</th>
          </tr>
        </thead>
        <tbody>
          {#each data.regularSeasonWinningStreaks as manager, index}
            <tr>
              <td>{index + 1}</td>
              <td class="manager-cell">
                <div class="manager-info">
                  {#if manager.manager_logo}
                    <img src={manager.manager_logo} alt={manager.manager_name} class="manager-avatar" />
                  {/if}
                  <span class="manager-name">{manager.manager_name}</span>
                </div>
              </td>
              <td class="streak-cell winning-streak">{manager.streak_length}W</td>
              <td class="period-cell">
                {formatSeasonPeriod(manager.season_year, manager.start_week, manager.end_week)}
              </td>
            </tr>
          {:else}
            <tr><td colspan="4" class="text-center text-gray-600">No data available</td></tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Regular Season Losing Streaks -->
    <div class="stat-card">
      <table class="stats-table">
        <thead>
          <tr><th class="table-title" colspan="4">Regular Season Losing Streaks</th></tr>
          <tr>
            <th>#</th>
            <th>Manager</th>
            <th>Streak</th>
            <th>Period</th>
          </tr>
        </thead>
        <tbody>
          {#each data.regularSeasonLosingStreaks as manager, index}
            <tr>
              <td>{index + 1}</td>
              <td class="manager-cell">
                <div class="manager-info">
                  {#if manager.manager_logo}
                    <img src={manager.manager_logo} alt={manager.manager_name} class="manager-avatar" />
                  {/if}
                  <span class="manager-name">{manager.manager_name}</span>
                </div>
              </td>
              <td class="streak-cell losing-streak">{manager.streak_length}L</td>
              <td class="period-cell">
                {formatSeasonPeriod(manager.season_year, manager.start_week, manager.end_week)}
              </td>
            </tr>
          {:else}
            <tr><td colspan="4" class="text-center text-gray-600">No data available</td></tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Playoff Winning Streaks -->
    <div class="stat-card">
      <table class="stats-table">
        <thead>
          <tr><th class="table-title" colspan="4">Playoff Winning Streaks</th></tr>
          <tr>
            <th>#</th>
            <th>Manager</th>
            <th>Streak</th>
            <th>Period</th>
          </tr>
        </thead>
        <tbody>
          {#each data.playoffWinningStreaks as manager, index}
            <tr>
              <td>{index + 1}</td>
              <td class="manager-cell">
                <div class="manager-info">
                  {#if manager.manager_logo}
                    <img src={manager.manager_logo} alt={manager.manager_name} class="manager-avatar" />
                  {/if}
                  <span class="manager-name">{manager.manager_name}</span>
                </div>
              </td>
              <td class="streak-cell winning-streak">{manager.streak_length}W</td>
              <td class="period-cell">
                {formatSeasonPeriod(manager.season_year, manager.start_week, manager.end_week)}
              </td>
            </tr>
          {:else}
            <tr><td colspan="4" class="text-center text-gray-600">No data available</td></tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Playoff Losing Streaks -->
    <div class="stat-card">
      <table class="stats-table">
        <thead>
          <tr><th class="table-title" colspan="4">Playoff Losing Streaks</th></tr>
          <tr>
            <th>#</th>
            <th>Manager</th>
            <th>Streak</th>
            <th>Period</th>
          </tr>
        </thead>
        <tbody>
          {#each data.playoffLosingStreaks as manager, index}
            <tr>
              <td>{index + 1}</td>
              <td class="manager-cell">
                <div class="manager-info">
                  {#if manager.manager_logo}
                    <img src={manager.manager_logo} alt={manager.manager_name} class="manager-avatar" />
                  {/if}
                  <span class="manager-name">{manager.manager_name}</span>
                </div>
              </td>
              <td class="streak-cell losing-streak">{manager.streak_length}L</td>
              <td class="period-cell">
                {formatSeasonPeriod(manager.season_year, manager.start_week, manager.end_week)}
              </td>
            </tr>
          {:else}
            <tr><td colspan="4" class="text-center text-gray-600">No data available</td></tr>
          {/each}
        </tbody>
      </table>
    </div>

  </div>
</StatsLayout>

<style>
  .content-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
    margin-bottom: 2rem;
    padding: 0;
  }

  .stat-card {
    width: 100%;
    background: white;
    border-radius: 8px;
    overflow: hidden;
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

  .hot-title {
    background: linear-gradient(135deg, #ff6b35, #ff8c42) !important;
  }

  .cold-title {
    background: linear-gradient(135deg, #4a90e2, #5da3f5) !important;
  }
  
  .manager-cell {
    padding: 0.5rem !important;
  }

  .manager-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .manager-details {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }
  
  .manager-avatar {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #e9ecef;
    flex-shrink: 0;
  }
  
  .manager-name {
    font-weight: 600;
    color: #212529;
    font-size: 0.85rem;
  }

  .team-name {
    font-size: 0.7rem;
    color: #868e96;
    font-style: italic;
  }

  .streak-cell {
    text-align: center !important;
    font-weight: 700;
    font-size: 1rem;
    padding: 0.75rem 0.5rem;
  }

  .winning-streak {
    color: #28a745;
    background: linear-gradient(45deg, #d4edda, #e8f5e9);
  }

  .losing-streak {
    color: #dc3545;
    background: linear-gradient(45deg, #f8d7da, #ffebee);
  }

  .hot-streak {
    color: #ff6b35;
    background: linear-gradient(45deg, #ffe5dc, #fff3e0);
  }

  .cold-streak {
    color: #4a90e2;
    background: linear-gradient(45deg, #e3f2fd, #e8f4f8);
  }

  .period-cell {
    font-size: 0.8rem;
    color: #6c757d;
  }

  .scope-cell {
    text-align: center !important;
  }

  .badge {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .regular-badge {
    background: #e3f2fd;
    color: #1976d2;
  }

  .playoff-badge {
    background: #fff3e0;
    color: #f57c00;
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

    .stats-table {
      font-size: 0.8rem;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
    }

    .stats-table th,
    .stats-table td {
      padding: 0.6rem 0.4rem;
      line-height: 1.4;
    }

    .stats-table th {
      font-size: 0.85rem;
    }

    .table-title {
      font-size: 0.95rem;
      padding: 0.75rem;
    }

    .manager-avatar {
      width: 22px;
      height: 22px;
    }

    .manager-name {
      font-size: 0.8rem;
    }

    .team-name {
      font-size: 0.65rem;
    }

    .streak-cell {
      font-size: 0.9rem;
    }

    .period-cell {
      font-size: 0.75rem;
    }

    .badge {
      font-size: 0.65rem;
      padding: 0.2rem 0.4rem;
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

    .manager-avatar {
      width: 18px;
      height: 18px;
    }

    .table-title {
      font-size: 0.85rem;
      padding: 0.5rem;
    }

    .manager-name {
      font-size: 0.75rem;
    }

    .team-name {
      font-size: 0.6rem;
    }

    .streak-cell {
      font-size: 0.85rem;
    }

    .period-cell {
      font-size: 0.7rem;
    }
  }
</style>