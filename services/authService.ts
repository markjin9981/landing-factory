import { verifyGoogleToken, verifySession } from './googleSheetService';

const SESSION_KEY = 'admin_auth';
const SESSION_ID_KEY = 'admin_session_id';
const ADMIN_EMAIL_KEY = 'admin_email_address';

export const authService = {
    /**
     * Login with Google ID Token
     */
    loginWithGoogle: async (idToken: string): Promise<{ success: boolean, message?: string }> => {
        try {
            const result = await verifyGoogleToken(idToken);

            if (result.valid && result.sessionId) {
                // 1. Local Auth Success
                sessionStorage.setItem(SESSION_KEY, 'true');
                sessionStorage.setItem(SESSION_ID_KEY, result.sessionId);
                if (result.email) {
                    sessionStorage.setItem(ADMIN_EMAIL_KEY, result.email);
                }
                return { success: true };
            } else {
                console.error("Login Failed:", result.message);
                return { success: false, message: result.message || "서버 검증 실패" };
            }
        } catch (e: any) {
            console.error("Login Exception:", e);
            return { success: false, message: "로그인 예외: " + (e.message || e.toString()) };
        }
    },

    /**
     * Check if currently logged in locally.
     */
    isAuthenticated: (): boolean => {
        return sessionStorage.getItem(SESSION_KEY) === 'true';
    },

    /**
     * Get current user email
     */
    getUserEmail: (): string | null => {
        return sessionStorage.getItem(ADMIN_EMAIL_KEY);
    },

    /**
     * Validate Session against Server (for Force Logout)
     */
    validateSession: async (): Promise<boolean> => {
        const sessionId = sessionStorage.getItem(SESSION_ID_KEY);
        if (!sessionId) {
            // If no session ID but authenticated, it might be legacy. Force logout.
            if (authService.isAuthenticated()) {
                authService.logout();
                return false;
            }
            return false;
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
     * Logout (Clear session).
     */
    logout: () => {
        sessionStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem(SESSION_ID_KEY);
        sessionStorage.removeItem(ADMIN_EMAIL_KEY);
    }
};
