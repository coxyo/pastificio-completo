// ===== cypress/e2e/test-base.cy.js =====
describe('Test Base', () => {
  it('Visita homepage', () => {
    cy.visit('/')
    cy.get('body').should('be.visible')
  })
})

