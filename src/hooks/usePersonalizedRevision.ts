"use client";

import { useSyncExternalStore } from "react";
import { getPersonalizedRevision, subscribePersonalizedData } from "@/lib/personalized-data";

export function usePersonalizedRevision() {
  return useSyncExternalStore(subscribePersonalizedData, getPersonalizedRevision, () => 0);
}
