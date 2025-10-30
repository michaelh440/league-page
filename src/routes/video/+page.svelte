<script>
  import LinearProgress from '@smui/linear-progress';

  export let data;
  const { videos } = data;
  
  // Function to get video embed URL based on platform - FIXED VERSION
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
  .video-blog-container {
    max-width: 1200px;
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

  .video-list {
    display: flex;
    flex-direction: column;
    gap: 3rem;
  }

  .video-item {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    transition: transform 0.2s, box-shadow 0.2s;
    border: 1px solid #ddd;
  }

  .video-item:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 16px rgba(0, 49, 107, 0.2);
  }

  .video-wrapper {
    position: relative;
    padding-bottom: 56.25%; /* 16:9 aspect ratio */
    height: 0;
    overflow: hidden;
  }

  .video-wrapper iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  .video-info {
    padding: 1.5rem;
  }

  .video-info h2 {
    font-size: 1.75rem;
    margin-bottom: 0.5rem;
    color: #00316b;
  }

  .video-date {
    font-size: 0.9rem;
    color: #888;
    margin-bottom: 1rem;
  }

  .video-description {
    font-size: 1rem;
    line-height: 1.6;
    color: #444;
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
    }

    .video-info {
      padding: 1rem;
    }

    .video-info h2 {
      font-size: 1.4rem;
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
  
  {#if videos && videos.length > 0}
    <div class="video-list">
      {#each videos as video}
        <article class="video-item">
          <div class="video-wrapper">
            <iframe
              src={getEmbedUrl(video.url)}
              title={video.title}
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
            ></iframe>
          </div>
          <div class="video-info">
            <h2>{video.title}</h2>
            <p class="video-date">
              {new Date(video.date).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
            {#if video.description}
              <p class="video-description">{video.description}</p>
            {/if}
          </div>
        </article>
      {/each}
    </div>
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