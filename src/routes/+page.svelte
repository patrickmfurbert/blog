<script lang="ts">
	import type { PageData } from './$types';
	
	let { data } = $props() as { data: PageData };
</script>

<svelte:head>
	<title>On The Stack - Welcome to the Terminal</title>
	<meta name="description" content="A retro-themed developer blog exploring code, technology, and digital adventures. Step into the terminal at onthestack.io and explore the world of programming." />
	<meta property="og:title" content="On The Stack - Welcome to the Terminal" />
	<meta property="og:description" content="A retro-themed developer blog exploring code, technology, and digital adventures." />
	<meta property="og:url" content="https://onthestack.io" />
	<link rel="canonical" href="https://onthestack.io" />
</svelte:head>

<div class="hero">
	<div class="container">
		<div class="hero-content">
			<div class="terminal-window">
				<div class="terminal-header">
					<div class="terminal-controls">
						<span class="terminal-dot red"></span>
						<span class="terminal-dot yellow"></span>
						<span class="terminal-dot green"></span>
					</div>
					<div class="terminal-title">onthestack@terminal:~$</div>
				</div>
				<div class="terminal-body">
					<div class="terminal-line">
						<span class="prompt">$</span>
						<span class="command">whoami</span>
					</div>
					<div class="terminal-output">developer@onthestack.io</div>
					
					<div class="terminal-line">
						<span class="prompt">$</span>
						<span class="command">ls -la blog/</span>
					</div>
					<div class="terminal-output">
						{#each data.posts as post}
							<div class="file-entry">
								<span class="permissions">-rw-r--r--</span>
								<span class="date">{new Date(post.date).toLocaleDateString()}</span>
								<a href="/blog/{post.slug}" class="filename">{post.title}</a>
							</div>
						{/each}
					</div>
					
					<div class="terminal-line">
						<span class="prompt">$</span>
						<span class="command typing">echo "Welcome to onthestack.io..."</span>
						<span class="cursor animate-pulse">|</span>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<!-- <section class="features">
	<div class="container">
		<h2 class="text-center mb-8">
			<span class="text-accent">&lt;</span>
			Features
			<span class="text-accent">/&gt;</span>
		</h2>
		
		<div class="features-grid">
			<div class="feature-card card">
				<h3 class="text-secondary">📝 Markdown Powered</h3>
				<p>Write your posts in markdown with full support for code syntax highlighting and custom components.</p>
			</div>
			
			<div class="feature-card card">
				<h3 class="text-accent">🚀 Lightning Fast</h3>
				<p>Built with SvelteKit for optimal performance and seamless navigation between pages.</p>
			</div>
			
			<div class="feature-card card">
				<h3 class="text-secondary">📱 Mobile First</h3>
				<p>Responsive design that looks great on all devices, from smartphones to desktop displays.</p>
			</div>
			
			<div class="feature-card card">
				<h3 class="text-accent">🎨 Retro Aesthetic</h3>
				<p>Classic terminal-inspired design with a modern twist and smooth animations.</p>
			</div>
		</div>
	</div>
</section>

<section class="tech-stack">
	<div class="container">
		<h2 class="text-center mb-8">Tech Stack</h2>
		<div class="tech-grid">
			<div class="tech-item">
				<div class="tech-icon">⚡</div>
				<span>SvelteKit</span>
			</div>
			<div class="tech-item">
				<div class="tech-icon">📝</div>
				<span>MDsveX</span>
			</div>
			<div class="tech-item">
				<div class="tech-icon">🎨</div>
				<span>CSS3</span>
			</div>
			<div class="tech-item">
				<div class="tech-icon">📦</div>
				<span>TypeScript</span>
			</div>
			<div class="tech-item">
				<div class="tech-icon">🚀</div>
				<span>Netlify</span>
			</div>
		</div>
	</div>
</section> -->

<section class="cta">
	<div class="container text-center">
		<h2 class="mb-4">Ready to Dive Into the Code?</h2>
		<p class="mb-8 text-lg text-muted">
			Explore the latest posts about web development, programming tips, and technology insights.
		</p>
		<div class="cta-buttons">
			<a href="/blog" class="btn btn-accent">Browse All Posts</a>
			<a href="/about" class="btn btn-secondary">Learn More</a>
		</div>
	</div>
</section>

<style>
	.hero {
		padding: var(--spacing-3xl) 0;
		background: linear-gradient(135deg, var(--color-bg-primary) 0%, var(--color-bg-secondary) 100%);
	}

	.hero-content {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 60vh;
	}

	.terminal-window {
		background-color: var(--color-bg-secondary);
		border: var(--border-width) solid var(--color-border);
		border-radius: var(--border-radius);
		max-width: 800px;
		width: 100%;
		box-shadow: var(--shadow-glow);
	}

	.terminal-header {
		background-color: var(--color-bg-tertiary);
		padding: var(--spacing-md);
		border-bottom: 1px solid var(--color-border);
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
		border-radius: var(--border-radius) var(--border-radius) 0 0;
	}

	.terminal-controls {
		display: flex;
		gap: var(--spacing-sm);
	}

	.terminal-dot {
		width: 12px;
		height: 12px;
		border-radius: 50%;
	}

	.red { background-color: #ff5f56; }
	.yellow { background-color: #ffbd2e; }
	.green { background-color: #27ca3f; }

	.terminal-title {
		color: var(--color-text-muted);
		font-size: var(--font-size-sm);
	}

	.terminal-body {
		padding: var(--spacing-lg);
		font-family: var(--font-mono);
	}

	.terminal-line {
		margin-bottom: var(--spacing-sm);
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
	}

	.prompt {
		color: var(--color-accent);
		font-weight: bold;
	}

	.command {
		color: var(--color-text-primary);
	}

	.typing {
		color: var(--color-accent-secondary);
	}

	.cursor {
		color: var(--color-accent);
		font-weight: bold;
	}

	.terminal-output {
		margin: var(--spacing-sm) 0 var(--spacing-md) var(--spacing-lg);
		color: var(--color-text-secondary);
	}

	.file-entry {
		display: flex;
		gap: var(--spacing-md);
		margin-bottom: var(--spacing-xs);
		font-size: var(--font-size-sm);
	}

	.permissions {
		color: var(--color-text-muted);
		min-width: 80px;
	}

	.date {
		color: var(--color-text-muted);
		min-width: 100px;
	}

	.filename {
		color: var(--color-accent-secondary);
	}

	.features {
		padding: var(--spacing-3xl) 0;
	}

	.features-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: var(--spacing-xl);
	}

	.feature-card {
		text-align: center;
	}

	.feature-card h3 {
		margin-bottom: var(--spacing-md);
	}

	.tech-stack {
		padding: var(--spacing-3xl) 0;
		background-color: var(--color-bg-secondary);
	}

	.tech-grid {
		display: flex;
		justify-content: center;
		flex-wrap: wrap;
		gap: var(--spacing-xl);
	}

	.tech-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-lg);
		background-color: var(--color-bg-tertiary);
		border: 1px solid var(--color-border);
		border-radius: var(--border-radius);
		transition: var(--transition-slow);
	}

	.tech-item:hover {
		border-color: var(--color-border-hover);
		transform: translateY(-2px);
	}

	.tech-icon {
		font-size: var(--font-size-2xl);
	}

	.cta {
		padding: var(--spacing-3xl) 0;
	}

	.cta-buttons {
		display: flex;
		justify-content: center;
		gap: var(--spacing-lg);
		flex-wrap: wrap;
	}

	/* Mobile Styles */
	@media (max-width: 640px) {
		.hero {
			padding: var(--spacing-xl) 0;
		}

		.hero-content {
			min-height: 50vh;
		}

		.terminal-window {
			margin: 0 var(--spacing-sm);
		}

		.terminal-body {
			padding: var(--spacing-md);
		}

		.file-entry {
			flex-direction: column;
			gap: var(--spacing-xs);
		}

		.permissions, .date {
			min-width: auto;
		}

		.features-grid {
			grid-template-columns: 1fr;
			gap: var(--spacing-lg);
		}

		.tech-grid {
			gap: var(--spacing-md);
		}

		.tech-item {
			min-width: 120px;
		}

		.cta-buttons {
			flex-direction: column;
			align-items: center;
		}
	}
</style>
