// Configuración de Supabase
const SUPABASE_URL = 'https://mrikmyjtsntyldadgzdy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_NVb4WypHphuj7E_1TnYWYw_W90jjm7Q';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const contenedor = document.getElementById('contenedor-productos');
const buscador = document.getElementById('product-search');
const filtrosMarca = document.getElementById('filtros-marca');
const sinResultados = document.getElementById('sin-resultados');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxNombre = document.getElementById('lightbox-nombre');
const lightboxPrecio = document.getElementById('lightbox-precio');
const lightboxCerrar = document.getElementById('lightbox-cerrar');

let marcaActiva = 'TODAS';

// Función para cargar productos desde la NUBE
async function cargarProductos() {
    try {
        const { data, error } = await _supabase
            .from('productos')
            .select('*')
            .order('marca', { ascending: true });

        if (error) throw error;

        mostrarProductos(data);
        armarFiltrosMarca(data);
    } catch (error) {
        console.error("Error cargando productos de Supabase:", error.message);
        contenedor.innerHTML = '<p class="sin-resultados">No pudimos cargar los productos. Probá recargar la página 🐾</p>';
    }
}

function armarFiltrosMarca(lista) {
    const marcas = [...new Set(lista.map(p => p.marca))].sort();
    filtrosMarca.innerHTML = '';

    const chipTodas = crearChip('TODAS', marcaActiva === 'TODAS');
    filtrosMarca.appendChild(chipTodas);

    marcas.forEach(marca => {
        filtrosMarca.appendChild(crearChip(marca, marcaActiva === marca));
    });
}

function crearChip(nombre, activo) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip-marca' + (activo ? ' chip-activo' : '');
    chip.textContent = nombre === 'TODAS' ? 'Todas' : nombre;
    chip.addEventListener('click', () => {
        marcaActiva = nombre;
        document.querySelectorAll('.chip-marca').forEach(c => c.classList.remove('chip-activo'));
        chip.classList.add('chip-activo');
        aplicarFiltros();
    });
    return chip;
}

function mostrarProductos(lista) {
    contenedor.innerHTML = '';

    if (!lista.length) {
        sinResultados.hidden = false;
        return;
    }
    sinResultados.hidden = true;

    const marcas = [...new Set(lista.map(p => p.marca))];

    marcas.forEach(marca => {
        const marcaContainer = document.createElement('div');
        marcaContainer.classList.add('marca-container');
        marcaContainer.setAttribute('data-marca', marca);

        const productosDeEstaMarca = lista.filter(p => p.marca === marca);

        const header = document.createElement('div');
        header.className = 'marca-header';

        const titulo = document.createElement('h3');
        titulo.className = 'marca-titulo';
        titulo.textContent = marca;

        const contador = document.createElement('span');
        contador.className = 'marca-contador';
        contador.textContent = `${productosDeEstaMarca.length} producto${productosDeEstaMarca.length !== 1 ? 's' : ''}`;

        header.appendChild(titulo);
        header.appendChild(contador);

        const gridDeMarca = document.createElement('div');
        gridDeMarca.classList.add('productos-grid');

        productosDeEstaMarca.forEach(p => {
            const card = document.createElement('div');
            card.classList.add('producto-card');
            card.setAttribute('data-name', `${p.marca} ${p.nombre} ${p.tags || ''}`);

            const esUnidad = p.unidad_venta === 'unidad';
            const precioPrincipal = esUnidad
                ? `$${Number(p.precio).toLocaleString('es-AR')}`
                : `$${Number(p.precio).toLocaleString('es-AR')} / kg`;

            card.innerHTML = `
    <div class="producto-foto">
        <img src="${p.imagen}" alt="${p.nombre}" loading="lazy" onerror="this.src='img/placeholder.png'">
    </div>
    <div class="producto-info">
        <span class="producto-nombre">${p.nombre}</span>
        <strong class="precio-kg">${precioPrincipal}</strong>
        ${(!esUnidad && p.precio_bolsa) ? `<span class="precio-bolsa">Bolsa ${Number(p.kilos_bolsa).toString().replace('.', ',')}kg &middot; $${Number(p.precio_bolsa).toLocaleString('es-AR')}</span>` : ''}
    </div>
`;
            const foto = card.querySelector('.producto-foto');
            foto.addEventListener('click', () => abrirLightbox(
                foto.querySelector('img').src,
                `${p.marca} - ${p.nombre}`,
                p.precio,
                p.precio_bolsa,
                p.kilos_bolsa,
                p.unidad_venta
            ));
            gridDeMarca.appendChild(card);
        });

        marcaContainer.appendChild(header);
        marcaContainer.appendChild(gridDeMarca);
        contenedor.appendChild(marcaContainer);
    });
}

// Filtrado combinado: texto de búsqueda + chip de marca seleccionado
function aplicarFiltros() {
    const term = buscador.value.toLowerCase().trim();
    const contenedoresDeMarca = document.querySelectorAll('.marca-container');
    let algunResultadoVisible = false;

    contenedoresDeMarca.forEach(cont => {
        const marca = cont.getAttribute('data-marca');
        const coincideMarca = marcaActiva === 'TODAS' || marca === marcaActiva;

        const cards = cont.querySelectorAll('.producto-card');
        let tieneProductosVisibles = false;

        cards.forEach(card => {
            const info = card.getAttribute('data-name').toLowerCase();
            const coincideTexto = info.includes(term);
            const visible = coincideMarca && coincideTexto;
            card.style.display = visible ? '' : 'none';
            if (visible) tieneProductosVisibles = true;
        });

        cont.style.display = tieneProductosVisibles ? '' : 'none';
        if (tieneProductosVisibles) algunResultadoVisible = true;
    });

    sinResultados.hidden = algunResultadoVisible;
}

buscador.addEventListener('input', aplicarFiltros);

// --- Lightbox (ver imagen más grande) ---
function abrirLightbox(src, nombre, precio, precioBolsa, kilosBolsa, unidadVenta) {
    lightboxImg.src = src;
    lightboxImg.alt = nombre;
    lightboxNombre.textContent = nombre;

    let precioTexto;
    if (unidadVenta === 'unidad') {
        precioTexto = `$${Number(precio).toLocaleString('es-AR')}`;
    } else {
        precioTexto = `$${Number(precio).toLocaleString('es-AR')} / kg`;
        if (precioBolsa) {
            precioTexto += ` &middot; Bolsa ${Number(kilosBolsa).toString().replace('.', ',')}kg: $${Number(precioBolsa).toLocaleString('es-AR')}`;
        }
    }
    lightboxPrecio.innerHTML = precioTexto;

    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
}

function cerrarLightbox() {
    lightbox.hidden = true;
    document.body.style.overflow = '';
}

lightboxCerrar.addEventListener('click', cerrarLightbox);
lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) cerrarLightbox();
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !lightbox.hidden) cerrarLightbox();
});

// Arrancamos la carga al abrir la página
cargarProductos();