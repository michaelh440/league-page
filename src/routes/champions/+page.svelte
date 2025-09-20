<!--script>
  import StatsLayout from '$lib/components/StatsLayout.svelte';
  import StatCard from '$lib/components/StatCard.svelte';
  import { goto } from '$app/navigation';
  
  export let data;
  const { champions, stats, managersByCount } = data;

  // Navigation items for the stats section
  const navItems = [
    { label: "All Time Scoring", href: "/league/all_time_stats" },
    { label: "Regular Season Scoring", href: "/league/reg_season_stats" },
    { label: "Playoff Scoring", href: "/league/playoff_stats" },
    { label: "Streaks", href: "/league/streaks" },
    { label: "Potential Points", href: "/league/potential_points" },
    { label: "Ranking", href: "/league/ranking" },
    { label: "Rivalries", href: "/league/rivalries" },
    { label: "Trophy Room", href: "/league/trophy_room" },
    { label: "Draft Room", href: "/league/drafts" },
    { label: "Champions", href: "/champions", active: true }
  ];

  function handleManagerClick(managerId) {
    goto(`/manager/${managerId}`);
  }

  function handleChampionshipClick(champion) {
    goto(`/season/${champion.season_year}`);
  }
</script>

<svelte:head>
  <title>Champions Wall</title>
  <meta name="description" content="Wall of Fantasy Football Champions" />
</svelte:head>

