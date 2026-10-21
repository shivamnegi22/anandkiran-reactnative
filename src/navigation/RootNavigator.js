import { useEffect } from 'react';
import { Platform } from 'react-native';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as SplashScreen from 'expo-splash-screen';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { colors, fonts } from '../theme';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import PlanScreen from '../screens/PlanScreen';
import TherapyDetailScreen from '../screens/TherapyDetailScreen';
import ExerciseDetailScreen from '../screens/ExerciseDetailScreen';
import MusicScreen from '../screens/MusicScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, primary: colors.green, background: colors.ground, card: colors.surface, text: colors.ink, border: colors.line },
};

const TAB_ICONS = {
  Home: ['home', 'home-outline'],
  Plan: ['medkit', 'medkit-outline'],
  Music: ['musical-notes', 'musical-notes-outline'],
  History: ['time', 'time-outline'],
  Profile: ['person-circle', 'person-circle-outline'],
};

const MainTabs = () => {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.green,
        tabBarInactiveTintColor: colors.subtle,
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 11, marginBottom: Platform.OS === 'ios' ? 0 : 6 },
        tabBarStyle: { height: 64 + insets.bottom, paddingTop: 6, borderTopColor: colors.line, backgroundColor: colors.surface },
        tabBarIcon: ({ focused, color }) => <Ionicons name={TAB_ICONS[route.name][focused ? 0 : 1]} size={24} color={color} />,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: t.tabs.home }} />
      <Tab.Screen name="Plan" component={PlanScreen} options={{ title: t.tabs.plan }} />
      <Tab.Screen name="Music" component={MusicScreen} options={{ title: t.tabs.music }} />
      <Tab.Screen name="History" component={HistoryScreen} options={{ title: t.tabs.history }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: t.tabs.profile }} />
    </Tab.Navigator>
  );
};

const detailOptions = {
  headerShadowVisible: false,
  headerStyle: { backgroundColor: colors.ground },
  headerTintColor: colors.green,
  headerTitleStyle: { fontFamily: fonts.semibold, fontSize: 17, color: colors.ink },
  headerBackTitleVisible: false,
  animation: 'slide_from_right',
};

export default function RootNavigator() {
  const { status } = useAuth();

  useEffect(() => {
    if (status !== 'loading') SplashScreen.hideAsync().catch(() => {});
  }, [status]);

  if (status === 'loading') return null;

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {status === 'signedIn' ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="TherapyDetail" component={TherapyDetailScreen} options={{ ...detailOptions, headerShown: true, title: '' }} />
            <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} options={{ ...detailOptions, headerShown: true, title: '' }} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} options={{ animationTypeForReplace: 'pop' }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
