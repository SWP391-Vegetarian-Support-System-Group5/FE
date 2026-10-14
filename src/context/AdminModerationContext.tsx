"use client";

import React, { createContext, useContext, useState, useCallback, useMemo } from "react";

// ADMIN ROLE BYPASS FLAG FOR TESTING: Set to true to test admin features without restrictions
export const BYPASS_ADMIN_ROLE = true;

export interface FlaggedItem {
  id: string;
  category: "Recipe & Video" | "Restaurant Review" | "Comment";
  flagTime: string;
  flagTypeTag: string;
  flagTypeColor: string;
  title: string;
  authorName: string;
  authorBadge: string;
  authorAvatar?: string;
  authorInitials?: string;
  image?: string;
  videoDuration?: string;
  location?: string;
  commentQuote?: string;
  commentThread?: string;
  flagReason: string;
  flagSubBadge?: string;
  flagSubText?: string;
}

interface AdminModerationContextType {
  flaggedCount: number;
  contentCount: number;
  commentsCount: number;
  recipesCount: number;
  reviewsCount: number;
  items: FlaggedItem[];
  dismissFlag: (id: string) => void;
  removeContent: (id: string) => void;
  resetAll: () => void;
}

const initialFlaggedItems: FlaggedItem[] = [
  // 5 Community Recipes
  {
    id: "flag-1",
    category: "Recipe & Video",
    flagTime: "25m ago",
    flagTypeTag: "Ingredient Advisory",
    flagTypeColor: "bg-[#FEE2E2] text-[#C2410C]",
    title: "Easy Tofu in Tomato Sauce",
    authorName: "Linh Nguyen",
    authorBadge: "Community Chef, 42 contributions",
    authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
    videoDuration: "04:30",
    flagReason: "Potentially misleading ingredient information regarding gluten-free soy sauce substitutes.",
    flagSubBadge: "Step 4 • Sauce Marinade",
    flagSubText: "Suggested fix: Specify Tamari or Coconut Aminos",
  },
  {
    id: "flag-4",
    category: "Recipe & Video",
    flagTime: "45m ago",
    flagTypeTag: "Ingredient Advisory",
    flagTypeColor: "bg-[#FEE2E2] text-[#C2410C]",
    title: "Crispy Lemongrass Oyster Mushrooms",
    authorName: "Hoa Dang",
    authorBadge: "Plant-based Cook, 18 contributions",
    authorAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80",
    videoDuration: "06:15",
    flagReason: "AI noticed non-standard cooking oil temperature advice that could cause kitchen smoke safety concerns.",
    flagSubBadge: "Step 2 • Deep Frying",
    flagSubText: "Suggested advisory: Recommend medium heat 175°C",
  },
  {
    id: "flag-5",
    category: "Recipe & Video",
    flagTime: "1h 10m ago",
    flagTypeTag: "Health Claim",
    flagTypeColor: "bg-[#FEF3C7] text-[#92400E]",
    title: "Lotus Seed & Longan Sweet Soup",
    authorName: "Huong Le",
    authorBadge: "Ayurvedic Baker, 29 contributions",
    authorAvatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80",
    image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80",
    videoDuration: "03:45",
    flagReason: "Unsubstantiated medical claim stating this dessert cures chronic insomnia within 3 days.",
    flagSubBadge: "Description & Nutrition",
    flagSubText: "Flagged by VeggieAI Medical Claims Filter",
  },
  {
    id: "flag-6",
    category: "Recipe & Video",
    flagTime: "2h ago",
    flagTypeTag: "Ingredient Advisory",
    flagTypeColor: "bg-[#FEE2E2] text-[#C2410C]",
    title: "Vegan Bun Bo Hue with Homemade Broth",
    authorName: "Duc Tran",
    authorBadge: "Master Vegan Chef, 88 contributions",
    authorAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80",
    image: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=600&q=80",
    videoDuration: "12:10",
    flagReason: "User query on brand of premade mushroom seasoning which may contain hydrolyzed animal protein.",
    flagSubBadge: "Broth Ingredients",
    flagSubText: "Needs verified vegetarian certification tag",
  },
  {
    id: "flag-7",
    category: "Recipe & Video",
    flagTime: "3h ago",
    flagTypeTag: "Allergen Notice",
    flagTypeColor: "bg-[#FEF3C7] text-[#92400E]",
    title: "Raw Avocado Chocolate Mousse",
    authorName: "Mai Pham",
    authorBadge: "Raw Foods Enthusiast",
    authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80",
    image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80",
    videoDuration: "02:50",
    flagReason: "Hidden cashew butter ingredient not listed under allergen warning tags.",
    flagSubBadge: "Allergen Warning",
    flagSubText: "Tree nut allergy advisory missing",
  },

  // 4 Restaurant Reviews
  {
    id: "flag-2",
    category: "Restaurant Review",
    flagTime: "1h ago",
    flagTypeTag: "Community Report",
    flagTypeColor: "bg-[#F3F4F6] text-[#4B5563]",
    title: "A Weekend at Saigon Vegan Bistro",
    authorName: "Minh Tran",
    authorBadge: "Verified Local Guide",
    authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80",
    location: "District 1, HCMC",
    flagReason: "User-reported content regarding unverified business address and promotional claim.",
    flagSubBadge: "Reported by 2 Members",
    flagSubText: 'Claim: "Exclusive 50% lifetime coupon code in footer"',
  },
  {
    id: "flag-8",
    category: "Restaurant Review",
    flagTime: "2h 30m ago",
    flagTypeTag: "Promotional Spam",
    flagTypeColor: "bg-[#FEE2E2] text-[#C2410C]",
    title: "Loving Hut Da Nang - Hidden Gem?",
    authorName: "An Nguyen",
    authorBadge: "Contributor, 5 reviews",
    authorAvatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=120&q=80",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80",
    location: "Hai Chau, Da Nang",
    flagReason: "Review text contains external affiliate link and phone number solicitation.",
    flagSubBadge: "Policy §4.1 Solicitation",
    flagSubText: "Link removed automatically; review pending decision",
  },
  {
    id: "flag-9",
    category: "Restaurant Review",
    flagTime: "4h ago",
    flagTypeTag: "Disputed Info",
    flagTypeColor: "bg-[#FEF3C7] text-[#92400E]",
    title: "Chay Garden Thao Dien Review",
    authorName: "Quoc Bao",
    authorBadge: "Food Critic, 34 reviews",
    authorAvatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=120&q=80",
    image: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=600&q=80",
    location: "District 2, Thu Duc City",
    flagReason: "Dispute reported by restaurant owner stating pricing in review is 3 years outdated.",
    flagSubBadge: "Owner Ticket #1042",
    flagSubText: "Requires update or price verification",
  },
  {
    id: "flag-10",
    category: "Restaurant Review",
    flagTime: "5h ago",
    flagTypeTag: "Duplicate Content",
    flagTypeColor: "bg-[#F3F4F6] text-[#4B5563]",
    title: "Bong Sung Vegetarian Lounge",
    authorName: "Tram Anh",
    authorBadge: "New Member",
    authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80",
    location: "District 3, HCMC",
    flagReason: "High text similarity (94%) detected against external food blog article from 2024.",
    flagSubBadge: "Plagiarism Match",
    flagSubText: "Flagged by AI Content Integrity Bot",
  },

  // 3 Comments & Discussions
  {
    id: "flag-3",
    category: "Comment",
    flagTime: "2h ago",
    flagTypeTag: "Language & Tone",
    flagTypeColor: "bg-[#FEE2E2] text-[#C2410C]",
    title: "“This place is completely fake and doesn't serve organic ingredients at all...”",
    authorName: "Khoa Vu",
    authorBadge: "Target thread: Saigon Vegan Restaurant Review",
    authorInitials: "KV",
    commentQuote: "“This place is completely fake and doesn't serve organic ingredients at all...”",
    commentThread: "on: Saigon Vegan Review",
    flagReason: "Reported comment for disrespectful language and unsubstantiated allegations.",
    flagSubBadge: "VeggieAI Hospitality Rule §3.2",
    flagSubText: "Constructive feedback policy violation",
  },
  {
    id: "flag-11",
    category: "Comment",
    flagTime: "3h 40m ago",
    flagTypeTag: "Harassment Policy",
    flagTypeColor: "bg-[#FEE2E2] text-[#C2410C]",
    title: "“Do not trust this user, they are promoting non-vegan products on other sites!”",
    authorName: "Tuan Kiet",
    authorBadge: "Target thread: Easy Tofu in Tomato Sauce",
    authorInitials: "TK",
    commentQuote: "“Do not trust this user, they are promoting non-vegan products on other sites!”",
    commentThread: "on: Easy Tofu in Tomato Sauce",
    flagReason: "Personal attacks targeting another author rather than discussing the culinary recipe.",
    flagSubBadge: "Community Civility §1.4",
    flagSubText: "Ad hominem attacks reported by author",
  },
  {
    id: "flag-12",
    category: "Comment",
    flagTime: "6h ago",
    flagTypeTag: "Spam Detection",
    flagTypeColor: "bg-[#FEE2E2] text-[#C2410C]",
    title: "“Buy cheap vegan supplements here with 40% discount: bit.ly/healthy-supps”",
    authorName: "Guest-992",
    authorBadge: "Target thread: Loving Leaf Vegan Masterclass",
    authorInitials: "G9",
    commentQuote: "“Buy cheap vegan supplements here with 40% discount: bit.ly/healthy-supps”",
    commentThread: "on: Loving Leaf Masterclass",
    flagReason: "Automated promotional bot posting shortened URL links in recipe discussion.",
    flagSubBadge: "VeggieAI Spam Filter",
    flagSubText: "Malicious or untrusted URL pattern",
  },
];

