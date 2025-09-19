<script>
	export let videoId;
	export let title = 'YouTube video';
</script>

<div class="youtube-container">
	<div class="youtube-header">
		<span class="file-icon">📺</span>
		<span class="file-name">{title}</span>
		<span class="file-size">youtube.com</span>
	</div>
	<div class="youtube-embed">
		<iframe
			src="https://www.youtube.com/embed/{videoId}"
			{title}
			frameborder="0"
			allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
			allowfullscreen
		></iframe>
	</div>
</div>

<style>
	.youtube-container {
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 4px;
		margin: 1rem 0;
		overflow: hidden;
	}

	.youtube-header {
		display: flex;
		align-items: center;
		padding: 0.5rem 1rem;
		background: var(--bg-primary);
		border-bottom: 1px solid var(--border);
		font-family: var(--font-mono);
		font-size: 0.875rem;
		color: var(--text-secondary);
	}

	.file-icon {
		margin-right: 0.5rem;
	}

	.file-name {
		flex: 1;
		color: var(--text-primary);
		font-weight: 500;
	}

	.file-size {
		color: var(--text-muted);
		font-size: 0.75rem;
	}

	.youtube-embed {
		position: relative;
		padding-bottom: 56.25%; /* 16:9 aspect ratio */
		height: 0;
		overflow: hidden;
		background: #000;
	}

	iframe {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		border: none;
	}

	/* Hover effect for terminal feel */
	.youtube-container:hover .youtube-header {
		background: var(--bg-hover);
	}
</style>