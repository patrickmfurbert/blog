import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	// Get all markdown files from the posts directory
	const allPostFiles = import.meta.glob('/src/posts/*.md');
	const iterablePostFiles = Object.entries(allPostFiles);

	const allPosts = await Promise.all(
		iterablePostFiles.map(async ([path, resolver]) => {
			const { metadata } = await resolver() as { metadata: any };
			const postPath = path.slice(11, -3); // Remove '/src/posts/' and '.md'

			return {
				meta: metadata,
				path: postPath
			};
		})
	);

	// Sort posts by date (newest first) and format for display
	const sortedPosts = allPosts
		.sort((a, b) => new Date(b.meta.date).getTime() - new Date(a.meta.date).getTime())
		.map(post => ({
			title: post.meta.title,
			slug: post.path,
			date: post.meta.date,
			description: post.meta.description,
			tags: post.meta.tags || [],
			readingTime: post.meta.readingTime || null
		}));

	return {
		posts: sortedPosts
	};
};