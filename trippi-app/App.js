import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import HomeScreen from './screens/HomeScreen';
import CalendarScreen from './screens/CalendarScreen';
import TripScreen from './screens/TripScreen';
import DiaryScreen from './screens/DiaryScreen';
import CompanionScreen from './screens/CompanionScreen';
import TripDetailScreen from './screens/TripDetailScreen';
import DiaryEditorScreen from './screens/DiaryEditorScreen';

const Tab = createBottomTabNavigator();
const TripStack = createNativeStackNavigator();
const DiaryStack = createNativeStackNavigator();

function TripStackNavigator() {
  return (
    <TripStack.Navigator screenOptions={{ headerShown: false }}>
      <TripStack.Screen name="TripMain" component={TripScreen} />
      <TripStack.Screen name="TripDetail" component={TripDetailScreen} />
    </TripStack.Navigator>
  );
}

function DiaryStackNavigator() {
  return (
    <DiaryStack.Navigator screenOptions={{ headerShown: false }}>
      <DiaryStack.Screen name="DiaryMain" component={DiaryScreen} />
      <DiaryStack.Screen name="DiaryEditor" component={DiaryEditorScreen} />
    </DiaryStack.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#0F64FF',
          tabBarInactiveTintColor: '#7A7A7A',
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopColor: '#E7E7E7',
            height: 66,
            paddingBottom: 8,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
        }}
      >
        <Tab.Screen name="Home" component={HomeScreen} options={{ title: '홈' }} />
        <Tab.Screen name="Calendar" component={CalendarScreen} options={{ title: '캘린더' }} />
        <Tab.Screen name="Trip" component={TripStackNavigator} options={{ title: '여행' }} />
        <Tab.Screen name="Diary" component={DiaryStackNavigator} options={{ title: '다이어리' }} />
        <Tab.Screen name="Companion" component={CompanionScreen} options={{ title: '동반자' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
