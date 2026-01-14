import { useQuery } from "@tanstack/react-query";

export function useConfig(category: string) {
  return useQuery({
    queryKey: ["config", category],
    queryFn: async () => {
      const res = await fetch(`/api/config?category=${category}`);
      if (!res.ok) {
        throw new Error("Failed to fetch config");
      }
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 min
  });
}
