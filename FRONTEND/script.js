document.addEventListener('keyup', e => {
    // 1. Verificamos si el evento viene del buscador
    if (e.target.matches('#product-search')) {
        
        // 2. Obtenemos lo que escribió el usuario y lo pasamos a minúsculas
        const term = e.target.value.toLowerCase();

        // 3. Buscamos todas las tarjetas de productos
        document.querySelectorAll('.producto-card').forEach(producto => {
            
            // 4. Leemos el "data-name" que pusimos en el HTML
            const nombreProducto = producto.getAttribute('data-name').toLowerCase();

            // 5. Si el nombre incluye lo que el usuario escribió, se muestra. Si no, se oculta.
            if (nombreProducto.includes(term)) {
                producto.style.display = "block";
                producto.style.opacity = "1";
            } else {
                producto.style.display = "none";
                producto.style.opacity = "0";
            }
        });
    }
});