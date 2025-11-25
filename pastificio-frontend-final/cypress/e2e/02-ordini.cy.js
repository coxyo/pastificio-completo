// ===== cypress/e2e/02-ordini.cy.js =====
describe('Gestione Ordini', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.contains('Ordini').click()
    cy.wait(500)
  })

  it('mostra form nuovo ordine', () => {
    cy.get('input[type="date"]').should('be.visible')
    cy.get('input[placeholder*="Cliente"]').should('be.visible')
    cy.contains('Aggiungi Prodotto').should('be.visible')
  })

  it('aggiunge un nuovo ordine', () => {
    cy.get('input[placeholder*="Cliente"]').clear().type('Test Cliente')
    cy.contains('button', 'Aggiungi Prodotto').click()
    cy.get('select').first().select(1)
    cy.get('input[type="number"]').first().clear().type('5')
    cy.contains('button', 'Salva').click()
    cy.contains('salvato').should('be.visible')
  })

  it('filtra ordini per data', () => {
    cy.get('input[type="date"]').first().type('2025-08-01')
    cy.get('input[type="date"]').last().type('2025-08-31')
    cy.contains('Filtra').click()
  })

  it('cerca ordini per cliente', () => {
    cy.get('input[placeholder*="Cerca"]').type('Mario')
    cy.wait(500)
    cy.get('table tbody tr').should('exist')
  })
})

