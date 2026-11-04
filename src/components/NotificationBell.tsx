"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import * as signalR from "@microsoft/signalr";
import { API_BASE_URL } from "@/lib/api";
import { getStoredToken } from "@/lib/auth";
import { getNotifications, getUnreadNotificationCount, markNotificationRead, type UserNotification } from "@/lib/notification-api";

export default function NotificationBell({ userId }: { userId: number }) {
  const [items, setItems] = useState<UserNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const refresh = useCallback(async () => {
    try { const [nextItems, count] = await Promise.all([getNotifications(), getUnreadNotificationCount()]); setItems(nextItems); setUnread(count); setError(false); }
    catch { setError(true); }
  }, []);

  useEffect(() => {
    if (userId <= 0) return;
    let disposed = false;
    let started = false;
    void Promise.resolve().then(refresh);
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE_URL.replace(/\/+$/, "")}/hubs/notifications`, { accessTokenFactory: () => getStoredToken() || "" })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.None)
      .build();
    connection.on("notificationReceived", (item: UserNotification) => {
      setItems(current => current.some(existing => existing.id === item.id) ? current : [item, ...current].slice(0, 100));
      void getUnreadNotificationCount().then(setUnread).catch(() => setError(true));
    });
    connection.onreconnected(() => { if (!disposed) void refresh(); });
    void connection.start().then(() => {
      started = true;
      if (disposed) void connection.stop();
      else void refresh();
    }).catch(() => { if (!disposed) setError(true); });
    return () => {
      disposed = true;
      if (started) void connection.stop();
    };
  }, [userId, refresh]);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  async function read(item: UserNotification) {
    if (!item.isRead) {
      try {
        await markNotificationRead(item.id);
        setItems(current => current.map(entry => entry.id === item.id ? { ...entry, isRead: true } : entry));
        setUnread(current => Math.max(0, current - 1));
      } catch { setError(true); }
    }
    setOpen(false);
  }

  return <div ref={root} className="relative shrink-0">
    <button type="button" aria-label={`Thông báo${unread ? `, ${unread} chưa đọc` : ""}`} aria-expanded={open} title="Thông báo" onClick={() => { setOpen(value => !value); if (!open) void refresh(); }} className="relative flex h-10 w-10 items-center justify-center rounded-md border border-[#EFEEEB] bg-white text-[#1E3A2F] hover:bg-[#EDF3E9]">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>
      {unread > 0 && <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-[#C34422] px-1 text-center text-[10px] font-bold leading-5 text-white">{unread > 99 ? "99+" : unread}</span>}
    </button>
    {open && <div className="absolute right-0 z-[60] mt-2 w-[min(22rem,calc(100vw-2rem))] max-h-[70vh] overflow-y-auto rounded-md border border-[#DFE5D7] bg-white p-2 shadow-xl">
      <div className="flex items-center justify-between border-b border-[#EFEEEB] px-2 py-2"><h2 className="text-sm font-bold text-[#07241A]">Thông báo</h2><button type="button" onClick={() => setOpen(false)} aria-label="Đóng thông báo" className="text-[#647068]">×</button></div>
      {error && <p role="alert" className="p-3 text-xs text-red-700">Chưa kết nối được thông báo trực tiếp. Hãy mở lại để thử tải.</p>}
      {!items.length && !error && <p className="p-4 text-center text-sm text-[#647068]">Chưa có thông báo.</p>}
      {items.map(item => {
        const body = <><span className="block text-sm leading-5">{item.message}</span><time className="mt-1 block text-xs text-[#727974]">{new Date(item.createdAt).toLocaleString("vi-VN")}</time></>;
        const className = `block w-full rounded-md px-3 py-3 text-left hover:bg-[#EDF3E9] ${item.isRead ? "text-[#647068]" : "bg-[#F1F6EE] font-medium text-[#07241A]"}`;
        return item.postId && !item.type.endsWith("REMOVED")
          ? <Link key={item.id} href={`/view-detail/post-${item.postId}`} onClick={() => { void read(item); }} className={className}>{body}</Link>
          : <button key={item.id} type="button" onClick={() => { void read(item); }} className={className}>{body}</button>;
      })}
    </div>}
  </div>;
}
