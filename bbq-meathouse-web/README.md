# BBQ Meathouse — versión Next.js

Sitio de pedidos para BBQ Meathouse (Next.js 14, App Router + React + Supabase),
migrado y rebautizado a partir de la plantilla "El Extraño José".

## Requisitos
- Node.js 18.18+ (usa `node -v` para revisar)
- Una cuenta de Supabase (gratis)

## 1. Instalar dependencias
```bash
npm install
```

## 2. Conectar tu propio proyecto de Supabase
1. Crea un proyecto nuevo en https://supabase.com
2. Ve a **SQL Editor → New query**, pega **todo** el contenido de `supabase-setup.sql` y dale **Run**.
   Es un solo archivo, completo: crea las 19 tablas que usa la página, sus reglas de seguridad
   (RLS), las 3 funciones que usa el carrito (gift cards y Early Bird) y el bucket de fotos.
   Puedes correrlo más de una vez sin miedo — está hecho para no fallar si ya existe algo.
3. Copia `.env.local.example` a `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```
4. Abre `.env.local` y pon tu **Project URL** y **anon public key**
   (Supabase → Project Settings → API).
5. **Crea tu cuenta de dueño**: entra a la página, dale "Regístrate" y crea una cuenta normal
   (queda como "cliente"). Luego, en Supabase → **Table Editor → profiles**, busca tu fila
   (por tu correo, lo confirmas en Authentication → Users) y cambia la columna `role` de
   `cliente` a `staff`. Vuelve a entrar con esa cuenta: ya tienes el panel de dueño completo.

## 3. Correr en desarrollo
```bash
npm run dev
```
Abre http://localhost:3000

## 4. Publicar
```bash
npm run build
npm start
```
O despliega directo en **Vercel**: conecta el repo, define las mismas variables de entorno
(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) en el panel de Vercel, y listo —
cada push se publica solo.

## Marca
- **Nombre**: BBQ Meathouse
- **Logo**: `public/logo.png` (también usado como ícono/favicon en `app/icon.png` y como
  marca de agua en tarjetas, `public/logo-white.png`). Si quieres cambiarlo, reemplaza esos
  tres archivos por los tuyos (mismo nombre, formato PNG con fondo transparente).
- **Colores**: definidos como variables CSS en `app/globals.css` (`--amber` es el rojo de marca,
  `--amber-deep` su tono oscuro). Cambialos ahí si ajustas la paleta.

## Qué incluye
- Roles **Cliente** / **Comensal** (solo ve Órdenes) / **Staff** (dueño, panel completo).
- Menú con categorías dinámicas (Ahumados, Parrilla, Guarniciones, Bebidas) — el dueño puede
  crear, renombrar, cambiar ícono/color o borrar categorías desde Inicio o Menú.
- Carrito con pickup o para comer en el local, selección de mesa, propina/impuestos configurables
  por sucursal, y pago con efectivo, tarjeta (se cobra en persona) o balance de gift card.
- Gift cards: comprar, regalar por correo y canjear por código, con balance real por cuenta.
- Promoción "Early Bird" configurable por sucursal y horario (bebida gratis al primero del día).
- Favoritos reales ligados a la cuenta, avatares elegibles, fotos del sitio y banners de oferta
  editables por el dueño, y estadísticas de ventas en `/estadisticas`.
- Multi-sucursal: cambia de sucursal desde "Cuenta" (`context/BranchContext.jsx` tiene los nombres
  y colores de cada una — edítalo si tus sucursales se llaman distinto).

## Estructura
```
app/
  layout.js              → shell global (fuentes, header, tabbar, providers)
  page.js                → Inicio
  menu/page.js            → Menú
  nosotros/page.js         → Nosotros
  visitanos/page.js         → Visítanos
  cuenta/page.js              → Cuenta (cliente / comensal / dueño)
  ordenes/page.js               → Panel de pedidos y gift cards (staff/comensal)
  estadisticas/page.js            → Estadísticas de ventas (staff)
  globals.css                       → todo el diseño (variables de color, tipografía, layout)
components/                          → Header, Tabbar, modales, carruseles, managers de admin, etc.
context/                             → Auth, Carrito, Sucursal, Favoritos, Toasts, etc.
hooks/                                → useMenuItems, useCategories, useUploader, etc.
lib/                                   → supabaseClient.js, upload.js
supabase-setup.sql                      → esquema completo de la base de datos (19 tablas + RLS + RPC)
```

## Notas
- Las carpetas/archivos sueltos en la raíz (`index.html`, `menu.html`, `nosotros.html`,
  `visitanos.html`, `css/`, `js/`) son restos de una versión anterior en HTML/CSS/JS puro,
  previa a la migración a Next.js. **No los usa la app** (Next.js sirve todo desde `app/`) —
  puedes borrarlos con confianza si quieres limpiar el repo.
- La subida de fotos de producto exige un PNG cuadrado con el fondo ya transparente (para que
  floten bien sobre la tarjeta). Las fotos del sitio y banners aceptan foto o video panorámico 16:9.
