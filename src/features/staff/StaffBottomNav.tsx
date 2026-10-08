import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { staffColors } from './staffStyles';

type TabName = 'rooms' | 'scanner' | 'audit';

interface StaffBottomNavProps {
  activeTab: TabName;
}

export function StaffBottomNav({ activeTab }: StaffBottomNavProps) {
  return (
    <View style={styles.container}>
      <Pressable
        style={styles.tabItem}
        onPress={() => {
          if (activeTab !== 'rooms') {
            router.push('/staff');
          }
        }}
      >
        <View
          style={[
            styles.indicator,
            activeTab === 'rooms' && styles.activeIndicator,
          ]}
        />
        <Ionicons
          name={activeTab === 'rooms' ? 'business' : 'business-outline'}
          size={22}
          color={activeTab === 'rooms' ? staffColors.navy : '#8E9BAC'}
        />
        <Text
          style={[
            styles.label,
            activeTab === 'rooms' ? styles.activeLabel : styles.inactiveLabel,
          ]}
        >
          Rooms
        </Text>
      </Pressable>

      <Pressable
        style={styles.tabItem}
        onPress={() => {
          if (activeTab !== 'scanner') {
            router.push('/staff/verify');
          }
        }}
      >
        <View
          style={[
            styles.indicator,
            activeTab === 'scanner' && styles.activeIndicator,
          ]}
        />
        <Ionicons
          name={activeTab === 'scanner' ? 'qr-code' : 'qr-code-outline'}
          size={22}
          color={activeTab === 'scanner' ? staffColors.navy : '#8E9BAC'}
        />
        <Text
          style={[
            styles.label,
            activeTab === 'scanner' ? styles.activeLabel : styles.inactiveLabel,
          ]}
        >
          Scanner
        </Text>
      </Pressable>

      <Pressable
        style={styles.tabItem}
        onPress={() => {
          if (activeTab !== 'audit') {
            router.push('/staff/audit');
          }
        }}
      >
        <View
          style={[
            styles.indicator,
            activeTab === 'audit' && styles.activeIndicator,
          ]}
        />
        <Ionicons
          name={activeTab === 'audit' ? 'receipt' : 'receipt-outline'}
          size={22}
          color={activeTab === 'audit' ? staffColors.navy : '#8E9BAC'}
        />
        <Text
          style={[
            styles.label,
            activeTab === 'audit' ? styles.activeLabel : styles.inactiveLabel,
          ]}
        >
          Audit Log
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingBottom: 20,
    paddingTop: 4,
    height: 70,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    top: 0,
    width: 24,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  activeIndicator: {
    backgroundColor: staffColors.navy,
  },
  label: {
    fontSize: 11,
    marginTop: 2,
  },
  activeLabel: {
    color: staffColors.navy,
    fontWeight: '700',
  },
  inactiveLabel: {
    color: '#8E9BAC',
    fontWeight: '500',
  },
});
