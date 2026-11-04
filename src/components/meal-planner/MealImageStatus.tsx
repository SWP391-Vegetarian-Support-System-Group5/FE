export default function MealImageStatus({ status, error, compact = false }: { status?: string | null; error?: string | null; compact?: boolean }) {
  if (status === "PENDING" || status === "PROCESSING") {
    return <p role="status" className="text-xs text-[#727974]">{status === "PENDING" ? "Ảnh AI đang chờ xử lý…" : "Đang tạo ảnh AI…"}</p>;
  }
  if (status !== "FAILED") return null;
  const quota = /429|quota|rate.?limit|hạn mức/i.test(error || "");
  const message = quota ? "Đã hết quota hoặc đạt giới hạn tạo ảnh AI. Ảnh hiện tại được giữ nguyên; bạn vẫn có thể đổi món." : error || "Không tạo được ảnh AI. Bạn có thể tải ảnh lên hoặc thử tạo lại sau.";
  return <p role="status" title={message} className={`text-xs text-[#99462A] ${compact ? "line-clamp-2 max-w-md" : ""}`}>{compact ? "Chưa tạo được ảnh AI. " : ""}{message}</p>;
}
