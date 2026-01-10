
const GITHUB_OWNER = 'markjin9981';
const GITHUB_REPO = 'landing-factory';
const BRANCH = 'main';

// Keys for localStorage
const STORAGE_KEY_TOKEN = 'landing_admin_gh_token';

export const setGithubToken = (token: string) => {
    localStorage.setItem(STORAGE_KEY_TOKEN, token);
};

export const getGithubToken = () => {
    // 1. Try LocalStorage
    const local = localStorage.getItem(STORAGE_KEY_TOKEN);
    if (local) return local;

    // 2. Try Env (for local dev)
    if (import.meta.env.VITE_GITHUB_TOKEN) {
        return import.meta.env.VITE_GITHUB_TOKEN;
    }
    return '';
};

interface GithubFileResponse {
    content: {
        name: string;
        path: string;
        sha: string;
        html_url: string;
        download_url: string;
    };
    commit: any;
}

/**
 * Uploads an image to GitHub Repository (public/uploads folder)
 * Returns the CDN URL (GitHub Pages)
 */
export const uploadImageToGithub = async (file: File): Promise<{ success: boolean, url?: string, message?: string }> => {
    const token = getGithubToken();
    if (!token) return { success: false, message: 'GitHub Token이 설정되지 않았습니다. 설정 메뉴에서 토큰을 입력해주세요.' };

    try {
        // 1. Convert File to Base64
        const base64Content = await toBase64(file);
        // Remove header (data:image/png;base64,)
        const content = base64Content.split(',')[1];

        // 2. Generate Unique Filename
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const path = `public/uploads/${timestamp}_${safeName}`;

        const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`;

        // 3. Upload (PUT)
        const response = await fetch(apiUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: `upload: ${safeName}`,
                content: content,
                branch: BRANCH
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Github Upload Failed');
        }

        // 4. Construct GitHub Pages URL
        // Format: https://{owner}.github.io/{repo}/uploads/{filename}
        // Note: This URL will be valid after the next deployment build (usually 1-2 mins).
        // BUT for immediate preview in editor, we might want to use raw.githubusercontent?
        // Raw URL: https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}
        // Actually, 'public' folder in create-react-app/vite maps to root in build.
        // So 'public/uploads/foo.png' -> 'dist/uploads/foo.png'
        // URL: https://markjin9981.github.io/landing-factory/uploads/${timestamp}_${safeName}

        const pageUrl = `https://${GITHUB_OWNER}.github.io/${GITHUB_REPO}/uploads/${timestamp}_${safeName}`;

        return { success: true, url: pageUrl };

    } catch (error: any) {
        console.error('GitHub Upload Error:', error);
        return { success: false, message: error.message };
    }
};

/**
 * Triggers deployment by updating `data/landingConfigs.json`
 */
export const deployConfigsToGithub = async (configs: any): Promise<{ success: boolean, message?: string }> => {
    const token = getGithubToken();
    if (!token) return { success: false, message: 'GitHub Token이 설정되지 않았습니다.' };

    const FILE_PATH = 'data/landingConfigs.json';
    const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}`;

    try {
        // 1. Get current SHA of the file (required for update)
        const getRes = await fetch(apiUrl, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        let sha = '';
        if (getRes.ok) {
            const data = await getRes.json();
            sha = data.sha;
        }

        // 2. Prepare content
        const jsonContent = JSON.stringify(configs, null, 2);
        // Base64 encode (Safe for UTF-8)
        const content = btoa(unescape(encodeURIComponent(jsonContent)));

        // 3. Update (PUT)
        const putRes = await fetch(apiUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: `deploy: Update landing configs (${Object.keys(configs).length} pages)`,
                content: content,
                sha: sha || undefined, // undefined if new file
                branch: BRANCH
            })
        });

        if (!putRes.ok) {
            const err = await putRes.json();
            throw new Error(err.message);
        }

        return { success: true, message: '설정이 저장되고 배포가 시작되었습니다. (약 1~2분 소요)' };

    } catch (error: any) {
        console.error('GitHub Deploy Error:', error);
        return { success: false, message: error.message };
    }
};

// Helper
const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
});
