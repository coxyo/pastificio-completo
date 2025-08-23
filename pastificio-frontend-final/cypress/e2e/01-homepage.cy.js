describe('Homepage', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('dovrebbe caricare la homepage', () => {
    cy.contains('Pastificio').should('be.visible')
  })

  it('dovrebbe navigare alle sezioni', () => {
    // Test navigazione
    cy.get('[data-cy=nav-ordini]').click()
    cy.url().should('include', '/ordini')
  })
})