
/**
 * Authentication Service
 * Manages admin credentials and session state using LocalStorage/SessionStorage.
 */
import { adminLogin, verifySession, sendAdminNotification } from './googleSheetService';

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
            email: localStorage.getItem(STORAGE_KEY_EMAIL) || '2882a@naver.com',
            password: localStorage.getItem(STORAGE_KEY_PASSWORD) || 'blockprompt1!!',
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
                else if (device.includes('Mac')) device = 'Mac';
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

                // Register Session
                const sessionId = await adminLogin(ip, device, navigator.userAgent);
                if (sessionId) {
                    sessionStorage.setItem(SESSION_ID_KEY, sessionId);
                }

                // 3. [NEW] Send Login Notification Email
                // We use the configured email (creds.email) as recipient
                if (creds.email) {
                    // Fire and forget to not block login
                    sendAdminNotification(
                        creds.email,
                        '[Landing Factory] 새로운 로그인 감지',
                        `관리자 계정으로 새로운 로그인이 발생했습니다.\n\n시간: ${new Date().toLocaleString()}\nIP: ${ip}\n기기: ${device}\n\n본인이 아니라면 즉시 비밀번호를 변경하세요.`
                    ).catch(err => console.error("Login notify failed", err));
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
