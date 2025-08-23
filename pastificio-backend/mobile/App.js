// mobile/App.js
import React, { useState, useEffect } from 'react';
import { 
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  useColorScheme,
  TouchableOpacity,
  RefreshControl
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

import LoginScreen from './screens/LoginScreen';
import OrdersScreen from './screens/OrdersScreen';
import OrderDetailScreen from './screens/OrderDetailScreen';
import ProductionScreen from './screens/ProductionScreen';
import InventoryScreen from './screens/InventoryScreen';
import SettingsScreen from './screens/SettingsScreen';

import { AuthContext } from './contexts/AuthContext';
import { ConnectionContext } from './contexts/ConnectionContext';
import { API_URL } from './config';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Main stack for logged in users
const MainStack = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Ordini') {
            iconName = focused ? 'clipboard-list' : 'clipboard-outline';
          } else if (route.name === 'Produzione') {
            iconName = focused ? 'food-variant' : 'food-outline';
          } else if (route.name === 'Magazzino') {
            iconName = focused ? 'warehouse' : 'warehouse';
          } else if (route.name === 'Impostazioni') {
            iconName = focused ? 'cog' : 'cog-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#e91e63',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Ordini" component={OrdersNavigator} options={{ headerShown: false }} />
      <Tab.Screen name="Produzione" component={ProductionScreen} />
      <Tab.Screen name="Magazzino" component={InventoryScreen} />
      <Tab.Screen name="Impostazioni" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

// Orders navigator stack
const OrdersNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="OrdersList" component={OrdersScreen} options={{ title: 'Ordini' }} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: 'Dettagli Ordine' }} />
    </Stack.Navigator>