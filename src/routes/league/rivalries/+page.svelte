<script>
  import StatsLayout from '$lib/components/StatsLayout.svelte';
  
  export let data;
  const { teams, rivalries } = data;

  const navItems = [
    { label: "All Time Scoring", href: "/league/all_time_stats" },
    { label: "Regular Season Scoring", href: "/league/reg_season_stats" },
    { label: "Playoff Scoring", href: "/league/playoff_stats" },
    { label: "Streaks", href: "/league/streaks" },
    //{ label: "Potential Points", href: "/league/potential_points" },
    { label: "Ranking", href: "/league/ranking" },
    { label: "Rivalries", href: "/league/rivalries", active: true },
    //{ label: "Trophy Room", href: "/league/trophy_room" },
    { label: "Draft Room", href: "/drafts/previous_seasons" }
  ];

  function getRivalry(team1, team2) {
    return rivalries.find(
      r =>
        (r.team1_id === team1.team_id && r.team2_id === team2.team_id) ||
        (r.team1_id === team2.team_id && r.team2_id === team1.team_id)
    );
  }
</script>

<StatsLayout title="Rivalries" {navItems}>
  <div class="rivalries-container">
    
    <div class="rivalries-section">
      <div class="section-header">
        <h2>All-Time Rivalries Grid</h2>
        <p>Head-to-head matchup records between all managers</p>
      </div>
      
      <div class="grid-wrapper">
        <table class="rivalry-grid">
          <thead>
            <tr>
              <th class="corner-cell"></th>
              {#each teams as team}
                <th class="team-header">
                  {#if team.logo_url}
                    <img src={team.logo_url} alt={team.team_name} class="team-logo" />
                  {/if}
                  <div class="team-name">{team.team_name}</div>
                </th>
              {/each}
            </tr>
          </thead>
          <tbody>
            {#each teams as rowTeam}
              <tr>
                <th class="team-header row-header">
                  {#if rowTeam.logo_url}
                    <img src={rowTeam.logo_url} alt={rowTeam.team_name} class="team-logo" />
                  {/if}
                  <div class="team-name">{rowTeam.team_name}</div>
                </th>

                {#each teams as colTeam}
                  {#if rowTeam.team_id === colTeam.team_id}
                    <td class="self-cell">
                      <div class="self-indicator">—</div>
                    </td>
                  {:else}
                    {@const rivalry = getRivalry(rowTeam, colTeam)}
                    {#if rivalry}
                      <td class="vs-cell">
                        <a href={`/league/rivalries/${rowTeam.team_id}-${colTeam.team_id}`} class="vs-link">
                          <div class="record-display">
                            {rivalry.team1_id === rowTeam.team_id ? 
                              `${rivalry.team1_wins || 0}-${rivalry.team2_wins || 0}` : 
                              `${rivalry.team2_wins || 0}-${rivalry.team1_wins || 0}`}
                          </div>
                        </a>
                      </td>
                    {:else}
                      <td class="empty-cell">
                        <div class="no-matchup">0-0</div>
                      </td>
                    {/if}
                  {/if}
                {/each}
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>

  </div>
</StatsLayout>

<style>
  .rivalries-container {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    padding: 0.5rem;
  }

  .rivalries-section {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    width: min(90vw, 1200px);
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

  .grid-wrapper {
    overflow-x: auto;
    padding: 1rem;
  }

  .rivalry-grid {
    border-collapse: collapse;
    margin: 0 auto;
    width: 100%;
    font-size: 0.85rem;
  }

  .rivalry-grid th,
  .rivalry-grid td {
    border: 1px solid #dee2e6;
    text-align: center;
    min-width: 80px;
    max-width: 120px;
  }

  .corner-cell {
    background: #f8f9fa;
    width: 120px;
  }

  .team-header {
    background: #f8f9fa;
    color: #495057;
    font-weight: 600;
    padding: 0.75rem 0.5rem;
  }

  .row-header {
    background: #f0f2f5;
    width: 120px;
  }

  .team-logo {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    object-fit: cover;
    display: block;
    margin: 0 auto 0.25rem;
  }

  .team-name {
    font-size: 0.75rem;
    line-height: 1.1;
    word-break: break-word;
  }

  .vs-cell {
    padding: 0.5rem;
    background: #fff;
    transition: background-color 0.2s ease;
  }

  .vs-cell:hover {
    background: #f8f9fa;
  }

  .vs-link {
    display: block;
    text-decoration: none;
    padding: 0.25rem;
    border-radius: 4px;
    transition: all 0.2s ease;
  }

  .vs-link:hover {
    background: #007bff;
    color: white;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 123, 255, 0.2);
  }

  .record-display {
    font-weight: bold;
    font-size: 0.9rem;
    color: #007bff;
    padding: 0.25rem 0;
  }

  .vs-link:hover .record-display {
    color: white;
  }

  .self-cell {
    background: #e9ecef;
    padding: 0.75rem;
  }

  .self-indicator {
    color: #6c757d;
    font-weight: bold;
    font-size: 1.2rem;
  }

  .empty-cell {
    background: #fafbfc;
    padding: 0.75rem;
  }

  .no-matchup {
    color: #ced4da;
    font-weight: 300;
  }

  @media (max-width: 768px) {
    .rivalries-container {
      padding: 0;
    }

    .grid-wrapper {
      padding: 0.5rem;
    }

    .rivalry-grid {
      font-size: 0.75rem;
    }

    .rivalry-grid th,
    .rivalry-grid td {
      min-width: 60px;
      max-width: 80px;
    }

    .team-header {
      padding: 0.5rem 0.25rem;
    }

    .team-logo {
      width: 20px;
      height: 20px;
    }

    .team-name {
      font-size: 0.65rem;
    }

    .corner-cell,
    .row-header {
      width: 80px;
    }

    .vs-text {
      font-size: 0.7rem;
    }

    .record-preview {
      font-size: 0.6rem;
    }
  }
</style>