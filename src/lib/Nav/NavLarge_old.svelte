<script>
  import { tabs } from '$lib/utils/tabs';
  import Tab, { Icon, Label } from '@smui/tab';
  import List, { Item, Graphic, Text, Separator } from '@smui/list';
  import TabBar from '@smui/tab-bar';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { enableBlog } from '$lib/utils/leagueInfo';

  // Determine initial active tab
  let active = $state(
    tabs.find(
      (tab) =>
        tab.dest === page.url.pathname ||
        (tab.nest &&
          tab.children.some((subTab) => subTab.dest === page.url.pathname))
    )
  );

  // Track which nested menu is open
  let openKey = $state(active?.key || null);

  function toggle(tab) {
    openKey = openKey === tab.key ? null : tab.key;
  }
</script>

<nav>
  <TabBar>
    {#each tabs as tab}
      {#if tab.nest}
        <div>
          <button on:click={() => toggle(tab)} class="nested-button">
            <Icon>{tab.icon}</Icon>
            <Label>{tab.label}</Label>
          </button>

          {#if openKey === tab.key}
            <List>
              {#each tab.children as child}
                <Item on:click={() => goto(child.dest)}>
                  <Graphic>{child.icon}</Graphic>
                  <Text>{child.label}</Text>
                </Item>
              {/each}
            </List>
          {/if}
        </div>
      {:else}
        <Item on:click={() => goto(tab.dest)}>
          <Graphic>{tab.icon}</Graphic>
          <Text>{tab.label}</Text>
        </Item>
      {/if}
    {/each}
  </TabBar>
</nav>

<style>
  nav {
    display: flex;
    flex-direction: column;
  }

  .nested-button {
    display: flex;
    align-items: center;
    width: 100%;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.5rem;
    font-size: 1rem;
    text-align: left;
  }
</style>
