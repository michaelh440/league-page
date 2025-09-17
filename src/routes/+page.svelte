<!--script>
	import LinearProgress from '@smui/linear-progress';
	import { getNflState, leagueName, getAwards, getLeagueTeamManagers, homepageText, managers, gotoManager, enableBlog, waitForAll } from '$lib/utils/helper';
	import { Transactions, PowerRankings, HomePost} from '$lib/components';
	import { getAvatarFromTeamManagers, getTeamFromTeamManagers } from '$lib/utils/helperFunctions/universalFunctions';

    const nflState = getNflState();
    const podiumsData = getAwards();
    const leagueTeamManagersData = getLeagueTeamManagers();
</script>

<style>
    #home {
        display: flex;
        flex-wrap: nowrap;
        position: relative;
        overflow-y: hidden;
        z-index: 1;
    }

    #main {
        flex-grow: 1;
        min-width: 320px;
        margin: 0 auto;
        padding: 60px 0;
    }

    .text {
        padding: 0 30px;
        max-width: 620px;
        margin: 0 auto;
    }

    .leagueData {
        position: relative;
        z-index: 1;
        width: 100%;
        min-width: 470px;
        max-width: 470px;
        min-height: 100%;
		background-color: var(--ebebeb);
        border-left: var(--eee);
		box-shadow: inset 8px 0px 6px -6px rgb(0 0 0 / 24%);
    }

    @media (max-width: 950px) {
        .leagueData {
            max-width: 100%;
            min-width: 100%;
            width: 100%;
		    box-shadow: none;
        }
        #home {
            flex-wrap: wrap;
        }
    }

    .transactions {
        display: block;
        width: 95%;
        margin: 10px auto;
    }

    .center {
        text-align: center;
    }

    h6 {
        text-align: center;
    }

    .homeBanner {
        background-color: var(--blueOne);
        color: #fff;
        padding: 0.5em 0;
        font-weight: 500;
        font-size: 1.5em;
    }

    /* champ styling */
    #currentChamp {
        padding: 25px 0;
		background-color: var(--f3f3f3);
        box-shadow: 5px 0 8px var(--champShadow);
        border-left: 1px solid var(--ddd);
    }

    #champ {
        position: relative;
        width: 150px;
        height: 150px;
        margin: 0 auto;
        cursor: pointer;
    }

    .first {
        position: absolute;
        transform: translate(-50%, -50%);
        width: 80px;
        height: 80px;
        border-radius: 100%;
        border: 1px solid #ccc;
        left: 50%;
        top: 43%;
    }

    .laurel {
        position: absolute;
        transform: translate(-50%, -50%);
        width: 135px;
        height: auto;
        left: 50%;
        top: 50%;
    }

    h4 {
        text-align: center;
        font-size: 1.8em;
        margin: 10px;
        font-style: italic;
    }

    .label {
        display: table;
        text-align: center;
        line-height: 1.1em;
        font-size: 1.7em;
        margin: 6px auto 10px;
        cursor: pointer;
    }
    
	:global(.curOwner) {
		font-size: 0.75em;
		color: #bbb;
		font-style: italic;
	}
</style>

