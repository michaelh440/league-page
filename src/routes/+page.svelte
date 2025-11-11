<script>
  import LinearProgress from '@smui/linear-progress';

  import {
    leagueName,
    homepageText,
    enableBlog,
  } from '$lib/utils/helper';

  import { PowerRankings, HomePost, Standings } from '$lib/components';

  export let data;
  const { standingsData, leagueTeamManagersData, champions, managersByCount, featuredVideo } = data;
  
  // Function to get video embed URL - FIXED VERSION
  function getEmbedUrl(url) {
    if (!url) return '';
    
    // YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      let videoId = '';
      
      if (url.includes('youtu.be/')) {
        // Short URL format: https://youtu.be/VIDEO_ID
        videoId = url.split('youtu.be/')[1]?.split('?')[0]?.split('/')[0];
      } else if (url.includes('youtube.com')) {
        // Long URL format: https://www.youtube.com/watch?v=VIDEO_ID
        try {
          const urlObj = new URL(url);
          videoId = urlObj.searchParams.get('v');
        } catch (e) {
          // Fallback if URL parsing fails
          const match = url.match(/[?&]v=([^&]+)/);
          videoId = match ? match[1] : '';
        }
      }
      
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?rel=0`;
      }
    }
    
    // Vimeo
    if (url.includes('vimeo.com')) {
      const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
      return `https://player.vimeo.com/video/${videoId}`;
    }
    
    // If it's already an embed URL or direct video URL, return as-is
    return url;
  }
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
    color: #1f2937;
  }

  /* League description */
  .league-description {
    text-align: center;
    max-width: 800px;
    margin: 0 auto;
  }

  .league-description p {
    color: #1f2937;
    line-height: 1.6;
    margin-bottom: 1rem;
  }

  .league-description h2 {
    color: #1f2937;
  }

  /* Featured Video Section - Replaces League History */
  .featured-video-section {
    background: linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border: 2px solid #00316b;
  }

  .video-header {
    background: #00316b;
    color: white;
    padding: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .video-header h3 {
    margin: 0;
    font-size: 1.3rem;
    font-weight: bold;
  }

  .view-all-link {
    color: white;
    text-decoration: none;
    font-size: 0.9rem;
    font-weight: 500;
    padding: 0.5rem 1rem;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    transition: background 0.2s;
  }

  .view-all-link:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  .video-content {
    padding: 1.5rem;
    background: white;
  }

  .video-player-wrapper {
    position: relative;
    padding-bottom: 56.25%; /* 16:9 aspect ratio */
    height: 0;
    overflow: hidden;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    margin-bottom: 1rem;
  }

  .video-player-wrapper iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: 8px;
  }

  .video-details {
    text-align: center;
  }

  .video-details h4 {
    font-size: 1.25rem;
    margin: 0.5rem 0;
    color: #1f2937;
  }

  .video-date {
    font-size: 0.9rem;
    color: #6b7280;
    margin-bottom: 0.75rem;
  }

  .video-description {
    font-size: 1rem;
    line-height: 1.6;
    color: #4b5563;
  }

  .no-video {
    text-align: center;
    padding: 3rem 1.5rem;
    color: #6b7280;
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
    .video-header {
      flex-direction: column;
      gap: 0.5rem;
    }
    .video-content {
      padding: 1rem;
    }
  }
</style>

<div class="page-container">
  <!-- League Description (Optional - uncomment if you want it) -->
  <!--
  <div class="card league-description">
    <h2>{leagueName}</h2>
    {@html homepageText }
    {#if enableBlog}
      <HomePost />
    {/if}
  </div>
  -->

  <!-- Featured Video Section (replaces old league history section) -->
  {#if featuredVideo}
    <div class="featured-video-section">
      <div class="video-header">
        <h3>📹 Latest Weekly Video</h3>
        <a href="/video" class="view-all-link">View All Videos →</a>
      </div>
      <div class="video-content">
        <div class="video-player-wrapper">
          <iframe
            src={getEmbedUrl(featuredVideo.url)}
            title={featuredVideo.title}
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          ></iframe>
        </div>
        <div class="video-details">
          <h4>{featuredVideo.title}</h4>
          <p class="video-date">
            {new Date(featuredVideo.date).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
          {#if featuredVideo.description}
            <p class="video-description">{featuredVideo.description}</p>
          {/if}
        </div>
      </div>
    </div>
  {/if}

  <!-- Wall of Champions -->
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
                on:click={() => window.location.href = `/managers/bio?manager_id=${manager.manager_id}`}
                on:keypress={(e) => e.key === 'Enter' && (window.location.href = `/managers/bio?manager_id=${manager.manager_id}`)}
                role="button"
                tabindex="0"
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
                      on:click={(e) => {
                        e.stopPropagation();
                        window.location.href = `/season/${year}`;
                      }}
                      on:keypress={(e) => {
                        if (e.key === 'Enter') {
                          e.stopPropagation();
                          window.location.href = `/season/${year}`;
                        }
                      }}
                      role="button"
                      tabindex="0"
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