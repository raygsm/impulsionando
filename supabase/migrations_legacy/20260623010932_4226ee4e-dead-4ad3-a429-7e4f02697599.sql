-- Reset temporário de senha do admin master raygs@hotmail.com
-- Senha temporária: Impulsionando@2026
UPDATE auth.users
SET encrypted_password = crypt('Impulsionando@2026', gen_salt('bf')),
    updated_at = now()
WHERE email = 'raygs@hotmail.com';