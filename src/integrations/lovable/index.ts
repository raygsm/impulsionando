import { supabase } from "../supabase/client";

type SignInOptions = {
  redirect_uri?: string;
  extraParams?: Record<string, string>;
};

// Compatibilidade de import para telas legadas: autenticação OAuth deve usar
// Supabase diretamente. O Lovable não pode intermediar sessão, domínio ou auth
// de produção.
export const lovable = {
  auth: {
    signInWithOAuth: async (provider: "google" | "apple" | "microsoft", opts?: SignInOptions) =>
      supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: opts?.redirect_uri,
          queryParams: opts?.extraParams,
        },
      }),
  },
};
