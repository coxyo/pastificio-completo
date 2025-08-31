describe('Gestione Clienti', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.contains('Clienti').click()
    cy.wait(500)
  })

  it('mostra pagina clienti', () => {
    cy.contains('Gestione').should('be.visible')
  })

  it('aggiunge nuovo cliente', () => {
    cy.contains('button', 'Nuovo Cliente').click()
    cy.get('input[placeholder*="Nome"]').type('Test Cliente')
    cy.get('input[placeholder*="Telefono"]').type('3331234567')
    cy.get('input[placeholder*="Email"]').type('test@example.com')
    cy.contains('button', 'Salva').click()
    cy.contains('Cliente aggiunto').should('be.visible')
  })

  it('cerca clienti', () => {
    cy.get('input[placeholder*="Cerca"]').type('Mario')
    cy.wait(500)
    cy.get('table').should('be.visible')
  })

  it('visualizza dettagli cliente', () => {
    cy.get('table tbody tr').first().click()
    cy.contains('Dettagli Cliente').should('be.visible')
  })
})
