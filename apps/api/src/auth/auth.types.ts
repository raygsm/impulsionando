export type AuthUser = {
  id: string;
  email: string | null;
};

export type AuthedRequest = {
  user?: AuthUser;
  accessToken?: string;
};
