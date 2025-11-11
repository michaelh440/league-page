<script>
  import LinearProgress from '@smui/linear-progress';

  export let data;
  const { videos } = data;
  
  // State for currently playing video
  let currentVideo = videos && videos.length > 0 ? videos[0] : null;
  
  // Function to get video embed URL based on platform - FIXED VERSION
  function getEmbedUrl(url, autoplay = false) {
    if (!url) return '';
    
    const autoplayParam = autoplay ? '&autoplay=1' : '';
    
    // YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      let videoId = '';
      
      if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1]?.split('?')[0]?.split('/')[0];
      } else if (url.includes('youtube.com')) {
        try {
          const urlObj = new URL(url);
          videoId = urlObj.searchParams.get('v');
        } catch (e) {
          const match = url.match(/[?&]v=([^&]+)/);
          videoId = match ? match[1] : '';
        }
      }
      
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?rel=0${autoplayParam}`;
      }
    }
    
    // Vimeo
    if (url.includes('vimeo.com')) {
      const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
      return `https://player.vimeo.com/video/${videoId}?${autoplayParam}`;
    }
    
    return url;
  }
  
  // Function to get thumbnail URL
  function getThumbnailUrl(video) {
    // Use database thumbnail if available
    if (video.thumbnail_url) {
      return video.thumbnail_url;
    }
    
    const url = video.url;
    if (!url) return '/video-placeholder.png';
    
    // YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      let videoId = '';
      if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1]?.split('?')[0]?.split('/')[0];
      } else if (url.includes('youtube.com')) {
        try {
          const urlObj = new URL(url);
          videoId = urlObj.searchParams.get('v');
        } catch (e) {
          const match = url.match(/[?&]v=([^&]+)/);
          videoId = match ? match[1] : '';
        }
      }
      
      if (videoId) {
        return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      }
    }
    
    // Vimeo - would need API call for thumbnail, using placeholder
    if (url.includes('vimeo.com')) {
      return '/video-placeholder.png';
    }
    
    return '/video-placeholder.png';
  }
  
  // Function to switch video
  function playVideo(video) {
    currentVideo = video;
    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
</script>

<style>
  .video-blog-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 2rem;
  }

  h1 {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
    color: #00316b;
    text-align: center;
  }

  .subtitle {
    font-size: 1.2rem;
    color: #666;
    margin-bottom: 3rem;
    text-align: center;
  }

  /* Main Video Player Section */
  .main-player-section {
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    margin-bottom: 3rem;
    border: 2px solid #00316b;
  }

  .main-video-wrapper {
    position: relative;
    padding-bottom: 56.25%; /* 16:9 aspect ratio */
    height: 0;
    overflow: hidden;
    background: #000;
  }

  .main-video-wrapper iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  .main-video-info {
    padding: 2rem;
  }

  .main-video-info h2 {
    font-size: 2rem;
    margin-bottom: 0.75rem;
    color: #00316b;
  }

  .main-video-date {
    font-size: 1rem;
    color: #888;
    margin-bottom: 1.25rem;
  }

  .main-video-description {
    font-size: 1.1rem;
    line-height: 1.7;
    color: #444;
  }

  /* Older Videos Grid */
  .older-videos-section {
    margin-top: 3rem;
  }

  .section-title {
    font-size: 1.8rem;
    margin-bottom: 1.5rem;
    color: #00316b;
    text-align: left;
    padding-left: 0.5rem;
  }

  .video-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;
  }

  .video-card {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
    border: 1px solid #ddd;
  }

  .video-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 16px rgba(0, 49, 107, 0.2);
    border-color: #00316b;
  }

  .video-card.active {
    border: 2px solid #00316b;
    box-shadow: 0 4px 16px rgba(0, 49, 107, 0.3);
  }

  .thumbnail-wrapper {
    position: relative;
    padding-bottom: 56.25%;
    height: 0;
    overflow: hidden;
    background: #f0f0f0;
  }

  .thumbnail-wrapper img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .play-overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 60px;
    height: 60px;
    background: rgba(0, 49, 107, 0.9);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .video-card:hover .play-overlay {
    background: #00316b;
    transform: translate(-50%, -50%) scale(1.1);
  }

  .play-icon {
    width: 0;
    height: 0;
    border-left: 20px solid white;
    border-top: 12px solid transparent;
    border-bottom: 12px solid transparent;
    margin-left: 5px;
  }

  .video-card-info {
    padding: 1rem;
  }

  .video-card-title {
    font-size: 1.1rem;
    font-weight: bold;
    color: #00316b;
    margin-bottom: 0.5rem;
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .video-card-date {
    font-size: 0.85rem;
    color: #888;
  }

  .no-videos {
    text-align: center;
    padding: 4rem 2rem;
    color: #666;
    font-size: 1.1rem;
  }

  .loading {
    text-align: center;
    padding: 4rem 2rem;
  }

  @media (max-width: 768px) {
    .video-blog-container {
      padding: 1rem;
    }

    h1 {
      font-size: 2rem;
    }

    .subtitle {
      font-size: 1rem;
      margin-bottom: 2rem;
    }

    .main-video-info {
      padding: 1.25rem;
    }

    .main-video-info h2 {
      font-size: 1.5rem;
    }

    .main-video-description {
      font-size: 1rem;
    }

    .video-grid {
      grid-template-columns: 1fr;
    }

    .section-title {
      font-size: 1.5rem;
    }
  }
</style>

<svelte:head>
  <title>Video Blog - Fantasy League</title>
  <meta name="description" content="Weekly video summaries and highlights" />
</svelte:head>

<div class="video-blog-container">
  <h1>Weekly Video Blog</h1>
  <p class="subtitle">Catch up on all the action with our weekly video summaries</p>
  
  {#if videos && videos.length > 0 && currentVideo}
    <!-- Main Video Player -->
    <section class="main-player-section">
      <div class="main-video-wrapper">
        <iframe
          src={getEmbedUrl(currentVideo.url, true)}
          title={currentVideo.title}
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
      </div>
      <div class="main-video-info">
        <h2>{currentVideo.title}</h2>
        <p class="main-video-date">
          {new Date(currentVideo.date).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
        {#if currentVideo.description}
          <p class="main-video-description">{currentVideo.description}</p>
        {/if}
      </div>
    </section>

    <!-- Older Videos Grid -->
    {#if videos.length > 1}
      <section class="older-videos-section">
        <h3 class="section-title">Previous Videos</h3>
        <div class="video-grid">
          {#each videos as video}
            {#if video.id !== currentVideo.id}
              <div 
                class="video-card {video.id === currentVideo.id ? 'active' : ''}"
                on:click={() => playVideo(video)}
                on:keydown={(e) => e.key === 'Enter' && playVideo(video)}
                role="button"
                tabindex="0"
              >
                <div class="thumbnail-wrapper">
                  <img 
                    src={getThumbnailUrl(video)} 
                    alt={video.title}
                    loading="lazy"
                  />
                  <div class="play-overlay">
                    <div class="play-icon"></div>
                  </div>
                </div>
                <div class="video-card-info">
                  <h4 class="video-card-title">{video.title}</h4>
                  <p class="video-card-date">
                    {new Date(video.date).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
            {/if}
          {/each}
        </div>
      </section>
    {/if}
    
  {:else if videos && videos.length === 0}
    <div class="no-videos">
      <p>No videos available yet. Check back soon for weekly recaps!</p>
    </div>
  {:else}
    <div class="loading">
      <p>Loading videos...</p>
      <LinearProgress indeterminate />
    </div>
  {/if}
</div>