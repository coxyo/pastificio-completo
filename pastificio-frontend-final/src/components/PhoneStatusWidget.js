// pastificio-frontend-final/src/components/PhoneStatusWidget.js
import React, { useState, useEffect } from 'react';
import { Phone, PhoneIncoming, PhoneMissed, PhoneOff, Wifi, WifiOff } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-backend-production.up.railway.app';

const PhoneStatusWidget = () => {
  const [status, setStatus] = useState({
    connected: false,
    extension: '',
    state: 'offline', // 'available', 'busy', 'ringing', 'offline'
    devices: [],
    currentCall: null
  });
  
  const [stats, setStats] = useState({
    totaleChiamate: 0,
    chiamateRisposte: 0,
    chiamateNonRisposte: 0
  });
  
  useEffect(() => {
    fetchStatus();
    fetchStats();
    
    // Polling ogni 10 secondi
    const interval = setInterval(() => {
      fetchStatus();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);
  
  const fetchStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await axios.get(`${API_URL}/api/cx3/status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setStatus({
          connected: true,
          extension: response.data.extension,
          state: response.data.status,
          devices: response.data.devices,
          currentCall: response.data.currentCall
        });
      }
      
    } catch (error) {
      console.error('Errore fetch status:', error);
      setStatus(prev => ({ ...prev, connected: false }));
    }
  };
  
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      // Statistiche oggi
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const response = await axios.get(`${API_URL}/api/cx3/stats`, {
        params: {
          startDate: today.toISOString()
        },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setStats(response.data.statistiche);
      }
      
    } catch (error) {
      console.error('Errore fetch stats:', error);
    }
  };
  
  const getStatusColor = () => {
    if (!status.connected) return 'bg-red-500';
    
    switch (status.state) {
      case 'available':
        return 'bg-green-500';
      case 'busy':
      case 'ringing':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-gray-400';
      default:
        return 'bg-gray-400';
    }
  };
  
  const getStatusText = () => {
    if (!status.connected) return 'Disconnesso';
    
    switch (status.state) {
      case 'available':
        return 'Disponibile';
      case 'busy':
        return 'Occupato';
      case 'ringing':
        return 'Squillo in corso';
      case 'offline':
        return 'Offline';
      default:
        return 'Sconosciuto';
    }
  };
  
  const getStatusIcon = () => {
    if (!status.connected) {
      return <WifiOff className="w-4 h-4" />;
    }
    
    switch (status.state) {
      case 'available':
        return <Phone className="w-4 h-4" />;
      case 'busy':
        return <PhoneOff className="w-4 h-4" />;
      case 'ringing':
        return <PhoneIncoming className="w-4 h-4 animate-bounce" />;
      default:
        return <PhoneOff className="w-4 h-4" />;
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">
          Stato Telefono
        </h3>
        
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${getStatusColor()} animate-pulse`} />
          <span className="text-xs text-gray-600">
            Ext {status.extension || '19810'}
          </span>
        </div>
      </div>
      
      {/* Status */}
      <div className="flex items-center space-x-3 mb-4">
        <div className={`p-3 rounded-full ${getStatusColor()} text-white`}>
          {getStatusIcon()}
        </div>
        
        <div>
          <p className="text-sm font-medium text-gray-900">
            {getStatusText()}
          </p>
          
          {status.currentCall && (
            <p className="text-xs text-gray-500">
              In chiamata con {status.currentCall.number}
            </p>
          )}
          
          {status.devices.length > 0 && (
            <p className="text-xs text-gray-500">
              {status.devices.length} dispositivi connessi
            </p>
          )}
        </div>
      </div>
      
      {/* Statistiche Oggi */}
      <div className="border-t pt-3 space-y-2">
        <p className="text-xs font-semibold text-gray-600 uppercase">
          Oggi
        </p>
        
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-blue-50 rounded p-2">
            <p className="text-lg font-bold text-blue-600">
              {stats.totaleChiamate}
            </p>
            <p className="text-xs text-gray-600">Totale</p>
          </div>
          
          <div className="bg-green-50 rounded p-2">
            <p className="text-lg font-bold text-green-600">
              {stats.chiamateRisposte}
            </p>
            <p className="text-xs text-gray-600">Risposte</p>
          </div>
          
          <div className="bg-red-50 rounded p-2">
            <p className="text-lg font-bold text-red-600">
              {stats.chiamateNonRisposte}
            </p>
            <p className="text-xs text-gray-600">Perse</p>
          </div>
        </div>
      </div>
      
      {/* Devices */}
      {status.devices.length > 0 && (
        <div className="border-t mt-3 pt-3">
          <p className="text-xs font-semibold text-gray-600 uppercase mb-2">
            Dispositivi
          </p>
          
          <div className="space-y-1">
            {status.devices.slice(0, 3).map((device, idx) => (
              <div 
                key={idx}
                className="flex items-center justify-between text-xs bg-gray-50 rounded px-2 py-1"
              >
                <span className="text-gray-700">{device.name}</span>
                <div className={`w-1.5 h-1.5 rounded-full ${
                  device.registered ? 'bg-green-500' : 'bg-gray-300'
                }`} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PhoneStatusWidget;