import { useState, useEffect } from "react";
import LoginScreen from "./LoginScreen";
import HomeScreen from "./index"; //main app
import { subscribeToAuthChanges } from "../../auth";
import { User } from "firebase/auth";

export default function App() {
    const [user, setUser] = useState< User | null >(null);
    const [initializing, setInitializing] = useState(true);

    useEffect(() => {
        const unsubscribe = subscribeToAuthChanges((currentUser) => {
        setUser(currentUser);
        if (initializing) setInitializing(false);
        });
        return unsubscribe; // cleanup on unmount
    }, []);

    if (initializing) return null;

    return user ? <HomeScreen /> : <LoginScreen />;
}