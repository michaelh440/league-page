<script>
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import StatsLayout from '$lib/components/StatsLayout.svelte';
  import StatCard from '$lib/components/StatCard.svelte';

  export let data;
  let selectElement;

  // Get manager_id from query string
  $: managerId = $page.url.searchParams.get("manager_id");
  
  // Use data from loader
  $: managers = data.managers;
  $: selectedManager = data.selectedManager;
  $: careerStats = data.careerStats;
  $: playoffStats = data.playoffStats;
  
  // Update select element when managerId changes
  $: if (selectElement && managerId) {
    selectElement.value = managerId;
  }

  // Navigation items for manager section
  const withMgr = (path) =>
    managerId ? `${path}?manager_id=${managerId}` : path;

  const navItems = [
    { label: "All Time Scoring", href: withMgr("/managers/all_time_stats") },
    { label: "Regular Season Scoring", href: withMgr("/managers/reg_season_stats") },
    { label: "Playoff Scoring", href: withMgr("/managers/playoff_stats") },
    //{ label: "Ranking", href: withMgr("/managers/ranking") },
    { label: "Rivalries", href: withMgr("/managers/rivalries") },
    { label: "Draft Room", href: withMgr("/managers/drafts") },
    { label: "Biography", href: withMgr("/managers/bio"), active: true }
  ];

  function handleSelect(e) {
    const id = e.target.value;
    if (id) {
      goto(`/managers/bio?manager_id=${id}`);
    }
  }

  // Helper function to format text with line breaks
  function formatText(text) {
    if (!text) return '';
    return text.replace(/\n/g, '<br>');
  }

  // Helper function to format score
  function formatScore(score) {
    return parseFloat(score || 0).toFixed(2);
  }
</script>

<svelte:head>
  <title>Manager Biographies - Houston Fantasy Football League</title>
</svelte:head>

