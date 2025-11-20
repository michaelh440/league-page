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
    { label: "Manager Bio", href: withMgr("/managers/bio") },
    { label: "All Time Scoring", href: withMgr("/managers/all_time_stats") },
    { label: "Regular Season Scoring", href: withMgr("/managers/reg_season_stats") },
    { label: "Playoff Scoring", href: withMgr("/managers/playoff_stats") },
    { label: "Streaks", href: withMgr("/managers/streaks"), active: true },
    { label: "Potential Points", href: withMgr("/managers/potential_points") },
    { label: "Ranking", href: withMgr("/managers/ranking") },
    { label: "Rivalries", href: withMgr("/managers/rivalries") },
    { label: "Trophy Room", href: withMgr("/managers/trophy_room") },
    { label: "Draft Room", href: withMgr("/drafts/managers") }
  ];

  function onSelect(e) {
    selectedManagerId = e.target.value;
    goto(withMgr("/managers/streaks"));
  }

  function formatStreakPeriod(start_season, start_week, end_season, end_week) {
    if (!start_season || !end_season) return 'N/A';
    if (start_season === end_season) {
      return `${start_season} (Weeks ${start_week}-${end_week})`;
    }
    return `${start_season} Week ${start_week} - ${end_season} Week ${end_week}`;
  }

  function formatSeasonPeriod(season_year, start_week, end_week) {
    if (!season_year) return 'N/A';
    return `${season_year} (Weeks ${start_week}-${end_week})`;
  }

  function formatScope(scope) {
    if (scope === 'playoffs') return 'Playoffs';
    if (scope === 'regular_season') return 'Regular';
    if (scope === 'all_time') return 'All-Time';
    return scope;
  }
</script>

