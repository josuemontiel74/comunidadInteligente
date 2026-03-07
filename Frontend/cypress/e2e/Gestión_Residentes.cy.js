describe('Módulo: Gestión de Residentes - Flujo Completo', () => {
  
  // --- DATOS DINÁMICOS ---
const idUnico = Math.floor(Math.random() * 1e9).toString().padStart(9, "0");
  const docDinamico = `${idUnico}`;
  const correoDinamico = `residente${idUnico}@gmail.com`;

  it('Debe registrar, filtrar, editar y finalizar residente', () => {
    cy.visit('http://localhost:5173');

    // ─── LOGIN ───────────────────────────────────────────────
    cy.get('#root button.ld-btn-login').click();
    cy.get('#root input[placeholder="Ingresa tu usuario"]').type('josue2023');
    cy.get('#root input[placeholder="••••••••"]').type('3117325j');
    cy.get('#root button.lgn-btn-submit').click();
    cy.wait(2000);

    // ─── NAVEGACIÓN A RESIDENTES ─────────────────────────────
    cy.get('#root div.sa-modules-grid a[href="/Residentes"]').click();
    cy.wait(1000);

    // ─── FILTROS Y VISTAS (Simulación de uso) ────────────────
    cy.get('select').eq(0).select('activo');
    cy.get('select').eq(1).select('A');
    cy.get('select').eq(2).select('propietario');
    cy.wait(500);
    cy.get('select').eq(0).select('todos'); // Reset filtros
    
    cy.get('i.bi-grid-3x3-gap-fill').click(); // Vista Cuadrícula
    cy.wait(500);
    cy.get('i.bi-table').click();             // Vista Tabla
    cy.wait(500);

    // ─── REGISTRAR NUEVO RESIDENTE ───────────────────────────
    cy.get('button.res-btn-registrar').click();
    cy.wait(1000);

    // Ubicación y Ocupación
 cy.get('[name="torreId"]').select('1');
  cy.get('[name="apto"]').select('2');
     cy.wait(1000);
  cy.get('[name="tipoOcupacion"]').select('Propietario');
    
   cy.get('#root [name="personasACargo"]').type('3{enter}');

 
    
    // Documento: Usamos force:true para escribir aunque el header lo tape
    cy.get('[name="numeroDocumento"]', { timeout: 10000 })
      .scrollIntoView() // Esto intenta bajar el scroll para que el campo no esté bajo el header
      .should('exist')
      .click({ force: true })
      .type(docDinamico, { force: true, delay: 50 });

    // Primer Nombre
    cy.get('[name="primerNombre"]')
      .click({ force: true })
      .type('Manuel', { force: true });

    // Segundo Nombre
    cy.get('[name="segundoNombre"]')
      .click({ force: true })
      .type('Andres', { force: true });

    // Primer Apellido
    cy.get('[name="primerApellido"]')
      .click({ force: true })
      .type('Sanchez', { force: true });

    // Segundo Apellido
    cy.get('[name="segundoApellido"]')
      .click({ force: true })
      .type('Fernando', { force: true });
    // Contacto
    cy.get('#root [name="correo"]').type(correoDinamico);
    cy.get('#root [name="telefono"]').type('3001234567');

    // Checks de condiciones especiales
    cy.get('#tieneNinos').check();
    cy.get('#tieneAdultoMayor').check();
    cy.get('#tieneDiscapacidad').check();

    // Guardar
    cy.get('button.res-btn-submit').click();
    
    // Manejo de Alerta SweetAlert (si existe) o espera de tabla
    cy.wait(2000);
    cy.get('body').then(($body) => {
        if ($body.find('button.swal2-confirm').length > 0) {
            cy.get('button.swal2-confirm').click({ force: true });
        }
    });

    // ─── ACCIONES EN TABLA (PRIMERA FILA) ─────────────────────
    
    // 1. Ver Información
    cy.get('table tbody tr').first().find('button.res-btn-ver').click({ force: true });
    cy.wait(1000);
    cy.get('#root button.res-btn-submit').click();
    cy.wait(800);

    // 2. Editar
    cy.get('table tbody tr').first().find('button.res-btn-editar').click({ force: true });
    cy.wait(1000);
    
    // Re-seleccionar para asegurar estabilidad del formulario
    cy.get('[name="torreId"]').select('1');
    cy.get('[name="apto"]').select('1');
    
    cy.get('button.res-btn-submit').click();
    
    // Confirmar edición
    cy.get('button.swal2-confirm', { timeout: 8000 })
      .should('be.visible')
      .click({ force: true });
    cy.wait(1500);

    // 3. Finalizar Residencia (Inactivar)
    cy.get('table tbody tr').first().find('button.res-btn-finalizar').click({ force: true });
    cy.wait(800);
    cy.get('button.swal2-confirm').click({ force: true });
    
    cy.wait(2000);
    cy.log('Flujo de Residentes completado con éxito');
    cy.get('#root i.bi-list').click();
cy.get('#root button.res-logout-btn').click();
  });
});