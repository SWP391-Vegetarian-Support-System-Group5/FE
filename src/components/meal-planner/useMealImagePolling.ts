"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getStoredToken } from "@/lib/auth";
import { getMealPlan, MealPlanRequestError, type MealPlanResponse } from "@/lib/meal-plan-api";

const intervalMs = 5_000;
const maxDurationMs = 10 * 60_000;
export const hasPendingImages = (plan: MealPlanResponse | null) => !!plan?.meals.some(meal =>
  meal.imageGenerationStatus === "PENDING" || meal.imageGenerationStatus === "PROCESSING");

export function useMealImagePolling({ plan, owner, enabled, busy, onUpdate }: {
  plan: MealPlanResponse | null;
  owner: string | undefined;
  enabled: boolean;
  busy: boolean;
  onUpdate: (plan: MealPlanResponse) => void;
}) {
  const [revision, setRevision] = useState(0);
  const [notice, setNotice] = useState<{ key: string; text: string } | null>(null);
  const windowRef = useRef<{ key: string; deadline: number } | null>(null);
  const haltedRef = useRef<string | null>(null);
  const planId = plan?.mealPlanId;
  const pending = hasPendingImages(plan);
  const key = `${owner}:${planId}:${revision}`;
  const resume = useCallback(() => setRevision(value => value + 1), []);

  useEffect(() => {
    if (!enabled || !owner || !planId || !pending) {
      windowRef.current = null;
      haltedRef.current = null;
      return;
    }
    // Pausing for a manual edit must not restart the ten-minute polling window.
    if (windowRef.current?.key !== key) {
      windowRef.current = { key, deadline: Date.now() + maxDurationMs };
      haltedRef.current = null;
    }
    if (busy || haltedRef.current === key) return;
    const token = getStoredToken();
    if (!token) return;
    const deadline = windowRef.current.deadline;
    let stopped = false;
    let inFlight = false;
    let interval: ReturnType<typeof setInterval> | undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();
    function stop(text?: string) {
      stopped = true;
      clearInterval(interval); clearTimeout(timeout); controller.abort();
      if (text) { haltedRef.current = key; setNotice({ key, text }); }
    }
    function expire() {
      stop("Đã tạm dừng cập nhật ảnh sau 10 phút. Bấm tải lại ảnh để kiểm tra và tiếp tục chờ.");
    }
    async function poll() {
      if (stopped || inFlight) return;
      if (Date.now() >= deadline) { expire(); return; }
      if (getStoredToken() !== token) { stop("Phiên đăng nhập đã thay đổi hoặc hết hạn. Vui lòng đăng nhập lại để cập nhật ảnh."); return; }
      inFlight = true;
      try {
        const fresh = await getMealPlan(planId!, controller.signal);
        if (stopped || controller.signal.aborted) return;
        if (getStoredToken() !== token) { stop("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."); return; }
        onUpdate(fresh);
        setNotice(null);
        if (!hasPendingImages(fresh)) stop();
      } catch (failure) {
        if (stopped || controller.signal.aborted) return;
        const status = failure instanceof MealPlanRequestError ? failure.status : undefined;
        if (status === 401 || status === 403) stop("Phiên đăng nhập không còn hợp lệ hoặc không có quyền xem thực đơn. Vui lòng đăng nhập lại.");
        else if (status === 404) stop("Không tìm thấy thực đơn. Hãy tải lại dữ liệu.");
        else setNotice({ key, text: "Chưa cập nhật được ảnh từ máy chủ. Giữ ảnh hiện tại và tiếp tục kiểm tra trong thời gian chờ." });
      } finally { inFlight = false; }
    }
    if (Date.now() >= deadline) {
      // Use the timer for the real deadline event, including after a paused upload.
      timeout = setTimeout(expire, 0);
    } else {
      interval = setInterval(() => { void poll(); }, intervalMs);
      timeout = setTimeout(expire, deadline - Date.now());
    }
    return () => { stop(); };
  }, [enabled, owner, planId, pending, busy, key, onUpdate]);

  return { imagePollingNotice: notice?.key === key ? notice.text : "", resumeImagePolling: resume };
}
