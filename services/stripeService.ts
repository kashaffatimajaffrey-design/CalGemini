
import { functions, isMock } from './firebase';
import { httpsCallable } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-functions.js";

export const createCheckoutSession = async (priceId: string) => {
  if (isMock) {
    console.warn("Mock Mode: Simulating Stripe Redirect...");
    return { url: window.location.href + "?session_id=mock_session" };
  }
  const createSession = httpsCallable(functions, 'createCheckoutSession');
  const result = await createSession({ 
    priceId,
    origin: window.location.origin 
  });
  return result.data as { url: string };
};

export const createPortalSession = async () => {
  if (isMock) {
    console.warn("Mock Mode: Simulating Customer Portal Redirect...");
    return { url: window.location.href + "?portal=mock" };
  }
  const createPortal = httpsCallable(functions, 'createCustomerPortalSession');
  const result = await createPortal({
    origin: window.location.origin
  });
  return result.data as { url: string };
};