<StatsLayout title="Manager Biographies" {navItems}>
  <div class="bio-container">
    <!-- Manager Selection Toolbar -->
    <div class="toolbar">
      <label for="manager-select">Manager:</label>
      <select id="manager-select" bind:this={selectElement} on:change={handleSelect} class="manager-select">
        <option value="">Choose a manager...</option>
        {#each managers as m}
          <option value={m.manager_id}>
            {m.username || m.real_name}
          </option>
        {/each}
      </select>
    </div>

    {#if !managerId}
      <div class="no-selection">
        <div class="selection-prompt">
          <h3>Select a Manager</h3>
          <p>Choose a manager from the dropdown above to view their biography, philosophy, and league personality.</p>
        </div>
      </div>
    {:else if selectedManager}
      
      <!-- Header Section -->
      <section class="header-section">
        <div class="manager-header">
          <div class="left-section">
            <div class="manager-avatar">
              <img 
                src={selectedManager.logo_url || '/default-avatar.png'} 
                alt={selectedManager.username || selectedManager.real_name} 
                class="manager-logo" 
              />
              {#if selectedManager.championships > 0}
                <div class="championship-badge">
                  <span class="trophy">🏆</span>
                  <span class="count">{selectedManager.championships}</span>
                </div>
              {/if}
            </div> <!--"manager-avatar"-->
            <div class="joined-year">
              <h1 class="manager-name">{selectedManager.username || selectedManager.real_name}</h1>
              <span class="joined-label">JOINED</span>
              <span class="joined-value">{selectedManager.year_joined || 'Unknown'}</span>
            </div>
                        
          </div> <!--"left-section"-->
          
          <div class="right-section">
            {#if selectedManager.philosophy}
              <div class="philosophy-quote">
                "{selectedManager.philosophy}"
              </div>
            {/if}
            
            <div class="info-grid">
              {#if selectedManager.signature_moves}
                <StatCard size="lg">
                  <div class="info-card">
                    <h3>Signature Moves</h3>
                    <div class="info-content">
                      {@html formatText(selectedManager.signature_moves)}
                    </div>
                  </div>
                </StatCard>
              {/if}
            </div><!--"info-grid"-->
          </div><!--"right-section"-->
        </div><!--"manager-header"-->
      </section>

      <!-- Manager Info Section -->
      <section class="manager-info-section">
        <h2 class="section-title">Manager Info</h2>
        
        <div class="info-grid">
        
          <div class="strengths-weaknesses">
            {#if selectedManager.strengths}
              <StatCard size="lg">
                <div class="info-card strengths-card">
                  <h3>Strengths</h3>
                  <div class="info-content">
                    {@html formatText(selectedManager.strengths)}
                  </div>
                </div>
              </StatCard>
            {/if}

            {#if selectedManager.weaknesses}
              <StatCard size="lg">
                <div class="info-card weaknesses-card">
                  <h3>Weaknesses</h3>
                  <div class="info-content">
                    {@html formatText(selectedManager.weaknesses)}
                  </div>
                </div>
              </StatCard>
            {/if}
          </div>

          {#if selectedManager.biography}
            <StatCard size="xl">
              <div class="info-card biography-card">
                <h3>Biography</h3>
                <div class="info-content">
                  {@html formatText(selectedManager.biography)}
                </div>
              </div>
            </StatCard>
          {/if}
        </div>

        {#if !selectedManager.biography && !selectedManager.philosophy && !selectedManager.signature_moves && !selectedManager.strengths && !selectedManager.weaknesses}
          <StatCard size="lg">
            <div class="empty-info">
              <h3>Bio Coming Soon</h3>
              <p>This manager hasn't filled out their biography yet. Check back later for their entertaining takes on fantasy football!</p>
            </div>
          </StatCard>
        {/if}
      </section>

      <!-- Career Stats Section -->
      {#if careerStats}
      <section class="career-stats-section">
        <h2 class="section-title">Career Stats</h2>
        
        <div class="stats-overview">
          <div class="stat-box">
            <span class="stat-label">Record</span>
            <span class="stat-value">{careerStats.record}</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">Winning %</span>
            <span class="stat-value">{careerStats.winPct}</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">Ave Score</span>
            <span class="stat-value">{careerStats.avgScore}</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">Ave Pts Ag</span>
            <span class="stat-value">{careerStats.avgPtsAg}</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">High Score</span>
            <span class="stat-value">{formatScore(careerStats.highScore)}</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">Low Score</span>
            <span class="stat-value">{formatScore(careerStats.lowScore)}</span>
          </div>
        </div>

        <StatCard size="xl">
          <div class="season-history">
            <h3>Season History</h3>
            <div class="history-table-container">
              <table class="history-table">
                <thead>
                  <tr>
                    <th>Year</th>
                    <th>W</th>
                    <th>L</th>
                    <th>Playoffs</th>
                    <th>Ave Pts</th>
                    <th>Pts Ag</th>
                    <th>Finish</th>
                  </tr>
                </thead>
                <tbody>
                  {#each careerStats.seasonHistory as season}
                    <tr>
                      <td>{season.year}</td>
                      <td>{season.wins || 0}</td>
                      <td>{season.losses || 0}</td>
                      <td>
                        {#if season.made_playoffs}
                          <span class="playoffs-yes">✓</span>
                        {:else}
                          <span class="playoffs-no">✗</span>
                        {/if}
                      </td>
                      <td>{season.avg_points || '0.0'}</td>
                      <td>{season.avg_points_against || '0.0'}</td>
                      <td>
                        {#if season.finish}
                          <span class="finish-badge rank-{season.finish}">{season.finish}</span>
                        {:else}
                          <span class="finish-badge tbd">TBD</span>
                        {/if}
                      </td>
                    </tr>
                  {:else}
                    <tr>
                      <td colspan="7" class="no-data">No season history available</td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>
        </StatCard>
      </section>
      {/if}

      <!-- Playoff Stats Section -->
      {#if playoffStats}
      <section class="playoff-stats-section">
        <h2 class="section-title">Playoff Stats</h2>
        
        <div class="stats-overview">
          <div class="stat-box">
            <span class="stat-label">Record</span>
            <span class="stat-value">{playoffStats.record}</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">Winning %</span>
            <span class="stat-value">{playoffStats.winPct}</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">Ave Score</span>
            <span class="stat-value">{playoffStats.avgScore}</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">Ave Pts Ag</span>
            <span class="stat-value">{playoffStats.avgPtsAg}</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">High Score</span>
            <span class="stat-value">{formatScore(playoffStats.highScore)}</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">Low Score</span>
            <span class="stat-value">{formatScore(playoffStats.lowScore)}</span>
          </div>
        </div>

        <div class="playoff-content">
          <StatCard size="lg">
            <div class="playoff-history">
              <h3>Playoff History</h3>
              <div class="history-table-container">
                <table class="history-table">
                  <thead>
                    <tr>
                      <th>Year</th>
                      <th>W</th>
                      <th>L</th>
                      <th>Ave Pts</th>
                      <th>Pts Ag</th>
                      <th>Finish</th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each playoffStats.playoffHistory as playoff}
                      <tr>
                        <td>{playoff.year}</td>
                        <td>{playoff.wins || 0}</td>
                        <td>{playoff.losses || 0}</td>
                        <td>{playoff.avg_points || '0.0'}</td>
                        <td>{playoff.avg_points_against || '0.0'}</td>
                        <td>
                          {#if playoff.finish && playoff.finish !== 99}
                            <span class="finish-badge rank-{playoff.finish}">{playoff.finish}</span>
                          {:else}
                            <span class="finish-badge tbd">TBD</span>
                          {/if}
                        </td>
                      </tr>
                    {:else}
                      <tr>
                        <td colspan="6" class="no-data">No playoff history available</td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            </div>
          </StatCard>

          <StatCard size="md">
            <div class="trophies">
              <h3>Trophies</h3>
              <div class="trophy-grid">
                <div class="trophy-item">
                  <div class="trophy-count gold">{playoffStats.championships}</div>
                  <div class="trophy-label">1st</div>
                </div>
                <div class="trophy-item">
                  <div class="trophy-count silver">{playoffStats.runnerUps}</div>
                  <div class="trophy-label">2nd</div>
                </div>
                <div class="trophy-item">
                  <div class="trophy-count bronze">{playoffStats.thirdPlace}</div>
                  <div class="trophy-label">3rd</div>
                </div>
              </div>
            </div>
          </StatCard>
        </div>
      </section>
      {/if}

    {/if}
  </div>
</StatsLayout>

<style>
  .bio-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
  }

  .toolbar { 
    display: flex; 
    align-items: center; 
    justify-content: center;
    gap: 0.75rem; 
    margin-bottom: 2rem; 
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

  /* Section Styles */
  section {
    margin-bottom: 3rem;
  }

  .section-title {
    font-size: 2rem;
    font-weight: bold;
    color: #1f2937;
    margin-bottom: 1.5rem;
    padding-bottom: 0.5rem;
    border-bottom: 3px solid #e5e7eb;
    text-align: center;
  }

  /* Standardize all subsection headers */
  .season-history h3,
  .playoff-history h3,
  .trophies h3,
  .info-card h3 {
    font-size: 1.3rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 1rem 0;
    border-bottom: 2px solid #e5e7eb;
    padding-bottom: 0.5rem;
    text-align: center;
  }

  /* Header Section */
  .header-section {
    background: linear-gradient(135deg, #f8fafc, #e2e8f0);
    border-radius: 16px;
    padding: 2.5rem;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }

  .manager-header {
    display: flex;
    align-items: flex-start;
    gap: 3rem;
  }

  .left-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .joined-year {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 1rem;
  }

  .joined-label {
    font-size: 0.75rem;
    color: #6b7280;
    text-transform: uppercase;
    font-weight: 600;
    letter-spacing: 0.5px;
    margin-bottom: 0.25rem;
  }

  .joined-value {
    font-size: 1rem;
    color: #1f2937;
    font-weight: 600;
  }

  .manager-avatar {
    position: relative;
    margin-bottom: 1rem;
  }

  .manager-logo {
    width: 140px;
    height: 140px;
    border-radius: 50%;
    border: 4px solid #fbbf24;
    object-fit: cover;
    background: #f3f4f6;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .championship-badge {
    position: absolute;
    top: -8px;
    right: -8px;
    background: #fbbf24;
    border: 2px solid white;
    border-radius: 50%;
    width: 45px;
    height: 45px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }

  .championship-badge .trophy {
    font-size: 16px;
    line-height: 1;
  }

  .championship-badge .count {
    font-size: 12px;
    font-weight: bold;
    color: #92400e;
    line-height: 1;
  }

  .manager-name {
    margin: 0;
    color: #1f2937;
    font-size: 2.2rem;
    font-weight: bold;
  }

  .right-section {
    flex: 1;
    padding-top: 1rem;
  }

  .philosophy-quote {
    font-style: italic;
    color: #4b5563;
    font-size: 1.1rem;
    line-height: 1.6;
    margin-bottom: 2rem;
    padding: 1rem 0;
    border-bottom: 1px solid #d1d5db;
  }

  .header-stats {
    display: flex;
    gap: 2rem;
    flex-wrap: wrap;
  }

  .header-stat {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .stat-label {
    font-size: 0.85rem;
    color: #6b7280;
    text-transform: uppercase;
    font-weight: 600;
    letter-spacing: 0.5px;
  }

  .stat-value {
    font-size: 1.1rem;
    color: #1f2937;
    font-weight: 600;
  }

  /* Manager Info Section */
  .info-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .info-card {
    padding: 1.5rem;
  }

  .info-card h3 {
    color: #1f2937;
    margin: 0 0 1rem 0;
    font-size: 1.3rem;
    font-weight: 700;
    border-bottom: 2px solid #e5e7eb;
    padding-bottom: 0.5rem;
  }

  .info-content {
    color: #374151;
    line-height: 1.7;
    font-size: 1rem;
  }

  .strengths-weaknesses {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
  }

  .strengths-card {
    background: linear-gradient(135deg, #f0fdf4, #dcfce7);
    border-left: 4px solid #16a34a;
  }

  .weaknesses-card {
    background: linear-gradient(135deg, #fef2f2, #fee2e2);
    border-left: 4px solid #dc2626;
  }

  .biography-card {
    grid-column: 1 / -1;
  }

  .empty-info {
    text-align: center;
    padding: 3rem;
    color: #6b7280;
  }

  /* Stats Overview */
  .stats-overview {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .stat-box {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 1.5rem;
    text-align: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s ease;
  }

  .stat-box:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .stat-box .stat-label {
    display: block;
    font-size: 0.8rem;
    color: #6b7280;
    text-transform: uppercase;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }

  .stat-box .stat-value {
    font-size: 1.5rem;
    color: #1f2937;
    font-weight: bold;
  }

  /* Tables */
  .history-table-container {
    overflow-x: auto;
  }

  .history-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
  }

  .history-table th,
  .history-table td {
    border: 1px solid #e5e7eb;
    padding: 0.75rem 0.5rem;
    text-align: center;
  }

  .history-table th {
    background: #f9fafb;
    font-weight: 600;
    color: #374151;
  }

  .playoffs-yes {
    color: #16a34a;
    font-weight: bold;
  }

  .playoffs-no {
    color: #dc2626;
    font-weight: bold;
  }

  .finish-badge {
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
    font-weight: bold;
    color: white;
  }

  .finish-badge.rank-1 { background: #fbbf24; }
  .finish-badge.rank-2 { background: #9ca3af; }
  .finish-badge.rank-3 { background: #a16207; }
  .finish-badge:not(.rank-1):not(.rank-2):not(.rank-3) { 
    background: #6b7280; 
  }

  .finish-badge.tbd {
    background: #6c757d;
    color: white;
  }

  .no-data {
    color: #6b7280;
    font-style: italic;
  }

  /* Playoff Content */
  .playoff-content {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 1.5rem;
  }

  .trophy-grid {
    display: flex;
    justify-content: space-around;
    gap: 1rem;
  }

  .trophy-item {
    text-align: center;
  }

  .trophy-count {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    font-weight: bold;
    color: white;
    margin-bottom: 0.5rem;
    margin: 0 auto 0.5rem;
  }

  .trophy-count.gold { background: #fbbf24; }
  .trophy-count.silver { background: #9ca3af; }
  .trophy-count.bronze { background: #a16207; }

  .trophy-label {
    font-size: 0.9rem;
    color: #6b7280;
    font-weight: 600;
  }

  .no-selection {
    text-align: center;
    padding: 4rem 2rem;
    background: #f8f9fa;
    border-radius: 12px;
    border: 1px solid #e9ecef;
  }

  .selection-prompt h3 {
    color: #6b7280;
    margin-bottom: 1rem;
    font-size: 1.8rem;
  }

  .selection-prompt p {
    color: #9ca3af;
    font-size: 1.1rem;
    margin: 0;
  }

  /* Mobile Responsive */
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

    .section-title {
      color: white !important;
      font-size: 1.5rem;
    }

    .manager-header {
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 2rem;
    }

    .left-section {
      order: 1;
    }

    .right-section {
      order: 2;
      padding-top: 0;
      text-align: center;
    }

    .manager-logo {
      width: 100px;
      height: 100px;
    }

    .manager-name {
      font-size: 2rem;
    }

    .philosophy-quote {
      font-size: 1rem;
      margin-bottom: 1.5rem;
    }

    .header-stats {
      justify-content: center;
      gap: 1rem;
    }

    .strengths-weaknesses {
      grid-template-columns: 1fr;
    }

    .stats-overview {
      grid-template-columns: repeat(2, 1fr);
    }

    .playoff-content {
      grid-template-columns: 1fr;
    }

    .history-table {
      font-size: 0.8rem;
    }

    .history-table th,
    .history-table td {
      padding: 0.5rem 0.3rem;
    }

    .stat-box {
      padding: 1rem;
    }

    .stat-box .stat-value {
      font-size: 1.2rem;
    }

    .trophy-count {
      width: 40px;
      height: 40px;
      font-size: 1.2rem;
    }
  }
</style>