/*
  Configuración de Supabase
  --------------------------------
  1. Crea un proyecto gratis en https://supabase.com
  2. Ve a Project Settings → API y copia:
     - "Project URL"      → pégalo en SUPABASE_URL
     - "anon public key"  → pégalo en SUPABASE_ANON_KEY
  3. Corre el archivo supabase-setup.sql en el SQL Editor de tu proyecto
     (crea las tablas profiles, menu_items, site_images y sus políticas).
  4. Sube este sitio a un hosting real (Netlify, Vercel, GitHub Pages, etc.)
     Los links de confirmación de correo de Supabase necesitan una URL pública,
     no funcionan abriendo el archivo directamente desde tu computadora.
*/

const SUPABASE_URL = 'https://TU-PROYECTO.supabase.co';
const SUPABASE_ANON_KEY = 'TU-ANON-KEY-AQUI';

window.sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

window.BARRO_CONFIGURED = SUPABASE_URL.indexOf('TU-PROYECTO') === -1;
