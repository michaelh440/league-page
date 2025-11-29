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

  // Modal state
  let showModal = false;
  let modalTitle = '';
  let modalGames = [];

  // Helper function to format scores to 2 decimal places
  function formatScore(score) {
    if (score === null || score === undefined) return '0.00';
    return parseFloat(score).toFixed(2);
  }

  // Check if an award is enabled
  function isEnabled(key) {
    return data.enabledKeys?.includes(key);
  }

  // Open modal with game details
  function openGamesModal(managerName, games, awardType) {
    modalTitle = `${managerName} - ${awardType}`;
    modalGames = games || [];
    showModal = true;
  }

  // Close modal
  function closeModal() {
    showModal = false;
    modalGames = [];
    modalTitle = '';
  }

  // Handle click outside modal
  function handleModalClick(event) {
    if (event.target.classList.contains('modal-overlay')) {
      closeModal();
    }
  }

  // Handle escape key
  function handleKeydown(event) {
    if (event.key === 'Escape' && showModal) {
      closeModal();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<StatsLayout title="League Awards" {navItems}>
  <div class="awards-intro">
    <p>Historical records and achievements across the league's history.</p>
  </div>

  <div class="content-grid">
    <!-- Weekly High Score Leaders -->
    {#if isEnabled('weekly_high_score') && data.weeklyHighScoreLeaders?.length}
      <StatCard size="lg">
        <div class="table-wrapper">
          <table class="stats-table">
            <thead>
              <tr><th class="table-title" colspan="4">🏆 Weekly High Score Leaders</th></tr>
              <tr><th>#</th><th>Manager</th><th>Wins</th><th>Games</th></tr>
            </thead>
            <tbody>
              {#each data.weeklyHighScoreLeaders.slice(0, 10) as row, i}
                <tr>
                  <td>{i + 1}</td>
                  <td class="team-cell">
                    {#if row.team_logo}
                      <img src={row.team_logo} alt={row.manager_name || 'Manager'} class="team-logo" />
                    {/if}
                    <span class="team-name">{row.manager_name || 'Unknown'}</span>
                  </td>
                  <td class="count-cell">{row.award_count}</td>
                  <td class="action-cell">
                    <button 
                      class="view-games-btn"
                      on:click={() => openGamesModal(row.manager_name, row.games, 'Weekly High Scores')}
                    >
                      View
                    </button>
                  </td>
                </tr>
              {:else}
                <tr><td colspan="4" class="text-center text-gray-600">No data available</td></tr>
              {/each}
            </tbody>
          </table>
        </div>
      </StatCard>
    {/if}

    <!-- Weekly Low Score Leaders -->
    {#if isEnabled('weekly_low_score') && data.weeklyLowScoreLeaders?.length}
      <StatCard size="lg">
        <div class="table-wrapper">
          <table class="stats-table">
            <thead>
              <tr><th class="table-title" colspan="4">💩 Weekly Low Score Leaders</th></tr>
              <tr><th>#</th><th>Manager</th><th>Wins</th><th>Games</th></tr>
            </thead>
            <tbody>
              {#each data.weeklyLowScoreLeaders.slice(0, 10) as row, i}
                <tr>
                  <td>{i + 1}</td>
                  <td class="team-cell">
                    {#if row.team_logo}
                      <img src={row.team_logo} alt={row.manager_name || 'Manager'} class="team-logo" />
                    {/if}
                    <span class="team-name">{row.manager_name || 'Unknown'}</span>
                  </td>
                  <td class="count-cell">{row.award_count}</td>
                  <td class="action-cell">
                    <button 
                      class="view-games-btn"
                      on:click={() => openGamesModal(row.manager_name, row.games, 'Weekly Low Scores')}
                    >
                      View
                    </button>
                  </td>
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

  <!-- Modal for viewing game details -->
  {#if showModal}
    <div class="modal-overlay" on:click={handleModalClick} role="dialog" aria-modal="true">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{modalTitle}</h3>
          <button class="modal-close" on:click={closeModal}>&times;</button>
        </div>
        <div class="modal-body">
          {#if modalGames.length > 0}
            <table class="modal-table">
              <thead>
                <tr>
                  <th>Season</th>
                  <th>Week</th>
                  <th>Team</th>
                  <th>Points</th>
                </tr>
              </thead>
              <tbody>
                {#each modalGames as game}
                  <tr>
                    <td>{game.season_year}</td>
                    <td>Week {game.week}</td>
                    <td>{game.team_name}</td>
                    <td class="points-cell">{formatScore(game.score)}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          {:else}
            <p class="no-games">No games found.</p>
          {/if}
        </div>
      </div>
    </div>
  {/if}
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
    min-width: 400px;
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

  .count-cell {
    font-weight: 700;
    color: #28a745;
    text-align: center;
    font-size: 1rem;
  }

  .action-cell {
    text-align: center;
  }

  .view-games-btn {
    background: #003366;
    color: white;
    border: none;
    padding: 0.35rem 0.75rem;
    border-radius: 4px;
    font-size: 0.8rem;
    cursor: pointer;
    transition: background 0.2s ease;
  }

  .view-games-btn:hover {
    background: #004080;
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

  /* Modal Styles */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }

  .modal-content {
    background: white;
    border-radius: 12px;
    max-width: 600px;
    width: 100%;
    max-height: 80vh;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    background: linear-gradient(135deg, #003366, #004080);
    color: white;
  }

  .modal-header h3 {
    margin: 0;
    font-size: 1.1rem;
  }

  .modal-close {
    background: none;
    border: none;
    color: white;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0;
    line-height: 1;
    opacity: 0.8;
  }

  .modal-close:hover {
    opacity: 1;
  }

  .modal-body {
    padding: 1rem;
    max-height: 60vh;
    overflow-y: auto;
  }

  .modal-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;
  }

  .modal-table th,
  .modal-table td {
    padding: 0.6rem 0.75rem;
    border-bottom: 1px solid #e9ecef;
    text-align: left;
  }

  .modal-table th {
    background: #f8f9fa;
    font-weight: 600;
    color: #495057;
  }

  .modal-table tbody tr:hover {
    background: #f1f3f5;
  }

  .modal-table .points-cell {
    text-align: right;
  }

  .no-games {
    text-align: center;
    color: #6c757d;
    padding: 2rem;
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
      min-width: 350px;
      font-size: 0.8rem;
    }

    .stats-table th,
    .stats-table td {
      padding: 0.6rem 0.4rem;
    }

    .stats-table th:nth-child(1),
    .stats-table td:nth-child(1) {
      width: 35px;
      min-width: 35px;
      text-align: center;
    }

    .table-title {
      font-size: 0.9rem;
      padding: 0.6rem;
    }

    .team-logo {
      width: 20px;
      height: 20px;
    }

    .team-name {
      font-size: 0.75rem;
    }

    .view-games-btn {
      padding: 0.25rem 0.5rem;
      font-size: 0.7rem;
    }

    .modal-content {
      max-height: 90vh;
    }

    .modal-header {
      padding: 0.75rem 1rem;
    }

    .modal-header h3 {
      font-size: 1rem;
    }

    .modal-body {
      max-height: 70vh;
    }

    .modal-table {
      font-size: 0.8rem;
    }

    .modal-table th,
    .modal-table td {
      padding: 0.5rem;
    }
  }

  @media (max-width: 480px) {
    .stats-table {
      min-width: 320px;
      font-size: 0.7rem;
    }

    .stats-table th,
    .stats-table td {
      padding: 0.5rem 0.3rem;
    }

    .team-logo {
      width: 18px;
      height: 18px;
    }

    .table-title {
      font-size: 0.8rem;
      padding: 0.5rem;
    }

    .view-games-btn {
      padding: 0.2rem 0.4rem;
      font-size: 0.65rem;
    }
  }
</style>