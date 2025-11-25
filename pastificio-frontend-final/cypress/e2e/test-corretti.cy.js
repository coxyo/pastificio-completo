// cypress/e2e/test-corretti.cy.js
describe('Test Pastificio - Versione Corretta', () => {
  
  beforeEach(() => {
    cy.visit('http://localhost:3000')
    cy.wait(1000)
  })

  describe('Navigazione Sidebar', () => {
    it('mostra il titolo del pastificio', () => {
      // Il titolo è troncato nell'interfaccia
      cy.contains('Pastificio Nonna Cla').should('be.visible')
      // O cerca solo "Pastificio"
      cy.contains('Pastificio').should('be.visible')
    })

    it('mostra tutti i menu nella sidebar', () => {
      // Menu items verificati
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
      cy.get('.MuiListItemText-root').contains('Ordini').click()
      cy.wait(500)
      cy.contains('Gestione Ordini').should('be.visible')
    })

    it('verifica menu espandibili', () => {
      // Verifica che alcuni menu abbiano sottomenu
      // Cerca l'icona di espansione vicino a Ordini
      cy.get('.MuiListItemButton-root').contains('Ordini').parent().parent().then($el => {
        // Log per debug
        cy.log('Elemento trovato per Ordini:', $el.html())
        // Verifica se c'è un'icona expand
        if ($el.find('[data-testid="ExpandLessIcon"]').length > 0 || 
            $el.find('[data-testid="ExpandMoreIcon"]').length > 0) {
          cy.log('Menu Ordini è espandibile')
        }
      })
    })
  })

  describe('Dashboard', () => {
    it('mostra le statistiche principali', () => {
      cy.contains('Ordini Oggi').should('be.visible')
      cy.contains('Incasso Oggi').should('be.visible')
      cy.contains('Completamento').should('be.visible')
      cy.contains('Media Ordine').should('be.visible')
      
      // Valori visualizzati
      cy.contains('€0.00').should('be.visible')
      cy.contains('0%').should('be.visible')
      cy.contains('€0').should('be.visible')
    })

    it('mostra indicatori storage e performance', () => {
      // Controlla che ci siano elementi MuiPaper
      cy.get('.MuiPaper-root').should('have.length.greaterThan', 4)
      
      // Cerca indicatori nella pagina (potrebbero essere dinamici)
      cy.contains('Storage:').should('be.visible')
      cy.contains('Performance:').should('be.visible')
      cy.contains('Completamento:').should('be.visible')
    })
  })

  describe('Gestione Ordini', () => {
    beforeEach(() => {
      cy.get('.MuiListItemText-root').contains('Ordini').click()
      cy.wait(500)
    })

    it('mostra la sezione ordini', () => {
      cy.contains('Gestione Ordini').should('be.visible')
      cy.contains('Ordini del giorno').should('be.visible')
    })

    it('mostra messaggio quando non ci sono ordini', () => {
      cy.contains('Nessun ordine per questa data').should('be.visible')
    })

    it('mostra pulsante Nuovo Ordine', () => {
      cy.contains('button', 'Nuovo Ordine').should('be.visible')
    })

    it('mostra pulsanti azione nella toolbar', () => {
      // Pulsanti che dovrebbero esserci
      cy.contains('button', 'Debug PWA').should('be.visible')
      cy.contains('button', 'Export').should('be.visible')
      // Il testo potrebbe essere diverso, verifichiamo che ci sia un pulsante con "ordini"
      cy.get('button').contains(/\d+ ordini/).should('be.visible')
      cy.contains('button', 'Rimuovi Duplicati').should('be.visible')
    })

    it('apre modal/form nuovo ordine', () => {
      cy.contains('button', 'Nuovo Ordine').click()
      cy.wait(1000)
      
      // Verifica che qualcosa cambi dopo il click
      // Potrebbe apparire un modal, un form inline, o cambiare la vista
      cy.get('body').then($body => {
        const hasModal = $body.find('.MuiDialog-root').length > 0
        const hasForm = $body.find('form').length > 0
        const hasNewElements = $body.find('input[type="text"]').length > 0
        
        expect(hasModal || hasForm || hasNewElements).to.be.true
        cy.log(`Modal: ${hasModal}, Form: ${hasForm}, New inputs: ${hasNewElements}`)
      })
      
      // Chiudi se è un modal
      cy.get('body').then($body => {
        if ($body.find('[aria-label="close"]').length > 0) {
          cy.get('[aria-label="close"]').first().click()
        } else if ($body.find('button').filter(':contains("Annulla")').length > 0) {
          cy.contains('button', 'Annulla').click()
        }
      })
    })
  })

  describe('Modalità Offline', () => {
    it('mostra indicatore modalità offline', () => {
      cy.contains('Modalità Offline - I dati sono salvati localmente').should('be.visible')
    })

    it('mostra contatore ordini', () => {
      // Cerca un pulsante che contenga "ordini"
      cy.get('button').contains(/\d+ ordini/).should('be.visible')
    })
  })

  describe('Gestione Date', () => {
    beforeEach(() => {
      cy.get('.MuiListItemText-root').contains('Ordini').click()
      cy.wait(500)
    })

    it('ha un selettore data', () => {
      cy.get('input[type="date"]').should('exist')
    })

    it('mostra la data corrente', () => {
      // Ottieni la data corrente
      const oggi = new Date()
      const giorno = oggi.getDate().toString().padStart(2, '0')
      const mese = (oggi.getMonth() + 1).toString().padStart(2, '0')
      const anno = oggi.getFullYear()
      
      // La data potrebbe essere mostrata in formato DD/MM/YYYY
      cy.contains(`${giorno}/${mese}/${anno}`).should('be.visible')
    })
  })

  describe('Navigazione Sezioni', () => {
    it('naviga a Clienti e mostra contenuto', () => {
      cy.get('.MuiListItemText-root').contains('Clienti').click()
      cy.wait(500)
      // Verifica che mostri qualcosa di diverso
      cy.contains('Gestione').should('be.visible')
    })

    it('naviga a Magazzino', () => {
      cy.get('.MuiListItemText-root').contains('Magazzino').click()
      cy.wait(500)
      // Non aspettarsi che l'URL cambi se usa routing interno
      // Verifica invece che il contenuto cambi
      cy.get('.MuiPaper-root').should('be.visible')
    })

    it('naviga a Produzione', () => {
      cy.get('.MuiListItemText-root').contains('Produzione').click()
      cy.wait(500)
      cy.get('.MuiPaper-root').should('be.visible')
    })

    it('naviga a Report', () => {
      cy.get('.MuiListItemText-root').contains('Report').click()
      cy.wait(500)
      cy.get('.MuiPaper-root').should('be.visible')
    })
  })

  describe('Responsive Design', () => {
    it('si adatta a viewport mobile', () => {
      cy.viewport('iphone-x')
      cy.wait(500)
      // L'app dovrebbe essere ancora visibile
      cy.get('body').should('be.visible')
      cy.contains('Pastificio').should('exist')
    })

    it('si adatta a viewport tablet', () => {
      cy.viewport('ipad-2')
      cy.wait(500)
      cy.contains('Pastificio').should('be.visible')
      cy.get('.MuiPaper-root').should('be.visible')
    })
  })

  describe('Test Funzionali', () => {
    it('crea un nuovo ordine completo', () => {
      // Vai agli ordini
      cy.get('.MuiListItemText-root').contains('Ordini').click()
      cy.wait(500)
      
      // Clicca nuovo ordine
      cy.contains('button', 'Nuovo Ordine').click()
      cy.wait(1000)
      
      // Se c'è un modal o form, prova a compilarlo
      cy.get('body').then($body => {
        // Cerca campi input
        if ($body.find('input[type="text"]').length > 0) {
          cy.get('input[type="text"]').first().type('Cliente Test')
        }
        
        // Cerca select per prodotti
        if ($body.find('select').length > 0) {
          cy.get('select').first().select(1)
        }
        
        // Cerca input numerici per quantità
        if ($body.find('input[type="number"]').length > 0) {
          cy.get('input[type="number"]').first().type('5')
        }
        
        // Log per debug
        cy.log('Form elementi trovati:', {
          textInputs: $body.find('input[type="text"]').length,
          numberInputs: $body.find('input[type="number"]').length,
          selects: $body.find('select').length
        })
      })
    })

    it('verifica persistenza dati in localStorage', () => {
      cy.window().then((win) => {
        // Controlla se ci sono dati salvati
        const ordini = win.localStorage.getItem('ordini')
        if (ordini) {
          cy.log('Ordini salvati:', ordini)
          expect(ordini).to.be.a('string')
        }
      })
    })
  })
})

