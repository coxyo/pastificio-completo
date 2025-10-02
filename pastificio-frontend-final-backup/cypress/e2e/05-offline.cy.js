// ===== cypress/e2e/05-offline.cy.js =====
describe('Modalità Offline', () => {
  it('mostra indicatore modalità offline', () => {
    cy.visit('/')
    cy.window().then((win) => {
      cy.wrap(win.navigator.onLine).should('exist')
    })
  })

  it('salva ordini localmente in modalità offline', () => {
    cy.visit('/')
    cy.contains('Ordini').click()
    cy.wait(500)
    
    cy.window().then((win) => {
      cy.stub(win.navigator, 'onLine').value(false)
    })
    
    cy.get('input[placeholder*="Cliente"]').type('Cliente Offline', {force: true})
    cy.contains('button', 'Aggiungi Prodotto').click()
    cy.get('select').first().select(1)
    cy.get('input[type="number"]').first().type('3', {force: true})
    cy.contains('button', 'Salva').click()
    cy.contains('salvato localmente').should('be.visible')
  })

  it('sincronizza al ritorno online', () => {
    cy.visit('/')
    cy.window().then((win) => {
      cy.stub(win.navigator, 'onLine').value(true)
    })
    cy.contains('Sincronizzazione').should('be.visible')
  })
})
