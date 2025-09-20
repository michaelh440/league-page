<script>
  import StatsLayout from '$lib/components/StatsLayout.svelte';
  export let data;
  const { managers } = data;

  // Custom ordering array
  let customOrder = [1,2,3,7,8,14,15,21,22,23,4,5,6,9,10,11,12,13,16,17,18,19,20];
  const orderMap = new Map(customOrder.map((id, i) => [id, i]));

  // IDs of inactive managers
  const inactiveManagers = new Set([4,5,6,9,10,11,12,13,16,17,18,19,20]);

  // Sort managers by custom order
  $: sortedManagers = [...managers].sort(
    (a, b) =>
      (orderMap.get(a.manager_id) ?? 999) -
      (orderMap.get(b.manager_id) ?? 999)
  );

  const navItems = [
    { label: "List", href: "/managers", active: true },
    { label: "Individual Manager Bio", href: "/managers/bio" },
    { label: "Manager All Time Stats", href: "/managers/all_time_stats" },
    { label: "Manager Regular Season Stats", href: "/managers/reg_season_stats" },
    { label: "Manager Playoff Stats", href: "/managers/playoff_stats" },
    { label: "Matchups/Rivalries", href: "/managers/rivalries" },
    //{ label: "Manager Trophy Room", href: "/managers/trophies" },
    { label: "Manager Draft Room", href: "/managers/drafts" }
  ];

  // Function to navigate to manager's all-time stats
  function viewManagerStats(managerId) {
    window.location.href = `/managers/all_time_stats?managerId=${managerId}`;
  }

  // Function to parse signature moves from asterisk-delimited string to array
  function parseSignatureMoves(movesString) {
    if (!movesString) return [];
    return movesString
      .split('*')
      .map(move => move.trim())
      .filter(move => move.length > 0);
  }
</script>

