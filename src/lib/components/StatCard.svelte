<script>
    export let title = "";
    export let subtitle = "";
    export let active = false;
    export let clickable = false;
    export let size = "base"; // "base" for nav, "lg" for main content
</script>

<div
    class="rounded-xl shadow-md bg-white p-4 mb-4 
        {clickable ? 'cursor-pointer hover:shadow-lg transition' : ''} 
        {active ? 'border-2 border-blue-600' : 'border border-gray-200'}"
>
    {#if title}
        <div class="{size === 'lg' ? 'text-lg font-bold' : 'text-sm font-medium'}">
            {title}
        </div>
    {/if}

    {#if subtitle}
        <p class="text-xs text-gray-500 mt-1">{subtitle}</p>
    {/if}

    <slot />
</div>
