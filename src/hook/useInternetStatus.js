import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

export default function useInternetStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const online =
        state.isConnected && state.isInternetReachable !== false;

      setIsOnline(online);
      setIsChecking(false);
    });

    return unsubscribe;
  }, []);

  return { isOnline, isChecking };
}