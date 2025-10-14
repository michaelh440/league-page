<script>
  export let data;
  const { season, championship, consolation } = data;

  const seasons = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024]; // list of all seasons
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
      <a href="/standings/{season}" class="season-btn">Reg Season Standings</a>
      <a href="/seasons/{season}" class="season-btn">Reg Season Week View</a>
      <a href="/seasons/{season}/playoffs" class="season-btn active"> Playoff Week View</a>
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
              <tr><th class="table-title" colspan="2">{game.label}</th></tr>
              <tr>
                <th>Team</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class:win={game.score1 > game.score2}>
                  <div class="team-info">
                    {#if game.team1_logo}
                      <img src={game.team1_logo} alt="{game.team1}" class="team-logo" />
                    {/if}
                    <span class="team-name">{game.team1}</span>
                  </div>
                </td>
                <td class="score-cell" class:win={game.score1 > game.score2}>{game.score1}</td>
              </tr>
              <tr>
                <td class:win={game.score2 > game.score1}>
                  <div class="team-info">
                    {#if game.team2_logo}
                      <img src={game.team2_logo} alt="{game.team2}" class="team-logo" />
                    {/if}
                    <span class="team-name">{game.team2}</span>
                  </div>
                </td>
                <td class="score-cell" class:win={game.score2 > game.score1}>{game.score2}</td>
              </tr>
            </tbody>
          </table>
          <div style="height:20px;"></div>
        {/each}
      </div>

      <!-- Week 16 -->
      <div>
        <h4 class="week-title">Week 16</h4>
        {#each championship.week16 as game}
          <table class="matchups-table">
            <thead>
              <tr><th class="table-title" colspan="2">{game.label}</th></tr>
              <tr>
                <th>Team</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class:win={game.score1 > game.score2}>
                  <div class="team-info">
                    {#if game.team1_logo}
                      <img src={game.team1_logo} alt="{game.team1}" class="team-logo" />
                    {/if}
                    <span class="team-name">{game.team1}</span>
                  </div>
                </td>
                <td class="score-cell" class:win={game.score1 > game.score2}>{game.score1}</td>
              </tr>
              <tr>
                <td class:win={game.score2 > game.score1}>
                  <div class="team-info">
                    {#if game.team2_logo}
                      <img src={game.team2_logo} alt="{game.team2}" class="team-logo" />
                    {/if}
                    <span class="team-name">{game.team2}</span>
                  </div>
                </td>
                <td class="score-cell" class:win={game.score2 > game.score1}>{game.score2}</td>
              </tr>
            </tbody>
          </table>
          <div style="height:20px;"></div>
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
              <tr><th class="table-title" colspan="2">{game.label}</th></tr>
              <tr>
                <th>Team</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class:win={game.score1 > game.score2}>
                  <div class="team-info">
                    {#if game.team1_logo}
                      <img src={game.team1_logo} alt="{game.team1}" class="team-logo" />
                    {/if}
                    <span class="team-name">{game.team1}</span>
                  </div>
                </td>
                <td class="score-cell" class:win={game.score1 > game.score2}>{game.score1}</td>
              </tr>
              <tr>
                <td class:win={game.score2 > game.score1}>
                  <div class="team-info">
                    {#if game.team2_logo}
                      <img src={game.team2_logo} alt="{game.team2}" class="team-logo" />
                    {/if}
                    <span class="team-name">{game.team2}</span>
                  </div>
                </td>
                <td class="score-cell" class:win={game.score2 > game.score1}>{game.score2}</td>
              </tr>
            </tbody>
          </table>
          <div style="height:20px;"></div>
        {/each}
      </div>

      <!-- Week 16 -->
      <div>
        <h4 class="week-title">Week 16</h4>
        {#each consolation.week16 as game}
          <table class="matchups-table">
            <thead>
              <tr><th class="table-title" colspan="2">{game.label}</th></tr>
              <tr>
                <th>Team</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class:win={game.score1 > game.score2}>
                  <div class="team-info">
                    {#if game.team1_logo}
                      <img src={game.team1_logo} alt="{game.team1}" class="team-logo" />
                    {/if}
                    <span class="team-name">{game.team1}</span>
                  </div>
                </td>
                <td class="score-cell" class:win={game.score1 > game.score2}>{game.score1}</td>
              </tr>
              <tr>
                <td class:win={game.score2 > game.score1}>
                  <div class="team-info">
                    {#if game.team2_logo}
                      <img src={game.team2_logo} alt="{game.team2}" class="team-logo" />
                    {/if}
                    <span class="team-name">{game.team2}</span>
                  </div>
                </td>
                <td class="score-cell" class:win={game.score2 > game.score1}>{game.score2}</td>
              </tr>
            </tbody>
          </table>
          <div style="height:20px;"></div>
        {/each}
      </div>
    </div>
  </main>
</div>

<style>
  /* Desktop Layout */
  .page-layout {
    display: flex;
    gap: 2rem;
    min-height: 100vh;
    padding: 0 1rem;
  }

  .sidebar {
    flex: 0 0 12%;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-left: 0.5rem;
    margin-top: 1rem;
    position: sticky;
    top: 1rem;
    height: fit-content;
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
    transition: all 0.2s ease;
  }

  .season-card:hover {
    background: #0056b3;
    transform: translateY(-2px);
  }

  .season-card.active {
    background: silver;
    color: #222;
  }

  .main-content {
    flex: 1;
    max-width: 100%;
  }

  /* Navigation */
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
    transition: all 0.2s ease;
  }

  .season-btn:hover {
    background: #0056b3;
    transform: translateY(-2px);
  }

  .season-btn.active {
    background: #004085;
  }

  /* Bracket Styling */
  .bracket-title {
    text-align: center;
    margin: 2rem 0 1rem 0;
    font-size: 1.5rem;
    font-weight: bold;
    color: #004085;
  }

  .bracket-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    margin-bottom: 3rem;
  }

  .week-title {
    text-align: center;
    margin-bottom: 1rem;
    font-size: 1.3rem;
    font-weight: bold;
    color: #004085;
  }

  /* Tables */
  .matchups-table {
    border-collapse: collapse;
    margin: 0 auto 1.5rem auto;
    width: 100%;
    max-width: 350px;
    text-align: center;
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .matchups-table th,
  .matchups-table td {
    border: 1px solid #dee2e6;
    padding: 0.75rem 0.8rem;
    color: #212529;
  }

  .matchups-table th {
    background-color: #e9ecef;
    color: #495057;
    font-weight: 600;
  }

  .table-title {
    text-align: center !important;
    background: linear-gradient(135deg, #003366, #004080) !important;
    color: white !important;
    font-size: 1rem;
    font-weight: bold;
    padding: 0.75rem;
  }

  .matchups-table td {
    background: white;
    color: #212529;
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
    color: #212529 !important;
  }

  .team-info {
    display: flex;
    align-items: center;
    justify-content: flex-start;
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
    font-weight: 500;
  }

  .score-cell {
    font-weight: 600;
    font-size: 1.1em;
    color: #004085;
  }

  h3 {
    color: #004085;
    margin: 1rem 0;
  }

  /* MOBILE RESPONSIVE STYLES */
  @media screen and (max-width: 768px) {
    .page-layout {
      flex-direction: column;
      gap: 0;
      padding: 0.5rem;
    }

    /* Transform sidebar into horizontal scroll */
    .sidebar {
      position: relative;
      flex: none;
      flex-direction: row;
      width: 100%;
      margin: 0 0 1rem 0;
      padding: 0.75rem;
      background: #f8f9fa;
      border-radius: 8px;
      overflow-x: auto;
      overflow-y: hidden;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: thin;
      scrollbar-color: #ccc transparent;
    }

    .sidebar::-webkit-scrollbar {
      height: 4px;
    }

    .sidebar::-webkit-scrollbar-track {
      background: transparent;
    }

    .sidebar::-webkit-scrollbar-thumb {
      background: #ccc;
      border-radius: 2px;
    }

    .season-card {
      flex: 0 0 auto;
      padding: 0.6rem 1rem;
      font-size: 0.9rem;
      white-space: nowrap;
      min-width: 65px;
      text-align: center;
    }

    .main-content {
      width: 100%;
    }

    h3 {
      font-size: 1.4rem;
      margin: 0.5rem 0 1rem 0;
      text-align: center;
      color: white !important;
    }

    .season-nav {
      gap: 0.75rem;
      margin: 0.5rem 0 1.5rem 0;
      flex-wrap: wrap;
      justify-content: center;
    }

    .season-btn {
      padding: 0.5rem 1rem;
      font-size: 0.9rem;
      flex: 0 0 auto;
    }

    .bracket-title {
      font-size: 1.3rem;
      margin: 1.5rem 0 1rem 0;
      color: white !important;
    }

    .bracket-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .week-title {
      font-size: 1.2rem;
      margin: 0.5rem 0 1rem 0;
      color: white !important;
    }

    .matchups-table {
      max-width: none;
      width: 90%;
      margin: 0 auto 1rem auto;
      font-size: 0.85rem;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
    }

    .matchups-table th,
    .matchups-table td {
      padding: 0.5rem 0.4rem;
      font-size: 0.85rem;
      color: #212529;
      line-height: 1.4;
    }

    .matchups-table th {
      font-size: 0.8rem;
      font-weight: 700;
      background: #e9ecef;
      color: #495057;
    }

    .table-title {
      font-size: 0.95rem;
      padding: 0.75rem;
      background: linear-gradient(135deg, #003366, #004080) !important;
      color: white !important;
    }

    .matchups-table td {
      background: white;
      color: #212529;
    }

    .matchups-table tbody tr:nth-child(odd) {
      background: white;
    }
    
    .matchups-table tbody tr:nth-child(even) {
      background: #f1f3f4;
    }

    .win {
      background-color: #d4edda !important;
      color: #212529 !important;
      font-weight: 600;
    }

    .team-info {
      gap: 0.3rem;
      justify-content: flex-start;
    }

    .team-logo {
      width: 20px;
      height: 20px;
    }

    .team-name {
      font-size: 0.8rem;
      max-width: 120px;
      font-weight: 500;
      color: #212529;
    }

    .score-cell {
      font-size: 1rem;
      font-weight: 700;
      color: #007bff;
    }
  }

  /* VERY SMALL SCREENS */
  @media screen and (max-width: 480px) {
    .page-layout {
      padding: 0.25rem;
    }

    .sidebar {
      padding: 0.5rem;
    }

    .season-card {
      padding: 0.5rem 0.8rem;
      font-size: 0.8rem;
      min-width: 55px;
    }

    h3 {
      font-size: 1.2rem;
      color: white !important;
    }

    .season-btn {
      padding: 0.4rem 0.8rem;
      font-size: 0.8rem;
    }

    .bracket-title {
      font-size: 1.1rem;
      color: white !important;
    }

    .week-title {
      font-size: 1rem;
      color: white !important;
    }

    .matchups-table {
      width: 85%;
      margin: 0 auto;
      font-size: 0.75rem;
    }

    .matchups-table th,
    .matchups-table td {
      padding: 0.4rem 0.2rem;
      font-size: 0.75rem;
      color: #212529;
    }

    .matchups-table th {
      background: #e9ecef;
      color: #495057;
      font-weight: 700;
    }

    .table-title {
      font-size: 0.85rem;
      padding: 0.5rem;
      background: linear-gradient(135deg, #003366, #004080) !important;
      color: white !important;
    }

    .team-logo {
      width: 18px;
      height: 18px;
    }

    .team-name {
      font-size: 0.7rem;
      max-width: 100px;
      color: #212529;
    }

    .score-cell {
      font-size: 0.9rem;
      color: #007bff;
      font-weight: 600;
    }
  }

  /* TABLET STYLES */
  @media screen and (max-width: 1024px) and (min-width: 769px) {
    .sidebar {
      flex: 0 0 10%;
    }

    .season-card {
      padding: 0.6rem;
      font-size: 0.9rem;
    }

    .bracket-grid {
      gap: 1.5rem;
    }

    .matchups-table {
      font-size: 0.9rem;
    }

    .matchups-table th,
    .matchups-table td {
      padding: 0.6rem 0.7rem;
    }
  }
</style>