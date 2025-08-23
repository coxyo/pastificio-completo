// mobile/screens/ProductionScreen.js
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  FlatList
} from 'react-native';
import { Card, Title, Paragraph, Badge, Button, Divider, List, Chip } from 'react-native-paper';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';

import { AuthContext } from '../contexts/AuthContext';
import { ConnectionContext } from '../contexts/ConnectionContext';
import { getPianiProduzione, startProduzione, completeProduzione } from '../services/produzioneService';

const ProductionScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pianiProduzione, setPianiProduzione] = useState([]);
  const [expandedPiano, setExpandedPiano] = useState(null);
  
  const { user } = useContext(AuthContext);
  const { isConnected, isConnecting } = useContext(ConnectionContext);
  
  useEffect(() => {
    loadData();
  }, [date]);
  
  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getPianiProduzione(format(date, 'yyyy-MM-dd'));
      setPianiProduzione(data);
    } catch (error) {
      Alert.alert('Errore', error.message || 'Impossibile caricare i piani di produzione');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };
  
  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };
  
  const handleStartProduction = async (pianoId, produzioneIndex) => {
    try {
      if (!isConnected) {
        return Alert.alert('Errore', 'È necessaria una connessione internet per avviare la produzione');
      }
      
      setLoading(true);
      await startProduzione(pianoId, produzioneIndex);
      loadData();
      Alert.alert('Successo', 'Produzione avviata con successo!');
    } catch (error) {
      Alert.alert('Errore', error.message || 'Impossibile avviare la produzione');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCompleteProduction = async (pianoId, produzioneIndex, quantitaProdotta) => {
    try {
      if (!isConnected) {
        return Alert.alert('Errore', 'È necessaria una connessione internet per completare la produzione');
      }
      
      setLoading(true);
      await completeProduzione(pianoId, produzioneIndex, { quantitaProdotta });
      loadData();
      Alert.alert('Successo', 'Produzione completata con successo!');
    } catch (error) {
      Alert.alert('Errore', error.message || 'Impossibile completare la produzione');
    } finally {
      setLoading(false);
    }
  };
  
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pianificato':
        return <Badge style={[styles.badge, { backgroundColor: '#9e9e9e' }]}>Pianificato</Badge>;
      case 'in_corso':
        return <Badge style={[styles.badge, { backgroundColor: '#2196f3' }]}>In Corso</Badge>;
      case 'completato':
        return <Badge style={[styles.badge, { backgroundColor: '#4caf50' }]}>Completato</Badge>;
      case 'annullato':
        return <Badge style={[styles.badge, { backgroundColor: '#f44336' }]}>Annullato</Badge>;
      default:
        return <Badge style={styles.badge}>{status}</Badge>;
    }
  };
  
  return (
    <View style={styles.container}>
      <Card style={styles.dateCard}>
        <Card.Content style={styles.dateContent}>
          <Title>Piano di Produzione</Title>
          <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateButton}>
            <Text style={styles.dateText}>
              {format(date, 'EEEE d MMMM yyyy', { locale: it })}
            </Text>
            <Icon name="calendar" size={24} color="#333" />
          </TouchableOpacity>
        </Card.Content>
      </Card>
      
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
      
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
            <Text style={styles.loadingText}>Caricamento...</Text>
          </View>
        ) : pianiProduzione.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <Icon name="food-off" size={64} color="#757575" />
              <Text style={styles.emptyText}>
                Nessun piano di produzione per questa data
              </Text>
            </Card.Content>
          </Card>
        ) : (
          pianiProduzione.map((piano) => (
            <Card key={piano._id} style={styles.productionCard}>
              <Card.Content>
                <View style={styles.cardHeader}>
                  <Title>
                    Piano del {format(new Date(piano.data), 'd MMMM', { locale: it })}
                  </Title>
                  {piano.completato && (
                    <Chip icon="check-circle" mode="outlined" style={styles.completedChip}>
                      Completato
                    </Chip>
                  )}
                </View>
                
                {piano.note && (
                  <Paragraph style={styles.noteText}>Note: {piano.note}</Paragraph>
                )}
                
                <TouchableOpacity
                  onPress={() => setExpandedPiano(expandedPiano === piano._id ? null : piano._id)}
                  style={styles.expandButton}
                >
                  <Text style={styles.expandText}>
                    {expandedPiano === piano._id ? 'Nascondi dettagli' : 'Mostra dettagli'}
                  </Text>
                  <Icon
                    name={expandedPiano === piano._id ? 'chevron-up' : 'chevron-down'}
                    size={24}
                    color="#e91e63"
                  />
                </TouchableOpacity>
                
                {expandedPiano === piano._id && (
                  <View style={styles.productionsContainer}>
                    {piano.produzioni.map((prod, index) => (
                      <Card key={index} style={styles.productionItem}>
                        <Card.Content>
                          <View style={styles.itemHeader}>
                            <Title style={styles.productName}>{prod.ricetta?.nome || 'N/D'}</Title>
                            {getStatusBadge(prod.stato)}
                          </View>
                          
                          <View style={styles.itemDetails}>
                            <View style={styles.detailRow}>
                              <Text style={styles.detailLabel}>Categoria:</Text>
                              <Text style={styles.detailValue}>{prod.ricetta?.categoria || 'N/D'}</Text>
                            </View>
                            
                            <View style={styles.detailRow}>
                              <Text style={styles.detailLabel}>Quantità:</Text>
                              <Text style={styles.detailValue}>
                                {prod.quantitaProdotta > 0 && prod.stato === 'completato'
                                  ? `${prod.quantitaProdotta} / ${prod.quantitaPianificata}`
                                  : prod.quantitaPianificata
                                } {prod.ricetta?.resa?.unita || 'pz'}
                              </Text>
                            </View>
                            
                            {prod.operatore && (
                              <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Operatore:</Text>
                                <Text style={styles.detailValue}>{prod.operatore.username}</Text>
                              </View>
                            )}
                            
                            {prod.lottoProduzioneId && (
                              <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Lotto:</Text>
                                <Text style={styles.detailValue}>{prod.lottoProduzioneId}</Text>
                              </View>
                            )}
                          </View>
                          
                          <View style={styles.actionsContainer}>
                            {prod.stato === 'pianificato' && (
                              <Button
                                mode="contained"
                                icon="play"
                                onPress={() => handleStartProduction(piano._id, index)}
                                style={styles.startButton}
                                disabled={!isConnected}
                              >
                                Avvia
                              </Button>
                            )}
                            
                            {prod.stato === 'in_corso' && (
                              <Button
                                mode="contained"
                                icon="check-circle"
                                onPress={() => handleCompleteProduction(piano._id, index, prod.quantitaPianificata)}
                                style={styles.completeButton}
                                disabled={!isConnected}
                              >
                                Completa
                              </Button>
                            )}
                          </View>
                        </Card.Content>
                      </Card>
                    ))}
                  </View>
                )}
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>
      
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
  dateCard: {
    margin: 10,
    elevation: 4,
  },
  dateContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  dateText: {
    fontSize: 16,
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
  productionCard: {
    margin: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  noteText: {
    fontStyle: 'italic',
    color: '#757575',
    marginBottom: 10,
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
  productionsContainer: {
    marginTop: 10,
  },
  productionItem: {
    marginVertical: 8,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productName: {
    fontSize: 18,
    flex: 1,
    marginRight: 8,
  },
  badge: {
    alignSelf: 'flex-start',
  },
  itemDetails: {
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  detailLabel: {
    fontWeight: 'bold',
    width: 100,
  },
  detailValue: {
    flex: 1,
  },
  actionsContainer: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  startButton: {
    backgroundColor: '#2196f3',
  },
  completeButton: {
    backgroundColor: '#4caf50',
  },
  completedChip: {
    backgroundColor: '#e8f5e9',
    color: '#4caf50',
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

export default ProductionScreen;