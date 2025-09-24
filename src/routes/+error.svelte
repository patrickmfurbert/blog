<script lang="ts">
	import { page } from '$app/stores';
</script>

<svelte:head>
	<title>Error {$page.status} - On The Stack</title>
	<meta name="description" content="Oops! Something went wrong. Error {$page.status} on onthestack.io" />
</svelte:head>

<div class="error-page">
	<div class="container">
		<div class="error-content">
			<div class="terminal-window">
				<div class="terminal-header">
					<div class="terminal-controls">
						<span class="terminal-dot red"></span>
						<span class="terminal-dot yellow"></span>
						<span class="terminal-dot green"></span>
					</div>
					<div class="terminal-title">error.exe</div>
				</div>
				<div class="terminal-body">
					<div class="error-ascii">
						<pre>
 _____ _____  _____   ___  _____  
| ____|  __ \|  __ \ / _ \|  __ \ 
| |__  | |__) | |__) | | | | |__) |
|  __| |  _  /|  _  /| | | |  _  / 
| |____| | \ \| | \ \| |_| | | \ \ 
|______|_|  \_\_|  \_\\___/|_|  \_\
						</pre>
					</div>
					
					<div class="error-info">
						<div class="error-line">
							<span class="prompt">$</span>
							<span class="command">cat error.log</span>
						</div>
						<div class="error-output">
							<div class="error-details">
								<span class="error-code">HTTP {$page.status}</span>
								<span class="error-message">
									{#if $page.status === 404}
										Page not found
									{:else if $page.status === 500}
										Internal server error
									{:else}
										Something went wrong
									{/if}
								</span>
							</div>
						</div>
						
						<div class="error-line">
							<span class="prompt">$</span>
							<span class="command">ls -la current_location/</span>
						</div>
						<div class="error-output">
							<div class="file-listing">
								<div class="file-entry error-entry">
									<span class="permissions">-rw-r--r--</span>
									<span class="size">404 bytes</span>
									<span class="filename">missing_page.html</span>
								</div>
								<div class="file-entry">
									<span class="permissions">drwxr-xr-x</span>
									<span class="size">4096</span>
									<a href="/" class="filename">home/</a>
								</div>
								<div class="file-entry">
									<span class="permissions">drwxr-xr-x</span>
									<span class="size">4096</span>
									<a href="/blog" class="filename">blog/</a>
								</div>
								<div class="file-entry">
									<span class="permissions">drwxr-xr-x</span>
									<span class="size">4096</span>
									<a href="/about" class="filename">about/</a>
								</div>
							</div>
						</div>
						
						<div class="error-line">
							<span class="prompt">$</span>
							<span class="command">echo "Suggestions:"</span>
						</div>
						<div class="error-output">
							<div class="suggestions">
								<div class="suggestion">1. Check the URL for typos</div>
								<div class="suggestion">2. Navigate using the links above</div>
								<div class="suggestion">3. Return to the homepage</div>
								<div class="suggestion">4. Browse our blog posts</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			
			<div class="error-actions">
				<a href="/" class="btn btn-accent">Return Home</a>
				<a href="/blog" class="btn btn-secondary">Browse Blog</a>
				<button onclick={() => window.history.back()} class="btn btn-secondary">Go Back</button>
			</div>
		</div>
	</div>
</div>

<style>
	.error-page {
		padding: var(--spacing-3xl) 0;
		min-height: 70vh;
		display: flex;
		align-items: center;
	}

	.error-content {
		max-width: 800px;
		margin: 0 auto;
		text-align: center;
	}

	.terminal-window {
		background-color: var(--color-bg-secondary);
		border: var(--border-width) solid var(--color-border);
		border-radius: var(--border-radius);
		margin-bottom: var(--spacing-xl);
		box-shadow: var(--shadow-glow);
		text-align: left;
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

	.error-ascii {
		margin-bottom: var(--spacing-xl);
		color: var(--color-error);
		font-size: 10px;
		line-height: 1;
		text-align: center;
	}

	.error-line {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		margin: var(--spacing-md) 0 var(--spacing-sm) 0;
	}

	.prompt {
		color: var(--color-accent);
		font-weight: bold;
	}

	.command {
		color: var(--color-text-primary);
	}

	.error-output {
		margin: var(--spacing-sm) 0 var(--spacing-lg) var(--spacing-lg);
		color: var(--color-text-secondary);
	}

	.error-details {
		display: flex;
		gap: var(--spacing-lg);
		align-items: center;
		margin-bottom: var(--spacing-md);
	}

	.error-code {
		color: var(--color-error);
		font-weight: bold;
		font-size: var(--font-size-lg);
	}

	.error-message {
		color: var(--color-text-muted);
	}

	.file-listing {
		font-size: var(--font-size-sm);
	}

	.file-entry {
		display: flex;
		gap: var(--spacing-md);
		margin-bottom: var(--spacing-xs);
		align-items: center;
	}

	.error-entry {
		color: var(--color-error);
	}

	.permissions {
		color: var(--color-text-muted);
		min-width: 80px;
	}

	.size {
		color: var(--color-text-muted);
		min-width: 60px;
	}

	.filename {
		color: var(--color-accent-secondary);
	}

	/* .filename a {
		color: var(--color-accent-secondary);
	} */

	.suggestions {
		color: var(--color-text-secondary);
	}

	.suggestion {
		margin-bottom: var(--spacing-xs);
		padding-left: var(--spacing-md);
		position: relative;
	}

	.suggestion::before {
		content: "→";
		position: absolute;
		left: 0;
		color: var(--color-accent);
	}

	.error-actions {
		display: flex;
		justify-content: center;
		gap: var(--spacing-lg);
		flex-wrap: wrap;
	}

	/* Mobile Styles */
	@media (max-width: 640px) {
		.error-page {
			padding: var(--spacing-xl) 0;
		}

		.terminal-window {
			margin: 0 var(--spacing-sm) var(--spacing-xl);
		}

		.terminal-body {
			padding: var(--spacing-md);
		}

		.error-ascii {
			font-size: 8px;
		}

		.error-details {
			flex-direction: column;
			align-items: flex-start;
			gap: var(--spacing-sm);
		}

		.file-entry {
			flex-direction: column;
			align-items: flex-start;
			gap: var(--spacing-xs);
		}

		.permissions,
		.size {
			min-width: auto;
		}

		.error-actions {
			flex-direction: column;
			align-items: center;
		}
	}
</style>
