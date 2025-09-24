<script lang="ts">
	import "../app.css";
	import favicon from "$lib/assets/my-favicon.png";

	let { children } = $props();
	let mobileMenuOpen = $state(false);
	let isDarkMode = $state(true); // Default to dark mode

	import whiteheaderImage from "$lib/assets/space-game-character-pixels_42117.png";
	import blackheaderImage from "$lib/assets/space-game-character-pixels_42117_dark.png";

	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}

	function toggleTheme() {
		isDarkMode = !isDarkMode;
		// Apply theme to document
		document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
		// Save preference to localStorage
		localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
	}

	// Initialize theme on mount
	function initializeTheme() {
		if (typeof window !== 'undefined') {
			const savedTheme = localStorage.getItem('theme');
			const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
			
			isDarkMode = savedTheme ? savedTheme === 'dark' : prefersDark;
			document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
		}
	}

	// Run on mount
	$effect(() => {
		initializeTheme();
	});

</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>On The Stack - Retro Code Blog</title>
	<meta
		name="description"
		content="A retro-themed developer blog exploring code, technology, and digital adventures at onthestack.io"
	/>
	<meta property="og:site_name" content="On The Stack" />
	<meta property="og:url" content="https://onthestack.io" />
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:site" content="@onthestack" />
	<link rel="canonical" href="https://onthestack.io" />
</svelte:head>

