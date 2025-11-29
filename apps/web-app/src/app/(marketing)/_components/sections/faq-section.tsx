import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@nugget/ui/accordion';
import { Section } from '~/app/(marketing)/_components/section';
import { siteConfig } from '~/app/(marketing)/_lib/config';

export function FAQ() {
  const faqs = siteConfig.faqSection?.faQitems || [];

  return (
    <Section
      className="container px-10 mx-auto max-w-[var(--max-container-width)]"
      id="faq"
      subtitle="Frequently Asked Questions"
      title="FAQ"
    >
      <Accordion
        className="w-full max-w-2xl mx-auto py-10"
        collapsible
        type="single"
      >
        {faqs.map((faq, index) => (
          <AccordionItem key={faq.id || index} value={`item-${index}`}>
            <AccordionTrigger className="text-left hover:no-underline">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent>{faq.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Section>
  );
}
