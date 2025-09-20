<script>
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  /*<export let data;

  let managers = data.managers;
  let manager = null;

  // get manager_id from query string
  $: managerId = $page.url.searchParams.get("manager_id");
  $: manager = managers.find(m => m.manager_id == managerId);

  function handleSelect(e) {
    const id = e.target.value;
    if (id) {
      goto(`/managers/bio?manager_id=${id}`);
    }
  }*/
</script>
<div>HELLO</div>

<!--div class="bio-page">
  <h1>Manager Biographies</h1>

  <select on:change={handleSelect} bind:value={managerId}>
    <option value="">Select a manager...</option>
    {#each managers as m}
      <option value={m.manager_id}>{m.name}</option>
    {/each}
  </select>

  {#if manager}
    <div class="manager-bio">
      <img src={manager.logo_url} alt={manager.name} class="manager-logo" />
      <h2>{manager.name}</h2>
      <p><strong>Team:</strong> {manager.current_team}</p>
      <p><strong>Joined:</strong> {manager.year_joined}</p>
      <p><strong>Record:</strong> {manager.wins}-{manager.losses}-{manager.ties}</p>
      <p><strong>Championships:</strong> {manager.championships}</p>
      {#if manager.bio}
        <p class="bio-text">{manager.bio}</p>
      {:else}
        <p class="bio-text"><em>No biography written yet.</em></p>
      {/if}
    </div>
  {/if}
</div>

<style>
  .bio-page {
    padding: 1rem;
  }
  select {
    margin-bottom: 1.5rem;
    padding: 0.5rem;
    font-size: 1rem;
  }
  .manager-bio {
    padding: 1.5rem;
    border-radius: 1rem;
    background: var(--surface);
    box-shadow: var(--elevation-2);
  }
  .manager-logo {
    width: 100px;
    height: 100px;
    border-radius: 50%;
  }
  .bio-text {
    margin-top: 1rem;
    font-style: italic;
  }
</style-->
