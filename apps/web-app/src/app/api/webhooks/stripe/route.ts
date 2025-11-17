import { db } from '@nugget/db/client';
import { Families, type stripeSubscriptionStatusEnum } from '@nugget/db/schema';
import { constructWebhookEvent } from '@nugget/stripe';
import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';

export async function POST(req: NextRequest) {
  // Get the webhook signature from headers
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 },
    );
  }

  try {
    // Get the raw body as text for signature verification
    const body = await req.text();

    // Construct and verify the webhook event
    const event = constructWebhookEvent(body, signature);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;

        // Update org with Stripe customer and subscription info
        if (
          session.metadata?.orgId &&
          session.customer &&
          session.subscription
        ) {
          await db
            .update(Families)
            .set({
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
              stripeSubscriptionStatus: 'active',
            })
            .where(eq(Families.id, session.metadata.orgId));
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;

        // Update subscription status
        if (subscription.metadata?.orgId) {
          await db
            .update(Families)
            .set({
              stripeSubscriptionId: subscription.id,
              stripeSubscriptionStatus:
                subscription.status as (typeof stripeSubscriptionStatusEnum.enumValues)[number],
            })
            .where(eq(Families.id, subscription.metadata.orgId));
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;

        // Update subscription status to canceled
        if (subscription.metadata?.orgId) {
          await db
            .update(Families)
            .set({
              stripeSubscriptionStatus: 'canceled',
            })
            .where(eq(Families.id, subscription.metadata.orgId));
        }
        break;
      }

      case 'customer.subscription.trial_will_end': {
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice & {
          subscription?: string | Stripe.Subscription | null;
        };

        // Update subscription status to active if it was past_due
        const subscriptionId =
          typeof invoice.subscription === 'string'
            ? invoice.subscription
            : invoice.subscription?.id;

        if (subscriptionId) {
          const org = await db.query.Families.findFirst({
            where: eq(Families.stripeSubscriptionId, subscriptionId),
          });

          if (org && org.stripeSubscriptionStatus === 'past_due') {
            await db
              .update(Families)
              .set({
                stripeSubscriptionStatus: 'active',
              })
              .where(eq(Families.id, org.id));
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice & {
          subscription?: string | Stripe.Subscription | null;
        };

        // Update subscription status to past_due
        const subscriptionId =
          typeof invoice.subscription === 'string'
            ? invoice.subscription
            : invoice.subscription?.id;

        if (subscriptionId) {
          const org = await db.query.Families.findFirst({
            where: eq(Families.stripeSubscriptionId, subscriptionId),
          });

          if (org) {
            await db
              .update(Families)
              .set({
                stripeSubscriptionStatus: 'past_due',
              })
              .where(eq(Families.id, org.id));
          }
        }
        break;
      }

      case 'customer.updated': {
        break;
      }

      case 'customer.deleted': {
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 },
    );
  }
}
