"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import UiText, { useUiText, LanguageSwitch } from "@/components/UiText";
import { useAuth } from "@/context/AuthContext";

export interface AdminRestaurant {
  id: string; // e.g. "VMR-1042"
  name: string; // e.g. "Green Garden Bistro"
  vietnameseName?: string; // Optional legacy alias
  addressStreet: string; // Combined full street & ward address
  addressWard?: string;
  addressDistrictCity: string; // e.g. "District 3, HCMC"
  locality: string; // e.g. "District 3"
  dietType: "100% Vegan" | "Lacto-Ovo" | "Flexitarian" | "Vegetarian Buffet";
  dietSubtype: string; // e.g. "(Thuần chay)", "(Chay trường)"
  rating: number; // User ratings (read-only for admin)
  reviewCount: number; // User review count (read-only for admin)
  status: "Public" | "Private";
  imageUrl: string;
  phone?: string;
  priceRange?: string;
  openingHours?: string;
  parkingNote?: string;
}

// Initial 4 items matching reference UI mockup
const INITIAL_FEATURED_RESTAURANTS: AdminRestaurant[] = [
  {
    id: "VMR-1042",
    name: "Green Garden Bistro",
    vietnameseName: "Quán chay Vườn Xanh",
    addressStreet: "124/8 Nguyen Dinh Chieu, Ward Vo Thi Sau,",
    addressDistrictCity: "District 3, HCMC",
    locality: "District 3",
    dietType: "100% Vegan",
    dietSubtype: "(Thuần chay)",
    rating: 4.8,
    reviewCount: 142,
    status: "Public",
    imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80",
    phone: "028 3822 9188",
    priceRange: "60.000đ - 180.000đ",
    openingHours: "08:00 - 22:00",
    parkingNote: "Free motorbike parking in front. Car parking available across the street (50m).",
  },
  {
    id: "VMR-1089",
    name: "Loving Leaf Vegan",
    vietnameseName: "Lá Xanh Thuần Chay",
    addressStreet: "38 Nguyen Hue Boulevard, Ben Nghe,",
    addressDistrictCity: "District 1, HCMC",
    locality: "District 1",
    dietType: "100% Vegan",
    dietSubtype: "(Thuần chay)",
    rating: 4.9,
    reviewCount: 265,
    status: "Public",
    imageUrl: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80",
    phone: "090 382 7192",
    priceRange: "50.000đ - 150.000đ",
    openingHours: "07:30 - 21:30",
    parkingNote: "Motorbike parking with security staff. Cars can park at public underground garage nearby.",
  },
  {
    id: "VMR-1120",
    name: "An Nhien Vegetarian House",
    vietnameseName: "Cơm chay An Nhiên",
    addressStreet: "81 Pham Ngoc Thach, Ward 6,",
    addressDistrictCity: "District 3, HCMC",
    locality: "District 3",
    dietType: "Lacto-Ovo",
    dietSubtype: "(Chay trường)",
    rating: 4.6,
    reviewCount: 98,
    status: "Public",
    imageUrl: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=600&q=80",
    phone: "028 3997 1221",
    priceRange: "45.000đ - 120.000đ",
    openingHours: "09:00 - 21:00",
    parkingNote: "Có bãi giữ xe máy và ô tô thuận tiện ngay trong khuôn viên nhà hàng.",
  },
  {
    id: "VMR-1145",
    name: "Roots Plant-based Cafe",
    vietnameseName: "Roots Saigon Café",
    addressStreet: "215 Xuan Thuy, Thao Dien,",
    addressDistrictCity: "Thu Duc City, HCMC",
    locality: "Thu Duc City",
    dietType: "100% Vegan",
    dietSubtype: "(Thuần chay)",
    rating: 4.7,
    reviewCount: 52,
    status: "Private",
    imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80",
    phone: "090 568 2311",
    priceRange: "70.000đ - 160.000đ",
    openingHours: "08:00 - 21:00",
    parkingNote: "Có chỗ đậu xe máy rộng rãi, ô tô có thể đỗ dọc đường Xuân Thủy.",
  },
];

