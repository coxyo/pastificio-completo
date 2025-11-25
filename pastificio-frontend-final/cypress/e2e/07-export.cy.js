// ============ cypress/e2e/07-export.cy.js ============
describe('Export Dati', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.contains('Ordini').click()
    cy.wait(500)
  })

  it('esporta ordini in CSV', () => {
    cy.contains('button', 'Esporta').click()
    cy.contains('CSV').click()
    // Verifica che il download sia iniziato
    cy.readFile('cypress/downloads/ordini.csv').should('exist')
  })

  it('esporta ordini in Excel', () => {
    cy.contains('button', 'Esporta').click()
    cy.contains('Excel').click()
    cy.readFile('cypress/downloads/ordini.xlsx').should('exist')
  })

  it('stampa ordine singolo', () => {
    cy.get('table tbody tr').first().find('button[title="Stampa"]').click()
    cy.window().its('print').should('be.called')
  })
})

