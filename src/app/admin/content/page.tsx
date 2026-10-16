"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useAdminModeration } from "@/context/AdminModerationContext";

// Content Entry type definition
interface ContentItem {
  id: string;
  title: string;
  fullTitle: string;
  subtitle: string;
  category: string;
  type: "Video & Recipe" | "Post";
  author: string;
  authorInitials: string;
  authorBg?: string;
  status: "Published" | "Draft" | "Pending";
  image: string;
  commentsCount: number;
  comments: CommentItem[];
}

interface CommentItem {
  id: string;
  author: string;
  authorInitials: string;
  date: string;
  badge?: string;
  dotColor: "green" | "orange";
  text: string;
  status: "active" | "flagged" | "hidden";
  isHidden?: boolean;
}

// Predefined culinary categories for tagging content entries
const PREDEFINED_CATEGORIES = [
  "Tofu & Soy",
  "Vegetables",
  "Legumes",
  "Grains",
  "Mushroom",
  "Vegan Desserts",
  "Other",
];

export default function AdminContentPage() {
  const { user } = useAuth();
  const { flaggedCount } = useAdminModeration();

  // Toast feedback
  const [feedback, setFeedback] = useState<string | null>(null);

  const showToast = (message: string) => {
    setFeedback(message);
    setTimeout(() => setFeedback(null), 3500);
  };

  // Filters
  const [typeFilter, setTypeFilter] = useState<"All" | "Video & Recipe" | "Post">("All");
  const [searchContentQuery, setSearchContentQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Moderation panel state
  const [showModerationStream, setShowModerationStream] = useState(true);
  const [commentFilter, setCommentFilter] = useState<"All" | "Flagged" | "Hidden">("All");
  const [isThreadMuted, setIsThreadMuted] = useState(false);

  // Modal Create Entry
  const [showCreateEntryModal, setShowCreateEntryModal] = useState(false);

  // Form states for Create Entry
  const [newEntryTitle, setNewEntryTitle] = useState("");
  const [newEntrySubtitle, setNewEntrySubtitle] = useState("");
  const [newEntryType, setNewEntryType] = useState<"Video & Recipe" | "Post">("Video & Recipe");
  const [newEntryCategory, setNewEntryCategory] = useState("Tofu & Soy");
  const [newEntryAuthor, setNewEntryAuthor] = useState("Admin Supervisor");
  const [newEntryStatus, setNewEntryStatus] = useState<"Published" | "Draft">("Published");
  const [newEntryImage, setNewEntryImage] = useState("https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80");

  // Stories & Guides Data
  const [contents, setContents] = useState<ContentItem[]>([
    {
      id: "cnt-1",
      title: "Easy Tofu",
      fullTitle: "Easy Tofu in Tomato Sauce",
      subtitle: "Plant-based staple • 25 mins",
      category: "Tofu & Soy",
      type: "Video & Recipe",
      author: "Linh Nguyen",
      authorInitials: "LN",
      status: "Published",
      image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80",
      commentsCount: 38,
      comments: [
        {
          id: "comm-1",
          author: "Linh Nguyen",
          authorInitials: "LN",
          date: "12 Mar 2026",
          badge: "Verified Reader",
          dotColor: "green",
          text: "Love the texture of this tofu! Best family dinner recipe this week. Swapped in shallot oil for an extra layer of aroma.",
          status: "active",
          isHidden: false,
        },
        {
          id: "comm-2",
          author: "Duc Hoang",
          authorInitials: "DH",
          date: "11 Mar 2026",
          dotColor: "orange",
          text: "Can I replace the fresh tomatoes with canned plum tomatoes? Tomatoes are currently out of season where I live.",
          status: "flagged",
          isHidden: false,
        },
        {
          id: "comm-3",
          author: "Mai Huynh",
          authorInitials: "MH",
          date: "10 Mar 2026",
          badge: "Top Contributor",
          dotColor: "green",
          text: "A tranquil dining memory and great preparation tips. Reminded me of childhood summer lunches with grandma.",
          status: "active",
          isHidden: false,
        },
      ],
    },
    {
      id: "cnt-2",
      title: "A Calm...",
      fullTitle: "A Calm Vegetarian Dinner in District 9",
      subtitle: "District 9 review • Ambient dining",
      category: "Vegetables",
      type: "Post",
      author: "Minh Tran",
      authorInitials: "MT",
      status: "Published",
      image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80",
      commentsCount: 16,
      comments: [
        {
          id: "comm-21",
          author: "An Pham",
          authorInitials: "AP",
          date: "10 Mar 2026",
          badge: "Food Critic",
          dotColor: "green",
          text: "The garden space is so peaceful. Definitely recommend booking outdoor seating on weekends.",
          status: "active",
          isHidden: false,
        },
        {
          id: "comm-22",
          author: "Thu Le",
          authorInitials: "TL",
          date: "09 Mar 2026",
          dotColor: "green",
          text: "Does the restaurant offer full vegan set menus without fish sauce or honey?",
          status: "active",
          isHidden: false,
        },
      ],
    },
    {
      id: "cnt-3",
      title: "Green...",
      fullTitle: "Green Gathering Spotlight Feast",
      subtitle: "Gathering spotlight • Communal feast",
      category: "Legumes",
      type: "Post",
      author: "An Pham",
      authorInitials: "AP",
      status: "Published",
      image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80",
      commentsCount: 22,
      comments: [
        {
          id: "comm-31",
          author: "Linh Nguyen",
          authorInitials: "LN",
          date: "08 Mar 2026",
          dotColor: "green",
          text: "Such vibrant colors and wholesome vegan options. Ideal for large family gatherings.",
          status: "active",
          isHidden: false,
        },
      ],
    },
    {
      id: "cnt-4",
      title: "Mushroom",
      fullTitle: "Mushroom Culinary Lab Innovations",
      subtitle: "Culinary lab • In development",
      category: "Mushroom",
      type: "Video & Recipe",
      author: "Minh Tran",
      authorInitials: "MT",
      status: "Draft",
      image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80",
      commentsCount: 5,
      comments: [
        {
          id: "comm-41",
          author: "Hoa Dang",
          authorInitials: "HD",
          date: "07 Mar 2026",
          dotColor: "green",
          text: "Draft testing went well! Can't wait for the official video release.",
          status: "active",
          isHidden: false,
        },
      ],
    },
    {
      id: "cnt-5",
      title: "Crispy Spring Rolls",
      fullTitle: "Crispy Mushroom & Taro Spring Rolls",
      subtitle: "Appetizer perfection • 30 mins",
      category: "Mushroom",
      type: "Video & Recipe",
      author: "Anna Le",
      authorInitials: "AL",
      status: "Published",
      image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=80",
      commentsCount: 29,
      comments: [
        {
          id: "comm-51",
          author: "Duc Hoang",
          authorInitials: "DH",
          date: "06 Mar 2026",
          dotColor: "green",
          text: "The wood ear mushrooms give such a wonderful crunch. Followed step 3 and it didn't soak oil!",
          status: "active",
          isHidden: false,
        },
      ],
    },
  ]);

  // Selected Content for Comments stream (default: first item)
  const [selectedContentId, setSelectedContentId] = useState<string>("cnt-1");

  const selectedContent = useMemo(() => {
    return contents.find((c) => c.id === selectedContentId) || contents[0];
  }, [contents, selectedContentId]);

  // Filtered Content
  const filteredContents = useMemo(() => {
    return contents.filter((item) => {
      // Filter by type
      const matchType = typeFilter === "All" || item.type === typeFilter;
      // Filter by status
      const matchStatus = statusFilter === "All" || item.status === statusFilter;
      // Filter by search query
      const query = searchContentQuery.toLowerCase().trim();
      const matchSearch =
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.fullTitle.toLowerCase().includes(query) ||
        item.subtitle.toLowerCase().includes(query) ||
        item.author.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query);

      return matchType && matchStatus && matchSearch;
    });
  }, [contents, typeFilter, statusFilter, searchContentQuery]);

  // Filtered Comments in Moderation Stream
  const filteredComments = useMemo(() => {
    if (!selectedContent?.comments) return [];
    return selectedContent.comments.filter((c) => {
      if (commentFilter === "Flagged") return c.status === "flagged";
      if (commentFilter === "Hidden") return c.isHidden === true;
      return true;
    });
  }, [selectedContent, commentFilter]);

  // Refresh handler
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setSearchContentQuery("");
      setStatusFilter("All");
      setTypeFilter("All");
      showToast("Đã đồng bộ và làm mới danh sách bài viết!");
    }, 450);
  };

  // Hide/Unhide comment
  const handleToggleHideComment = (commentId: string) => {
    setContents((prev) =>
      prev.map((c) => {
        if (c.id !== selectedContentId) return c;
        return {
          ...c,
          comments: c.comments.map((cm) => {
            if (cm.id !== commentId) return cm;
            const newHidden = !cm.isHidden;
            showToast(newHidden ? "Đã ẩn bình luận khỏi bài viết." : "Đã bỏ ẩn bình luận.");
            return { ...cm, isHidden: newHidden };
          }),
        };
      })
    );
  };

  // Remove comment
  const handleRemoveComment = (commentId: string) => {
    setContents((prev) =>
      prev.map((c) => {
        if (c.id !== selectedContentId) return c;
        const updated = c.comments.filter((cm) => cm.id !== commentId);
        return {
          ...c,
          commentsCount: Math.max(0, c.commentsCount - 1),
          comments: updated,
        };
      })
    );
    showToast("Đã xóa bình luận thành công.");
  };

  // Approve all comments
  const handleApproveAllComments = () => {
    setContents((prev) =>
      prev.map((c) => {
        if (c.id !== selectedContentId) return c;
        return {
          ...c,
          comments: c.comments.map((cm) => ({
            ...cm,
            status: "active" as const,
            dotColor: "green" as const,
          })),
        };
      })
    );
    showToast(`Đã duyệt tất cả bình luận cho "${selectedContent.fullTitle}"!`);
  };

  // Mute thread
  const handleMuteThread = () => {
    setIsThreadMuted((prev) => {
      const next = !prev;
      showToast(next ? "Đã tắt thông báo & tạm khóa thread này." : "Đã mở lại thông báo cho thread này.");
      return next;
    });
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ["ID", "Title", "Type", "Category", "Author", "Status", "Comments Count"];
    const rows = filteredContents.map((c) => [
      c.id,
      `"${c.fullTitle.replace(/"/g, '""')}"`,
      `"${c.type}"`,
      `"${c.category}"`,
      `"${c.author}"`,
      c.status,
      c.commentsCount,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `veggiemate_content_catalog_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("Đã trích xuất và tải về tập tin CSV thành công!");
  };

  // Create new content entry
  const handleCreateEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntryTitle.trim()) {
      showToast("Vui lòng nhập tiêu đề bài viết!");
      return;
    }

    const newItem: ContentItem = {
      id: `cnt-${Date.now()}`,
      title: newEntryTitle.length > 15 ? newEntryTitle.slice(0, 15) + "..." : newEntryTitle,
      fullTitle: newEntryTitle,
      subtitle: newEntrySubtitle || `${newEntryCategory} • Just added`,
      category: newEntryCategory,
      type: newEntryType,
      author: newEntryAuthor || "Admin Supervisor",
      authorInitials: (newEntryAuthor || "AD").slice(0, 2).toUpperCase(),
      status: newEntryStatus,
      image: newEntryImage || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80",
      commentsCount: 0,
      comments: [],
    };

    setContents((prev) => [newItem, ...prev]);
    setSelectedContentId(newItem.id);
    setShowCreateEntryModal(false);
    setNewEntryTitle("");
    setNewEntrySubtitle("");
    showToast(`Đã thêm thành công bài viết: "${newItem.fullTitle}"!`);
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-[#07241A] px-4 py-3 text-xs font-semibold text-white shadow-xl animate-fade-in">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{feedback}</span>
        </div>
      )}

      {/* Top Bar Header */}
      <div className="flex items-center justify-between border-b border-[#EFEEEB] pb-4">
        {/* Breadcrumb: VeggieMate / Admin Area */}
        <div className="flex items-center gap-2">
          <Link href="/" className="font-serif text-xl font-bold tracking-tight text-[#07241A] hover:opacity-80">
            VeggieMate
          </Link>
          <span className="text-[#A0A5A1]">/</span>
          <div className="flex items-center gap-1.5 rounded-full border border-[#EFEEEB] bg-white px-2.5 py-1 text-xs font-medium text-[#424844] shadow-sm">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#1E3A2F]">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            </svg>
            <span>Admin Area</span>
          </div>
        </div>

        {/* Right Search, Lang & Admin Info */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search admin..."
              className="w-60 rounded-full border border-[#EFEEEB] bg-white py-1.5 pl-8 pr-4 text-xs text-[#07241A] placeholder-[#A0A5A1] shadow-sm focus:border-[#1E3A2F] focus:outline-none"
            />
            <svg
              className="absolute left-2.5 top-2 text-[#727974]"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>

          <button
            type="button"
            className="flex items-center gap-1 rounded-xl border border-[#EFEEEB] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#07241A] shadow-sm hover:bg-gray-50"
          >
            <span>EN</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-[#1E3A2F] text-white flex items-center justify-center text-xs font-bold shadow-sm">
              AD
            </div>
            <div className="text-left leading-tight hidden sm:block">
              <p className="text-xs font-bold text-[#07241A]">{user?.displayName || user?.fullName || "Admin"}</p>
              <p className="text-[10px] text-[#727974]">Supervisor</p>
            </div>
          </div>
        </div>
      </div>

      {/* Page Title & Stats Badge Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          {/* Label / Section Tag */}
          <div className="flex items-center gap-1.5 text-[#C2410C] mb-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
              <path d="M6 6h10" />
              <path d="M6 10h10" />
            </svg>
            <span className="text-[11px] font-bold tracking-wider uppercase">Editorial Desk</span>
          </div>

          <h1 className="font-serif text-3xl lg:text-4xl font-bold tracking-tight text-[#07241A]">
            Content Management
          </h1>
          <p className="mt-1 text-xs text-[#727974]">
            Manage recipes, posts, and community discourse.
          </p>
        </div>

        {/* Stat Badges */}
        <div className="flex items-center gap-3">
          {/* Stat 1: Total Library */}
          <div className="flex items-center gap-3 rounded-2xl border border-[#EFEEEB] bg-white px-4 py-3 shadow-sm min-w-[130px]">
            <div className="flex flex-col">
              <span className="text-[11px] font-medium text-[#727974] flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#F97316]" />
                Total Library
              </span>
              <span className="font-serif text-2xl font-bold text-[#07241A]">486</span>
            </div>
          </div>

          {/* Stat 2: Pending Moderation */}
          <div className="flex items-center gap-3 rounded-2xl border border-[#EFEEEB] bg-white px-4 py-3 shadow-sm min-w-[130px]">
            <div className="flex flex-col">
              <span className="text-[11px] font-medium text-[#727974] flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#10B981]" />
                Pending Moderation
              </span>
              <span className="font-serif text-2xl font-bold text-[#07241A]">14</span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Header Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* Left Badge: Content items count */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl bg-[#1E3A2F] px-4 py-2 text-xs font-semibold text-white shadow-sm">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
              <path d="M6 6h10" />
              <path d="M6 10h10" />
            </svg>
            <span>All Published Content</span>
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white">
              486
            </span>
          </div>
        </div>

        {/* Right Actions: Export CSV & Create Entry */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 rounded-xl border border-[#EFEEEB] bg-white px-3.5 py-2 text-xs font-semibold text-[#07241A] shadow-sm hover:bg-gray-50 transition"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" y2="3" />
            </svg>
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setShowCreateEntryModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-[#1E3A2F] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#152A22] transition"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Create Entry</span>
          </button>
        </div>
      </div>

      {/* Secondary Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Quick Format Pills */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTypeFilter("All")}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              typeFilter === "All"
                ? "bg-[#07241A] text-white shadow-sm"
                : "bg-[#EFEEEB]/70 text-[#424844] hover:bg-[#EFEEEB]"
            }`}
          >
            All (486)
          </button>
          <button
            onClick={() => setTypeFilter("Video & Recipe")}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              typeFilter === "Video & Recipe"
                ? "bg-[#07241A] text-white shadow-sm"
                : "bg-[#EFEEEB]/70 text-[#424844] hover:bg-[#EFEEEB]"
            }`}
          >
            Video & Recipes (312)
          </button>
          <button
            onClick={() => setTypeFilter("Post")}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              typeFilter === "Post"
                ? "bg-[#07241A] text-white shadow-sm"
                : "bg-[#EFEEEB]/70 text-[#424844] hover:bg-[#EFEEEB]"
            }`}
          >
            Posts (174)
          </button>
        </div>

        {/* Search, Status & Refresh */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search content by title or author..."
              value={searchContentQuery}
              onChange={(e) => setSearchContentQuery(e.target.value)}
              className="w-64 rounded-full border border-[#EFEEEB] bg-white py-1.5 pl-8 pr-4 text-xs text-[#07241A] placeholder-[#A0A5A1] shadow-sm focus:border-[#1E3A2F] focus:outline-none"
            />
            <svg
              className="absolute left-2.5 top-2 text-[#727974]"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>

          {/* Status Dropdown */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none rounded-xl border border-[#EFEEEB] bg-white py-1.5 pl-3 pr-8 text-xs font-semibold text-[#07241A] shadow-sm focus:border-[#1E3A2F] focus:outline-none cursor-pointer"
            >
              <option value="All">Status: All</option>
              <option value="Published">Status: Published</option>
              <option value="Draft">Status: Draft</option>
            </select>
            <svg
              className="pointer-events-none absolute right-2.5 top-2.5 text-[#727974]"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            title="Refresh content list"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#EFEEEB] bg-white text-[#727974] shadow-sm hover:bg-gray-50 hover:text-[#07241A] transition"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={isRefreshing ? "animate-spin" : ""}
            >
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Split Layout: Content Table & Moderation Stream */}
      <div className={`grid grid-cols-1 gap-6 transition-all ${showModerationStream ? "lg:grid-cols-12" : "lg:grid-cols-1"}`}>
        {/* Left Column: Published Stories & Guides */}
        <div className={`space-y-4 ${showModerationStream ? "lg:col-span-7 xl:col-span-8" : "lg:col-span-12"}`}>
          <div className="rounded-2xl border border-[#EFEEEB] bg-white p-5 lg:p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-[#EFEEEB]">
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#1E3A2F]">
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
                <h2 className="font-serif text-base font-bold text-[#07241A]">Published Stories & Guides</h2>
              </div>
              <span className="text-xs text-[#727974]">
                Showing {filteredContents.length} of 486 entries
              </span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#EFEEEB] text-[10px] font-bold uppercase tracking-wider text-[#727974]">
                    <th className="py-3 font-bold">TITLE & THUMBNAIL</th>
                    <th className="py-3 font-bold">TYPE</th>
                    <th className="py-3 font-bold">AUTHOR</th>
                    <th className="py-3 font-bold">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFEEEB]/60 text-xs">
                  {filteredContents.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-[#727974]">
                        Không tìm thấy bài viết phù hợp.
                      </td>
                    </tr>
                  ) : (
                    filteredContents.map((item) => {
                      const isSelected = selectedContentId === item.id;
                      return (
                        <tr
                          key={item.id}
                          onClick={() => {
                            setSelectedContentId(item.id);
                            if (!showModerationStream) setShowModerationStream(true);
                          }}
                          className={`group cursor-pointer transition ${
                            isSelected
                              ? "bg-[#F3F6F4] font-medium"
                              : "hover:bg-[#FBF9F6]/80"
                          }`}
                        >
                          {/* Title & Thumbnail */}
                          <td className="py-3.5 pr-4">
                            <div className="flex items-center gap-3">
                              <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-[#EFEEEB]">
                                <Image
                                  src={item.image}
                                  alt={item.title}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              </div>
                              <div>
                                <p className="font-bold text-[#07241A] group-hover:text-[#1E3A2F] transition">
                                  {item.title}
                                </p>
                                <p className="text-[11px] italic text-[#727974]">
                                  {item.subtitle}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Type */}
                          <td className="py-3.5 pr-4">
                            {item.type === "Video & Recipe" ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F5E9] px-2.5 py-1 text-[11px] font-semibold text-[#2E7D32]">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <polygon points="5 3 19 12 5 21 5 3" />
                                </svg>
                                <span>Video & Recipe</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FDF2F0] px-2.5 py-1 text-[11px] font-semibold text-[#C2410C]">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                  <polyline points="9 22 9 12 15 12 15 22" />
                                </svg>
                                <span>Post</span>
                              </span>
                            )}
                          </td>

                          {/* Author */}
                          <td className="py-3.5 pr-4">
                            <div className="flex items-center gap-2">
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1E3A2F] text-[10px] font-bold text-white shadow-sm">
                                {item.authorInitials}
                              </div>
                              <span className="font-medium text-[#07241A]">{item.author}</span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3.5">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`h-2 w-2 rounded-full ${
                                  item.status === "Published"
                                    ? "bg-[#10B981]"
                                    : item.status === "Draft"
                                    ? "bg-gray-400"
                                    : "bg-[#F97316]"
                                }`}
                              />
                              <span
                                className={`font-medium ${
                                  item.status === "Published"
                                    ? "text-[#07241A]"
                                    : "text-[#727974]"
                                }`}
                              >
                                {item.status}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex items-center justify-between pt-4 border-t border-[#EFEEEB] text-xs text-[#727974]">
              <span>Page 1 of 123</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#EFEEEB] hover:bg-gray-50 transition"
                >
                  ‹
                </button>
                <button
                  type="button"
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#07241A] font-bold text-white shadow-sm"
                >
                  1
                </button>
                <button
                  type="button"
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#EFEEEB] hover:bg-gray-50 transition"
                >
                  2
                </button>
                <button
                  type="button"
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#EFEEEB] hover:bg-gray-50 transition"
                >
                  3
                </button>
                <span className="px-1 text-gray-400">...</span>
                <button
                  type="button"
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#EFEEEB] hover:bg-gray-50 transition"
                >
                  123
                </button>
                <button
                  type="button"
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#EFEEEB] hover:bg-gray-50 transition"
                >
                  ›
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Moderation Stream */}
        {showModerationStream && (
          <div className="space-y-4 lg:col-span-5 xl:col-span-4">
            <div className="rounded-2xl border border-[#EFEEEB] bg-white p-5 shadow-sm flex flex-col justify-between h-full">
              <div>
                {/* Header: Label + Close X */}
                <div className="flex items-center justify-between pb-2">
                  <div className="flex items-center gap-1.5 text-[#C2410C]">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                      <line x1="4" x2="4" y1="22" y2="15" />
                    </svg>
                    <span className="text-[11px] font-bold tracking-wider uppercase">Moderation Stream</span>
                  </div>

                  <button
                    onClick={() => setShowModerationStream(false)}
                    title="Hide moderation panel"
                    className="rounded-lg p-1 text-[#727974] hover:bg-gray-100 hover:text-[#07241A] transition"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                {/* Subject Heading */}
                <h3 className="font-serif text-lg font-bold text-[#07241A]">
                  Comments on: {selectedContent.fullTitle || selectedContent.title}
                </h3>

                {/* Sub-counter and live sync */}
                <div className="mt-1 flex items-center gap-3 text-xs">
                  <span className="rounded-md bg-[#FDF2F0] px-2 py-0.5 font-semibold text-[#C2410C]">
                    {selectedContent.commentsCount} Total Comments
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] text-[#727974]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#10B981] animate-pulse" />
                    Live sync {isThreadMuted && "• (Muted)"}
                  </span>
                </div>

                {/* Filter Pills */}
                <div className="mt-3.5 flex items-center gap-2 border-b border-[#EFEEEB] pb-3 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#727974]">FILTER</span>
                  <button
                    onClick={() => setCommentFilter("All")}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                      commentFilter === "All"
                        ? "bg-[#EFEEEB] text-[#07241A]"
                        : "text-[#727974] hover:text-[#07241A]"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setCommentFilter("Flagged")}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                      commentFilter === "Flagged"
                        ? "bg-[#FEE2E2] text-[#B91C1C]"
                        : "text-[#727974] hover:text-[#07241A]"
                    }`}
                  >
                    Flagged (1)
                  </button>
                  <button
                    onClick={() => setCommentFilter("Hidden")}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                      commentFilter === "Hidden"
                        ? "bg-[#EFEEEB] text-[#07241A]"
                        : "text-[#727974] hover:text-[#07241A]"
                    }`}
                  >
                    Hidden
                  </button>
                </div>

                {/* Comment Cards List */}
                <div className="mt-3.5 space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {filteredComments.length === 0 ? (
                    <div className="py-6 text-center text-xs text-[#727974]">
                      Không có bình luận nào theo bộ lọc này.
                    </div>
                  ) : (
                    filteredComments.map((c) => (
                      <div
                        key={c.id}
                        className={`rounded-xl border p-3 text-xs space-y-2 transition ${
                          c.isHidden
                            ? "border-dashed border-gray-300 bg-gray-50/70 opacity-60"
                            : c.status === "flagged"
                            ? "border-amber-200 bg-amber-50/40"
                            : "border-[#EFEEEB] bg-[#FBF9F6]/60"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1E3A2F] text-[10px] font-bold text-white shadow-sm">
                              {c.authorInitials}
                            </div>
                            <div>
                              <p className="text-[11px] font-bold text-[#07241A]">{c.author}</p>
                              <p className="text-[10px] text-[#727974]">
                                {c.date} {c.badge && `• ${c.badge}`}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`h-2 w-2 rounded-full ${
                              c.dotColor === "orange" ? "bg-[#F97316]" : "bg-[#10B981]"
                            }`}
                          />
                        </div>

                        <p className="text-[11px] leading-relaxed text-[#424844]">
                          "{c.text}"
                        </p>

                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#EFEEEB]/60">
                          <button
                            type="button"
                            onClick={() => handleToggleHideComment(c.id)}
                            className="flex items-center gap-1 text-[11px] font-medium text-[#727974] hover:text-[#07241A] transition"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                              <line x1="1" y1="1" x2="23" y2="23" />
                            </svg>
                            <span>{c.isHidden ? "Unhide" : "Hide"}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveComment(c.id)}
                            className="flex items-center gap-1 text-[11px] font-medium text-red-600 hover:text-red-700 transition"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Bulk Action Footer */}
              <div className="mt-4 pt-3.5 border-t border-[#EFEEEB] flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#727974]">Bulk Action:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleMuteThread}
                    className="rounded-xl border border-[#EFEEEB] bg-white px-3 py-1.5 text-xs font-semibold text-[#07241A] hover:bg-gray-50 transition"
                  >
                    {isThreadMuted ? "Unmute Thread" : "Mute Thread"}
                  </button>
                  <button
                    type="button"
                    onClick={handleApproveAllComments}
                    className="rounded-xl bg-[#1E3A2F] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#152A22] transition"
                  >
                    Approve All
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Create Entry */}
      {showCreateEntryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#EFEEEB] bg-white p-6 shadow-xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-[#EFEEEB] pb-3">
              <h3 className="font-serif text-lg font-bold text-[#07241A]">Create Content Entry</h3>
              <button
                onClick={() => setShowCreateEntryModal(false)}
                className="text-[#727974] hover:text-[#07241A]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEntry} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#07241A] mb-1">Tiêu đề bài viết / Review</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Canh Rong Biển Hạt Sen"
                  value={newEntryTitle}
                  onChange={(e) => setNewEntryTitle(e.target.value)}
                  className="w-full rounded-xl border border-[#EFEEEB] px-3 py-2 text-xs text-[#07241A] focus:border-[#1E3A2F] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#07241A] mb-1">Mô tả phụ / Thông tin tóm tắt</label>
                <input
                  type="text"
                  placeholder="e.g. Món canh dưỡng sinh • 20 phút"
                  value={newEntrySubtitle}
                  onChange={(e) => setNewEntrySubtitle(e.target.value)}
                  className="w-full rounded-xl border border-[#EFEEEB] px-3 py-2 text-xs text-[#07241A] focus:border-[#1E3A2F] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#07241A] mb-1">Loại định dạng</label>
                  <select
                    value={newEntryType}
                    onChange={(e) => setNewEntryType(e.target.value as any)}
                    className="w-full rounded-xl border border-[#EFEEEB] px-3 py-2 text-xs text-[#07241A] focus:border-[#1E3A2F] focus:outline-none"
                  >
                    <option value="Video & Recipe">Video & Recipe</option>
                    <option value="Post">Post</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#07241A] mb-1">Phân loại ẩm thực</label>
                  <select
                    value={newEntryCategory}
                    onChange={(e) => setNewEntryCategory(e.target.value)}
                    className="w-full rounded-xl border border-[#EFEEEB] px-3 py-2 text-xs text-[#07241A] focus:border-[#1E3A2F] focus:outline-none"
                  >
                    {PREDEFINED_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#07241A] mb-1">Tác giả</label>
                  <input
                    type="text"
                    value={newEntryAuthor}
                    onChange={(e) => setNewEntryAuthor(e.target.value)}
                    className="w-full rounded-xl border border-[#EFEEEB] px-3 py-2 text-xs text-[#07241A] focus:border-[#1E3A2F] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#07241A] mb-1">Trạng thái xuất bản</label>
                  <select
                    value={newEntryStatus}
                    onChange={(e) => setNewEntryStatus(e.target.value as any)}
                    className="w-full rounded-xl border border-[#EFEEEB] px-3 py-2 text-xs text-[#07241A] focus:border-[#1E3A2F] focus:outline-none"
                  >
                    <option value="Published">Published (Công khai)</option>
                    <option value="Draft">Draft (Bản nháp)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#07241A] mb-1">URL Ảnh minh họa</label>
                <input
                  type="url"
                  value={newEntryImage}
                  onChange={(e) => setNewEntryImage(e.target.value)}
                  className="w-full rounded-xl border border-[#EFEEEB] px-3 py-2 text-xs text-[#07241A] focus:border-[#1E3A2F] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EFEEEB]">
                <button
                  type="button"
                  onClick={() => setShowCreateEntryModal(false)}
                  className="rounded-xl border border-[#EFEEEB] bg-white px-4 py-2 text-xs font-semibold text-[#727974] hover:bg-gray-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#1E3A2F] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#152A22]"
                >
                  Lưu bài viết
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
