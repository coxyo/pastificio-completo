// Import comandi custom
import './commands'

// Gestione errori uncaught
Cypress.on('uncaught:exception', (err, runnable) => {
  // Ignora errori di React development mode
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false
  }
  
  // Ignora errori di hydration Next.js
  if (err.message.includes('Hydration failed')) {
    return false
  }
  
  // Ignora errori WebSocket in test
  if (err.message.includes('WebSocket')) {
    return false
  }
  
  // Lascia fallire il test per altri errori
  return true
})

// Before each test
beforeEach(() => {
  // Clear localStorage
  cy.window().then((win) => {
    win.localStorage.clear()
    win.sessionStorage.clear()
  })
  
  // Clear cookies
  cy.clearCookies()
  
  // Setup interceptors comuni
  cy.intercept('GET', '**/api/ordini**', { 
    statusCode: 200, 
    body: [] 
  }).as('getOrdini')
  
  cy.intercept('GET', '**/api/clienti**', { 
    statusCode: 200, 
    body: [] 
  }).as('getClienti')
  
  cy.intercept('GET', '**/api/dashboard/**', { 
    statusCode: 200, 
    body: {} 
  }).as('getDashboard')
})
