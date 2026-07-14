import { View, Text, Button } from 'react-native';
import { logOut } from "../../auth"

export default function HomeScreen() {
  const handleLogin = async () => {
    logOut();
  }
  return (
    <View style={{flex: 1, backgroundColor: 'white'}}>
      <Button title="Log Out" onPress={handleLogin}></Button>
    </View>
  );
}

