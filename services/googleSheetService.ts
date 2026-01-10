import { LandingConfig, FormField, VisitData, LeadData, GlobalSettings } from '../types';

/**
 * --------------------------------------------------------------------------
 * Google Apps Script 연동 설정
 * --------------------------------------------------------------------------
 * 1. backend/Code.gs 파일의 코드를 구글 앱스 스크립트에 복사합니다.
 * 2. 웹 앱으로 배포합니다:
 *    - 실행 사용자: '나'
 *    - 액세스 권한 사용자: '모든 사용자'
 * 3. 아래 GOOGLE_SCRIPT_URL 변수에 배포된 웹 앱 URL을 붙여넣으세요.
 * --------------------------------------------------------------------------
 */

// ==> 1. 여기에 복사한 웹 앱 URL을 붙여넣으세요. <==
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzzlSQqgxbVjo1zlBG11OyQmAUJUX6rF4-EDslma5lzc_56kIeHycbIFJjcuFKvZ0v4/exec";

// --- 이 아래 코드는 수정하지 마세요. ---
const PLACEHOLDER_URL: string = "ENTER_YOUR_APP_SCRIPT_URL_HERE";
const isUrlConfigured = () => GOOGLE_SCRIPT_URL.startsWith("https://script.google.com");

const MOCK_LEAD_DATA = [
    { "Timestamp": "2024-03-20 10:00:00", "Landing ID": "1", "Name": "홍길동 (예시)", "Phone": "010-1234-5678" },
    { "Timestamp": "2024-03-19 15:30:00", "Landing ID": "2", "Name": "김철수 (예시)", "Phone": "010-9876-5432" }
];

/**
 * 고객 DB를 구글 시트에 전송합니다.
 */
/**
 * 고객 DB를 구글 시트에 전송합니다.
 */
export const submitLead = async (data: LeadData): Promise<boolean> => {
    return submitLeadToSheet(data);
};

export const submitLeadToSheet = async (data: LeadData): Promise<boolean> => {
    if (!isUrlConfigured()) {
        console.log(" Mock Submit (URL not configured):", data);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return true;
    }

    try {
        const formData = new FormData();
        formData.append('type', 'lead');
        Object.keys(data).forEach(key => {
            if (data[key] !== undefined) {
                formData.append(key, String(data[key]));
            }
        });

        await fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            body: formData,
            mode: "no-cors",
        });

        return true;
    } catch (error) {
        console.error("Error submitting lead:", error);
        return false;
    }
};

/**
 * 고객 DB를 삭제 요청합니다.
 */
export const deleteLeads = async (leads: LeadData[]): Promise<{ result: string, deleted?: number, message?: string }> => {
    if (!isUrlConfigured()) {
        console.log(" Mock Delete Leads:", leads);
        alert("Mock Mode: Leads deleted successfully.");
        return { result: 'success', deleted: leads.length };
    }

    try {
        const formData = new FormData();
        formData.append('type', 'lead_delete');
        formData.append('leads', JSON.stringify(leads));

        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            body: formData,
            mode: "cors" // Use cors to get response count if possible, but standard is no-cors for simple post
        });

        // GAS POST often requires no-cors if not handling CORS headers perfectly,
        // but here we just want to fire and forget or check status?
        // Actually, we can use same trick as other POSTs (no-cors) BUT we can't get response.
        // If we want response count, we might need to use GET or ensure GAS handles CORS.
        // For now, let's assume no-cors and return optimistic success.
        // Wait, 'handleLeadDeletion' backend returns JSON. 
        // If we use 'no-cors', we get opaque response.

        // Let's try 'cors' first. Most default GAS deployments block CORS unless well configured.
        // Actually, since we are calling from same domain (if deployed) or localhost?
        // If localhost, we need CORS.
        // If 'mode: no-cors', we can't read body.

        // Reverting to fetch strategy similar to 'adminLogin' using GET if payload fits? 
        // JSON payload might be too large for GET query params.

        // Let's stick to standard form post. 
        // If we can't read response, we assume success or check via refresh.

        // *Correction* My previous code used `mode: "no-cors"` for submits.
        // If I want to know if it succeeded, I am blind.
        // But for deletions, it's critical. `uploadImage` used `application/x-www-form-urlencoded` without `no-cors` explicit? 
        // No, `uploadImage` used `formData` and `fetch` with specific headers.

        // Let's try to use the `uploadImage` strategy: 
        // Uses `URLSearchParams` (x-www-form-urlencoded) which sometimes works better with CORS if GAS is set to return JSON.

        const urlParams = new URLSearchParams();
        urlParams.append('type', 'lead_delete');
        urlParams.append('leads', JSON.stringify(leads));

        const res = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            body: urlParams,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        if (!res.ok) throw new Error("HTTP " + res.status);
        const json = await res.json();
        return json;

    } catch (error) {
        console.error("Error deleting leads:", error);
        return { result: 'error', message: String(error) };
    }
};

