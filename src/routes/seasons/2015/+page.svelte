<!--script>
  export let data;
  const { season, weeks } = data;

  const seasons = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023];
</script>

<div class="page-layout">
  <!-- Sidebar >
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

  <!-- Main Content >
  <main class="content">
    <h3 style="text-align: center;">{season} Season</h3>

    <nav class="season-nav">
      <a href="/seasons/{season}" class="season-btn active">Regular Season</a>
      <a href="/seasons/{season}/playoffs" class="season-btn">Playoffs</a>
    </nav>

    <div class="season-container">
      {#each weeks as week}
        <table class="matchups-table">
          <thead>
            <tr><th class="table-title" colspan="4">Week {week.week}</th></tr>
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
                  <div class="team-info">
                    {#if game.team1_logo}
                      <img src={game.team1_logo} alt="{game.team1}" class="team-logo" />
                    {/if}
                    <span class="team-name">{game.team1}</span>
                  </div>
                </td>
                <td class="score-cell" class:win={game.score1 > game.score2}>{game.score1}</td>
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
            {/each}
          </tbody>
        </table>
      {/each}
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

  .content {
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

  /* Tables */
  .season-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
    padding-bottom: 2rem;
  }

  .matchups-table {
    border-collapse: collapse;
    margin: 0 auto;
    width: 80%;
    max-width: 800px;
    text-align: center;
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .matchups-table th,
  .matchups-table td {
    border: 1px solid #dee2e6;
    padding: 0.75rem 1rem;
    color: #212529;
  }

  .matchups-table th {
    background-color: #004085;
    color: white;
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

  h4 {
    color: #004085;
    margin: 1rem 0 0.5rem 0;
    text-align: center;
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

    .content {
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

    .season-container {
      gap: 1.5rem;
      padding: 0;
      width: 100%;
    }

    h4 {
      font-size: 1.2rem;
      margin: 0.5rem 0;
      color: #004085;
      font-weight: 600;
    }

    .matchups-table {
      width: 100%;
      max-width: none;
      font-size: 0.85rem;
      margin: 0;
    }

    .matchups-table th,
    .matchups-table td {
      padding: 0.5rem 0.25rem;
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
      flex-wrap: nowrap;
    }

    .team-logo {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }

    .team-name {
      font-size: 0.8rem;
      max-width: 80px;
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

    h4 {
      font-size: 1.1rem;
    }

    .matchups-table {
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
      max-width: 70px;
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

    .matchups-table {
      width: 90%;
      font-size: 0.9rem;
    }

    .matchups-table th,
    .matchups-table td {
      padding: 0.6rem 0.8rem;
    }
  }
</style-->

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
        <table class="matchups-table">
          <thead>
            <tr><th class="table-title" colspan="4">Week {week.week}</th></tr>
              <tr>
              <th>Team 1</th>
              <th>Score</th>
              <th>Team 2</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {#each week.games as game}
              <tr class="matchup-row">
                <td class="team-left {game.score1 > game.score2 ? 'winner-left' : ''}">
                  <div class="team-info">
                    {#if game.team1_logo}
                      <img src={game.team1_logo} alt="{game.team1}" class="team-logo" />
                    {/if}
                    <span class="team-name">{game.team1}</span>
                  </div>
                </td>
                <td class="score-cell score-left {game.score1 > game.score2 ? 'winner-left' : ''}">{game.score1}</td>
                <td class="team-right {game.score2 > game.score1 ? 'winner-right' : ''}">
                  <div class="team-info">
                    {#if game.team2_logo}
                      <img src={game.team2_logo} alt="{game.team2}" class="team-logo" />
                    {/if}
                    <span class="team-name">{game.team2}</span>
                  </div>
                </td>
                <td class="score-cell score-right {game.score2 > game.score1 ? 'winner-right' : ''}">{game.score2}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/each}
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

  .content {
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

  /* Tables */
  .season-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
    padding-bottom: 2rem;
  }

  .matchups-table {
    border-collapse: collapse;
    margin: 0 auto;
    width: 80%;
    max-width: 800px;
    text-align: center;
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border: none;
  }

  .matchups-table th,
  .matchups-table td {
    border: none;
    padding: 0.75rem 1rem;
    color: #212529;
    position: relative;
  }

  .matchups-table th {
    background-color: #004085;
    color: white;
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

  /* Enhanced matchup row styling */
  .matchup-row {
    position: relative;
    background: linear-gradient(135deg, #6B7D8A 50%, #8B4A6B 50%);
    border: none;
  }

  .matchup-row::before {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    bottom: 0;
    width: 1px;
    background: rgba(255, 255, 255, 0.3);
    transform: translateX(-50%) skewX(-20deg);
    z-index: 1;
  }

  /* Team styling - Left side (steel grey) */
  .team-left {
    background: linear-gradient(135deg, #6B7D8A 0%, #5A6B78 100%) !important;
    color: white !important;
    border: none !important;
    position: relative;
  }

  .score-left {
    background: linear-gradient(135deg, #6B7D8A 0%, #5A6B78 100%) !important;
    color: white !important;
    border: none !important;
    font-weight: 700;
    font-size: 1.2em;
  }

  /* Team styling - Right side (dark pink) */
  .team-right {
    background: linear-gradient(135deg, #8B4A6B 0%, #7A4159 100%) !important;
    color: white !important;
    border: none !important;
    position: relative;
  }

  .score-right {
    background: linear-gradient(135deg, #8B4A6B 0%, #7A4159 100%) !important;
    color: white !important;
    border: none !important;
    font-weight: 700;
    font-size: 1.2em;
  }

  /* Winner highlighting */
  .winner-left {
    background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%) !important;
    color: white !important;
    font-weight: bold;
  }

  .winner-right {
    background: linear-gradient(135deg, #C54545 0%, #A73C3C 100%) !important;
    color: white !important;
    font-weight: bold;
  }

  .team-info {
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
    border: 2px solid rgba(255, 255, 255, 0.3);
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
  }

  h3 {
    color: #004085;
    margin: 1rem 0;
  }

  h4 {
    color: #004085;
    margin: 1rem 0 0.5rem 0;
    text-align: center;
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

    .content {
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

    .season-container {
      gap: 1.5rem;
      padding: 0;
      width: 100%;
    }

    h4 {
      font-size: 1.2rem;
      margin: 0.5rem 0;
      color: #004085;
      font-weight: 600;
    }

    .matchups-table {
      width: 100%;
      max-width: none;
      font-size: 0.85rem;
      margin: 0;
    }

    .matchups-table th,
    .matchups-table td {
      padding: 0.5rem 0.25rem;
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

    /* Mobile team colors */
    .team-left {
      background: linear-gradient(135deg, #6B7D8A 0%, #5A6B78 100%) !important;
      color: white !important;
      border: none !important;
    }

    .score-left {
      background: linear-gradient(135deg, #6B7D8A 0%, #5A6B78 100%) !important;
      color: white !important;
      border: none !important;
      font-weight: 700;
    }

    .team-right {
      background: linear-gradient(135deg, #8B4A6B 0%, #7A4159 100%) !important;
      color: white !important;
      border: none !important;
    }

    .score-right {
      background: linear-gradient(135deg, #8B4A6B 0%, #7A4159 100%) !important;
      color: white !important;
      border: none !important;
      font-weight: 700;
    }

    .winner-left {
      background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%) !important;
      color: white !important;
      font-weight: 600;
    }

    .winner-right {
      background: linear-gradient(135deg, #C54545 0%, #A73C3C 100%) !important;
      color: white !important;
      font-weight: 600;
    }

    .team-info {
      gap: 0.3rem;
      justify-content: flex-start;
      flex-wrap: nowrap;
    }

    .team-logo {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
      border: 2px solid rgba(255, 255, 255, 0.3);
    }

    .team-name {
      font-size: 0.8rem;
      max-width: 80px;
      font-weight: 500;
      color: white;
    }

    .score-cell {
      font-size: 1rem;
      font-weight: 700;
    }

    /* Mobile diagonal line */
    .matchup-row::before {
      width: 1px;
      background: rgba(255, 255, 255, 0.2);
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

    h4 {
      font-size: 1.1rem;
    }

    .matchups-table {
      font-size: 0.75rem;
    }

    .matchups-table th,
    .matchups-table td {
      padding: 0.4rem 0.2rem;
      font-size: 0.75rem;
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
      border: 2px solid rgba(255, 255, 255, 0.3);
    }

    .team-name {
      font-size: 0.7rem;
      max-width: 70px;
      color: white;
    }

    .score-cell {
      font-size: 0.9rem;
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