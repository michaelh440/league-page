<script>
  export let data;
  const { season, championship, consolation } = data;

  const seasons = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023]; // list of all seasons
</script>

<div class="page-layout">
  <!-- Sidebar -->
  <aside class="sidebar">
    {#each seasons as yr}
      <a
        href="/seasons/{yr}"
        class="season-card {yr === season ? 'active' : ''}"
      >
        {yr}
      </a>
    {/each}
  </aside>

  <!-- Main content -->
  <main class="main-content">
    <h3 style="text-align: center;">{season} Playoffs</h3>

    <!-- Navigation -->
    <nav class="season-nav">
      <a href="/seasons/{season}" class="season-btn">Regular Season</a>
      <a href="/seasons/{season}/playoffs" class="season-btn active">Playoffs</a>
    </nav>

    <!-- Championship Bracket -->
    <h3 class="bracket-title">Championship Bracket</h3>
    <div class="bracket-grid">
      <!-- Week 15 -->
      <div>
        <h4 class="week-title">Week 15</h4>
        {#each championship.week15 as game}
          <table class="matchups-table">
            <thead>
              <tr><th colspan="3">{game.label}</th></tr>
            </thead>
            <tbody>
              <tr>
                <td class:win={game.score1 > game.score2}>
                  {#if game.team1_logo}
                    <img src={game.team1_logo} alt="{game.team1}" class="team-logo" />
                  {/if}
                  {game.team1}
                </td>
                <td class:win={game.score1 > game.score2}>{game.score1}</td>
              </tr>
              <tr>
                <td class:win={game.score2 > game.score1}>
                  {#if game.team2_logo}
                    <img src={game.team2_logo} alt="{game.team2}" class="team-logo" />
                  {/if}
                  {game.team2}
                </td>
                <td class:win={game.score2 > game.score1}>{game.score2}</td>
              </tr>
              <tr>
                <td colspan="3" style="font-size: 0.8rem; color: #666; height: 10px; border: none;"></td>
              </tr>
            </tbody>
          </table>
        {/each}
      </div>

      <!-- Week 16 -->
      <div>
        <h4 class="week-title">Week 16</h4>
        {#each championship.week16 as game}
          <table class="matchups-table">
            <thead>
              <tr><th colspan="3">{game.label}</th></tr>
            </thead>
            <tbody>
              <tr>
                <td class:win={game.score1 > game.score2}>
                  {#if game.team1_logo}
                    <img src={game.team1_logo} alt="{game.team1}" class="team-logo" />
                  {/if}
                  {game.team1}
                </td>
                <td class:win={game.score1 > game.score2}>{game.score1}</td>
              </tr>
              <tr>
                <td class:win={game.score2 > game.score1}>
                  {#if game.team2_logo}
                    <img src={game.team2_logo} alt="{game.team2}" class="team-logo" />
                  {/if}
                  {game.team2}
                </td>
                <td class:win={game.score2 > game.score1}>{game.score2}</td>
              </tr>
              <tr>
                <td colspan="3" style="font-size: 0.8rem; color: #666; height: 10px; border: none;"></td>
              </tr>
            </tbody>
          </table>
        {/each}
      </div>
    </div>

    <!-- Consolation Bracket -->
    <h3 class="bracket-title">Consolation Bracket</h3>
    <div class="bracket-grid">
      <!-- Week 15 -->
      <div>
        <h4 class="week-title">Week 15</h4>
        {#each consolation.week15 as game}
          <table class="matchups-table">
            <thead>
              <tr><th colspan="3">{game.label}</th></tr>
            </thead>
            <tbody>
              <tr>
                <td class:win={game.score1 > game.score2}>
                  {#if game.team1_logo}
                    <img src={game.team1_logo} alt="{game.team1}" class="team-logo" />
                  {/if}
                  {game.team1}
                </td>
                <td class:win={game.score1 > game.score2}>{game.score1}</td>
              </tr>
              <tr>
                <td class:win={game.score2 > game.score1}>
                  {#if game.team2_logo}
                    <img src={game.team2_logo} alt="{game.team2}" class="team-logo" />
                  {/if}
                  {game.team2}
                </td>
                <td class:win={game.score2 > game.score1}>{game.score2}</td>
              </tr>
              <tr>
                <td colspan="3" style="font-size: 0.8rem; color: #666; height: 10px; border: none;"></td>
              </tr>
            </tbody>
          </table>
        {/each}
      </div>

      <!-- Week 16 -->
      <div>
        <h4 class="week-title">Week 16</h4>
        {#each consolation.week16 as game}
          <table class="matchups-table">
            <thead>
              <tr><th colspan="3">{game.label}</th></tr>
            </thead>
            <tbody>
              <tr>
                <td class:win={game.score1 > game.score2}>
                  {#if game.team1_logo}
                    <img src={game.team1_logo} alt="{game.team1}" class="team-logo" />
                  {/if}
                  {game.team1}
                </td>
                <td class:win={game.score1 > game.score2}>{game.score1}</td>
              </tr>
              <tr>
                <td class:win={game.score2 > game.score1}>
                  {#if game.team2_logo}
                    <img src={game.team2_logo} alt="{game.team2}" class="team-logo" />
                  {/if}
                  {game.team2}
                </td>
                <td class:win={game.score2 > game.score1}>{game.score2}</td>
              </tr>
              <tr>
                <td colspan="3" style="font-size: 0.8rem; color: #666; height: 10px; border: none;"></td>
              </tr>
            </tbody>
          </table>
        {/each}
      </div>
    </div>
  </main>
</div>

<style>
  .page-layout {
    display: flex;
    gap: 1.5rem;
  }

  .sidebar {
    flex: 0 0 12%;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-left: 0.5rem; /* spacing from left edge */
    margin-top: 1rem; /* spacing from top */
  }

  .season-card {
    display: block;
    padding: 0.8rem;
    text-align: center;
    font-weight: bold;
    text-decoration: none;
    color: white;
    /*background: #007bff;*/
    background: linear-gradient(135deg, #007bff, #0056b3);
    border-radius: 6px;
    transition: background 0.2s ease, transform 0.1s ease;
  }

  .season-card:hover { background: #0056b3; transform: translateY(-2px); }
  .season-card.active { background: silver; color: #222; }

  .main-content {
    flex: 1;
  }

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

  .bracket-title {
    text-align: center;
    margin: 2rem 0 1rem 0;
    font-size: 1.5rem;
    font-weight: bold;
  }

  .bracket-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    margin-bottom: 3rem;
  }

  .matchups-table {
    border-collapse: collapse;
    margin: 0 auto;
    width: 100%;
    max-width: 350px;
    text-align: center;
  }

  .matchups-table th,
  .matchups-table td {
    border: 1px solid #ccc;
    padding: 0.5rem 0.8rem;
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

.week {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.week-title {
  text-align: center;
  margin-bottom: 1rem;
  font-size: 1.5rem; /* match bracket-title */
  font-weight: bold;
}

</style>

