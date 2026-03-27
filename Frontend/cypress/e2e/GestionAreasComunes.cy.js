describe('Módulo: Áreas Comunes - Flujo de Alta Estabilidad', () => {
  
  // --- GENERACIÓN DE DATOS DINÁMICOS ---
  const idUnico = Date.now().toString().slice(-4);
  const dUnico = Math.floor(Math.random() * 1e9).toString().padStart(9, "0");

  const docDinamico = dUnico;
  const nombreDinamico = `Michel Garcia Marques`; 
  
// --- GENERACIÓN DE FECHA ÚNICA E IRREPETIBLE ---
const fechaBase = new Date();
// 1. Nos adelantamos 6 meses como pediste
fechaBase.setMonth(fechaBase.getMonth() + 1); 

// 2. Usamos los últimos dígitos del timestamp para saltar días de forma aleatoria
// Esto asegura que si corres el test ahora y en 1 minuto, la fecha sea distinta
const saltoDias = Math.floor(Math.random() * 2) + 1; // Salto de 1 a 28 días
fechaBase.setDate(fechaBase.getDate() + saltoDias);

// 3. Formateamos a YYYY-MM-DD
const fechaFormato = fechaBase.toISOString().split('T')[0];

console.log("Fecha generada para esta prueba:", fechaFormato);

  it('Debe gestionar áreas (Apagar/Encender) y registrar reserva', () => {
    cy.visit('http://localhost:5173');
    
    // ─── LOGIN ───────────────────────────────────────────────
    cy.get('#root button.ld-btn-login').click();
    cy.get('#login-username').should('be.visible').type('josue2023');
    cy.get('#login-password').should('be.visible').type('3117325j');
    cy.get('button.lgn-btn-submit').click();
    cy.wait(2000);
    
    // ─── NAVEGACIÓN ──────────────────────────────────────────
    cy.get('i.bi-building').should('be.visible').click();
    cy.wait(1500);
    
    // ─── CALENDARIO ──────────────────────────────────────────
    cy.get('button.ac-btn-calendario').click();
    cy.get('div.ac-calendar-nav button:nth-child(3)').click(); 
    cy.get('i.bi-x-lg').first().click({ force: true }); 
    
    // ─── GESTIÓN DE ÁREAS (CORREGIDO: APAGAR Y VOLVER A ENCENDER) ───
    cy.get('button.ac-btn-gestionar-areas').click();
    cy.wait(1000);
    
    // 1. Desactivar el área (Toggle Off)
    cy.get('button.ac-area-toggle-btn').first().click(); 
    cy.get('button.swal2-confirm').should('be.visible').click();
    cy.wait(5000);
    
    // 2. Volver a activar el área (Toggle On) - Usamos la clase específica si cambia
    cy.get('button.ac-area-toggle-btn').first().click(); 
    cy.get('button.swal2-confirm').should('be.visible').click();
    cy.wait(1000);
    
    // Cerrar el modal de gestión
    cy.get('button.ac-modal-close').first().click({ force: true });
    cy.wait(1000);
    
    // ─── REGISTRO DE RESERVA ──────────────────────────────────
    cy.get('button.ac-btn-registrar').should('be.visible').click();
    cy.wait(1000);
    
    cy.get('[name="tipoDocumentoId"]').select('1');
    cy.get('[name="documentoSolicitante"]').type(docDinamico, { force: true });
    cy.get('[name="nombreSolicitante"]').type(nombreDinamico, { force: true });
    cy.get('[name="telefonoSolicitante"]').type('3123123128');
    cy.get('[name="correoSolicitante"]').type(`usuario${idUnico}@gmail.com`);
    
    cy.get('[name="torre"]').select('1');
    cy.wait(800); 
    cy.get('[name="apartamentoId"]').select('1');
    cy.get('[name="areaComunId"]').select('1');
    
    // FECHA Y HORAS (Inicio 12:00 / Fin 20:00)
       // En la parte del registro:
    cy.get('[name="fechaReserva"]').clear().type(fechaFormato, { force: true });
    cy.get('[name="horaInicio"]').type('12:00', { force: true });
    cy.get('[name="horaFin"]').type('20:00', { force: true });
    
    cy.get('[name="cantidadAsistentes"]').type('4');
    cy.get('#root [name="invitadosExternos"]').check();
    cy.get('[name="motivoReserva"]').type('Uso de área común automatizado');
    cy.get('#root [name="aceptaReglamento"]').check();
    
    cy.get('button.ac-form-submit').click();
    
    cy.wait(2000);
    cy.get('body').then(($body) => {
        if ($body.find('button.swal2-confirm').length > 0) {
            cy.get('button.swal2-confirm').click({ force: true });
        }
    });
    
    // ─── EDICIÓN (RE-SELECCIÓN OBLIGATORIA) ───────────────────
    cy.wait(2000);
    cy.get('table tbody tr').first().find('button.edit').click({ force: true });
    cy.wait(1500);
    
    cy.get('[name="tipoDocumentoId"]').select('1'); 
    cy.get('[name="nombreSolicitante"]').type(' Editado', { force: true });
    
    cy.get('[name="torre"]').select('1');
    cy.wait(800); 
    cy.get('[name="apartamentoId"]').select('1');
    
    cy.get('#root button.ac-form-submit').click();
    cy.wait(1000);
    
    cy.get('body').then(($body) => {
      if ($body.find('button.swal2-confirm').length > 0) {
        cy.get('button.swal2-confirm').click({ force: true });
      }
    });
     cy.get('#root tr:nth-child(1) button.finish i.bi').click();
    cy.get('button.swal2-confirm').click();
    
    // ─── FINALIZAR Y LOGOUT ───────────────────────────────────
    cy.wait(2000);
    cy.get('i.bi-list').click();
    cy.get('button.ac-logout-btn').click({ force: true });
    cy.get('#root button.ld-btn-login').click();
   
    
   
  });
});