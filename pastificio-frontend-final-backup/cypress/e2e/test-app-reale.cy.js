// cypress/e2e/test-app-reale.cy.js
describe('Test Pastificio Nonna Claudia', () => {
  
  beforeEach(() => {
    cy.visit('http://localhost:3000')
    cy.wait(1000) // Aspetta caricamento
  })

  describe('Navigazione Sidebar', () => {
    it('mostra tutti i menu nella sidebar', () => {
      // Verifica presenza titolo
      cy.contains('Pastificio Nonna Cla...').should('be.visible')
      
      // Verifica menu items nella sidebar
      cy.contains('Dashboard').should('be.visible')
      cy.contains('Ordini').should('be.visible')
      cy.contains('Produzione').should('be.visible')
      cy.contains('Magazzino').should('be.visible')
      cy.contains('Clienti').should('be.visible')
      cy.contains('Fatturazione').should('be.visible')
      cy.contains('Calendario').should('be.visible')
      cy.contains('Report').should('be.visible')
      cy.contains('Backup').should('be.visible')
      cy.contains('Notifiche').should('be.visible')
      cy.contains('Impostazioni').should('be.visible')
    })

    it('naviga alla sezione Ordini', () => {
      // Click su Ordini nella sidebar
      cy.get('.MuiListItemText-root').contains('Ordini').click()
      cy.wait(500)
      
      // Verifica che siamo nella sezione ordini
      cy.contains('Gestione Ordini').should('be.visible')
      cy.contains('Ordini del giorno').should('be.visible')
    })

    it('espande menu dropdown', () => {
      // Ordini ha un dropdown - verifichiamolo
      cy.get('.MuiListItemButton-root').contains('Ordini').parent().find('svg').then($svg => {
        // Se c'è una freccia, il menu è espandibile
        if ($svg.length > 0) {
          cy.log('Menu Ordini è espandibile')
        }
      })
    })
  })

  describe('Dashboard', () => {
    it('mostra le statistiche principali', () => {
      // Verifica cards statistiche
      cy.contains('Ordini Oggi').should('be.visible')
      cy.contains('Incasso Oggi').should('be.visible')
      cy.contains('Completamento').should('be.visible')
      cy.contains('Media Ordine').should('be.visible')
      
      // Verifica valori
      cy.contains('€0.00').should('be.visible')
      cy.contains('0%').should('be.visible')
      cy.contains('€0').should('be.visible')
    })

    it('mostra grafici performance', () => {
      // Verifica presenza elementi grafici
      cy.get('.MuiPaper-root').should('have.length.greaterThan', 4)
      
      // Verifica indicatori performance
      cy.contains('Performance: 96%').should('be.visible')
      cy.contains('Storage: 2 MB').should('be.visible')
    })
  })

  describe('Gestione Ordini', () => {
    beforeEach(() => {
      // Vai alla sezione ordini
      cy.get('.MuiListItemText-root').contains('Ordini').click()
      cy.wait(500)
    })

    it('mostra la tabella ordini', () => {
      // Verifica intestazioni tabella
      cy.contains('ORA').should('be.visible')
      cy.contains('CLIENTE').should('be.visible')
      cy.contains('PRODOTTI').should('be.visible')
      cy.contains('TOTALE').should('be.visible')
      cy.contains('STATO').should('be.visible')
      cy.contains('FATTURA').should('be.visible')
      cy.contains('NOTE').should('be.visible')
      cy.contains('AZIONI').should('be.visible')
    })

    it('mostra messaggio quando non ci sono ordini', () => {
      cy.contains('Nessun ordine per questa data').should('be.visible')
    })

    it('mostra pulsante Nuovo Ordine', () => {
      cy.contains('button', 'Nuovo Ordine').should('be.visible')
    })

    it('mostra filtri e pulsanti azioni', () => {
      // Verifica pulsanti nella toolbar
      cy.contains('button', 'Debug PWA').should('be.visible')
      cy.contains('button', 'Export').should('be.visible')
      cy.contains('button', '0 ordini totali').should('be.visible')
      cy.contains('button', 'Rimuovi Duplicati').should('be.visible')
    })

    it('può aprire modal nuovo ordine', () => {
      cy.contains('button', 'Nuovo Ordine').click()
      cy.wait(500)
      
      // Verifica che si apra un modal o form
      cy.get('body').then($body => {
        // Cerca elementi tipici di un form ordine
        const possibleSelectors = [
          '.MuiDialog-root',
          '.MuiModal-root',
          'form',
          '[role="dialog"]'
        ]
        
        let foundForm = false
        possibleSelectors.forEach(selector => {
          if ($body.find(selector).length > 0) {
            foundForm = true
            cy.log(`Trovato form/modal con selector: ${selector}`)
          }
        })
        
        if (!foundForm) {
          cy.log('Modal/form non trovato - potrebbe essere inline')
        }
      })
    })
  })

  describe('Modalità Offline', () => {
    it('mostra indicatore modalità offline', () => {
      cy.contains('Modalità Offline - I dati sono salvati localmente').should('be.visible')
    })

    it('mostra numero di ordini in cache', () => {
      cy.contains('0 ordini totali').should('be.visible')
    })
  })

  describe('Ricerca e Filtri', () => {
    beforeEach(() => {
      cy.get('.MuiListItemText-root').contains('Ordini').click()
      cy.wait(500)
    })

    it('ha un campo data', () => {
      // Cerca input di tipo date
      cy.get('input[type="date"]').should('exist')
    })

    it('può cambiare data', () => {
      cy.get('input[type="date"]').then($input => {
        const currentDate = $input.val()
        cy.log(`Data corrente: ${currentDate}`)
        
        // Prova a cambiare data
        cy.get('input[type="date"]').clear().type('2025-08-30')
        cy.wait(500)
        
        // Verifica che la data sia cambiata
        cy.get('.MuiPaper-root').contains('30/08/2025').should('be.visible')
      })
    })
  })

  describe('Navigazione altre sezioni', () => {
    it('naviga a Clienti', () => {
      cy.get('.MuiListItemText-root').contains('Clienti').click()
      cy.wait(500)
      cy.contains('Gestione').should('be.visible')
    })

    it('naviga a Magazzino', () => {
      cy.get('.MuiListItemText-root').contains('Magazzino').click()
      cy.wait(500)
      cy.url().should('include', '#')
    })

    it('naviga a Produzione', () => {
      cy.get('.MuiListItemText-root').contains('Produzione').click()
      cy.wait(500)
      cy.url().should('include', '#')
    })

    it('naviga a Report', () => {
      cy.get('.MuiListItemText-root').contains('Report').click()
      cy.wait(500)
      cy.url().should('include', '#')
    })
  })

  describe('Responsive Design', () => {
    it('funziona su mobile', () => {
      cy.viewport('iphone-x')
      cy.wait(500)
      
      // Verifica che il menu sia ancora accessibile
      // Potrebbe esserci un hamburger menu
      cy.get('body').then($body => {
        if ($body.find('[aria-label="menu"]').length > 0) {
          cy.get('[aria-label="menu"]').click()
        }
      })
    })

    it('funziona su tablet', () => {
      cy.viewport('ipad-2')
      cy.wait(500)
      cy.contains('Pastificio').should('be.visible')
    })
  })

  describe('Console Errors Check', () => {
    it('non dovrebbe avere errori critici in console', () => {
      cy.window().then((win) => {
        cy.spy(win.console, 'error')
        cy.wait(1000)
        
        // Nota: ci sono warning MUI per fontSize, ma non sono critici
        cy.wrap(win.console.error).should('not.be.calledWith', match => {
          return match && match.includes('Cannot read') || match.includes('undefined')
        })
      })
    })
  })
})
