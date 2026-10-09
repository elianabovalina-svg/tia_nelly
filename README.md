# Gastos de Tía Nelly

Página web (GitHub Pages) para que Eliana, Leonel, Marta y Miguel registren los gastos del cuidado de la tía Nelly. Los datos se guardan en una planilla de Google Sheets.

## Qué incluye

- `index.html`, `styles.css`, `app.js`, `config.js`: la página (se sube a GitHub).
- `Code.gs`: el script de Google que lee y escribe en la planilla (se pega en Apps Script, no hace falta subirlo a GitHub).

## Cómo funciona

- Cualquiera que abra la página puede registrar un gasto: fecha, monto total, descripción y quién lo hizo (Eliana, Leonel, Marta, Miguel u Otro). La lista de personas es cerrada y también se valida en el script.
- Arriba, siempre visible, está el **total gastado hasta la fecha** (suma de todos los gastos, sin filtros).
- Se muestran los últimos 20 gastos, con el botón **Ver todos**.
- Se puede buscar por descripción, por rango de fechas y por persona (con subtotal de lo encontrado).

## Puesta en marcha

### 1. Crear el script en Google (una sola vez)

1. Abrí la planilla: https://docs.google.com/spreadsheets/d/1rKs6IXw1MgLhrL-YJ3yg5fv6lYBrpkbc1VTvt8a1tf8/edit
2. Menú **Extensiones → Apps Script**.
3. Borrá lo que haya y pegá todo el contenido de `Code.gs`. Guardá.
4. Botón **Implementar → Nueva implementación**. Tipo: **Aplicación web**.
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier persona**
5. **Implementar** y aceptá los permisos (Google avisa que la app no está verificada: *Configuración avanzada → Ir a ... (no seguro)*; es tu propio script).
6. Copiá la **URL de la aplicación web** (termina en `/exec`).

El script crea solo la hoja **Gastos** con sus encabezados la primera vez que se usa.

### 2. Configurar la página

Abrí `config.js` y reemplazá `PEGAR_AQUI_LA_URL_DE_APPS_SCRIPT` por la URL que copiaste.

### 3. Publicar en GitHub Pages

1. Creá un repositorio nuevo en GitHub (por ejemplo `gastos-nelly`).
2. Subí `index.html`, `styles.css`, `app.js`, `config.js` y `README.md` (**Add file → Upload files**).
3. En el repositorio: **Settings → Pages → Build and deployment**: Source **Deploy from a branch**, rama `main`, carpeta `/ (root)`. Guardá.
4. Al cabo de un minuto la página queda en `https://TU-USUARIO.github.io/gastos-nelly/`. Compartí ese link con la familia.

## Si cambiás `Code.gs`

Hay que publicar una nueva versión: **Implementar → Administrar implementaciones → editar (lápiz) → Versión: Nueva versión → Implementar**. La URL no cambia.

## Notas

- La URL de Apps Script y la de la página son públicas: quien tenga el link puede registrar gastos. Para borrar o corregir un gasto, editá la planilla directamente.
- Los datos viven en la planilla; la página siempre lee de ahí, así que no se pierde nada si cambiás el sitio.
