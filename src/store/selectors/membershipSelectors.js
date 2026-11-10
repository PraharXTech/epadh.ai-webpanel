export const selectPlans = state => state.membership.plans;
export const selectPlansStatus = state => state.membership.plansStatus;
export const selectCheckout = state => state.membership.checkout;
export const selectPendingOrder = state => state.membership.pendingOrder;
export const selectPaymentHistory = state => state.membership.history;
export const selectPaymentHistoryStatus = state =>
  state.membership.historyStatus;