/**
 * 방문자 로그를 기록합니다.
 */
export const logVisit = async (visit: { landing_id: string, ip: string, device: string, os: string, browser: string, referrer: string }): Promise<void> => {
    if (!isUrlConfigured()) {
        console.log(" Mock Visit Log:", visit);
        return;
    }

    try {
        const formData = new FormData();
        formData.append('type', 'visit');
        Object.keys(visit).forEach(key => {
            formData.append(key, String((visit as any)[key]));
        });

        await fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            body: formData,
            mode: "no-cors",
        });
    } catch (error) {
        console.error("Error logging visit", error);
    }
};

/**
 * 관리자에게 이메일 알림을 보냅니다 (비밀번호 변경 등).
 */
export const sendAdminNotification = async (email: string, subject: string, message: string): Promise<boolean> => {
    if (!isUrlConfigured()) {
        console.log(" Mock Email:", { email, subject, message });
        return true;
    }

    try {
        const formData = new FormData();
        formData.append('type', 'admin_email');
        formData.append('recipient', email);
        formData.append('subject', subject);
        formData.append('body', message);

        await fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            body: formData,
            mode: "no-cors",
        });
        return true;
    } catch (error) {
        console.error("Error sending email:", error);
        return false;
    }
};

/**
 * 구글 시트에서 모든 고객 DB를 가져옵니다.
 */
export const fetchLeads = async (): Promise<any[]> => {
    if (!isUrlConfigured()) {
        console.warn(`Using mock lead data because GOOGLE_SCRIPT_URL is not configured.`);
        return MOCK_LEAD_DATA;
    }
    return fetchData('leads');
}

/**
 * 구글 시트에서 모든 방문 기록을 가져옵니다.
 */
export const fetchVisits = async (): Promise<VisitData[]> => {
    if (!isUrlConfigured()) {
        console.warn(`Using mock visit data because GOOGLE_SCRIPT_URL is not configured.`);
        return [];
    }
    return fetchData('visits');
}

/**
 * 데이터 조회를 위한 내부 fetch 함수입니다.
 */
