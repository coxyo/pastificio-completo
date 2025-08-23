// mobile/screens/RecipeDetailScreen.js
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
  Card,
  Title,
  Paragraph,
  Chip,
  Button,
  Divider,
  List
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';

import { AuthContext } from '../contexts/AuthContext';
import { ConnectionContext } from '../contexts/ConnectionContext';
import { getRicettaById, calcolaCostoRicetta } from '../services/produzioneService';

const RecipeDetailScreen = () => {
  const [loading, setLoading] = useState(true);
  const [ricetta, setRicetta] = useState(null);
  const [refreshingCosto, setRefreshingCosto] = useState(false);
  
  const { user } = useContext(AuthContext);
  const { isConnected } = useContext(ConnectionContext);
  const navigation = useNavigation();
  const route = useRoute();
  
  const { recipeId } = route.params;
  
  useEffect(() => {
    loadRicetta();
  }, [recipeId]);
  
  const loadRicetta = async () => {
    try {
      setLoading(true);
      const data = await getRicettaById(recipeId);
      setRicetta(data);
    } catch (error) {
      Alert.alert('Errore', error.message || 'Impossibile caricare la ricetta');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };
  
  const handleCalcolaCosto = async () => {
    if (!isConnected) {
      return Alert.alert('Errore', 'È necessaria una connessione internet per calcolare il costo');
    }
    
    try {
      setRefreshingCosto(true);
      const result = await calcolaCostoRicetta(recipeId);
      setRicetta(prev => ({
        ...prev,
        costoStimato: result.costo
      }));
      Alert.alert('Successo', 'Costo calcolato con successo');
    } catch (error) {
      Alert.alert('Errore', error.message || 'Impossibile calcolare il costo');
    } finally {
      setRefreshingCosto(false);
    }
  };
  
  const handleEdit = () => {
    navigation.navigate('RecipeForm', { recipeId });
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e91e63" />
        <Text style={styles.loadingText}>Caricamento ricetta...</Text>
      </View>
    );
  }
  
  if (!ricetta) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle" size={64} color="#f44336" />
        <Text style={styles.errorText}>Ricetta non trovata</Text>
        <Button mode="contained" onPress={() => navigation.goBack()}>
          Torna indietro
        </Button>
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <View style={styles.titleRow}>
            <Title style={styles.title}>{ricetta.nome}</Title>
            <Chip mode="outlined" style={styles.categoryChip}>
              {ricetta.categoria}
            </Chip>
          </View>
          
          {ricetta.descrizione && (
            <Paragraph style={styles.description}>{ricetta.descrizione}</Paragraph>
          )}
          
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Icon name="clock-outline" size={22} color="#666" />
              <Text style={styles.infoText}>{ricetta.tempoPreparazione} min</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Icon name="scale" size={22} color="#666" />
              <Text style={styles.infoText}>
                Resa: {ricetta.resa?.quantita} {ricetta.resa?.unita}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>
      
      <Card style={styles.costCard}>
        <Card.Content>
          <View style={styles.costRow}>
            <View>
              <Text style={styles.costLabel}>Costo Stimato:</Text>
              <Text style={styles.costValue}>
                {ricetta.costoStimato?.toFixed(2) || '0.00'} €
              </Text>
            </View>
            
            {(user.ruolo === 'admin' || user.ruolo === 'manager') && (
              <Button
                mode="contained"
                onPress={handleCalcolaCosto}
                loading={refreshingCosto}
                disabled={refreshingCosto || !isConnected}
                style={styles.calcButton}
              >
                Ricalcola
              </Button>
            )}
          </View>
        </Card.Content>
      </Card>
      
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Ingredienti</Text>
          
          <View style={styles.ingredientsContainer}>
            {ricetta.ingredienti.map((ing, index) => (
              <View key={index} style={styles.ingredientRow}>
                <Text style={styles.ingredientName}>
                  • {ing.ingrediente?.nome || 'Ingrediente'}
                </Text>
                <Text style={styles.ingredientQuantity}>
                  {ing.quantita} {ing.unita}
                </Text>
              </View>
            ))}
          </View>
        </Card.Content>
      </Card>
      
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Procedimento</Text>
          
          <View style={styles.instructionsContainer}>
            {ricetta.istruzioni?.map((step, index) => (
              <View key={index} style={styles.instructionStep}>
                <View style={styles.stepNumberContainer}>
                  <Text style={styles.stepNumber}>{index + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>
        </Card.Content>
      </Card>
      
      {(user.ruolo === 'admin' || user.ruolo === 'manager') && (
        <Card style={styles.actionsCard}>
          <Card.Content>
            <Button
              mode="contained"
              icon="pencil"
              onPress={handleEdit}
              style={styles.editButton}
              disabled={!isConnected}
            >
              Modifica Ricetta
            </Button>
          </Card.Content>
        </Card>
      )}
      
      {!isConnected && (
        <View style={styles.offlineBar}>
          <Icon name="wifi-off" size={16} color="#fff" />
          <Text style={styles.offlineText}>Modalità offline</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    marginVertical: 20,
    color: '#666',
  },
  headerCard: {
    margin: 10,
    elevation: 3,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 10,
  },
  categoryChip: {
    height: 30,
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  infoRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  infoText: {
    fontSize: 16,
    marginLeft: 8,
    color: '#666',
  },
  costCard: {
    margin: 10,
    backgroundColor: '#f0f8ff',
    elevation: 3,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  costLabel: {
    fontSize: 16,
    color: '#666',
  },
  costValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196f3',
  },
  calcButton: {
    backgroundColor: '#2196f3',
  },
  sectionCard: {
    margin: 10,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  ingredientsContainer: {
    marginBottom: 10,
  },
  ingredientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  ingredientName: {
    fontSize: 16,
    flex: 3,
  },
  ingredientQuantity: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
  },
  instructionsContainer: {
    marginBottom: 10,
  },
  instructionStep: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  stepNumberContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e91e63',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  stepNumber: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  stepText: {
    fontSize: 16,
    flex: 1,
  },
  actionsCard: {
    margin: 10,
    marginBottom: 20,
    elevation: 3,
  },
  editButton: {
    backgroundColor: '#e91e63',
  },
  offlineBar: {
    backgroundColor: '#f44336',
    padding: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  offlineText: {
    color: '#fff',
    marginLeft: 8,
  },
});

export default RecipeDetailScreen;