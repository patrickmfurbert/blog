<script lang="ts">
	import type { PageData } from './$types';
	
	let { data } = $props() as { data: PageData };
</script>

<svelte:head>
	<title>Blog Posts - On The Stack</title>
	<meta name="description" content="Browse all blog posts about web development, programming, and technology insights on onthestack.io." />
	<meta property="og:title" content="Blog Posts - On The Stack" />
	<meta property="og:url" content="https://onthestack.io/blog" />
	<link rel="canonical" href="https://onthestack.io/blog" />
</svelte:head>

<div class="blog-header">
	<div class="container">
		<h1 class="page-title">
			<span class="text-accent">&lt;</span>
			Blog Posts
			<span class="text-accent">/&gt;</span>
		</h1>
		<p class="page-description text-muted">
			Exploring code, technology, and digital adventures one post at a time.
		</p>
	</div>
</div>

<section class="blog-content">
	<div class="container">
		{#if data.posts.length > 0}
			<div class="posts-grid">
				{#each data.posts as post}
					<article class="post-card card">
						<div class="post-meta">
							<time class="post-date text-muted" datetime={post.date}>
								{new Date(post.date).toLocaleDateString('en-US', {
									year: 'numeric',
									month: 'long',
									day: 'numeric'
								})}
							</time>
							{#if post.readingTime}
								<span class="reading-time text-muted">
									• {post.readingTime}
								</span>
							{/if}
						</div>
						
						<h2 class="post-title">
							<a href="/blog/{post.slug}" class="post-link">
								{post.title}
							</a>
						</h2>
						
						{#if post.description}
							<p class="post-description text-muted">
								{post.description}
							</p>
						{/if}
						
						{#if post.tags && post.tags.length > 0}
							<div class="post-tags">
								{#each post.tags as tag}
									<span class="tag">#{tag}</span>
								{/each}
							</div>
						{/if}
						
						<div class="post-footer">
							<a href="/blog/{post.slug}" class="read-more btn btn-secondary">
								Read Post →
							</a>
						</div>
					</article>
				{/each}
			</div>
		{:else}
			<div class="empty-state">
				<div class="empty-content">
					<h2 class="text-accent">No Posts Yet</h2>
					<p class="text-muted">
						The blog is being prepared. Check back soon for exciting content!
					</p>
				</div>
			</div>
		{/if}
	</div>
</section>

<style>
	.blog-header {
		padding: var(--spacing-3xl) 0 var(--spacing-xl) 0;
		text-align: center;
		background: linear-gradient(135deg, var(--color-bg-primary) 0%, var(--color-bg-secondary) 100%);
	}

	.page-title {
		margin-bottom: var(--spacing-md);
		font-size: var(--font-size-3xl);
	}

	.page-description {
		font-size: var(--font-size-lg);
		max-width: 600px;
		margin: 0 auto;
	}

	.blog-content {
		padding: var(--spacing-2xl) 0;
	}

	.posts-grid {
		display: grid;
		gap: var(--spacing-xl);
		max-width: 800px;
		margin: 0 auto;
	}

	.post-card {
		transition: var(--transition-slow);
	}

	.post-card:hover {
		transform: translateY(-2px);
		border-color: var(--color-border-hover);
	}

	.post-meta {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		margin-bottom: var(--spacing-md);
		font-size: var(--font-size-sm);
	}

	.post-title {
		margin-bottom: var(--spacing-md);
		font-size: var(--font-size-xl);
	}

	.post-link {
		color: var(--color-text-primary);
		text-decoration: none;
		border-bottom: 2px solid transparent;
		transition: var(--transition-fast);
	}

	.post-link:hover {
		color: var(--color-accent);
		border-bottom-color: var(--color-accent);
	}

	.post-description {
		margin-bottom: var(--spacing-lg);
		line-height: 1.7;
	}

	.post-tags {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-sm);
		margin-bottom: var(--spacing-lg);
	}

	.tag {
		background-color: var(--color-bg-tertiary);
		color: var(--color-accent-secondary);
		padding: var(--spacing-xs) var(--spacing-sm);
		border-radius: var(--border-radius);
		font-size: var(--font-size-sm);
		border: 1px solid var(--color-border);
	}

	.post-footer {
		display: flex;
		justify-content: flex-end;
		margin-top: auto;
	}

	.read-more {
		font-size: var(--font-size-sm);
		padding: var(--spacing-sm) var(--spacing-md);
	}

	.empty-state {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 400px;
	}

	.empty-content {
		text-align: center;
		max-width: 400px;
	}

	.empty-content h2 {
		margin-bottom: var(--spacing-md);
		font-size: var(--font-size-2xl);
	}

	/* Mobile Styles */
	@media (max-width: 640px) {
		.blog-header {
			padding: var(--spacing-xl) 0;
		}

		.page-title {
			font-size: var(--font-size-2xl);
		}

		.page-description {
			font-size: var(--font-size-base);
		}

		.post-meta {
			flex-direction: column;
			align-items: flex-start;
			gap: var(--spacing-xs);
		}

		.post-title {
			font-size: var(--font-size-lg);
		}

		.posts-grid {
			gap: var(--spacing-lg);
		}

		.post-footer {
			justify-content: center;
		}
	}
</style>
