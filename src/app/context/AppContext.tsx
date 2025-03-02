'use client';

import { onAuthStateChanged, User } from 'firebase/auth';
import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
} from 'react';
import { auth } from '../firebase';

interface AppContextType {
  user: User | null; // ここにuserの型を詳細に指定できます。
  userId: string | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  selectedRoom: string | null;
  setSelectedRoom: React.Dispatch<React.SetStateAction<string | null>>;
}

interface AppProviderProps {
  children: ReactNode; // children の型を ReactNode に指定
}

const defaultContextData: AppContextType = {
  user: null,
  userId: null,
  setUser: () => {},
  selectedRoom: null,
  setSelectedRoom: () => {},
};

const AppContext = createContext<AppContextType>(defaultContextData);

export function AppProvider({ children }: AppProviderProps) {
  const [user, setUser] = useState<any | null>(null); // userの型をより詳細に指定できます。
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (newUser) => {
      setUser(newUser);
      setUserId(newUser ? newUser.uid : null);
    });

    return () => {
      unsubscribe(); //メモリリーク対策
    };
  }, []);

  return (
    <AppContext.Provider
      value={{ user, userId, setUser, selectedRoom, setSelectedRoom }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
