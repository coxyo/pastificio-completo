// ============ cypress/e2e/09-notifiche.cy.js ============
describe('Sistema Notifiche', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('mostra notifiche in tempo reale', () => {
    // Simula nuovo ordine via WebSocket
    cy.window().its('webSocketService').then((ws) => {
      ws.emit('nuovo-ordine', {
        cliente: 'Test Cliente',
        totale: 100
      })
    })
    
    cy.contains('Nuovo ordine').should('be.visible')
  })

  it('mostra alert scorte basse', () => {
    cy.window().its('webSocketService').then((ws) => {
      ws.emit('alert-scorte', {
        ingrediente: 'Farina',
        giacenza: 10
      })
    })
    
    cy.contains('Scorta bassa').should('be.visible')
  })

  it('gestisce centro notifiche', () => {
    cy.get('[data-testid="notification-bell"]').click()
    cy.contains('Centro Notifiche').should('be.visible')
    cy.get('.notification-item').should('have.length.greaterThan', 0)
  })
})
