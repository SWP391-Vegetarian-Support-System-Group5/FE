"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { apiGet } from "@/lib/api";
import AdminLeafLoading from "@/components/ui/AdminLeafLoading";

export interface PaymentPurchase {
  paymentTransactionId: number;
  userId: number;
  userName: string;
  userEmail: string;
  planName: string;
  amountVnd: number;
  purchasedAt: string;
  transactionCode: string;
}

export interface PaymentRevenue {
  totalRevenueVnd: number;
  paidTransactionCount: number;
  purchases: PaymentPurchase[];
}

export default function AdminRevenuePage() {
  const { user } = useAuth();
  const { locale, t } = useLanguage();
  const [revenue, setRevenue] = useState<PaymentRevenue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");

  const loadData = async (signal?: AbortSignal) => {
    setLoading(true);
    setError(false);
    try {
      const data = await apiGet<PaymentRevenue>("/api/admin/billing/revenue", { signal });
      setRevenue(data);
    } catch (err) {
      if (!signal?.aborted) {
        setError(true);
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (user?.role?.toLowerCase() !== "admin") return;
    const controller = new AbortController();
    void loadData(controller.signal);
    return () => controller.abort();
  }, [user?.role]);

  const money = (value: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);

  const dateTime = (value: string) =>
    new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

  const filteredPurchases = useMemo(() => {
    if (!revenue?.purchases) return [];
    const term = query.trim().toLowerCase();
    if (!term) return revenue.purchases;
    return revenue.purchases.filter(
      (item) =>
        item.userName.toLowerCase().includes(term) ||
        item.userEmail.toLowerCase().includes(term) ||
        item.planName.toLowerCase().includes(term) ||
        item.transactionCode.toLowerCase().includes(term)
    );
  }, [revenue?.purchases, query]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#2D5A46]">
            {t("BILLING MANAGEMENT", "QUẢN LÝ THANH TOÁN")}
          </p>
          <h1 className="mt-1 font-serif text-3xl font-bold text-[#07241A] lg:text-4xl">
            {t("Subscription revenue", "Doanh thu gói đăng ký")}
          </h1>
          <p className="mt-1 text-xs text-[#727974]">
            {t(
              "Track all successful subscription payments and monitor member revenue in real time.",
              "Chỉ gồm giao dịch thanh toán thành công. Theo dõi doanh thu thành viên theo thời gian thực."
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/subscription-plans"
            className="rounded-xl border border-[#EFEEEB] bg-white px-4 py-2.5 text-xs font-semibold text-[#424844] shadow-2xs hover:bg-[#F9F8F6] transition"
          >
            {t("Manage Subscription Plans", "Quản lý gói đăng ký")} →
          </Link>
          <button
            type="button"
            onClick={() => void loadData()}
            disabled={loading}
            title={t("Refresh revenue data", "Làm mới dữ liệu doanh thu")}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#EFEEEB] bg-white text-[#424844] shadow-2xs hover:bg-[#F9F8F6] transition disabled:opacity-50"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={loading ? "animate-spin" : ""}
            >
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-[#C2410C]">
          {t("Could not load revenue data. Please try again.", "Không thể tải dữ liệu doanh thu. Vui lòng thử lại sau.")}
        </p>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-[#EFEEEB] bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between text-[#727974]">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {t("Total Revenue", "Tổng doanh thu")}
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EAF5EE] text-[#1E7E51]">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
          </div>
          <p className="mt-3 font-serif text-3xl font-bold text-[#07241A]">
            {loading ? "…" : money(revenue?.totalRevenueVnd ?? 0)}
          </p>
          <p className="mt-1 text-xs text-[#727974]">
            {t("Actual collected income", "Tổng tiền thực thu từ người dùng")}
          </p>
        </div>

        <div className="rounded-2xl border border-[#EFEEEB] bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between text-[#727974]">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {t("Successful Payments", "Giao dịch thành công")}
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E8F1FC] text-[#1E40AF]">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>
          <p className="mt-3 font-serif text-3xl font-bold text-[#07241A]">
            {loading ? "…" : (revenue?.paidTransactionCount ?? 0).toLocaleString(locale)}
          </p>
          <p className="mt-1 text-xs text-[#727974]">
            {t("Verified payment transactions", "Giao dịch đã xác thực thành công")}
          </p>
        </div>
      </div>

      {/* Main Table Container */}
      <section className="overflow-hidden rounded-2xl border border-[#EFEEEB] bg-white shadow-2xs">
        {/* Table Header / Toolbar */}
        <div className="flex flex-col gap-3 border-b border-[#EFEEEB] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-serif text-lg font-bold text-[#07241A]">
              {t("Transaction Ledger", "Lịch sử giao dịch thanh toán")}
            </h2>
            <p className="mt-0.5 text-xs text-[#727974]">
              {t("List of subscription payments processed by the system", "Danh sách thanh toán gói đăng ký đã được ghi nhận")}
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8F948F]"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("Search by account, code, plan…", "Tìm theo tài khoản, mã, gói…")}
              className="w-full rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] py-2 pl-9 pr-3 text-xs text-[#07241A] placeholder-[#8F948F] outline-none transition focus:border-[#1E3A2F] focus:bg-white"
            />
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="py-16 text-center">
            <AdminLeafLoading size="sm" text={t("Loading revenue data…", "Đang tải dữ liệu doanh thu…")} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#EFEEEB] bg-[#FBF9F6] text-[10px] font-bold uppercase tracking-wider text-[#727974]">
                  <th className="px-5 py-3.5">{t("Account", "TÀI KHOẢN")}</th>
                  <th className="px-5 py-3.5">{t("Plan", "GÓI")}</th>
                  <th className="px-5 py-3.5">{t("Amount", "SỐ TIỀN")}</th>
                  <th className="px-5 py-3.5">{t("Purchased at", "THỜI GIAN MUA")}</th>
                  <th className="px-5 py-3.5">{t("Transfer code", "MÃ CHUYỂN KHOẢN")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFEEEB]/60">
                {filteredPurchases.map((payment) => (
                  <tr key={payment.paymentTransactionId} className="hover:bg-[#FBF9F6]/80 transition">
                    <td className="px-5 py-4">
                      <strong className="block text-sm font-semibold text-[#07241A]">{payment.userName}</strong>
                      <span className="text-[11px] text-[#727974]">{payment.userEmail}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center rounded-full border border-[#D5EBDC] bg-[#EAF5EE] px-2.5 py-0.5 text-[11px] font-semibold text-[#1E7E51]">
                        {payment.planName}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-bold text-sm text-[#1E7E51]">
                      {money(payment.amountVnd)}
                    </td>
                    <td className="px-5 py-4 text-[#525854]">
                      {dateTime(payment.purchasedAt)}
                    </td>
                    <td className="px-5 py-4 font-mono text-[11px] text-[#627369]">
                      <span className="rounded-md bg-[#F4F2EE] px-2 py-1">
                        {payment.transactionCode}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredPurchases.length === 0 && (
              <p className="py-10 text-center text-xs text-[#727974]">
                {query
                  ? t("No transactions match your search.", "Không tìm thấy giao dịch nào phù hợp.")
                  : t("No successful subscription payments yet.", "Chưa có giao dịch mua gói thành công.")}
              </p>
            )}
          </div>
        )}

        {/* Table Footer */}
        {!loading && filteredPurchases.length > 0 && (
          <div className="border-t border-[#EFEEEB] px-5 py-3 text-xs text-[#727974]">
            {t("Showing", "Hiển thị")}{" "}
            <strong className="font-semibold text-[#07241A]">{filteredPurchases.length}</strong>{" "}
            {t("of", "trên")}{" "}
            <strong className="font-semibold text-[#07241A]">{revenue?.purchases.length ?? 0}</strong>{" "}
            {t("successful transactions", "giao dịch thành công")}
          </div>
        )}
      </section>
    </div>
  );
}
