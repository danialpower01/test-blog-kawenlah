import { addArticleJsonLd } from '@starter-kit/utils/seo/addArticleJsonLd';
import { getAutogeneratedPostOG } from '@starter-kit/utils/social/og';
import request from 'graphql-request';
import { GetStaticPaths, GetStaticProps } from 'next';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import Link from 'next/link';
import { Container } from '../components/container';
import { AppProvider } from '../components/contexts/appContext';
import { Footer } from '../components/footer';
import { Header } from '../components/header';
import { Layout } from '../components/layout';
import { MarkdownToHtml } from '../components/markdown-to-html';
import { PostHeader } from '../components/post-header';
import { PostTOC } from '../components/post-toc';
import {
	PageByPublicationDocument,
	PostFullFragment,
	PublicationFragment,
	SinglePostByPublicationDocument,
	SlugPostsByPublicationDocument,
	StaticPageFragment,
} from '../generated/graphql';
// @ts-ignore
import handleMathJax from '@starter-kit/utils/handle-math-jax';
import { useEmbeds } from '@starter-kit/utils/renderer/hooks/useEmbeds';
import { loadIframeResizer } from '@starter-kit/utils/renderer/services/embed';
import { useEffect, useState } from 'react';
// @ts-ignore
import { triggerCustomWidgetEmbed } from '@starter-kit/utils/trigger-custom-widget-embed';

const AboutAuthor = dynamic(() => import('../components/about-author'), { ssr: false });
const Subscribe = dynamic(() => import('../components/subscribe').then((mod) => mod.Subscribe));
const PostComments = dynamic(() =>
	import('../components/post-comments').then((mod) => mod.PostComments),
);

type PostProps = {
	type: 'post';
	post: PostFullFragment;
	publication: PublicationFragment;
};

type PageProps = {
	type: 'page';
	page: StaticPageFragment;
	publication: PublicationFragment;
};

type Props = PostProps | PageProps;

const Post = ({ publication, post }: PostProps) => {
	const highlightJsMonokaiTheme =
		'.hljs{display:block;overflow-x:auto;padding:.5em;background:#23241f}.hljs,.hljs-subst,.hljs-tag{color:#f8f8f2}.hljs-emphasis,.hljs-strong{color:#a8a8a2}.hljs-bullet,.hljs-link,.hljs-literal,.hljs-number,.hljs-quote,.hljs-regexp{color:#ae81ff}.hljs-code,.hljs-section,.hljs-selector-class,.hljs-title{color:#a6e22e}.hljs-strong{font-weight:700}.hljs-emphasis{font-style:italic}.hljs-attr,.hljs-keyword,.hljs-name,.hljs-selector-tag{color:#f92672}.hljs-attribute,.hljs-symbol{color:#66d9ef}.hljs-class .hljs-title,.hljs-params{color:#f8f8f2}.hljs-addition,.hljs-built_in,.hljs-builtin-name,.hljs-selector-attr,.hljs-selector-id,.hljs-selector-pseudo,.hljs-string,.hljs-template-variable,.hljs-type,.hljs-variable{color:#e6db74}.hljs-comment,.hljs-deletion,.hljs-meta{color:#75715e}';

	const tagsList = (post.tags ?? []).map((tag) => (
		<li key={tag.id}>
			<Link
				href={`/tag/${tag.slug}`}
				className="block rounded-full border px-2 py-1 font-medium font-['Outfit'] hover:bg-slate-50 dark:border-neutral-800 dark:hover:bg-neutral-800 md:px-4"
			>
				#{tag.slug}
			</Link>
		</li>
	));
	const [, setMobMount] = useState(false);
	const [canLoadEmbeds, setCanLoadEmbeds] = useState(false);
	useEmbeds({ enabled: canLoadEmbeds });
	if (post.hasLatexInPost) {
		setTimeout(() => {
			handleMathJax(true);
		}, 500);
	}

	useEffect(() => {
		if (screen.width <= 425) {
			setMobMount(true);
		}

		if (!post) {
			return;
		}

		// TODO:
		// More of an alert, did this below to wrap async funcs inside useEffect
		(async () => {
			await loadIframeResizer();
			triggerCustomWidgetEmbed(post.publication?.id.toString());
			setCanLoadEmbeds(true);
		})();
	}, []);

	return (
		<>
			<Head>
				<title>{post.seo?.title || post.title}</title>
				<link rel="canonical" href={post.url} />
				<meta name="description" content={post.seo?.description || post.subtitle || post.brief} />
				<meta property="twitter:card" content="summary_large_image" />
				<meta property="twitter:title" content={post.seo?.title || post.title} />
				<meta
					property="twitter:description"
					content={post.seo?.description || post.subtitle || post.brief}
				/>
				<meta
					property="og:image"
					content={
						post.ogMetaData?.image ||
						post.coverImage?.url ||
						getAutogeneratedPostOG(post, publication)
					}
				/>
				<meta
					property="twitter:image"
					content={
						post.ogMetaData?.image ||
						post.coverImage?.url ||
						getAutogeneratedPostOG(post, publication)
					}
				/>
				<script
					type="application/ld+json"
					dangerouslySetInnerHTML={{
						__html: JSON.stringify(addArticleJsonLd(publication, post)),
					}}
				/>
				<style dangerouslySetInnerHTML={{ __html: highlightJsMonokaiTheme }}></style>
			</Head>
			<PostHeader
				title={post.title}
				coverImage={post.coverImage?.url}
				date={post.publishedAt}
				author={post.author}
				readTimeInMinutes={post.readTimeInMinutes}
			/>
			{post.features.tableOfContents.isEnabled && <PostTOC />}
			<MarkdownToHtml contentMarkdown={post.content.markdown} />
			{(post.tags ?? []).length > 0 && (
				<div className="mx-auto w-full px-5 text-slate-600 dark:text-neutral-300 md:max-w-screen-md">
					<ul className="flex flex-row flex-wrap items-center gap-2">{tagsList}</ul>
				</div>
			)}
			<AboutAuthor />
			{!post.preferences.disableComments && post.comments.totalDocuments > 0 && <PostComments />}
			<Subscribe />
		</>
	);
};

