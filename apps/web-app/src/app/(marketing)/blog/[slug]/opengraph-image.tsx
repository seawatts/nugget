import { notFound } from 'next/navigation';
import { ImageResponse } from 'next/og';

import { getPost } from '~/app/(marketing)/_lib/blog';
import { NuggetOgBackground } from '~/components/og/nugget-og-background';
import { NUGGET_COLORS, OG_SIZE } from '~/lib/og-utils';

// Note: Using Node.js runtime because getPost() needs filesystem access
export const alt = 'Blog Post';
export const size = {
  height: 630,
  width: 1200,
};
export const contentType = 'image/png';

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let post: Awaited<ReturnType<typeof getPost>>;
  try {
    post = await getPost(slug);
  } catch {
    notFound();
  }

  const { title, summary } = post.metadata;
  const truncatedSummary =
    summary && summary.length > 100
      ? `${summary.substring(0, 100)}...`
      : summary;

  // Custom layout for blog posts
  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        height: '100%',
        position: 'relative',
        width: '100%',
      }}
    >
      {/* Nugget-themed background */}
      <NuggetOgBackground height={OG_SIZE.height} width={OG_SIZE.width} />

      {/* Content overlay */}
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          flexDirection: 'column',
          gap: 30,
          height: '100%',
          justifyContent: 'center',
          left: 0,
          padding: '80px 100px',
          position: 'absolute',
          top: 0,
          width: '100%',
        }}
      >
        {/* Blog badge */}
        <div
          style={{
            background: NUGGET_COLORS.BROWN,
            borderRadius: 8,
            color: NUGGET_COLORS.AMBER,
            display: 'flex',
            fontSize: 20,
            fontWeight: 'bold',
            padding: '8px 24px',
            textTransform: 'uppercase',
          }}
        >
          Blog Post
        </div>

        {/* Title */}
        <div
          style={{
            color: NUGGET_COLORS.BROWN,
            display: 'flex',
            fontSize: 56,
            fontWeight: 'bold',
            lineHeight: 1.2,
            textAlign: 'center',
          }}
        >
          {title}
        </div>

        {/* Summary */}
        {truncatedSummary && (
          <div
            style={{
              color: NUGGET_COLORS.BROWN,
              display: 'flex',
              fontSize: 28,
              lineHeight: 1.4,
              opacity: 0.8,
              textAlign: 'center',
            }}
          >
            {truncatedSummary}
          </div>
        )}

        {/* Footer branding */}
        <div
          style={{
            color: NUGGET_COLORS.BROWN,
            display: 'flex',
            fontSize: 24,
            fontWeight: '600',
            marginTop: 20,
            opacity: 0.7,
          }}
        >
          Nugget Blog
        </div>
      </div>
    </div>,
    {
      ...size,
    },
  );
}
