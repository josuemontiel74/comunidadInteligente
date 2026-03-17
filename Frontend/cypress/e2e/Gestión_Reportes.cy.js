describe('template spec', () => {
  it('passes', () => {
        cy.visit('http://localhost:5173');
        cy.get('#root button.ld-btn-login').click();
        cy.get('#login-username').click();
        cy.get('#login-username').click();
        cy.get('#login-username').type('josue2023');
        cy.get('#login-password').click();
        cy.get('#login-password').type('3117325j');
        cy.get('#root button.lgn-btn-submit').click();
        cy.wait(2000); 
        cy.get('#root div.sa-modules-grid a[href="/Reportes"]').click();
        cy.get('#rpt-fecha-inicio').click();  
        cy.get('#rpt-fecha-inicio').clear();
        cy.get('#rpt-fecha-inicio').type('2022-02-03');
        cy.get('#root button.btn-pdf').click();
        cy.wait(2000); 
        cy.get('#root i.bi-list').click();
        cy.get('#root button.active').click();
        cy.get('#root div:nth-child(4) > div.circle-value').click();
        cy.get('#root div:nth-child(12) div.rpt-card-header').click();
        cy.get('#root div:nth-child(11) canvas').click()
        cy.wait(2000); 
        cy.get('#root i.bi-arrow-left').click();
        cy.get('#root a[href="/Auditorias"] div.sa-module-icon-wrap').click();
        cy.get('#root button[title="Volver"]').click();
        cy.wait(2000); 
        cy.get('#root div.sa-modules-grid a[href="/parqueaderos"]').click();
        cy.get('#root div:nth-child(2) > div.parq-filter-chips > button:nth-child(2)').click();
        cy.get('#root div:nth-child(2) > div.parq-filter-chips > button:nth-child(3)').click();
        cy.get('#root div.parq-filter-chips button:nth-child(4)').click();
        cy.get('#root i.bi-arrow-left').click();
        cy.wait(2000); 
        cy.get('#root a[href="/visitas"] canvas').click();
        cy.get('#root button[title="Volver"]').click();
        cy.get('#root button[title="Ver perfil"] img').click();
        cy.get('#root button[title="Ver perfil"]').click();
        cy.wait(2000); 
        cy.get('#root i.bi-list').click();
        cy.get('#root button.sa-logout-btn').click();
  })
})