<script>
  import StatsLayout from '$lib/components/StatsLayout.svelte';
  import { goto } from '$app/navigation';

  export let data;

  let selectedManagerId = data.managerId?.toString() ?? '';

  const withMgr = (path) =>
    selectedManagerId ? `${path}?managerId=${selectedManagerId}` : path;

  const navItems = [
    { label: "Biography", href: withMgr("/managers/bio")},
    { label: "All Time Scoring", href: withMgr("/managers/all_time_stats") },
    { label: "Regular Season Scoring", href: withMgr("/managers/reg_season_stats") },
    { label: "Playoff Scoring", href: withMgr("/managers/playoff_stats") },
    { label: "Rivalries", href: withMgr("/managers/rivalries"), active: true },
    { label: "Draft Room", href: withMgr("/managers/drafts") }
  ];

  function onSelect(e) {
    selectedManagerId = e.target.value;
    goto(withMgr("/managers/rivalries"));
  }

  $: selectedManager = data.managers.find(m => m.manager_id === data.managerId);
  
  // Process rivalries for display
  $: managerRivalries = data.rivalries
    .map(r => {
      const isTeam1 = r.team1_id === data.managerId;
      const opponentId = isTeam1 ? r.team2_id : r.team1_id;
      const opponent = data.managers.find(m => m.manager_id === opponentId);
      
      // Convert to numbers using correct column names
      const wins = parseInt(isTeam1 ? r.team1_wins : r.team2_wins);
      const losses = parseInt(isTeam1 ? r.team2_wins : r.team1_wins);
      const ties = parseInt(r.ties);
      const total = parseInt(r.games_played);
      
      // Calculate win percentage: (wins + 0.5 * ties) / total_games
      const winPct = ((wins + 0.5 * ties) / total * 100).toFixed(1);
      
      return {
        opponent,
        wins,
        losses,
        ties,
        total,
        winPct,
        team1_id: r.team1_id,
        team2_id: r.team2_id
      };
    })
    .sort((a, b) => parseFloat(b.winPct) - parseFloat(a.winPct));
</script>


<StatsLayout title="Manager Rivalries" {navItems}>
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
    <p class="hint">Pick a manager to view their rivalries.</p>
  {:else if selectedManager}
    <div class="selected-manager">
      {#if selectedManager.logo_url}
        <img src={selectedManager.logo_url} alt={selectedManager.name} class="manager-avatar" />
      {/if}
      <h3>{selectedManager.name}'s Rivalries</h3>
    </div>

    {#if managerRivalries.length > 0}
      <div class="rivalry-table-wrapper">
        <table class="rivalry-table">
          <thead>
            <tr>
              <th class="rank-col">#</th>
              <th class="opponent-col">Opponent</th>
              <th class="stat-col">Record</th>
              <th class="stat-col">Win %</th>
              <th class="stat-col">Total Games</th>
              <th class="action-col"></th>
            </tr>
          </thead>
          <tbody>
            {#each managerRivalries as rivalry, index}
              <tr>
                <td class="rank-cell">{index + 1}</td>
                <td class="opponent-cell">
                  <div class="opponent-info">
                    {#if rivalry.opponent?.logo_url}
                      <img src={rivalry.opponent.logo_url} alt={rivalry.opponent.name} class="opponent-logo" />
                    {/if}
                    <span>{rivalry.opponent?.name || 'Unknown'}</span>
                  </div>
                </td>
                <td class="record-cell">
                  <span class="wins">{rivalry.wins}</span>-<span class="losses">{rivalry.losses}</span>-<span class="ties">{rivalry.ties}</span>
                </td>
                <td class="winpct-cell">{rivalry.winPct}%</td>
                <td class="total-cell">{rivalry.total}</td>
                <td class="action-cell">
                  <a href={`/rivalries/${rivalry.manager1_id}-${rivalry.manager2_id}`} class="view-btn">
                    View
                  </a>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {:else}
      <p class="no-data">No rivalry data available for this manager.</p>
    {/if}
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

  .selected-manager {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 2rem;
    padding: 1rem;
  }

  .manager-avatar {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid #003366;
  }

  .selected-manager h3 {
    margin: 0;
    font-size: 1.5rem;
    color: #003366;
  }

  .rivalry-table-wrapper {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    max-width: 900px;
    margin: 0 auto 3rem auto;
  }

  .rivalry-table {
    width: 100%;
    border-collapse: collapse;
  }

  .rivalry-table th {
    background: linear-gradient(135deg, #003366, #004080);
    color: white;
    padding: 1rem;
    text-align: left;
    font-weight: 600;
  }

  .rank-col {
    width: 60px;
    text-align: center;
  }

  .opponent-col {
    min-width: 200px;
  }

  .stat-col {
    width: 120px;
    text-align: center;
  }

  .action-col {
    width: 100px;
    text-align: center;
  }

  .rivalry-table td {
    padding: 1rem;
    border-bottom: 1px solid #dee2e6;
  }

  .rivalry-table tbody tr:hover {
    background: #f8f9fa;
  }

  .rivalry-table tbody tr:nth-child(even) {
    background: #fafbfc;
  }

  .rivalry-table tbody tr:nth-child(even):hover {
    background: #f0f1f2;
  }

  .rank-cell {
    text-align: center;
    font-weight: 600;
    color: #6c757d;
  }

  .opponent-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .opponent-logo {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #e9ecef;
  }

  .record-cell {
    font-weight: 600;
    font-family: monospace;
    font-size: 1rem;
    text-align: center;
  }

  .wins {
    color: #28a745;
  }

  .losses {
    color: #dc3545;
  }

  .ties {
    color: #6c757d;
  }

  .winpct-cell {
    font-weight: 700;
    color: #003366;
    text-align: center;
  }

  .total-cell {
    text-align: center;
    color: #6c757d;
  }

  .action-cell {
    text-align: center;
  }

  .view-btn {
    display: inline-block;
    padding: 0.5rem 1rem;
    background: #007bff;
    color: white;
    text-decoration: none;
    border-radius: 6px;
    font-weight: 600;
    font-size: 0.9rem;
    transition: background 0.2s;
  }

  .view-btn:hover {
    background: #0056b3;
  }

  .no-data {
    text-align: center;
    padding: 3rem;
    color: #6c757d;
    font-size: 1.1rem;
    background: #f8f9fa;
    border-radius: 8px;
    margin-top: 1rem;
  }

  @media (max-width: 768px) {
    .toolbar {
      flex-direction: column;
      gap: 0.5rem;
      padding: 0.75rem;
    }

    .manager-select {
      min-width: 160px;
      font-size: 0.9rem;
    }

    .selected-manager {
      flex-direction: column;
      gap: 0.5rem;
      padding: 0.75rem;
    }

    .manager-avatar {
      width: 50px;
      height: 50px;
    }

    .selected-manager h3 {
      font-size: 1.25rem;
    }

    .rivalry-table {
      font-size: 0.85rem;
    }

    .rivalry-table th,
    .rivalry-table td {
      padding: 0.75rem 0.5rem;
    }

    .opponent-logo {
      width: 28px;
      height: 28px;
    }

    .view-btn {
      padding: 0.4rem 0.8rem;
      font-size: 0.8rem;
    }

    .rivalry-table-wrapper {
      margin-bottom: 2rem;
    }
  }
</style>