// cypress/e2e/test-reale.cy.js
describe('Test Reale Applicazione', () => {
  
  // Test 1: Verifica che la pagina si carichi
  it('carica la homepage', () => {
    cy.visit('http://localhost:3000')
    
    // Aspetta che qualcosa si carichi (modifica con un testo che sai esserci)
    cy.get('body').should('be.visible')
    
    // Fai uno screenshot per vedere cosa c'è
    cy.screenshot('homepage-caricata')
  })

  // Test 2: Trova elementi nella pagina
  it('trova elementi base', () => {
    cy.visit('http://localhost:3000')
    
    // Logga tutti i bottoni trovati
    cy.get('button').then(buttons => {
      console.log(`Trovati ${buttons.length} bottoni`)
      buttons.each((i, btn) => {
        console.log(`Bottone ${i}: ${btn.textContent}`)
      })
    })
    
    // Logga tutti gli input trovati
    cy.get('input').then(inputs => {
      console.log(`Trovati ${inputs.length} input`)
      inputs.each((i, input) => {
        console.log(`Input ${i}: type=${input.type}, name=${input.name}, placeholder=${input.placeholder}`)
      })
    })
  })

  // Test 3: Verifica presenza dei tab principali
  it('verifica presenza tab', () => {
    cy.visit('http://localhost:3000')
    
    // Lista dei tab che dovrebbero esserci (modifica secondo la tua app)
    const tabs = ['Dashboard', 'Ordini', 'Clienti', 'Magazzino']
    
    tabs.forEach(tabName => {
      // Prova diversi modi di trovare il tab
      cy.get('body').then($body => {
        // Metodo 1: cerca per testo
        if ($body.text().includes(tabName)) {
          cy.log(`✓ Trovato testo: ${tabName}`)
        }
        
        // Metodo 2: cerca come button
        if ($body.find(`button:contains("${tabName}")`).length) {
          cy.log(`✓ Trovato come button: ${tabName}`)
        }
        
        // Metodo 3: cerca come link
        if ($body.find(`a:contains("${tabName}")`).length) {
          cy.log(`✓ Trovato come link: ${tabName}`)
        }
        
        // Metodo 4: cerca con role tab
        if ($body.find(`[role="tab"]:contains("${tabName}")`).length) {
          cy.log(`✓ Trovato come tab: ${tabName}`)
        }
      })
    })
  })

  // Test 4: Prova a cliccare su un tab
  it('naviga ai diversi tab', () => {
    cy.visit('http://localhost:3000')
    cy.wait(2000) // Aspetta che tutto sia caricato
    
    // Prova a cliccare su "Ordini" (se esiste)
    cy.get('body').then($body => {
      // Trova qualsiasi elemento che contiene "Ordini"
      const ordiniElements = $body.find(':contains("Ordini")').filter(function() {
        return $(this).text().trim() === 'Ordini'
      })
      
      if (ordiniElements.length > 0) {
        cy.wrap(ordiniElements.first()).click()
        cy.wait(1000)
        cy.screenshot('dopo-click-ordini')
        
        // Verifica che qualcosa sia cambiato
        cy.url().then(url => {
          cy.log(`URL dopo click: ${url}`)
        })
      } else {
        cy.log('Tab Ordini non trovato')
      }
    })
  })

  // Test 5: Verifica form ordini (se esiste)
  it('cerca form ordini', () => {
    cy.visit('http://localhost:3000')
    cy.wait(2000)
    
    // Cerca un tab o link "Ordini" e cliccalo
    cy.contains('Ordini').click({ force: true }).then(() => {
      cy.wait(1000)
      
      // Ora cerca elementi del form
      cy.get('form').then($forms => {
        if ($forms.length > 0) {
          cy.log(`Trovati ${$forms.length} form`)
          cy.screenshot('form-ordini')
        }
      })
      
      // Cerca input specifici
      const inputTypes = ['text', 'number', 'date', 'email']
      inputTypes.forEach(type => {
        cy.get(`input[type="${type}"]`).then($inputs => {
          if ($inputs.length > 0) {
            cy.log(`Trovati ${$inputs.length} input di tipo ${type}`)
          }
        })
      })
      
      // Cerca select/dropdown
      cy.get('select').then($selects => {
        if ($selects.length > 0) {
          cy.log(`Trovati ${$selects.length} select`)
        }
      })
    })
  })
})

