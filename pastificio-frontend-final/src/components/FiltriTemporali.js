// src/components/FiltriTemporali.js
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const FiltriTemporali = ({ value, onChange }) => {
  return (
    <div className="flex items-center gap-4 mb-6">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Seleziona periodo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="oggi">Oggi</SelectItem>
          <SelectItem value="settimana">Questa Settimana</SelectItem>
          <SelectItem value="mese">Questo Mese</SelectItem>
          <SelectItem value="anno">Quest'Anno</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default FiltriTemporali;