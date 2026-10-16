"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import UiText, { useUiText, LanguageSwitch } from "@/components/UiText";
import { useAuth } from "@/context/AuthContext";

export interface AllergenVerificationRequest {
  id: string; // e.g. "REQ-101"
  name: string; // e.g. "Roasted Salted Cashews"
  status: "Pending" | "Approved" | "Rejected";
  tagType: "valid" | "duplicate" | "alert";
  tagText: string;
  userName: string;
  userId: string; // e.g. "#VM-2084"
  userAvatar?: string;
  userInitials?: string;
  timeAgo: string;
  descriptionIcon: "sparkle" | "link" | "shield" | "warning";
  descriptionText: string;
  suggestedCanonicalCategory: string;
  isClean: boolean;
}

const INITIAL_REQUESTS: AllergenVerificationRequest[] = [
  {
    id: "REQ-01",
    name: "Roasted Salted Cashews",
    status: "Pending",
    tagType: "valid",
    tagText: "Valid item - Suggested category: Tree Nuts",
    userName: "Minh Tran",
    userId: "#VM-2084",
    userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
    timeAgo: "1 hour ago",
    descriptionIcon: "sparkle",
    descriptionText: "AI confidence score 94% - matches Tree Nuts group. Clean submission without typos.",
    suggestedCanonicalCategory: "Tree Nuts (Hạt cây)",
    isClean: true,
  },
  {
    id: "REQ-02",
    name: "Wheat Gluten / Vital Wheat Gluten",
    status: "Pending",
    tagType: "duplicate",
    tagText: "Duplicate warning: Matches existing 'Gluten (Wheat Gluten)'",
    userName: "Hoang Le",
    userId: "#VM-3301",
    userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80",
    timeAgo: "1 hour ago",
    descriptionIcon: "link",
    descriptionText: "User entered local term for vital wheat gluten. Suggested mapping to canonical allergen 'Gluten'.",
    suggestedCanonicalCategory: "Gluten & Wheat",
    isClean: false,
  },
  {
    id: "REQ-03",
    name: "Black Wood Ear Mushroom",
    status: "Pending",
    tagType: "valid",
    tagText: "Valid item - Specific mushroom allergy",
    userName: "Lan Nguyen",
    userId: "#VM-1092",
    userAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=120&q=80",
    timeAgo: "2 hours ago",
    descriptionIcon: "shield",
    descriptionText: "Recognized edible fungus allergy (Auricularia auricula-judae). Safe for profile sync.",
    suggestedCanonicalCategory: "Edible Mushrooms & Fungi",
    isClean: true,
  },
  {
    id: "REQ-04",
    name: "vegetarian pork fake meat 1234",
    status: "Pending",
    tagType: "alert",
    tagText: "Alert: Contains invalid number suffix / Non-allergen food preference",
    userName: "Khanh Vu",
    userId: "#VM-4099",
    userInitials: "KV",
    timeAgo: "1 hour ago",
    descriptionIcon: "warning",
    descriptionText: "System warning: Item contains trailing digits ('1234') and appears to describe dietary dish preference rather than a biological food allergy.",
    suggestedCanonicalCategory: "Invalid Entry / Dish Preference",
    isClean: false,
  },
  {
    id: "REQ-05",
    name: "Pure Sesame Paste / Tahini",
    status: "Pending",
    tagType: "valid",
    tagText: "Valid item - Suggested category: Sesame & Seeds",
    userName: "Thao Dang",
    userId: "#VM-2415",
    userAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
    timeAgo: "3 hours ago",
    descriptionIcon: "sparkle",
    descriptionText: "AI confidence score 96% - maps to Sesame & Tahini canonical allergen.",
    suggestedCanonicalCategory: "Sesame & Tahini",
    isClean: true,
  },
  {
    id: "REQ-06",
    name: "Peanut Satay Sauce with Chili",
    status: "Pending",
    tagType: "duplicate",
    tagText: "Duplicate warning: Matches existing 'Peanuts & Groundnuts'",
    userName: "Duc Nguyen",
    userId: "#VM-1833",
    userAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80",
    timeAgo: "3 hours ago",
    descriptionIcon: "link",
    descriptionText: "Sauce preparation containing peanuts. Suggested mapping to canonical 'Peanuts'.",
    suggestedCanonicalCategory: "Peanuts & Groundnuts",
    isClean: false,
  },
  {
    id: "REQ-07",
    name: "Organic Raw Almond Milk",
    status: "Pending",
    tagType: "valid",
    tagText: "Valid item - Suggested category: Tree Nuts",
    userName: "Phuong Mai",
    userId: "#VM-3049",
    userAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80",
    timeAgo: "4 hours ago",
    descriptionIcon: "sparkle",
    descriptionText: "High confidence tree nut derivative. Ready for canonical profile sync.",
    suggestedCanonicalCategory: "Tree Nuts (Hạt cây)",
    isClean: true,
  },
  {
    id: "REQ-08",
    name: "Fermented Soybean / Natto",
    status: "Pending",
    tagType: "valid",
    tagText: "Valid item - Suggested category: Soy & Legumes",
    userName: "Quang Le",
    userId: "#VM-1577",
    userInitials: "QL",
    timeAgo: "5 hours ago",
    descriptionIcon: "shield",
    descriptionText: "Soybean allergen derivative commonly found in East Asian fermented recipes.",
    suggestedCanonicalCategory: "Soy & Soybeans",
    isClean: true,
  },
  {
    id: "REQ-09",
    name: "I hate spicy chili sauce 999",
    status: "Pending",
    tagType: "alert",
    tagText: "Alert: Subjective taste dislike / Trailing numbers",
    userName: "Huy Tran",
    userId: "#VM-4921",
    userInitials: "HT",
    timeAgo: "5 hours ago",
    descriptionIcon: "warning",
    descriptionText: "Subjective taste preference entered into medical allergen field. Should be rejected.",
    suggestedCanonicalCategory: "Non-medical Preference",
    isClean: false,
  },
  {
    id: "REQ-10",
    name: "Cow Milk Whey Protein Isolate",
    status: "Pending",
    tagType: "duplicate",
    tagText: "Duplicate warning: Matches canonical 'Dairy & Lactose'",
    userName: "Bao Chau",
    userId: "#VM-2208",
    userAvatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80",
    timeAgo: "6 hours ago",
    descriptionIcon: "link",
    descriptionText: "Dairy protein fraction. Direct alias of Dairy & Lactose allergy.",
    suggestedCanonicalCategory: "Dairy & Lactose",
    isClean: false,
  },
  {
    id: "REQ-11",
    name: "Enoki Mushroom (Kim Châm)",
    status: "Pending",
    tagType: "valid",
    tagText: "Valid item - Specific mushroom allergy",
    userName: "Tram Anh",
    userId: "#VM-1994",
    userAvatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=120&q=80",
    timeAgo: "7 hours ago",
    descriptionIcon: "shield",
    descriptionText: "Flammulina velutipes mushroom allergy. Verified scientific nomenclature.",
    suggestedCanonicalCategory: "Edible Mushrooms & Fungi",
    isClean: true,
  },
  {
    id: "REQ-12",
    name: "Pine Nuts (Hạt thông)",
    status: "Pending",
    tagType: "valid",
    tagText: "Valid item - Suggested category: Tree Nuts",
    userName: "Viet Anh",
    userId: "#VM-3882",
    userAvatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80",
    timeAgo: "8 hours ago",
    descriptionIcon: "sparkle",
    descriptionText: "Clean submission. High anaphylactic risk group recognized globally.",
    suggestedCanonicalCategory: "Tree Nuts (Hạt cây)",
    isClean: true,
  },
];

