import { createBrowserClient } from '@supabase/ssr';

// Placeholders válidos para que `next build` no falle cuando aún no hay
// .env.local (por ejemplo en CI). En runtime, sin credenciales reales, las
// llamadas a Supabase fallarán de forma controlada (mensajes de error
// visibles en las pantallas), nunca de forma silenciosa.
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co').trim();
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key').trim();

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
