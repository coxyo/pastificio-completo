// content.js - 3CX Call Detector v3.6.7
// Data: 13/01/2026 ore 10:45
// FIX: Blocco webhook multipli durante stessa sessione chiamata

(function() {
    'use strict';

    const CONFIG = {
        CHECK_INTERVAL: 5000,
        COOLDOWN_MS: 90000,
        MAX_HISTORY: 50,
        DEBUG: true,
        VERSION: '3.6.7'  // Fix invii multipli
    };

    const STATE = {
        intervalId: null,
        lastNumber: null,
        lastWebhookTime: 0,
        callsProcessed: new Set(),
        isInitialized: false,
        lastCallState: false,
        webhookSentThisSession: false,  // ✅ NUOVO: Blocca invii multipli per sessione
        currentCallId: null              // ✅ NUOVO: ID sessione chiamata
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
    log('Init v3.6.7 - Fix invii multipli');
    log('Cooldown: ' + (CONFIG.COOLDOWN_MS/1000) + 's');

    // ✅ NUOVO: Verifica SOLO .callNumber con numero
    function isCallActive() {
        // FASE 1: Verifica .callNumber SOLO se contiene numero valido
        const callNumbers = document.querySelectorAll('.callNumber');
        for (const el of callNumbers) {
            const text = el.textContent.trim();
            // DEVE contenere almeno 10 digit consecutivi
            if (/\d{10,}/.test(text) || /\+\d{9,}/.test(text)) {
                log('CHIAMATA ATTIVA rilevata da: .callNumber con numero');
                return true;
            }
        }

        // FASE 2: Verifica indicatori forti con numero
        const strongIndicators = [
            '.call-popup:not([style*="display: none"])',
            '[data-call-state="ringing"]',
            '[data-call-state="incoming"]',
            'button[class*="answer"]'
        ];
        
        for (const selector of strongIndicators) {
            const el = document.querySelector(selector);
            if (el) {
                const style = window.getComputedStyle(el);
                if (style.display !== 'none' && style.visibility !== 'hidden') {
                    // Verifica che ci sia un numero nel contesto
                    const parent = el.closest('.call-popup, .incoming-call, [class*="call"]');
                    if (parent && /\d{10,}/.test(parent.textContent)) {
                        log('CHIAMATA ATTIVA rilevata da:', selector);
                        return true;
                    }
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
            'app-call-control .callNumber'
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
                    
                    if (el.textContent) {
                        const numero = cleanNumber(el.textContent);
                        if (isValidNumber(numero)) {
                            log('NUMERO (text):', numero, 'da:', selector);
                            return numero;
                        }
                    }
                }
            }

            // FASE 2: FALLBACK REGEX con preferenza +39
            log('Fallback: Ricerca universale...');
            
            const phonePattern = /(\+?\d{10,15})/g;
            const allElements = document.querySelectorAll('*');
            let candidates = [];
            
            for (const el of allElements) {
                const style = window.getComputedStyle(el);
                if (style.display === 'none' || style.visibility === 'hidden') {
                    continue;
                }
                
                if (el.children.length > 0) continue;
                
                const text = el.textContent.trim();
                if (text.length > 0) {
                    const matches = text.match(phonePattern);
                    if (matches) {
                        for (const match of matches) {
                            const numero = cleanNumber(match);
                            if (isValidNumber(numero)) {
                                candidates.push({
                                    numero: numero,
                                    element: el.tagName,
                                    hasPlus39: numero.startsWith('+39')
                                });
                            }
                        }
                    }
                }
            }
            
            // Preferisci numeri italiani +39
            const italian = candidates.find(c => c.hasPlus39);
            if (italian) {
                log('NUMERO (REGEX +39):', italian.numero);
                log('Candidati totali:', candidates.length);
                return italian.numero;
            }
            
            // Fallback su primo valido
            if (candidates.length > 0) {
                log('NUMERO (REGEX fallback):', candidates[0].numero);
                log('WARNING: Numero senza +39!');
                return candidates[0].numero;
            }

            log('REGEX fallito - nessun numero trovato');
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
        if (!numero || numero.length < 10) return false;
        
        // Numeri italiani con +39
        if (numero.startsWith('+39')) {
            return /^\+39\d{9,10}$/.test(numero);
        }
        
        // Numeri con prefisso internazionale
        if (numero.startsWith('+')) {
            return /^\+\d{10,14}$/.test(numero);
        }
        
        // Numeri senza prefisso (10+ cifre)
        return /^\d{10,15}$/.test(numero);
    }

    async function sendWebhook(numero) {
        try {
            const now = Date.now();
            
            // ✅ NUOVO: Blocca se già inviato in questa sessione
            if (STATE.webhookSentThisSession) {
                log('SKIP - Webhook già inviato in questa sessione');
                return;
            }
            
            // Cooldown per stesso numero
            if (STATE.lastNumber === numero) {
                const timeSince = now - STATE.lastWebhookTime;
                if (timeSince < CONFIG.COOLDOWN_MS) {
                    log('COOLDOWN attivo - Skip (' + Math.round((CONFIG.COOLDOWN_MS - timeSince)/1000) + 's)');
                    return;
                }
            }
            
            // ✅ IMPORTANTE: Aggiorna STATE PRIMA di inviare
            STATE.lastNumber = numero;
            STATE.lastWebhookTime = now;
            STATE.webhookSentThisSession = true;  // ✅ Blocca invii successivi
            STATE.currentCallId = 'CALL-' + now + '-' + Math.random().toString(36).substr(2, 9);

            log('INVIO webhook per:', numero);

            const payload = {
                numero: numero,
                timestamp: new Date().toISOString(),
                callId: STATE.currentCallId
            };

            chrome.runtime.sendMessage(
                { type: 'SEND_WEBHOOK', data: payload },
                function(response) {
                    if (chrome.runtime.lastError) {
                        log('ERROR:', chrome.runtime.lastError.message);
                        // Reset flag per permettere retry
                        STATE.webhookSentThisSession = false;
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
                        // Reset flag per permettere retry
                        STATE.webhookSentThisSession = false;
                    }
                }
            );

        } catch (error) {
            log('ERROR sendWebhook:', error);
            STATE.webhookSentThisSession = false;
        }
    }

    async function checkNewCalls() {
        try {
            const callActive = isCallActive();
            
            // CHIAMATA INIZIATA
            if (callActive && !STATE.lastCallState) {
                log('=== CHIAMATA INIZIATA ===');
                STATE.lastCallState = true;
                STATE.webhookSentThisSession = false;  // ✅ Reset per nuova chiamata
                
                const numero = extractCallerNumber();
                if (numero) {
                    log('NUOVA CHIAMATA:', numero);
                    await sendWebhook(numero);
                } else {
                    log('WARNING: Chiamata attiva ma numero non trovato');
                }
            }
            // CHIAMATA IN CORSO - Non inviare altri webhook
            else if (callActive && STATE.lastCallState) {
                // Non fare nulla, webhook già inviato
            }
            // CHIAMATA TERMINATA
            else if (!callActive && STATE.lastCallState) {
                log('=== CHIAMATA TERMINATA ===');
                STATE.lastCallState = false;
                STATE.webhookSentThisSession = false;  // ✅ Reset per prossima chiamata
                STATE.currentCallId = null;
            }

        } catch (error) {
            log('ERROR check:', error);
        }
    }

    function setupDomObserver() {
        try {
            let timeoutId = null;
            
            const observer = new MutationObserver(function(mutations) {
                // ✅ IMPORTANTE: Non triggerare se già in chiamata e webhook inviato
                if (STATE.lastCallState && STATE.webhookSentThisSession) {
                    return;
                }
                
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
            STATE.webhookSentThisSession = false;  // Reset per test
            sendWebhook(testNum);
            sendResponse({ success: true });
            return true;
        }

        if (message.type === 'reset-cooldown') {
            STATE.lastWebhookTime = 0;
            STATE.lastNumber = null;
            STATE.lastCallState = false;
            STATE.webhookSentThisSession = false;
            STATE.currentCallId = null;
            log('RESET completo');
            sendResponse({ success: true });
        }

        return false;
    });

    function init() {
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
            STATE.webhookSentThisSession = false;
            sendWebhook(n || '+393271234567'); 
        },
        extract: extractCallerNumber,
        isActive: isCallActive,
        reset: function() { 
            STATE.lastNumber = null; 
            STATE.lastWebhookTime = 0;
            STATE.lastCallState = false;
            STATE.webhookSentThisSession = false;
            STATE.currentCallId = null;
            log('🔄 Reset completo OK');
        },
        state: function() {
            return {
                lastNumber: STATE.lastNumber,
                callActive: isCallActive(),
                lastCallState: STATE.lastCallState,
                webhookSentThisSession: STATE.webhookSentThisSession,
                currentCallId: STATE.currentCallId,
                cooldownRemaining: Math.max(0, CONFIG.COOLDOWN_MS - (Date.now() - STATE.lastWebhookTime))
            };
        }
    };

    log('✅ Helper: window._3cxDetector pronto');

})();