// Razorpay Checkout.js, loaded only when a payment is actually started (the script is about
// 100 kB and only the checkout page needs it). Replaces mobile's `react-native-razorpay`.
//
//   await openRazorpayCheckout({ order, planName, prefill, onSuccess, onDismiss })
//
// `order` is what the server's `POST /payments/orders` returned: { orderId, amount (paise),
// currency, keyId }. The key id is a public value. The payment itself is confirmed by the
// server (`POST /payments/verify` with the payment id and signature); this file never decides
// that a payment succeeded.
const SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

let loading = null;

export const loadRazorpayScript = () => {
  if (typeof window !== 'undefined' && window.Razorpay) {
    return Promise.resolve(window.Razorpay);
  }
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = SCRIPT_URL;
      script.async = true;
      script.onload = () =>
        window.Razorpay
          ? resolve(window.Razorpay)
          : reject(new Error('The payment window did not load.'));
      script.onerror = () => {
        script.remove();
        reject(
          new Error(
            'Could not load the payment window. Check your connection and try again.',
          ),
        );
      };
      document.head.appendChild(script);
    }).catch(error => {
      loading = null; // a later attempt may succeed
      throw error;
    });
  }
  return loading;
};

// Opens the payment window. Resolves once it is open; the result arrives through the
// callbacks: `onSuccess({ paymentId, signature })` when the student paid,
// `onDismiss()` when they closed it, `onFailure(message)` when the bank refused the payment.
export const openRazorpayCheckout = async ({
  order,
  planName,
  prefill = {},
  onSuccess,
  onDismiss,
  onFailure,
}) => {
  const Razorpay = await loadRazorpayScript();
  const checkout = new Razorpay({
    key: order.keyId,
    order_id: order.orderId,
    amount: order.amount,
    currency: order.currency,
    name: 'epadh.ai',
    description: planName,
    prefill: {
      name: prefill.name ?? '',
      contact: prefill.contact ?? '',
      email: prefill.email ?? '',
    },
    theme: { color: '#2563eb' },
    handler: response =>
      onSuccess({
        paymentId: response.razorpay_payment_id,
        signature: response.razorpay_signature,
      }),
    modal: { ondismiss: () => onDismiss?.() },
  });
  checkout.on?.('payment.failed', response =>
    onFailure?.(
      response?.error?.description ?? 'The payment did not go through.',
    ),
  );
  checkout.open();
  return checkout;
};