<div class="app">
	<header class="header">
		<nav class="nav container">
			<button 
				class="header-image theme-toggle" 
				onclick={toggleTheme}
				title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
				aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
			>
				<img
					src={isDarkMode ? whiteheaderImage : blackheaderImage}
					alt="Pixel character"
					class="header-img"
				/>
			</button>

			<div class="nav-brand">
				<a href="/" class="nav-logo">
					<span class="text-accent">&gt;</span>
					<span class="text-secondary">ON_THE</span>
					<span class="text-accent">_</span>
					<span class="animate-pulse">STACK</span>
				</a>
			</div>

			<!-- Desktop Navigation -->
			<div class="nav-links desktop-nav">
				<a href="/about" class="nav-link">About</a>

			</div>

			<!-- Mobile Menu Button -->
			<button
				class="mobile-menu-btn"
				onclick={toggleMobileMenu}
				aria-label="Toggle mobile menu"
			>
				<span class="hamburger"></span>
				<span class="hamburger"></span>
				<span class="hamburger"></span>
			</button>
		</nav>

		<!-- Mobile Navigation -->
		{#if mobileMenuOpen}
			<div class="mobile-nav">
				<a href="/" class="mobile-nav-link" onclick={toggleMobileMenu}
					>Blog</a
				>
				<a
					href="/about"
					class="mobile-nav-link"
					onclick={toggleMobileMenu}>About</a
				>

			</div>
		{/if}
	</header>

	<main class="main">
		{@render children()}
	</main>

	<footer class="footer">
		<div class="container">
			<div class="footer-content">
				<div class="footer-section">
					<p class="text-muted">
						&copy; 2025 On The Stack. Built with
						<span class="text-accent">SvelteKit</span> &
						<span class="text-secondary">❤️</span>
					</p>
				</div>
				<div class="footer-section">
					<div class="footer-links">
						<a
							href="https://github.com/patrickmfurbert"
							target="_blank"
							rel="noopener"
							class="footer-link">GitHub</a
						>
					</div>
				</div>
			</div>
		</div>
	</footer>
</div>

<style>
	.app {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.header {
		background-color: var(--color-bg-secondary);
		border-bottom: var(--border-width) solid var(--color-border);
		position: sticky;
		top: 0;
		z-index: 100;
	}

	.header-image {
		display: flex;
		align-items: center;
		margin-right: var(--spacing-md);
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
	}

	.header-img {
		height: 40px;
		width: auto;
		object-fit: contain;
		opacity: 0.9;
		transition: var(--transition-fast);
		image-rendering: pixelated; /* Keeps pixel art crisp */
		image-rendering: -moz-crisp-edges;
		image-rendering: crisp-edges;
	}

	.header-img:hover {
		opacity: 1;
		transform: scale(1.1);
	}

	.nav {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--spacing-md) 0;
	}

	.nav-logo {
		font-size: var(--font-size-xl);
		font-weight: 700;
		letter-spacing: 2px;
	}

	.nav-logo:hover {
		border-bottom: none;
	}

	.desktop-nav {
		display: flex;
		gap: var(--spacing-xl);
		align-items: center;
	}

	/* Review and edit/remove */
	/* .theme-toggle {
		background: none;
		border: 2px solid var(--color-border);
		color: var(--color-text-primary);
		font-size: 1.2em;
		padding: var(--spacing-xs) var(--spacing-sm);
		border-radius: var(--border-radius);
		cursor: pointer;
		transition: var(--transition-fast);
		margin-left: var(--spacing-md);
	}

	.theme-toggle:hover {
		background-color: var(--color-bg-tertiary);
		border-color: var(--color-accent);
		transform: scale(1.1);
	} */

	.nav-link {
		font-weight: 600;
		padding: var(--spacing-sm) var(--spacing-md);
		border-radius: var(--border-radius);
		transition: var(--transition-fast);
		text-transform: uppercase;
		letter-spacing: 1px;
	}

	.nav-link:hover {
		background-color: var(--color-bg-tertiary);
		border-bottom: none;
	}

	.mobile-menu-btn {
		display: none;
		flex-direction: column;
		background: none;
		border: none;
		cursor: pointer;
		padding: var(--spacing-sm);
		gap: 4px;
	}

	.hamburger {
		width: 25px;
		height: 3px;
		background-color: var(--color-text-primary);
		border-radius: 2px;
		transition: var(--transition-fast);
	}

	.mobile-nav {
		display: none;
		background-color: var(--color-bg-tertiary);
		border-top: 1px solid var(--color-border);
		padding: var(--spacing-md);
	}

	.mobile-nav-link {
		display: block;
		padding: var(--spacing-md);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 1px;
		border-bottom: 1px solid var(--color-border);
	}

	.mobile-nav-link:last-child {
		border-bottom: none;
	}

	/* .mobile-theme-toggle {
		display: block;
		width: 100%;
		background: none;
		border: 2px solid var(--color-border);
		color: var(--color-text-primary);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 1px;
		padding: var(--spacing-md);
		margin-top: var(--spacing-sm);
		border-radius: var(--border-radius);
		cursor: pointer;
		transition: var(--transition-fast);
	}

	.mobile-theme-toggle:hover {
		background-color: var(--color-bg-secondary);
		border-color: var(--color-accent);
	} */

	.main {
		flex: 1;
		padding: var(--spacing-2xl) 0;
	}

	.footer {
		background-color: var(--color-bg-secondary);
		border-top: var(--border-width) solid var(--color-border);
		padding: var(--spacing-xl) 0;
		margin-top: auto;
	}

	.footer-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--spacing-md);
	}

	.footer-links {
		display: flex;
		gap: var(--spacing-lg);
	}

	.footer-link {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
	}

	.footer-link:hover {
		color: var(--color-text-secondary);
	}

		
	:global(.post-content p:has(img) img) {
		display: block;
		max-width: 100%;
		height: auto;
		border: 1px solid var(--border);
		border-radius: 4px;
		margin: 2rem auto;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	:global(.post-content p:has(em):has(img) em) {
		display: block;
		text-align: center;
		font-size: 0.875rem;
		color: var(--text-muted);
		margin-top: -1.5rem;
		margin-bottom: 2rem;
		font-style: italic;
	}

	/* Mobile Styles */
	@media (max-width: 640px) {
		.desktop-nav {
			display: none;
		}

		.mobile-menu-btn {
			display: flex;
		}

		.mobile-nav {
			display: block;
		}

		.nav {
			padding: var(--spacing-sm) 0;
		}

		.nav-logo {
			font-size: var(--font-size-lg);
		}

		.footer-content {
			flex-direction: column;
			text-align: center;
		}

		.footer-links {
			justify-content: center;
		}

		.main {
			padding: var(--spacing-lg) 0;
		}
	}

	@media (min-width: 641px) {
		.mobile-nav {
			display: none !important;
		}
	}

	/* Mobile adjustments */
	@media (max-width: 640px) {
		.header-image {
			margin-left: var(--spacing-sm);
			margin-right: -var(--spacing-sm);
		}

		.header-img {
			height: 32px; /* Slightly smaller on mobile */
		}
	}
</style>
