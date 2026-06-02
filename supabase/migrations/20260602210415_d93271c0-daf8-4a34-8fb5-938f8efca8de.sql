-- Backfill profiles and user_roles for any auth.users that don't have them yet
INSERT INTO public.profiles (user_id, full_name, date_of_birth, interest_area, bio, username)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', ''),
  NULLIF(u.raw_user_meta_data->>'date_of_birth', '')::date,
  COALESCE(u.raw_user_meta_data->>'interest_area', ''),
  COALESCE(u.raw_user_meta_data->>'bio', ''),
  NULLIF(u.raw_user_meta_data->>'username', '')
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE p.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'user'::app_role
FROM auth.users u
LEFT JOIN public.user_roles r ON r.user_id = u.id
WHERE r.user_id IS NULL
ON CONFLICT (user_id, role) DO NOTHING;