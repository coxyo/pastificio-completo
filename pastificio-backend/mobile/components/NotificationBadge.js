// mobile/components/NotificationBadge.js
import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet } from 'react-native';
import { Badge, IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';

import { AuthContext } from '../contexts/AuthContext';
import { useSocket } from '../hooks/useSocket';

const NotificationBadge = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useContext(AuthContext);
  const navigation = useNavigation();
  const { socket } = useSocket();
  
  useEffect(() => {
    if (!socket || !user) return;
    
    // Handler per ricevere le notifiche non lette
    const handleUnreadNotifications = (notifications) => {
      setUnreadCount(notifications.length);
    };
    
    // Handler per notifiche in tempo reale
    const handleNewNotification = () => {
      setUnreadCount(prev => prev + 1);
    };
    
    // Handler per notifica letta
    const handleNotificationRead = () => {
      setUnreadCount(prev => Math.max(0, prev - 1));
    };
    
    // Registra gli handlers
    socket.on('unreadNotifications', handleUnreadNotifications);
    socket.on('notification', handleNewNotification);
    socket.on('notificationMarkedRead', handleNotificationRead);
    
    // Richiedi le notifiche non lette all'inizio
    socket.emit('getUnreadNotifications');
    
    // Cleanup
    return () => {
      socket.off('unreadNotifications', handleUnreadNotifications);
      socket.off('notification', handleNewNotification);
      socket.off('notificationMarkedRead', handleNotificationRead);
    };
  }, [socket, user]);
  
  const handlePress = () => {
    navigation.navigate('Notifications');
  };
  
  return (
    <View style={styles.container}>
      <IconButton
        icon="bell"
        size={24}
        onPress={handlePress}
      />
      {unreadCount > 0 && (
        <Badge style={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</Badge>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#e91e63',
  },
});

export default NotificationBadge;