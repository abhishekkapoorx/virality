"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback } from "react";

import { apiFetch } from "./apiClient";

export function useAuthedApi() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  const fetchWithAuth = useCallback(
    async (path: string, init: RequestInit = {}) => {
      const token = await getToken();
      return apiFetch(path, { ...init, token });
    },
    [getToken]
  );

  return { fetchWithAuth, isLoaded, isSignedIn };
}
