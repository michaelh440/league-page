<script>
	import { goto } from '$app/navigation';
    import { managers } from '$lib/utils/helper';
	import { tabs } from '$lib/utils/tabs';
	import { onMount } from 'svelte';

	let outOfDate = false;

    let el, footerHeight;

    let innerWidth;

    const resize = (e, delay) => {
        const bottom = el?.getBoundingClientRect().bottom;
        const top = el?.getBoundingClientRect().top;
        if(delay) {
            setTimeout(() => {
                resize(e, false);
            }, 100)
        } else {
            footerHeight = bottom - top;
        }
    }

	onMount(async () => {
		const res = await fetch('/api/checkVersion', {compress: true})
		const needUpdate = await res.json();
		outOfDate = needUpdate;
        resize(el?.getBoundingClientRect(), true);
	})

    let managersOutOfDate = false;
    if(managers) {
        for(const manager of managers) {
            if(manager.roster && !manager.managerID) {
                managersOutOfDate = true;
                resize(el?.getBoundingClientRect(), true);
                break;
            }
        }
    }

	const year = new Date().getFullYear();

    // Main navigation items
    const mainNavItems = [
        { label: "Home", dest: "/" },
        { label: "Current Season", dest: "/current" },
        { label: "League All Time Stats", dest: "/league" },
        { label: "Manager All Time Stats", dest: "/managers" }
    ];

    $: resize(el?.getBoundingClientRect(), false, innerWidth);
</script>

<svelte:window bind:innerWidth={innerWidth} />

<style>
	footer {
		background-color: var(--f8f8f8);
		width: 100%;
        display: block;
        position: absolute;
        bottom: 0;
		z-index: 1;
		border-top: 1px solid #920505;
		padding: 30px 0 60px;
		text-align: center;
		color: #777;
	}

	#mainNavigation {
		margin: 0 0 1.5em;
		padding-bottom: 1em;
		border-bottom: 1px solid #ddd;
	}

	#mainNavigation ul {
		margin: 0;
		padding: 0;
	}

	#mainNavigation ul li {
		list-style-type: none;
		display: inline;
	}

	#mainNavigation li:not(:first-child):before {
		content: " | ";
	}

	#navigation {
		margin: 0 0 2em;
	}

	#navigation ul {
		margin: 0;
		padding: 0;
	}

	#navigation ul li {
		list-style-type: none;
		display: inline;
	}

	#navigation li:not(:first-child):before {
		content: " | ";
	}

	.navLink {
		display: inline-block;
		cursor: pointer;
		padding: 6px 10px;
	}

	.navLink:hover {
		color: #920505;
	}

	.mainNavLink {
		display: inline-block;
		cursor: pointer;
		padding: 8px 12px;
		font-weight: 600;
		font-size: 1.1em;
	}

	.mainNavLink:hover {
		color: #920505;
	}

	.updateNotice {
		color: var(--g999);
		font-style: italic;
		font-size: 0.8em;
		margin-top: 0;
	}

	.navigation-section {
		margin-bottom: 1em;
	}

	.section-label {
		font-size: 0.9em;
		color: #999;
		margin-bottom: 0.5em;
		text-transform: uppercase;
		letter-spacing: 1px;
	}
</style>

<div class="footerSpacer" style="height: {footerHeight}px;" />

<!-- footer with update notice -->
<footer bind:this={el}>
    {#if outOfDate}
	    <p class="updateNotice">There is an update available for your League Page. <a href="https://github.com/nmelhado/league-page/blob/master/TRAINING_WHEELS.md#iv-updates">Follow the Update Instructions</a> to get all of the newest features!</p>
    {/if}
    {#if managersOutOfDate}
	    <p class="updateNotice">Your managers page needs an update, <a href="https://github.com/nmelhado/league-page/blob/master/TRAINING_WHEELS.md#2-add-managers">please follow the instructions</a> to get the most up-to-date experience.</p>
    {/if}

	<!-- Main Navigation -->
	<div id="mainNavigation" class="navigation-section">
		<div class="section-label"></div>
		<ul>
			{#each mainNavItems as navItem}
				<li><div class="mainNavLink" onclick={() => goto(navItem.dest)}>{navItem.label}</div></li>
			{/each}
		</ul>
	</div>

	<!-- PLEASE DO NOT REMOVE THE COPYRIGHT -->
	<span class="copyright">&copy; 2025 - {year} Houston Fantasy Football League </span>
	<br />
	<!-- PLEASE DO NOT REMOVE THE BUILT BY -->
	<span class="creator">Based on Sleeper API Work and General Site Design of <!--a href="http://www.nmelhado.com/"-->Nicholas Melhado<!--/a--><br /></span>
	<!-- You can remove the donation link (although any donations to help
	 maintain and enhance League Page would be greatly appreciated!) -->

</footer>