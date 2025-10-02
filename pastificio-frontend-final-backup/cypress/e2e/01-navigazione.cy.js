// Comando per navigare a una tab
Cypress.Commands.add('goToTab', (tabName) => {
  cy.contains('[role="tab"]', tabName).click()
  cy.wait(500)
})

// Comando per creare un ordine veloce
Cypress.Commands.add('createQuickOrder', (cliente = 'Test Cliente', prodotto = 1, quantita = 5) => {
  cy.goToTab('Ordini')
  cy.get('input[placeholder*="Cliente"]').clear().type(cliente)
  cy.contains('button', 'Aggiungi Prodotto').click()
  cy.get('select').first().select(prodotto)
  cy.get('input[type="number"]').first().clear().type(quantita.toString())
  cy.contains('button', 'Salva').click()
})

// Comando per creare un cliente veloce
Cypress.Commands.add('createQuickClient', (nome = 'Test Cliente', telefono = '3331234567') => {
  cy.goToTab('Clienti')
  cy.contains('button', 'Nuovo Cliente').click()
  cy.get('input[placeholder*="Nome"]').type(nome)
  cy.get('input[placeholder*="Telefono"]').type(telefono)
  cy.contains('button', 'Salva').click()
})

// Comando per verificare notifica toast
Cypress.Commands.add('checkToast', (message) => {
  cy.get('.Toastify__toast').should('be.visible')
  cy.get('.Toastify__toast-body').should('contain', message)
})

// Comando per simulare modalità offline
Cypress.Commands.add('goOffline', () => {
  cy.window().then((win) => {
    cy.stub(win.navigator, 'onLine').value(false)
    win.dispatchEvent(new Event('offline'))
  })
})

// Comando per simulare modalità online
Cypress.Commands.add('goOnline', () => {
  cy.window().then((win) => {
    cy.stub(win.navigator, 'onLine').value(true)
    win.dispatchEvent(new Event('online'))
  })
})

// Comando per verificare tabella
Cypress.Commands.add('checkTable', (expectedRows) => {
  cy.get('table tbody tr').should('have.length', expectedRows)
})

// Comando per attendere WebSocket
Cypress.Commands.add('waitForWebSocket', () => {
  cy.window().its('webSocketService').should('exist')
  cy.window().its('webSocketService.connected').should('be.true')
})
