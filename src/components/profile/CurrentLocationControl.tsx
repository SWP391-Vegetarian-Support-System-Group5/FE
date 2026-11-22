"use client";

import { useCurrentLocation } from "@/context/CurrentLocationContext";
import { useLanguage } from "@/context/LanguageContext";

export default function CurrentLocationControl() {
  const { enabled, status, enable, disable } = useCurrentLocation();
  const { t } = useLanguage();
  const messages = {
    off: t("Allow GPS access to find your address and save it to your profile automatically.", "Cho phép truy cập GPS để tự xác định địa chỉ và lưu vào hồ sơ của bạn."),
    waiting: t("Waiting for location permission or GPS coordinates…", "Đang chờ quyền truy cập vị trí hoặc tọa độ GPS…"),
    saving: t("Finding your address and saving your location…", "Đang xác định địa chỉ và lưu vị trí…"),
    synced: t("Your current address has been saved to your profile.", "Đã lưu địa chỉ hiện tại vào hồ sơ của bạn."),
    denied: t("Location permission was denied. Allow location access in your browser settings and try again.", "Quyền truy cập vị trí đã bị từ chối. Hãy cho phép vị trí trong cài đặt trình duyệt rồi thử lại."),
    unsupported: t("Location requires HTTPS or localhost and a browser that supports GPS access.", "Định vị cần HTTPS hoặc localhost và trình duyệt có hỗ trợ truy cập vị trí."),
    unavailable: t("An accurate location is not available yet. Check your device location settings and try again.", "Chưa lấy được vị trí đủ chính xác. Hãy kiểm tra cài đặt vị trí trên thiết bị rồi thử lại."),
    timeout: t("Getting your location timed out. Please try again.", "Lấy vị trí quá thời gian chờ. Vui lòng thử lại."),
    error: t("Could not find your address or save your location. Please try again.", "Chưa thể xác định địa chỉ hoặc lưu vị trí. Vui lòng thử lại."),
    paused: t("Location updates will resume when you return to this tab.", "Vị trí sẽ tiếp tục cập nhật khi bạn quay lại thẻ này."),
  };
  return <div className="space-y-2">
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" onClick={() => enable()} disabled={status === "waiting" || status === "saving"} className="vm-button text-sm font-semibold text-[#173C2D] underline disabled:cursor-wait disabled:opacity-60">{t("Use current location", "Dùng vị trí hiện tại")}</button>
      {enabled && <button type="button" onClick={disable} className="vm-button text-sm text-[#727974] underline">{t("Stop location updates", "Dừng cập nhật vị trí")}</button>}
    </div>
    <p role="status" className="text-xs leading-5 text-[#727974]">{messages[status]}</p>
  </div>;
}
