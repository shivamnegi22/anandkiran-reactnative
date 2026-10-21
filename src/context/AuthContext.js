import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import { AppState } from 'react-native';
import { setAuthToken, setUnauthorizedHandler } from '../config/axios';
import { INACTIVITY_LOGOUT_MINUTES } from '../config/env';
import { getProfile, normalizeProfile } from '../api/patient';

const TOKEN_KEY = 'X-ACCESS-TOKEN'; // same key as the previous app version, so patients stay logged in
const PROFILE_KEY = 'PATIENT_PROFILE';
const LAST_ACTIVE_KEY = 'LAST_ACTIVE_AT';
const STAFF_ROLES = ['admin', 'super-admin'];

const AuthContext = createContext(null);

const reducer = (state, action) => {
  switch (action.type) {
    case 'restored':
    case 'signedIn':
      return { status: 'signedIn', user: action.user };
    case 'profile':
      return { ...state, user: { ...state.user, ...action.user } };
    case 'signedOut':
      return { status: 'signedOut', user: null };
    default:
      return state;
  }
};

export class StaffAccountError extends Error {}

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, { status: 'loading', user: null });
  const statusRef = useRef(state.status);
  statusRef.current = state.status;

  const clearSession = useCallback(async () => {
    setAuthToken(null);
    await AsyncStorage.multiRemove([TOKEN_KEY, PROFILE_KEY, LAST_ACTIVE_KEY]).catch(() => {});
    dispatch({ type: 'signedOut' });
  }, []);

  const refreshProfile = useCallback(async () => {
    const profile = await getProfile();
    if (profile) {
      dispatch({ type: 'profile', user: profile });
      AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile)).catch(() => {});
    }
    return profile;
  }, []);

  // Restore a saved session on launch (unless the patient has been away too long).
  useEffect(() => {
    setUnauthorizedHandler(() => clearSession());
    (async () => {
      try {
        const [[, token], [, profileJson], [, lastActive]] = await AsyncStorage.multiGet([TOKEN_KEY, PROFILE_KEY, LAST_ACTIVE_KEY]);
        const away = lastActive ? Date.now() - Number(lastActive) : 0;
        if (!token || away > INACTIVITY_LOGOUT_MINUTES * 60 * 1000) {
          await clearSession();
          return;
        }
        setAuthToken(token);
        dispatch({ type: 'restored', user: profileJson ? JSON.parse(profileJson) : {} });
        AsyncStorage.setItem(LAST_ACTIVE_KEY, String(Date.now())).catch(() => {});
        // Refresh in the background; a 401 signs out, a network error keeps the cached profile.
        refreshProfile().catch(() => {});
      } catch (error) {
        await clearSession();
      }
    })();
  }, [clearSession, refreshProfile]);

  // Inactivity logout: remember when the app went to the background; check on return.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (next) => {
      if (statusRef.current !== 'signedIn') return;
      if (next === 'background' || next === 'inactive') {
        AsyncStorage.setItem(LAST_ACTIVE_KEY, String(Date.now())).catch(() => {});
      } else if (next === 'active') {
        const lastActive = Number(await AsyncStorage.getItem(LAST_ACTIVE_KEY).catch(() => 0));
        if (lastActive && Date.now() - lastActive > INACTIVITY_LOGOUT_MINUTES * 60 * 1000) clearSession();
      }
    });
    return () => subscription.remove();
  }, [clearSession]);

  /** Called with the patient-login response data. Staff accounts are refused: this app is for patients. */
  const signIn = useCallback(async (data) => {
    if (!data?.token) throw new Error('No token in login response');
    if (STAFF_ROLES.includes(data.role)) throw new StaffAccountError('Staff accounts cannot use the patient app');
    const user = normalizeProfile(data);
    setAuthToken(data.token);
    await AsyncStorage.multiSet([
      [TOKEN_KEY, data.token],
      [PROFILE_KEY, JSON.stringify(user)],
      [LAST_ACTIVE_KEY, String(Date.now())],
    ]);
    dispatch({ type: 'signedIn', user });
    refreshProfile().catch(() => {});
  }, [refreshProfile]);

  const value = useMemo(
    () => ({ ...state, signIn, signOut: clearSession, refreshProfile }),
    [state, signIn, clearSession, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
