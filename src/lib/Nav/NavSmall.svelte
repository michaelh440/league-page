<!--script>
	import { tabs } from '$lib/utils/tabs';
	import Drawer, {
	  Content,
	  Header,
	  Title,
	} from '@smui/drawer';
	import { Icon } from '@smui/tab';
  	import List, { Item, Text, Graphic, Separator, Subheader } from '@smui/list';
	import { goto, preloadData } from '$app/navigation';
    import { page } from '$app/state';
	import { leagueName } from '$lib/utils/helper';
	import { enableBlog, managers } from '$lib/utils/leagueInfo';

	let active = $state(page.url.pathname);

	let open = $state(false);

	const selectTab = (tab) => {
		open = false;
		goto(tab.dest);
	}
</script>

<style>
	:global(.menuIcon) {
		position: absolute;
		top: 15px;
		left: 15px;
		font-size: 2em;
		color: #888;
		padding: 6px;
		cursor: pointer;
	}

	:global(.menuIcon:hover) {
		color: #00316b;
	}

	:global(.nav-drawer) {
		z-index: 9;
		top: 0;
		left: 0;
	}

	:global(.nav-item) {
		color: #858585 !important;
	}

	.nav-back {
		position: fixed;
		z-index: 8;
		width: 100%;
		width: 100vw;
		height: 100%;
		height: 100vh;
		top: 0;
		left: 0;
		background-color: rgba(0, 0, 0, 0.32);
		transition: all 0.7s;
	}
</style>

<Icon class="material-icons menuIcon" onclick={() => open = true} ripple={false} touch={true}>menu</Icon>

<div class="nav-back" style="pointer-events: {open ? "visible" : "none"}; opacity: {open ? 1 : 0};" onclick={() => open = false}></div>

