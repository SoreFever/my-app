import { IconSymbol } from '@/components/ui/icon-symbol';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: 'blue'}}>
      <Tabs.Screen 
        name='index' 
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />
        }}>
      </Tabs.Screen>
      <Tabs.Screen 
        name='record' 
        options={{
          title: 'Record',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="run" size={24} color={color} />
        }}>
      </Tabs.Screen>
      <Tabs.Screen 
        name='profile' 
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Ionicons name="person-circle-outline" size={24} color={color} />
        }}>
      </Tabs.Screen>
    </Tabs>
  );
}
