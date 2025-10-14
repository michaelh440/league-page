<script>
  // Update this list as new years get added
  const seasons = [
    2015, 2016, 2017, 2018, 2019,
    2020, 2021, 2022, 2023, 2024, //- Uncomment this when 2024 season is complete
  ];
</script>

<h2 class="page-title">Previous Seasons</h2>

<div class="seasons-grid">
  {#each seasons as year}
    <a class="season-card" href={`/seasons/${year}`}>
      <div class="card-header">{year}</div>
      <div class="card-body">
        <p>View Regular Season & Playoffs</p>
      </div>
    </a>
  {/each}
</div>

<p style="text-align: center; margin: 2rem 0 1.5rem; color: #666;">
  
</p>

<style>
  .page-title {
    text-align: center;
    margin: 2rem 0 1.5rem;
    font-size: 2rem;
    font-weight: bold;
    color: #004085;
  }

  .seasons-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 2rem;
    padding: 0 2rem;
  }

  .season-card {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    text-decoration: none;
    border-radius: 12px;
    overflow: hidden;
    background: linear-gradient(135deg, #007bff, #0056b3);
    color: white;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .season-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 6px 16px rgba(0,0,0,0.2);
  }

  .card-header {
    background: rgba(0,0,0,0.2);
    text-align: center;
    padding: 1rem;
    font-size: 1.6rem;
    font-weight: bold;
    letter-spacing: 1px;
  }

  .card-body {
    text-align: center;
    padding: 1rem;
    font-size: 1rem;
  }

  .card-body p {
    margin: 0;
    color: #e0e0e0;
  }
/* Mobile page title color fix */
@media screen and (max-width: 768px) {
  h2 {
    color: white !important;
  }
}

/* Very small screens */
@media screen and (max-width: 480px) {
  h2 {
    color: white !important;
  }
}

</style>