const Page = ({ page }: PageProps) => {
	const title = page.title;
	return (
		<>
			<Head>
				<title>{title}</title>
			</Head>
			<MarkdownToHtml contentMarkdown={page.content.markdown} />
		</>
	);
};

export default function PostOrPage(props: Props) {
	const maybePost = props.type === 'post' ? props.post : null;
	const publication = props.publication;

	return (
		<AppProvider publication={publication} post={maybePost}>
			<Layout>
				<Header />
				<Container className="pt-0">
					<article className="w-full items-start py-10 border-x border-neutral-200">
						{props.type === 'post' && <Post {...props} />}
						{props.type === 'page' && <Page {...props} />}
					</article>
					<div className="w-full" >
						<Link href="https://www.pakejkahwin.com" target="_blank" rel="noreferrer noopener">
							<div className="w-full h-full lg:flex lg:justify-start lg:items-start border border-neutral-200 lg:flex-row-reverse">
								{/* Image Section */}
								<div className="lg:w-1/2 md:w-full lg:h-fit md:h-auto relative bg-white md:border-b lg:border-l border-neutral-200">
									{/* Example image link */}
									<img className="object-cover w-full h-full" src="/assets/blog/gambar/pakejkahwin.png" alt="Image" />
								</div>

								{/* Content Section */}
									<div className="lg:w-1/2 md:w-full h-full p-8 bg-white border-neutral-200">
										<div className="text-neutral-500 text-xs font-light font-['Outfit'] uppercase leading-[18px] tracking-[4.80px]">PROMOSI</div>
										<div className="text-neutral-800 lg:text-3xl text-2xl font-medium font-['Outfit'] leading-9">Promosi PERCUMA Dewan Kahwin oleh pakejkahwin.com</div>
											<div className="w-fit mt-8 rounded-full px-8 py-4 bg-primary-500 cursor-pointer">
												<div className="text-center text-white text-base font-medium font-['Outfit'] leading-normal">Lihat Website</div>
											</div>
									</div>
							</div>
						</Link>

						<Link href="https://www.kawenlah.com" target="_blank" rel="noreferrer noopener">
							<div className="w-full h-full lg:flex lg:justify-start lg:items-start border border-neutral-200 lg:flex-row-reverse">
								{/* Image Section */}
								<div className="lg:w-1/2 md:w-full lg:h-fit md:h-auto relative bg-white md:border-b lg:border-l border-neutral-200">
									{/* Example image link */}
									<img className="object-cover w-full h-full" src="/assets/blog/gambar/Kad Kawen.png" alt="Image" />
								</div>

								{/* Content Section */}
								<div className="lg:w-1/2 md:w-full h-full p-8 bg-white border-neutral-200">
									<div className="text-neutral-500 text-xs font-light font-['Outfit'] uppercase leading-[18px] tracking-[4.80px]">KAWENLAH</div>
									<div className="text-neutral-800 lg:text-3xl text-2xl font-medium font-['Outfit'] leading-9">Jom buat Kad Kawen Percuma di website kami!</div>
										<div className="w-fit mt-8 rounded-full px-8 py-4 bg-primary-500 cursor-pointer">
											<div className="text-center text-white text-base font-medium font-['Outfit'] leading-normal">Lihat Website</div>
										</div>
								</div>
							</div>
						</Link>

						<Link href="https://forms.gle/esYMzAg4iKNSwsqCA" target="_blank" rel="noreferrer noopener">
							<div className="w-full h-full lg:flex lg:justify-start lg:items-start border border-neutral-200 lg:flex-row-reverse">
								{/* Image Section */}
								<div className="lg:w-1/2 md:w-full lg:h-fit md:h-auto relative bg-white md:border-b lg:border-l border-neutral-200">
									{/* Example image link */}
									<img className="object-cover w-full h-full" src="/assets/blog/gambar/promo.png" alt="Image" />
								</div>

								{/* Content Section */}
								<div className="lg:w-1/2 md:w-full h-full p-8 bg-white border-neutral-200">
									<div className="text-neutral-500 text-xs font-light font-['Outfit'] uppercase leading-[18px] tracking-[4.80px]">PAPAN IKLAN</div>
									<div className="text-neutral-800 lg:text-3xl text-2xl font-medium font-['Outfit'] leading-9">Nak promote business korang di artikel Kawenlah?</div>
										<div className="w-fit mt-8 rounded-full px-8 py-4 bg-primary-500 cursor-pointer">
											<div className="text-center text-white text-base font-medium font-['Outfit'] leading-normal">Daftar Sekarang</div>
										</div>
								</div>
							</div>
						</Link>
					</div>
					

				</Container>
				<Footer />
			</Layout>
		</AppProvider>
	);
}

