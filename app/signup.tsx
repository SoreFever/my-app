import { useState } from "react";
import { View, TextInput, Button, Text } from "react-native";
import { logIn, signUp } from "../auth";
import { FirebaseError } from "firebase/app";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SignUpScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSignUp = async () => {
    try {
        setError("");
        await signUp(email, password);
        } catch (e: any) {
            const err = e as FirebaseError
            setError(err.message);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1}}>
            <View style={{ padding: 20, gap: 10 }}>
                <TextInput
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    style={{ borderWidth: 1, padding: 10 }}
                />
                <TextInput
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    style={{ borderWidth: 1, padding: 10 }}
                />
                {error ? <Text style={{ color: "red" }}>{error}</Text> : null}
                <Button title="Create Account" onPress={handleSignUp} />
            </View>
        </SafeAreaView>
    );
}