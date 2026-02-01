/**
 * Auth Service - Supabase Auth Integration
 * 
 * Replaces Google Sign-In + GAS session system with Supabase Auth.
 * Supports both Email/Password and Google OAuth login.
 */
import { supabase, isSupabaseConfigured } from '../utils/supabaseClient';
import { User, Session } from '@supabase/supabase-js';

// Legacy keys for backward compatibility during migration
const LEGACY_SESSION_KEY = 'admin_auth';
const LEGACY_SESSION_ID_KEY = 'admin_session_id';
const LEGACY_EMAIL_KEY = 'admin_email_address';

export const authService = {
    /**
     * Login with Email and Password (Supabase Auth)
     */
    loginWithEmail: async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
        if (!isSupabaseConfigured()) {
            return { success: false, message: 'Supabase not configured' };
        }

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                console.error('[Auth] Login error:', error.message);
                return { success: false, message: error.message };
            }

            if (data.session) {
                // Also set legacy keys for components still using them
                sessionStorage.setItem(LEGACY_SESSION_KEY, 'true');
                sessionStorage.setItem(LEGACY_EMAIL_KEY, data.user?.email || '');
                return { success: true };
            }

            return { success: false, message: '로그인 실패' };
        } catch (e: any) {
            console.error('[Auth] Login exception:', e);
            return { success: false, message: e.message || 'Unknown error' };
        }
    },

    /**
     * Login with Google OAuth (Supabase Auth)
     */
    loginWithGoogle: async (): Promise<{ success: boolean; message?: string }> => {
        if (!isSupabaseConfigured()) {
            return { success: false, message: 'Supabase not configured' };
        }

        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin + '/admin',
                },
            });

            if (error) {
                console.error('[Auth] Google OAuth error:', error.message);
                return { success: false, message: error.message };
            }

            // OAuth redirects, so success here means redirect initiated
            return { success: true };
        } catch (e: any) {
            console.error('[Auth] Google OAuth exception:', e);
            return { success: false, message: e.message || 'Unknown error' };
        }
    },

    /**
     * Legacy Google ID Token login (for backward compatibility)
     * Falls back to legacy GAS verification if needed
     */
    loginWithGoogleToken: async (idToken: string): Promise<{ success: boolean; message?: string }> => {
        // For now, redirect to use the new OAuth flow
        console.warn('[Auth] Legacy Google token login deprecated. Use loginWithGoogle() instead.');
        return authService.loginWithGoogle();
    },

    /**
     * Check if user is authenticated
     */
    isAuthenticated: (): boolean => {
        // First check Supabase session (async check happens in validateSession)
        // For sync check, we rely on legacy key or optimistic check
        if (sessionStorage.getItem(LEGACY_SESSION_KEY) === 'true') {
            return true;
        }
        return false;
    },

    /**
     * Get current user (async)
     */
    getUser: async (): Promise<User | null> => {
        if (!isSupabaseConfigured()) return null;

        const { data: { user } } = await supabase.auth.getUser();
        return user;
    },

    /**
     * Get current session (async)
     */
    getSession: async (): Promise<Session | null> => {
        if (!isSupabaseConfigured()) return null;

        const { data: { session } } = await supabase.auth.getSession();
        return session;
    },

    /**
     * Get current user email (sync, from storage)
     */
    getUserEmail: (): string | null => {
        return sessionStorage.getItem(LEGACY_EMAIL_KEY);
    },

    /**
     * Validate session against Supabase
     */
    validateSession: async (): Promise<boolean> => {
        if (!isSupabaseConfigured()) {
            // If Supabase not configured, check legacy storage
            return sessionStorage.getItem(LEGACY_SESSION_KEY) === 'true';
        }

        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (session) {
                // Update legacy storage for sync access
                sessionStorage.setItem(LEGACY_SESSION_KEY, 'true');
                sessionStorage.setItem(LEGACY_EMAIL_KEY, session.user?.email || '');
                return true;
            } else {
                // No valid session - clear legacy storage
                authService.logout();
                return false;
            }
        } catch (e) {
            console.error('[Auth] Session validation error:', e);
            return false;
        }
    },

    /**
     * Legacy session ID getter (for backward compatibility)
     */
    getSessionId: (): string | null => {
        return sessionStorage.getItem(LEGACY_SESSION_ID_KEY);
    },

    /**
     * Logout
     */
    logout: async () => {
        // Clear Supabase session
        if (isSupabaseConfigured()) {
            await supabase.auth.signOut();
        }

        // Clear legacy storage
        sessionStorage.removeItem(LEGACY_SESSION_KEY);
        sessionStorage.removeItem(LEGACY_SESSION_ID_KEY);
        sessionStorage.removeItem(LEGACY_EMAIL_KEY);
    },

    /**
     * Subscribe to auth state changes
     */
    onAuthStateChange: (callback: (event: string, session: Session | null) => void) => {
        return supabase.auth.onAuthStateChange((event, session) => {
            // Update legacy storage on auth changes
            if (session) {
                sessionStorage.setItem(LEGACY_SESSION_KEY, 'true');
                sessionStorage.setItem(LEGACY_EMAIL_KEY, session.user?.email || '');
            } else {
                sessionStorage.removeItem(LEGACY_SESSION_KEY);
                sessionStorage.removeItem(LEGACY_EMAIL_KEY);
            }
            callback(event, session);
        });
    },

    /**
     * Initialize auth state on app load
     */
    initialize: async (): Promise<void> => {
        if (!isSupabaseConfigured()) return;

        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            sessionStorage.setItem(LEGACY_SESSION_KEY, 'true');
            sessionStorage.setItem(LEGACY_EMAIL_KEY, session.user?.email || '');
        }
    },
};

// Auto-initialize on import
authService.initialize();
