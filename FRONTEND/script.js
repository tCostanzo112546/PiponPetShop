// Configuración de Supabase
const SUPABASE_URL = 'https://mrikmyjtsntyldadgzdy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_NVb4WypHphuj7E_1TnYWYw_W90jjm7Q';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Número de WhatsApp del local (código de país + área, sin + ni espacios)
const WHATSAPP_NUMERO = '5491145400941';

const contenedor = document.getElementById('contenedor-productos');
const buscador = document.getElementById('product-search');
const btnLimpiarBusqueda = document.getElementById('btn-limpiar-busqueda');

const btnMenu = document.getElementById('mobile-menu');
const menuLateral = document.getElementById('menu-lateral');
const cerrarMenuLateral = document.getElementById('cerrar-menu-lateral');
const cerrarMenuOverlay = document.getElementById('cerrar-menu-overlay');
const filtrosMarca = document.getElementById('filtros-marca');
const sinResultados = document.getElementById('sin-resultados');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxNombre = document.getElementById('lightbox-nombre');
const lightboxPrecio = document.getElementById('lightbox-precio');
const lightboxCerrar = document.getElementById('lightbox-cerrar');
const lightboxAgregar = document.getElementById('lightbox-agregar');

const btnCarrito = document.getElementById('btn-carrito');
const carritoContador = document.getElementById('carrito-contador');
const panelCarrito = document.getElementById('panel-carrito');
const cerrarPanelCarrito = document.getElementById('cerrar-panel-carrito');
const cerrarPanelOverlay = document.getElementById('cerrar-panel-overlay');
const listaCarrito = document.getElementById('lista-carrito');
const btnEnviarWhatsapp = document.getElementById('btn-enviar-whatsapp');

let marcaActiva = 'TODAS';
let productoEnLightbox = null;

// ---------- Función para cargar productos desde la NUBE ----------
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
        <button type="button" class="btn-agregar-carrito">Agregar</button>
    </div>
