import { createFileRoute } from "@tanstack/react-router";
import AccountShell from "@/components/colors/account/AccountShell";

export const Route = createFileRoute("/colors/minha-conta")({
  head: () => ({
    meta: [
      { title: "Minha conta — Colors Saúde" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountLayout,
});

function AccountLayout() {
  return <AccountShell />;
}
