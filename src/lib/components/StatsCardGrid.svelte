<script>
  import Card from '$lib/components/StatCard.svelte';
  export let cards = []; // [{title, content}]
</script>

<div class="content-grid">
  {#each cards as card}
    <Card size="lg" title={card.title}>
      <p class="text-gray-600">{card.content ?? 'Coming Soon'}</p>
    </Card>
  {/each}
</div>

<style>
  .content-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
</style>
