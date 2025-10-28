<!-- src/routes/admin/+page.svelte -->
<script>
  const adminTools = [
    {
      title: 'Fix Data Issues',
      description: 'Review and confirm Yahoo points staging data',
      link: '/admin/confirm_yahoo_points_staging',
      icon: '🔧',
      color: 'linear-gradient(135deg, #dc2626, #991b1b)'
    },
    {
      title: 'Generate Summaries',
      description: 'Create AI-powered weekly recaps and videos',
      link: '/admin/weekly_summary',
      icon: '📊',
      color: 'linear-gradient(135deg, #2563eb, #1d4ed8)'
    }
  ];
</script>

<h2 class="page-title">⚙️ Admin Dashboard</h2>

<p class="subtitle">Manage league data and content</p>

<div class="admin-grid">
  {#each adminTools as tool}
    <a class="admin-card" href={tool.link} style="background: {tool.color}">
      <div class="card-icon">{tool.icon}</div>
      <div class="card-header">{tool.title}</div>
      <div class="card-body">
        <p>{tool.description}</p>
      </div>
      <div class="card-footer">
        <span class="arrow">→</span>
      </div>
    </a>
  {/each}
</div>

<style>
  .page-title {
    text-align: center;
    margin: 2rem 0 0.5rem;
    font-size: 2rem;
    font-weight: bold;
    color: #004085;
  }

  .subtitle {
    text-align: center;
    margin: 0 0 2rem;
    font-size: 1.1rem;
    color: #666;
  }

  .admin-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 2rem;
    padding: 0 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .admin-card {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    text-decoration: none;
    border-radius: 12px;
    overflow: hidden;
    color: white;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    min-height: 220px;
    position: relative;
  }

  .admin-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 6px 16px rgba(0,0,0,0.2);
  }

  .card-icon {
    text-align: center;
    padding: 1.5rem 1rem 0.5rem;
    font-size: 3rem;
  }

  .card-header {
    text-align: center;
    padding: 0 1rem 0.5rem;
    font-size: 1.5rem;
    font-weight: bold;
    letter-spacing: 0.5px;
  }

  .card-body {
    text-align: center;
    padding: 0 1.5rem 1rem;
    font-size: 1rem;
    flex-grow: 1;
  }

  .card-body p {
    margin: 0;
    color: #e0e0e0;
    line-height: 1.4;
  }

  .card-footer {
    text-align: center;
    padding: 1rem;
    background: rgba(0,0,0,0.15);
    font-size: 1.5rem;
    font-weight: bold;
  }

  .arrow {
    display: inline-block;
    transition: transform 0.2s ease;
  }

  .admin-card:hover .arrow {
    transform: translateX(4px);
  }

  /* Mobile styles */
  @media screen and (max-width: 768px) {
    .page-title {
      color: white !important;
      font-size: 1.75rem;
    }

    .subtitle {
      color: #e0e0e0 !important;
    }

    .admin-grid {
      grid-template-columns: 1fr;
      padding: 0 1rem;
      gap: 1.5rem;
    }

    .card-icon {
      font-size: 2.5rem;
    }

    .card-header {
      font-size: 1.3rem;
    }
  }

  /* Very small screens */
  @media screen and (max-width: 480px) {
    .page-title {
      color: white !important;
      font-size: 1.5rem;
    }

    .subtitle {
      color: #e0e0e0 !important;
      font-size: 1rem;
    }
  }
</style>