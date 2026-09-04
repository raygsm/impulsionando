# `@impulsionando/auth`

HttpOnly-cookie compatible session helpers via `@supabase/ssr`.

- No service-role key
- No authorization from user-editable metadata
- Host apps pass a cookie adapter (Next `cookies()`)
- Access token is forwarded to Nest as `Authorization: Bearer`