const AdminModerationContext = createContext<AdminModerationContextType | undefined>(undefined);

export function AdminModerationProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<FlaggedItem[]>(initialFlaggedItems);

  const dismissFlag = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const removeContent = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const resetAll = useCallback(() => {
    setItems(initialFlaggedItems);
  }, []);

  const recipesCount = useMemo(() => {
    return items.filter((item) => item.category === "Recipe & Video").length;
  }, [items]);

  const reviewsCount = useMemo(() => {
    return items.filter((item) => item.category === "Restaurant Review").length;
  }, [items]);

  const contentCount = useMemo(() => {
    return recipesCount + reviewsCount;
  }, [recipesCount, reviewsCount]);

  const commentsCount = useMemo(() => {
    return items.filter((item) => item.category === "Comment").length;
  }, [items]);

  const flaggedCount = useMemo(() => {
    return items.length;
  }, [items]);

  const value = useMemo(
    () => ({
      flaggedCount,
      contentCount,
      commentsCount,
      recipesCount,
      reviewsCount,
      items,
      dismissFlag,
      removeContent,
      resetAll,
    }),
    [flaggedCount, contentCount, commentsCount, recipesCount, reviewsCount, items, dismissFlag, removeContent, resetAll]
  );

  return (
    <AdminModerationContext.Provider value={value}>
      {children}
    </AdminModerationContext.Provider>
  );
}

export function useAdminModeration() {
  const context = useContext(AdminModerationContext);
  if (!context) {
    throw new Error("useAdminModeration must be used within an AdminModerationProvider");
  }
  return context;
}
