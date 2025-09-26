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
                  <div class="team-display">
                    {#if game.team1_logo}
                      <img src={game.team1_logo} alt="{game.team1}" class="team-logo" />
                    {/if}
                    <span class="team-name">{game.team1}</span>
                  </div>
                </td>
                <td class="score-cell" class:win={game.score1 > game.score2}>{game.score1}</td>
                <td class:win={game.score2 > game.score1}>
                  <div class="team-display">
                    {#if game.team2_logo}
                      <img src={game.team2_logo} alt="{game.team2}" class="team-logo" />
                    {/if}
                    <span class="team-name">{game.team2}</span>
                  </div>
                </td>
                <td class="score-cell" class:win={game.score2 > game.score1}>{game.score2}</td>
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
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    overflow: hidden;
  }

  .matchups-table th,
  .matchups-table td {
    border: 1px solid #dee2e6;
    padding: 0.75rem 1rem;
  }

  .matchups-table th {
    background-color: #004085;
    color: white;
    font-weight: 600;
  }

  .matchups-table td {
    background: white;
  }

  .matchups-table tbody tr:nth-child(odd) {
    background: white;
  }

  .matchups-table tbody tr:nth-child(even) {
    background: #f8f9fa;
  }

  .matchups-table tbody tr:hover {
    background: #e3f2fd !important;
  }

  .win {
    background-color: #d4edda !important;
    font-weight: bold;
  }

  .team-display {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .team-logo {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #e9ecef;
    flex-shrink: 0;
  }

  .team-name {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .score-cell {
    font-weight: 600;
    font-size: 1.1em;
  }

  /* Mobile Styles */
  @media (max-width: 768px) {
    .page-layout {
      flex-direction: column;
      gap: 1rem;
      padding: 0 0.5rem;
    }

    .sidebar {
      flex: none;
      flex-direction: row;
      overflow-x: auto;
      gap: 0.5rem;
      margin: 0.5rem 0;
      padding: 0.5rem;
      background: #f8f9fa;
      border-radius: 8px;
      -webkit-overflow-scrolling: touch;
    }

    .season-card {
      flex: 0 0 auto;
      padding: 0.6rem 1rem;
      font-size: 0.9rem;
      white-space: nowrap;
      min-width: 60px;
    }

    .content {
      padding: 0;
    }

    h3 {
      font-size: 1.5rem;
      margin: 1rem 0;
    }

    .season-nav {
      gap: 0.5rem;
      margin: 1rem 0;
    }

    .season-btn {
      padding: 0.5rem 1rem;
      font-size: 0.9rem;
    }

    .season-container {
      gap: 1.5rem;
      padding: 0 0.25rem;
    }

    h4 {
      font-size: 1.2rem;
      margin: 0.5rem 0;
    }

    .matchups-table {
      width: 100%;
      max-width: none;
      font-size: 0.85rem;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
    }

    .matchups-table th,
    .matchups-table td {
      padding: 0.6rem 0.4rem;
    }

    .matchups-table th {
      font-size: 0.8rem;
      background: #004085;
    }

    .team-display {
      gap: 0.3rem;
      justify-content: flex-start;
    }

    .team-logo {
      width: 22px;
      height: 22px;
    }

    .team-name {
      font-size: 0.85rem;
      max-width: 100px;
    }

    .score-cell {
      font-size: 1rem;
      font-weight: 700;
    }
  }

  /* Very small screens */
  @media (max-width: 480px) {
    .matchups-table {
      font-size: 0.75rem;
    }

    .matchups-table th,
    .matchups-table td {
      padding: 0.4rem 0.2rem;
    }

    .team-logo {
      width: 18px;
      height: 18px;
    }

    .team-name {
      font-size: 0.75rem;
      max-width: 80px;
    }

    .score-cell {
      font-size: 0.9rem;
    }

    .season-card {
      padding: 0.5rem 0.8rem;
      font-size: 0.8rem;
    }

    .season-btn {
      padding: 0.4rem 0.8rem;
      font-size: 0.8rem;
    }

    h3 {
      font-size: 1.3rem;
    }

    h4 {
      font-size: 1.1rem;
    }
  }

  /* Tablet styles */
  @media (max-width: 1024px) and (min-width: 769px) {
    .sidebar {
      flex: 0 0 10%;
    }

    .season-card {
      padding: 0.6rem;
      font-size: 0.9rem;
    }

    .matchups-table {
      width: 90%;
      font-size: 0.9rem;
    }

    .matchups-table th,
    .matchups-table td {
      padding: 0.6rem 0.8rem;
    }
  }
</style>