import { createClient } from '@supabase/supabase-js'
const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(url, key)
const { data: ups, error: e1 } = await supabase
  .from('user_profiles')
  .select('user_id, profile_id, company_id, profile_permissions:profile_id(permission_id, permissions:permission_id(code))')
  .limit(2)
console.log('err', e1)
console.log(JSON.stringify(ups, null, 2).slice(0, 3000))
