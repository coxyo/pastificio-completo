// pastificio-frontend-final/src/components/ClickToCallButton.js
import React, { useState } from 'react';
import { Phone, PhoneCall, PhoneOff, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-backend-production.up.railway.app';

const ClickToCallButton = ({ 
  numero, 
  clienteId, 
  clienteNome,
  size = 'default', // 'small', 'default', 'large'
  variant = 'default' // 'default', 'ghost', 'outline'
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [callId, setCallId] = useState(null);
  
  const handleCall = async () => {
    try {
      setIsLoading(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Devi effettuare il login');
        return;
      }
      
      const response = await axios.post(
        `${API_URL}/api/cx3/call`,
        {
          numero,
          clienteId,
          clienteNome
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        setIsActive(true);
        setCallId(response.data.callId);
        
        toast.success(`📞 Chiamata in corso verso ${numero}`, {
          position: 'top-right',
          autoClose: 3000
        });
        
        // Auto-reset dopo 5 secondi
        setTimeout(() => {
          setIsActive(false);
          setCallId(null);
        }, 5000);
      }
      
    } catch (error) {
      console.error('Errore click-to-call:', error);
      toast.error(error.response?.data?.message || 'Errore durante la chiamata');
      
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleHangup = async () => {
    if (!callId) return;
    
    try {
      const token = localStorage.getItem('token');
      
      await axios.post(
        `${API_URL}/api/cx3/hangup/${callId}`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      toast.info('Chiamata terminata');
      setIsActive(false);
      setCallId(null);
      
    } catch (error) {
      console.error('Errore hangup:', error);
    }
  };
  
  // Classi CSS dinamiche
  const sizeClasses = {
    small: 'p-1.5',
    default: 'p-2',
    large: 'p-3'
  };
  
  const iconSizes = {
    small: 'w-4 h-4',
    default: 'w-5 h-5',
    large: 'w-6 h-6'
  };
  
  const variantClasses = {
    default: isActive 
      ? 'bg-green-500 hover:bg-green-600 text-white'
      : 'bg-blue-500 hover:bg-blue-600 text-white',
    ghost: isActive
      ? 'text-green-600 hover:bg-green-50'
      : 'text-blue-600 hover:bg-blue-50',
    outline: isActive
      ? 'border border-green-500 text-green-600 hover:bg-green-50'
      : 'border border-blue-500 text-blue-600 hover:bg-blue-50'
  };
  
  if (!numero) {
    return null;
  }
  
  return (
    <button
      onClick={isActive ? handleHangup : handleCall}
      disabled={isLoading}
      className={`
        rounded-lg transition-all duration-200 
        disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center justify-center
        ${sizeClasses[size]}
        ${variantClasses[variant]}
      `}
      title={isActive ? 'Termina chiamata' : `Chiama ${numero}`}
    >
      {isLoading ? (
        <Loader2 className={`${iconSizes[size]} animate-spin`} />
      ) : isActive ? (
        <PhoneOff className={`${iconSizes[size]} animate-pulse`} />
      ) : (
        <Phone className={iconSizes[size]} />
      )}
    </button>
  );
};

export default ClickToCallButton;