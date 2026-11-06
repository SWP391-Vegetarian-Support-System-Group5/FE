import type { SVGProps } from "react";

export type ContentIconName = "plus" | "search" | "grid" | "list" | "recipe" | "video" | "check" | "draft" | "arrow" | "clock" | "eye" | "edit" | "trash" | "close" | "leaf" | "salad" | "pot" | "sparkles" | "lock" | "users" | "warning" | "info" | "send" | "sprout" | "pin" | "walk" | "bot" | "user" | "bookmark" | "message" | "refresh" | "tag" | "flag" | "heart" | "star";
const paths: Record<ContentIconName, React.ReactNode> = {
  sprout: <><path d="M12 21v-9M12 15C5 15 3 11 3 5c6 0 9 3 9 8M12 11c0-5 3-8 9-8 0 6-3 9-9 9" /></>,
  pin: <><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
  walk: <><circle cx="14" cy="4" r="2" /><path d="m7 21 3-6m6 6-2-6-3-3 2-5m-6 5 3-4 3-1 3 5h4" /></>,
  bot: <><rect x="4" y="7" width="16" height="14" rx="4" /><path d="M12 3v4M2 12v5m20-5v5M9 16h6M9 11v1m6-1v1" /><circle cx="12" cy="2" r="1" /></>,
  user: <><circle cx="12" cy="7" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2" /></>,
  bookmark: <path d="M6 3h12v19l-6-4-6 4V3Z" />,
  message: <path d="M21 11a8 8 0 0 1-8 8H7l-5 3 2-6a8 8 0 0 1-1-5V9a7 7 0 0 1 7-7h4a7 7 0 0 1 7 7v2Z" />,
  refresh: <><path d="M20 7a9 9 0 0 0-15-2L2 8m0-5v5h5M4 17a9 9 0 0 0 15 2l3-3m0 5v-5h-5" /></>,
  tag: <><path d="M3 3h8l10 10-8 8L3 11V3Z" /><circle cx="7.5" cy="7.5" r="1" /></>,
  flag: <><path d="M4 22V3m0 1c5-5 11 5 16 0v12c-5 5-11-5-16 0" /></>,
  heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0l-1 1-1-1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />,
  star: <path d="m12 2 3 6.2 6.8 1-4.9 4.8 1.2 6.8-6.1-3.2-6.1 3.2 1.2-6.8-4.9-4.8 6.8-1L12 2Z" />,
  salad: <><path d="M3 12h18a9 9 0 0 1-18 0ZM7 21h10M7 12c-3-5 1-9 5-5 2-5 7-3 6 2M12 7v5M17 12l3-6" /></>,
  pot: <><path d="M5 10h14v7a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4v-7ZM3 10h18M5 13H2m17 0h3M6 7h12M10 4h4v3" /></>,
  sparkles: <><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3ZM20 2v4m-2-2h4" /></>,
  lock: <><rect x="5" y="10" width="14" height="11" rx="3" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" /></>,
  users: <><circle cx="9" cy="8" r="3" /><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 4v3" /></>,
  warning: <><path d="m10.3 4-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3l-8-14a2 2 0 0 0-3.4 0ZM12 9v4M12 17h.01" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7h.01" /></>,
  send: <><path d="m22 2-7 20-4-9-9-4L22 2ZM11 13 22 2" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
  grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  list: <><path d="M9 5h12M9 12h12M9 19h12" /><path d="M3 5h1M3 12h1M3 19h1" /></>,
  recipe: <><path d="M4 4h6a3 3 0 0 1 3 3v14a4 4 0 0 0-4-2H4zM13 7a3 3 0 0 1 3-3h5v15h-4a4 4 0 0 0-4 2" /><path d="M7 8h3M7 12h3M16 8h2M16 12h2" /></>,
  video: <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m10 9 5 3-5 3z" /></>,
  check: <><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></>,
  draft: <><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6M8 13h8M8 17h5" /></>,
  arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
  edit: <><path d="m15 4 5 5M4 20l4-1L20 7a2 2 0 0 0-3-3L5 16z" /><path d="M13 20h8" /></>,
  trash: <><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7" /></>,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  leaf: <><path d="M20 3c-5 3-14-1-14 9a7 7 0 0 0 14 0zM4 21l11-11" /></>,
};

export default function ContentIcon({ name, ...props }: SVGProps<SVGSVGElement> & { name: ContentIconName }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>;
}
