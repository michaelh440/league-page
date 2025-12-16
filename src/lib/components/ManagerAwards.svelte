<script>
  export let managerId;
  export let awards = [];
  
  // Group awards by category
  $: groupedAwards = awards.reduce((acc, award) => {
    const category = award.award_category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(award);
    return acc;
  }, {});

  const categoryLabels = {
    weekly: 'Weekly Awards',
    seasonal: 'Season Awards',
    positional: 'Positional Awards',
    career: 'Career Awards',
    other: 'Other Awards'
  };

  function formatValue(award) {
    if (award.value === null || award.value === undefined) return '';
    
    // Format based on award type
    if (award.award_key?.includes('points') || award.award_key?.includes('score')) {
      return parseFloat(award.value).toFixed(2) + ' pts';
    }
    if (award.award_key?.includes('wins')) {
      return award.value + ' wins';
    }
    return award.value;
  }
</script>

{#if awards && awards.length > 0}
  <div class="manager-awards">
    <h3 class="awards-title">🏆 Awards & Achievements</h3>
    
    {#each Object.entries(groupedAwards) as [category, categoryAwards]}
      {#if categoryAwards.length > 0}
        <div class="awards-category">
          <h4 class="category-title">{categoryLabels[category] || category}</h4>
          <div class="awards-grid">
            {#each categoryAwards as award}
              <div class="award-badge" class:first-place={award.rank_position === 1}>
                <span class="award-emoji">{award.icon_emoji || '🏆'}</span>
                <div class="award-details">
                  <span class="award-name">{award.award_name}</span>
                  <span class="award-context">
                    {#if award.season_year}
                      {award.season_year}
                      {#if award.week}Week {award.week}{/if}
                    {/if}
                    {#if award.player_name}
                      <span class="player-name">({award.player_name})</span>
                    {/if}
                  </span>
                  {#if award.value}
                    <span class="award-value">{formatValue(award)}</span>
                  {/if}
                </div>
                {#if award.rank_position}
                  <span class="rank-badge" class:gold={award.rank_position === 1} class:silver={award.rank_position === 2} class:bronze={award.rank_position === 3}>
                    #{award.rank_position}
                  </span>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {/if}
    {/each}
  </div>
{:else}
  <div class="no-awards">
    <p>No awards yet. Keep competing!</p>
  </div>
{/if}

<style>
  .manager-awards {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  .awards-title {
    font-size: 1.25rem;
    color: #1a1a2e;
    margin: 0 0 1.5rem 0;
    padding-bottom: 0.75rem;
    border-bottom: 2px solid #003366;
  }

  .awards-category {
    margin-bottom: 1.5rem;
  }

  .awards-category:last-child {
    margin-bottom: 0;
  }

  .category-title {
    font-size: 0.9rem;
    color: #6c757d;
    margin: 0 0 0.75rem 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
  }

  .awards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 0.75rem;
  }

  .award-badge {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.75rem;
    background: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e9ecef;
    transition: all 0.2s ease;
    position: relative;
  }

  .award-badge:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transform: translateY(-1px);
  }

  .award-badge.first-place {
    background: linear-gradient(135deg, #fff9e6 0%, #fff3cd 100%);
    border-color: #ffc107;
  }

  .award-emoji {
    font-size: 1.5rem;
    line-height: 1;
    flex-shrink: 0;
  }

  .award-details {
    flex: 1;
    min-width: 0;
  }

  .award-name {
    display: block;
    font-weight: 600;
    color: #1a1a2e;
    font-size: 0.85rem;
    line-height: 1.3;
  }

  .award-context {
    display: block;
    font-size: 0.75rem;
    color: #6c757d;
    margin-top: 0.25rem;
  }

  .player-name {
    font-style: italic;
  }

  .award-value {
    display: inline-block;
    font-size: 0.75rem;
    font-weight: 600;
    color: #007bff;
    margin-top: 0.25rem;
    background: rgba(0, 123, 255, 0.1);
    padding: 0.125rem 0.5rem;
    border-radius: 12px;
  }

  .rank-badge {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    font-size: 0.7rem;
    font-weight: 700;
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
    background: #6c757d;
    color: white;
  }

  .rank-badge.gold {
    background: linear-gradient(135deg, #ffd700, #ffb300);
    color: #1a1a2e;
  }

  .rank-badge.silver {
    background: linear-gradient(135deg, #c0c0c0, #a8a8a8);
    color: #1a1a2e;
  }

  .rank-badge.bronze {
    background: linear-gradient(135deg, #cd7f32, #b87333);
    color: white;
  }

  .no-awards {
    text-align: center;
    padding: 2rem;
    color: #6c757d;
    background: #f8f9fa;
    border-radius: 8px;
  }

  /* Mobile Styles */
  @media (max-width: 768px) {
    .manager-awards {
      padding: 1rem;
    }

    .awards-title {
      font-size: 1.1rem;
      margin-bottom: 1rem;
    }

    .awards-grid {
      grid-template-columns: 1fr;
    }

    .award-badge {
      padding: 0.6rem;
    }

    .award-emoji {
      font-size: 1.25rem;
    }

    .award-name {
      font-size: 0.8rem;
    }
  }
</style>