<!-- src/lib/components/WallOfChampions.svelte -->
<script>
  import { goto } from '$app/navigation';
  
  export let champions = [];
  export let managersByCount = [];

  function handleManagerClick(managerId) {
    goto(`/manager/${managerId}`);
  }

  function handleChampionshipClick(champion) {
    goto(`/season/${champion.season_year}`);
  }
</script>

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

<style>
  /* Wall of Champions - Container with Blue Header */
  .wall-of-champions-container {
    background: #fff;
    border: 2px solid #2563eb;
    border-radius: 12px;
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
    min-width: 80px;
    max-width: 100px;
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
</style>