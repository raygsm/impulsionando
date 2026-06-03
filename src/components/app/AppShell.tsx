import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Loader2 } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { data, isLoading, error } = useCurrentUser();

  useEffect(() => {
    if (!isLoading && !data) navigate({ to: "/auth" });
  }, [data, isLoading, navigate]);

  if (isLoading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-destructive p-6">
        Erro ao carregar usuário: {(error as Error).message}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar currentUser={data} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar currentUser={data} />
        <main className="flex-1 p-6 lg:p-8 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
