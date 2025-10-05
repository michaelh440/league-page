<script>
  import { goto } from '$app/navigation';
  
  export let data;
  
  $: ({ year, standings, availableYears } = data);
  
  function changeYear(newYear) {
    goto(`/standings/${newYear}`);
  }
  
  function getPlayoffBadgeStyle(status) {
    if (status === 'playoffs') return 'background: #3b82f6; color: white;';
    if (status === 'consolation') return 'background: #8b5cf6; color: white;';
    return 'background: #64748b; color: white;';
  }
  
  function getPlayoffLabel(status) {
    if (status === 'playoffs') return 'Playoffs';
    if (status === 'consolation') return 'Consolation';
    return 'Missed';
  }
</script>

<svelte:head>
  <title>{year} Season Standings</title>
</svelte:head>

<div class="page-layout">
  <!-- Sidebar -->
  <aside class="sidebar">
    {#each availableYears || [] as yr}
      <a 
        href="/standings/{yr}" 
        class="season-card"
        class:active={year === yr}
      >
        {yr}
      </a>
    {/each}
  </aside>

  <!-- Main Content -->
  <main class="content">
    <h3 style="text-align: center;">{year} Season Standings</h3>

    <nav class="season-nav">
      <a href="/standings/{year}" class="season-btn active">Final Standings</a>
      <a href="/seasons/{year}" class="season-btn">View Season</a>
    </nav>

    <div class="standings-container">
      {#if !standings || standings.length === 0}
        <div class="no-data">
          <p>No standings data available for {year}</p>
        </div>
      {:else}
        <table class="standings-table">
          <thead>
            <tr>
              <th class="table-title" colspan="6">{year} Final Standings</th>
            </tr>
            <tr>
              <th>Rank</th>
              <th>Manager</th>
              <th>Record</th>
              <th>Points For</th>
              <th>Points Against</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {#each standings as team, i}
              <tr>
                <td class="rank-cell">
                  <span class="rank">#{team.rank || i + 1}</span>
                </td>
                <td class="manager-cell">
                  <div class="team-info">
                    {#if team.logo_url}
                      <img 
                        src={team.logo_url} 
                        alt={team.manager_name || 'Manager'}
                        class="team-logo"
                        on:error={(e) => e.target.src = 'https://via.placeholder.com/32'}
                      />
                    {:else}
                      <div class="team-logo-placeholder"></div>
                    {/if}
                    <span class="team-name">{team.manager_name || 'Unknown'}</span>
                  </div>
                </td>
                <td class="record-cell">
                  {team.wins || 0}-{team.losses || 0}{#if team.ties > 0}-{team.ties}{/if}
                </td>
                <td class="points-for-cell">
                  {team.points_for ? Number(team.points_for).toFixed(1) : '0.0'}
                </td>
                <td class="points-against-cell">
                  {team.points_against ? Number(team.points_against).toFixed(1) : '0.0'}
                </td>
                <td class="status-cell">
                  <span class="status-badge" style={getPlayoffBadgeStyle(team.playoff_status)}>
                    {getPlayoffLabel(team.playoff_status)}
                  </span>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>

        <!-- Legend -->
        <div class="legend">
          <div class="legend-item">
            <span class="status-badge" style="background: #3b82f6; color: white;">Playoffs</span>
            <span>- Made playoffs (top 4)</span>
          </div>
          <div class="legend-item">
            <span class="status-badge" style="background: #8b5cf6; color: white;">Consolation</span>
            <span>- Consolation bracket (5-8)</span>
          </div>
          <div class="legend-item">
            <span class="status-badge" style="background: #64748b; color: white;">Missed</span>
            <span>- Missed playoffs</span>
          </div>
        </div>
      {/if}
    </div>
  </main>
</div>

<style>
  /* Desktop Layout */
  .page-layout {
    display: flex;
    gap: 2rem;
    min-height: 100vh;
    padding: 0 1rem;
  }

  .sidebar {
    flex: 0 0 12%;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-left: 0.5rem;
    margin-top: 1rem;
    position: sticky;
    top: 1rem;
    height: fit-content;
  }

  .season-card {
    display: block;
    padding: 0.8rem;
    text-align: center;
    font-weight: bold;
    text-decoration: none;
    color: white;
    background: linear-gradient(135deg, #007bff, #0056b3);
    border-radius: 6px;
    transition: all 0.2s ease;
  }

  .season-card:hover {
    background: #0056b3;
    transform: translateY(-2px);
  }

  .season-card.active {
    background: silver;
    color: #222;
  }

  .content {
    flex: 1;
    max-width: 100%;
  }

  /* Navigation */
  .season-nav {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin: 1rem 0 2rem 0;
  }

  .season-btn {
    display: inline-block;
    text-decoration: none;
    font-weight: bold;
    color: white;
    background: #007bff;
    padding: 0.6rem 1.2rem;
    border-radius: 6px;
    transition: all 0.2s ease;
  }

  .season-btn:hover {
    background: #0056b3;
    transform: translateY(-2px);
  }

  .season-btn.active {
    background: #004085;
  }

  /* Standings Container */
  .standings-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    padding-bottom: 2rem;
  }

  /* Table Styling */
  .standings-table {
    border-collapse: collapse;
    margin: 0 auto;
    width: 85%;
    max-width: 900px;
    text-align: center;
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .standings-table th,
  .standings-table td {
    border: 1px solid #dee2e6;
    padding: 0.75rem 1rem;
    color: #212529;
  }

  .standings-table th {
    background-color: #004085;
    color: white;
    font-weight: 600;
  }

  .table-title {
    text-align: center !important;
    background: linear-gradient(135deg, #003366, #004080) !important;
    color: white !important;
    font-size: 1.1rem;
    font-weight: bold;
    padding: 0.75rem;
  }

  .standings-table tbody tr {
    background: white;
  }

  .standings-table tbody tr:nth-child(even) {
    background: #f8f9fa;
  }

  .standings-table tbody tr:hover {
    background: #e3f2fd !important;
  }

  .standings-table tbody tr.champion {
    background: #fff9e6 !important;
  }

  .standings-table tbody tr.champion:hover {
    background: #fff4cc !important;
  }

  /* Cell Styling */
  .rank-cell {
    width: 80px;
    font-weight: bold;
  }

  .rank {
    color: #004085;
    font-size: 1.3rem;
  }

  .manager-cell {
    text-align: left;
    min-width: 200px;
  }

  .team-info {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 0.5rem;
  }

  .team-logo {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #e9ecef;
    flex-shrink: 0;
  }

  .team-logo-placeholder {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #dee2e6;
    border: 2px solid #cbd5e0;
    flex-shrink: 0;
  }

  .team-name {
    font-weight: 600;
    color: #212529;
  }

  .record-cell {
    font-family: 'Courier New', monospace;
    font-weight: 600;
    font-size: 1.05rem;
    color: #004085;
  }

  .points-for-cell,
  .points-against-cell {
    font-family: 'Courier New', monospace;
    font-weight: 600;
  }

  .points-for-cell {
    color: #28a745;
  }

  .points-against-cell {
    color: #dc3545;
  }

  .status-cell {
    min-width: 120px;
  }

  .status-badge {
    display: inline-block;
    padding: 0.35rem 0.65rem;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: 700;
    white-space: nowrap;
  }

  .no-data {
    text-align: center;
    padding: 3rem;
    color: #6c757d;
    font-size: 1.25rem;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  /* Legend */
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
    justify-content: center;
    padding: 1rem;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    margin-top: 1rem;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    color: #495057;
  }

  h3 {
    color: #004085;
    margin: 1rem 0;
    font-size: 2rem;
  }

  /* MOBILE RESPONSIVE STYLES */
  @media screen and (max-width: 768px) {
    .page-layout {
      flex-direction: column;
      gap: 0;
      padding: 0.5rem;
    }

    /* Transform sidebar into horizontal scroll */
    .sidebar {
      position: relative;
      flex: none;
      flex-direction: row;
      width: 100%;
      margin: 0 0 1rem 0;
      padding: 0.75rem;
      background: #f8f9fa;
      border-radius: 8px;
      overflow-x: auto;
      overflow-y: hidden;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: thin;
      scrollbar-color: #ccc transparent;
    }

    .sidebar::-webkit-scrollbar {
      height: 4px;
    }

    .sidebar::-webkit-scrollbar-track {
      background: transparent;
    }

    .sidebar::-webkit-scrollbar-thumb {
      background: #ccc;
      border-radius: 2px;
    }

    .season-card {
      flex: 0 0 auto;
      padding: 0.6rem 1rem;
      font-size: 0.9rem;
      white-space: nowrap;
      min-width: 65px;
      text-align: center;
    }

    .content {
      width: 100%;
    }

    h3 {
      font-size: 1.4rem;
      margin: 0.5rem 0 1rem 0;
      text-align: center;
      color: white !important;
    }

    .season-nav {
      gap: 0.75rem;
      margin: 0.5rem 0 1.5rem 0;
      flex-wrap: wrap;
    }

    .season-btn {
      padding: 0.5rem 1rem;
      font-size: 0.9rem;
    }

    .standings-container {
      gap: 1rem;
      padding: 0;
      width: 100%;
    }

    .standings-table {
      width: 100%;
      max-width: none;
      font-size: 0.85rem;
    }

    .standings-table th,
    .standings-table td {
      padding: 0.5rem 0.35rem;
      font-size: 0.8rem;
    }

    .table-title {
      font-size: 0.95rem;
      padding: 0.6rem;
    }

    .rank {
      font-size: 1.1rem;
    }

    .team-logo,
    .team-logo-placeholder {
      width: 24px;
      height: 24px;
    }

    .team-name {
      font-size: 0.8rem;
    }

    .record-cell {
      font-size: 0.85rem;
    }

    .status-badge {
      font-size: 0.7rem;
      padding: 0.25rem 0.4rem;
    }

    .legend {
      flex-direction: column;
      gap: 0.75rem;
      padding: 0.75rem;
    }

    .legend-item {
      font-size: 0.8rem;
    }
  }

  /* VERY SMALL SCREENS */
  @media screen and (max-width: 480px) {
    .standings-table th,
    .standings-table td {
      padding: 0.4rem 0.25rem;
      font-size: 0.7rem;
    }

    .table-title {
      font-size: 0.85rem;
    }

    .team-logo,
    .team-logo-placeholder {
      width: 20px;
      height: 20px;
    }

    .team-name {
      font-size: 0.7rem;
    }

    .rank {
      font-size: 1rem;
    }

    .status-badge {
      font-size: 0.65rem;
      padding: 0.2rem 0.3rem;
    }
  }

  /* TABLET STYLES */
  @media screen and (max-width: 1024px) and (min-width: 769px) {
    .sidebar {
      flex: 0 0 10%;
    }

    .season-card {
      padding: 0.6rem;
      font-size: 0.9rem;
    }

    .standings-table {
      width: 90%;
    }
  }
</style>