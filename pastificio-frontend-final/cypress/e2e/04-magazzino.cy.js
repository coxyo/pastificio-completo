// ===== cypress/e2e/04-magazzino.cy.js =====
describe('Gestione Magazzino', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.contains('Magazzino').click()
    cy.wait(500)
  })

  it('mostra sezione magazzino', () => {
    cy.contains('Movimenti').should('be.visible')
  })

  it('aggiunge movimento carico', () => {
    cy.contains('button', 'Nuovo Movimento').click()
    cy.get('select[name="tipo"]').select('carico')
    cy.get('select[name="ingrediente"]').select(1)
    cy.get('input[name="quantita"]').type('100')
    cy.get('input[name="prezzo"]').type('50')
    cy.contains('button', 'Registra').click()
    cy.contains('Movimento registrato').should('be.visible')
  })

  it('verifica giacenze', () => {
    cy.contains('Giacenze').click()
    cy.get('table').should('be.visible')
    cy.contains('Farina').should('be.visible')
  })

  it('mostra alert scorte basse', () => {
    cy.contains('Alert Scorte').should('be.visible')
  })
})

