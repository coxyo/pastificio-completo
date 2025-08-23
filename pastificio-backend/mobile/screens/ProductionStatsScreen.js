// mobile/screens/ProductionStatsScreen.js
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  List,
  Divider
} from 'react-native-paper';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { it } from 'date-fns/locale';

import { AuthContext } from '../contexts/AuthContext';
import { ConnectionContext } from '../contexts/ConnectionContext';
import { getStatisticheProduzione } from '../services/produzioneService';

const screenWidth = Dimensions.get('window').width;

const ProductionStatsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [periodo, setPeriodo] = useState('settimanale');
  const [statistiche, setStatistiche] = useState(null);
  
  const { user } = useContext(AuthContext);
  const { isConnected } = useContext(ConnectionContext);
  
  useEffect(() => {
    loadStatistiche();
  }, [periodo]);
  
  const loadStatistiche = async () => {
    try {
      setLoading(true);
      const data = await getStatisticheProduzione(periodo);
      setStatistiche(data);
    } catch (error) {
      Alert.alert('Errore', error.message || 'Impossibile caricare le statistiche');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const onRefresh = () => {
    setRefreshing(true);
    loadStatistiche();
  };
  
  const handleChangePeriodo = (newPeriodo) => {
    setPeriodo(newPeriodo);
  };
  
  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e91e63" />
        <Text style={styles.loadingText}>Caricamento statistiche...</Text>
      </View>
    );
  }
  
  const renderKPI = () => {
    if (!statistiche || !statistiche.riepilogo) return null;
    
    const { prodotti, ricette, completati, pianificati, valore } = statistiche.riepilogo;
    
    return (
      <Card style={styles.kpiCard}>
        <Card.Content>
          <Title>Riepilogo Produzione</Title>
          
          <View style={styles.kpiGrid}>
            <View style={styles.kpiItem}>
              <Text style={styles.kpiValue}>{prodotti}</Text>
              <Text style={styles.kpiLabel}>Prodotti</Text>
            </View>
            
            <View style={styles.kpiItem}>
              <Text style={styles.kpiValue}>{ricette}</Text>
              <Text style={styles.kpiLabel}>Ricette</Text>
            </View>
            
            <View style={styles.kpiItem}>
              <Text style={styles.kpiValue}>{completati}</Text>
              <Text style={styles.kpiLabel}>Completati</Text>
            </View>
            
            <View style={styles.kpiItem}>
              <Text style={styles.kpiValue}>{pianificati}</Text>
              <Text style={styles.kpiLabel}>Pianificati</Text>
            </View>
            
            <View style={styles.kpiItem}>
              <Text style={styles.kpiValue}>{valore?.toFixed(2)}€</Text>
              <Text style={styles.kpiLabel}>Valore</Text>
            </View>
            
            <View style={styles.kpiItem}>
              <Text style={styles.kpiValue}>
                {pianificati > 0 ? Math.round((completati / pianificati) * 100) : 0}%
              </Text>
              <Text style={styles.kpiLabel}>Completamento</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };
  
  const renderProduzioneGiornaliera = () => {
    if (!statistiche || !statistiche.produzioneGiornaliera) return null;
    
    const { labels, quantita } = statistiche.produzioneGiornaliera;
    
    const data = {
      labels,
      datasets: [
        {
          data: quantita,
          color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
          strokeWidth: 2
        }
      ],
      legend: ['Produzione']
    };
    
    return (
      <Card style={styles.chartCard}>
        <Card.Content>
          <Title>Produzione Giornaliera</Title>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <LineChart
              data={data}
              width={Math.max(screenWidth - 40, labels.length * 60)}
              height={220}
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: {
                  borderRadius: 16
                },
                propsForDots: {
                  r: '6',
                  strokeWidth: '2',
                  stroke: '#2196f3'
                }
              }}
              bezier
              style={styles.chart}
            />
          </ScrollView>
        </Card.Content>
      </Card>
    );
  };
  
  const renderTopRicette = () => {
    if (!statistiche || !statistiche.topRicette) return null;
    
    return (
      <Card style={styles.listCard}>
        <Card.Content>
          <Title>Top Ricette Prodotte</Title>
          
          {statistiche.topRicette.map((item, index) => (
            <List.Item
              key={index}
              title={item.nome}
              description={`${item.categoria} - ${item.quantitaProdotta} ${item.unita}`}
              left={props => <List.Icon {...props} icon="food" />}
              right={props => <Text style={styles.listValue}>{item.percentuale}%</Text>}
            />
          ))}
        </Card.Content>
      </Card>
    );
  };
  
  const renderDistribuzioneCategorie = () => {
    if (!statistiche || !statistiche.distribuzioneCategorie) return null;
    
    const data = statistiche.distribuzioneCategorie.map(item => ({
      name: item.categoria,
      value: item.quantita,
      color: getCategoryColor(item.categoria),
      legendFontColor: '#7F7F7F',
      legendFontSize: 12
    }));
    
    return (
      <Card style={styles.chartCard}>
        <Card.Content>
          <Title>Distribuzione Categorie</Title>
          
          <PieChart
            data={data}
            width={screenWidth - 40}
            height={220}
            chartConfig={{
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`
            }}
            accessor="value"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        </Card.Content>
      </Card>
    );
  };
  
  const getCategoryColor = (categoria) => {
    switch (categoria) {
      case 'pasta':
        return '#FFA000'; // Amber
      case 'dolci':
        return '#E91E63'; // Pink
      case 'panadas':
        return '#4CAF50'; // Green
      default:
        return '#9E9E9E'; // Grey
    }
  };
  
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#e91e63']}
        />
      }
    >
      <View style={styles.periodSelector}>
        <Chip
          selected={periodo === 'giornaliero'}
          onPress={() => handleChangePeriodo('giornaliero')}
          style={styles.periodChip}
        >
          Giornaliero
        </Chip>
        
        <Chip
          selected={periodo === 'settimanale'}
          onPress={() => handleChangePeriodo('settimanale')}
          style={styles.periodChip}
        >
          Settimanale
        </Chip>
        
        <Chip
          selected={periodo === 'mensile'}
          onPress={() => handleChangePeriodo('mensile')}
          style={styles.periodChip}
        >
          Mensile
        </Chip>
      </View>
      
      {statistiche ? (
        <>
          {renderKPI()}
          {renderProduzioneGiornaliera()}
          {renderDistribuzioneCategorie()}
          {renderTopRicette()}
        </>
      ) : (
        <Card style={styles.emptyCard}>
          <Card.Content style={styles.emptyContent}>
            <Icon name="chart-bar" size={64} color="#757575" />
            <Text style={styles.emptyText}>
              Nessuna statistica disponibile per questo periodo
            </Text>
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
  contentContainer: {
    padding: 16,
    paddingBottom: 80,
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
  periodSelector: {
    flexDirection: 'row',
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  periodChip: {
    flex: 1,
    marginHorizontal: 4,
  },
  kpiCard: {
    marginBottom: 16,
    elevation: 2,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  kpiItem: {
    width: '33%',
    alignItems: 'center',
    marginBottom: 16,
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196f3',
  },
  kpiLabel: {
    fontSize: 14,
    color: '#666',
  },
  chartCard: {
    marginBottom: 16,
    elevation: 2,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  listCard: {
    marginBottom: 16,
    elevation: 2,
  },
  listValue: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#2196f3',
  },
  emptyCard: {
    marginVertical: 20,
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

export default ProductionStatsScreen;