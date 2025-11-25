// ============ cypress/e2e/08-backup.cy.js ============
describe('Sistema Backup', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.contains('Impostazioni').click()
    cy.wait(500)
  })

  it('mostra stato backup', () => {
    cy.contains('Backup').click()
    cy.contains('Ultimo backup').should('be.visible')
    cy.contains('Prossimo backup').should('be.visible')
  })

  it('esegue backup manuale', () => {
    cy.contains('button', 'Backup Manuale').click()
    cy.contains('Backup in corso').should('be.visible')
    cy.contains('Backup completato', {timeout: 10000}).should('be.visible')
  })

  it('mostra cronologia backup', () => {
    cy.contains('Cronologia Backup').click()
    cy.get('table').should('be.visible')
    cy.contains('Automatico').should('be.visible')
  })
})

