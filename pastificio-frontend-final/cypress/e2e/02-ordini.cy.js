describe('Gestione Ordini', () => {
  beforeEach(() => {
    cy.visit('/ordini')
  })

  it('dovrebbe mostrare la lista ordini', () => {
    cy.get('[data-cy=orders-table]').should('exist')
  })

  it('dovrebbe aprire il form nuovo ordine', () => {
    cy.get('[data-cy=new-order-button]').click()
    cy.get('[data-cy=order-form]').should('be.visible')
  })
})