export default function AdminAllergensPage() {
  const ui = useUiText();
  const { user } = useAuth();

  // Requests state
  const [requests, setRequests] = useState<AllergenVerificationRequest[]>(INITIAL_REQUESTS);
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [searchAdmin, setSearchAdmin] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  // Normalize Modal State
  const [isNormalizeModalOpen, setIsNormalizeModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AllergenVerificationRequest | null>(null);
  const [normalizedName, setNormalizedName] = useState("");
  const [normalizedCategory, setNormalizedCategory] = useState("Tree Nuts (Hạt cây)");
  const [normalizationNotes, setNormalizationNotes] = useState("");

  // Reject Reason Modal State
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectingRequest, setRejectingRequest] = useState<AllergenVerificationRequest | null>(null);
  const [rejectReason, setRejectReason] = useState("Contains non-allergen dietary preference or invalid format.");

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  // Stats calculation
  const pendingCount = requests.filter((r) => r.status === "Pending").length;
  const approvedTodayCount = 28 + requests.filter((r) => r.status === "Approved").length;
  const rejectedCount = 5 + requests.filter((r) => r.status === "Rejected").length;

  // Filter requests
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      // Tab filter
      if (activeTab === "pending" && r.status !== "Pending") return false;
      if (activeTab === "approved" && r.status !== "Approved") return false;
      if (activeTab === "rejected" && r.status !== "Rejected") return false;

      // Search filter
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        r.userName.toLowerCase().includes(q) ||
        r.userId.toLowerCase().includes(q) ||
        r.suggestedCanonicalCategory.toLowerCase().includes(q)
      );
    });
  }, [requests, activeTab, searchQuery]);

  // Handle Approve & Sync
  const handleApprove = (id: string, name: string) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "Approved" } : r))
    );
    showToast(`Approved and synced "${name}" to user profile`);
  };

  // Handle Batch Approve Clean Items
  const handleBatchApproveClean = () => {
    const cleanPending = requests.filter((r) => r.status === "Pending" && r.isClean);
    if (cleanPending.length === 0) {
      showToast("No pending clean items found to batch approve");
      return;
    }

    setRequests((prev) =>
      prev.map((r) => (r.status === "Pending" && r.isClean ? { ...r, status: "Approved" } : r))
    );
    showToast(`Batch approved ${cleanPending.length} clean allergen items`);
  };

  // Open Reject Modal
  const handleOpenRejectModal = (r: AllergenVerificationRequest) => {
    setRejectingRequest(r);
    setRejectReason(
      r.tagType === "alert"
        ? "Item contains invalid formatting / dietary preference rather than medical allergen."
        : "Item already exists as a canonical allergen or does not meet clinical criteria."
    );
    setIsRejectModalOpen(true);
  };

  // Confirm Reject
  const handleConfirmReject = () => {
    if (!rejectingRequest) return;
    setRequests((prev) =>
      prev.map((r) => (r.id === rejectingRequest.id ? { ...r, status: "Rejected" } : r))
    );
    showToast(`Rejected "${rejectingRequest.name}" and sent explanation notice to ${rejectingRequest.userName}`);
    setIsRejectModalOpen(false);
  };

  // Open Normalize Modal
  const handleOpenNormalize = (r: AllergenVerificationRequest) => {
    setSelectedRequest(r);
    setNormalizedName(r.name.replace(/\s*\/\s*.*$/, "")); // Strip slashes or clean up
    setNormalizedCategory(r.suggestedCanonicalCategory);
    setNormalizationNotes(`Mapped to canonical profile '${r.suggestedCanonicalCategory}'`);
    setIsNormalizeModalOpen(true);
  };

  // Save Normalization & Approve
  const handleSaveNormalize = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !normalizedName.trim()) return;

    setRequests((prev) =>
      prev.map((r) =>
        r.id === selectedRequest.id
          ? {
              ...r,
              name: normalizedName.trim(),
              suggestedCanonicalCategory: normalizedCategory,
              status: "Approved",
            }
          : r
      )
    );
    showToast(`Normalized as "${normalizedName.trim()}" and synced to profile`);
    setIsNormalizeModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Bar Header */}
      <div className="flex flex-col gap-4 border-b border-[#EFEEEB] pb-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Breadcrumb: VeggieMate / Admin Area */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="relative h-6 w-6 overflow-hidden rounded-md bg-[#1E3A2F]/10 flex items-center justify-center text-[10px] font-bold text-[#1E3A2F]">
              VM
            </div>
            <Link href="/" className="font-serif text-xl font-bold tracking-tight text-[#07241A] hover:opacity-80">
              VeggieMate
            </Link>
          </div>
          <span className="text-[#A0A5A1]">/</span>
          <div className="flex items-center gap-1.5 rounded-full border border-[#EFEEEB] bg-white px-2.5 py-1 text-xs font-medium text-[#424844] shadow-xs">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#1E3A2F]">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            </svg>
            <span><UiText text="Admin Area" /></span>
          </div>
        </div>

        {/* Right Search, Lang & Admin Info */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder={ui("Search admin...")}
              value={searchAdmin}
              onChange={(e) => setSearchAdmin(e.target.value)}
              className="w-56 rounded-full border border-[#EFEEEB] bg-white py-1.5 pl-8 pr-4 text-xs text-[#07241A] placeholder-[#A0A5A1] shadow-xs focus:border-[#1E3A2F] focus:outline-none"
            />
            <svg className="absolute left-2.5 top-2 text-[#727974]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>

          <LanguageSwitch />

          <div className="flex items-center gap-2 pl-2">
            <div className="relative h-8 w-8 overflow-hidden rounded-lg bg-[#EAE8E3]">
              <Image
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                alt="Admin"
                fill
                className="object-cover"
              />
            </div>
            <div className="text-left leading-tight">
              <p className="text-xs font-bold text-[#07241A]">{user?.fullName || "Admin"}</p>
              <p className="text-[10px] text-[#727974]"><UiText text="Supervisor" /></p>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {feedback && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800 shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-600">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            <span>{feedback}</span>
          </div>
          <button type="button" onClick={() => setFeedback(null)} className="text-emerald-700 hover:text-emerald-900">✕</button>
        </div>
      )}

      {/* Header with Allergen Verification Pill & Batch Approve Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between pt-1">
        <div>
          {/* Top Pill: Allergen Verification */}
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#D5EBDC] bg-[#EAF5EE] px-2.5 py-1 text-xs font-semibold text-[#1E7E51] shadow-xs">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            <span>Allergen Verification</span>
          </div>

          <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight text-[#07241A] lg:text-4xl">
            Allergens & Health Management
          </h1>
        </div>

        {/* Batch Approve Clean Items Button */}
        <button
          type="button"
          onClick={handleBatchApproveClean}
          className="flex items-center gap-2 rounded-xl bg-[#0F2F24] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#1E3A2F] self-start"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>Batch Approve Clean Items</span>
        </button>
      </div>

      {/* 3 Metric Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Card 1: PENDING APPROVAL */}
        <div className="flex flex-col justify-between rounded-2xl border border-[#EFEEEB] bg-white p-5 shadow-xs">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#727974]">
              PENDING APPROVAL
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FEF1E8] text-[#C25E28]">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-bold tracking-tight text-[#07241A]">{pendingCount}</span>
            <span className="text-xs font-medium text-[#727974]">new requests</span>
          </div>
        </div>

        {/* Card 2: APPROVED TODAY */}
        <div className="flex flex-col justify-between rounded-2xl border border-[#EFEEEB] bg-white p-5 shadow-xs">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#727974]">
              APPROVED TODAY
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF5EE] text-[#1E7E51]">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
          </div>
          <div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-bold tracking-tight text-[#07241A]">{approvedTodayCount}</span>
              <span className="text-xs font-medium text-[#727974]">synced items</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-[#1E7E51] font-medium">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Successfully synced to user profiles</span>
            </div>
          </div>
        </div>

        {/* Card 3: REJECTED / INVALID */}
        <div className="flex flex-col justify-between rounded-2xl border border-[#EFEEEB] bg-white p-5 shadow-xs">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#727974]">
              REJECTED / INVALID
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FEE2E2] text-[#DC2626]">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
          </div>
          <div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-bold tracking-tight text-[#DC2626]">
                {rejectedCount < 10 ? `0${rejectedCount}` : rejectedCount}
              </span>
              <span className="text-xs font-medium text-[#727974]">spam & typos</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-[#727974]">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              <span>Notification sent to user</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs and Search / Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Left Tabs */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("pending")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === "pending"
                ? "bg-[#07241A] text-white shadow-xs"
                : "bg-white text-[#727974] border border-[#EFEEEB] hover:bg-[#F2EFE9] hover:text-[#07241A]"
            }`}
          >
            <span>All Pending</span>
            <span className="rounded-full bg-[#EA580C] px-2 py-0.5 text-[10px] font-bold text-white">
              {pendingCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("approved")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === "approved"
                ? "bg-[#07241A] text-white shadow-xs"
                : "bg-white text-[#727974] border border-[#EFEEEB] hover:bg-[#F2EFE9] hover:text-[#07241A]"
            }`}
          >
            <span>Approved</span>
            <span className="text-xs font-medium opacity-80">{approvedTodayCount}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("rejected")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === "rejected"
                ? "bg-[#07241A] text-white shadow-xs"
                : "bg-white text-[#727974] border border-[#EFEEEB] hover:bg-[#F2EFE9] hover:text-[#07241A]"
            }`}
          >
            <span>Rejected</span>
            <span className="text-xs font-medium opacity-80">{rejectedCount}</span>
          </button>
        </div>

        {/* Right Search Input & Reset Button */}
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-72">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A0A5A1]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search by username, allergen item"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-[#EFEEEB] bg-white py-2 pl-9 pr-4 text-xs font-normal text-[#07241A] placeholder-[#A0A5A1] shadow-xs outline-none focus:border-[#1E3A2F]"
            />
          </div>

          <button
            type="button"
            title="Refresh List"
            onClick={() => {
              setSearchQuery("");
              showToast("Queue refreshed");
            }}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#EFEEEB] bg-white text-[#727974] shadow-xs transition hover:bg-[#F2EFE9] hover:text-[#07241A]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
              <path d="M3 21v-5h5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Verification Items Queue Cards */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="rounded-2xl border border-[#EFEEEB] bg-white py-16 text-center shadow-xs">
            <span className="text-4xl">🛡️</span>
            <p className="mt-3 text-sm font-semibold text-[#07241A]">No allergen verification requests found.</p>
            <p className="mt-1 text-xs text-[#727974]">All user submissions in this tab have been processed.</p>
          </div>
        ) : (
          filteredRequests.map((r) => {
            // Icon styling for the left badge
            const isAlert = r.tagType === "alert";
            const isDuplicate = r.tagType === "duplicate";

            return (
              <div
                key={r.id}
                className="overflow-hidden rounded-2xl border border-[#EFEEEB] bg-white p-5 shadow-xs transition duration-150 hover:border-[#1E3A2F]/20"
              >
                {/* Top Row: Icon, Item Name in quotes, Pill Tag, User Profile */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#F4F2EE] pb-4">
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Status Icon Indicator */}
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        isAlert
                          ? "bg-[#FEE2E2] text-[#DC2626]"
                          : isDuplicate
                          ? "bg-[#FEF1E8] text-[#C25E28]"
                          : "bg-[#EAF5EE] text-[#1E7E51]"
                      }`}
                    >
                      {isAlert ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="15" y1="9" x2="9" y2="15" />
                          <line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                      ) : isDuplicate ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>

                    {/* Title in quotes */}
                    <h2
                      className={`font-serif text-lg font-bold ${
                        isAlert ? "text-[#991B1B]" : "text-[#07241A]"
                      }`}
                    >
                      &ldquo;{r.name}&rdquo;
                    </h2>

                    {/* Tag Badge */}
                    <div
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                        isAlert
                          ? "border border-[#FECACA] bg-[#FEE2E2] text-[#B91C1C]"
                          : isDuplicate
                          ? "border border-[#FCDDC8] bg-[#FEF1E8] text-[#C25E28]"
                          : "border border-[#D5EBDC] bg-[#EAF5EE] text-[#1E7E51]"
                      }`}
                    >
                      {isAlert ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                          <line x1="4" y1="22" x2="4" y2="15" />
                        </svg>
                      ) : isDuplicate ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                          <line x1="12" y1="9" x2="12" y2="13" />
                          <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                      ) : (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                          <polyline points="9 12 11 14 15 10" />
                        </svg>
                      )}
                      <span>{r.tagText}</span>
                    </div>
                  </div>

                  {/* Right User Info */}
                  <div className="flex items-center gap-2.5">
                    {r.userAvatar ? (
                      <div className="relative h-8 w-8 overflow-hidden rounded-full border border-[#EFEEEB] bg-[#EAE8E3]">
                        <Image src={r.userAvatar} alt={r.userName} fill sizes="32px" className="object-cover" />
                      </div>
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E5E7EB] text-xs font-bold text-[#4B5563]">
                        {r.userInitials || "U"}
                      </div>
                    )}
                    <div className="leading-tight text-right sm:text-left">
                      <p className="text-xs font-bold text-[#07241A]">
                        {r.userName} <span className="text-[#8E9590] font-normal">{r.userId}</span>
                      </p>
                      <p className="text-[11px] text-[#8E9590]">{r.timeAgo}</p>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: AI / System Explanation & Action Buttons */}
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  {/* Left AI / System Note */}
                  <div className="flex items-start gap-2 text-xs text-[#5A625D]">
                    <span className="mt-0.5 text-[#727974] shrink-0">
                      {r.descriptionIcon === "sparkle" && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
                        </svg>
                      )}
                      {r.descriptionIcon === "link" && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                        </svg>
                      )}
                      {r.descriptionIcon === "shield" && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                          <circle cx="12" cy="11" r="3" />
                        </svg>
                      )}
                      {r.descriptionIcon === "warning" && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="16" x2="12" y2="12" />
                          <line x1="12" y1="8" x2="12.01" y2="8" />
                        </svg>
                      )}
                    </span>
                    <p className="leading-relaxed">{r.descriptionText}</p>
                  </div>

                  {/* Right Action Buttons */}
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    {isAlert ? (
                      // Invalid item actions: Reject & Notify User + More options
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenRejectModal(r)}
                          className="flex items-center gap-1.5 rounded-xl bg-[#DC2626] px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-red-700"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <rect x="2" y="4" width="20" height="16" rx="2" />
                            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                          </svg>
                          <span>Reject & Notify User</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenNormalize(r)}
                          className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#EFEEEB] bg-white text-[#727974] transition hover:bg-[#F2EFE9] hover:text-[#07241A]"
                          title="More options / Manual correction"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="1" />
                            <circle cx="19" cy="12" r="1" />
                            <circle cx="5" cy="12" r="1" />
                          </svg>
                        </button>
                      </>
                    ) : (
                      // Valid or duplicate items: Normalize Name, Reject, Approve & Sync to Profile
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenNormalize(r)}
                          className="flex items-center gap-1.5 rounded-xl border border-[#EFEEEB] bg-white px-3.5 py-2 text-xs font-semibold text-[#07241A] shadow-xs transition hover:bg-[#F2EFE9]"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                          </svg>
                          <span>Normalize Name</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenRejectModal(r)}
                          className="flex items-center gap-1 rounded-xl bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                        >
                          <span>✕</span>
                          <span>Reject</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleApprove(r.id, r.name)}
                          className="flex items-center gap-1.5 rounded-xl bg-[#0F2F24] px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#1E3A2F]"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span>Approve & Sync to Profile</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Normalize Name Modal */}
      {isNormalizeModalOpen && selectedRequest && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsNormalizeModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-xs animate-fade-in"
        >
          <div className="w-full max-w-lg rounded-2xl border border-[#EFEEEB] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#EFEEEB] pb-4">
              <div>
                <h2 className="font-serif text-lg font-bold text-[#07241A]">Normalize Allergen Name</h2>
                <p className="text-xs text-[#727974] mt-0.5">
                  Submission from <span className="font-semibold text-[#07241A]">{selectedRequest.userName}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNormalizeModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#727974] hover:bg-[#F2EFE9] hover:text-[#07241A]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNormalize} className="mt-4 space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#727974]">
                  Original User Input
                </label>
                <div className="mt-1.5 rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] px-3.5 py-2 font-mono text-xs text-[#727974]">
                  &ldquo;{selectedRequest.name}&rdquo;
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#727974]">
                  Canonical Normalized Name *
                </label>
                <input
                  type="text"
                  required
                  value={normalizedName}
                  onChange={(e) => setNormalizedName(e.target.value)}
                  placeholder="e.g. Cashews / Roasted Cashews"
                  className="mt-1.5 w-full rounded-xl border border-[#EFEEEB] bg-white px-3.5 py-2 text-xs font-semibold text-[#07241A] outline-none focus:border-[#1E3A2F]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#727974]">
                  Target Allergen Category *
                </label>
                <select
                  value={normalizedCategory}
                  onChange={(e) => setNormalizedCategory(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#EFEEEB] bg-white px-3.5 py-2 text-xs font-semibold text-[#07241A] outline-none focus:border-[#1E3A2F] cursor-pointer"
                >
                  <option value="Tree Nuts (Hạt cây)">Tree Nuts (Hạt cây)</option>
                  <option value="Gluten & Wheat">Gluten & Wheat (Gluten & Lúa mì)</option>
                  <option value="Edible Mushrooms & Fungi">Edible Mushrooms & Fungi (Nấm ăn)</option>
                  <option value="Peanuts & Groundnuts">Peanuts & Groundnuts (Đậu phộng)</option>
                  <option value="Soy & Soybeans">Soy & Soybeans (Đậu nành & Chế phẩm)</option>
                  <option value="Dairy & Lactose">Dairy & Lactose (Sữa bò & Lactose)</option>
                  <option value="Sesame & Tahini">Sesame & Tahini (Mè & Dầu mè)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#727974]">
                  Admin Mapping Reason / Notes
                </label>
                <input
                  type="text"
                  value={normalizationNotes}
                  onChange={(e) => setNormalizationNotes(e.target.value)}
                  placeholder="e.g. Standardized canonical name mapping"
                  className="mt-1.5 w-full rounded-xl border border-[#EFEEEB] bg-white px-3.5 py-2 text-xs text-[#07241A] outline-none focus:border-[#1E3A2F]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-[#EFEEEB] pt-4">
                <button
                  type="button"
                  onClick={() => setIsNormalizeModalOpen(false)}
                  className="rounded-xl border border-[#EFEEEB] px-4 py-2 text-xs font-semibold text-[#424844] hover:bg-[#F2EFE9]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#0F2F24] px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#1E3A2F]"
                >
                  Save & Approve
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {isRejectModalOpen && rejectingRequest && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsRejectModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-xs animate-fade-in"
        >
          <div className="w-full max-w-md rounded-2xl border border-[#EFEEEB] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#EFEEEB] pb-4">
              <div>
                <h2 className="font-serif text-lg font-bold text-red-700">Reject Allergen Submission</h2>
                <p className="text-xs text-[#727974] mt-0.5">
                  For: <span className="font-semibold text-[#07241A]">&ldquo;{rejectingRequest.name}&rdquo;</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#727974] hover:bg-[#F2EFE9] hover:text-[#07241A]"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#727974]">
                Notification Reason to User ({rejectingRequest.userName})
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] p-3 text-xs text-[#07241A] outline-none focus:border-red-500 focus:bg-white"
              />
              <p className="text-[11px] text-[#8E9590]">
                An automated email and in-app notice will be delivered explaining why this custom entry was rejected.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-[#EFEEEB] pt-4">
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="rounded-xl border border-[#EFEEEB] px-4 py-2 text-xs font-semibold text-[#424844] hover:bg-[#F2EFE9]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="rounded-xl bg-[#DC2626] px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-700"
              >
                Confirm Reject & Notify
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