<div id="home">
    <div id="main">
        <div class="text">
            <h6>{leagueName}</h6>
            <!-- homepageText contains the intro text for your league, this gets edited in /src/lib/utils/leagueInfo.js >
            {@html homepageText }
            <!-- Most recent Blog Post (if enabled) >
            {#if enableBlog}
                <HomePost />
            {/if}
        </div>
        <PowerRankings />
    </div>
    
    <div class="leagueData">
        <div class="homeBanner">
            {#await nflState}
                <div class="center">Retrieving NFL state...</div>
                <LinearProgress indeterminate />
            {:then nflStateData}
                <div class="center">NFL {nflStateData.season} 
                    {#if nflStateData.season_type == 'pre'}
                        Preseason
                    {:else if nflStateData.season_type == 'post'}
                        Postseason
                    {:else}
                        Season - {nflStateData.week > 0 ? `Week ${nflStateData.week}` : "Preseason"}
                    {/if}
                </div>
            {:catch error}
                <div class="center">Something went wrong: {error.message}</div>
            {/await}
        </div>

        <div id="currentChamp">
            {#await waitForAll(podiumsData, leagueTeamManagersData)}
                <p class="center">Retrieving awards...</p>
                <LinearProgress indeterminate />
            {:then [podiums, leagueTeamManagers]}
                {#if podiums[0]}
                    <h4>{podiums[0].year} Fantasy Champ</h4>
                    <div id="champ" onclick={() => {if(managers.length) gotoManager({year: podiums[0].year, leagueTeamManagers, rosterID: parseInt(podiums[0].champion)})}} >
                        <img src="{getAvatarFromTeamManagers(leagueTeamManagers, podiums[0].champion, podiums[0].year)}" class="first" alt="champion" />
                        <img src="/laurel.png" class="laurel" alt="laurel" />
                    </div>
                    <span class="label" onclick={() => gotoManager({year: podiums[0].year, leagueTeamManagers, rosterID: parseInt(podiums[0].champion)})} >{getTeamFromTeamManagers(leagueTeamManagers, podiums[0].champion, podiums[0].year).name}</span>
                {:else}
                    <p class="center">No former champs.</p>
                {/if}
            {:catch error}
                <p class="center">Something went wrong: {error.message}</p>
            {/await}
        </div>

        <div class="transactions" >
            <Transactions />
        </div>
    </div>
</div-->

<script>
  import LinearProgress from '@smui/linear-progress';

  import {
    getNflState,
    leagueName,
    getAwards,
    getLeagueTeamManagers,
    homepageText,
    managers,
    gotoManager,
    enableBlog,
    waitForAll
  } from '$lib/utils/helper';

  import { PowerRankings, HomePost, Standings } from '$lib/components';
  import {
    getAvatarFromTeamManagers,
    getTeamFromTeamManagers
  } from '$lib/utils/helperFunctions/universalFunctions';

  const nflState = getNflState();
  const podiumsData = getAwards();
  export let data;
  const { standingsData, leagueTeamManagersData } = data;
</script>

<style>
  .page-container {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  /* Card style */
  .card {
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 1rem;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  }

  /* League description */
  .league-description {
    text-align: center;
    max-width: 800px;
    margin: 0 auto;
  }

  /* NFL status + champ row */
  .top-row {
    display: flex;
    flex-wrap: wrap;
    gap: 2rem;
  }
  .top-row > * {
    flex: 1 1 0;
    min-width: 300px;
  }

  /* Standings + Power Rankings row */
  .bottom-row {
    display: flex;
    flex-wrap: wrap;
    gap: 2rem;
  }
  .bottom-row > * {
    flex: 1 1 0;
    min-width: 300px;
  }

  /* Champ section */
  .champ-title {
    text-align: center;
    font-size: 1.2rem;
    margin-bottom: 0.8rem;
  }
  #champ {
    position: relative;
    width: 120px;
    height: 120px;
    margin: 0 auto 0.8rem;
    cursor: pointer;
  }
  .first {
    position: absolute;
    transform: translate(-50%, -50%);
    width: 70px;
    height: 70px;
    border-radius: 100%;
    border: 1px solid #ccc;
    left: 50%;
    top: 45%;
  }
  .laurel {
    position: absolute;
    transform: translate(-50%, -50%);
    width: 110px;
    left: 50%;
    top: 50%;
  }
  .label {
    display: block;
    text-align: center;
    font-weight: bold;
    font-size: 1rem;
    cursor: pointer;
  }
  .curOwner {
    font-size: 0.8rem;
    color: #777;
    font-style: italic;
    text-align: center;
  }

  /* ✅ Match Standings header to Power Rankings */
  .card :global(h2),
  .card :global(h3) {
    font-size: 1.2rem;
    margin-bottom: 0.8rem;
    text-align: center;
    font-weight: bold;
    color: #333;
  }

  /* Responsive tweaks */
  @media (max-width: 700px) {
    .page-container {
      padding: 1rem;
    }
    .top-row,
    .bottom-row {
      flex-direction: column;
    }
  }
</style>

<div class="page-container">
  <!-- League Description -->
  <div class="card league-description">
    <h2>{leagueName}</h2>
    {@html homepageText }
    {#if enableBlog}
      <HomePost />
    {/if}
  </div>

  <!-- NFL Status + Current Champ -->
  <div class="top-row">
    <!-- NFL Status -->
    <div class="card">
      {#await nflState}
        <div class="center">Retrieving NFL state...</div>
        <LinearProgress indeterminate />
      {:then nflStateData}
        <div class="center">
          NFL {nflStateData.season}
          {#if nflStateData.season_type == 'pre'}
            Preseason
          {:else if nflStateData.season_type == 'post'}
            Postseason
          {:else}
            Season - {nflStateData.week > 0 ? `Week ${nflStateData.week}` : "Preseason"}
          {/if}
        </div>
      {:catch error}
        <div class="center">Error: {error.message}</div>
      {/await}
    </div>

    <!-- Current Champ -->
    <div class="card">
      {#await waitForAll(podiumsData, leagueTeamManagersData)}
        <p class="center">Retrieving awards...</p>
        <LinearProgress indeterminate />
      {:then [podiums, leagueTeamManagers]}
        {#if podiums[0]}
          <div class="champ-title">{podiums[0].year} Fantasy Champ</div>
          <div
            id="champ"
            onclick={() =>
              managers.length &&
              gotoManager({
                year: podiums[0].year,
                leagueTeamManagers,
                rosterID: parseInt(podiums[0].champion)
              })
            }
          >
            <img
              src="{getAvatarFromTeamManagers(
                leagueTeamManagers,
                podiums[0].champion,
                podiums[0].year
              )}"
              class="first"
              alt="champion"
            />
            <img src="/laurel.png" class="laurel" alt="laurel" />
          </div>
          <span
            class="label"
            onclick={() =>
              gotoManager({
                year: podiums[0].year,
                leagueTeamManagers,
                rosterID: parseInt(podiums[0].champion)
              })
            }
            >{getTeamFromTeamManagers(
              leagueTeamManagers,
              podiums[0].champion,
              podiums[0].year
            ).name}</span
          >
        {:else}
          <p class="center">No former champs.</p>
        {/if}
      {:catch error}
        <p class="center">Error: {error.message}</p>
      {/await}
    </div>
  </div>

  <!-- Standings + Power Rankings -->
  <div class="bottom-row">
    <div class="card">
      <Standings {standingsData} {leagueTeamManagersData} />
    </div>
    <div class="card">
      <PowerRankings />
    </div>
  </div>
</div>