type Params = {
	slug: string;
};

export const getStaticProps: GetStaticProps<Props, Params> = async ({ params }) => {
	if (!params) {
		throw new Error('No params');
	}

	const endpoint = process.env.NEXT_PUBLIC_HASHNODE_GQL_ENDPOINT;
	const host = process.env.NEXT_PUBLIC_HASHNODE_PUBLICATION_HOST;
	const slug = params.slug;

	const postData = await request(endpoint, SinglePostByPublicationDocument, { host, slug });

	if (postData.publication?.post) {
		return {
			props: {
				type: 'post',
				post: postData.publication.post,
				publication: postData.publication,
			},
			revalidate: 1,
		};
	}

	const pageData = await request(endpoint, PageByPublicationDocument, { host, slug });

	if (pageData.publication?.staticPage) {
		return {
			props: {
				type: 'page',
				page: pageData.publication.staticPage,
				publication: pageData.publication,
			},
			revalidate: 1,
		};
	}

	return {
		notFound: true,
		revalidate: 1,
	};
};

export const getStaticPaths: GetStaticPaths = async () => {
	const data = await request(
		process.env.NEXT_PUBLIC_HASHNODE_GQL_ENDPOINT,
		SlugPostsByPublicationDocument,
		{
			first: 10,
			host: process.env.NEXT_PUBLIC_HASHNODE_PUBLICATION_HOST,
		},
	);

	const postSlugs = (data.publication?.posts.edges ?? []).map((edge) => edge.node.slug);

	return {
		paths: postSlugs.map((slug) => {
			return {
				params: {
					slug: slug,
				},
			};
		}),
		fallback: 'blocking',
	};
};
