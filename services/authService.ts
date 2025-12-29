
/**
 * Authentication Service
 * Manages admin credentials and session state using LocalStorage/SessionStorage.
 */
import { adminLogin, verifySession } from './googleSheetService';

const STORAGE_KEY_EMAIL = 'admin_email';
const STORAGE_KEY_PASSWORD = 'admin_password';
const SESSION_KEY = 'admin_auth';
const SESSION_ID_KEY = 'admin_session_id';

export const authService = {
    /**
     * Initialize or retrieve current credentials.
     */
    getCredentials: () => {
        return {
            email: localStorage.getItem(STORAGE_KEY_EMAIL) || '',
            password: localStorage.getItem(STORAGE_KEY_PASSWORD) || 'admin', // Default password
        };
    },

    /**
     * Verify login credentials and Create Session.
     */
    login: async (inputEmail: string, inputPass: string): Promise<boolean> => {
        const creds = authService.getCredentials();

        // If email is configured, it must match.
        // If input email is empty but config has email -> Fail
        // If config has no email -> Ignore email input
        const isEmailValid = creds.email ? (inputEmail === creds.email) : true;
        const isPassValid = inputPass === creds.password;

        if (isEmailValid && isPassValid) {
            // 1. Local Auth Success
            sessionStorage.setItem(SESSION_KEY, 'true');

            // 2. Remote Session Tracking (Async but await for ID)
            try {
                // Fetch IP info
                let ip = 'Unknown';

                // Simple device parsing
                let device = navigator.userAgent;
                if (device.includes('Windows')) device = 'Windows PC';
                else if (device.includes('Macintosh')) device = 'Mac';
                else if (device.includes('Linux')) device = 'Linux';
                else if (device.includes('Android')) device = 'Android';
                else if (device.includes('iPhone')) device = 'iPhone/iPad';

                try {
                    const ipRes = await fetch('https://ipapi.co/json/');
                    const ipData = await ipRes.json();
                    if (ipData.ip) {
                        ip = ipData.ip + " (" + (ipData.city || "") + ", " + (ipData.country_name || "") + ")";
                    }
                } catch (e) {
                    console.warn("IP fetch failed", e);
                }

                const sessionId = await adminLogin(ip, device, navigator.userAgent);
                if (sessionId) {
                    sessionStorage.setItem(SESSION_ID_KEY, sessionId);
                }
            } catch (e) {
                console.error("Session registration failed", e);
            }

            return true;
        }
        return false;
    },

    /**
     * Check if currently logged in locally.
     */
    isAuthenticated: (): boolean => {
        return sessionStorage.getItem(SESSION_KEY) === 'true';
    },

    /**
     * [NEW] Validate Session against Server (for Force Logout)
     */
    validateSession: async (): Promise<boolean> => {
        const sessionId = sessionStorage.getItem(SESSION_ID_KEY);
        if (!sessionId) {
            // Legacy or offline session -> consider valid or implement forced logout policy
            // For now, allow it to prevent blocking users who just logged in before deployment
            return true;
        }

        const isValid = await verifySession(sessionId);
        if (!isValid) {
            authService.logout();
            return false;
        }
        return true;
    },

    getSessionId: () => sessionStorage.getItem(SESSION_ID_KEY),

    /**
     * Update admin credentials.
     */
    updateCredentials: (newEmail: string, newPass: string) => {
        localStorage.setItem(STORAGE_KEY_EMAIL, newEmail);
        localStorage.setItem(STORAGE_KEY_PASSWORD, newPass);
    },

    /**
     * Logout (Clear session).
     */
    logout: () => {
        sessionStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem(SESSION_ID_KEY);
    }
};
