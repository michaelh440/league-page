<script>
  import LinearProgress from '@smui/linear-progress';

  import {
    leagueName,
    homepageText,
    enableBlog,
  } from '$lib/utils/helper';

  import { PowerRankings, HomePost, Standings } from '$lib/components';

  export let data;
  const { standingsData, leagueTeamManagersData, champions, managersByCount } = data;
  
</script>

<style>
  .page-container {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  /* Card style */
  .card {
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 1rem;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  }

  /* League description */
  .league-description {
    text-align: center;
    max-width: 800px;
    margin: 0 auto;
  }

  /* Wall of Champions spans full width */
  .champions-row {
    width: 100%;
  }

  /* Standings + Power Rankings row */
  .bottom-row {
    display: flex;
    flex-wrap: wrap;
    gap: 2rem;
  }
  .bottom-row > * {
    flex: 1 1 0;
    min-width: 300px;
  }

  /* Match Standings header to Power Rankings */
  .card :global(h2),
  .card :global(h3) {
    font-size: 1.2rem;
    margin-bottom: 0.8rem;
    text-align: center;
    font-weight: bold;
    color: #333;
  }

  /* Wall of Champions Styles */
  .wall-of-champions-container {
    background: #fff;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    margin: 0.5rem 0;
  }

  .wall-header {
    background: #fff;
    color: #1f2937;
    text-align: center;
    padding: 0.75rem;
  }

  .wall-header-title {
    font-size: 1.2rem;
    font-weight: bold;
    margin: 0;
  }

  .wall-content {
    padding: 1.25rem;
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
    min-width: 120px;
    max-width: 140px;
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

  /* Responsive tweaks */
  @media (max-width: 700px) {
    .page-container {
      padding: 1rem;
    }
    .bottom-row {
      flex-direction: column;
    }
  }
</style>

<div class="page-container">
  <!-- League Description -->
  <div class="card league-description">
    <h2>{leagueName}</h2>
    {@html homepageText }
    {#if enableBlog}
      <HomePost />
    {/if}
  </div>

  <!-- Wall of Champions (replaces both champion sections) -->
  <div class="champions-row">
    {#if champions && managersByCount}
      <div class="wall-of-champions-container">
        <div class="wall-header">
          <h3 class="wall-header-title">Wall Of Champions</h3>
        </div>
        <div class="wall-content">
          <div class="champions-grid">
            {#each managersByCount as manager}
              <div 
                class="champion-card"
                onclick={() => window.location.href = `/manager/${manager.manager_id}`}
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
                        window.location.href = `/season/${year}`;
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
    {:else}
      <div class="card">
        <p style="text-align: center;">Loading champions...</p>
        <p style="text-align: center; font-size: 0.8rem;">
          Champions: {champions ? 'exists' : 'missing'}, 
          ManagersByCount: {managersByCount ? 'exists' : 'missing'}
        </p>
        <LinearProgress indeterminate />
      </div>
    {/if}
  </div>

  <!-- Standings + Power Rankings -->
  <div class="bottom-row">
    <div class="card">
      <Standings {standingsData} {leagueTeamManagersData} />
    </div>
    <div class="card">
      <PowerRankings />
    </div>
  </div>
</div>