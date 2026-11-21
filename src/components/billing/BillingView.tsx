"use client";

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useMemo, useState } from "react";
import * as signalR from "@microsoft/signalr";
import { CheckCircle2, LoaderCircle, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { API_BASE_URL } from "@/lib/api";
import { getStoredToken } from "@/lib/auth";
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
  const reload = useCallback(async () => {
    const [nextUsage, nextPlans] = await Promise.all([getAiUsage(), getSubscriptionPlans()]);
    setUsage(nextUsage); setPlans(nextPlans);
  }, []);
  const applyPaymentStatus = useCallback(async (paymentId: number) => {
    const next = await getPayment(paymentId);
    setPayment(next);
    if (next.status === "PAID") {
      setMessage(t("Payment received. Your plan is active.", "Đã nhận thanh toán. Gói của bạn đã được kích hoạt."));
      await reload();
    }
  }, [reload, t]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void reload().catch(error => setMessage(error instanceof Error ? error.message : "Unable to load subscription data.")); }, 0);
    return () => window.clearTimeout(timer);
  }, [reload]);
  useEffect(() => {
    if (!payment || payment.status !== "PENDING") return;
    const timer = window.setInterval(() => { void applyPaymentStatus(payment.paymentTransactionId).catch(() => undefined); }, 3000);
    return () => window.clearInterval(timer);
  }, [payment?.paymentTransactionId, payment?.status, applyPaymentStatus]);
  useEffect(() => {
    if (!payment || payment.status !== "PENDING") return;
    let disposed = false;
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE_URL.replace(/\/+$/, "")}/hubs/notifications`, { accessTokenFactory: () => getStoredToken() || "" })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.None)
      .build();
    connection.on("notificationReceived", (notification: { type?: string }) => {
      if (!disposed && notification.type === "PAYMENT_SUCCESS") void applyPaymentStatus(payment.paymentTransactionId).catch(() => undefined);
    });
    void connection.start().catch(() => undefined);
    return () => { disposed = true; void connection.stop(); };
  }, [payment?.paymentTransactionId, payment?.status, applyPaymentStatus]);

  const premiumPlans = useMemo(() => plans.filter(plan => plan.code !== "FREE" && plan.isActive), [plans]);
  const buy = async (plan: SubscriptionPlan) => {
    setBusyPlanId(plan.subscriptionPlanId); setMessage("");
    try { setPayment(await createPayment(plan.subscriptionPlanId)); }
    catch (error) { setMessage(error instanceof Error ? error.message : t("Could not create payment.", "Không thể tạo thanh toán.")); }
    finally { setBusyPlanId(null); }
  };
  if (!usage) return <p className="p-8 text-sm text-[#647068]">{t("Loading subscription…", "Đang tải gói sử dụng…")}</p>;
  return <div className="space-y-7">
    <section className="rounded-3xl border border-[#D9E6DC] bg-[#F0F6EE] p-6 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#658266]">{t("Current plan", "Gói hiện tại")}</p><h1 className="mt-1 font-serif text-3xl font-bold text-[#07241A]">{usage.planName}</h1></div>{usage.isPremium && usage.subscriptionExpiresAt && <p className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#1E3A2F]">{t("Expires", "Hết hạn")}: {formatDate(usage.subscriptionExpiresAt)}</p>}</div><div className="mt-5 grid gap-3 sm:grid-cols-2"><Quota title={t("AI chatbot", "AI chatbot")} used={usage.chatbotUsed} limit={usage.chatbotLimit} /><Quota title={t("AI post creation", "Tạo bài bằng AI")} used={usage.aiPostUsed} limit={usage.aiPostLimit} /></div><p className="mt-4 text-xs text-[#59635C]">{t("Next refill", "Lần cấp lại tiếp theo")}: <strong>{formatDate(usage.nextRefillAt)}</strong></p></section>
    {message && <p role="status" className="rounded-xl border border-[#D9E6DC] bg-white p-3 text-sm text-[#1E3A2F]">{message}</p>}
    <section><h2 className="font-serif text-2xl font-bold text-[#07241A]">{t("Upgrade your plan", "Nâng cấp gói")}</h2><div className="mt-4 grid gap-4 md:grid-cols-2">{premiumPlans.map(plan => {
      const isCurrentPlan = plan.code === usage.planCode;
      return <article key={plan.subscriptionPlanId} className="rounded-2xl border border-[#E5E7DF] bg-white p-5 shadow-sm"><h3 className="font-serif text-xl font-bold text-[#07241A]">{plan.name}</h3><p className="mt-2 text-2xl font-bold text-[#1E3A2F]">{formatVnd(plan.priceVnd)}</p><p className="mt-3 text-sm text-[#59635C]">{plan.chatbotLimit} {t("chatbot uses", "lượt chatbot")} · {plan.aiPostLimit} {t("AI post uses", "lượt tạo bài AI")}</p><p className="mt-1 text-xs text-[#647068]">{t("Refills every", "Cấp lại mỗi")} {plan.refillIntervalHours}h · {plan.durationDays} {t("days", "ngày")}</p>{isCurrentPlan ? <span className="mt-5 inline-flex rounded-xl bg-[#EAF5EE] px-4 py-2.5 text-sm font-semibold text-[#205339]">{t("Current plan", "Gói hiện tại")}</span> : <button type="button" onClick={() => void buy(plan)} disabled={busyPlanId !== null} className="mt-5 rounded-xl bg-[#1E3A2F] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busyPlanId === plan.subscriptionPlanId ? t("Preparing…", "Đang tạo…") : t("Pay with QR", "Thanh toán QR")}</button>}</article>;
    })}</div></section>
    {payment && <PaymentDialog payment={payment} onRefresh={() => void applyPaymentStatus(payment.paymentTransactionId)} onClose={() => setPayment(null)} t={t} />}
  </div>;
}

function PaymentDialog({ payment, onRefresh, onClose, t }: { payment: PaymentTransaction; onRefresh: () => void; onClose: () => void; t: (english: string, vietnamese: string) => string }) {
  const isPaid = payment.status === "PAID";
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#07241A]/55 p-4" role="dialog" aria-modal="true" aria-labelledby="payment-dialog-title"><section className="relative w-full max-w-lg rounded-3xl border border-[#D9E6DC] bg-white p-6 shadow-2xl"><button type="button" aria-label={t("Close payment", "Đóng thanh toán")} onClick={onClose} className="absolute right-4 top-4 rounded-full p-2 text-[#647068] hover:bg-[#F0F6EE]"><X size={20} /></button>{isPaid ? <div className="py-8 text-center"><CheckCircle2 className="mx-auto size-16 text-[#21764B]" /><h2 id="payment-dialog-title" className="mt-4 font-serif text-3xl font-bold text-[#07241A]">{t("Payment successful", "Thanh toán thành công")}</h2><p className="mt-3 text-sm text-[#59635C]">{t("Your plan has been activated.", "Gói của bạn đã được kích hoạt.")}</p><p className="mt-2 font-semibold text-[#1E3A2F]">{payment.planName}</p><button type="button" onClick={onClose} className="mt-6 rounded-xl bg-[#1E3A2F] px-5 py-2.5 text-sm font-semibold text-white">{t("Done", "Hoàn tất")}</button></div> : <><h2 id="payment-dialog-title" className="pr-10 font-serif text-2xl font-bold text-[#07241A]">{t("Scan QR to pay", "Quét QR để thanh toán")}</h2><p className="mt-2 text-sm text-[#647068]">{t("Use the exact transfer content below. This window updates automatically after payment confirmation.", "Dùng đúng nội dung chuyển khoản bên dưới. Cửa sổ này sẽ tự cập nhật sau khi xác nhận thanh toán.")}</p><div className="mt-5 flex flex-col items-center gap-5 rounded-2xl bg-[#F7F9F5] p-5 sm:flex-row sm:items-start"><img src={payment.qrUrl} alt={t("Bank payment QR", "Mã QR thanh toán ngân hàng")} className="h-52 w-52 rounded-xl border border-[#E5E7DF] bg-white object-contain" /><div className="w-full space-y-2 text-sm"><h3 className="font-serif text-xl font-bold text-[#07241A]">{payment.planName}</h3><p className="text-lg font-semibold">{formatVnd(payment.amountVnd)}</p><p className="text-[#647068]">{t("Transfer content", "Nội dung chuyển khoản")}: <strong className="block select-all break-all text-[#1E3A2F]">{payment.transactionCode}</strong></p><p className="text-xs text-[#647068]">{t("Expires", "Hết hạn")}: {formatDate(payment.expiresAt)}</p><p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-[#21764B]"><LoaderCircle className="size-3.5 animate-spin" />{t("Waiting for SePay confirmation", "Đang chờ SePay xác nhận")}</p><button type="button" onClick={onRefresh} className="block text-xs font-semibold text-[#1E3A2F] underline">{t("Check again", "Kiểm tra lại")}</button></div></div></>}</section></div>;
}

function Quota({ title, used, limit }: { title: string; used: number; limit: number }) {
  const percent = Math.min(100, Math.round(used / Math.max(1, limit) * 100));
  return <div className="rounded-2xl bg-white p-4"><div className="flex justify-between text-sm font-semibold text-[#07241A]"><span>{title}</span><span>{used}/{limit}</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-[#E8EDE4]"><div className="h-full rounded-full bg-[#1E3A2F]" style={{ width: `${percent}%` }} /></div></div>;
}
