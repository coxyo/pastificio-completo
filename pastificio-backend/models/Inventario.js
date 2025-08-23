// pastificio-backend/models/Inventario.js
import mongoose from 'mongoose';

const InventarioSchema = new mongoose.Schema({
  prodotto: {
    type: String,
    required: true,
    unique: true
  },
  quantitaAttuale: {
    type: Number,
    default: 0,
    min: 0
  },
  quantitaMinima: {
    type: Number,
    default: 0,
    min: 0
  },
  quantitaMassima: {
    type: Number,
    default: 0,
    min: 0
  },
  unita: {
    type: String,
    required: true,
    enum: ['pz', 'kg', 'l', 'conf']
  },
  prezzoUnitario: {
    type: Number,
    default: 0,
    min: 0
  },
  ultimoAggiornamento: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export default mongoose.model('Inventario', InventarioSchema);