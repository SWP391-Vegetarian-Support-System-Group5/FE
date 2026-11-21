"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { createPayment, getAiUsage, getPayment, getSubscriptionPlans, type AiUsage, type PaymentTransaction, type SubscriptionPlan } from "@/lib/billing-api";

const formatVnd = (value: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);
const formatDate = (value: string) => new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

export default function BillingView() {
  const { t } = useLanguage();
  const [usage, setUsage] = useState<AiUsage | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [payment, setPayment] = useState<PaymentTransaction | null>(null);
  const [busyPlanId, setBusyPlanId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const reload = async () => {
    const [nextUsage, nextPlans] = await Promise.all([getAiUsage(), getSubscriptionPlans()]);
    setUsage(nextUsage); setPlans(nextPlans);
  };
  useEffect(() => {
    const timer = window.setTimeout(() => { void reload().catch(error => setMessage(error instanceof Error ? error.message : "Unable to load subscription data.")); }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (!payment || payment.status !== "PENDING") return;
    const timer = window.setInterval(() => void getPayment(payment.paymentTransactionId).then(next => {
      setPayment(next);
      if (next.status === "PAID") { setMessage(t("Payment received. Your plan is active.", "Đã nhận thanh toán. Gói của bạn đã được kích hoạt.")); void reload(); }
    }).catch(() => undefined), 3000);
    return () => window.clearInterval(timer);
  }, [payment, t]);
  const premiumPlans = useMemo(() => plans.filter(plan => plan.code !== "FREE" && plan.isActive), [plans]);
  const buy = async (plan: SubscriptionPlan) => {
    setBusyPlanId(plan.subscriptionPlanId); setMessage("");
    try { setPayment(await createPayment(plan.subscriptionPlanId)); }
    catch (error) { setMessage(error instanceof Error ? error.message : t("Could not create payment.", "Không thể tạo thanh toán.")); }
    finally { setBusyPlanId(null); }
  };
  if (!usage) return <p className="p-8 text-sm text-[#647068]">{t("Loading subscription…", "Đang tải gói sử dụng…")}</p>;
  return <div className="space-y-7">
    <section className="rounded-3xl border border-[#D9E6DC] bg-[#F0F6EE] p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#658266]">{t("Current plan", "Gói hiện tại")}</p><h1 className="mt-1 font-serif text-3xl font-bold text-[#07241A]">{usage.planName}</h1></div>{usage.isPremium && usage.subscriptionExpiresAt && <p className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#1E3A2F]">{t("Expires", "Hết hạn")}: {formatDate(usage.subscriptionExpiresAt)}</p>}</div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2"><Quota title={t("AI chatbot", "AI chatbot")} used={usage.chatbotUsed} limit={usage.chatbotLimit} /><Quota title={t("AI post creation", "Tạo bài bằng AI")} used={usage.aiPostUsed} limit={usage.aiPostLimit} /></div>
      <p className="mt-4 text-xs text-[#59635C]">{t("Next refill", "Lần cấp lại tiếp theo")}: <strong>{formatDate(usage.nextRefillAt)}</strong></p>
    </section>
    {message && <p role="status" className="rounded-xl border border-[#D9E6DC] bg-white p-3 text-sm text-[#1E3A2F]">{message}</p>}
    <section><h2 className="font-serif text-2xl font-bold text-[#07241A]">{t("Upgrade your plan", "Nâng cấp gói")}</h2><p className="mt-1 text-sm text-[#647068]">{t("Choose a plan, scan the bank QR, and this screen will activate it after SePay confirms the transfer.", "Chọn gói, quét QR ngân hàng và màn hình này sẽ kích hoạt sau khi SePay xác nhận giao dịch.")}</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">{premiumPlans.map(plan => <article key={plan.subscriptionPlanId} className="rounded-2xl border border-[#E5E7DF] bg-white p-5 shadow-sm"><h3 className="font-serif text-xl font-bold text-[#07241A]">{plan.name}</h3><p className="mt-2 text-2xl font-bold text-[#1E3A2F]">{formatVnd(plan.priceVnd)}</p><p className="mt-3 text-sm text-[#59635C]">{plan.chatbotLimit} {t("chatbot uses", "lượt chatbot")} · {plan.aiPostLimit} {t("AI post uses", "lượt tạo bài AI")}</p><p className="mt-1 text-xs text-[#647068]">{t("Refills every", "Cấp lại mỗi")} {plan.refillIntervalHours}h · {plan.durationDays} {t("days", "ngày")}</p><button type="button" onClick={() => void buy(plan)} disabled={busyPlanId !== null} className="mt-5 rounded-xl bg-[#1E3A2F] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busyPlanId === plan.subscriptionPlanId ? t("Preparing…", "Đang tạo…") : t("Pay with QR", "Thanh toán QR")}</button></article>)}</div>
    </section>
    {payment && <section className="rounded-3xl border border-[#D9E6DC] bg-white p-6"><div className="flex flex-col gap-6 sm:flex-row sm:items-center"><img src={payment.qrUrl} alt={t("Bank payment QR", "Mã QR thanh toán ngân hàng")} className="h-52 w-52 rounded-xl border border-[#E5E7DF] object-contain" /><div><h2 className="font-serif text-2xl font-bold text-[#07241A]">{payment.planName}</h2><p className="mt-2 text-lg font-semibold">{formatVnd(payment.amountVnd)}</p><p className="mt-3 text-sm text-[#647068]">{t("Transfer content", "Nội dung chuyển khoản")}: <strong className="select-all text-[#1E3A2F]">{payment.transactionCode}</strong></p><p className="mt-1 text-xs text-[#647068]">{t("Status", "Trạng thái")}: {payment.status} · {t("Expires", "Hết hạn")}: {formatDate(payment.expiresAt)}</p></div></div></section>}
  </div>;
}

function Quota({ title, used, limit }: { title: string; used: number; limit: number }) {
  const percent = Math.min(100, Math.round(used / Math.max(1, limit) * 100));
  return <div className="rounded-2xl bg-white p-4"><div className="flex justify-between text-sm font-semibold text-[#07241A]"><span>{title}</span><span>{used}/{limit}</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-[#E8EDE4]"><div className="h-full rounded-full bg-[#1E3A2F]" style={{ width: `${percent}%` }} /></div></div>;
}
