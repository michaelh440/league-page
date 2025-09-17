<script>
  export let title = "";
  export let navItems = []; // [{label, href, active}]
</script>

<div class="page-layout">
  <!-- Sidebar -->
  <aside class="sidebar">
    {#each navItems as item}
      <a
        href={item.href}
        class="nav-card {item.active ? 'active' : ''}"
      >
        {item.label}
      </a>
    {/each}
  </aside>

  <!-- Main Content -->
  <main class="content">
    <div style="text-align: center;">
        {#if title}
        <h4 class="text-2xl font-bold mb-4">{title}</h4>
        {/if}
    </div>
    <slot />
  </main>
</div>

<style>
  .page-layout {
    display: flex;
    gap: 2rem;
  }

  .sidebar {
    flex: 0 0 12%;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-left: 0.5rem;
    margin-top: 1rem;
  }
  
  .nav-card {
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

  .nav-card:hover {
    background: #0056b3;
    transform: translateY(-2px);
  }

  .nav-card.active {
    background: silver;
    color: #222;
  }

  .content {
    flex: 1;
  }
</style>
