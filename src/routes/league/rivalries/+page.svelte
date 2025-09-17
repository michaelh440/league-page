<script>
  export let data;
  const { teams, rivalries } = data;

  function getRivalry(team1, team2) {
    return rivalries.find(
      r =>
        (r.team1_id === team1.team_id && r.team2_id === team2.team_id) ||
        (r.team1_id === team2.team_id && r.team2_id === team1.team_id)
    );
  }
</script>

<h2 class="page-title">All-Time Rivalries</h2>

<table class="rivalry-grid">
  <thead>
    <tr>
      <th></th>
      {#each teams as team}
        <th>
          {#if team.logo_url}
            <img src={team.logo_url} alt={team.team_name} class="team-logo" />
          {/if}
          <div>{team.team_name}</div>
        </th>
      {/each}
    </tr>
  </thead>
  <tbody>
    {#each teams as rowTeam}
      <tr>
        <th>
          {#if rowTeam.logo_url}
            <img src={rowTeam.logo_url} alt={rowTeam.team_name} class="team-logo" />
          {/if}
          <div>{rowTeam.team_name}</div>
        </th>

        {#each teams as colTeam}
          {#if rowTeam.team_id === colTeam.team_id}
            <td class="self"></td>
          {:else}
            {#if getRivalry(rowTeam, colTeam)}
              <td class="vs-cell">
                <a href={`/rivalries/${rowTeam.team_id}-${colTeam.team_id}`}>
                  VS
                </a>
              </td>
            {:else}
              <td class="empty"></td>
            {/if}
          {/if}
        {/each}
      </tr>
    {/each}
  </tbody>
</table>

<style>
  .page-title {
    text-align: center;
    margin: 2rem 0;
    font-size: 2rem;
    color: #004085;
  }

  .rivalry-grid {
    border-collapse: collapse;
    margin: 0 auto;
    width: 100%;
    max-width: 1000px;
    text-align: center;
  }

  .rivalry-grid th,
  .rivalry-grid td {
    border: 1px solid #ddd;
    padding: 0.5rem;
    min-width: 70px;
  }

  .rivalry-grid th {
    background: #f8f9fa;
    font-size: 0.85rem;
  }

  .vs-cell a {
    display: inline-block;
    background: #007bff;
    color: white;
    font-weight: bold;
    padding: 0.3rem 0.6rem;
    border-radius: 4px;
    text-decoration: none;
    font-size: 0.85rem;
  }

  .vs-cell a:hover {
    background: #0056b3;
  }

  .self {
    background: #eee;
  }

  .empty {
    background: #f9f9f9;
  }

  .team-logo {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    object-fit: cover;
    display: block;
    margin: 0 auto 0.25rem;
  }
</style>
