// mobile/screens/CreatePlanScreen.js
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity
} from 'react-native';
import {
  TextInput,
  Button,
  Divider,
  HelperText,
  IconButton,
  Card,
  Chip,
  Snackbar,
  Menu
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { AuthContext } from '../contexts/AuthContext';
import { ConnectionContext } from '../contexts/ConnectionContext';
import { getRicette, createPianoProduzione } from '../services/produzioneService';

const CreatePlanScreen = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ricette, setRicette] = useState([]);
  const [filteredRicette, setFilteredRicette] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showRecipeMenu, setShowRecipeMenu] = useState(false);
  const [selectedProduzioneIndex, setSelectedProduzioneIndex] = useState(null);
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });
  
  const [pianoProduzione, setPianoProduzione] = useState({
    data: new Date(),
    produzioni: [{ ricetta: '', quantitaPianificata: '' }],
    note: ''
  });
  
  const { user } = useContext(AuthContext);
  const { isConnected } = useContext(ConnectionContext);
  const navigation = useNavigation();
  
  useEffect(() => {
    loadRicette();
  }, []);
  
  useEffect(() => {
    filterRicette();
  }, [ricette, selectedCategory, searchQuery]);
  
  const loadRicette = async () => {
    try {
      setLoading(true);
      const data = await getRicette();
      // Filtra solo le ricette attive
      const activeRecipes = data.filter(r => r.attivo);
      setRicette(activeRecipes);
    } catch (error) {
      Alert.alert('Errore', error.message || 'Impossibile caricare le ricette');
    } finally {
      setLoading(false);
    }
  };
  
