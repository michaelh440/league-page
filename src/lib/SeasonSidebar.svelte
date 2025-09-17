<script>
  export let seasons = [];       // array of season years, e.g. [2015, 2016, 2017]
  export let currentSeason = ""; // the active season, e.g. 2016
</script>

<aside class="sidebar">
  {#each seasons as year}
    <a
      href={`/seasons/${year}`}
      class="season-card {year === currentSeason ? 'active' : ''}"
    >
      {year}
    </a>
  {/each}
</aside>

<style>
  .sidebar {
    width: 20%;
    min-width: 180px;
    background: #f8f9fa;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    border-right: 1px solid #ccc;
  }

  .season-card {
    display: block;
    text-align: center;
    padding: 0.6rem 1rem;
    border-radius: 6px;
    text-decoration: none;
    font-weight: bold;
    background: #007bff;   /* blue by default */
    color: white;
    transition: background 0.2s ease, transform 0.1s ease;
  }

  .season-card:hover {
    background: #0056b3;
    transform: translateY(-2px);
  }

  .season-card.active {
    background: #c0c0c0;  /* silver for active */
    color: #333;
  }
</style>