// Generate 84 realistic venues with consistent English on top & Vietnamese in parentheses
function generateFullRestaurantsList(): AdminRestaurant[] {
  const venuesData = [
    { name: "Om Mani Vegetarian Bistro", vi: "Bistro Chay Om Mani", address: "28 Truong Quyen, Vo Thi Sau,", city: "District 3, HCMC", loc: "District 3", diet: "100% Vegan" as const, sub: "(Thuần chay)", img: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80", r: 4.8, rev: 142 },
    { name: "Sen Vegan Thu Duc", vi: "Sen Vegan Thủ Đức", address: "12 Vo Van Ngan, Linh Chieu,", city: "Thu Duc City, HCMC", loc: "Thu Duc City", diet: "100% Vegan" as const, sub: "(Thuần chay)", img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80", r: 4.8, rev: 76 },
    { name: "Uu Dam Chay Ha Noi", vi: "Ưu Đàm Chay Hà Nội", address: "34 Hang Bai, Cua Nam,", city: "Hoan Kiem, Hanoi", loc: "Hanoi", diet: "Lacto-Ovo" as const, sub: "(Chay trường)", img: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80", r: 4.9, rev: 331 },
    { name: "Chay Garden Bistro", vi: "Nhà hàng Chay Garden", address: "52 Vo Van Tan, Vo Thi Sau,", city: "District 3, HCMC", loc: "District 3", diet: "Lacto-Ovo" as const, sub: "(Chay trường)", img: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80", r: 4.6, rev: 164 },
    { name: "Bong Sung Vegetarian Lounge", vi: "Bông Súng Lounge", address: "86 Nguyen Du, Ben Nghe,", city: "District 1, HCMC", loc: "District 1", diet: "Vegetarian Buffet" as const, sub: "(Buffet chay)", img: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80", r: 4.5, rev: 112 },
    { name: "Hum Vegetarian Cafe & Restaurant", vi: "Ẩm thực Chay Hum", address: "32 Thi Sach, Ben Nghe,", city: "District 1, HCMC", loc: "District 1", diet: "100% Vegan" as const, sub: "(Thuần chay)", img: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80", r: 4.9, rev: 418 },
    { name: "Pi Vegetarian Bistro", vi: "Pi Vegetarian Bistro", address: "19 Vo Van Tan, Vo Thi Sau,", city: "District 3, HCMC", loc: "District 3", diet: "100% Vegan" as const, sub: "(Thuần chay)", img: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80", r: 4.7, rev: 185 },
    { name: "Mandala Vegetarian Food", vi: "Quán Chay Mandala", address: "110 Suong Nguyet Anh, Ben Thanh,", city: "District 1, HCMC", loc: "District 1", diet: "Lacto-Ovo" as const, sub: "(Chay trường)", img: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=600&q=80", r: 4.6, rev: 93 },
    { name: "Tib Chay Hue", vi: "Tib Chay Hương Vị Huế", address: "89 Phan Chu Trinh, Ward 2,", city: "Phu Nhuan, HCMC", loc: "Phu Nhuan", diet: "Flexitarian" as const, sub: "(Chay kỳ)", img: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80", r: 4.5, rev: 67 },
    { name: "Tue Vegetarian Lounge", vi: "Tuệ Vegetarian Lounge", address: "76 Mai Thi Luu, Da Kao,", city: "District 1, HCMC", loc: "District 1", diet: "100% Vegan" as const, sub: "(Thuần chay)", img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80", r: 4.8, rev: 139 },
    { name: "Roots Da Nang Plant Kitchen", vi: "Roots Đỗ Bá Đà Nẵng", address: "43 An Thuong 30, Ngu Hanh Son,", city: "Da Nang", loc: "Da Nang", diet: "100% Vegan" as const, sub: "(Thuần chay)", img: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80", r: 4.8, rev: 189 },
    { name: "Komorebi Vegan Eatery", vi: "Komorebi Thuần Chay", address: "45 Tran Nhat Duat, Tan Dinh,", city: "District 1, HCMC", loc: "District 1", diet: "100% Vegan" as const, sub: "(Thuần chay)", img: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80", r: 4.7, rev: 84 },
  ];

  const fullList: AdminRestaurant[] = [...INITIAL_FEATURED_RESTAURANTS];

  for (let i = 5; i <= 84; i++) {
    const template = venuesData[(i - 5) % venuesData.length];
    const isPrivate = i % 5 === 0;
    const paddedId = `VMR-${1150 + i * 7}`;
    fullList.push({
      id: paddedId,
      name: `${template.name} #${Math.floor(i / venuesData.length) + 1}`,
      vietnameseName: template.vi,
      addressStreet: template.address,
      addressDistrictCity: template.city,
      locality: template.loc,
      dietType: template.diet,
      dietSubtype: template.sub,
      rating: parseFloat((4.3 + (i % 7) * 0.1).toFixed(1)),
      reviewCount: 30 + (i * 11) % 350,
      status: isPrivate ? "Private" : "Public",
      imageUrl: template.img,
      phone: `028 ${(3000 + i * 23).toString().padStart(4, "0")} 8888`,
      priceRange: "50.000đ - 180.000đ",
      openingHours: "08:00 - 21:30",
    });
  }

  return fullList;
}

const ITEMS_PER_PAGE = 4;

export default function AdminRestaurantsPage() {
  const ui = useUiText();
  const { user } = useAuth();

  // All 84 restaurants in system
  const [restaurants, setRestaurants] = useState<AdminRestaurant[]>(() => generateFullRestaurantsList());

  // Search & Filter states
  const [searchAdmin, setSearchAdmin] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [dietTypeFilter, setDietTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<AdminRestaurant | null>(null);

  // Form Fields (Vietnamese Name removed, Address merged, Rating/Reviews removed)
  const [formName, setFormName] = useState("");
  const [formId, setFormId] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formDistrictCity, setFormDistrictCity] = useState("District 3, HCMC");
  const [formLocality, setFormLocality] = useState("District 3");
  const [formDietType, setFormDietType] = useState<"100% Vegan" | "Lacto-Ovo" | "Flexitarian" | "Vegetarian Buffet">("100% Vegan");
  const [formDietSubtype, setFormDietSubtype] = useState("(Thuần chay)");
  const [formStatus, setFormStatus] = useState<"Public" | "Private">("Public");
  const [formImageUrl, setFormImageUrl] = useState("https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80");
  const [formPhone, setFormPhone] = useState("");
  const [formPriceRange, setFormPriceRange] = useState("50.000đ - 150.000đ");
  const [formOpeningHours, setFormOpeningHours] = useState("08:00 - 21:30");
  const [formParkingNote, setFormParkingNote] = useState("");

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  // Filter logic
  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((r) => {
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        r.name.toLowerCase().includes(q) ||
        (r.vietnameseName && r.vietnameseName.toLowerCase().includes(q)) ||
        r.id.toLowerCase().includes(q) ||
        r.addressStreet.toLowerCase().includes(q) ||
        r.addressDistrictCity.toLowerCase().includes(q);

      const matchLocation =
        locationFilter === "all" ||
        r.locality.toLowerCase().includes(locationFilter.toLowerCase()) ||
        r.addressDistrictCity.toLowerCase().includes(locationFilter.toLowerCase());

      const matchDiet =
        dietTypeFilter === "all" || r.dietType.toLowerCase().includes(dietTypeFilter.toLowerCase());

      return matchSearch && matchLocation && matchDiet;
    });
  }, [restaurants, searchQuery, locationFilter, dietTypeFilter]);

  // Pagination calculation
  const totalItems = filteredRestaurants.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedRestaurants = useMemo(() => {
    const startIdx = (safePage - 1) * ITEMS_PER_PAGE;
    return filteredRestaurants.slice(startIdx, startIdx + ITEMS_PER_PAGE);
  }, [filteredRestaurants, safePage]);

  const startRecordNum = totalItems === 0 ? 0 : (safePage - 1) * ITEMS_PER_PAGE + 1;
  const endRecordNum = Math.min(safePage * ITEMS_PER_PAGE, totalItems);

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setLocationFilter("all");
    setDietTypeFilter("all");
    setCurrentPage(1);
    showToast("Filters reset to default");
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      "ID",
      "Name",
      "Address",
      "City & District",
      "Diet Type",
      "Diet Subtype",
      "Rating",
      "Reviews Count",
      "Status",
      "Phone",
      "Price Range",
      "Opening Hours",
      "Parking Note",
    ];

    const rows = filteredRestaurants.map((r) => [
      `"${r.id}"`,
      `"${r.name.replace(/"/g, '""')}"`,
      `"${r.addressStreet.replace(/"/g, '""')}"`,
      `"${r.addressDistrictCity.replace(/"/g, '""')}"`,
      `"${r.dietType}"`,
      `"${r.dietSubtype}"`,
      r.rating,
      r.reviewCount,
      `"${r.status}"`,
      `"${r.phone || ""}"`,
      `"${r.priceRange || ""}"`,
      `"${r.openingHours || ""}"`,
      `"${(r.parkingNote || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `veggiemate_restaurants_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Exported ${filteredRestaurants.length} restaurants to CSV`);
  };

  // Toggle Status: Public <-> Private
  const handleToggleStatus = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setRestaurants((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const nextStatus = r.status === "Public" ? "Private" : "Public";
          showToast(`Restaurant "${r.name}" set to ${nextStatus}`);
          return { ...r, status: nextStatus };
        }
        return r;
      })
    );
  };

  // Delete Restaurant
  const handleDeleteRestaurant = (id: string, name: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (confirm(`Are you sure you want to remove "${name}" from the directory?`)) {
      setRestaurants((prev) => prev.filter((r) => r.id !== id));
      showToast(`Removed "${name}" from directory`);
    }
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingRestaurant(null);
    const generatedNextId = `VMR-${1200 + restaurants.length + 1}`;
    setFormId(generatedNextId);
    setFormName("");
    setFormAddress("");
    setFormDistrictCity("District 3, HCMC");
    setFormLocality("District 3");
    setFormDietType("100% Vegan");
    setFormDietSubtype("(Thuần chay)");
    setFormStatus("Public");
    setFormImageUrl("https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80");
    setFormPhone("028 3822 9188");
    setFormPriceRange("50.000đ - 150.000đ");
    setFormOpeningHours("08:00 - 21:30");
    setFormParkingNote("");
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (r: AdminRestaurant) => {
    setEditingRestaurant(r);
    setFormId(r.id);
    setFormName(r.name);
    setFormAddress(r.addressStreet);
    setFormDistrictCity(r.addressDistrictCity);
    setFormLocality(r.locality);
    setFormDietType(r.dietType);
    setFormDietSubtype(r.dietSubtype);
    setFormStatus(r.status);
    setFormImageUrl(r.imageUrl);
    setFormPhone(r.phone || "");
    setFormPriceRange(r.priceRange || "50.000đ - 150.000đ");
    setFormOpeningHours(r.openingHours || "08:00 - 21:30");
    setFormParkingNote(r.parkingNote || "");
    setIsModalOpen(true);
  };

  // Save Restaurant (Create or Edit)
  const handleSaveRestaurant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formAddress.trim()) return;

    if (editingRestaurant) {
      setRestaurants((prev) =>
        prev.map((r) =>
          r.id === editingRestaurant.id
            ? {
              ...r,
              name: formName.trim(),
              addressStreet: formAddress.trim(),
              addressDistrictCity: formDistrictCity.trim(),
              locality: formLocality,
              dietType: formDietType,
              dietSubtype: formDietSubtype,
              // Rating & reviewCount are user feedback, preserved untouched
              rating: editingRestaurant.rating,
              reviewCount: editingRestaurant.reviewCount,
              status: formStatus,
              imageUrl: formImageUrl.trim(),
              phone: formPhone.trim(),
              priceRange: formPriceRange.trim(),
              openingHours: formOpeningHours.trim(),
              parkingNote: formParkingNote.trim(),
            }
            : r
        )
      );
      showToast(`Updated restaurant "${formName}"`);
    } else {
      const newEntry: AdminRestaurant = {
        id: formId.trim() || `VMR-${Date.now().toString().slice(-4)}`,
        name: formName.trim(),
        addressStreet: formAddress.trim(),
        addressDistrictCity: formDistrictCity.trim(),
        locality: formLocality,
        dietType: formDietType,
        dietSubtype: formDietSubtype,
        // New venues start with default community baseline (admin does not fake ratings)
        rating: 5.0,
        reviewCount: 0,
        status: formStatus,
        imageUrl: formImageUrl.trim(),
        phone: formPhone.trim(),
        priceRange: formPriceRange.trim(),
        openingHours: formOpeningHours.trim(),
        parkingNote: formParkingNote.trim(),
      };
      setRestaurants((prev) => [newEntry, ...prev]);
      showToast(`Added restaurant "${formName}"`);
    }

    setIsModalOpen(false);
  };

  // Standardized Diet badge: English on top line, Vietnamese in parentheses on bottom line
  const renderDietBadge = (dietType: string, subtype?: string) => {
    if (dietType === "100% Vegan") {
      return (
        <div className="inline-flex min-w-[124px] flex-col items-center justify-center rounded-2xl bg-[#EAF5EE] px-3.5 py-1.5 text-center text-xs font-semibold text-[#1E7E51] border border-[#D5EBDC]">
          <span>100% Vegan</span>
          <span className="text-[11px] font-medium text-[#2E8B57]">{subtype || "(Thuần chay)"}</span>
        </div>
      );
    }
    if (dietType === "Lacto-Ovo" || dietType === "Chay trường") {
      return (
        <div className="inline-flex min-w-[124px] flex-col items-center justify-center rounded-2xl bg-[#FEF1E8] px-3.5 py-1.5 text-center text-xs font-semibold text-[#C25E28] border border-[#FCDDC8]">
          <span>Lacto-Ovo</span>
          <span className="text-[11px] font-medium text-[#C25E28]">{subtype || "(Chay trường)"}</span>
        </div>
      );
    }
    if (dietType === "Vegetarian Buffet" || dietType === "Buffet Chay") {
      return (
        <div className="inline-flex min-w-[124px] flex-col items-center justify-center rounded-2xl bg-[#F4ECF9] px-3.5 py-1.5 text-center text-xs font-semibold text-[#7C3AED] border border-[#E9D5FF]">
          <span>Vegetarian Buffet</span>
          <span className="text-[11px] font-medium text-[#7C3AED]">{subtype || "(Buffet chay)"}</span>
        </div>
      );
    }
    return (
      <div className="inline-flex min-w-[124px] flex-col items-center justify-center rounded-2xl bg-[#FEF9E7] px-3.5 py-1.5 text-center text-xs font-semibold text-[#9A6B1F] border border-[#F6E8B9]">
        <span>Flexitarian</span>
        <span className="text-[11px] font-medium text-[#9A6B1F]">{subtype || "(Chay kỳ)"}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Bar Header matching mock top navigation */}
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

      {/* Title & Action Buttons Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between pt-1">
        <div className="max-w-2xl">
          <h1 className="font-serif text-3xl font-bold tracking-tight text-[#07241A] lg:text-4xl">
            <UiText text="Restaurants Management" />
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-[#727974] lg:text-sm">
            <UiText text="Manage curated plant-based sanctuaries, verified dining coordinates, partner submissions, and allergen-safe certifications across Vietnam." />
          </p>
        </div>

        {/* Action Buttons: Export CSV & Add New Restaurant */}
        <div className="flex items-center gap-2.5 self-start">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-2 rounded-xl border border-[#EFEEEB] bg-white px-4 py-2 text-xs font-semibold text-[#07241A] shadow-xs transition hover:bg-[#F2EFE9]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span><UiText text="Export CSV" /></span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 rounded-xl bg-[#0F2F24] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#1E3A2F]"
          >
            <span className="text-base leading-none font-bold">+</span>
            <span><UiText text="Add New Restaurant" /></span>
          </button>
        </div>
      </div>

      {/* Metric Stat Card: TOTAL PLACES (All English as requested in Image 2) */}
      <div className="w-full max-w-sm rounded-2xl border border-[#EFEEEB] bg-white p-5 shadow-xs">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#727974]">
              TOTAL PLACES
            </span>
            <p className="text-[11px] text-[#A0A5A1]">Total establishments added</p>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#EFEEEB] bg-[#FBF9F6] text-[#727974]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
              <path d="M2 7h20" />
            </svg>
          </div>
        </div>

        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-4xl font-bold tracking-tight text-[#07241A]">{restaurants.length}</span>
          <span className="text-xs font-medium text-[#727974]">places added in system</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#EFEEEB] bg-white p-2.5 shadow-xs lg:flex-row lg:items-center">
        {/* Search input with search icon */}
        <div className="relative flex-1">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A0A5A1]" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder={ui("Search restaurant by name, ID, or address...")}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-xl border border-transparent bg-transparent py-2 pl-9 pr-4 text-xs font-normal text-[#07241A] placeholder-[#A0A5A1] outline-none focus:bg-[#FBF9F6]"
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-2 border-t border-[#EFEEEB] pt-2 lg:border-t-0 lg:pt-0">
          {/* Location Dropdown */}
          <div className="relative flex items-center">
            <span className="pointer-events-none absolute left-3 text-[#727974]">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </span>
            <select
              value={locationFilter}
              onChange={(e) => {
                setLocationFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="cursor-pointer appearance-none rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] py-2 pl-8 pr-7 text-xs font-medium text-[#424844] outline-none transition hover:bg-white focus:border-[#1E3A2F] focus:bg-white"
            >
              <option value="all">Location: All Localities</option>
              <option value="District 1">District 1, HCMC</option>
              <option value="District 3">District 3, HCMC</option>
              <option value="Thu Duc City">Thu Duc City, HCMC</option>
              <option value="Phu Nhuan">Phu Nhuan, HCMC</option>
              <option value="Hanoi">Hanoi</option>
              <option value="Da Nang">Da Nang</option>
            </select>
            <span className="pointer-events-none absolute right-2.5 text-[9px] text-[#727974]">▼</span>
          </div>

          {/* Types of Vegetarianism Dropdown (Consistent English + Vietnamese format) */}
          <div className="relative flex items-center">
            <span className="pointer-events-none absolute left-3 text-[#727974]">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="m4.93 4.93 4.24 4.24" />
                <path d="m14.83 9.17 4.24-4.24" />
                <path d="m14.83 14.83 4.24 4.24" />
                <path d="m9.17 14.83-4.24 4.24" />
                <circle cx="12" cy="12" r="4" />
              </svg>
            </span>
            <select
              value={dietTypeFilter}
              onChange={(e) => {
                setDietTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="cursor-pointer appearance-none rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] py-2 pl-8 pr-7 text-xs font-medium text-[#424844] outline-none transition hover:bg-white focus:border-[#1E3A2F] focus:bg-white"
            >
              <option value="all">Types of Vegetarianism: All</option>
              <option value="100% Vegan">100% Vegan (Thuần chay)</option>
              <option value="Lacto-Ovo">Lacto-Ovo (Chay trường)</option>
              <option value="Flexitarian">Flexitarian (Chay kỳ)</option>
              <option value="Vegetarian Buffet">Vegetarian Buffet (Buffet chay)</option>
            </select>
            <span className="pointer-events-none absolute right-2.5 text-[9px] text-[#727974]">▼</span>
          </div>

          {/* Refresh / Reset Button */}
          <button
            type="button"
            title="Reset Filters"
            onClick={handleResetFilters}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] text-[#727974] transition hover:bg-white hover:text-[#07241A]"
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

      {/* Main Table Card */}
      <div className="overflow-hidden rounded-2xl border border-[#EFEEEB] bg-white shadow-xs">
        {/* Table Header */}
        <div className="hidden border-b border-[#EFEEEB] bg-transparent px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-[#727974] md:grid md:grid-cols-12 md:gap-4 md:items-center">
          <div className="col-span-4 lg:col-span-4">
            <UiText text="RESTAURANT & IDENTITY" />
          </div>
          <div className="col-span-3 lg:col-span-3">
            <UiText text="LOCATION" />
          </div>
          <div className="col-span-2 lg:col-span-2 text-center">
            <UiText text="TYPES OF VEGETARIANISM" />
          </div>
          <div className="col-span-2 lg:col-span-2">
            <UiText text="RATING & COMMUNITY" />
          </div>
          <div className="col-span-1 lg:col-span-1 text-center">
            <UiText text="STATUS" />
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-[#EFEEEB]">
          {paginatedRestaurants.length === 0 ? (
            <div className="py-16 text-center">
              <span className="text-4xl">🏪</span>
              <p className="mt-3 text-sm font-semibold text-[#07241A]"><UiText text="No restaurants found." /></p>
              <p className="mt-1 text-xs text-[#727974]"><UiText text="Try adjusting your search query or reset the filters." /></p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-4 rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] px-4 py-1.5 text-xs font-semibold text-[#07241A] hover:bg-white"
              >
                <UiText text="Clear Filters" />
              </button>
            </div>
          ) : (
            paginatedRestaurants.map((r) => (
              <div
                key={r.id}
                onClick={() => handleOpenEditModal(r)}
                className="group relative flex flex-col gap-4 p-5 transition duration-150 hover:bg-[#FAF9F5] md:grid md:grid-cols-12 md:gap-4 md:items-center md:px-6 md:py-5 cursor-pointer"
              >
                {/* 1. RESTAURANT & IDENTITY */}
                <div className="col-span-4 lg:col-span-4 flex items-center gap-3.5">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-[#EFEEEB] bg-[#F3F4F6] shadow-xs">
                    <Image
                      src={r.imageUrl}
                      alt={r.name}
                      fill
                      sizes="56px"
                      className="object-cover transition duration-200 group-hover:scale-105"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-serif text-base font-bold text-[#07241A] leading-snug group-hover:text-[#1E3A2F]">
                      {r.name}
                    </h3>
                    <p className="mt-0.5 text-xs text-[#8E9590] truncate">
                      {r.vietnameseName ? `${r.vietnameseName} • ` : ""}ID: {r.id}
                    </p>
                  </div>
                </div>

                {/* 2. LOCATION */}
                <div className="col-span-3 lg:col-span-3 flex items-start gap-1.5 text-xs text-[#5A625D] leading-relaxed">
                  <span className="mt-0.5 shrink-0 text-[#8E9590]">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </span>
                  <div className="min-w-0">
                    <p className="text-[#333835] font-normal">{r.addressStreet}</p>
                    <p className="text-[#6B7280]">{r.addressDistrictCity}</p>
                  </div>
                </div>

                {/* 3. TYPES OF VEGETARIANISM (English on top line, Vietnamese in parentheses) */}
                <div className="col-span-2 lg:col-span-2 flex justify-start md:justify-center">
                  {renderDietBadge(r.dietType, r.dietSubtype)}
                </div>

                {/* 4. RATING & COMMUNITY */}
                <div className="col-span-2 lg:col-span-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#07241A]">
                    <span className="text-[#EA580C] text-sm">★</span>
                    <span>{r.rating.toFixed(1)} / 5.0</span>
                  </div>
                  <p className="mt-0.5 text-xs text-[#727974]">
                    {r.reviewCount} <UiText text="verified reviews" />
                  </p>
                </div>

                {/* 5. STATUS & ACTIONS */}
                <div className="col-span-1 lg:col-span-1 flex items-center justify-between md:justify-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => handleToggleStatus(r.id, e)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition ${r.status === "Public"
                      ? "bg-[#EAF5EE] text-[#1E7E51] border border-[#D5EBDC] hover:bg-emerald-100"
                      : "bg-[#F3F4F6] text-[#4B5563] border border-[#E5E7EB] hover:bg-gray-200"
                      }`}
                    title="Click to toggle status (Public / Private)"
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${r.status === "Public" ? "bg-[#1E7E51]" : "bg-[#6B7280]"
                        }`}
                    />
                    <span>{r.status}</span>
                  </button>

                  {/* Row hover action controls for quick admin editing */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition duration-150 absolute right-4 md:static">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditModal(r);
                      }}
                      className="rounded-lg p-1 text-[#727974] hover:bg-[#EFEEEB] hover:text-[#07241A]"
                      title="Edit Restaurant"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteRestaurant(r.id, r.name, e)}
                      className="rounded-lg p-1 text-red-400 hover:bg-red-50 hover:text-red-600"
                      title="Delete Restaurant"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Table Footer with Pagination matching exact design */}
        <div className="flex flex-col gap-4 border-t border-[#EFEEEB] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Summary text */}
          <div className="text-xs font-normal text-[#727974]">
            Showing <span className="font-semibold text-[#07241A]">{startRecordNum} - {endRecordNum}</span> of{" "}
            <span className="font-semibold text-[#07241A]">{totalItems}</span> dining places in Vietnam database
          </div>

          {/* Pagination controls */}
          <div className="flex items-center gap-1.5 self-center sm:self-auto">
            {/* Prev button */}
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#EFEEEB] bg-white text-xs font-medium text-[#727974] transition hover:bg-[#F2EFE9] disabled:opacity-40 disabled:hover:bg-white"
            >
              ‹
            </button>

            {/* Page 1 */}
            <button
              type="button"
              onClick={() => setCurrentPage(1)}
              className={`h-8 w-8 rounded-lg text-xs font-semibold transition ${safePage === 1
                ? "bg-[#0F2F24] text-white shadow-xs"
                : "text-[#727974] hover:bg-[#F2EFE9] hover:text-[#07241A]"
                }`}
            >
              1
            </button>

            {/* Page 2 */}
            {totalPages >= 2 && (
              <button
                type="button"
                onClick={() => setCurrentPage(2)}
                className={`h-8 w-8 rounded-lg text-xs font-semibold transition ${safePage === 2
                  ? "bg-[#0F2F24] text-white shadow-xs"
                  : "text-[#727974] hover:bg-[#F2EFE9] hover:text-[#07241A]"
                  }`}
              >
                2
              </button>
            )}

            {/* Page 3 */}
            {totalPages >= 3 && (
              <button
                type="button"
                onClick={() => setCurrentPage(3)}
                className={`h-8 w-8 rounded-lg text-xs font-semibold transition ${safePage === 3
                  ? "bg-[#0F2F24] text-white shadow-xs"
                  : "text-[#727974] hover:bg-[#F2EFE9] hover:text-[#07241A]"
                  }`}
              >
                3
              </button>
            )}

            {/* Ellipsis if more than 4 pages */}
            {totalPages > 4 && (
              <span className="px-1 text-xs text-[#A0A5A1]">...</span>
            )}

            {/* Last Page (e.g. 21) */}
            {totalPages > 3 && (
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                className={`h-8 w-8 rounded-lg text-xs font-semibold transition ${safePage === totalPages
                  ? "bg-[#0F2F24] text-white shadow-xs"
                  : "text-[#727974] hover:bg-[#F2EFE9] hover:text-[#07241A]"
                  }`}
              >
                {totalPages}
              </button>
            )}

            {/* Next button */}
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#EFEEEB] bg-white text-xs font-medium text-[#727974] transition hover:bg-[#F2EFE9] disabled:opacity-40 disabled:hover:bg-white"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Restaurant Modal */}
      {isModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-xs animate-fade-in"
        >
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#EFEEEB] bg-white p-6 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#EFEEEB] pb-4">
              <div>
                <h2 className="font-serif text-lg font-bold text-[#07241A]">
                  {editingRestaurant ? ui("Edit Restaurant Venue") : ui("Add New Vegetarian Restaurant")}
                </h2>
                <p className="text-xs text-[#727974] mt-0.5">
                  ID: <span className="font-mono font-semibold text-[#07241A]">{formId}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#727974] hover:bg-[#F2EFE9] hover:text-[#07241A] transition text-sm font-semibold"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveRestaurant} className="mt-4 space-y-4">
              {/* Community rating info banner if editing (read-only for admin) */}
              {editingRestaurant && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] px-4 py-2.5 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 font-bold text-[#07241A]">
                      <span className="text-[#EA580C]">★</span>
                      <span>{editingRestaurant.rating.toFixed(1)} / 5.0</span>
                    </div>
                    <span className="text-[#D1D5DB]">•</span>
                    <span className="text-[#727974]">
                      <strong className="text-[#07241A]">{editingRestaurant.reviewCount}</strong> verified user reviews
                    </span>
                  </div>
                  <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200">
                    User review metrics (Read-only)
                  </span>
                </div>
              )}

              {/* 1. Restaurant Name (English) */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#727974]">
                  <UiText text="Restaurant Name" /> *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Green Garden Bistro"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] px-3.5 py-2 text-xs font-semibold text-[#07241A] outline-none focus:border-[#1E3A2F] focus:bg-white"
                />
              </div>

              {/* 2. Merged Single Address Field */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#727974]">
                  <UiText text="Address" /> *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 124/8 Nguyen Dinh Chieu, Ward Vo Thi Sau, District 3"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] px-3.5 py-2 text-xs text-[#07241A] outline-none focus:border-[#1E3A2F] focus:bg-white"
                />
              </div>

              {/* 3. District & City + Locality Group */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#727974]">
                    <UiText text="City / Province Line" /> *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. District 3, HCMC"
                    value={formDistrictCity}
                    onChange={(e) => setFormDistrictCity(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] px-3.5 py-2 text-xs text-[#07241A] outline-none focus:border-[#1E3A2F] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#727974]">
                    <UiText text="Locality Filter Group" />
                  </label>
                  <select
                    value={formLocality}
                    onChange={(e) => setFormLocality(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] px-3.5 py-2 text-xs font-semibold text-[#07241A] outline-none focus:border-[#1E3A2F] focus:bg-white cursor-pointer"
                  >
                    <option value="District 1">District 1</option>
                    <option value="District 3">District 3</option>
                    <option value="Thu Duc City">Thu Duc City</option>
                    <option value="Phu Nhuan">Phu Nhuan</option>
                    <option value="Binh Thanh">Binh Thanh</option>
                    <option value="Hanoi">Hanoi</option>
                    <option value="Da Nang">Da Nang</option>
                  </select>
                </div>
              </div>

              {/* 4. Type of Vegetarianism & Diet Subtype Label */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#727974]">
                    <UiText text="Type of Vegetarianism" />
                  </label>
                  <select
                    value={formDietType}
                    onChange={(e) => {
                      const dt = e.target.value as "100% Vegan" | "Lacto-Ovo" | "Flexitarian" | "Vegetarian Buffet";
                      setFormDietType(dt);
                      if (dt === "100% Vegan") setFormDietSubtype("(Thuần chay)");
                      else if (dt === "Lacto-Ovo") setFormDietSubtype("(Chay trường)");
                      else if (dt === "Flexitarian") setFormDietSubtype("(Chay kỳ)");
                      else setFormDietSubtype("(Buffet chay)");
                    }}
                    className="mt-1.5 w-full rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] px-3.5 py-2 text-xs font-semibold text-[#07241A] outline-none focus:border-[#1E3A2F] focus:bg-white cursor-pointer"
                  >
                    <option value="100% Vegan">100% Vegan (Thuần chay)</option>
                    <option value="Lacto-Ovo">Lacto-Ovo (Chay trường)</option>
                    <option value="Flexitarian">Flexitarian (Chay kỳ)</option>
                    <option value="Vegetarian Buffet">Vegetarian Buffet (Buffet chay)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#727974]">
                    <UiText text="Diet Subtype Label (Vietnamese)" />
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. (Thuần chay)"
                    value={formDietSubtype}
                    onChange={(e) => setFormDietSubtype(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] px-3.5 py-2 text-xs text-[#07241A] outline-none focus:border-[#1E3A2F] focus:bg-white"
                  />
                </div>
              </div>

              {/* 5. Status */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#727974]">
                  <UiText text="Status" />
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as "Public" | "Private")}
                  className="mt-1.5 w-full rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] px-3.5 py-2 text-xs font-semibold text-[#07241A] outline-none focus:border-[#1E3A2F] focus:bg-white cursor-pointer"
                >
                  <option value="Public">Public (Công khai)</option>
                  <option value="Private">Private (Riêng tư)</option>
                </select>
              </div>

              {/* 6. Phone, Price, Hours */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#727974]">
                    <UiText text="Phone Number" />
                  </label>
                  <input
                    type="text"
                    placeholder="028 3822 9188"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] px-3.5 py-2 text-xs text-[#07241A] outline-none focus:border-[#1E3A2F] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#727974]">
                    <UiText text="Price Range" />
                  </label>
                  <input
                    type="text"
                    placeholder="50.000đ - 150.000đ"
                    value={formPriceRange}
                    onChange={(e) => setFormPriceRange(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] px-3.5 py-2 text-xs text-[#07241A] outline-none focus:border-[#1E3A2F] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#727974]">
                    <UiText text="Opening Hours" />
                  </label>
                  <input
                    type="text"
                    placeholder="08:00 - 21:30"
                    value={formOpeningHours}
                    onChange={(e) => setFormOpeningHours(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] px-3.5 py-2 text-xs text-[#07241A] outline-none focus:border-[#1E3A2F] focus:bg-white"
                  />
                </div>
              </div>

              {/* 7. Parking Note */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#727974]">
                    <UiText text="Parking Note" />
                  </label>
                  <span className="text-[10px] text-[#A0A5A1]">
                    <UiText text="Motorbike / Car parking guidance" />
                  </span>
                </div>
                <textarea
                  rows={2}
                  placeholder="e.g. Free parking"
                  value={formParkingNote}
                  onChange={(e) => setFormParkingNote(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] px-3.5 py-2 text-xs text-[#07241A] outline-none focus:border-[#1E3A2F] focus:bg-white resize-none"
                />
                <p className="mt-1 text-[11px] text-[#8E9590]">
                  <UiText text="Ghi chú về chỗ giữ xe máy/ô tô hoặc lưu ý đặc biệt về địa điểm cho thực khách." />
                </p>
              </div>

              {/* 8. Cover Image URL */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#727974]">
                  <UiText text="Cover Image URL" />
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] px-3.5 py-2 text-xs text-[#07241A] outline-none focus:border-[#1E3A2F] focus:bg-white"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 border-t border-[#EFEEEB] pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-[#EFEEEB] px-4 py-2 text-xs font-semibold text-[#424844] hover:bg-[#F2EFE9]"
                >
                  <UiText text="Cancel" />
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#0F2F24] px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#1E3A2F]"
                >
                  {editingRestaurant ? ui("Save Changes") : ui("Add Restaurant")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
