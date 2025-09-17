<script>
  export let data;
  const { season, weeks } = data;

  const seasons = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023];
</script>

<div class="page-layout">
  <!-- Sidebar -->
  <aside class="sidebar">
    {#each seasons as yr}
      <a 
        href="/seasons/{yr}" 
        class="season-card {season === yr ? 'active' : ''}"
      >
        {yr}
      </a>
    {/each}
  </aside>

  <!-- Main Content -->
  <main class="content">
    <h3 style="text-align: center;">{season} Season</h3>

    <nav class="season-nav">
      <a href="/seasons/{season}" class="season-btn active">Regular Season</a>
      <a href="/seasons/{season}/playoffs" class="season-btn">Playoffs</a>
    </nav>

    <div class="season-container">
      {#each weeks as week}
        <h4>Week {week.week}</h4>
        <table class="matchups-table">
          <thead>
            <tr>
              <th>Team 1</th>
              <th>Score</th>
              <th>Team 2</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {#each week.games as game}
              <tr>
                <td class:win={game.score1 > game.score2}>
                  {#if game.team1_logo}
                    <img src={game.team1_logo} alt="{game.team1}" class="team-logo" />
                  {/if}
                  {game.team1}
                </td>
                <td class:win={game.score1 > game.score2}>{game.score1}</td>
                <td class:win={game.score2 > game.score1}>
                  {#if game.team2_logo}
                    <img src={game.team2_logo} alt="{game.team2}" class="team-logo" />
                  {/if}
                  {game.team2}
                </td>
                <td class:win={game.score2 > game.score1}>{game.score2}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/each}
    </div>
  </main>
</div>

<style>
  /* Layout */
  .page-layout {
    display: flex;
    gap: 2rem;
  }

  .sidebar {
    flex: 0 0 12%; /* left column */
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-left: 0.5rem;   /* ✅ adds space on the left */
    margin-top: 1rem;      /* ✅ pushes the whole list down slightly */
  }

  .season-card {
    display: block;
    padding: 0.8rem;
    text-align: center;
    font-weight: bold;
    text-decoration: none;
    color: white;
    background: linear-gradient(135deg, #007bff, #0056b3);
    border-radius: 6px;
    transition: background 0.2s ease, transform 0.1s ease;
  }

  /* Left column hover and active states */
  .season-card:hover { background: #0056b3; transform: translateY(-2px); }
  .season-card.active { background: silver; color: #222; }


  .content {
    flex: 1;
  }

  /* Top buttons */
  .season-nav {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin: 1rem 0 2rem 0;
  }

  .season-btn {
    display: inline-block;
    text-decoration: none;
    font-weight: bold;
    color: white;
    background: #007bff;
    padding: 0.6rem 1.2rem;
    border-radius: 6px;
    transition: background 0.2s ease, transform 0.1s ease;
  }

.season-btn:hover { background: #0056b3; transform: translateY(-2px); }
.season-btn.active { background: #004085; }

  /* Tables */
  .season-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
  }

  .matchups-table {
    border-collapse: collapse;
    margin: 0 auto;
    width: 80%;
    max-width: 800px;
    text-align: center;
  }

  .matchups-table th,
  .matchups-table td {
    border: 1px solid #ccc;
    padding: 0.5rem 1rem;
  }

  .matchups-table th {
    background-color: #004085;
    color: white;
  }

  .win {
    background-color: #d4edda;
    font-weight: bold;
  }

  .team-logo {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    object-fit: cover;
    margin-right: 6px;
    vertical-align: middle;
  }
</style>
