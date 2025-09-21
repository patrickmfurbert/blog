<svelte:head>
	<title>About - On The Stack</title>
	<meta name="description" content="Learn about On The Stack - a nostalgic journey through modern web development with classic terminal aesthetics at onthestack.io." />
	<meta property="og:title" content="About - On The Stack" />
	<meta property="og:url" content="https://onthestack.io/about" />
	<link rel="canonical" href="https://onthestack.io/about" />
</svelte:head>

<div class="about-page">
	<div class="container">
		<header class="about-header">
			<h1 class="page-title">
				<span class="text-accent">&lt;</span>
				About
				<span class="text-accent">/&gt;</span>
			</h1>
		</header>

		<div class="about-content">
			<section class="intro-section">
				<div class="terminal-display">
					<div class="terminal-header">
						<div class="terminal-controls">
							<span class="terminal-dot red"></span>
							<span class="terminal-dot yellow"></span>
							<span class="terminal-dot green"></span>
						</div>
						<div class="terminal-title">about.exe</div>
					</div>
					<div class="terminal-body">
						<div class="ascii-art">
							<pre>
 ____      _              ____  _             
|  _ \ ___| |_ _ __ ___   | __ )| | ___   __ _ 
| |_) / _ \ __| '__/ _ \  |  _ \| |/ _ \ / _` |
|  _ &lt;  __/ |_| | | (_) | | |_) | | (_) | (_| |
|_| \_\___|\__|_|  \___/  |____/|_|\___/ \__, |
                                        |___/ 
							</pre>
						</div>
						<div class="terminal-output">
							<p class="type-text">
								> Loading developer profile...
								<span class="cursor animate-pulse">|</span>
							</p>

							<p>
								Under construction... more about me coming soon!
							</p>
						</div>
					</div>
				</div>
			</section>

			<!-- <section class="mission-section">
				<div class="card">
					<h2 class="text-secondary">Our Mission</h2>
					<p>
						On The Stack bridges the gap between nostalgia and modern web development. 
						We believe that the aesthetics of early computing can coexist beautifully with 
						cutting-edge technology.
					</p>
					<p>
						Our goal is to create content that's both educational and visually appealing, 
						bringing the charm of terminal interfaces and retro computing into the modern web 
						development landscape at onthestack.io.
					</p>
				</div>
			</section> -->

			<!-- <section class="values-section">
				<h2 class="text-center mb-8">Core Values</h2>
				<div class="values-grid">
					<div class="value-card card">
						<div class="value-icon">📚</div>
						<h3 class="text-accent">Education First</h3>
						<p>
							Every post is designed to teach something valuable, whether you're 
							a beginner or an experienced developer.
						</p>
					</div>

					<div class="value-card card">
						<div class="value-icon">🎨</div>
						<h3 class="text-secondary">Aesthetic Excellence</h3>
						<p>
							We believe that code and design should be beautiful. Function and 
							form work together to create memorable experiences.
						</p>
					</div>

					<div class="value-card card">
						<div class="value-icon">🕹️</div>
						<h3 class="text-accent">Nostalgic Innovation</h3>
						<p>
							Combining the best of retro aesthetics with modern development 
							practices and technologies.
						</p>
					</div>

					<div class="value-card card">
						<div class="value-icon">🌍</div>
						<h3 class="text-secondary">Open Knowledge</h3>
						<p>
							All our content is freely accessible, and we encourage sharing 
							and building upon our ideas.
						</p>
					</div>
				</div>
			</section> -->

			<!-- <section class="tech-section">
				<div class="card">
					<h2 class="text-accent">Built With</h2>
					<p class="mb-4">
						This blog showcases modern web technologies wrapped in retro aesthetics:
					</p>
					
					<div class="tech-stack">
						<div class="tech-category">
							<h4 class="text-secondary">Frontend</h4>
							<ul>
								<li>SvelteKit 2.x - Modern meta-framework</li>
								<li>TypeScript - Type-safe development</li>
								<li>CSS3 - Custom properties and animations</li>
								<li>MDsveX - Markdown with Svelte components</li>
							</ul>
						</div>

						<div class="tech-category">
							<h4 class="text-secondary">Design</h4>
							<ul>
								<li>Mobile-first responsive design</li>
								<li>CSS Grid and Flexbox layouts</li>
								<li>Custom retro color palette</li>
								<li>Pure CSS pixel art sprites</li>
							</ul>
						</div>

						<div class="tech-category">
							<h4 class="text-secondary">Deployment</h4>
							<ul>
								<li>Netlify - Static site hosting</li>
								<li>Git-based deployments</li>
								<li>Automatic build optimization</li>
								<li>Edge functions support</li>
							</ul>
						</div>
					</div>
				</div>
			</section> -->

			<!-- <section class="contact-section">
				<div class="card text-center">
					<h2 class="text-accent mb-4">Get In Touch</h2>
					<p class="mb-8">
						Have questions, suggestions, or just want to chat about retro computing? 
						We'd love to hear from you!
					</p>
					<div class="contact-links">
						<a href="https://github.com" target="_blank" rel="noopener" class="btn btn-secondary">
							GitHub
						</a>
						<a href="https://twitter.com" target="_blank" rel="noopener" class="btn btn-accent">
							Twitter
						</a>
						<a href="mailto:hello@onthestack.io" class="btn btn-secondary">
							Email
						</a>
					</div>
				</div>
			</section> -->
		</div>
	</div>
</div>

<style>
	.about-page {
		padding: var(--spacing-2xl) 0;
	}

	.about-header {
		text-align: center;
		margin-bottom: var(--spacing-3xl);
	}

	.page-title {
		font-size: var(--font-size-3xl);
		margin-bottom: var(--spacing-lg);
	}

	.about-content {
		max-width: 900px;
		margin: 0 auto;
	}

	.intro-section {
		margin-bottom: var(--spacing-3xl);
	}

	.terminal-display {
		background-color: var(--color-bg-secondary);
		border: var(--border-width) solid var(--color-border);
		border-radius: var(--border-radius);
		margin-bottom: var(--spacing-xl);
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

	.ascii-art {
		margin-bottom: var(--spacing-lg);
		color: var(--color-accent);
		font-size: 10px;
		line-height: 1;
		overflow-x: auto;
	}

	.terminal-output {
		color: var(--color-text-secondary);
	}

	.type-text {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
	}

	.cursor {
		color: var(--color-accent);
		font-weight: bold;
	}

	.mission-section,
	.tech-section,
	.contact-section {
		margin-bottom: var(--spacing-3xl);
	}

	.values-section {
		margin-bottom: var(--spacing-3xl);
	}

	.values-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: var(--spacing-xl);
	}

	.value-card {
		text-align: center;
		transition: var(--transition-slow);
	}

	.value-card:hover {
		transform: translateY(-4px);
		border-color: var(--color-border-hover);
	}

	.value-icon {
		font-size: var(--font-size-3xl);
		margin-bottom: var(--spacing-md);
	}

	.value-card h3 {
		margin-bottom: var(--spacing-md);
	}

	.tech-stack {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: var(--spacing-xl);
	}

	.tech-category h4 {
		margin-bottom: var(--spacing-md);
		border-bottom: 1px solid var(--color-border);
		padding-bottom: var(--spacing-sm);
	}

	.tech-category ul {
		list-style: none;
		padding: 0;
	}

	.tech-category li {
		padding: var(--spacing-xs) 0;
		color: var(--color-text-primary);
		position: relative;
		padding-left: var(--spacing-lg);
	}

	.tech-category li::before {
		content: "▸";
		position: absolute;
		left: 0;
		color: var(--color-accent);
	}

	.contact-links {
		display: flex;
		justify-content: center;
		gap: var(--spacing-lg);
		flex-wrap: wrap;
	}

	/* Mobile Styles */
	@media (max-width: 640px) {
		.about-page {
			padding: var(--spacing-xl) 0;
		}

		.page-title {
			font-size: var(--font-size-2xl);
		}

		.ascii-art {
			font-size: 8px;
		}

		.values-grid {
			grid-template-columns: 1fr;
			gap: var(--spacing-lg);
		}

		.tech-stack {
			grid-template-columns: 1fr;
			gap: var(--spacing-lg);
		}

		.contact-links {
			flex-direction: column;
			align-items: center;
		}

		.terminal-display {
			margin: 0 var(--spacing-sm) var(--spacing-xl);
		}
	}
</style>
