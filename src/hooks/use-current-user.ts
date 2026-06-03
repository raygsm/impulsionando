import { useQuery } from "@tanstack/react-query";
import { fetchCurrentUser } from "@/lib/auth";

export function useCurrentUser() {
  return useQuery({
    queryKey: ["current-user"],
    queryFn: fetchCurrentUser,
    staleTime: 60_000,
  });
}