<StatsLayout title="Manager Streaks" {navItems}>
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
    <p class="hint">Pick a manager to load streak stats.</p>
  {:else}
    <div class="content-grid">
      
      <!-- Career Stats Summary -->
      {#if data.careerStats}
        <StatCard size="lg">
          <table class="stats-table">
            <thead>
              <tr><th class="table-title" colspan="2">Career Streak Summary</th></tr>
            </thead>
            <tbody>
              <tr>
                <td class="label-cell">Current Streak</td>
                <td class="value-cell">
                  {#if data.careerStats.all_time_current_streak_type === 'winning'}
                    <span class="winning-text">{data.careerStats.all_time_current_streak_length}W</span>
                  {:else if data.careerStats.all_time_current_streak_type === 'losing'}
                    <span class="losing-text">{data.careerStats.all_time_current_streak_length}L</span>
                  {:else}
                    <span class="neutral-text">No Active Streak</span>
                  {/if}
                </td>
              </tr>
              <tr>
                <td class="label-cell">Career Record</td>
                <td class="value-cell">
                  {data.careerStats.career_total_wins}-{data.careerStats.career_total_losses}-{data.careerStats.career_total_ties}
                </td>
              </tr>
              <tr>
                <td class="label-cell">Career Win %</td>
                <td class="value-cell">{data.careerStats.career_win_pct}%</td>
              </tr>
              <tr>
                <td class="label-cell">Regular Season</td>
                <td class="value-cell">
                  {data.careerStats.career_regular_season_wins}-{data.careerStats.career_regular_season_losses}
                </td>
              </tr>
              <tr>
                <td class="label-cell">Playoffs</td>
                <td class="value-cell">
                  {data.careerStats.career_playoff_wins}-{data.careerStats.career_playoff_losses}
                </td>
              </tr>
            </tbody>
          </table>
        </StatCard>
      {/if}

      <!-- Current Streaks -->
      {#if data.currentStreaks && data.currentStreaks.length > 0}
        <StatCard size="lg">
          <table class="stats-table">
            <thead>
              <tr><th class="table-title" colspan="5">Current Active Streaks</th></tr>
              <tr>
                <th>Scope</th>
                <th>Type</th>
                <th>Length</th>
                <th>Period</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {#each data.currentStreaks as streak}
                <tr>
                  <td class="scope-cell">
                    <span class="badge {streak.streak_scope === 'playoffs' ? 'playoff-badge' : 'regular-badge'}">
                      {formatScope(streak.streak_scope)}
                    </span>
                  </td>
                  <td class="type-cell">
                    {#if streak.current_streak_type === 'winning'}
                      <span class="winning-text">Winning</span>
                    {:else if streak.current_streak_type === 'losing'}
                      <span class="losing-text">Losing</span>
                    {:else}
                      <span class="neutral-text">None</span>
                    {/if}
                  </td>
                  <td class="streak-value {streak.current_streak_type === 'winning' ? 'winning-streak' : 'losing-streak'}">
                    {streak.current_streak_length}
                  </td>
                  <td class="period-cell">
                    {streak.season_year} W{streak.current_streak_start_week}-{streak.current_week}
                  </td>
                  <td class="temp-cell">{streak.temperature}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </StatCard>
      {/if}

      <!-- All-Time Win Streak -->
      <StatCard size="lg">
        <table class="stats-table">
          <thead>
            <tr><th class="table-title" colspan="2">All-Time Longest Win Streak</th></tr>
          </thead>
          <tbody>
            {#if data.allTimeWinStreak && data.allTimeWinStreak.length > 0 && data.allTimeWinStreak[0].streak_length > 0}
              <tr>
                <td class="label-cell">Streak Length</td>
                <td class="value-cell winning-streak">
                  {data.allTimeWinStreak[0].streak_length} Wins
                </td>
              </tr>
              <tr>
                <td class="label-cell">Period</td>
                <td class="value-cell">
                  {formatStreakPeriod(
                    data.allTimeWinStreak[0].start_season,
                    data.allTimeWinStreak[0].start_week,
                    data.allTimeWinStreak[0].end_season,
                    data.allTimeWinStreak[0].end_week
                  )}
                </td>
              </tr>
            {:else}
              <tr><td colspan="2" class="text-center text-gray-600">No win streak data</td></tr>
            {/if}
          </tbody>
        </table>
      </StatCard>

      <!-- All-Time Lose Streak -->
      <StatCard size="lg">
        <table class="stats-table">
          <thead>
            <tr><th class="table-title" colspan="2">All-Time Longest Losing Streak</th></tr>
          </thead>
          <tbody>
            {#if data.allTimeLoseStreak && data.allTimeLoseStreak.length > 0 && data.allTimeLoseStreak[0].streak_length > 0}
              <tr>
                <td class="label-cell">Streak Length</td>
                <td class="value-cell losing-streak">
                  {data.allTimeLoseStreak[0].streak_length} Losses
                </td>
              </tr>
              <tr>
                <td class="label-cell">Period</td>
                <td class="value-cell">
                  {formatStreakPeriod(
                    data.allTimeLoseStreak[0].start_season,
                    data.allTimeLoseStreak[0].start_week,
                    data.allTimeLoseStreak[0].end_season,
                    data.allTimeLoseStreak[0].end_week
                  )}
                </td>
              </tr>
            {:else}
              <tr><td colspan="2" class="text-center text-gray-600">No losing streak data</td></tr>
            {/if}
          </tbody>
        </table>
      </StatCard>

      <!-- Regular Season Win Streaks -->
      <StatCard size="lg">
        <table class="stats-table">
          <thead>
            <tr><th class="table-title" colspan="4">Regular Season Win Streaks</th></tr>
            <tr>
              <th>#</th>
              <th>Team</th>
              <th>Streak</th>
              <th>Period</th>
            </tr>
          </thead>
          <tbody>
            {#each data.regularSeasonWinStreak as streak, i}
              <tr>
                <td>{i + 1}</td>
                <td class="team-cell">
                  {#if streak.team_logo}
                    <img src={streak.team_logo} alt={streak.team_name} class="team-logo" />
                  {/if}
                  <span class="team-name">{streak.team_name || 'Unknown'}</span>
                </td>
                <td class="streak-value winning-streak">{streak.streak_length}W</td>
                <td class="period-cell">
                  {formatSeasonPeriod(streak.season_year, streak.start_week, streak.end_week)}
                </td>
              </tr>
            {:else}
              <tr><td colspan="4" class="text-center text-gray-600">No data available</td></tr>
            {/each}
          </tbody>
        </table>
      </StatCard>

      <!-- Regular Season Lose Streaks -->
      <StatCard size="lg">
        <table class="stats-table">
          <thead>
            <tr><th class="table-title" colspan="4">Regular Season Losing Streaks</th></tr>
            <tr>
              <th>#</th>
              <th>Team</th>
              <th>Streak</th>
              <th>Period</th>
            </tr>
          </thead>
          <tbody>
            {#each data.regularSeasonLoseStreak as streak, i}
              <tr>
                <td>{i + 1}</td>
                <td class="team-cell">
                  {#if streak.team_logo}
                    <img src={streak.team_logo} alt={streak.team_name} class="team-logo" />
                  {/if}
                  <span class="team-name">{streak.team_name || 'Unknown'}</span>
                </td>
                <td class="streak-value losing-streak">{streak.streak_length}L</td>
                <td class="period-cell">
                  {formatSeasonPeriod(streak.season_year, streak.start_week, streak.end_week)}
                </td>
              </tr>
            {:else}
              <tr><td colspan="4" class="text-center text-gray-600">No data available</td></tr>
            {/each}
          </tbody>
        </table>
      </StatCard>

      <!-- Playoff Win Streaks -->
      <StatCard size="lg">
        <table class="stats-table">
          <thead>
            <tr><th class="table-title" colspan="4">Playoff Win Streaks</th></tr>
            <tr>
              <th>#</th>
              <th>Team</th>
              <th>Streak</th>
              <th>Period</th>
            </tr>
          </thead>
          <tbody>
            {#each data.playoffWinStreak as streak, i}
              <tr>
                <td>{i + 1}</td>
                <td class="team-cell">
                  {#if streak.team_logo}
                    <img src={streak.team_logo} alt={streak.team_name} class="team-logo" />
                  {/if}
                  <span class="team-name">{streak.team_name || 'Unknown'}</span>
                </td>
                <td class="streak-value winning-streak">{streak.streak_length}W</td>
                <td class="period-cell">
                  {formatSeasonPeriod(streak.season_year, streak.start_week, streak.end_week)}
                </td>
              </tr>
            {:else}
              <tr><td colspan="4" class="text-center text-gray-600">No playoff data available</td></tr>
            {/each}
          </tbody>
        </table>
      </StatCard>

      <!-- Playoff Lose Streaks -->
      <StatCard size="lg">
        <table class="stats-table">
          <thead>
            <tr><th class="table-title" colspan="4">Playoff Losing Streaks</th></tr>
            <tr>
              <th>#</th>
              <th>Team</th>
              <th>Streak</th>
              <th>Period</th>
            </tr>
          </thead>
          <tbody>
            {#each data.playoffLoseStreak as streak, i}
              <tr>
                <td>{i + 1}</td>
                <td class="team-cell">
                  {#if streak.team_logo}
                    <img src={streak.team_logo} alt={streak.team_name} class="team-logo" />
                  {/if}
                  <span class="team-name">{streak.team_name || 'Unknown'}</span>
                </td>
                <td class="streak-value losing-streak">{streak.streak_length}L</td>
                <td class="period-cell">
                  {formatSeasonPeriod(streak.season_year, streak.start_week, streak.end_week)}
                </td>
              </tr>
            {:else}
              <tr><td colspan="4" class="text-center text-gray-600">No playoff data available</td></tr>
            {/each}
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
  
  .label-cell {
    font-weight: 600;
    color: #495057;
    width: 50%;
  }

  .value-cell {
    text-align: right !important;
    font-weight: 500;
    color: #212529;
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

  .streak-value {
    text-align: center !important;
    font-weight: 700;
    font-size: 1rem;
  }

  .winning-streak {
    color: #28a745;
    background: linear-gradient(45deg, #d4edda, #e8f5e9);
  }

  .losing-streak {
    color: #dc3545;
    background: linear-gradient(45deg, #f8d7da, #ffebee);
  }

  .winning-text {
    color: #28a745;
    font-weight: 700;
  }

  .losing-text {
    color: #dc3545;
    font-weight: 700;
  }

  .neutral-text {
    color: #6c757d;
  }

  .period-cell {
    font-size: 0.8rem;
    color: #6c757d;
  }

  .scope-cell,
  .temp-cell {
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

    .table-title {
      font-size: 0.95rem;
      padding: 0.75rem;
    }

    .team-logo {
      width: 22px;
      height: 22px;
    }

    .streak-value {
      font-size: 0.9rem;
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
  }
</style>