describe('Módulo: Gestión de Paquetería - Ritmo Humano', () => {
  // --- GENERADORES DE DATOS ---
  const idUnico = Date.now().toString().slice(-6); 

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
  const nombreDinamico = `Visitante${generarLetrasAleatorias(9)}`;
  const transportadora = `Express${generarLetrasAleatorias(8)}`;
  
  const ahora = new Date();
  const fechaHoy = ahora.toISOString().slice(0, 16); 

  it('Ejecuta el flujo a velocidad moderada para supervisión', () => {
    // Aumentamos el tiempo de espera de carga inicial
    cy.visit('http://localhost:5173');
    cy.wait(1500); 
    
    // --- LOGIN (Escritura más lenta) ---
    cy.get('#root button.ld-btn-login').click();
    cy.wait(800);
    cy.get('#root input[placeholder="Ingresa tu usuario"]').type('josue2023', { delay: 100 });
    cy.get('#root input[placeholder="••••••••"]').type('3117325j', { delay: 100 });
    cy.get('#root button.lgn-btn-submit').click();
    cy.wait(2000); // Pausa para ver el Dashboard

    // --- ENTRAR AL MÓDULO ---
    cy.get('#root div.sa-modules-grid a[href="/Paqueteria"]').click();
    cy.wait(1000);

cy.get('#root input.form-control').click();
cy.get('#root input.form-control').type('Josue Montiel');
cy.get('#root input.form-control').clear();
cy.wait(1000);
cy.get('#root div:nth-child(1) > select.form-select').select('B');
cy.get('#root div:nth-child(2) > select.form-select').select('202');
 cy.wait(1000);
    // --- REGISTRAR NUEVO PAQUETE ---
    cy.get('#root button.paq-btn-registrar').click();
    cy.wait(800); // Esperar que abra el modal
    cy.get('#root input[placeholder="Nombre completo"]').type(nombreDinamico, { delay: 80 });
    cy.get('#root div:nth-child(1) > select.paq-form-control').select('B');
    cy.get('#root div:nth-child(2) > select.paq-form-control').select('202');
    cy.get('#root input[placeholder="Ej: Servientrega, Inter Rapidísimo..."]').type(transportadora, { delay: 80 });
    
    cy.get('#root input[type="datetime-local"]').first().type(fechaHoy);
    cy.wait(500);
    
    cy.get('#root textarea.paq-form-control').type('Observación lenta para supervisión', { delay: 50 });
    cy.wait(1000);
    cy.get('#root button.blue').click();
    
    // Espera para ver el registro en la tabla
    cy.wait(2500);

    // --- INTERACTUAR CON EL REGISTRO ---
    // Ver información
    cy.get('#root tr').eq(1).find('button.info').click({ force: true });
    cy.wait(2000); // Para poder leer la info
    cy.get('#root button.paq-btn-cerrar').click({ force: true });
    cy.wait(800);

    // Editar
    cy.get('#root tr').eq(1).find('button.edit').click({ force: true });
    cy.wait(1000);
    cy.get('#root input.paq-form-control').first().clear().type(`${nombreDinamico}_Edit`, { delay: 80 });
    cy.get('#root button.orange').click({ force: true });
    cy.wait(2000);

    // Entregar paquete
    cy.get('#root tr').eq(1).find('button.deliver').click({ force: true });
    cy.wait(1000); // Ver el aviso de confirmación
    cy.get('button.swal2-confirm').click(); 
    cy.wait(2000);

    // --- FILTROS ---
    cy.get('#root div.paq-filter-chips button').contains('Recibidos').click();
    cy.wait(1000);
    cy.get('#root div.paq-filter-chips button').contains('Entregados').click();
    cy.wait(1000);
    cy.get('#root button.paq-chip-clear').click();
    cy.wait(1500);

    // --- LOGOUT ---
    cy.get('#root i.bi-list').click();
    cy.wait(800);
    cy.get('#root button.paq-logout-btn').click();
  })
})