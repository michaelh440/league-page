<script>
	import { page } from '$app/stores';
	
	// Current route for active link highlighting
	$: currentPath = $page.url.pathname;
	
	// Navigation items
	const navItems = [
		{ href: '/admin', label: 'Dashboard', icon: '📊' },
		{ href: '/admin/seasons', label: 'Seasons', icon: '📅' },
		{ href: '/admin/weekly-summary', label: 'Weekly Summary', icon: '📝' },
		{ href: '/admin/managers', label: 'Managers', icon: '👥' },
		{ href: '/admin/settings', label: 'Settings', icon: '⚙️' }
	];
	
	function isActive(path) {
		if (path === '/admin') {
			return currentPath === '/admin';
		}
		return currentPath.startsWith(path);
	}
</script>

<div class="min-h-screen bg-gray-50">
	<!-- Top Navigation Bar -->
	<nav class="bg-white border-b border-gray-200 sticky top-0 z-10">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between h-16">
				<!-- Left: Logo and Nav -->
				<div class="flex">
					<!-- Logo -->
					<div class="flex-shrink-0 flex items-center">
						<a href="/" class="text-xl font-bold text-gray-900">
							⚡ Fantasy League
						</a>
						<span class="ml-3 px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded">
							ADMIN
						</span>
					</div>
					
					<!-- Desktop Navigation -->
					<div class="hidden sm:ml-6 sm:flex sm:space-x-4">
						{#each navItems as item}
							<a
								href={item.href}
								class="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
									{isActive(item.href) 
										? 'bg-blue-50 text-blue-700' 
										: 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}"
							>
								<span class="mr-2">{item.icon}</span>
								{item.label}
							</a>
						{/each}
					</div>
				</div>
				
				<!-- Right: User Menu -->
				<div class="flex items-center space-x-4">
					<a
						href="/"
						class="text-sm text-gray-600 hover:text-gray-900"
					>
						← Back to Site
					</a>
					
					<!-- Future: User dropdown -->
					<div class="flex items-center space-x-2">
						<div class="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
							A
						</div>
					</div>
				</div>
			</div>
		</div>
		
		<!-- Mobile Navigation -->
		<div class="sm:hidden border-t border-gray-200">
			<div class="px-2 pt-2 pb-3 space-y-1">
				{#each navItems as item}
					<a
						href={item.href}
						class="block px-3 py-2 text-base font-medium rounded-md transition-colors
							{isActive(item.href) 
								? 'bg-blue-50 text-blue-700' 
								: 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}"
					>
						<span class="mr-2">{item.icon}</span>
						{item.label}
					</a>
				{/each}
			</div>
		</div>
	</nav>
	
	<!-- Main Content Area -->
	<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		<slot />
	</main>
	
	<!-- Footer -->
	<footer class="bg-white border-t border-gray-200 mt-12">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
			<div class="flex justify-between items-center text-sm text-gray-600">
				<div>
					<p>Fantasy Football League Admin Panel</p>
				</div>
				<div>
					<p>© {new Date().getFullYear()} All rights reserved</p>
				</div>
			</div>
		</div>
	</footer>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
	}
</style>