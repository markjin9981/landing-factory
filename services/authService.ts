
/**
 * Authentication Service
 * Manages admin credentials and session state using LocalStorage/SessionStorage.
 * 
 * Note: Since this is a serverless application (Google Sheets backend),
 * we store "Admin Credentials" in the browser's LocalStorage for persistence across reloads.
 * The active session is stored in SessionStorage (cleared on tab close).
 */

const STORAGE_KEY_EMAIL = 'admin_email';
const STORAGE_KEY_PASSWORD = 'admin_password';
const SESSION_KEY = 'admin_auth';

export const authService = {
    /**
     * Initialize or retrieve current credentials.
     * Defaults to 'admin' / 'admin' (or just password 'admin') if not set.
     */
    getCredentials: () => {
        return {
            email: localStorage.getItem(STORAGE_KEY_EMAIL) || '',
            password: localStorage.getItem(STORAGE_KEY_PASSWORD) || 'admin', // Default password
        };
    },

    /**
     * Verify login credentials.
     */
    login: (inputEmail: string, inputPass: string): boolean => {
        const creds = authService.getCredentials();

        // If email is configured, it must match.
        // If input email is empty but config has email -> Fail
        // If config has no email -> Ignore email input
        const isEmailValid = creds.email ? (inputEmail === creds.email) : true;
        const isPassValid = inputPass === creds.password;

        if (isEmailValid && isPassValid) {
            sessionStorage.setItem(SESSION_KEY, 'true');
            return true;
        }
        return false;
    },

    /**
     * Check if currently logged in.
     */
    isAuthenticated: (): boolean => {
        return sessionStorage.getItem(SESSION_KEY) === 'true';
    },

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
    }
};
