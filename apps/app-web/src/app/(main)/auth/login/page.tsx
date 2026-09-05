import { redirect } from "next/navigation";

/** Canonical login entry — branded surface lives at /auth/v1/login. */
export default function LoginRedirect() {
  redirect("/auth/v1/login");
}
