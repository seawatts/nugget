import { ImageResponse } from 'next/og';
import { DefaultOgLayout } from '~/components/og/default-og-layout';

export const runtime = 'edge';
export const alt = 'Nugget - Your Parenting Journey Companion';
export const size = {
  height: 630,
  width: 1200,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    <DefaultOgLayout
      footer="Nugget - Track Every Precious Moment"
      subtitle="Track your cycle, pregnancy, and baby's milestones"
      title="🥘 Nugget"
    />,
    {
      ...size,
    },
  );
}
