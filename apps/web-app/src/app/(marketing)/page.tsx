import { Benefits } from '~/app/(marketing)/_components/sections/benefits-section';
import { BentoGrid } from '~/app/(marketing)/_components/sections/bento-section';
import { CTA } from '~/app/(marketing)/_components/sections/cta-section';
import { FAQ } from '~/app/(marketing)/_components/sections/faq-section';
import { FeatureHighlight } from '~/app/(marketing)/_components/sections/feature-highlight-section';
import { FeatureScroll } from '~/app/(marketing)/_components/sections/feature-scroll-section';
import { Features } from '~/app/(marketing)/_components/sections/features-section';
import { Footer } from '~/app/(marketing)/_components/sections/footer-section';
import { Header } from '~/app/(marketing)/_components/sections/header-section';
import { Hero } from '~/app/(marketing)/_components/sections/hero-section';
import { Pricing } from '~/app/(marketing)/_components/sections/pricing-section';
import { Testimonials } from '~/app/(marketing)/_components/sections/testimonials-section';

export default function Home() {
  return (
    <main className="relative">
      <Header />
      <Hero />
      <FeatureScroll />
      <FeatureHighlight />
      <BentoGrid />
      <Benefits />
      <Features />
      <Testimonials />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </main>
  );
}
