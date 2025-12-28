import { LeadData, VisitData, LandingConfig } from '../types';

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
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzzlSQqgxbVjo1zlBG11OyQmAUJUX6rF4-EDslma5Izc_56kIeHycblfJcuFKvZ0v4/exec";

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
const fetchData = async (type: 'leads' | 'visits' | 'config' | 'configs', id?: string): Promise<any> => {
    try {
        let url = `${GOOGLE_SCRIPT_URL}?type=${type}`;
        if (id) {
            url += `&id=${id}`;
        }

        const response = await fetch(url);

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

        return true;
    } catch (error) {
        console.error("Error saving config:", error);
        return false;
    }
};

/**
 * 특정 ID의 랜딩페이지 설정을 가져옵니다.
 */
export const fetchLandingConfigById = async (id: string): Promise<LandingConfig | null> => {
    if (!isUrlConfigured()) {
        console.warn(`Using mock config fetch because GOOGLE_SCRIPT_URL is not configured.`);
        return null;
    }
    return fetchData('config', id);
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
export const uploadImageToDrive = async (file: File): Promise<string | null> => {
    if (!isUrlConfigured()) {
        console.warn("Mock Upload: GOOGLE_SCRIPT_URL not configured");
        return URL.createObjectURL(file);
    }

    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = async () => {
            try {
                const base64Data = (reader.result as string).split(',')[1];

                // Use JSON payload (text/plain) to avoid CORS Preflight and multipart parsing issues in GAS
                const payload = {
                    type: 'upload_image',
                    filename: file.name,
                    mimeType: file.type,
                    base64: base64Data
                };

                // Add 'type' to URL query as a fallback routing mechanism
                const response = await fetch(`${GOOGLE_SCRIPT_URL}?type=upload_image`, {
                    method: 'POST',
                    body: JSON.stringify(payload),
                    headers: {
                        "Content-Type": "text/plain;charset=utf-8",
                    },
                });

                if (!response.ok) {
                    throw new Error(`HTTP Error ${response.status}`);
                }

                const resultText = await response.text();
                // console.log("Raw Server Response:", resultText); // Debugging

                try {
                    const result = JSON.parse(resultText);
                    if (result.result === 'success' && result.url) {
                        resolve(result.url);
                    } else {
                        console.error("Upload failed business logic:", result);
                        alert(`업로드 실패 (서버 응답): ${result.message || '알 수 없는 오류'}`);
                        resolve(null);
                    }
                } catch (jsonErr) {
                    console.error("JSON Parse Error:", jsonErr);
                    console.error("Received Text:", resultText);
                    // If it's HTML, it might be a permission error or 404
                    if (resultText.includes("Google Drive")) {
                        alert("서버 권한 설정이 필요합니다. (Code.gs에서 checkDrivePermissions 실행 필요)");
                    } else {
                        alert("서버 응답을 분석할 수 없습니다. (콘솔 확인)");
                    }
                    resolve(null);
                }

            } catch (error) {
                console.error("Error uploading image:", error);
                alert(`업로드 오류: ${error}`);
                resolve(null);
            }
        };
        reader.readAsDataURL(file);
    });
};