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
    import { Icon } from '@smui/tab';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';

    export let data;
    const { season, weeks } = data;

    const seasons = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023];

    let displayWeek = 1;
    let active = null;

    onMount(() => {
        // Initialize to first week
        displayWeek = 1;
    });

    const expandClose = (matchupId) => {
        active = active === matchupId ? null : matchupId;
    }

    $: currentWeekData = weeks.find(week => week.week === displayWeek);
    $: matchupArray = currentWeekData ? currentWeekData.games : [];
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

        <!-- All weeks displayed vertically -->
        <div class="season-container">
            {#each weeks as week}
                <div class="week-section">
                    <h4>Week {week.week}</h4>
                    <div class="matchups">
                        {#each week.games as game, ix}
                            <div class="matchup">
                                <div class="header" onclick={() => expandClose(`${week.week}-${ix}`)}>
                                    <div class="opponent home{parseFloat(game.score1) > parseFloat(game.score2) ? ' homeGlow' : ''}">
                                        {#if game.team1_logo}
                                            <img class="avatar" src={game.team1_logo} alt="{game.team1}" />
                                        {/if}
                                        <div class="name">{game.team1}</div>
                                        <div class="totalPoints totalPointsR">{game.score1}</div>
                                    </div>
                                    <img class="divider" src="/{parseFloat(game.score1) > parseFloat(game.score2) ? 'home' : parseFloat(game.score2) > parseFloat(game.score1) ? 'away' : 'tied'}Divider.jpg" alt="divider" />
                                    <div class="opponent away{parseFloat(game.score2) > parseFloat(game.score1) ? ' awayGlow' : ''}">
                                        <div class="totalPoints totalPointsL">{game.score2}</div>
                                        <div class="name">{game.team2}</div>
                                        {#if game.team2_logo}
                                            <img class="avatar" src={game.team2_logo} alt="{game.team2}" />
                                        {/if}
                                    </div>
                                </div>

                                <!-- Placeholder for expandable content -->
                                <div class="rosters" style="max-height: {active === `${week.week}-${ix}` ? '200px' : '0'}; {active !== `${week.week}-${ix}` ? 'border: none' : ''};">
                                    <div class="placeholder-content">
                                        <p>Game details for {game.team1} vs {game.team2}</p>
                                        <p>Final Score: {game.score1} - {game.score2}</p>
                                    </div>
                                    <div class="close" onclick={() => expandClose(`${week.week}-${ix}`)}>Close Matchup</div>
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
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

    /* Season container and week sections */
    .season-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2rem;
        padding-bottom: 2rem;
    }

    .week-section {
        width: 100%;
        max-width: 800px;
    }

    h4 {
        color: #004085;
        margin: 1rem 0 0.5rem 0;
        text-align: center;
        font-size: 1.5em;
    }

    /* Matchups styling (from live matchups) */
    .matchups {
        margin: 2em 0 6em;
    }

    .matchup {
        width: 95%;
        max-width: 600px;
        margin: 10px auto;
    }

    .header {
        display: flex;
        justify-content: space-between;
        position: relative;
        border: 1px solid #bbb;
        border-radius: 10px;
        opacity: 0.8;
        cursor: pointer;
        transition: opacity 0.5s;
        overflow: hidden;
    }

    .header:hover {
        opacity: 1;
    }

    .opponent {
        display: flex;
        align-items: center;
        width: 46%;
        padding: 5px 2%;
        top: 0;
        z-index: 2;
    }

    .divider {
        position: absolute;
        z-index: 3;
        transform: translateX(-50%);
        top: 0;
        left: 50%;
        height: 100%;
        width: 15px;
    }

    .home {
        justify-content: flex-start;
        left: 0;
        text-align: left;
        background-color: #485566;
    }

    :global(.homeGlow) {
        box-shadow: 0 0 6px 4px #3279cf;
        background-color: #00316b !important;
    }

    .away {
        justify-content: flex-end;
        right: 0;
        text-align: right;
        background-color: #8b6969;
    }

    :global(.awayGlow) {
        box-shadow: 0 0 6px 4px #d15454;
        background-color: #920505 !important;
    }

    .name {
        margin: 0 5px;
        font-size: 1em;
        line-height: 1.1em;
        flex-grow: 1;
        word-break: break-word;
        color: #fff;
        font-style: italic;
    }

    .avatar {
        vertical-align: middle;
        border-radius: 50%;
        height: 35px;
        width: 35px;
        margin: 0;
        border: 0.25px solid #777;
        background-color: #eee;
    }

    .totalPoints {
        line-height: 1.1em;
        color: #fff;
        font-weight: 600;
        font-size: 1.1em;
    }

    .totalPointsR {
        margin-right: 0.1em;
        text-align: right;
    }

    .totalPointsL {
        margin-left: 0.1em;
        text-align: left;
    }

    /* Expandable content */
    .rosters {
        position: relative;
        background-color: var(--fff);
        border-radius: 8px;
        overflow: hidden;
        border-left: 1px solid #bbb;
        border-right: 1px solid #bbb;
        border-bottom: 1px solid #bbb;
        transition: max-height 0.4s;
    }

    .placeholder-content {
        padding: 1rem;
        text-align: center;
        color: #666;
    }

    .close {
        display: block;
        width: 100%;
        background-color: var(--eee);
        text-align: center;
        cursor: pointer;
        z-index: 2;
        font-size: 1.1em;
        padding: 6px 0;
    }

    .close:hover {
        background-color: var(--ddd);
    }

    h3 {
        color: #004085;
        margin: 1rem 0;
    }

    /* Mobile responsive */
    @media screen and (max-width: 768px) {
        .page-layout {
            flex-direction: column;
            gap: 0;
            padding: 0.5rem;
        }

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

        .weekText {
            font-size: 1.6em;
        }

        .name {
            font-size: 0.8em;
        }

        .totalPoints {
            font-size: 0.8em;
        }
    }

    @media (max-width: 500px) {
        .weekText {
            font-size: 1.3em;
        }

        .name {
            font-size: 0.7em;
        }

        .totalPoints {
            font-size: 0.7em;
        }
    }

    @media (max-width: 410px) {
        .weekText {
            font-size: 1.2em;
        }

        .name {
            font-size: 0.5em;
        }

        .totalPoints {
            font-size: 0.5em;
        }
    }
</style>