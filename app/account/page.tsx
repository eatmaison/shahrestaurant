"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  FaArrowRightFromBracket,
  FaAward,
  FaBoxOpen,
  FaBuilding,
  FaCircleCheck,
  FaClock,
  FaCloudArrowUp,
  FaCrown,
  FaEnvelope,
  FaGift,
  FaHourglassHalf,
  FaMoneyBillWave,
  FaReceipt,
  FaStar,
  FaTruck,
  FaUser,
} from "react-icons/fa6";
import { useLang, useStore } from "../providers";
import { COMPANY_DISCOUNT_PCT, formatOrderNumber, ORDER_STATUS_FLOW, VIP_DISCOUNT_PCT, VIP_PRICE, VIP_SALE_PRICE } from "../lib/data";
import type { AccountType, OrderStatus } from "../lib/types";

const statusIcons: Record<OrderStatus, typeof FaClock> = {
  new: FaClock,
  preparing: FaBoxOpen,
  delivery: FaTruck,
  delivered: FaCircleCheck,
};

export default function AccountPage() {
  const { t, lang } = useLang();
  const { currentUser, orders, register, login, logout, buyVip, vipRequests, requestVip, reviews, addReview, hydrated } = useStore();

  const [mode, setMode] = useState<"login" | "register">("login");
  const vipCardRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    adminCode: "",
    accountType: "personal" as AccountType,
    btw: "",
    kvk: "",
    agreement: false,
  });
  const [error, setError] = useState("");
  const [verifyResent, setVerifyResent] = useState(false);

  const resendVerification = async () => {
    await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "resendVerification" }),
    });
    setVerifyResent(true);
  };
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");

  const errorText = (code?: string) => {
    switch (code) {
      case "emailTaken": return t.auth.emailTaken;
      case "wrongAdminCode": return t.auth.wrongAdminCode;
      case "invalidLogin": return t.auth.invalidLogin;
      case "fillFields": return t.auth.fillFields;
      case "companyFields": return t.company.fillCompanyFields;
      case "agreement": return t.company.acceptAgreement;
      default: return "";
    }
  };

  const statusLabel = (s: OrderStatus): string =>
    s === "new"
      ? t.fulfillment.statusNew
      : s === "preparing"
        ? t.fulfillment.statusPreparing
        : s === "delivery"
          ? t.fulfillment.statusDelivery
          : t.fulfillment.statusDelivered;

  // Upload a photo of an existing physical VIP card for admin approval.
  const onVipCardFile = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      void requestVip(reader.result as string);
      if (vipCardRef.current) vipCardRef.current.value = "";
    };
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    setError("");
    if (mode === "register") {
      const res = await register({ ...form, agreementAccepted: form.agreement });
      if (!res.ok) setError(errorText(res.error));
    } else {
      const res = await login(form.email, form.password);
      if (!res.ok) setError(errorText(res.error));
    }
  };

  if (!hydrated) {
    return <div className="mx-auto max-w-md px-4 py-20 text-center text-sm text-slate-500">…</div>;
  }

  /* Logged-in dashboard */
  if (currentUser) {
    const myOrders = orders.filter((o) => o.userId === currentUser.id);
    const isCompany = currentUser.accountType === "company";
    const discount = isCompany ? COMPANY_DISCOUNT_PCT : currentUser.isVip ? VIP_DISCOUNT_PCT : 0;
    const pendingVipRequest = vipRequests.find((r) => r.userId === currentUser.id && r.status === "pending");

    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span
              className={`grid h-14 w-14 place-items-center rounded-2xl text-2xl ${
                isCompany
                  ? "bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/30"
                  : currentUser.isVip
                    ? "bg-gradient-to-br from-amber-400 to-yellow-600 text-white shadow-lg shadow-amber-500/30"
                    : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {isCompany ? <FaBuilding /> : currentUser.isVip || currentUser.role === "admin" ? <FaCrown /> : <FaUser />}
            </span>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t.auth.welcome},</p>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">{currentUser.name}</h1>
                {isCompany ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 px-3 py-1 text-xs font-black uppercase tracking-wide text-white shadow-md shadow-sky-500/30">
                    <FaBuilding className="text-[0.65rem]" /> {t.company.badge} −20%
                  </span>
                ) : currentUser.isVip ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 px-3 py-1 text-xs font-black uppercase tracking-wide text-white shadow-md shadow-amber-500/30">
                    <FaCrown className="text-[0.65rem]" /> {t.vip.badge}
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">{currentUser.email}</p>
              {isCompany && (
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {t.company.btw}: {currentUser.btw} · {t.company.kvk}: {currentUser.kvk}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {currentUser.role === "admin" && (
              <Link href="/admin" className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-white/10">
                <FaCrown /> {t.nav.admin}
              </Link>
            )}
            <button onClick={logout} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-red-400 hover:text-red-600 dark:border-white/10 dark:text-slate-300">
              <FaArrowRightFromBracket /> {t.common.signOut}
            </button>
          </div>
        </div>

        {/* Email verification banner */}
        {!currentUser.emailVerified && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300/60 bg-amber-50 px-5 py-4 dark:border-amber-400/30 dark:bg-amber-500/10">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-400/20 text-amber-600 dark:text-amber-400">
                <FaEnvelope />
              </span>
              <div>
                <p className="text-sm font-black text-slate-900 dark:text-white">{t.email.verifyBanner}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">{t.email.verifyBannerSub}</p>
              </div>
            </div>
            {verifyResent ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                <FaCircleCheck /> {t.email.resendSent}
              </span>
            ) : (
              <button
                onClick={resendVerification}
                className="rounded-full border border-amber-400 bg-white px-4 py-2 text-sm font-bold text-amber-700 transition hover:bg-amber-50 dark:bg-white/5 dark:text-amber-300 dark:hover:bg-white/10"
              >
                {t.email.resend}
              </button>
            )}
          </div>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
            <FaReceipt className="text-xl text-emerald-600 dark:text-emerald-400" />
            <p className="mt-3 text-3xl font-black text-slate-900 dark:text-white">{currentUser.orderCount}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t.auth.ordersPlaced}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
            <FaAward className="text-xl text-emerald-600 dark:text-emerald-400" />
            <p className="mt-3 text-3xl font-black text-slate-900 dark:text-white">{currentUser.points}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t.auth.loyaltyPoints}</p>
          </div>
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-500/20 dark:bg-emerald-500/10">
            <FaGift className="text-xl text-emerald-600 dark:text-emerald-400" />
            <p className="mt-3 text-3xl font-black text-emerald-700 dark:text-emerald-300">{discount}%</p>
            <p className="text-sm text-emerald-700/80 dark:text-emerald-300/80">{t.auth.currentDiscount}</p>
          </div>
        </div>

        {/* VIP / Company membership */}
        {isCompany ? (
          <div className="mt-4 overflow-hidden rounded-3xl border border-sky-300/60 bg-gradient-to-r from-sky-500/15 via-indigo-500/10 to-sky-500/15 p-5 dark:border-sky-400/30">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-xl text-white shadow-lg shadow-sky-500/30">
                <FaBuilding />
              </span>
              <div>
                <p className="text-base font-black text-sky-700 dark:text-sky-300">{t.company.active}</p>
                <p className="text-sm text-sky-700/80 dark:text-sky-300/80">{t.company.activeDesc}</p>
              </div>
            </div>
          </div>
        ) : currentUser.isVip ? (
          <div className="mt-4 overflow-hidden rounded-3xl border border-amber-300/60 bg-gradient-to-r from-amber-400/15 via-yellow-400/10 to-amber-400/15 p-5 dark:border-amber-400/30">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 text-xl text-white shadow-lg shadow-amber-500/30">
                <FaCrown />
              </span>
              <div>
                <p className="text-base font-black text-amber-700 dark:text-amber-300">{t.vip.active}</p>
                <p className="text-sm text-amber-700/80 dark:text-amber-300/80">{t.vip.activeDesc}</p>
              </div>
            </div>
          </div>
        ) : pendingVipRequest ? (
          <div className="mt-4 overflow-hidden rounded-3xl border border-amber-300/60 bg-white p-5 dark:border-amber-400/30 dark:bg-white/5">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-400/20 text-xl text-amber-600 dark:text-amber-400">
                <FaHourglassHalf />
              </span>
              <div>
                <p className="text-base font-black text-slate-900 dark:text-white">{t.vip.requestPending}</p>
                <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">{t.vip.requestPendingDesc}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-3xl border border-amber-300/60 bg-white p-5 dark:border-amber-400/30 dark:bg-white/5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 text-xl text-white shadow-lg shadow-amber-500/30">
                  <FaCrown />
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-black text-slate-900 dark:text-white">{t.vip.title}</p>
                    <span className="rounded-full bg-red-500 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-white">
                      {t.vip.saleTag}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">{t.vip.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-slate-400 line-through dark:text-slate-500">
                    {t.vip.standardPrice}: €{VIP_PRICE.toFixed(2)}
                  </p>
                  <p className="text-2xl font-black text-amber-600 dark:text-amber-400">€{VIP_SALE_PRICE.toFixed(2)}</p>
                </div>
                <button
                  onClick={async () => {
                    const res = await buyVip();
                    if (res.checkoutUrl) window.location.href = res.checkoutUrl;
                  }}
                  className="rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-amber-500/30 transition hover:-translate-y-0.5 hover:shadow-xl"
                >
                  {t.vip.buy}
                </button>
              </div>
            </div>

            {/* Already have a physical VIP card? Upload it for approval. */}
            <div className="mt-5 flex items-center gap-3">
              <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
              <span className="text-xs font-bold uppercase tracking-wide text-slate-400">{t.vip.or}</span>
              <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-dashed border-amber-300/70 bg-amber-50/50 p-4 dark:border-amber-400/30 dark:bg-amber-500/5">
              <div>
                <p className="text-sm font-black text-slate-900 dark:text-white">{t.vip.haveCard}</p>
                <p className="mt-0.5 max-w-md text-xs text-slate-600 dark:text-slate-400">{t.vip.haveCardDesc}</p>
              </div>
              <button
                onClick={() => vipCardRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-full border border-amber-400 bg-white px-5 py-2.5 text-sm font-bold text-amber-700 transition hover:bg-amber-50 dark:bg-white/5 dark:text-amber-300 dark:hover:bg-white/10"
              >
                <FaCloudArrowUp /> {t.vip.uploadCard}
              </button>
              <input ref={vipCardRef} type="file" accept="image/*" className="hidden" onChange={(e) => onVipCardFile(e.target.files?.[0])} />
            </div>
          </div>
        )}

        <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">{t.auth.loyaltyPoints}</p>
          <p className="mt-1 text-sm leading-7 text-slate-600 dark:text-slate-400">{t.auth.loyaltyExplain}</p>
        </div>

        <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
          <h2 className="text-lg font-black text-slate-900 dark:text-white">{t.admin.recentOrders}</h2>
          {myOrders.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{t.admin.noOrders}</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {myOrders.slice(0, 8).map((o) => {
                const existing = reviews.find((r) => r.orderId === o.id);
                return (
                  <li key={o.id} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-white/5 dark:bg-white/5">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="flex flex-col text-slate-600 dark:text-slate-300">
                        <span className="font-black text-slate-900 dark:text-white">{formatOrderNumber(o.orderNumber)}</span>
                        <span className="text-xs">
                          {new Date(o.createdAt).toLocaleDateString(lang === "nl" ? "nl-NL" : "en-GB")} · {o.items.reduce((s, i) => s + i.qty, 0)} {t.common.items}
                        </span>
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">€{o.total.toFixed(2)}</span>
                    </div>

                    {/* Live order status tracker */}
                    <div className="mt-3 rounded-xl bg-white p-3 dark:bg-white/5">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{t.fulfillment.trackOrder}</p>
                        {o.paid ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                            <FaCircleCheck /> {t.fulfillment.paid}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                            <FaMoneyBillWave /> {t.fulfillment.invoiced}
                          </span>
                        )}
                      </div>
                      <div className="mt-3 flex items-center">
                        {ORDER_STATUS_FLOW.map((s, i) => {
                          const StepIcon = statusIcons[s];
                          const currentStep = ORDER_STATUS_FLOW.indexOf(o.status);
                          const reached = i <= currentStep;
                          return (
                            <div key={s} className="flex flex-1 items-center last:flex-none">
                              <div className="flex flex-col items-center">
                                <span
                                  className={`grid h-8 w-8 place-items-center rounded-full text-xs transition ${
                                    reached
                                      ? "bg-emerald-600 text-white"
                                      : "bg-slate-200 text-slate-400 dark:bg-white/10 dark:text-slate-500"
                                  } ${i === currentStep && o.status !== "delivered" ? "ring-4 ring-emerald-500/20" : ""}`}
                                >
                                  <StepIcon />
                                </span>
                                <span
                                  className={`mt-1 hidden text-[10px] font-semibold sm:block ${
                                    reached ? "text-emerald-700 dark:text-emerald-300" : "text-slate-400"
                                  }`}
                                >
                                  {statusLabel(s)}
                                </span>
                              </div>
                              {i < ORDER_STATUS_FLOW.length - 1 && (
                                <div
                                  className={`mx-1 h-0.5 flex-1 rounded-full transition ${
                                    i < currentStep ? "bg-emerald-600" : "bg-slate-200 dark:bg-white/10"
                                  }`}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <p className="mt-2 text-center text-xs font-bold text-emerald-700 dark:text-emerald-300 sm:hidden">
                        {statusLabel(o.status)}
                      </p>
                    </div>

                    {o.schedule && (
                      <p className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-2.5 py-1 text-xs font-semibold text-sky-700 dark:text-sky-300">
                        📅{" "}
                        {o.schedule.type === "workdays"
                          ? `${t.schedule.everyWorkday} ${o.schedule.time}`
                          : `${t.schedule.scheduledFor} ${o.schedule.date} ${o.schedule.time}`}
                      </p>
                    )}

                    {existing ? (
                      <div className="mt-2 rounded-xl bg-white p-3 dark:bg-white/5">
                        <div className="flex items-center gap-2">
                          <span className="flex text-amber-400">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <FaStar key={s} className={s <= existing.rating ? "" : "opacity-25"} />
                            ))}
                          </span>
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t.reviews.reviewed}</span>
                        </div>
                        {existing.text && (
                          <p className="mt-1.5 text-sm leading-6 text-slate-600 dark:text-slate-300">{existing.text}</p>
                        )}
                      </div>
                    ) : reviewingId === o.id ? (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t.reviews.yourRating}</p>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <button
                              key={s}
                              onClick={() => setRating(s)}
                              className={`text-2xl transition hover:scale-110 ${s <= rating ? "text-amber-400" : "text-slate-300 dark:text-slate-600"}`}
                              aria-label={`${s}/5`}
                            >
                              <FaStar />
                            </button>
                          ))}
                        </div>
                        <textarea
                          value={reviewText}
                          onChange={(e) => setReviewText(e.target.value)}
                          placeholder={t.reviews.placeholder}
                          rows={3}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                        />
                        <button
                          onClick={async () => {
                            const res = await addReview({ orderId: o.id, rating, text: reviewText });
                            if (res.ok) {
                              setReviewingId(null);
                              setReviewText("");
                              setRating(5);
                            }
                          }}
                          className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-500"
                        >
                          {t.reviews.submit}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setReviewingId(o.id); setRating(5); setReviewText(""); }}
                        className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-amber-300/60 bg-amber-400/10 px-3 py-1.5 text-xs font-bold text-amber-700 transition hover:bg-amber-400/20 dark:text-amber-300"
                      >
                        <FaStar /> {t.reviews.leaveReview}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    );
  }

  /* Auth form */
  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-12 sm:px-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 dark:border-white/10 dark:bg-[#0c1420] sm:p-8">
        <div className="mb-6 flex rounded-full bg-slate-100 p-1 dark:bg-white/5">
          <button
            onClick={() => { setMode("login"); setError(""); }}
            className={`flex-1 rounded-full py-2 text-sm font-bold transition ${mode === "login" ? "bg-emerald-600 text-white" : "text-slate-500 dark:text-slate-400"}`}
          >
            {t.common.signIn}
          </button>
          <button
            onClick={() => { setMode("register"); setError(""); }}
            className={`flex-1 rounded-full py-2 text-sm font-bold transition ${mode === "register" ? "bg-emerald-600 text-white" : "text-slate-500 dark:text-slate-400"}`}
          >
            {t.common.signUp}
          </button>
        </div>

        <h1 className="text-xl font-black text-slate-900 dark:text-white">
          {mode === "login" ? t.auth.loginTitle : t.auth.registerTitle}
        </h1>

        <div className="mt-5 space-y-3">
          {mode === "register" && (
            <>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{t.company.registerAs}</p>
              <div className="flex rounded-full bg-slate-100 p-1 dark:bg-white/5">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, accountType: "personal" })}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-full py-2 text-sm font-bold transition ${
                    form.accountType === "personal" ? "bg-emerald-600 text-white" : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  <FaUser className="text-xs" /> {t.company.personal}
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, accountType: "company" })}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-full py-2 text-sm font-bold transition ${
                    form.accountType === "company" ? "bg-sky-600 text-white" : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  <FaBuilding className="text-xs" /> {t.company.company}
                </button>
              </div>
              {form.accountType === "company" && (
                <p className="rounded-xl bg-sky-500/10 px-3 py-2 text-xs font-semibold leading-5 text-sky-700 dark:text-sky-300">
                  {t.company.badge}: −20% · {t.order.foodOnlyNote}
                </p>
              )}
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={t.auth.name}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
            </>
          )}
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder={t.auth.email}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
          />
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder={t.auth.password}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
          />
          {mode === "register" && (
            <>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder={t.auth.phone}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
              {form.accountType === "company" && (
                <>
                  <input
                    value={form.btw}
                    onChange={(e) => setForm({ ...form, btw: e.target.value })}
                    placeholder={t.company.btw}
                    className="w-full rounded-xl border border-sky-300/60 bg-sky-500/5 px-3.5 py-3 text-sm outline-none transition focus:border-sky-500 dark:border-sky-400/30 dark:bg-white/5 dark:text-white"
                  />
                  <input
                    value={form.kvk}
                    onChange={(e) => setForm({ ...form, kvk: e.target.value })}
                    placeholder={t.company.kvk}
                    className="w-full rounded-xl border border-sky-300/60 bg-sky-500/5 px-3.5 py-3 text-sm outline-none transition focus:border-sky-500 dark:border-sky-400/30 dark:bg-white/5 dark:text-white"
                  />
                  <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-sky-300/60 bg-sky-500/5 p-3 dark:border-sky-400/30">
                    <input
                      type="checkbox"
                      checked={form.agreement}
                      onChange={(e) => setForm({ ...form, agreement: e.target.checked })}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-sky-600"
                    />
                    <span className="text-xs leading-5 text-slate-600 dark:text-slate-300">{t.company.agreement}</span>
                  </label>
                </>
              )}
              <input
                value={form.adminCode}
                onChange={(e) => setForm({ ...form, adminCode: e.target.value })}
                placeholder={t.auth.adminCode}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
              <p className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                <FaCircleCheck className="text-emerald-500" /> {t.auth.adminCodeHint}
              </p>
            </>
          )}
        </div>

        {error && <p className="mt-3 rounded-xl bg-red-500/10 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400">{error}</p>}

        <button
          onClick={submit}
          className="mt-5 w-full rounded-full bg-emerald-600 py-3 text-sm font-bold text-white transition hover:bg-emerald-500"
        >
          {mode === "login" ? t.auth.loginButton : t.auth.registerButton}
        </button>

        {mode === "login" && (
          <p className="mt-3 text-center">
            <Link href="/forgot-password" className="text-sm font-semibold text-slate-500 transition hover:text-emerald-600 dark:text-slate-400">
              {t.email.forgotLink}
            </Link>
          </p>
        )}

        <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
          {mode === "login" ? t.auth.noAccount : t.auth.haveAccount}{" "}
          <button
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
            className="font-bold text-emerald-700 dark:text-emerald-400"
          >
            {mode === "login" ? t.common.signUp : t.common.signIn}
          </button>
        </p>
      </div>
    </div>
  );
}
