<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
	let mobileMenuOpen = $state(false);

	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>On The Stack - Retro Code Blog</title>
	<meta name="description" content="A retro-themed developer blog exploring code, technology, and digital adventures at onthestack.io" />
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
				<a href="/blog" class="nav-link">Blog</a>
				<a href="/about" class="nav-link">About</a>
			</div>

			<!-- Mobile Menu Button -->
			<button class="mobile-menu-btn" onclick={toggleMobileMenu} aria-label="Toggle mobile menu">
				<span class="hamburger"></span>
				<span class="hamburger"></span>
				<span class="hamburger"></span>
			</button>
		</nav>

		<!-- Mobile Navigation -->
		{#if mobileMenuOpen}
			<div class="mobile-nav">
				<a href="/" class="mobile-nav-link" onclick={toggleMobileMenu}>Blog</a>
				<a href="/about" class="mobile-nav-link" onclick={toggleMobileMenu}>About</a>
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
						<a href="https://github.com" target="_blank" rel="noopener" class="footer-link">GitHub</a>
						<a href="https://twitter.com" target="_blank" rel="noopener" class="footer-link">Twitter</a>
						<a href="https://onthestack.io/rss.xml" class="footer-link">RSS</a>
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
	}

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
</style>
