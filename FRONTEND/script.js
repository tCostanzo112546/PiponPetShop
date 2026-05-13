// Configuración de Supabase
const SUPABASE_URL = 'https://mrikmyjtsntyldadgzdy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_NVb4WypHphuj7E_1TnYWYw_W90jjm7Q';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const contenedor = document.getElementById('contenedor-productos');
const buscador = document.getElementById('product-search');

// Función para cargar productos desde la NUBE
async function cargarProductos() {
    try {
        // Pedimos los datos a la tabla 'productos' de Supabase
        const { data, error } = await _supabase
            .from('productos')
            .select('*')
            .order('marca', { ascending: true }); // Los trae ordenados por marca

        if (error) throw error;

        mostrarProductos(data);
    } catch (error) {
        console.error("Error cargando productos de Supabase:", error.message);
    }
}


function mostrarProductos(lista) {
    contenedor.innerHTML = ''; // Limpiamos el contenedor principal

    // 1. Obtenemos las marcas únicas
    const marcas = [...new Set(lista.map(p => p.marca))];

    // 2. Creamos una sección por cada marca
    marcas.forEach(marca => {
        // Creamos el contenedor de la marca (Este ocupará todo el ancho)
        const marcaContainer = document.createElement('div');
        marcaContainer.classList.add('marca-container');

        // Creamos el título de la marca
        const titulo = document.createElement('h3');
        titulo.className = (marca === "PRO PLAN") ? "marca-titulo-round" : "marca-titulo";
        titulo.textContent = marca;

        // Creamos una NUEVA grilla solo para los productos de esta marca
        const gridDeMarca = document.createElement('div');
        gridDeMarca.classList.add('productos-grid');

        // 3. Filtramos y agregamos los productos a ESTA grilla
        const productosDeEstaMarca = lista.filter(p => p.marca === marca);

        productosDeEstaMarca.forEach(p => {
            const card = document.createElement('div');
            card.classList.add('producto-card');
            card.setAttribute('data-name', `${p.marca} ${p.nombre} ${p.tags}`);

            card.innerHTML = `
                <div class="producto-foto">
                    <img src="${p.imagen}" alt="${p.nombre}" onerror="this.src='img/placeholder.png'">
                </div>
                <p class="producto-info">
                    ${p.nombre}<br>
                    <strong>$${p.precio}/kg</strong>
                </p>
            `;
            gridDeMarca.appendChild(card);
        });

        // 4. Metemos el título y la grilla dentro del contenedor de la marca
        marcaContainer.appendChild(titulo);
        marcaContainer.appendChild(gridDeMarca);

        // 5. Metemos el contenedor de la marca en el contenedor principal de la página
        contenedor.appendChild(marcaContainer);
    });
}

// Lógica del Buscador (Filtrado en tiempo real inteligente)
buscador.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();

    // 1. Agarramos todos los contenedores de las marcas
    const contenedoresDeMarca = document.querySelectorAll('.marca-container');

    contenedoresDeMarca.forEach(contenedor => {
        // 2. Buscamos las tarjetas SOLO dentro de esta marca
        const cards = contenedor.querySelectorAll('.producto-card');
        let tieneProductosVisibles = false;

        // 3. Filtramos las tarjetas como antes
        cards.forEach(card => {
            const info = card.getAttribute('data-name').toLowerCase();

            if (info.includes(term)) {
                card.style.display = "block";
                tieneProductosVisibles = true; // ¡Encontramos al menos uno!
            } else {
                card.style.display = "none";
            }
        });

        // 4. Si la marca tiene al menos un producto visible, la mostramos. Si no, la escondemos.
        if (tieneProductosVisibles) {
            contenedor.style.display = "block";
        } else {
            contenedor.style.display = "none";
        }


    });
}

);

// Arrancamos la carga al abrir la página
cargarProductos();