`;
            const foto = card.querySelector('.producto-foto');
            foto.addEventListener('click', () => abrirLightbox(p));

            const btnAgregar = card.querySelector('.btn-agregar-carrito');
            btnAgregar.addEventListener('click', (e) => {
                e.stopPropagation();
                agregarAlCarrito(p);
                btnAgregar.textContent = 'Agregado ✓';
                setTimeout(() => { btnAgregar.textContent = 'Agregar'; }, 1200);
            });

            gridDeMarca.appendChild(card);
        });

        marcaContainer.appendChild(header);
        marcaContainer.appendChild(gridDeMarca);
        contenedor.appendChild(marcaContainer);
    });
}

// ---------- Búsqueda por palabras (sin importar el orden) ----------
function normalizar(texto) {
    return texto
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, ''); // saca acentos
}

function aplicarFiltros() {
    btnLimpiarBusqueda.hidden = buscador.value.length === 0;

    const palabras = normalizar(buscador.value).trim().split(/\s+/).filter(Boolean);
    const contenedoresDeMarca = document.querySelectorAll('.marca-container');
    let algunResultadoVisible = false;

    contenedoresDeMarca.forEach(cont => {
        const marca = cont.getAttribute('data-marca');
        const coincideMarca = marcaActiva === 'TODAS' || marca === marcaActiva;

        const cards = cont.querySelectorAll('.producto-card');
        let tieneProductosVisibles = false;

        cards.forEach(card => {
            const info = normalizar(card.getAttribute('data-name'));
            const coincideTexto = palabras.every(palabra => info.includes(palabra));
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

btnLimpiarBusqueda.addEventListener('click', () => {
    buscador.value = '';
    aplicarFiltros();
    buscador.focus();
});

// ---------- Menú lateral ----------
function abrirMenu() {
    menuLateral.hidden = false;
    document.body.style.overflow = 'hidden';
}

function cerrarMenu() {
    menuLateral.hidden = true;
    document.body.style.overflow = '';
}

btnMenu.addEventListener('click', abrirMenu);
cerrarMenuLateral.addEventListener('click', cerrarMenu);
cerrarMenuOverlay.addEventListener('click', cerrarMenu);
document.querySelectorAll('.menu-lateral-link').forEach(link => {
    link.addEventListener('click', cerrarMenu);
});

// ---------- Lightbox (ver imagen más grande) ----------
function abrirLightbox(p) {
    productoEnLightbox = p;
    lightboxImg.src = p.imagen;
    lightboxImg.alt = p.nombre;
    lightboxNombre.textContent = `${p.marca} - ${p.nombre}`;

    const esUnidad = p.unidad_venta === 'unidad';
    let precioTexto;
    if (esUnidad) {
        precioTexto = `$${Number(p.precio).toLocaleString('es-AR')}`;
    } else {
        precioTexto = `$${Number(p.precio).toLocaleString('es-AR')} / kg`;
        if (p.precio_bolsa) {
            precioTexto += ` &middot; Bolsa ${Number(p.kilos_bolsa).toString().replace('.', ',')}kg: $${Number(p.precio_bolsa).toLocaleString('es-AR')}`;
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
    if (e.key === 'Escape') {
        if (!lightbox.hidden) cerrarLightbox();
        if (!panelCarrito.hidden) cerrarCarrito();
        if (!menuLateral.hidden) cerrarMenu();
    }
});

lightboxAgregar.addEventListener('click', () => {
    if (!productoEnLightbox) return;
    agregarAlCarrito(productoEnLightbox);
    lightboxAgregar.textContent = 'Agregado ✓';
    setTimeout(() => { lightboxAgregar.textContent = 'Agregar al carrito'; }, 1200);
});

// ---------- Carrito ----------
let carrito = JSON.parse(localStorage.getItem('pipon-carrito') || '[]');

function guardarCarrito() {
    localStorage.setItem('pipon-carrito', JSON.stringify(carrito));
}

function agregarAlCarrito(p) {
    const existente = carrito.find(item => item.id === p.id);
    if (existente) {
        existente.cantidad += 1;
    } else {
        carrito.push({
            id: p.id,
            marca: p.marca,
            nombre: p.nombre,
            unidad_venta: p.unidad_venta,
            cantidad: 1
        });
    }
    guardarCarrito();
    actualizarContadorCarrito();
    renderizarCarrito();
}

function quitarDelCarrito(id) {
    carrito = carrito.filter(item => item.id !== id);
    guardarCarrito();
    actualizarContadorCarrito();
    renderizarCarrito();
}

function cambiarCantidad(id, delta) {
    const item = carrito.find(i => i.id === id);
    if (!item) return;
    item.cantidad += delta;
    if (item.cantidad <= 0) {
        quitarDelCarrito(id);
        return;
    }
    guardarCarrito();
    actualizarContadorCarrito();
    renderizarCarrito();
}

function actualizarContadorCarrito() {
    const totalItems = carrito.reduce((acc, item) => acc + item.cantidad, 0);
    if (totalItems > 0) {
        carritoContador.textContent = totalItems;
        carritoContador.hidden = false;
    } else {
        carritoContador.hidden = true;
    }
}

function renderizarCarrito() {
    if (!carrito.length) {
        listaCarrito.innerHTML = '<p class="carrito-vacio">Todavía no agregaste productos.</p>';
        btnEnviarWhatsapp.hidden = true;
        return;
    }

    btnEnviarWhatsapp.hidden = false;
    listaCarrito.innerHTML = '';

    carrito.forEach(item => {
        const fila = document.createElement('div');
        fila.className = 'fila-carrito';
        fila.innerHTML = `
            <div class="fila-carrito-info">
                <strong>${item.marca}</strong>
                <span>${item.nombre}</span>
            </div>
            <div class="fila-carrito-controles">
                <button type="button" class="btn-cantidad" data-accion="restar">−</button>
                <span class="fila-carrito-cantidad">${item.cantidad}</span>
                <button type="button" class="btn-cantidad" data-accion="sumar">+</button>
                <button type="button" class="btn-quitar" aria-label="Quitar">🗑</button>
            </div>
        `;
        fila.querySelector('[data-accion="restar"]').addEventListener('click', () => cambiarCantidad(item.id, -1));
        fila.querySelector('[data-accion="sumar"]').addEventListener('click', () => cambiarCantidad(item.id, 1));
        fila.querySelector('.btn-quitar').addEventListener('click', () => quitarDelCarrito(item.id));
        listaCarrito.appendChild(fila);
    });
}

function abrirCarrito() {
    panelCarrito.hidden = false;
    document.body.style.overflow = 'hidden';
}

function cerrarCarrito() {
    panelCarrito.hidden = true;
    document.body.style.overflow = '';
}

btnCarrito.addEventListener('click', abrirCarrito);
cerrarPanelCarrito.addEventListener('click', cerrarCarrito);
cerrarPanelOverlay.addEventListener('click', cerrarCarrito);

btnEnviarWhatsapp.addEventListener('click', () => {
    if (!carrito.length) return;

    let mensaje = 'Hola! Estoy interesado/a en estos productos:%0A%0A';
    carrito.forEach(item => {
        const unidad = item.unidad_venta === 'unidad' ? 'un.' : 'kg';
        mensaje += `- ${item.marca} ${item.nombre} (x${item.cantidad} ${unidad})%0A`;
    });
    mensaje += '%0A¿Me pasan disponibilidad y precio final?';

    const url = `https://wa.me/${WHATSAPP_NUMERO}?text=${mensaje}`;
    window.open(url, '_blank');
});

// Arrancamos: cargar productos y reflejar carrito guardado
actualizarContadorCarrito();
renderizarCarrito();
cargarProductos();