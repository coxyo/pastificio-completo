// ============ cypress/e2e/10-produzione.cy.js ============
describe('Calendario Produzione', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.contains('Produzione').click()
    cy.wait(500)
  })

  it('mostra calendario produzione', () => {
    cy.contains('Calendario').should('be.visible')
    cy.get('.calendar-view').should('be.visible')
  })

  it('aggiunge evento produzione', () => {
    cy.contains('button', 'Nuovo Evento').click()
    
    cy.get('input[name="titolo"]').type('Produzione Pasta Fresca')
    cy.get('select[name="tipo"]').select('produzione')
    cy.get('input[name="data"]').type('2025-08-30')
    cy.get('input[name="ora"]').type('08:00')
    
    cy.contains('button', 'Salva').click()
    cy.contains('Evento aggiunto').should('be.visible')
  })

  it('visualizza carico di lavoro', () => {
    cy.contains('Carico Lavoro').click()
    cy.get('.workload-chart').should('be.visible')
    cy.contains('%').should('be.visible')
  })

  it('cambia vista calendario', () => {
    cy.contains('button', 'Settimana').click()
    cy.get('.week-view').should('be.visible')
    
    cy.contains('button', 'Mese').click()
    cy.get('.month-view').should('be.visible')
  })
})

