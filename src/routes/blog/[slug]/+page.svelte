<script lang="ts">
    import type { PageData } from './$types';
    import YouTubeEmbed from '$lib/components/YouTubeEmbed.svelte';
    
    let { data } = $props() as { data: PageData };
</script>

<svelte:head>
    <title>{data.meta.title} - On The Stack</title>
    <meta name="description" content={data.meta.description} />
    <meta property="og:title" content={data.meta.title} />
    <meta property="og:description" content={data.meta.description} />
    <meta property="og:url" content="https://onthestack.io/blog/{data.meta.slug}" />
    <link rel="canonical" href="https://onthestack.io/blog/{data.meta.slug}" />
</svelte:head>

<article class="blog-post">
    <div class="container">
        <header class="post-header">
            <div class="post-meta">
                <time class="post-date" datetime={data.meta.date}>
                    {new Date(data.meta.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}
                </time>
                {#if data.meta.readingTime}
                    <span class="reading-time">• {data.meta.readingTime}</span>
                {/if}
            </div>
            
            <h1 class="post-title">{data.meta.title}</h1>
            
            {#if data.meta.description}
                <p class="post-description">{data.meta.description}</p>
            {/if}
            
            {#if data.meta.tags && data.meta.tags.length > 0}
                <div class="post-tags">
                    {#each data.meta.tags as tag}
                        <span class="tag">#{tag}</span>
                    {/each}
                </div>
            {/if}
        </header>
        
        <div class="post-content">
            <svelte:component this={data.content} />
        </div>
        
        <footer class="post-footer">
            <a href="/" class="btn btn-secondary">← Back to Posts</a>
        </footer>
    </div>
</article>

<style>
    .blog-post {
        padding: var(--spacing-2xl) 0;
    }
    
    .post-header {
        text-align: center;
        margin-bottom: var(--spacing-3xl);
        padding-bottom: var(--spacing-xl);
        border-bottom: 1px solid var(--color-border);
    }

    .post-meta {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: var(--spacing-sm);
        margin-bottom: var(--spacing-lg);
        font-size: var(--font-size-sm);
        color: var(--color-text-muted);
    }

    .post-title {
        margin-bottom: var(--spacing-lg);
        font-size: var(--font-size-3xl);
        line-height: 1.2;
    }

    .post-description {
        font-size: var(--font-size-lg);
        color: var(--color-text-secondary);
        max-width: 600px;
        margin: 0 auto var(--spacing-lg);
        line-height: 1.6;
    }

    .post-tags {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        gap: var(--spacing-sm);
    }

    .tag {
        background-color: var(--color-bg-tertiary);
        color: var(--color-accent-secondary);
        padding: var(--spacing-xs) var(--spacing-sm);
        border-radius: var(--border-radius);
        font-size: var(--font-size-sm);
        border: 1px solid var(--color-border);
    }

    .post-content {
        max-width: 800px;
        margin: 0 auto;
        line-height: 1.8;
    }

    .post-footer {
        text-align: center;
        margin-top: var(--spacing-3xl);
        padding-top: var(--spacing-xl);
        border-top: 1px solid var(--color-border);
    }

    /* Mobile Styles */
    @media (max-width: 640px) {
        .post-header {
            margin-bottom: var(--spacing-xl);
            padding-bottom: var(--spacing-md);
        }

        .post-meta {
            flex-direction: column;
            gap: var(--spacing-xs);
        }

        .post-title {
            font-size: var(--font-size-2xl);
        }

        .post-description {
            font-size: var(--font-size-base);
        }

        .post-content {
            padding: 0 var(--spacing-sm);
        }

        /* YouTube embed styles */
        :global(.youtube-container) {
            background: var(--bg-secondary);
            border: 1px solid var(--border);
            border-radius: 4px;
            margin: 2rem 0;
            overflow: hidden;
            max-width: 100%;
        }

        :global(.youtube-header) {
            display: flex;
            align-items: center;
            padding: 0.75rem 1rem;
            background: var(--bg-primary);
            border-bottom: 1px solid var(--border);
            font-family: var(--font-mono);
            font-size: 0.875rem;
            color: var(--text-secondary);
        }

        :global(.file-icon) {
            margin-right: 0.5rem;
        }

        :global(.file-name) {
            flex: 1;
            color: var(--text-primary);
            font-weight: 500;
        }

        :global(.file-size) {
            color: var(--text-muted);
            font-size: 0.75rem;
        }

        :global(.youtube-embed) {
            position: relative;
            width: 100%;
            height: 400px; /* Fixed height instead of padding-bottom */
            overflow: hidden;
            background: #000;
        }

        :global(.youtube-embed iframe) {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border: none;
        }

        :global(.youtube-container:hover .youtube-header) {
            background: var(--bg-hover);
        }

        /* Make YouTube embeds even larger on desktop */
        @media (min-width: 768px) {
            :global(.youtube-container) {
                margin: 3rem 0;
            }
            
            :global(.youtube-embed) {
                height: 500px;
            }
        }

        @media (min-width: 1024px) {
            :global(.youtube-embed) {
                height: 600px;
            }
        }

        @media (min-width: 1280px) {
            :global(.youtube-embed) {
                height: 720px;
            }
        }
    }
</style>