// mobile/screens/CreatePlanScreen.js (continuazione)
 const filterRicette = () => {
   let filtered = [...ricette];
   
   // Filtra per categoria
   if (selectedCategory) {
     filtered = filtered.filter(r => r.categoria === selectedCategory);
   }
   
   // Filtra per testo di ricerca
   if (searchQuery) {
     const query = searchQuery.toLowerCase();
     filtered = filtered.filter(r => 
       r.nome.toLowerCase().includes(query) || 
       r.descrizione?.toLowerCase().includes(query)
     );
   }
   
   setFilteredRicette(filtered);
 };
 
 const handleDateChange = (event, selectedDate) => {
   setShowDatePicker(false);
   if (selectedDate) {
     setPianoProduzione(prev => ({
       ...prev,
       data: selectedDate
     }));
   }
 };
 
 const handleChange = (name, value) => {
   setPianoProduzione(prev => ({
     ...prev,
     [name]: value
   }));
   
   // Clear error
   if (errors[name]) {
     setErrors(prev => ({ ...prev, [name]: null }));
   }
 };
 
 const handleProduzioneChange = (index, field, value) => {
   const newProduzioni = [...pianoProduzione.produzioni];
   newProduzioni[index][field] = value;
   
   setPianoProduzione(prev => ({
     ...prev,
     produzioni: newProduzioni
   }));
   
   // Clear error
   if (errors.produzioni) {
     setErrors(prev => ({ ...prev, produzioni: null }));
   }
 };
 
 const addProduzione = () => {
   setPianoProduzione(prev => ({
     ...prev,
     produzioni: [...prev.produzioni, { ricetta: '', quantitaPianificata: '' }]
   }));
 };
 
 const removeProduzione = (index) => {
   if (pianoProduzione.produzioni.length <= 1) {
     return;
   }
   
   const newProduzioni = [...pianoProduzione.produzioni];
   newProduzioni.splice(index, 1);
   
   setPianoProduzione(prev => ({
     ...prev,
     produzioni: newProduzioni
   }));
 };
 
 const openRecipeMenu = (index) => {
   setSelectedProduzioneIndex(index);
   setShowRecipeMenu(true);
 };
 
 const selectRecipe = (id) => {
   handleProduzioneChange(selectedProduzioneIndex, 'ricetta', id);
   setShowRecipeMenu(false);
 };
 
 const getRecipeName = (id) => {
   const ricetta = ricette.find(r => r._id === id);
   return ricetta ? ricetta.nome : 'Seleziona prodotto';
 };
 
 const selectCategory = (category) => {
   setSelectedCategory(selectedCategory === category ? null : category);
 };
 
 const validate = () => {
   const newErrors = {};
   
   if (!pianoProduzione.data) {
     newErrors.data = 'La data è obbligatoria';
   }
   
   // Verifica che ci sia almeno una produzione valida
   let hasValidProduction = false;
   pianoProduzione.produzioni.forEach((prod) => {
     if (prod.ricetta && prod.quantitaPianificata) {
       hasValidProduction = true;
     }
   });
   
   if (!hasValidProduction) {
     newErrors.produzioni = 'Aggiungi almeno un prodotto con quantità';
   }
   
   setErrors(newErrors);
   return Object.keys(newErrors).length === 0;
 };
 
 const handleSubmit = async () => {
   if (!isConnected) {
     return Alert.alert('Errore', 'È necessaria una connessione internet per creare il piano');
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
     const pianoData = {
       ...pianoProduzione,
       data: format(pianoProduzione.data, 'yyyy-MM-dd'),
       produzioni: pianoProduzione.produzioni
         .filter(prod => prod.ricetta && prod.quantitaPianificata) // Rimuovi produzioni incomplete
         .map(prod => ({
           ...prod,
           quantitaPianificata: parseFloat(prod.quantitaPianificata)
         }))
     };
     
     await createPianoProduzione(pianoData);
     
     setSnackbar({
       visible: true,
       message: 'Piano di produzione creato con successo'
     });
     
     // Ritorna alla pagina precedente dopo un breve ritardo
     setTimeout(() => {
       navigation.goBack();
     }, 1500);
   } catch (error) {
     Alert.alert('Errore', error.message || 'Impossibile creare il piano di produzione');
   } finally {
     setSaving(false);
   }
 };
 
 const renderCategories = () => {
   const categories = [
     { id: 'pasta', label: 'Pasta', icon: 'pasta' },
     { id: 'dolci', label: 'Dolci', icon: 'cake' },
     { id: 'panadas', label: 'Panadas', icon: 'food' },
     { id: 'altro', label: 'Altro', icon: 'silverware-fork-knife' }
   ];
   
   return (
     <ScrollView 
       horizontal 
       showsHorizontalScrollIndicator={false}
       contentContainerStyle={styles.categoriesContainer}
     >
       {categories.map(category => (
         <Chip
           key={category.id}
           icon={category.icon}
           mode={selectedCategory === category.id ? 'flat' : 'outlined'}
           selected={selectedCategory === category.id}
           onPress={() => selectCategory(category.id)}
           style={styles.categoryChip}
         >
           {category.label}
         </Chip>
       ))}
     </ScrollView>
   );
 };
 
 if (loading) {
   return (
     <View style={styles.loadingContainer}>
       <ActivityIndicator size="large" color="#e91e63" />
       <Text style={styles.loadingText}>Caricamento ricette...</Text>
     </View>
   );
 }
 
 return (
   <View style={styles.container}>
     <ScrollView contentContainerStyle={styles.scrollContent}>
       <Text style={styles.title}>Nuovo Piano di Produzione</Text>
       
       <Card style={styles.dateCard}>
         <Card.Content>
           <Text style={styles.label}>Data di Produzione</Text>
           <TouchableOpacity 
             style={styles.dateSelector}
             onPress={() => setShowDatePicker(true)}
           >
             <Text style={styles.dateText}>
               {format(pianoProduzione.data, 'EEEE d MMMM yyyy', { locale: it })}
             </Text>
             <Icon name="calendar" size={24} color="#666" />
           </TouchableOpacity>
           {errors.data && <HelperText type="error">{errors.data}</HelperText>}
         </Card.Content>
       </Card>
       
       {showDatePicker && (
         <DateTimePicker
           value={pianoProduzione.data}
           mode="date"
           display="default"
           onChange={handleDateChange}
         />
       )}
       
       <TextInput
         label="Note (opzionali)"
         value={pianoProduzione.note}
         onChangeText={(text) => handleChange('note', text)}
         multiline
         numberOfLines={3}
         style={styles.notesInput}
       />
       
       <Divider style={styles.divider} />
       
       <View style={styles.sectionHeader}>
         <Text style={styles.sectionTitle}>Produzioni</Text>
         <Button 
           mode="text" 
           onPress={addProduzione}
           icon="plus"
         >
           Aggiungi
         </Button>
       </View>
       
       {errors.produzioni && <HelperText type="error">{errors.produzioni}</HelperText>}
       
       {pianoProduzione.produzioni.map((prod, index) => (
         <Card key={index} style={styles.productionCard}>
           <Card.Content>
             <TouchableOpacity 
               style={styles.recipeSelector}
               onPress={() => openRecipeMenu(index)}
             >
               <Text style={[
                 styles.recipeName, 
                 !prod.ricetta && styles.placeholderText
               ]}>
                 {prod.ricetta ? getRecipeName(prod.ricetta) : 'Seleziona prodotto'}
               </Text>
               <Icon name="chevron-down" size={20} color="#666" />
             </TouchableOpacity>
             
             <TextInput
               label="Quantità"
               value={prod.quantitaPianificata}
               onChangeText={(text) => handleProduzioneChange(index, 'quantitaPianificata', text)}
               keyboardType="numeric"
               style={styles.quantityInput}
             />
             
             <IconButton
               icon="delete"
               size={24}
               color="#f44336"
               style={styles.deleteButton}
               onPress={() => removeProduzione(index)}
               disabled={pianoProduzione.produzioni.length <= 1}
             />
           </Card.Content>
         </Card>
       ))}
       
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
           Crea Piano
         </Button>
       </View>
     </ScrollView>
     
     <Menu
       visible={showRecipeMenu}
       onDismiss={() => setShowRecipeMenu(false)}
       anchor={{ x: 20, y: 100 }} // Questo verrà ignorato quando menu.show() viene chiamato
       style={styles.menu}
     >
       {renderCategories()}
       
       <Divider />
       
       <ScrollView style={styles.menuScrollView}>
         {filteredRicette.length === 0 ? (
           <Text style={styles.emptyMenuText}>
             Nessuna ricetta trovata
           </Text>
         ) : (
           filteredRicette.map(ricetta => (
             <Menu.Item
               key={ricetta._id}
               title={ricetta.nome}
               description={`${ricetta.categoria} - Resa: ${ricetta.resa?.quantita} ${ricetta.resa?.unita}`}
               onPress={() => selectRecipe(ricetta._id)}
               style={styles.menuItem}
             />
           ))
         )}
       </ScrollView>
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
   </View>
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
 loadingContainer: {
   flex: 1,
   justifyContent: 'center',
   alignItems: 'center',
 },
 loadingText: {
   marginTop: 10,
   fontSize: 16,
 },
 title: {
   fontSize: 24,
   fontWeight: 'bold',
   marginBottom: 20,
 },
 dateCard: {
   marginBottom: 16,
   elevation: 2,
 },
 label: {
   fontSize: 16,
   marginBottom: 8,
 },
 dateSelector: {
   flexDirection: 'row',
   justifyContent: 'space-between',
   alignItems: 'center',
   borderWidth: 1,
   borderColor: '#ccc',
   borderRadius: 4,
   padding: 12,
   backgroundColor: '#fff',
 },
 dateText: {
   fontSize: 16,
 },
 notesInput: {
   marginBottom: 16,
   backgroundColor: '#fff',
 },
 divider: {
   height: 1,
   marginVertical: 16,
 },
 sectionHeader: {
   flexDirection: 'row',
   justifyContent: 'space-between',
   alignItems: 'center',
   marginBottom: 10,
 },
 sectionTitle: {
   fontSize: 18,
   fontWeight: 'bold',
 },
 productionCard: {
   marginBottom: 12,
   elevation: 2,
 },
 recipeSelector: {
   height: 50,
   borderWidth: 1,
   borderColor: '#ccc',
   borderRadius: 4,
   paddingHorizontal: 12,
   marginBottom: 10,
   flexDirection: 'row',
   justifyContent: 'space-between',
   alignItems: 'center',
   backgroundColor: '#fff',
 },
 recipeName: {
   fontSize: 16,
 },
 placeholderText: {
   color: '#999',
 },
 quantityInput: {
   backgroundColor: '#fff',
 },
 deleteButton: {
   position: 'absolute',
   top: 0,
   right: 0,
 },
 buttonContainer: {
   flexDirection: 'row',
   justifyContent: 'space-between',
   marginTop: 24,
 },
 button: {
   flex: 1,
   marginHorizontal: 5,
 },
 menu: {
   width: '80%',
   maxHeight: 400,
 },
 menuScrollView: {
   maxHeight: 300,
 },
 menuItem: {
   paddingVertical: 8,
 },
 emptyMenuText: {
   textAlign: 'center',
   padding: 20,
   color: '#666',
 },
 categoriesContainer: {
   padding: 8,
 },
 categoryChip: {
   marginRight: 8,
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

export default CreatePlanScreen;