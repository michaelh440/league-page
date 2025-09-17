<!--script>
  import StatsLayout from '$lib/components/StatsLayout.svelte';
  export let data;
  const { managers } = data;

  // Custom ordering array
  let customOrder = [1,2,3,7,8,14,15,21,22,23,4,5,6,9,10,11,12,13,16,17,18,19,20];
  const orderMap = new Map(customOrder.map((id, i) => [id, i]));

  $: sortedManagers = [...managers].sort(
    (a, b) =>
      (orderMap.get(a.manager_id) ?? 999) -
      (orderMap.get(b.manager_id) ?? 999)
  );

  const navItems = [
    { label: "List", href: "/managers", active: true },
    { label: "Individual Manager Bio", href: "/managers/bio" },
    { label: "Manager All Time Stats", href: "/managers/all-time" },
    { label: "Manager Regular Season Stats", href: "/managers/regular-season" },
    { label: "Manager Playoff Stats", href: "/managers/playoffs" },
    { label: "Matchups/Rivalries", href: "/managers/rivalries" },
    { label: "Manager Trophy Room", href: "/managers/trophies" },
    { label: "Manager Draft Room", href: "/managers/drafts" }
  ];
</script>



<StatsLayout title="Managers" {navItems}>
  <div class="grid">
    {#each sortedManagers as m}
      <div class="card">
        {#if m.logo_url}
          <img src={m.logo_url} alt={m.username} class="logo" />
        {/if}
        <div class="info">
          <h2>{m.username}</h2>
          {#if m.philosophy}
            <p class="philosophy">Philosophy: {m.philosophy}</p>
          {/if}
          {#if m.signature_moves}
            <p class="moves">Signature Moves: {m.signature_moves}</p>
          {/if}
          <p class="joined">Joined: {m.year_joined}</p>
        </div>
      </div>
    {/each}
  </div>
</StatsLayout>

<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1rem;
    padding: 1rem;
  }
  .card {
    border: 1px solid #ddd;
    border-radius: 10px;
    padding: 1rem;
    background: #fff;
    display: flex;
    align-items: flex-start;
    gap: 0.8rem;
  }
  .logo {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    object-fit: cover;
  }
  .info h2 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
  }
  .joined {
    font-size: 0.85rem;
    color: #444;
  }
  .philosophy, .moves {
    margin-top: 0.4rem;
    font-size: 0.85rem;
    color: #333;
  }
</style-->


<script>
  import StatsLayout from '$lib/components/StatsLayout.svelte';
  export let data;
  const { managers } = data;

  // Custom ordering array
  let customOrder = [1,2,3,7,8,14,15,21,22,23,4,5,6,9,10,11,12,13,16,17,18,19,20];
  const orderMap = new Map(customOrder.map((id, i) => [id, i]));

  // IDs of inactive managers
  const inactiveManagers = new Set([4,5,6,9,10,11,12,13,16,17,18,19,20]);

  // Sort managers by custom order
  $: sortedManagers = [...managers].sort(
    (a, b) =>
      (orderMap.get(a.manager_id) ?? 999) -
      (orderMap.get(b.manager_id) ?? 999)
  );

  const navItems = [
    { label: "List", href: "/managers", active: true },
    { label: "Individual Manager Bio", href: "/managers/bio" },
    { label: "Manager All Time Stats", href: "/managers/all-time" },
    { label: "Manager Regular Season Stats", href: "/managers/regular-season" },
    { label: "Manager Playoff Stats", href: "/managers/playoffs" },
    { label: "Matchups/Rivalries", href: "/managers/rivalries" },
    { label: "Manager Trophy Room", href: "/managers/trophies" },
    { label: "Manager Draft Room", href: "/managers/drafts" }
  ];
</script>

<StatsLayout title="Managers" {navItems}>
  <div class="grid">
    {#each sortedManagers as m}
      <div class="card-container">
        <div class="card">
          {#if m.logo_url}
            <img src={m.logo_url} alt={m.username} class="logo" />
          {/if}
          <div class="info">
            <h2>{m.username}</h2>
            <p class="joined">Joined: {m.year_joined}</p>
            {#if m.philosophy}
              <p class="philosophy">Philosophy: {m.philosophy}</p>
            {/if}
            {#if m.signature_moves}
              <p class="moves">Signature Moves: {m.signature_moves}</p>
            {/if}
          </div>
        </div>

        {#if inactiveManagers.has(m.manager_id)}
          <div class="overlay">
            <span>Got Scared</span>
          </div>
        {/if}
      </div>
    {/each}
  </div>
</StatsLayout>

<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1rem;
    padding: 1rem;
  }
  .card-container {
    position: relative;
  }
  .card {
    border: 1px solid #ddd;
    border-radius: 10px;
    padding: 1rem;
    background: #fff;
    display: flex;
    align-items: flex-start;
    gap: 0.8rem;
    min-height: 160px;
  }
  .logo {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    object-fit: cover;
  }
  .info h2 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
  }
  .joined {
    font-size: 0.85rem;
    color: #444;
  }
  .philosophy, .moves {
    margin-top: 0.4rem;
    font-size: 0.85rem;
    color: #333;
  }

  /* Overlay for "Got Scared" */
  .overlay {
    position: absolute;
    inset: 0;
    pointer-events: none; /* allow clicks to pass through */
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .overlay span {
    color: red;
    font-size: 2rem;
    font-weight: 900;
    font-family: "Comic Sans MS", "Chalkboard SE", cursive, sans-serif; /* snarky vibe */
    transform: rotate(-25deg); /* diagonal bottom-left to top-right */
    text-transform: uppercase;
    opacity: 0.85;
    border: 3px solid red;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.7);
    box-shadow: 0 0 8px rgba(255, 0, 0, 0.6);
  }
</style>
