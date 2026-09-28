import type Stripe from "stripe";

/**
 * État du compte Stripe d'un participant. Ces comptes ne font que recevoir des
 * virements (capacité « transfers ») : ils n'encaissent jamais de carte, donc
 * charges_enabled reste faux et ne doit pas compter.
 */
export function connectStatus(account: Stripe.Account): "active" | "restricted" | "pending" {
  const canReceive = account.capabilities?.transfers === "active" && account.payouts_enabled;
  if (account.details_submitted && canReceive) return "active";
  return account.details_submitted ? "restricted" : "pending";
}
