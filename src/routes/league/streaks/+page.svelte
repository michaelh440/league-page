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
    //{ label: "Trophy Room", href: "/league/trophy_room" },
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
</script>

<StatsLayout title="Streaks" {navItems}>
  <div class="stats-container">
    
    <!-- Current Hot Streaks -->
    {#if data.currentHotStreaks && data.currentHotStreaks.length > 0}
      <div class="stats-section hot-section">
        <div class="section-header hot-header">
          <h2>🔥 Current Hot Streaks</h2>
          <p>Teams on fire right now (3+ wins)</p>
        </div>
        
        <div class="table-wrapper">
          <table class="stats-table">
            <thead>
              <tr>
                <th class="rank-col">#</th>
                <th class="manager-col">Manager</th>
                <th class="stat-col">Streak</th>
                <th class="stat-col">Period</th>
                <th class="stat-col">Scope</th>
              </tr>
            </thead>
            <tbody>
              {#each data.currentHotStreaks as manager, index}
                <tr class="stat-row">
                  <td class="rank-cell">{index + 1}</td>
                  <td class="manager-cell">
                    <div class="manager-info">
                      {#if manager.manager_logo}
                        <img src={manager.manager_logo} alt={manager.manager_name} class="manager-avatar" />
                      {/if}
                      <div class="manager-details">
                        <span class="manager-name">{manager.manager_name}</span>
                        <span class="team-name">{manager.team_name || ''}</span>
                      </div>
                    </div>
                  </td>
                  <td class="stat-cell highlight hot-stat">{manager.streak_length}W</td>
                  <td class="stat-cell">{manager.season_year} (W{manager.start_week}-W{manager.current_week})</td>
                  <td class="stat-cell scope-badge">
                    <span class="badge {manager.streak_scope === 'playoffs' ? 'playoff-badge' : 'regular-badge'}">
                      {manager.streak_scope === 'playoffs' ? 'Playoffs' : 'Regular'}
                    </span>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {/if}

    <!-- Current Cold Streaks -->
    {#if data.currentColdStreaks && data.currentColdStreaks.length > 0}
      <div class="stats-section cold-section">
        <div class="section-header cold-header">
          <h2>🧊 Current Cold Streaks</h2>
          <p>Teams struggling right now (3+ losses)</p>
        </div>
        
        <div class="table-wrapper">
          <table class="stats-table">
            <thead>
              <tr>
                <th class="rank-col">#</th>
                <th class="manager-col">Manager</th>
                <th class="stat-col">Streak</th>
                <th class="stat-col">Period</th>
                <th class="stat-col">Scope</th>
              </tr>
            </thead>
            <tbody>
              {#each data.currentColdStreaks as manager, index}
                <tr class="stat-row">
                  <td class="rank-cell">{index + 1}</td>
                  <td class="manager-cell">
                    <div class="manager-info">
                      {#if manager.manager_logo}
                        <img src={manager.manager_logo} alt={manager.manager_name} class="manager-avatar" />
                      {/if}
                      <div class="manager-details">
                        <span class="manager-name">{manager.manager_name}</span>
                        <span class="team-name">{manager.team_name || ''}</span>
                      </div>
                    </div>
                  </td>
                  <td class="stat-cell highlight cold-stat">{manager.streak_length}L</td>
                  <td class="stat-cell">{manager.season_year} (W{manager.start_week}-W{manager.current_week})</td>
                  <td class="stat-cell scope-badge">
                    <span class="badge {manager.streak_scope === 'playoffs' ? 'playoff-badge' : 'regular-badge'}">
                      {manager.streak_scope === 'playoffs' ? 'Playoffs' : 'Regular'}
                    </span>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {/if}

    <!-- All Time Winning Streaks -->
    <div class="stats-section">
      <div class="section-header">
        <h2>All Time Winning Streaks</h2>
        <p>Longest winning streaks across all seasons</p>
      </div>
      
      <div class="table-wrapper">
        <table class="stats-table">
          <thead>
            <tr>
              <th class="rank-col">#</th>
              <th class="manager-col">Manager</th>
              <th class="stat-col">Streak</th>
              <th class="stat-col">Period</th>
            </tr>
          </thead>
          <tbody>
            {#each data.allTimeWinningStreaks as manager, index}
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
                <td class="stat-cell highlight">{manager.streak_length}W</td>
                <td class="stat-cell">
                  {formatStreakPeriod(manager.start_season, manager.start_week, manager.end_season, manager.end_week)}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>

    <!-- All Time Losing Streaks -->
    <div class="stats-section">
      <div class="section-header">
        <h2>All Time Losing Streaks</h2>
        <p>Longest losing streaks across all seasons</p>
      </div>
      
      <div class="table-wrapper">
        <table class="stats-table">
          <thead>
            <tr>
              <th class="rank-col">#</th>
              <th class="manager-col">Manager</th>
              <th class="stat-col">Streak</th>
              <th class="stat-col">Period</th>
            </tr>
          </thead>
          <tbody>
            {#each data.allTimeLosingStreaks as manager, index}
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
                <td class="stat-cell highlight losing">{manager.streak_length}L</td>
                <td class="stat-cell">
                  {formatStreakPeriod(manager.start_season, manager.start_week, manager.end_season, manager.end_week)}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Regular Season Winning Streaks -->
    <div class="stats-section">
      <div class="section-header">
        <h2>Regular Season Winning Streaks</h2>
        <p>Best winning streaks during regular season play</p>
      </div>
      
      <div class="table-wrapper">
        <table class="stats-table">
          <thead>
            <tr>
              <th class="rank-col">#</th>
              <th class="manager-col">Manager</th>
              <th class="stat-col">Streak</th>
              <th class="stat-col">Season & Period</th>
            </tr>
          </thead>
          <tbody>
            {#each data.regularSeasonWinningStreaks as manager, index}
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
                <td class="stat-cell highlight">{manager.streak_length}W</td>
                <td class="stat-cell">
                  {formatSeasonPeriod(manager.season_year, manager.start_week, manager.end_week)}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Regular Season Losing Streaks -->
    <div class="stats-section">
      <div class="section-header">
        <h2>Regular Season Losing Streaks</h2>
        <p>Worst losing streaks during regular season play</p>
      </div>
      
      <div class="table-wrapper">
        <table class="stats-table">
          <thead>
            <tr>
              <th class="rank-col">#</th>
              <th class="manager-col">Manager</th>
              <th class="stat-col">Streak</th>
              <th class="stat-col">Season & Period</th>
            </tr>
          </thead>
          <tbody>
            {#each data.regularSeasonLosingStreaks as manager, index}
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
                <td class="stat-cell highlight losing">{manager.streak_length}L</td>
                <td class="stat-cell">
                  {formatSeasonPeriod(manager.season_year, manager.start_week, manager.end_week)}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Playoff Winning Streaks -->
    <div class="stats-section">
      <div class="section-header">
        <h2>Playoff Winning Streaks</h2>
        <p>Best winning streaks during playoff games</p>
      </div>
      
      <div class="table-wrapper">
        <table class="stats-table">
          <thead>
            <tr>
              <th class="rank-col">#</th>
              <th class="manager-col">Manager</th>
              <th class="stat-col">Streak</th>
              <th class="stat-col">Season & Period</th>
            </tr>
          </thead>
          <tbody>
            {#each data.playoffWinningStreaks as manager, index}
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
                <td class="stat-cell highlight">{manager.streak_length}W</td>
                <td class="stat-cell">
                  {formatSeasonPeriod(manager.season_year, manager.start_week, manager.end_week)}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Playoff Losing Streaks -->
    <div class="stats-section">
      <div class="section-header">
        <h2>Playoff Losing Streaks</h2>
        <p>Worst losing streaks during playoff games</p>
      </div>
      
      <div class="table-wrapper">
        <table class="stats-table">
          <thead>
            <tr>
              <th class="rank-col">#</th>
              <th class="manager-col">Manager</th>
              <th class="stat-col">Streak</th>
              <th class="stat-col">Season & Period</th>
            </tr>
          </thead>
          <tbody>
            {#each data.playoffLosingStreaks as manager, index}
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
                <td class="stat-cell highlight losing">{manager.streak_length}L</td>
                <td class="stat-cell">
                  {formatSeasonPeriod(manager.season_year, manager.start_week, manager.end_week)}
                </td>
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

  .hot-section {
    border: 2px solid #ff6b35;
  }

  .cold-section {
    border: 2px solid #4a90e2;
  }

  .section-header {
    background: linear-gradient(135deg, #003366, #004080);
    color: white;
    padding: 0.375rem 1.5rem;
    text-align: center;
  }

  .hot-header {
    background: linear-gradient(135deg, #ff6b35, #ff8c42);
  }

  .cold-header {
    background: linear-gradient(135deg, #4a90e2, #5da3f5);
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
    min-width: 180px;
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

  .manager-details {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
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

  .team-name {
    font-size: 0.75rem;
    color: #868e96;
    font-style: italic;
  }

  .stat-cell {
    padding: 1rem;
    text-align: center;
    color: #6c757d;
  }

  .stat-cell.highlight {
    font-weight: 700;
    font-size: 1.1rem;
  }

  .stat-cell.highlight:not(.losing):not(.hot-stat):not(.cold-stat) {
    color: #28a745;
    background: linear-gradient(45deg, #d4edda, #e8f5e9);
  }

  .stat-cell.highlight.losing {
    color: #dc3545;
    background: linear-gradient(45deg, #f8d7da, #ffebee);
  }

  .stat-cell.highlight.hot-stat {
    color: #ff6b35;
    background: linear-gradient(45deg, #ffe5dc, #fff3e0);
  }

  .stat-cell.highlight.cold-stat {
    color: #4a90e2;
    background: linear-gradient(45deg, #e3f2fd, #e8f4f8);
  }

  .scope-badge {
    padding: 0.5rem;
  }

  .badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.75rem;
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