
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

admin.initializeApp();
// Fix error on line 7: Update Stripe API version to the required preview version
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-12-15.clover' as any });

// Fix errors on lines 10, 11, 12, 20, 21, 24: Correct onCall signature to use a single request object (CallableRequest)
export const createCheckoutSession = functions.https.onCall(async (request: any) => {
  if (!request.auth) throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
  const { priceId, origin } = request.data;
  const uid = request.auth.uid;
  const userRef = admin.firestore().collection('users').doc(uid);
  const user = (await userRef.get()).data();

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: `${origin || 'https://calgemini-ai.web.app'}/?success=true`,
    cancel_url: `${origin || 'https://calgemini-ai.web.app'}/?cancel=true`,
    customer: user?.stripeCustomerId,
    metadata: { uid },
    customer_email: user?.stripeCustomerId ? undefined : request.auth.token.email,
    subscription_data: {
      trial_period_days: 7,
    },
  });

  if (!user?.stripeCustomerId) {
      await userRef.update({ stripeCustomerId: session.customer as string });
  }

  return { url: session.url };
});

// Fix errors on lines 38, 39, 45: Correct onCall signature to use a single request object (CallableRequest)
export const createCustomerPortalSession = functions.https.onCall(async (request: any) => {
  if (!request.auth) throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
  const uid = request.auth.uid;
  const user = (await admin.firestore().collection('users').doc(uid).get()).data();
  if (!user?.stripeCustomerId) throw new functions.https.HttpsError('not-found', 'No customer ID found.');

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${request.data.origin || 'https://calgemini-ai.web.app'}/settings`,
  });

  return { url: session.url };
});

// Fix errors on lines 52, 58, 74, 91, 97: Handle type mismatches in request and response objects by using 'any'
export const stripeWebhook = functions.https.onRequest(async (req: any, res: any) => {
  const sig = req.headers['stripe-signature']!;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  const db = admin.firestore();
  
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const uid = session.metadata!.uid;
    // Cast to any to bypass potential incorrect property mapping on preview Subscription types
    const subscription = (await stripe.subscriptions.retrieve(session.subscription as string)) as any;
    
    await db.collection('users').doc(uid).update({
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: 'active',
      isPro: true,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      scansRemainingToday: 9999
    });
  }

  if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as any;
    const customerId = subscription.customer as string;
    const userSnapshot = await db.collection('users').where('stripeCustomerId', '==', customerId).limit(1).get();
    
    if (!userSnapshot.empty) {
      const userRef = userSnapshot.docs[0].ref;
      const isActive = subscription.status === 'active' || subscription.status === 'trialing';
      await userRef.update({
        subscriptionStatus: subscription.status,
        isPro: isActive,
        subscriptionTier: isActive ? (userSnapshot.docs[0].data().subscriptionTier || 'monthly') : 'free',
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        scansRemainingToday: isActive ? 9999 : 5
      });
    }
  }

  res.json({ received: true });
});
