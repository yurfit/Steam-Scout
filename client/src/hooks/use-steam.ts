import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useDebounce } from "@/hooks/use-debounce"; // We'll assume a standard debounce hook or implement inline if critical, but for now I'll use standard query with enabled

export function useSteamSearch(term: string) {
  return useQuery({
    queryKey: [api.steam.search.path, term],
    queryFn: async () => {
      if (!term || term.length < 2) return [];
      const url = `${api.steam.search.path}?term=${encodeURIComponent(term)}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Steam search failed");
      return api.steam.search.responses[200].parse(await res.json());
    },
    enabled: term.length >= 2,
    staleTime: 1000 * 60 * 5, // Cache for 5 mins
  });
}

export function useSteamAppDetails(appId: number | undefined) {
  return useQuery({
    queryKey: [api.steam.details.path, appId],
    queryFn: async () => {
      if (!appId) throw new Error("App ID required");
      const url = buildUrl(api.steam.details.path, { id: appId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch app details");
      return api.steam.details.responses[200].parse(await res.json());
    },
    enabled: !!appId,
    staleTime: 1000 * 60 * 60, // Cache details for 1 hour
  });
}
