// mobile/screens/RecipeFormScreen.js
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import {
  TextInput,
  Button,
  Chip,
  HelperText,
  IconButton,
  Divider,
  Snackbar,
  Switch,
  Menu,
  List
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';

import { AuthContext } from '../contexts/AuthContext';
import { ConnectionContext } from '../contexts/ConnectionContext';
import { 
  getRicettaById, 
  createRicetta, 
  updateRicetta, 
  getIngredienti 
} from '../services/produzioneService';

const RecipeFormScreen = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ricetta, setRicetta] = useState({
    nome: '',
    categoria: 'pasta',
    descrizione: '',
    ingredienti: [{ ingrediente: '', quantita: '', unita: 'g' }],
    tempoPreparazione: '',
    resa: { quantita: '', unita: 'kg' },
    istruzioni: [''],
    attivo: true
  });
  const [ingredienti, setIngredienti] = useState([]);
  const [errors, setErrors] = useState({});
  const [showIngredientMenu, setShowIngredientMenu] = useState(false);
  const [selectedIngredientIndex, setSelectedIngredientIndex] = useState(null);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });
  
  const { user } = useContext(AuthContext);
  const { isConnected } = useContext(ConnectionContext);
  const navigation = useNavigation();
  const route = useRoute();
  
  const { recipeId } = route.params || {};
  const isEditMode = !!recipeId;
  
  useEffect(() => {
    loadIngredienti();
    
    if (isEditMode) {
      loadRicetta();
    }
  }, [recipeId]);
  
  const loadRicetta = async () => {
    try {
      setLoading(true);
      const data = await getRicettaById(recipeId);
      
      // Formatta la ricetta per l'editing
      setRicetta({
        nome: data.nome || '',
        categoria: data.categoria || 'pasta',
        descrizione: data.descrizione || '',
        ingredienti: data.ingredienti && data.ingredienti.length > 0 
          ? data.ingredienti.map(ing => ({
              ingrediente: ing.ingrediente._id,
              quantita: ing.quantita.toString(),
              unita: ing.unita
            }))
          : [{ ingrediente: '', quantita: '', unita: 'g' }],
        tempoPreparazione: data.tempoPreparazione ? data.tempoPreparazione.toString() : '',
        resa: {
          quantita: data.resa?.quantita ? data.resa.quantita.toString() : '',
          unita: data.resa?.unita || 'kg'
        },
        istruzioni: data.istruzioni && data.istruzioni.length > 0 
          ? data.istruzioni 
          : [''],
        attivo: data.attivo !== undefined ? data.attivo : true
      });
    } catch (error) {
      Alert.alert('Errore', error.message || 'Impossibile caricare la ricetta');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };
  
  const loadIngredienti = async () => {
    try {
      const data = await getIngredienti();
      setIngredienti(data);
    } catch (error) {
      Alert.alert('Attenzione', 'Impossibile caricare gli ingredienti: ' + error.message);
    }
  };
  
  const handleChange = (name, value) => {
    setRicetta(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };
  
  const handleResaChange = (name, value) => {
    setRicetta(prev => ({
      ...prev,
      resa: {
        ...prev.resa,
        [name]: value
      }
    }));
    
    // Clear error
    if (errors.resa) {
      setErrors(prev => ({ ...prev, resa: null }));
    }
  };
  
  const handleIngredienteChange = (index, field, value) => {
    const newIngredienti = [...ricetta.ingredienti];
    newIngredienti[index][field] = value;
    
    setRicetta(prev => ({
      ...prev,
      ingredienti: newIngredienti
    }));
    
    // Clear error
    if (errors.ingredienti) {
      setErrors(prev => ({ ...prev, ingredienti: null }));
    }
  };
  
  const addIngrediente = () => {
    setRicetta(prev => ({
      ...prev,
      ingredienti: [...prev.ingredienti, { ingrediente: '', quantita: '', unita: 'g' }]
    }));
  };
  
  const removeIngrediente = (index) => {
    if (ricetta.ingredienti.length <= 1) {
      return;
    }
    
    const newIngredienti = [...ricetta.ingredienti];
    newIngredienti.splice(index, 1);
    
    setRicetta(prev => ({
      ...prev,
      ingredienti: newIngredienti
    }));
  };
  
  const handleIstruzioneChange = (index, value) => {
    const newIstruzioni = [...ricetta.istruzioni];
    newIstruzioni[index] = value;
    
    setRicetta(prev => ({
      ...prev,
      istruzioni: newIstruzioni
    }));
    
    // Clear error
    if (errors.istruzioni) {
      setErrors(prev => ({ ...prev, istruzioni: null }));
    }
  };
  
  const addIstruzione = () => {
    setRicetta(prev => ({
      ...prev,
      istruzioni: [...prev.istruzioni, '']
    }));
  };
  
  const removeIstruzione = (index) => {
    if (ricetta.istruzioni.length <= 1) {
      return;
    }
    
    const newIstruzioni = [...ricetta.istruzioni];
    newIstruzioni.splice(index, 1);
    
    setRicetta(prev => ({
      ...prev,
      istruzioni: newIstruzioni
    }));
  };
  
  const validate = () => {
    const newErrors = {};
    
    if (!ricetta.nome.trim()) {
      newErrors.nome = 'Il nome è obbligatorio';
    }
    
    if (!ricetta.categoria) {
      newErrors.categoria = 'La categoria è obbligatoria';
    }
    
    if (!ricetta.tempoPreparazione) {
      newErrors.tempoPreparazione = 'Il tempo di preparazione è obbligatorio';
    } else if (isNaN(ricetta.tempoPreparazione)) {
      newErrors.tempoPreparazione = 'Deve essere un numero';
    }
    
    if (!ricetta.resa.quantita) {
      newErrors.resa = 'La quantità di resa è obbligatoria';
    } else if (isNaN(ricetta.resa.quantita)) {
      newErrors.resa = 'Deve essere un numero';
    }
    
    // Controlla che ci sia almeno un ingrediente con quantità
    let hasValidIngredient = false;
    ricetta.ingredienti.forEach((ing, index) => {
      if (ing.ingrediente && ing.quantita) {
        hasValidIngredient = true;
      }
    });
    
    if (!hasValidIngredient) {
      newErrors.ingredienti = 'Inserisci almeno un ingrediente con quantità';
    }
    
    // Controlla che ci sia almeno un'istruzione valida
    const validInstructions = ricetta.istruzioni.filter(i => i.trim().length > 0);
    if (validInstructions.length === 0) {
      newErrors.istruzioni = 'Inserisci almeno un\'istruzione';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async () => {
    if (!isConnected) {
      return Alert.alert('Errore', 'È necessaria una connessione internet per salvare la ricetta');
    }
    
    if (!validate()) {
      return setSnackbar({
        visible: true,
        message: 'Correggi gli errori nel form'
      });
    }
    
    try {
      setSaving(true);
      
      // Prepara i dati per l'invio
      const ricettaData = {
        ...ricetta,
        tempoPreparazione: parseInt(ricetta.tempoPreparazione),
        resa: {
          ...ricetta.resa,
          quantita: parseFloat(ricetta.resa.quantita)
        },
        ingredienti: ricetta.ingredienti
          .filter(ing => ing.ingrediente && ing.quantita) // Rimuovi ingredienti incompleti
          .map(ing => ({
            ...ing,
            quantita: parseFloat(ing.quantita)
          }))
      };
      
      let result;
      
      if (isEditMode) {
        result = await updateRicetta(recipeId, ricettaData);
        setSnackbar({
          visible: true,
          message: 'Ricetta aggiornata con successo'
        });
      } else {
        result = await createRicetta(ricettaData);
        setSnackbar({
          visible: true,
          message: 'Ricetta creata con successo'
        });
      }
      
      // Ritorna alla pagina precedente dopo un breve ritardo
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (error) {
      Alert.alert('Errore', error.message || 'Impossibile salvare la ricetta');
    } finally {
      setSaving(false);
    }
  };
  
  const openIngredientMenu = (index) => {
    setSelectedIngredientIndex(index);
    setShowIngredientMenu(true);
  };
  
  const selectIngredient = (id) => {
    handleIngredienteChange(selectedIngredientIndex, 'ingrediente', id);
    setShowIngredientMenu(false);
  };
  
  const getIngredientName = (id) => {
    const ingrediente = ingredienti.find(i => i._id === id);
    return ingrediente ? ingrediente.nome : 'Seleziona ingrediente';
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e91e63" />
        <Text style={styles.loadingText}>Caricamento...</Text>
      </View>
    );
  }
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Informazioni Ricetta</Text>
          
          <TextInput
            label="Nome Ricetta"
            value={ricetta.nome}
            onChangeText={(text) => handleChange('nome', text)}
            style={styles.input}
            error={!!errors.nome}
          />
          {errors.nome && <HelperText type="error">{errors.nome}</HelperText>}
          
          <Text style={styles.label}>Categoria</Text>
          <View style={styles.chipContainer}>
            {['pasta', 'dolci', 'panadas', 'altro'].map(categoria => (
              <Chip
                key={categoria}
                selected={ricetta.categoria === categoria}
                onPress={() => handleChange('categoria', categoria)}
                style={[
                  styles.chip,
                  ricetta.categoria === categoria && styles.selectedChip
                ]}
              >
                {categoria.charAt(0).toUpperCase() + categoria.slice(1)}
              </Chip>
            ))}
          </View>
          {errors.categoria && <HelperText type="error">{errors.categoria}</HelperText>}
          
          <TextInput
            label="Descrizione"
            value={ricetta.descrizione}
            onChangeText={(text) => handleChange('descrizione', text)}
            multiline
            numberOfLines={3}
            style={styles.input}
          />
          
          <View style={styles.row}>
            <TextInput
              label="Tempo Preparazione (min)"
              value={ricetta.tempoPreparazione}
              onChangeText={(text) => handleChange('tempoPreparazione', text)}
              keyboardType="numeric"
              style={[styles.input, { flex: 1, marginRight: 10 }]}
              error={!!errors.tempoPreparazione}
            />
            
            <View style={{ flex: 1 }}>
              <TextInput
                label="Resa Quantità"
                value={ricetta.resa.quantita}
                onChangeText={(text) => handleResaChange('quantita', text)}
                keyboardType="numeric"
                style={styles.input}
                error={!!errors.resa}
              />
              <View style={styles.unitSelector}>
                {['g', 'kg', 'pz'].map(unita => (
                  <Chip
                    key={unita}
                    selected={ricetta.resa.unita === unita}
                    onPress={() => handleResaChange('unita', unita)}
                    style={[styles.unitChip, ricetta.resa.unita === unita && styles.selectedUnitChip]}
                    height={30}
                  >
                    {unita}
                  </Chip>
                ))}
              </View>
            </View>
          </View>
          {errors.tempoPreparazione && <HelperText type="error">{errors.tempoPreparazione}</HelperText>}
          {errors.resa && <HelperText type="error">{errors.resa}</HelperText>}
          
          <Divider style={styles.divider} />
          
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ingredienti</Text>
            <Button 
              mode="text" 
              onPress={addIngrediente}
              icon="plus"
            >
              Aggiungi
            </Button>
          </View>
          
          {errors.ingredienti && <HelperText type="error">{errors.ingredienti}</HelperText>}
          
          {ricetta.ingredienti.map((ing, index) => (
            <View key={index} style={styles.ingredientRow}>
              <TouchableOpacity 
                style={styles.ingredientSelector}
                onPress={() => openIngredientMenu(index)}
              >
                <Text style={[
                  styles.ingredientName, 
                  !ing.ingrediente && styles.placeholderText
                ]}>
                  {ing.ingrediente ? getIngredientName(ing.ingrediente) : 'Seleziona ingrediente'}
                </Text>
                <Icon name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>
              
              <View style={styles.quantityContainer}>
                <TextInput
                  label="Qtà"
                  value={ing.quantita}
                  onChangeText={(text) => handleIngredienteChange(index, 'quantita', text)}
                  keyboardType="numeric"
                  style={styles.quantityInput}
                />
                
                <View style={styles.unitSelector}>
                  {['g', 'kg', 'l', 'ml', 'pz'].map(unita => (
                    <Chip
                      key={unita}
                      selected={ing.unita === unita}
                      onPress={() => handleIngredienteChange(index, 'unita', unita)}
                      style={[styles.unitChip, ing.unita === unita && styles.selectedUnitChip]}
                      height={30}
                    >
                      {unita}
                    </Chip>
                  ))}
                </View>
              </View>
              
              <IconButton
                icon="delete"
                size={24}
                color="#f44336"
                onPress={() => removeIngrediente(index)}
                disabled={ricetta.ingredienti.length <= 1}
              />
            </View>
          ))}
          
          <Divider style={styles.divider} />
          
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Istruzioni</Text>
            <Button 
              mode="text" 
              onPress={addIstruzione}
              icon="plus"
            >
              Aggiungi
            </Button>
          </View>
          
          {errors.istruzioni && <HelperText type="error">{errors.istruzioni}</HelperText>}
          
          {ricetta.istruzioni.map((istruzione, index) => (
            <View key={index} style={styles.instructionRow}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepNumber}>{index + 1}</Text>
              </View>
              
              <TextInput
                value={istruzione}
                onChangeText={(text) => handleIstruzioneChange(index, text)}
                placeholder={`Passaggio ${index + 1}`}
                multiline
                numberOfLines={2}
                style={styles.instructionInput}
              />
              
              <IconButton
                icon="delete"
                size={24}
                color="#f44336"
                onPress={() => removeIstruzione(index)}
                disabled={ricetta.istruzioni.length <= 1}
              />
            </View>
          ))}
          
          <Divider style={styles.divider} />
          
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Ricetta Attiva</Text>
            <Switch
              value={ricetta.attivo}
              onValueChange={(value) => handleChange('attivo', value)}
              color="#e91e63"
            />
          </View>
          
          <Text style={styles.switchHelper}>
            Le ricette attive sono mostrate nella creazione dei piani di produzione
          </Text>
          
          <View style={styles.buttonContainer}>
            <Button
              mode="outlined"
              onPress={() => navigation.goBack()}
              style={styles.button}
            >
              Annulla
            </Button>
            
            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={saving}
              disabled={saving || !isConnected}
              style={styles.button}
            >
              {isEditMode ? 'Aggiorna' : 'Crea'}
            </Button>
          </View>
        </View>
      </ScrollView>
      
      <Menu
        visible={showIngredientMenu}
        onDismiss={() => setShowIngredientMenu(false)}
        anchor={{ x: 20, y: 100 }} // Questo verrà ignorato quando menu.show() viene chiamato
        style={styles.menu}
      >
        {ingredienti.map(ingrediente => (
          <Menu.Item
            key={ingrediente._id}
            title={`${ingrediente.nome} (${ingrediente.unitaMisura})`}
            onPress={() => selectIngredient(ingrediente._id)}
          />
        ))}
      </Menu>
      
      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
        duration={3000}
      >
        {snackbar.message}
      </Snackbar>
      
      {!isConnected && (
        <View style={styles.offlineBar}>
          <Icon name="wifi-off" size={16} color="#fff" />
          <Text style={styles.offlineText}>Modalità offline</Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  form: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  label: {
    fontSize: 16,
    marginVertical: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  chip: {
    margin: 4,
  },
  selectedChip: {
    backgroundColor: '#e91e63',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  divider: {
    height: 1,
    marginVertical: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  ingredientSelector: {
    flex: 3,
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    paddingHorizontal: 10,
    marginRight: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  ingredientName: {
    fontSize: 16,
  },
  placeholderText: {
    color: '#999',
  },
  quantityContainer: {
    flex: 2,
    marginRight: 10,
  },
  quantityInput: {
    marginBottom: 5,
    backgroundColor: '#fff',
  },
  unitSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  unitChip: {
    margin: 2,
    height: 28,
  },
  selectedUnitChip: {
    backgroundColor: '#2196f3',
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  stepBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e91e63',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 10,
  },
  stepNumber: {
    color: '#fff',
    fontWeight: 'bold',
  },
  instructionInput: {
    flex: 1,
    marginRight: 10,
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  switchLabel: {
    fontSize: 16,
  },
  switchHelper: {
    color: '#666',
    fontSize: 14,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
  },
  menu: {
    maxHeight: 300,
  },
  offlineBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#f44336',
    padding: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  offlineText: {
    color: '#fff',
    marginLeft: 8,
  },
});

export default RecipeFormScreen;