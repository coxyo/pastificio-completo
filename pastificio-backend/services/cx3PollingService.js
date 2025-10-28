// Backend: services/cx3PollingService.js
setInterval(async () => {
  const response = await fetch('https://1655.3cx.cloud/api/ActiveCalls', {
    headers: { 'Authorization': 'Bearer YOUR_3CX_TOKEN' }
  });
  
  const calls = await response.json();
  
  // Per ogni nuova chiamata
  calls.forEach(call => {
    // Invia evento Pusher
    pusher.trigger('chiamate', 'nuova-chiamata', {
      callId: call.Id,
      numero: call.CallerNumber,
      cliente: { nome: call.CallerName }
    });
  });
}, 5000); // Ogni 5 secondi
```

---
