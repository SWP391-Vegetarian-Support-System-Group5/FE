import type { SVGProps } from "react";

export type ContentIconName = "plus" | "search" | "grid" | "list" | "recipe" | "video" | "check" | "draft" | "arrow" | "clock" | "eye" | "edit" | "trash" | "close" | "leaf";
const paths: Record<ContentIconName, React.ReactNode> = {
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
