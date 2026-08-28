# 🐾 Pipon Pet Shop

Sitio web para un pet shop familiar, con catálogo de productos en tiempo real y un panel de administración protegido para cargar y editar el stock.

**🔗 Demo:** [pipon-pet-shop.vercel.app](https://pipon-pet-shop.vercel.app) <!-- reemplazar por la URL real -->

## ✨ Funcionalidades

- **Catálogo público** (`index.html`) con productos agrupados por marca, filtrado por chips de marca y buscador por palabras clave (sin importar orden ni acentos).
- **Productos por Kg o por Unidad** (alimento a granel vs. pouches/latas), cada uno con su propio formato de precio.
- **Vista ampliada de producto** (lightbox) con foto, nombre y precio al detalle.
- **Carrito de consulta**: el cliente arma una lista de productos de interés y la envía directo por WhatsApp con un mensaje pre-armado, sin necesidad de checkout ni pasarela de pago.
- **Panel de administración** (`admin.html`) protegido con login: alta, edición y baja de productos y marcas.
- **Seguridad a nivel de base de datos**: Row Level Security (RLS) en Supabase — cualquiera puede leer el catálogo, pero solo usuarios autenticados pueden escribir. La seguridad no depende de ocultar la clave del cliente, sino de estas políticas.
- Diseño responsive, pensado mobile-first (la mayoría de las visitas son desde celular).

## 🛠️ Stack

- **Frontend:** HTML, CSS y JavaScript vanilla (sin frameworks ni build step).
- **Backend / Base de datos:** [Supabase](https://supabase.com) (Postgres + Auth + API autogenerada).
- **Hosting:** [Vercel](https://vercel.com) (deploy automático en cada push a `main`).

## 📂 Estructura

```
FRONTEND/
├── index.html      # Catálogo público
├── admin.html       # Panel de administración (requiere login)
├── script.js         # Lógica del catálogo, filtros, carrito y WhatsApp
├── style.css          # Estilos de todo el sitio
└── img/                 # Imágenes propias del local
```

## ⚙️ Configuración del backend (Supabase)

El esquema principal vive en dos tablas: `productos` y `marcas`.

Columnas relevantes de `productos`: `marca`, `nombre`, `precio`, `precio_bolsa`, `kilos_bolsa` (numeric, admite decimales), `unidad_venta` (`'kg'` o `'unidad'`), `tags`, `imagen`.

**Políticas RLS aplicadas:**

```sql
alter table productos enable row level security;
alter table marcas enable row level security;

create policy "lectura publica productos" on productos
  for select using (true);

create policy "lectura publica marcas" on marcas
  for select using (true);

create policy "solo admins escriben productos" on productos
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "solo admins escriben marcas" on marcas
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
```

Los usuarios administradores se crean manualmente desde **Authentication → Users** en el dashboard de Supabase (no hay registro público).

## 🚀 Deploy

Proyecto 100% estático, sin build step. En Vercel:

1. Importar el repo.
2. **Root Directory:** `FRONTEND`.
3. **Framework Preset:** Other.
4. Deploy — cada push a `main` se publica solo.

## 🔑 Nota sobre las claves

La clave de Supabase usada en el frontend es la **`anon`/`publishable key`**, pensada para ser pública y visible en el cliente. La protección real de escritura está a cargo de las políticas RLS de arriba, no de ocultar esta clave.