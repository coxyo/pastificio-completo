// ============ cypress/e2e/06-dashboard.cy.js ============
describe('Dashboard', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.contains('Dashboard').click()
    cy.wait(1000)
  })

  it('mostra widget statistiche', () => {
    cy.contains('Statistiche').should('be.visible')
    cy.contains('Vendite Oggi').should('be.visible')
    cy.contains('Ordini Attivi').should('be.visible')
  })

  it('mostra grafici vendite', () => {
    cy.get('canvas').should('be.visible') // Chart.js canvas
    cy.contains('Trend Vendite').should('be.visible')
  })

  it('mostra top prodotti', () => {
    cy.contains('Top Prodotti').should('be.visible')
    cy.get('.product-ranking').should('exist')
  })

  it('filtra statistiche per periodo', () => {
    cy.get('select[name="periodo"]').select('settimana')
    cy.wait(500)
    cy.contains('Ultimi 7 giorni').should('be.visible')
  })
})

