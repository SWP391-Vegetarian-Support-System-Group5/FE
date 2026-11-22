import { apiFetch, apiGet } from "@/lib/api";

export interface SubscriptionPlan {
  subscriptionPlanId: number; code: string; name: string; priceVnd: number;
  chatbotLimit: number; aiPostLimit: number; refillIntervalHours: number;
  durationDays: number; isActive: boolean;
}

export interface AiUsage {
  planCode: string; planName: string; isPremium: boolean;
  chatbotUsed: number; chatbotLimit: number; aiPostUsed: number; aiPostLimit: number;
  nextRefillAt: string; subscriptionExpiresAt: string | null;
}

export interface PaymentTransaction {
  paymentTransactionId: number; transactionCode: string; amountVnd: number; status: string;
  qrUrl: string; expiresAt: string; planId: number; planName: string;
}

async function readError(response: Response, fallback: string) {
  const body = await response.json().catch(() => null) as { message?: string; title?: string } | null;
  return body?.message || body?.title || fallback;
}

export const getSubscriptionPlans = () => apiGet<SubscriptionPlan[]>("/api/billing/plans", { cache: "no-store" });
export const getAiUsage = () => apiGet<AiUsage>("/api/billing/usage", { cache: "no-store" });

export async function createPayment(planId: number) {
  const response = await apiFetch("/api/billing/payments", { method: "POST", body: JSON.stringify({ planId }) });
  if (!response.ok) throw new Error(await readError(response, "Could not create payment."));
  return response.json() as Promise<PaymentTransaction>;
}

export async function getPayment(paymentId: number) {
  const response = await apiFetch(`/api/billing/payments/${paymentId}`, { cache: "no-store" });
  if (!response.ok) throw new Error(await readError(response, "Could not check payment status."));
  return response.json() as Promise<PaymentTransaction>;
}

export const getAdminSubscriptionPlans = () => apiGet<SubscriptionPlan[]>("/api/admin/subscription-plans", { cache: "no-store" });

export async function saveSubscriptionPlan(plan: Omit<SubscriptionPlan, "subscriptionPlanId">, id?: number) {
  const response = await apiFetch(`/api/admin/subscription-plans${id ? `/${id}` : ""}`, {
    method: id ? "PUT" : "POST", body: JSON.stringify(plan),
  });
  if (!response.ok) throw new Error(await readError(response, "Could not save plan."));
  return response.json() as Promise<SubscriptionPlan>;
}
