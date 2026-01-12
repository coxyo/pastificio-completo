// content.js - 3CX Call Detector v3.6.2
// Data: 12/01/2026 ore 08:15
// Fallback REGEX universale per estrazione numero

(function() {
    'use strict';

    const CONFIG = {
        CHECK_INTERVAL: 5000,
        COOLDOWN_MS: 90000,
        MAX_HISTORY: 50,
        DEBUG: true,
        VERSION: '3.6.6'  // Fix chiamate fantasma
    };

    const STATE = {
        intervalId: null,
        lastNumber: null,
        lastWebhookTime: 0,
        callsProcessed: new Set(),
        isInitialized: false,
        lastCallState: false
    };

    function log(message, data = null) {
        if (!CONFIG.DEBUG) return;
        const timestamp = new Date().toLocaleTimeString('it-IT');
        const prefix = '[3CX v' + CONFIG.VERSION + ' ' + timestamp + ']';
        
        if (data) {
            console.log(prefix + ' ' + message, data);
        } else {
            console.log(prefix + ' ' + message);
        }
    }

    log('AVVIATO - Fix chiamate fantasma');

    function isCallActive() {
        // FASE 1: Verifica indicatori forti
        const strongIndicators = [
            '.call-popup:not([style*="display: none"])',
            '.incoming-call-dialog:not([style*="display: none"])',
            '[role="dialog"][class*="call"]',
            '[data-call-state="ringing"]',
            '[data-call-state="incoming"]',
            'button[class*="answer"]',
            'button[class*="accept"]'
        ];
        
        for (const selector of strongIndicators) {
            const el = document.querySelector(selector);
            if (el) {
                const style = window.getComputedStyle(el);
                if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
                    log('CHIAMATA ATTIVA rilevata da:', selector);
                    return true;
                }
            }
        }
        
        // FASE 2: Verifica .callNumber SOLO se contiene numero valido
        const callNumbers = document.querySelectorAll('.callNumber');
        for (const el of callNumbers) {
            const style = window.getComputedStyle(el);
            if (style.display !== 'none' && style.visibility !== 'hidden') {
                const text = el.textContent.trim();
                // DEVE contenere almeno 10 digit consecutivi
                if (/\d{10,}/.test(text)) {
                    log('CHIAMATA ATTIVA rilevata da: .callNumber con numero');
                    return true;
                }
            }
        }
        
        // FASE 3: Verifica classi ringing
        const ringingElements = document.querySelectorAll('[class*="ringing"]');
        for (const el of ringingElements) {
            const style = window.getComputedStyle(el);
            if (style.display !== 'none' && style.visibility !== 'hidden') {
                // Verifica se c'è anche un numero visibile
                if (el.textContent.match(/\+?\d{10,}/)) {
                    log('CHIAMATA ATTIVA rilevata da: ringing con numero');
                    return true;
                }
            }
        }
        
        return false;
    }

    const SELECTORS = {
        callerNumber: [
            '.callNumber',
            '[data-qa="call-status"]',
            'caller-info .callNumber',
            'call-view .callNumber',
            'active-call [data-qa="call-status"]',
            'app-call-control .callNumber',
            '.call-popup .caller-number',
            '.incoming-call .call-number',
            '[role="dialog"] [data-number]'
        ]
    };

    function extractCallerNumber() {
        if (!isCallActive()) {
            return null;
        }
        
        try {
            // FASE 1: Selettori CSS specifici
            for (const selector of SELECTORS.callerNumber) {
                const elements = document.querySelectorAll(selector);
                
                for (const el of elements) {
                    const style = window.getComputedStyle(el);
                    
                    if (style.display === 'none' || 
                        style.visibility === 'hidden' || 
                        style.opacity === '0') {
                        continue;
                    }
                    
                    if (el.dataset && el.dataset.number) {
                        const numero = cleanNumber(el.dataset.number);
                        if (isValidNumber(numero)) {
                            log('NUMERO (dataset):', numero);
                            return numero;
                        }
                    }
                    
                    if (el.textContent) {
                        const numero = cleanNumber(el.textContent);
                        if (isValidNumber(numero)) {
                            log('NUMERO (text):', numero, 'da:', selector);
                            return numero;
                        }
                    }
                }
            }

            // FASE 2: FALLBACK REGEX
            log('Fallback: Ricerca universale...');
            
            // Pattern aggressivo: cattura QUALSIASI sequenza 10-15 digit
            const phonePattern = /(\+?\d{10,15})/g;
            const allElements = document.querySelectorAll('*');
            
            let attempts = 0;
            let candidates = []; // Salva tutti i candidati
            
            for (const el of allElements) {
                attempts++;
                
                const style = window.getComputedStyle(el);
                if (style.display === 'none' || style.visibility === 'hidden') {
                    continue;
                }
                
                const text = el.textContent.trim();
                
                // Cerca pattern telefono
                if (text.length > 0) {
                    const matches = text.match(phonePattern);
                    if (matches && matches.length > 0) {
                        for (const match of matches) {
                            const numero = cleanNumber(match);
                            if (isValidNumber(numero)) {
                                candidates.push({
                                    numero: numero,
                                    element: el,
                                    text: text.substring(0, 50)
                                });
                            }
                        }
                    }
                }
            }
            
            // Preferisci numeri con +39
            const italian = candidates.find(c => c.numero.startsWith('+39'));
            if (italian) {
                log('NUMERO (REGEX +39):', italian.numero);
                log('Elemento:', italian.element.tagName);
                log('Candidati totali:', candidates.length);
                return italian.numero;
            }
            
            // Altrimenti prendi il primo valido
            if (candidates.length > 0) {
                log('NUMERO (REGEX fallback):', candidates[0].numero);
                log('WARNING: Numero senza +39!');
                log('Candidati totali:', candidates.length);
                return candidates[0].numero;
            }
            
            log('REGEX fallito dopo', attempts, 'tentativi');

            return null;

        } catch (error) {
            log('ERROR estrazione:', error);
            return null;
        }
    }

    function cleanNumber(str) {
        if (!str) return '';
        let cleaned = str.replace(/[^\d+]/g, '');
        if (cleaned.startsWith('00')) {
            cleaned = '+' + cleaned.substring(2);
        }
        return cleaned;
    }

    function isValidNumber(numero) {
        if (!numero || numero.length < 8) return false;
        
        // SOLO numeri italiani con +39
        if (numero.startsWith('+39')) {
            // +39 seguito da 9-10 digit
            const pattern = /^\+39\d{9,10}$/;
            return pattern.test(numero);
        }
        
        // Accetta anche numeri senza +39 ma con 10+ digit
        if (numero.length >= 10) {
            const pattern = /^\d{10,15}$/;
            return pattern.test(numero);
        }
        
        return false;
    }

    async function sendWebhook(numero) {
        try {
            const now = Date.now();
            
            if (STATE.lastNumber === numero) {
                const timeSince = now - STATE.lastWebhookTime;
                if (timeSince < CONFIG.COOLDOWN_MS) {
                    log('COOLDOWN attivo - Skip (' + Math.round((CONFIG.COOLDOWN_MS - timeSince)/1000) + 's)');
                    return;
                }
            }
            
            STATE.lastNumber = numero;
            STATE.lastWebhookTime = now;

            log('INVIO webhook per:', numero);

            const payload = {
                numero: numero,
                timestamp: new Date().toISOString(),
                callId: 'CALL-' + now + '-' + Math.random().toString(36).substr(2, 9)
            };

            chrome.runtime.sendMessage(
                { type: 'SEND_WEBHOOK', data: payload },
                function(response) {
                    if (chrome.runtime.lastError) {
                        log('ERROR:', chrome.runtime.lastError.message);
                        return;
                    }

                    if (response && response.success) {
                        log('OK Webhook inviato');
                        STATE.callsProcessed.add(numero);
                        
                        chrome.storage.local.set({
                            lastNumber: numero,
                            lastWebhookTime: now
                        });
                    } else {
                        log('ERROR webhook:', response ? response.error : 'unknown');
                    }
                }
            );

        } catch (error) {
            log('ERROR sendWebhook:', error);
        }
    }

    async function checkNewCalls() {
        try {
            const callActive = isCallActive();
            
            if (callActive && !STATE.lastCallState) {
                log('=== CHIAMATA INIZIATA ===');
                STATE.lastCallState = true;
                
                const numero = extractCallerNumber();
                if (numero) {
                    log('NUOVA CHIAMATA:', numero);
                    await sendWebhook(numero);
                } else {
                    log('WARNING: Chiamata attiva ma numero non trovato');
                }
                
            } else if (!callActive && STATE.lastCallState) {
                log('=== CHIAMATA TERMINATA ===');
                STATE.lastCallState = false;
                STATE.lastNumber = null;
            }

        } catch (error) {
            log('ERROR check:', error);
        }
    }

    function setupDomObserver() {
        try {
            let timeoutId = null;
            
            const observer = new MutationObserver(function(mutations) {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(checkNewCalls, 500);
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['class', 'style']
            });

            log('Observer attivo (debounced)');

        } catch (error) {
            log('WARNING Observer:', error);
        }
    }

    chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
        if (message.type === 'get-state') {
            sendResponse({
                state: STATE,
                config: CONFIG,
                callActive: isCallActive()
            });
        }

        if (message.type === 'test-call') {
            const testNum = message.number || '+393271234567';
            log('TEST manuale:', testNum);
            sendWebhook(testNum);
            sendResponse({ success: true });
            return true;
        }

        if (message.type === 'reset-cooldown') {
            STATE.lastWebhookTime = 0;
            STATE.lastNumber = null;
            STATE.lastCallState = false;
            log('RESET completo');
            sendResponse({ success: true });
        }

        return false;
    });

    function init() {
        log('Init v3.6.6 - Fix chiamate fantasma');
        log('Check ogni ' + (CONFIG.CHECK_INTERVAL/1000) + 's');
        log('Cooldown: ' + (CONFIG.COOLDOWN_MS/1000) + 's');

        chrome.storage.local.get(['lastNumber', 'lastWebhookTime'], function(result) {
            if (result.lastNumber) STATE.lastNumber = result.lastNumber;
            if (result.lastWebhookTime) STATE.lastWebhookTime = result.lastWebhookTime;
        });

        STATE.intervalId = setInterval(checkNewCalls, CONFIG.CHECK_INTERVAL);
        setupDomObserver();
        
        log('Init OK');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window._3cxDetector = {
        version: CONFIG.VERSION,
        test: function(n) { 
            sendWebhook(n || '+393271234567'); 
        },
        extract: extractCallerNumber,
        isActive: isCallActive,
        reset: function() { 
            STATE.lastNumber = null; 
            STATE.lastWebhookTime = 0;
            STATE.lastCallState = false;
            log('Reset completo OK');
        },
        state: function() {
            return {
                lastNumber: STATE.lastNumber,
                callActive: isCallActive(),
                lastCallState: STATE.lastCallState,
                cooldownRemaining: Math.max(0, CONFIG.COOLDOWN_MS - (Date.now() - STATE.lastWebhookTime))
            };
        },
        debug: function() {
            log('=== DEBUG INFO ===');
            log('isCallActive:', isCallActive());
            log('lastCallState:', STATE.lastCallState);
            log('lastNumber:', STATE.lastNumber);
            log('Cooldown remaining:', Math.round((CONFIG.COOLDOWN_MS - (Date.now() - STATE.lastWebhookTime))/1000) + 's');
            
            log('Selettori testati:');
            SELECTORS.callerNumber.forEach(sel => {
                const found = document.querySelectorAll(sel);
                if (found.length > 0) {
                    log(' OK', sel, ':', found.length, 'elementi');
                    found.forEach(el => {
                        if (el.textContent.match(/\d{8,}/)) {
                            log('    -> Contiene numero:', el.textContent.trim());
                        }
                    });
                }
            });
        }
    };

    log('Helper: window._3cxDetector pronto');

})();