<StatsLayout title="Managers" {navItems}>
  <div class="managers-summary">
    <div class="summary-stats">
      <div class="stat-item">
        <span class="stat-number">{managers.filter(m => !inactiveManagers.has(m.manager_id)).length}</span>
        <span class="stat-label">Active Managers</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">{managers.filter(m => inactiveManagers.has(m.manager_id)).length}</span>
        <span class="stat-label">Got Scared</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">{Math.min(...managers.map(m => m.year_joined || 2025))}</span>
        <span class="stat-label">League Started</span>
      </div>
    </div>
  </div>

  <div class="grid">
    {#each sortedManagers as m}
      <div class="card-container">
        <div class="card" class:inactive={inactiveManagers.has(m.manager_id)}>
          <div class="card-header">
            {#if m.logo_url}
              <img src={m.logo_url} alt={m.username} class="logo" />
            {:else}
              <div class="logo-placeholder">
                <span>{m.username?.charAt(0)?.toUpperCase() || '?'}</span>
              </div>
            {/if}
            
            <div class="info">
              <h2>{m.username || 'Unknown Manager'}</h2>
              {#if m.real_name && m.real_name !== m.username}
                <p class="real-name">{m.real_name}</p>
              {/if}
              
              {#if m.philosophy}
                <p class="philosophy">"{m.philosophy}"</p>
              {/if}
              
              {#if m.signature_moves}
                <div class="moves">
                  <strong>Signature Moves:</strong>
                  <ul class="moves-list">
                    {#each parseSignatureMoves(m.signature_moves) as move}
                      <li>{move}</li>
                    {/each}
                  </ul>
                </div>
              {/if}
              
              {#if m.favorite_team}
                <p class="favorite-team"><strong>Favorite Team:</strong> {m.favorite_team}</p>
              {/if}
            </div>
          </div>

          <div class="card-footer">
            <p class="joined">Joined: {m.year_joined || 'Unknown'}</p>
            <div class="card-actions">
              <button 
                class="view-stats-btn" 
                on:click={() => viewManagerStats(m.manager_id)}
                disabled={inactiveManagers.has(m.manager_id)}
              >
                View Stats
              </button>
            </div>
          </div>
        </div>

        {#if inactiveManagers.has(m.manager_id)}
          <div class="overlay">
            <span>Got Scared</span>
          </div>
        {/if}
      </div>
    {/each}
  </div>
</StatsLayout>

<style>
  .managers-summary {
    margin-bottom: 2rem;
    padding: 1.5rem;
    background: linear-gradient(135deg, #f8f9fa, #e9ecef);
    border-radius: 10px;
    border: 1px solid #dee2e6;
  }

  .summary-stats {
    display: flex;
    justify-content: center;
    gap: 3rem;
    flex-wrap: wrap;
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .stat-number {
    font-size: 2.5rem;
    font-weight: bold;
    color: #003366;
    line-height: 1;
  }

  .stat-label {
    font-size: 0.9rem;
    color: #666;
    margin-top: 0.25rem;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.5rem;
    padding: 1rem;
  }
  
  .card-container {
    position: relative;
  }
  
  .card {
    border: 2px solid #ddd;
    border-radius: 12px;
    padding: 1.5rem;
    background: #fff;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    min-height: 180px;
    transition: all 0.3s ease;
    cursor: pointer;
  }

  .card:hover:not(.inactive) {
    border-color: #007bff;
    box-shadow: 0 4px 12px rgba(0, 123, 255, 0.15);
    transform: translateY(-2px);
  }

  .card.inactive {
    opacity: 0.7;
    background: #f8f9fa;
  }

  .card-header {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    flex: 1;
  }

  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: auto;
    padding-top: 0.5rem;
    border-top: 1px solid #e9ecef;
  }
  
  .logo {
    width: 70px;
    height: 70px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid #e9ecef;
  }

  .logo-placeholder {
    width: 70px;
    height: 70px;
    border-radius: 50%;
    background: linear-gradient(135deg, #6c757d, #495057);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 3px solid #e9ecef;
  }

  .logo-placeholder span {
    color: white;
    font-size: 1.8rem;
    font-weight: bold;
  }
  
  .info {
    flex: 1;
  }

  .info h2 {
    margin: 0;
    font-size: 1.3rem;
    font-weight: 600;
    color: #2c3e50;
  }

  .real-name {
    font-size: 0.9rem;
    color: #666;
    margin: 0.2rem 0;
    font-style: italic;
  }
  
  .joined {
    font-size: 0.85rem;
    color: #666;
    margin: 0;
  }
  
  .philosophy {
    margin-top: 0.8rem;
    font-size: 0.9rem;
    color: #495057;
    font-style: italic;
    line-height: 1.4;
  }

  .moves, .favorite-team {
    margin-top: 0.5rem;
    font-size: 0.85rem;
    color: #333;
  }

  .moves-list {
    margin: 0.3rem 0 0 0;
    padding-left: 1.2rem;
  }

  .moves-list li {
    margin-bottom: 0.2rem;
    line-height: 1.3;
  }

  .card-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: auto;
  }

  .view-stats-btn {
    padding: 0.5rem 1rem;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 0.9rem;
    cursor: pointer;
    transition: background 0.2s ease;
  }

  .view-stats-btn:hover:not(:disabled) {
    background: #0056b3;
  }

  .view-stats-btn:disabled {
    background: #6c757d;
    cursor: not-allowed;
  }

  /* Overlay for "Got Scared" */
  .overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10;
  }

  .overlay span {
    color: #dc3545;
    font-size: 2rem;
    font-weight: 900;
    font-family: "Comic Sans MS", "Chalkboard SE", cursive, sans-serif;
    transform: rotate(-25deg);
    text-transform: uppercase;
    opacity: 0.9;
    border: 3px solid #dc3545;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.9);
    box-shadow: 0 4px 12px rgba(220, 53, 69, 0.4);
  }

  @media (max-width: 768px) {
    .summary-stats {
      gap: 2rem;
    }

    .stat-number {
      font-size: 2rem;
    }

    .grid {
      grid-template-columns: 1fr;
      padding: 0.5rem;
    }
  }
</style>