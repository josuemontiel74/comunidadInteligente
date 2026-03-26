describe('Módulo: Gestión de Usuarios - Flujo Completo', () => {
  
  // --- GENERADORES DE DATOS ALEATORIOS ---
const idUnico = Math.floor(Math.random() * 1e9).toString().padStart(9, "0");




 
// Función para generar letras aleatorias
function generarLetrasAleatorias(longitud) {
  const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let resultado = "";
  for (let i = 0; i < longitud; i++) {
    const indice = Math.floor(Math.random() * letras.length);
    resultado += letras[indice];
  }
  return resultado;
}

// Generar un identificador de 9 letras


// Usar el idUnico en tus variables
const primerNombre = `Juan`;
const segundoNombre = `Andres`;
const nombreAleatorio = `Usuario${idUnico}`;
const primerApellido = `Gomez`;
const segundoApellido = `Perez`;
const documentoAleatorio = `${idUnico}`;
const correoAleatorio = `user${idUnico}@gestion.com`;

console.log(nombreAleatorio);
console.log(correoAleatorio);

  it('Debe registrar, filtrar, editar y cambiar estado de usuario', () => {
    cy.visit('http://localhost:5173');
    
    // ─── LOGIN ───────────────────────────────────────────────
    cy.get('#root button.ld-btn-login').click();
    cy.get('#root input[placeholder="Ingresa tu usuario"]').type('josue2023');
    cy.get('#root input[placeholder="••••••••"]').type('3117325j');
    cy.get('#root button.lgn-btn-submit').click();
    cy.wait(2000);
    
    // ─── NAVEGACIÓN A GESTIÓN DE USUARIOS ────────────────────
    cy.get('#root div.sa-modules-grid a[href="/GestionUsuario"]').click();
    cy.wait(1000);
    
    // ─── PROBAR FILTROS Y VISTAS ─────────────────────────────
    cy.get('div.gu-filter-chips button').eq(1).click(); // Filtro 2
    cy.wait(500);
    cy.get('div.gu-filter-chips button').eq(2).click(); // Filtro 3
    cy.wait(500);
    cy.get('div.gu-filter-chips button').eq(0).click(); // Todos
    
    
     
    // ─── REGISTRAR NUEVO USUARIO ─────────────────────────────
    cy.get('button.gu-btn-registrar').click();
    cy.wait(1000);
    
    cy.get('select.gu-form-control').eq(0).select('1'); // Tipo Documento
       cy.get('#gu-c-numDoc').first().type(documentoAleatorio);
     
    // Nombres y Apellidos
    // Primer Nombre
    cy.get('input.gu-form-control').eq(1).type(primerNombre, { delay: 50 });
    // Segundo Nombre
    cy.get('input.gu-form-control').eq(2).type(segundoNombre, { delay: 50 });
    // Primer Apellido
    cy.get('input.gu-form-control').eq(3).type(primerApellido, { delay: 50 });
    // Segundo Apellido
    cy.get('input.gu-form-control').eq(4).type(segundoApellido, { delay: 50 });
    
    // Teléfono y Correo
    cy.get('#gu-c-telefono').click();
    cy.get('#gu-c-telefono').type('3120320503');
    cy.get('#gu-c-correo').click();
    cy.get('#gu-c-correo').type(correoAleatorio);
    
    
    // Password y Rol
    cy.get('#gu-c-password').click();
    cy.get('#gu-c-password').type('holavskikgb');
    cy.get('#gu-c-rol').select('3'); // Rol específico
    
    cy.get('button.gu-form-submit').click();
    cy.wait(3000);
    
    
    // ─── BUSQUEDA Y VER INFO ─────────────────────────────────
    // Usamos el buscador para encontrar al usuario recién creado
    cy.get('input.form-control').first().type(primerNombre +'{enter}');
    cy.wait(1000);
    
    cy.get('table tbody tr').first().find('button.info').click({ force: true });
    cy.wait(1500);
    cy.get('button.gu-form-submit').click(); // Botón para cerrar o salir del modo info
    
    // ─── EDITAR USUARIO ──────────────────────────────────────
    cy.get('table tbody tr').first().find('button.edit').click({ force: true });
    cy.wait(1000);
    
    // Cambiamos el nombre
    cy.get('input.gu-form-control').eq(1).clear().type(nombreAleatorio+ 'Mod');
    
    // Re-confirmamos el rol para asegurar que el form sea válido
    
    
     cy.get('#root button.gu-form-submit').click();
    cy.wait(1000);
     
    cy.wait(1500);
    
    // ─── CAMBIAR ESTADO (ACTIVAR/DESACTIVAR) ────────────────
    // Probamos el toggle de estado en la primera fila
    cy.get('#root input.form-control').clear();
    cy.get('table tbody tr').first().find('button.toggle-off, button.toggle-on').click({ force: true });
    cy.wait(800);
    cy.get('button.swal2-confirm').click();
    cy.wait(1500);
    
    // ─── CERRAR SESIÓN ───────────────────────────────────────
      cy.get('#root i.bi-list').click();
     cy.get('#root button.gu-logout-btn').click();
  });
});