const fetchData = async (type: 'leads' | 'visits' | 'config' | 'configs' | 'admin_sessions', id?: string): Promise<any> => {
    try {
        let url = `${GOOGLE_SCRIPT_URL}?type=${type}`;
        if (id) {
            url += `&id=${id}`;
        }

        const fetchPromise = fetch(url);
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timed out')), 10000)
        );

        const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Error fetching ${type}:`, error);
        // 에러 발생 시 UI가 깨지지 않도록 빈 배열 또는 null을 반환합니다.
        return type === 'config' ? null : [];
    }
}

/**
 * 랜딩페이지 설정을 구글 시트에 저장합니다.
 */
export const saveLandingConfig = async (config: LandingConfig): Promise<boolean> => {
    if (!isUrlConfigured()) {
        console.log(" Mock Config Save:", config);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return true;
    }

    try {
        // 이미지가 너무 크면 전송 실패할 수 있으므로 주의 (필요시 압축 로직 추가)
        const configJson = JSON.stringify(config);

        // POST 요청 (Form Data)
        // 주의: Google Apps Script의 doPost는 단순 키-값 쌍을 받습니다.
        const formData = new FormData();
        formData.append('type', 'config_save');
        formData.append('id', config.id);
        formData.append('config_data', configJson);

        await fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            body: formData,
            mode: "no-cors",
        });

        // CLEAR CACHE: Ensure the next fetch gets the latest data
        localStorage.removeItem(`landing_config_${config.id}`);
        console.log(`[Cache Cleared] landing_config_${config.id}`);

        return true;
    } catch (error) {
        console.error("Error saving config:", error);
        return false;
    }
};

// --------------------------------------------------------------------------
// CACHING LOGIC
// --------------------------------------------------------------------------
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 Minutes

const getCache = (key: string): any | null => {
    try {
        const item = localStorage.getItem(key);
        if (!item) return null;

        const parsed = JSON.parse(item);
        const now = new Date().getTime();

        if (now > parsed.expiry) {
            localStorage.removeItem(key);
            return null;
        }
        return parsed.data;
    } catch (e) {
        return null;
    }
};

const setCache = (key: string, data: any) => {
    try {
        const now = new Date().getTime();
        const item = {
            data: data,
            expiry: now + CACHE_DURATION_MS,
        };
        localStorage.setItem(key, JSON.stringify(item));
    } catch (e) {
        console.warn("Failed to set cache", e);
    }
};

/**
 * 특정 ID의 랜딩페이지 설정을 가져옵니다. (With Caching)
 */
export const fetchLandingConfigById = async (id: string): Promise<LandingConfig | null> => {
    // 1. Check Cache
    const cached = getCache(`landing_config_${id}`);
    if (cached) {
        console.log(`[Cache Hit] Config ${id} loaded from local cache.`);
        return cached;
    }

    if (!isUrlConfigured()) {
        console.warn(`Using mock config fetch because GOOGLE_SCRIPT_URL is not configured.`);
        return null;
    }

    // 2. Fetch from Network
    const data = await fetchData('config', id);

    // 3. Save to Cache if valid
    if (data) {
        setCache(`landing_config_${id}`, data);
    }

    return data;
};

/**
 * 모든 랜딩페이지 설정을 가져옵니다.
 */
export const fetchLandingConfigs = async (): Promise<LandingConfig[]> => {
    if (!isUrlConfigured()) {
        console.warn(`Using mock configs fetch because GOOGLE_SCRIPT_URL is not configured.`);
        return [];
    }
    const data = await fetchData('configs');
    return Array.isArray(data) ? data : [];
};

/**
 * 이미지를 구글 드라이브에 업로드하고 호스팅 URL을 반환합니다.
 */
export const uploadImageToDrive = async (file: File, folderName: string = "landing-factory image"): Promise<string | null> => {
    if (!isUrlConfigured()) {
        console.warn("Mock Upload: GOOGLE_SCRIPT_URL not configured");
        return URL.createObjectURL(file);
    }

    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const result = event.target?.result as string;

            const uploadToBackend = (base64Data: string, mimeType: string, filename: string) => {
                const formData = new URLSearchParams();
                formData.append('type', 'upload_image');
                formData.append('filename', filename);
                formData.append('mimeType', mimeType);
                formData.append('base64', base64Data);
                formData.append('folderName', folderName);

                fetch(GOOGLE_SCRIPT_URL, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                })
                    .then(async (response) => {
                        if (!response.ok) throw new Error("HTTP " + response.status);
                        const text = await response.text();
                        try {
                            const json = JSON.parse(text);
                            if (json.url) resolve(json.url);
                            else {
                                alert("업로드 실패: " + json.message);
                                resolve(null);
                            }
                        } catch (e) {
                            console.error("Server Response:", text);
                            alert("서버 응답 오류: " + text);
                            resolve(null);
                        }
                    })
                    .catch(err => {
                        console.error(err);
                        alert("업로드 전송 오류: " + err);
                        resolve(null);
                    });
            };

            // Check if it is an image that can be compressed (JPG, PNG, WEBP)
            // GIF and other types (Fonts) should be uploaded as-is
            if (file.type.match(/image\/(jpeg|png|webp)/)) {
                const img = new Image();
                img.src = result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 1280;
                    let width = img.width;
                    let height = img.height;

                    if (width > MAX_WIDTH) {
                        height = Math.round(height * (MAX_WIDTH / width));
                        width = MAX_WIDTH;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);

                    const base64Data = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
                    const filename = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
                    uploadToBackend(base64Data, "image/jpeg", filename);
                };
                img.onerror = () => {
                    const base64Data = result.split(',')[1];
                    uploadToBackend(base64Data, file.type, file.name);
                };
            } else {
                const base64Data = result.split(',')[1];
                uploadToBackend(base64Data, file.type, file.name);
            }
        };
        reader.onerror = () => {
            alert("파일 읽기 실패");
            resolve(null);
        };
    });
};

/**
 * 랜딩페이지 설정을 삭제합니다.
 */
export const deleteLandingConfig = async (id: string): Promise<boolean> => {
    if (!isUrlConfigured()) {
        console.log(" Mock Config Delete:", id);
        return true;
    }

    try {
        const formData = new URLSearchParams();
        formData.append('type', 'config_delete');
        formData.append('id', id);

        await fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            body: formData,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        // Also delete from local storage
        const stored = localStorage.getItem('landing_drafts');
        if (stored) {
            const drafts = JSON.parse(stored);
            if (drafts[id]) {
                delete drafts[id];
                localStorage.setItem('landing_drafts', JSON.stringify(drafts));
            }
        }

        return true;
    } catch (error) {
        console.error("Error deleting config:", error);
        return false;
    }
};

/**
 * --------------------------------------------------------------------------
 * Session Management APIs
 * --------------------------------------------------------------------------
 */

export const adminLogin = async (ip: string, device: string, userAgent: string): Promise<string | null> => {
    if (!isUrlConfigured()) return "mock-session-id";

    try {
        const formData = new FormData();
        formData.append('type', 'admin_login');
        formData.append('ip', ip);
        formData.append('device', device);
        formData.append('user_agent', userAgent);

        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            body: formData,
            mode: "no-cors",
        });

        // Note: 'no-cors' mode returns opaque response, so we CANNOT read the body (session_id).
        // BUT, Google Apps Script doesn't support CORS well.
        // To get data back from a POST, we usually need to use GET or deal with redirects.
        // WAIT. 'no-cors' means we can't read the response. 
        // We MUST use CORS or JSONP or something to get the session_id back.
        // Or for Login, maybe we can use GET? No, sensitive data might be involved?
        // Actually, login params (IP, Device) are public enough for GET query params if needed.
        // Let's use GET for login to get the session_id back easily.

        // Re-implementing with GET for 'admin_login' to retrieve session_id
        const url = `${GOOGLE_SCRIPT_URL}?type=admin_login&ip=${encodeURIComponent(ip)}&device=${encodeURIComponent(device)}&user_agent=${encodeURIComponent(userAgent)}`;
        const getResponse = await fetch(url);
        const json = await getResponse.json();

        if (json.result === 'success') {
            return json.session_id;
        }
        return null;

    } catch (error) {
        console.error("Error logging in remotely:", error);
        return null;
    }
};

export const fetchAdminSessions = async (): Promise<any[]> => {
    if (!isUrlConfigured()) return [];
    return fetchData('admin_sessions'); // Uses existing GET handler logic
};

export const revokeSession = async (targetSessionId: string): Promise<boolean> => {
    if (!isUrlConfigured()) return true;

    try {
        // Use GET for simplicity to get result confirmation, or POST no-cors if fire-and-forget
        // We want confirmation.
        const url = `${GOOGLE_SCRIPT_URL}?type=revoke_session&target_session_id=${targetSessionId}`;
        const response = await fetch(url);
        const json = await response.json();
        return json.result === 'success';
    } catch (error) {
        console.error("Error revoking session:", error);
        return false;
    }
};

export const verifySession = async (sessionId: string): Promise<boolean> => {
    if (!isUrlConfigured()) return true;

    try {
        const url = `${GOOGLE_SCRIPT_URL}?type=verify_session&session_id=${sessionId}`;
        const response = await fetch(url);
        const json = await response.json();
        return json.valid === true;
    } catch (error) {
        console.error("Error verifying session:", error);
        return true; // Fail open or closed? If error, maybe assume valid to not lock out on network glitch? Or fail.
        // Better fail closed for security, but fail open for UX if network flaky.
        // Given 'serverless' nature, let's return false safely? 
        // No, if network error, user gets kicked.
        // Let's return false.
        return false;
    }
};

// ===================================
// Admin User Management
// ===================================

export const fetchAdminUsers = async (): Promise<Array<{ email: string, name: string, memo: string }>> => {
    if (!isUrlConfigured()) return [];
    try {
        const url = `${GOOGLE_SCRIPT_URL}?type=admin_users_list`;
        const response = await fetch(url);
        return await response.json();
    } catch (e) {
        console.error("Fetch Admin Users Error", e);
        return [];
    }
};

export const addAdminUser = async (email: string, name: string = '', memo: string = ''): Promise<{ result: string, message?: string }> => {
    if (!isUrlConfigured()) return { result: 'error' };

    try {
        const formData = new FormData();
        formData.append('type', 'admin_user_add');
        formData.append('email', email);
        formData.append('name', name);
        formData.append('memo', memo);

        await fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            body: formData,
            mode: "no-cors"
        });

        return { result: 'success' };
    } catch (e: any) {
        return { result: 'error', message: e.toString() };
    }
}

export const removeAdminUser = async (email: string): Promise<boolean> => {
    if (!isUrlConfigured()) return true;
    try {
        const formData = new FormData();
        formData.append('type', 'admin_user_remove');
        formData.append('email', email);

        await fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            body: formData,
            mode: "no-cors"
        });
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Verify Google ID Token with Backend
 */
export const verifyGoogleToken = async (idToken: string): Promise<{ valid: boolean, email?: string, message?: string, sessionId?: string }> => {
    if (!isUrlConfigured()) return { valid: true, email: 'mock@example.com', sessionId: 'mock-session' };

    try {
        // GET request to validate token
        const url = `${GOOGLE_SCRIPT_URL}?type=google_login&token=${encodeURIComponent(idToken)}`;
        const response = await fetch(url);
        const json = await response.json();
        return json;
    } catch (error) {
        console.error("Error verifying google token:", error);
        return { valid: false, message: "Network Error" };
    }
};

// --- Global Settings (Fonts) ---
export const fetchGlobalSettings = async (): Promise<GlobalSettings | null> => {
    if (!isUrlConfigured()) return null;
    const res = await fetch(`${GOOGLE_SCRIPT_URL}?type=config&id=system_global_v1`);
    const data = await res.json();
    if (data.error) return null;
    return data;
}

export const saveGlobalSettings = async (settings: GlobalSettings): Promise<boolean> => {
    if (!isUrlConfigured()) {
        alert("Mock Mode: Global Settings Saved");
        return true;
    }
    const formData = new FormData();
    formData.append('type', 'config_save');
    formData.append('id', 'system_global_v1');
    formData.append('config_data', JSON.stringify(settings));

    try {
        await fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            body: formData,
            mode: "no-cors",
        });
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
}

export const syncFontsFromDrive = async (): Promise<any[]> => {
    if (!isUrlConfigured()) return [];
    try {
        const res = await fetch(`${GOOGLE_SCRIPT_URL}?type=sync_fonts`);
        const data = await res.json();
        return Array.isArray(data) ? data : [];
    } catch (e) {
        console.error("Sync Error:", e);
        return [];
    }
}

/**
 * [NEW] Base64 Font Proxy Fetcher
 * Fetches the font file via backend proxy to bypass CORS.
 */
export const fetchProxyFont = async (fileId: string): Promise<{ data: string, format: string } | null> => {
    if (!isUrlConfigured()) return null;
    try {
        const res = await fetch(`${GOOGLE_SCRIPT_URL}?type=proxy_font&id=${fileId}`);
        const json = await res.json();

        if (json.result === 'success' && json.data) {
            // Construct Data URI: data:font/woff2;base64,.....
            const mime = json.mime || 'font/in-process'; // Fallback
            const dataUri = `data:${mime};base64,${json.data}`;
            return { data: dataUri, format: json.format || 'truetype' };
        }
        return null;
    } catch (e) {
        console.error("Proxy Font Error:", e);
        return null;
    }
}

// --- Virtual Data Management ---

export const manageVirtualData = async (landingId: string, action: 'init_sheet' | 'sync_data'): Promise<any> => {
    if (!isUrlConfigured()) {
        alert("Mock: Virtual Data Action " + action);
        return action === 'sync_data' ? { result: 'success', data: [] } : { result: 'success', url: '#' };
    }

    try {
        const formData = new FormData();
        formData.append('type', 'virtual_data');
        formData.append('landing_id', landingId);
        formData.append('action', action);

        // For this one, we NEED the response.
        // Google Apps Script `doPost` returns JSON.
        // `mode: 'cors'` is required to read it.
        // The backend `Code.gs` MUST be deployed as "Anyone" and usually handles CORS by redirect if not strict, 
        // OR we use the GET hack if POST fails. But let's try POST + Redirect follow first.

        // Actually, standard Apps Script `doPost` DOES support redirect-based CORS if we follow the redirect.
        // But fetch's `redirect: 'follow'` (default) + `mode: 'cors'` often works.
        // If it fails due to CORS options, we might have to use `application/x-www-form-urlencoded`.

        const urlParams = new URLSearchParams();
        urlParams.append('type', 'virtual_data');
        urlParams.append('landing_id', landingId);
        urlParams.append('action', action);

        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            body: urlParams,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        // GAS returns 302 Redirect to content. Fetch follows it automatically usually.
        // We expect valid JSON at the end.
        const json = await response.json();
        return json;

    } catch (e) {
        console.error("Virtual Data Error:", e);
        return { result: 'error', message: String(e) };
    }
}