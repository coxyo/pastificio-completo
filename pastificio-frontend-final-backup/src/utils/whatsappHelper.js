// src/utils/whatsappHelper.js

class WhatsAppHelper {
  static formatMessage(ordine) {
    if (!ordine) return '';

    const formatDate = (dateString) => {
      if (!dateString) return 'Data non specificata';
      const date = new Date(dateString);
      return date.toLocaleDateString('it-IT', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    };

    const formatTime = (timeString) => {
      if (!timeString) return '';
      return timeString;
    };

    // Header dell'ordine
    let message = `🍝 *ORDINE CONFERMATO* 🍝\n`;
    message += `Ordine: #${ordine.numeroOrdine || 'N/D'}\n\n`;
    
    // Info cliente
    message += `👤 *CLIENTE*\n`;
    message += `${ordine.cliente || 'Cliente non specificato'}\n`;
    if (ordine.telefono) {
      message += `📞 ${ordine.telefono}\n`;
    }
    message += `\n`;

    // Data consegna
    message += `📅 *CONSEGNA*\n`;
    message += `${formatDate(ordine.dataConsegna)}`;
    if (ordine.orarioConsegna) {
      message += ` alle ${formatTime(ordine.orarioConsegna)}`;
    }
    message += `\n\n`;

    // Prodotti
    message += `📦 *PRODOTTI ORDINATI*\n`;
    message += `────────────────\n`;
    
    if (ordine.prodotti && Array.isArray(ordine.prodotti)) {
      ordine.prodotti.forEach(item => {
        if (item.quantita && item.quantita > 0) {
          message += `• ${item.nome}: ${item.quantita} ${item.unitaMisura || 'pz'}\n`;
        }
      });
    } else {
      message += `Nessun prodotto specificato\n`;
    }
    
    message += `────────────────\n\n`;

    // Totale
    message += `💰 *TOTALE*: €${(ordine.totale || 0).toFixed(2)}\n\n`;

    // Note
    if (ordine.note && ordine.note.trim()) {
      message += `📝 *NOTE*:\n${ordine.note}\n\n`;
    }

    // Footer
    message += `✅ _Ordine ricevuto e confermato_\n`;
    message += `_Vi aspettiamo!_\n\n`;
    message += `Per info: 📞 Tel. Pastificio`;

    return message;
  }

  static copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text)
        .then(() => true)
        .catch((err) => {
          console.error('Errore clipboard API:', err);
          return this.fallbackCopyToClipboard(text);
        });
    } else {
      return Promise.resolve(this.fallbackCopyToClipboard(text));
    }
  }

  static fallbackCopyToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.top = "-9999px";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch (err) {
      console.error('Errore fallback copy:', err);
      document.body.removeChild(textArea);
      return false;
    }
  }

  static async sendWhatsAppMessage(ordine, phoneNumber) {
    const message = this.formatMessage(ordine);
    const success = await this.copyToClipboard(message);
    
    if (success) {
      // Apri WhatsApp Web con il numero precompilato
      const whatsappUrl = phoneNumber 
        ? `https://wa.me/${phoneNumber.replace(/\D/g, '')}`
        : 'https://web.whatsapp.com/';
      
      window.open(whatsappUrl, '_blank');
      
      return {
        success: true,
        message: 'Messaggio copiato! Incollalo su WhatsApp'
      };
    } else {
      return {
        success: false,
        message: 'Errore nella copia del messaggio'
      };
    }
  }
}

// Export per CommonJS e ES6
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WhatsAppHelper;
} else {
  window.WhatsAppHelper = WhatsAppHelper;
}

export default WhatsAppHelper;