<Drawer variant="modal" class="nav-drawer" fixed={true} bind:open>
	<Header>
		<Title>{leagueName}</Title>
	</Header>
	<Content>
		<List>
			{#each tabs as tab}
				{#if !tab.nest && (tab.label != 'Blog' || (tab.label == 'Blog' && enableBlog))}
					<Item href="javascript:void(0)" onSMUIAction={() => selectTab(tab)} ontouchstart={() => preloadData(tab.dest)} onmouseover={() => preloadData(tab.dest)} activated={active == tab.dest} >
						<Graphic class="material-icons{active == tab.dest ? "" : " nav-item"}" aria-hidden="true">{tab.icon}</Graphic>
						<Text class="{active == tab.dest ? "" : "nav-item"}">{tab.label}</Text>
					</Item>
				{/if}
			{/each}
			{#each tabs as tab}
				{#if tab.nest}
					<Separator />
					<Subheader>{tab.label}</Subheader>
					{#each tab.children as subTab}
						{#if subTab.label == 'Managers'}
							{#if managers.length}
								<Item href="javascript:void(0)" onSMUIAction={() => selectTab(subTab)} activated={active == subTab.dest}  ontouchstart={() => preloadData(subTab.dest)} onmouseover={() => preloadData(subTab.dest)}>
									<Graphic class="material-icons{active == subTab.dest ? "" : " nav-item"}" aria-hidden="true">{subTab.icon}</Graphic>
									<Text class="{active == subTab.dest ? "" : "nav-item"}">{subTab.label}</Text>
								</Item>
							{/if}
						{:else}
							<Item href="javascript:void(0)" onSMUIAction={() => selectTab(subTab)} activated={active == subTab.dest}  ontouchstart={() => {if(subTab.label != 'Go to Sleeper') preloadData(subTab.dest)}} onmouseover={() => {if(subTab.label != 'Go to Sleeper') preloadData(subTab.dest)}}>
								<Graphic class="material-icons{active == subTab.dest ? "" : " nav-item"}" aria-hidden="true">{subTab.icon}</Graphic>
								<Text class="{active == subTab.dest ? "" : "nav-item"}">{subTab.label}</Text>
							</Item>
						{/if}
					{/each}
				{/if}
			{/each}
		</List>
	</Content>
  </Drawer-->
	



  <!--script>
  import { tabs } from '$lib/utils/tabs';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount, onDestroy } from 'svelte';

  let open = false;
  let drawerEl;

  function toggleDrawer() {
    open = !open;
  }

  function go(href) {
    open = false;
    goto(href);
  }

  // close on Escape
  function onKey(e) {
    if (e.key === 'Escape') {
      open = false;
    }
  }

  onMount(() => document.addEventListener('keydown', onKey));
  onDestroy(() => document.removeEventListener('keydown', onKey));

  function isActive(tab) {
    return $page.url.pathname === tab.dest ||
      (tab.nest && tab.children?.some((c) => c.dest === $page.url.pathname));
  }
</script>

<!-- Hamburger icon >
<button class="menu-btn" on:click={toggleDrawer} aria-label="Open navigation">
  <span class="material-icons">menu</span>
</button>

<!-- Overlay >
<div class="overlay {open ? 'show' : ''}" on:click={() => open = false}></div>

<!-- Drawer >
<aside class="drawer {open ? 'open' : ''}" bind:this={drawerEl} role="navigation">
  <div class="drawer-header">
    <h2 class="drawer-title">League Menu</h2>
    <button class="close-btn" on:click={() => open = false} aria-label="Close navigation">
      <span class="material-icons">close</span>
    </button>
  </div>

  <ul class="drawer-list">
    {#each tabs as tab}
      <li>
        {#if tab.nest}
          <p class="drawer-subheader">{tab.label}</p>
          <ul class="drawer-sublist">
            {#each tab.children as c}
              <li>
                <a
                  href={c.dest}
                  class="drawer-link {isActive(c) ? 'active' : ''}"
                  on:click|preventDefault={() => go(c.dest)}
                >
                  <span class="material-icons drawer-icon">{c.icon}</span>
                  <span>{c.label}</span>
                </a>
              </li>
            {/each}
          </ul>
        {:else}
          <a
            href={tab.dest}
            class="drawer-link {isActive(tab) ? 'active' : ''}"
            on:click|preventDefault={() => go(tab.dest)}
          >
            <span class="material-icons drawer-icon">{tab.icon}</span>
            <span>{tab.label}</span>
          </a>
        {/if}
      </li>
    {/each}
  </ul>
</aside>

<style>
  :root {
    --nav-active: #00316b;
    --nav-inactive: #6c757d;
    --overlay-bg: rgba(0,0,0,0.4);
  }

  .menu-btn {
    position: absolute;
    top: 12px;
    left: 12px;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--nav-inactive);
    font-size: 2rem;
  }

  .menu-btn:hover {
    color: var(--nav-active);
  }

  .overlay {
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    background: var(--overlay-bg);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s;
    z-index: 30;
  }

  .overlay.show {
    opacity: 1;
    pointer-events: auto;
  }

  .drawer {
    position: fixed;
    top: 0; left: 0;
    height: 100%;
    width: 260px;
    background: #fff;
    box-shadow: 2px 0 12px rgba(0,0,0,0.2);
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    z-index: 40;
    display: flex;
    flex-direction: column;
  }

  .drawer.open {
    transform: translateX(0);
  }

  .drawer-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid #ddd;
  }

  .drawer-title {
    font-size: 1.1rem;
    margin: 0;
  }

  .close-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--nav-inactive);
    font-size: 1.5rem;
  }

  .drawer-list {
    list-style: none;
    padding: 0;
    margin: 0;
    flex: 1;
    overflow-y: auto;
  }

  .drawer-link {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.75rem 1rem;
    text-decoration: none;
    color: var(--nav-inactive);
    border-left: 3px solid transparent;
    transition: background 0.2s, color 0.2s, border-color 0.2s;
  }

  .drawer-link.active {
    color: var(--nav-active);
    border-left-color: var(--nav-active);
    font-weight: 600;
  }

  .drawer-link:hover {
    background: #f2f6ff;
    color: var(--nav-active);
  }

  .drawer-icon {
    font-size: 20px;
  }

  .drawer-subheader {
    font-weight: bold;
    padding: 0.75rem 1rem 0.25rem 1rem;
    font-size: 0.85rem;
    color: #444;
  }

  .drawer-sublist {
    list-style: none;
    margin: 0;
    padding: 0;
  }
</style-->

<script>
  import { tabs } from '$lib/utils/tabs';
  import { goto, preloadData } from '$app/navigation';
  import { page } from '$app/state';
  import { leagueName } from '$lib/utils/helper';
  import { enableBlog, managers } from '$lib/utils/leagueInfo';
  import { browser } from '$app/environment';

  let active = $state(page.url.pathname);
  let open = $state(false);

  const selectTab = (tab) => {
    open = false;
    goto(tab.dest);
  };

  // Close menu on escape key
  if (browser) {
    const handleKeydown = (e) => {
      if (e.key === 'Escape' && open) {
        open = false;
      }
    };
    document.addEventListener('keydown', handleKeydown);
  }
</script>

<style>
  .menu-icon {
    position: fixed;
    top: 15px;
    left: 15px;
    font-size: 2em;
    color: #666;
    padding: 8px;
    cursor: pointer;
    z-index: 10;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 50%;
    backdrop-filter: blur(5px);
    transition: all 0.2s ease;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
  }

  .menu-icon:hover {
    color: #00316b;
    background: rgba(255, 255, 255, 1);
    transform: scale(1.05);
  }

  .menu-icon:active {
    transform: scale(0.95);
  }

  .nav-overlay {
    position: fixed;
    z-index: 8;
    width: 100vw;
    height: 100vh;
    top: 0;
    left: 0;
    background-color: rgba(0, 0, 0, 0.4);
    transition: all 0.3s ease;
    backdrop-filter: blur(2px);
  }

  .nav-drawer {
    position: fixed;
    z-index: 9;
    top: 0;
    width: 280px;
    height: 100vh;
    background: linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%);
    box-shadow: 2px 0 20px rgba(0, 0, 0, 0.15);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow-y: auto;
  }

  .nav-drawer.closed {
    transform: translateX(-100%);
  }

  .nav-drawer.open {
    transform: translateX(0);
  }

  .nav-header {
    padding: 1.5rem 1rem;
    font-weight: 700;
    font-size: 1.2rem;
    color: #003366;
    border-bottom: 2px solid #e9ecef;
    background: linear-gradient(135deg, #003366 0%, #00316b 100%);
    color: white;
    margin-bottom: 0.5rem;
  }

  .nav-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .nav-item {
    display: flex;
    align-items: center;
    padding: 0.875rem 1rem;
    cursor: pointer;
    color: #495057;
    transition: all 0.2s ease;
    border-left: 3px solid transparent;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    position: relative;
  }

  .nav-item:hover {
    background: rgba(0, 123, 255, 0.08);
    color: #00316b;
    border-left-color: rgba(0, 123, 255, 0.3);
  }

  .nav-item:active {
    background: rgba(0, 123, 255, 0.15);
  }

  .nav-item.active {
    background: rgba(0, 123, 255, 0.1);
    color: #00316b;
    border-left-color: #007bff;
    font-weight: 600;
  }

  .nav-item.active::before {
    content: '';
    position: absolute;
    right: 1rem;
    width: 6px;
    height: 6px;
    background: #007bff;
    border-radius: 50%;
  }

  .nav-item-icon {
    margin-right: 12px;
    font-size: 1.2rem;
    width: 24px;
    text-align: center;
    color: inherit;
  }

  .nav-item-text {
    font-size: 0.95rem;
    color: inherit;
  }

  .nav-section {
    padding: 1rem 1rem 0.5rem;
    font-weight: 600;
    font-size: 0.85rem;
    color: #6c757d;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-top: 1px solid #e9ecef;
    margin-top: 0.5rem;
  }

  .nav-section:first-of-type {
    border-top: none;
    margin-top: 0;
  }

  /* Mobile specific improvements */
  @media (max-width: 768px) {
    .nav-drawer {
      width: 100vw;
      max-width: 320px;
    }

    .nav-item {
      padding: 1rem;
      min-height: 48px; /* Better touch targets */
    }

    .nav-item-icon {
      font-size: 1.3rem;
      margin-right: 16px;
    }

    .nav-item-text {
      font-size: 1rem;
    }
  }

  /* Safe area for notched phones */
  @media (max-width: 768px) and (orientation: portrait) {
    .nav-header {
      padding-top: max(1.5rem, env(safe-area-inset-top));
    }
  }
</style>

<!-- Menu button -->
<button 
  class="menu-icon material-icons" 
  on:click={() => open = true}
  aria-label="Open navigation menu"
>
  menu
</button>

<!-- Overlay -->
{#if open}
  <div
    class="nav-overlay"
    on:click={() => open = false}
    on:keydown={() => {}}
    role="button"
    tabindex="-1"
    aria-label="Close navigation menu"
  ></div>
{/if}

<!-- Navigation drawer -->
{#if browser}
  <nav class="nav-drawer {open ? 'open' : 'closed'}" role="navigation" aria-label="Main navigation">
    <header class="nav-header">
      {leagueName}
    </header>
    
    <ul class="nav-list">
      <!-- Main navigation items -->
      {#each tabs as tab}
        {#if !tab.nest && (tab.label != 'Blog' || (tab.label == 'Blog' && enableBlog))}
          <li>
            <div
              class="nav-item {active == tab.dest ? 'active' : ''}"
              on:click={() => selectTab(tab)}
              on:touchstart={() => preloadData(tab.dest)}
              on:mouseover={() => preloadData(tab.dest)}
              on:keydown={(e) => e.key === 'Enter' && selectTab(tab)}
              role="button"
              tabindex="0"
            >
              <span class="material-icons nav-item-icon">{tab.icon}</span>
              <span class="nav-item-text">{tab.label}</span>
            </div>
          </li>
        {/if}
      {/each}

      <!-- Nested sections -->
      {#each tabs as tab}
        {#if tab.nest}
          <li class="nav-section">{tab.label}</li>
          {#each tab.children as subTab}
            {#if subTab.label == 'Managers' && managers.length}
              <li>
                <div
                  class="nav-item {active == subTab.dest ? 'active' : ''}"
                  on:click={() => selectTab(subTab)}
                  on:keydown={(e) => e.key === 'Enter' && selectTab(subTab)}
                  role="button"
                  tabindex="0"
                >
                  <span class="material-icons nav-item-icon">{subTab.icon}</span>
                  <span class="nav-item-text">{subTab.label}</span>
                </div>
              </li>
            {:else if subTab.label != 'Managers'}
              <li>
                <div
                  class="nav-item {active == subTab.dest ? 'active' : ''}"
                  on:click={() => selectTab(subTab)}
                  on:keydown={(e) => e.key === 'Enter' && selectTab(subTab)}
                  role="button"
                  tabindex="0"
                >
                  <span class="material-icons nav-item-icon">{subTab.icon}</span>
                  <span class="nav-item-text">{subTab.label}</span>
                </div>
              </li>
            {/if}
          {/each}
        {/if}
      {/each}
    </ul>
  </nav>
{/if}