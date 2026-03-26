describe('Módulo: Gestión de Visitas - Registro, Editar y Finalizar', () => {

  // --- DATOS DINÁMICOS ---
  const idUnico = Date.now().toString().slice(-6);

  const documentoDinamico = `10${idUnico}${Math.floor(Math.random() * 9)}`;
  function generarLetrasAleatorias(longitud) {
    const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    let resultado = "";
    for (let i = 0; i < longitud; i++) {
      const indice = Math.floor(Math.random() * letras.length);
      resultado += letras[indice];
    }
    return resultado;
  }

  // Nombre aleatorio solo con letras
  const nombreDinamico = `Visitante_${generarLetrasAleatorias(9)}`;

  const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const placaLetras = Array.from({ length: 3 }, () => letras.charAt(Math.floor(Math.random() * letras.length))).join('');
  const placaNumeros = Math.floor(100 + Math.random() * 900);
  const placaAleatoria = `${placaLetras}${placaNumeros}`;

  const ahora = new Date();
  const fechaHoy = ahora.toISOString().slice(0, 16); 

  it('Debe completar el flujo sin saltarse la edición', () => {
    cy.visit('http://localhost:5173');
    
    // --- LOGIN ---
    cy.get('#root button.ld-btn-login').click();
    cy.get('#root input[placeholder="Ingresa tu usuario"]').type('josue2023');
    cy.get('#root input[placeholder="••••••••"]').type('3117325j');
    cy.get('#root button.lgn-btn-submit').click();
    cy.wait(2000);

    // --- IR A VISITAS ---
    cy.get('#root div.sa-modules-grid a[href="/visitas"]').click();
    cy.wait(1000);
;
cy.get('#root input.form-control').click();
cy.get('#root tr:nth-child(9) td:nth-child(1)').click();
cy.get('#root input.form-control').click();
   cy.wait(1000);
cy.get('#root input.form-control').type('Josue Montiel');
cy.get('#root div.vis-toolbar').click();
cy.get('#root input.form-control').clear();
   cy.wait(1000);
   
cy.get('#root div:nth-child(1) > select.form-select').select('B');
cy.get('#root div:nth-child(2) > select.form-select').select('202');
   cy.wait(1000);
cy.get('#root button.vis-btn-parking i.bi').click();
cy.get('#root i.bi-arrow-left').click();
   cy.wait(1000);
    // --- REGISTRAR ---
    cy.get('#root button.vis-btn-registrar').click();
    cy.wait(1000);
    cy.get('select.vis-form-control').eq(0).select('1', { force: true });
    cy.get('#root input[placeholder="Ej: 12345678"]').type(documentoDinamico);
    cy.get('#root input[placeholder*="Juan Carlos"]').type(nombreDinamico);
    cy.get('#vis-telefono').click();
cy.get('#vis-telefono').clear();
cy.get('#vis-telefono').type('3120123256');
    cy.get('select.vis-form-control').eq(1).select('1', { force: true });
    cy.get('select.vis-form-control').eq(2).select('2', { force: true });
   
    
    // Vehículo SI
    cy.get('select.vis-form-control').eq(3).select('SI', { force: true });
    cy.get('input[placeholder="Ej: ABC123"]', { timeout: 6000 }).should('be.visible').type(placaAleatoria);
    cy.get('select.vis-form-control').eq(4).select('1', { force: true });
    cy.wait(1000); 

    // Parqueadero aleatorio (máximo los 10 primeros)
    cy.get('select.vis-form-control').last().then(($select) => {
      const options = $select.find('option').toArray().map(o => o.value).filter(v => v !== "" && v !== "--");
      const randomChoice = options.slice(0, 10)[Math.floor(Math.random() * Math.min(options.length, 10))];
      cy.get('select.vis-form-control').last().select(randomChoice, { force: true });
    });

    cy.get('#root textarea.vis-form-control').type('Registro Automático');
    cy.get('#root button.green').click();
    
    // ESPERA CLAVE: Esperamos que el modal de registro desaparezca y la tabla cargue
    cy.wait(3500); 

    // --- ACCIONES EN TABLA (USANDO LA PRIMERA FILA DISPONIBLE) ---
    
    // 1. VER INFORMACIÓN
    // Usamos 'first()' para que si hay dos botones .info, solo use el de la tabla
    cy.get('table tbody tr').first().find('button.info').click({ force: true });
    cy.wait(2000);

    // FIX: Usamos el selector de tu código original que sí funcionaba para cerrar
    cy.get('#root i.bi-x-lg').click();
    
    // ESPERA DE SEGURIDAD: Dejamos que el DOM se estabilice tras cerrar el modal
    cy.wait(2000);

    // 2. EDITAR (AQUÍ ES DONDE FALLABA)
    // Volvemos a buscar la fila para asegurarnos de que no sea un elemento "stale" (viejo)
    cy.get('table tbody tr').first().find('button.edit').should('be.visible').click({ force: true });
    cy.wait(1500);
    
    // Limpiamos y editamos el nombre
    cy.get('input[placeholder*="Juan Carlos"]').should('be.visible').clear().type(`${nombreDinamico} Editado`, { delay: 50 });
    
    // Clic en el botón naranja de guardar cambios
    cy.get('button.orange').click({ force: true });
    cy.wait(2500); 

    // 3. FINALIZAR
    cy.get('table tbody tr').first().find('button.finalizar').should('be.visible').click({ force: true });
    cy.wait(1000);
    cy.get('button.swal2-confirm').click(); // Confirmación de SweetAlert
    cy.wait(2000);

    // --- CERRAR SESIÓN ---
   cy.get('#root i.bi-list').click();
cy.get('#root button.vis-logout-btn').click();
  });
});