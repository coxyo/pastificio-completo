// mobile/screens/RecipeScreen.js
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { 
  Card, 
  Title, 
  Paragraph, 
  Chip, 
  Button, 
  Searchbar,
  List,
  Divider,
  FAB
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

import { AuthContext } from '../contexts/AuthContext';
import { ConnectionContext } from '../contexts/ConnectionContext';
import { getRicette } from '../services/produzioneService';

const RecipeScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ricette, setRicette] = useState([]);
  const [filteredRicette, setFilteredRicette] = useState([]);
  const [expandedRecipe, setExpandedRecipe] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  const { user } = useContext(AuthContext);
  const { isConnected } = useContext(ConnectionContext);
  const navigation = useNavigation();
  
  useEffect(() => {
    loadData();
  }, []);
  
  useEffect(() => {
    filterRicette();
  }, [ricette, searchQuery, selectedCategory]);
  
  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getRicette();
      setRicette(data);
    } catch (error) {
      Alert.alert('Errore', error.message || 'Impossibile caricare le ricette');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };
  
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
  
  const onChangeSearch = query => {
    setSearchQuery(query);
  };
  
  const selectCategory = (category) => {
    setSelectedCategory(selectedCategory === category ? null : category);
  };
  
  const navigateToRecipeDetail = (recipe) => {
    navigation.navigate('RecipeDetail', { recipeId: recipe._id });
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
  
  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Cerca ricette..."
        onChangeText={onChangeSearch}
        value={searchQuery}
        style={styles.searchbar}
      />
      
      {renderCategories()}
      
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#e91e63']}
          />
        }
      >
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#e91e63" />
            <Text style={styles.loadingText}>Caricamento ricette...</Text>
          </View>
        ) : filteredRicette.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <Icon name="food-off" size={64} color="#757575" />
              <Text style={styles.emptyText}>
                {searchQuery || selectedCategory
                  ? 'Nessuna ricetta trovata con questi criteri'
                  : 'Nessuna ricetta disponibile'}
              </Text>
            </Card.Content>
          </Card>
        ) : (
          filteredRicette.map((ricetta) => (
            <Card 
              key={ricetta._id} 
              style={styles.recipeCard}
              onPress={() => navigateToRecipeDetail(ricetta)}
            >
              <Card.Content>
                <View style={styles.cardHeader}>
                  <Title>{ricetta.nome}</Title>
                  <Chip 
                    mode="outlined" 
                    style={styles.categoryTag}
                  >
                    {ricetta.categoria}
                  </Chip>
                </View>
                
                {ricetta.descrizione && (
                  <Paragraph style={styles.description}>{ricetta.descrizione}</Paragraph>
                )}
                
                <View style={styles.detailsRow}>
                  <View style={styles.detailItem}>
                    <Icon name="clock-outline" size={18} color="#666" />
                    <Text style={styles.detailText}>{ricetta.tempoPreparazione} min</Text>
                  </View>
                  
                  <View style={styles.detailItem}>
                    <Icon name="scale" size={18} color="#666" />
                    <Text style={styles.detailText}>
                      {ricetta.resa?.quantita} {ricetta.resa?.unita}
                    </Text>
                  </View>
                  
                  <View style={styles.detailItem}>
                    <Icon name="currency-eur" size={18} color="#666" />
                    <Text style={styles.detailText}>
                      {ricetta.costoStimato?.toFixed(2) || '0.00'} €
                    </Text>
                  </View>
                </View>
                
                <TouchableOpacity
                  onPress={() => setExpandedRecipe(expandedRecipe === ricetta._id ? null : ricetta._id)}
                  style={styles.expandButton}
                >
                  <Text style={styles.expandText}>
                    {expandedRecipe === ricetta._id ? 'Nascondi ingredienti' : 'Mostra ingredienti'}
                  </Text>
                  <Icon
                    name={expandedRecipe === ricetta._id ? 'chevron-up' : 'chevron-down'}
                    size={24}
                    color="#e91e63"
                  />
                </TouchableOpacity>
                
                {expandedRecipe === ricetta._id && (
                  <View style={styles.ingredientsContainer}>
                    <Text style={styles.sectionTitle}>Ingredienti:</Text>
                    {ricetta.ingredienti.map((ing, index) => (
                      <View key={index} style={styles.ingredientRow}>
                        <Text style={styles.ingredientText}>
                          • {ing.ingrediente?.nome || 'Ingrediente'}:
                        </Text>
                        <Text style={styles.quantityText}>
                          {ing.quantita} {ing.unita}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </Card.Content>
              
              <Card.Actions style={styles.cardActions}>
                <Button
                  mode="text"
                  onPress={() => navigateToRecipeDetail(ricetta)}
                  color="#e91e63"
                >
                  Dettagli
                </Button>
              </Card.Actions>
            </Card>
          ))
        )}
      </ScrollView>
      
      {user && (user.ruolo === 'admin' || user.ruolo === 'manager') && (
        <FAB
          style={styles.fab}
          icon="plus"
          color="#fff"
          onPress={() => navigation.navigate('RecipeForm')}
          disabled={!isConnected}
        />
      )}
      
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
  searchbar: {
    margin: 10,
    elevation: 2,
  },
  categoriesContainer: {
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  categoryChip: {
    marginRight: 8,
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
  emptyCard: {
    margin: 10,
    padding: 20,
  },
  emptyContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    color: '#757575',
  },
  recipeCard: {
    margin: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryTag: {
    height: 30,
    alignSelf: 'center',
  },
  description: {
    color: '#666',
    marginBottom: 10,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    marginLeft: 5,
    color: '#666',
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  expandText: {
    color: '#e91e63',
    marginRight: 8,
  },
  ingredientsContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
  },
  ingredientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  ingredientText: {
    flex: 3,
  },
  quantityText: {
    flex: 1,
    textAlign: 'right',
    fontWeight: 'bold',
  },
  cardActions: {
    justifyContent: 'flex-end',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#e91e63',
  },
  offlineBar: {
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

export default RecipeScreen;