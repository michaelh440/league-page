<script>
  import { tabs } from '$lib/utils/tabs';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';

  // which dropdowns are open (by tab.key)
  let open = new Set();

  /** Close all menus */
  function closeAll() {
    open = new Set();
  }

  /** Toggle a specific dropdown by key */
  function toggle(key) {
    const next = new Set(open);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    open = next; // reassign to trigger update
  }

  /** Determine active (parent or any child matches path) */
  function isActive(tab, path) {
    if (tab.dest && tab.dest === path) return true;
    if (tab.nest && tab.children?.some((c) => c.dest === path)) return true;
    return false;
  }

  /** keyboard support for toggles */
  function onKeyToggle(e, key) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle(key);
    } else if (e.key === 'Escape') {
      closeAll();
      e.currentTarget.blur();
    }
  }

  /** navigate (close menus first) */
  function go(href) {
    closeAll();
    goto(href);
  }

  // click outside to close
  let navEl;
  function onDocClick(e) {
    if (!navEl?.contains(e.target)) closeAll();
  }

  if (browser) {
    onMount(() => document.addEventListener('click', onDocClick));
    onDestroy(() => document.removeEventListener('click', onDocClick));
  }
</script>

<style>
  nav {
    display: flex;
    justify-content: center;
    background: #fff;
    border-bottom: 2px solid #00316b;
  }
  .nav-list {
    display: flex;
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .nav-item {
    position: relative;
  }
  .nav-link {
    display: flex;
    align-items: center;
    padding: 1rem;
    color: #555;
    text-decoration: none;
    font-weight: bold;
    border-bottom: 3px solid transparent;
    cursor: pointer;
  }
  .nav-link.active {
    color: #00316b;
    border-color: #00316b;
  }
  .nav-link:hover {
    color: #00316b;
  }
  .nav-link i {
    margin-right: 0.4rem;
    font-size: 1.2rem;
  }
/* Video button special styling */
  .nav-link.video-btn {
    background: linear-gradient(135deg, rgba(0, 49, 107, 0.1), rgba(0, 123, 255, 0.1));
    border: 2px solid #00316b;
    border-radius: 8px;
    margin-left: 0.75rem;
    padding: 0.75rem 1.25rem !important;
    border-bottom: 2px solid #00316b !important;
    transition: all 0.3s ease;
  }

  .nav-link.video-btn:hover {
    background: linear-gradient(135deg, #00316b, #007bff);
    color: white;
    border-color: #00316b;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 49, 107, 0.3);
  }

  .nav-link.video-btn.active {
    background: linear-gradient(135deg, #00316b, #007bff);
    color: white;
    border-color: #00316b;
  }
  
  /* dropdown menu */
  .dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    min-width: 220px;
    background: #fff;
    border: 1px solid #ccc;
    box-shadow: 0 2px 6px rgba(0,0,0,0.15);
    z-index: 10;
  }
  .dropdown ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .dropdown li {
    border-bottom: 1px solid #eee;
  }
  .dropdown a {
    display: flex;
    align-items: center;
    padding: 0.75rem 1rem;
    color: #555;
    text-decoration: none;
    font-size: 0.9rem;
  }
  .dropdown a:hover {
    background: #f7f7f7;
    color: #00316b;
  }
  .dropdown a i {
    margin-right: 0.5rem;
    font-size: 1rem;
  }
</style>

<nav bind:this={navEl}>
  <ul class="nav-list">
    {#each tabs as tab}
      <li class="nav-item">
        {#if tab.nest}
          <a
            class="nav-link {isActive(tab, $page.url.pathname) ? 'active' : ''}"
            href="javascript:void(0)"
            role="button"
            aria-haspopup="true"
            aria-expanded={open.has(tab.key)}
            on:click={() => toggle(tab.key)}
            on:keydown={(e) => onKeyToggle(e, tab.key)}
          >
            <i class="material-icons">{tab.icon}</i>
            {tab.label}
          </a>
          {#if open.has(tab.key)}
            <div class="dropdown">
              <ul>
                {#each tab.children as child}
                  <li>
                    <a
                      href={child.dest}
                      on:click={(e) => { e.preventDefault(); go(child.dest); }}
                      class={isActive(child, $page.url.pathname) ? 'active' : ''}
                    >
                      <i class="material-icons">{child.icon}</i>
                      {child.label}
                    </a>
                  </li>
                {/each}
              </ul>
            </div>
          {/if}
        {:else}
          <a
            class="nav-link {isActive(tab, $page.url.pathname) ? 'active' : ''}"
            href={tab.dest}
            on:click={(e) => { e.preventDefault(); go(tab.dest); }}
          >
            <i class="material-icons">{tab.icon}</i>
            {tab.label}
          </a>
        {/if}
      </li>
    {/each}
  </ul>
</nav>
