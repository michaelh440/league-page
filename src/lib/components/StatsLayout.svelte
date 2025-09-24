<!--script>
  export let title = "";
  export let navItems = []; // [{label, href, active}]
</script>

<div class="page-layout">
  <!-- Sidebar >
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

  <!-- Main Content >
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
</style-->


<script>
  export let title = "";
  export let navItems = []; // [{label, href, active}]
  
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  
  let showMobileNav = false;
  let isMobile = false;
  
  onMount(() => {
    const checkMobile = () => {
      isMobile = window.innerWidth <= 768;
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  });
</script>

<div class="page-layout">
  <!-- Desktop Sidebar - Hidden on mobile -->
  <aside class="sidebar desktop-only">
    {#each navItems as item}
      <a
        href={item.href}
        class="nav-card {item.active ? 'active' : ''}"
      >
        {item.label}
      </a>
    {/each}
  </aside>

  <!-- Mobile Navigation Toggle -->
  {#if browser}
    <button 
      class="mobile-nav-toggle"
      class:open={showMobileNav}
      on:click={() => showMobileNav = !showMobileNav}
      aria-label="Toggle navigation menu"
    >
      <span class="hamburger-line"></span>
      <span class="hamburger-line"></span>
      <span class="hamburger-line"></span>
    </button>

    <!-- Mobile Navigation Overlay -->
    {#if showMobileNav}
      <div class="mobile-nav-overlay" on:click={() => showMobileNav = false}></div>
    {/if}

    <!-- Mobile Navigation Menu -->
    <nav class="mobile-nav {showMobileNav ? 'open' : 'closed'}">
      <div class="mobile-nav-header">
        <span class="mobile-nav-title">Navigation</span>
        <button 
          class="close-mobile-nav" 
          on:click={() => showMobileNav = false}
          aria-label="Close navigation"
        >
          ×
        </button>
      </div>
      <div class="mobile-nav-items">
        {#each navItems as item}
          <a
            href={item.href}
            class="mobile-nav-card {item.active ? 'active' : ''}"
            on:click={() => showMobileNav = false}
          >
            {item.label}
          </a>
        {/each}
      </div>
    </nav>
  {/if}

  <!-- Main Content -->
  <main class="content">
    <div class="content-header">
      {#if title}
        <h1 class="page-title">{title}</h1>
      {/if}
    </div>
    <slot />
  </main>
</div>

<style>
  .page-layout {
    display: flex;
    gap: 2rem;
    min-height: 100vh;
    position: relative;
  }

  /* Desktop Sidebar */
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
    width: 100%;
    max-width: 100%;
  }

  .content-header {
    text-align: center;
    margin-bottom: 1.5rem;
  }

  .page-title {
    font-size: 1.75rem;
    font-weight: bold;
    color: #212529;
    margin: 0;
  }

  /* Mobile Navigation */
  .mobile-nav-toggle {
    display: none;
    position: fixed;
    top: 1rem;
    right: 1rem;
    z-index: 1000;
    background: #007bff;
    border: none;
    border-radius: 6px;
    width: 48px;
    height: 48px;
    cursor: pointer;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    transition: all 0.3s ease;
  }

  .mobile-nav-toggle:hover {
    background: #0056b3;
  }

  .hamburger-line {
    width: 24px;
    height: 3px;
    background: white;
    border-radius: 2px;
    transition: all 0.3s ease;
  }

  .mobile-nav-toggle.open .hamburger-line:nth-child(1) {
    transform: rotate(45deg) translate(6px, 6px);
  }

  .mobile-nav-toggle.open .hamburger-line:nth-child(2) {
    opacity: 0;
  }

  .mobile-nav-toggle.open .hamburger-line:nth-child(3) {
    transform: rotate(-45deg) translate(6px, -6px);
  }

  .mobile-nav-overlay {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.5);
    z-index: 998;
  }

  .mobile-nav {
    display: none;
    position: fixed;
    top: 0;
    right: 0;
    width: 80%;
    max-width: 320px;
    height: 100vh;
    background: white;
    box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15);
    z-index: 999;
    transition: transform 0.3s ease;
    overflow-y: auto;
  }

  .mobile-nav.closed {
    transform: translateX(100%);
  }

  .mobile-nav.open {
    transform: translateX(0);
  }

  .mobile-nav-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #e9ecef;
    background: #f8f9fa;
  }

  .mobile-nav-title {
    font-weight: bold;
    font-size: 1.1rem;
    color: #495057;
  }

  .close-mobile-nav {
    background: none;
    border: none;
    font-size: 2rem;
    color: #6c757d;
    cursor: pointer;
    line-height: 1;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .close-mobile-nav:hover {
    color: #495057;
  }

  .mobile-nav-items {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .mobile-nav-card {
    display: block;
    padding: 1rem;
    text-align: left;
    font-weight: 500;
    text-decoration: none;
    color: #495057;
    background: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e9ecef;
    transition: all 0.2s ease;
  }

  .mobile-nav-card:hover {
    background: #e9ecef;
    color: #212529;
  }

  .mobile-nav-card.active {
    background: #007bff;
    color: white;
    border-color: #007bff;
  }

  /* Mobile Styles */
  @media (max-width: 768px) {
    .page-layout {
      flex-direction: column;
      gap: 0;
    }

    .desktop-only {
      display: none;
    }

    .mobile-nav-toggle {
      display: flex;
    }

    .mobile-nav-overlay {
      display: block;
    }

    .mobile-nav {
      display: block;
    }

    .content {
      padding: 1rem;
      margin-top: 0;
      width: 100%;
      max-width: 100vw;
      overflow-x: hidden;
    }

    .page-title {
      font-size: 1.5rem;
      margin-top: 0.5rem;
    }

    .content-header {
      margin-bottom: 1rem;
    }
  }

  /* Tablet Styles */
  @media (max-width: 1024px) and (min-width: 769px) {
    .sidebar {
      flex: 0 0 15%;
    }
    
    .nav-card {
      padding: 0.7rem;
      font-size: 0.9rem;
    }
  }
</style>