"use client";

import Image from "next/image";
import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import ContentIcon from "@/components/content/ContentIcon";

export default function FeedImage({ src, alt, compact }: { src: string; alt: string; compact: boolean }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const { t } = useLanguage();
  if (failed) return <span role="img" aria-label={`${alt} — ${t("Image unavailable", "Ảnh không khả dụng")}`} className="flex flex-col items-center gap-2 text-xs text-[#658266]"><ContentIcon name="recipe" width="36" height="36" />{t("Image unavailable", "Ảnh không khả dụng")}</span>;
  return <>
    {!loaded && <span aria-hidden="true" className="vm-skeleton absolute inset-0" />}
    <Image src={src} alt={alt} fill unoptimized loading="lazy" sizes={`(max-width: 640px) 100vw, (max-width: 1024px) 50vw, ${compact ? "25vw" : "33vw"}`} onLoad={() => setLoaded(true)} onError={() => setFailed(true)} className={`vm-feed-image object-cover ${loaded ? "opacity-100" : "opacity-0"}`} />
  </>;
}
