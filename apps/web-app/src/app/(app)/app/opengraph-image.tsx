import { ImageResponse } from 'next/og';
import { DefaultOgLayout } from '~/components/og/default-og-layout';

export const runtime = 'edge';
export const alt = 'Nugget App - Track Your Baby';
export const size = {
  height: 630,
  width: 1200,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    <DefaultOgLayout
      footer="Nugget - Track Every Precious Moment"
      subtitle="Feeding, sleep, diapers, milestones & more"
      title="👶 Your Baby's Journey"
    />,
    {
      ...size,
    },
  );
}