<StatsLayout title="Champions Wall" {navItems}>
  <div class="content-grid">
    
    <!-- Stats Overview Row >
    {#if stats}
      <StatCard size="sm">
        <div class="stat-display">
          <div class="stat-number">{stats.unique_champions}</div>
          <div class="stat-label">Unique Champions</div>
        </div>
      </StatCard>

      <StatCard size="sm">
        <div class="stat-display">
          <div class="stat-number">{stats.total_championships}</div>
          <div class="stat-label">Total Championships</div>
        </div>
      </StatCard>

      <StatCard size="sm">
        <div class="stat-display">
          <div class="stat-number">{stats.latest_season - stats.first_season + 1}</div>
          <div class="stat-label">Seasons Played</div>
        </div>
      </StatCard>

      <StatCard size="sm">
        <div class="stat-display">
          <div class="stat-number">{stats.most_championships_by_one}</div>
          <div class="stat-label">Most by One Manager</div>
        </div>
      </StatCard>
    {/if}

    <!-- Wall of Champions - Horizontal Card Layout >
    <div class="wall-of-champions-container">
      <div class="wall-header">
        <h3 class="wall-header-title">Wall Of Champions</h3>
      </div>
      <div class="wall-content">
        <div class="champions-grid">
          {#each managersByCount as manager}
            <div 
              class="champion-card"
              onclick={() => handleManagerClick(manager.manager_id)}
            >
              <div class="champion-avatar-container">
                <img 
                  src="{manager.avatar_url || '/default-avatar.png'}" 
                  alt="{manager.manager_name}" 
                  class="champion-avatar" 
                />
              </div>
              <div class="champion-name">{manager.manager_name}</div>
              <div class="champion-years">
                {#each manager.championship_years as year}
                  <span 
                    class="year-badge"
                    onclick={(e) => {
                      e.stopPropagation();
                      handleChampionshipClick({ season_year: year });
                    }}
                  >
                    {year}
                  </span>
                {/each}
              </div>
            </div>
          {:else}
            <div class="no-champions">No champions yet!</div>
          {/each}
        </div>
      </div>
    </div>

    <!-- Championship Timeline >
    <StatCard size="lg">
      <table class="stats-table">
        <thead>
          <tr><th class="table-title" colspan="5">Championship Timeline</th></tr>
          <tr><th>Year</th><th>Champion</th><th>Reg Season Rank</th><th>Playoff Status</th><th>Total Seasons</th></tr>
        </thead>
        <tbody>
          {#each champions as champion}
            <tr 
              class="clickable-row"
              onclick={() => handleChampionshipClick(champion)}
            >
              <td class="year-cell">{champion.season_year}</td>
              <td class="team-cell">
                <img src="{champion.avatar_url || '/default-avatar.png'}" alt="{champion.manager_name}" class="team-logo" />
                {champion.manager_name}
              </td>
              <td>#{champion.regular_season_rank || 'N/A'}</td>
              <td class="status-cell">{champion.playoff_status || 'N/A'}</td>
              <td>{champion.total_seasons}</td>
            </tr>
          {:else}
            <tr><td colspan="5" class="text-center text-gray-600">No championship data available</td></tr>
          {/each}
        </tbody>
      </table>
    </StatCard>

    <!-- Current Champion Spotlight >
    {#if champions.length > 0}
      {@const currentChampion = champions[0]}
      <StatCard size="lg">
        <div class="current-champion-display">
          <h3 class="current-champ-title">{currentChampion.season_year} Champion</h3>
          <div class="champ-info">
            <img src="{currentChampion.avatar_url || '/default-avatar.png'}" alt="{currentChampion.manager_name}" class="current-champ-avatar" />
            <div class="champ-details">
              <div class="champ-name">{currentChampion.manager_name}</div>
              <div class="champ-stats">
                <span>Regular Season: #{currentChampion.regular_season_rank}</span>
                <span>Total Championships: {currentChampion.championship_count}</span>
                <span>Seasons Played: {currentChampion.total_seasons}</span>
              </div>
            </div>
          </div>
        </div>
      </StatCard>
    {/if}

  </div>
</StatsLayout>

<style>
  .content-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
  }

  /* Full width for Wall of Champions */
  .wall-of-champions-container {
    grid-column: 1 / -1;
  }
  
  .stats-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  .stats-table th,
  .stats-table td {
    border: 1px solid #dee2e6;
    padding: 0.75rem 0.5rem;
  }
  
  .stats-table th {
    text-align: center;
    background: #f8f9fa;
    font-weight: 600;
    color: #495057;
  }
  
  .stats-table td {
    text-align: left;
  }
  
  .stats-table tr:nth-child(even) {
    background: #fafbfc;
  }
  
  .clickable-row {
    cursor: pointer;
    transition: background-color 0.2s ease;
  }
  
  .clickable-row:hover {
    background: #e3f2fd !important;
  }
  
  .table-title {
    text-align: center !important;
    background: linear-gradient(135deg, #ffd700, #ffed4a) !important;
    color: #92400e !important;
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
  }

  /* Wall of Champions - Container with Blue Header */
  .wall-of-champions-container {
    background: #fff;
    border: 2px solid #2563eb;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    margin: 1rem 0;
  }

  .wall-header {
    background: #2563eb;
    color: white;
    text-align: center;
    padding: 1rem;
  }

  .wall-header-title {
    font-size: 1.5rem;
    font-weight: bold;
    margin: 0;
  }

  .wall-content {
    padding: 2rem;
    background: #fff;
  }

  .champions-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 2rem;
    justify-content: center;
    align-items: flex-start;
  }

  .champion-card {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 1.5rem 1rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    min-width: 160px;
    max-width: 180px;
  }

  .champion-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
    border-color: #fbbf24;
  }

  .champion-avatar-container {
    margin-bottom: 1rem;
  }

  .champion-avatar {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    border: 3px solid #fbbf24;
    object-fit: cover;
    background: #f3f4f6;
  }

  .champion-name {
    font-size: 1.2rem;
    font-weight: bold;
    color: #1f2937;
    margin-bottom: 1rem;
  }

  .champion-years {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: center;
  }

  .year-badge {
    background: #1f2937;
    color: #fbbf24;
    padding: 0.4rem 0.8rem;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .year-badge:hover {
    background: #fbbf24;
    color: #1f2937;
    transform: scale(1.05);
  }

  .no-champions {
    text-align: center;
    color: #6b7280;
    font-style: italic;
    font-size: 1.1rem;
    grid-column: 1 / -1;
  }

  .year-badge {
    background: #1f2937;
    color: #ffd700;
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .year-badge:hover {
    background: #ffd700;
    color: #1f2937;
    transform: scale(1.05);
  }

  .year-cell {
    font-weight: bold;
    color: #1f2937;
    font-size: 1rem;
  }

  .status-cell {
    text-transform: capitalize;
    font-weight: 500;
  }

  /* Stat Display for Overview Cards */
  .stat-display {
    text-align: center;
    padding: 1rem;
  }

  .stat-number {
    font-size: 2.5rem;
    font-weight: bold;
    color: #92400e;
    display: block;
    line-height: 1;
  }

  .stat-label {
    font-size: 0.9rem;
    color: #b45309;
    text-transform: uppercase;
    font-weight: 600;
    letter-spacing: 0.5px;
    margin-top: 0.5rem;
  }

  /* Current Champion Display */
  .current-champion-display {
    text-align: center;
    padding: 1.5rem;
  }

  .current-champ-title {
    font-size: 1.5rem;
    font-weight: bold;
    color: #1f2937;
    margin-bottom: 1rem;
  }

  .champ-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .current-champ-avatar {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    border: 3px solid #ffd700;
    object-fit: cover;
  }

  .champ-details {
    text-align: center;
  }

  .champ-name {
    font-size: 1.3rem;
    font-weight: bold;
    color: #1f2937;
    margin-bottom: 0.5rem;
  }

  .champ-stats {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.9rem;
    color: #6b7280;
  }

  .text-center {
    text-align: center;
  }
  
  .text-gray-600 {
    color: #6c757d;
  }

  @media (max-width: 1200px) {
    .content-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 768px) {
    .content-grid {
      grid-template-columns: 1fr;
      gap: 0.5rem;
    }

    .stats-table {
      font-size: 0.75rem;
    }

    .stats-table th,
    .stats-table td {
      padding: 0.5rem 0.25rem;
    }

    .team-logo {
      width: 20px;
      height: 20px;
    }

    .current-champ-avatar {
      width: 60px;
      height: 60px;
    }

    .years-cell {
      flex-direction: column;
    }
  }
</style-->


<script>
  import StatsLayout from '$lib/components/StatsLayout.svelte';
  import StatCard from '$lib/components/StatCard.svelte';
  import { goto } from '$app/navigation';
  
  export let data;
  const { champions, stats, managersByCount } = data;

  // Navigation items for the stats section
  const navItems = [
    { label: "All Time Scoring", href: "/league/all_time_stats" },
    { label: "Regular Season Scoring", href: "/league/reg_season_stats" },
    { label: "Playoff Scoring", href: "/league/playoff_stats" },
    { label: "Streaks", href: "/league/streaks" },
    { label: "Potential Points", href: "/league/potential_points" },
    { label: "Ranking", href: "/league/ranking" },
    { label: "Rivalries", href: "/league/rivalries" },
    { label: "Trophy Room", href: "/league/trophy_room" },
    { label: "Draft Room", href: "/league/drafts" },
    { label: "Champions", href: "/champions", active: true }
  ];

  function handleManagerClick(managerId) {
    goto(`/manager/${managerId}`);
  }

  function handleChampionshipClick(champion) {
    goto(`/season/${champion.season_year}`);
  }
</script>

<svelte:head>
  <title>Champions Wall</title>
  <meta name="description" content="Wall of Fantasy Football Champions" />
</svelte:head>

<StatsLayout title="Champions Wall" {navItems}>
  <div class="content-grid">
    
    <!-- Stats Overview Row -->
    {#if stats}
      <StatCard size="sm">
        <div class="stat-display">
          <div class="stat-number">{stats.unique_champions}</div>
          <div class="stat-label">Unique Champions</div>
        </div>
      </StatCard>

      <StatCard size="sm">
        <div class="stat-display">
          <div class="stat-number">{stats.total_championships}</div>
          <div class="stat-label">Total Championships</div>
        </div>
      </StatCard>

      <StatCard size="sm">
        <div class="stat-display">
          <div class="stat-number">{stats.latest_season - stats.first_season + 1}</div>
          <div class="stat-label">Seasons Played</div>
        </div>
      </StatCard>

      <StatCard size="sm">
        <div class="stat-display">
          <div class="stat-number">{stats.most_championships_by_one}</div>
          <div class="stat-label">Most by One Manager</div>
        </div>
      </StatCard>
    {/if}

    <!-- Wall of Champions - Horizontal Card Layout -->
    <div class="wall-of-champions-container">
      <div class="wall-header">
        <h3 class="wall-header-title">Wall Of Champions</h3>
      </div>
      <div class="wall-content">
        <div class="champions-grid">
          {#each managersByCount as manager}
            <div 
              class="champion-card"
              onclick={() => handleManagerClick(manager.manager_id)}
            >
              <div class="champion-avatar-container">
                <img 
                  src="{manager.avatar_url || '/default-avatar.png'}" 
                  alt="{manager.manager_name}" 
                  class="champion-avatar" 
                />
              </div>
              <div class="champion-name">{manager.manager_name}</div>
              <div class="champion-years">
                {#each manager.championship_years as year}
                  <span 
                    class="year-badge"
                    onclick={(e) => {
                      e.stopPropagation();
                      handleChampionshipClick({ season_year: year });
                    }}
                  >
                    {year}
                  </span>
                {/each}
              </div>
            </div>
          {:else}
            <div class="no-champions">No champions yet!</div>
          {/each}
        </div>
      </div>
    </div>

    <!-- Championship Timeline -->
    <StatCard size="lg">
      <table class="stats-table">
        <thead>
          <tr><th class="table-title" colspan="5">Championship Timeline</th></tr>
          <tr><th>Year</th><th>Champion</th><th>Reg Season Rank</th><th>Playoff Status</th><th>Total Seasons</th></tr>
        </thead>
        <tbody>
          {#each champions as champion}
            <tr 
              class="clickable-row"
              onclick={() => handleChampionshipClick(champion)}
            >
              <td class="year-cell">{champion.season_year}</td>
              <td class="team-cell">
                <img src="{champion.avatar_url || '/default-avatar.png'}" alt="{champion.manager_name}" class="team-logo" />
                {champion.manager_name}
              </td>
              <td>#{champion.regular_season_rank || 'N/A'}</td>
              <td class="status-cell">{champion.playoff_status || 'N/A'}</td>
              <td>{champion.total_seasons}</td>
            </tr>
          {:else}
            <tr><td colspan="5" class="text-center text-gray-600">No championship data available</td></tr>
          {/each}
        </tbody>
      </table>
    </StatCard>

    <!-- Current Champion Spotlight -->
    {#if champions.length > 0}
      {@const currentChampion = champions[0]}
      <StatCard size="lg">
        <div class="current-champion-display">
          <h3 class="current-champ-title">{currentChampion.season_year} Champion</h3>
          <div class="champ-info">
            <img src="{currentChampion.avatar_url || '/default-avatar.png'}" alt="{currentChampion.manager_name}" class="current-champ-avatar" />
            <div class="champ-details">
              <div class="champ-name">{currentChampion.manager_name}</div>
              <div class="champ-stats">
                <span>Regular Season: #{currentChampion.regular_season_rank}</span>
                <span>Total Championships: {currentChampion.championship_count}</span>
                <span>Seasons Played: {currentChampion.total_seasons}</span>
              </div>
            </div>
          </div>
        </div>
      </StatCard>
    {/if}

  </div>
</StatsLayout>

<style>
  .content-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
  }

  /* Full width for Wall of Champions */
  .wall-of-champions-container {
    grid-column: 1 / -1;
  }
  
  .stats-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  .stats-table th,
  .stats-table td {
    border: 1px solid #dee2e6;
    padding: 0.75rem 0.5rem;
  }
  
  .stats-table th {
    text-align: center;
    background: #f8f9fa;
    font-weight: 600;
    color: #495057;
  }
  
  .stats-table td {
    text-align: left;
  }
  
  .stats-table tr:nth-child(even) {
    background: #fafbfc;
  }
  
  .clickable-row {
    cursor: pointer;
    transition: background-color 0.2s ease;
  }
  
  .clickable-row:hover {
    background: #e3f2fd !important;
  }
  
  .table-title {
    text-align: center !important;
    background: linear-gradient(135deg, #ffd700, #ffed4a) !important;
    color: #92400e !important;
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
  }

  /* Wall of Champions - Container with Blue Header */
  .wall-of-champions-container {
    background: #fff;
    border: 2px solid #2563eb;
    border-radius: 6px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    margin: 0.5rem 0;
  }

  .wall-header {
    background: #2563eb;
    color: white;
    text-align: center;
    padding: 0.75rem;
  }

  .wall-header-title {
    font-size: 1.2rem;
    font-weight: bold;
    margin: 0;
  }

  .wall-content {
    padding: .75rem;
    background: #fff;
  }

  .champions-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    justify-content: center;
    align-items: flex-start;
  }

  .champion-card {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 1rem 0.75rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
    min-width: 100px;
    max-width: 120px;
  }

  .champion-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: #fbbf24;
  }

  .champion-avatar-container {
    margin-bottom: 0.75rem;
  }

  .champion-avatar {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    border: 2px solid #fbbf24;
    object-fit: cover;
    background: #f3f4f6;
  }

  .champion-name {
    font-size: 1rem;
    font-weight: bold;
    color: #1f2937;
    margin-bottom: 0.75rem;
  }

  .champion-years {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
    justify-content: center;
  }

  .year-badge {
    background: #1f2937;
    color: #fbbf24;
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .year-badge:hover {
    background: #fbbf24;
    color: #1f2937;
    transform: scale(1.05);
  }

  .no-champions {
    text-align: center;
    color: #6b7280;
    font-style: italic;
    font-size: 1rem;
    grid-column: 1 / -1;
  }

  .year-badge {
    background: #1f2937;
    color: #ffd700;
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .year-badge:hover {
    background: #ffd700;
    color: #1f2937;
    transform: scale(1.05);
  }

  .year-cell {
    font-weight: bold;
    color: #1f2937;
    font-size: 1rem;
  }

  .status-cell {
    text-transform: capitalize;
    font-weight: 500;
  }

  /* Stat Display for Overview Cards */
  .stat-display {
    text-align: center;
    padding: 1rem;
  }

  .stat-number {
    font-size: 2.5rem;
    font-weight: bold;
    color: #92400e;
    display: block;
    line-height: 1;
  }

  .stat-label {
    font-size: 0.9rem;
    color: #b45309;
    text-transform: uppercase;
    font-weight: 600;
    letter-spacing: 0.5px;
    margin-top: 0.5rem;
  }

  /* Current Champion Display */
  .current-champion-display {
    text-align: center;
    padding: 1.5rem;
  }

  .current-champ-title {
    font-size: 1.5rem;
    font-weight: bold;
    color: #1f2937;
    margin-bottom: 1rem;
  }

  .champ-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .current-champ-avatar {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    border: 3px solid #ffd700;
    object-fit: cover;
  }

  .champ-details {
    text-align: center;
  }

  .champ-name {
    font-size: 1.3rem;
    font-weight: bold;
    color: #1f2937;
    margin-bottom: 0.5rem;
  }

  .champ-stats {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.9rem;
    color: #6b7280;
  }

  .text-center {
    text-align: center;
  }
  
  .text-gray-600 {
    color: #6c757d;
  }

  @media (max-width: 1200px) {
    .content-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 768px) {
    .content-grid {
      grid-template-columns: 1fr;
      gap: 0.5rem;
    }

    .stats-table {
      font-size: 0.75rem;
    }

    .stats-table th,
    .stats-table td {
      padding: 0.5rem 0.25rem;
    }

    .team-logo {
      width: 20px;
      height: 20px;
    }

    .current-champ-avatar {
      width: 60px;
      height: 60px;
    }

    .years-cell {
      flex-direction: column;
    }
  }
</style>