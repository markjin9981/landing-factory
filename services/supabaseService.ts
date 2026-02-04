/**
 * Supabase Service - Database Operations
 * Replaces Google Sheets API calls with Supabase queries.
 * 
 * Hybrid Strategy:
 * - READ: Supabase (Fast)
 * - WRITE: Supabase (Primary) + GAS (For Email/CRM, Fire-and-forget)
 */
import { supabase, isSupabaseConfigured } from '../utils/supabaseClient';
import { LeadData, VisitData, GlobalSettings, LandingConfig } from '../types';

// GAS URL for Email/CRM Notifications (Hybrid Mode)
const GAS_URL = import.meta.env.VITE_GAS_URL || '';

// =============================================
// LEADS (고객 DB)
// =============================================

/**
 * Submit a new lead to Supabase (and optionally trigger GAS for email/CRM)
 */
export const submitLead = async (data: LeadData): Promise<boolean> => {
    if (!isSupabaseConfigured()) {
        console.warn('[Supabase] Not configured, using mock mode');
        return true;
    }

    try {
        // 1. Insert into Supabase (Primary)
        const { error } = await supabase.from('leads').insert({
            landing_id: data.landing_id,
            page_title: data.page_title,
            name: data.name,
            phone: data.phone,
            privacy_consent: true,
            marketing_consent: !!data.marketing_consent,
            form_data: data, // Store all fields as JSON
            ip: data.ip || null,
            user_agent: data.user_agent || null,
            referrer: data.referrer || null,
        });

        if (error) {
            console.error('[Supabase] Lead insert error:', error);
            return false;
        }

        // 2. Fire-and-forget: Call GAS for Email/CRM (Hybrid Mode)
        if (GAS_URL) {
            try {
                const formData = new FormData();
                formData.append('type', 'lead');
                Object.entries(data).forEach(([key, value]) => {
                    if (value !== undefined) {
                        formData.append(key, String(value));
                    }
                });

                // No await - fire and forget
                fetch(GAS_URL, {
                    method: 'POST',
                    body: formData,
                    mode: 'no-cors',
                }).catch(() => { /* Ignore GAS errors */ });
            } catch {
                // Ignore GAS errors - Supabase insert already succeeded
            }
        }

        return true;
    } catch (err) {
        console.error('[Supabase] Lead submission error:', err);
        return false;
    }
};

/**
 * Fetch all leads (Admin only - requires authentication)
 */
export const fetchLeads = async (): Promise<LeadData[]> => {
    if (!isSupabaseConfigured()) {
        console.warn('[Supabase] Not configured');
        return [];
    }

    try {
        const { data, error } = await supabase
            .from('leads')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[Supabase] Leads fetch error:', error);
            return [];
        }

        // Transform to LeadData format
        return (data || []).map((row) => ({
            timestamp: row.created_at,
            landing_id: row.landing_id,
            name: row.name,
            phone: row.phone,
            page_title: row.page_title,
            user_agent: row.user_agent || '',
            referrer: row.referrer || '',
            ...(row.form_data || {}),
        }));
    } catch (err) {
        console.error('[Supabase] Fetch leads error:', err);
        return [];
    }
};

// =============================================
// CONFIGS (설정 저장)
// =============================================

/**
 * Fetch global settings from Supabase
 */
export const fetchGlobalSettings = async (): Promise<GlobalSettings | null> => {
    if (!isSupabaseConfigured()) {
        console.warn('[Supabase] Not configured');
        return null;
    }

    try {
        const { data, error } = await supabase
            .from('configs')
            .select('config_data')
            .eq('id', 'system_global_v1')
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // No rows found - return null
                return null;
            }
            console.error('[Supabase] Config fetch error:', error);
            return null;
        }

        return data?.config_data as GlobalSettings || null;
    } catch (err) {
        console.error('[Supabase] Fetch settings error:', err);
        return null;
    }
};

/**
 * Save global settings to Supabase
 */
export const saveGlobalSettings = async (settings: GlobalSettings): Promise<boolean> => {
    if (!isSupabaseConfigured()) {
        console.warn('[Supabase] Not configured, using mock mode');
        return true;
    }

    try {
        const { error } = await supabase
            .from('configs')
            .upsert({
                id: 'system_global_v1',
                config_data: settings,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'id' });

        if (error) {
            console.error('[Supabase] Config save error:', error);
            return false;
        }

        return true;
    } catch (err) {
        console.error('[Supabase] Save settings error:', err);
        return false;
    }
};

/**
 * Fetch landing page config by ID
 */
export const fetchLandingConfig = async (id: string): Promise<LandingConfig | null> => {
    if (!isSupabaseConfigured()) {
        return null;
    }

    try {
        const { data, error } = await supabase
            .from('configs')
            .select('config_data')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            console.error('[Supabase] Landing config fetch error:', error);
            return null;
        }

        return data?.config_data as LandingConfig || null;
    } catch (err) {
        console.error('[Supabase] Fetch landing config error:', err);
        return null;
    }
};

/**
 * Save landing page config
 */
export const saveLandingConfig = async (config: LandingConfig): Promise<boolean> => {
    if (!isSupabaseConfigured()) {
        return true;
    }

    try {
        const { error } = await supabase
            .from('configs')
            .upsert({
                id: config.id,
                config_data: config,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'id' });

        if (error) {
            console.error('[Supabase] Landing config save error:', error);
            return false;
        }

        return true;
    } catch (err) {
        console.error('[Supabase] Save landing config error:', err);
        return false;
    }
};

/**
 * Fetch all landing configs (for admin list)
 */
export const fetchAllLandingConfigs = async (): Promise<LandingConfig[]> => {
    if (!isSupabaseConfigured()) {
        return [];
    }

    try {
        const { data, error } = await supabase
            .from('configs')
            .select('id, config_data')
            .neq('id', 'system_global_v1'); // Exclude global settings

        if (error) {
            console.error('[Supabase] Fetch all configs error:', error);
            return [];
        }

        return (data || [])
            .map((row) => row.config_data as LandingConfig)
            .filter((config) => config && config.id); // Filter valid configs
    } catch (err) {
        console.error('[Supabase] Fetch all landing configs error:', err);
        return [];
    }
};

/**
 * Config metadata interface for admin dashboard
 */
export interface ConfigMetadata {
    id: string;
    config: LandingConfig;
    created_at: string | null;
    updated_at: string | null;
}

/**
 * Fetch all landing configs with metadata (created_at, updated_at)
 * Used for enhanced admin dashboard display
 */
export const fetchAllLandingConfigsWithMeta = async (): Promise<ConfigMetadata[]> => {
    if (!isSupabaseConfigured()) {
        return [];
    }

    try {
        const { data, error } = await supabase
            .from('configs')
            .select('id, config_data, created_at, updated_at')
            .neq('id', 'system_global_v1')
            .not('id', 'like', 'draft_%'); // Exclude drafts

        if (error) {
            console.error('[Supabase] Fetch all configs with meta error:', error);
            return [];
        }

        return (data || [])
            .map((row) => ({
                id: row.id,
                config: row.config_data as LandingConfig,
                created_at: row.created_at,
                updated_at: row.updated_at,
            }))
            .filter((item) => item.config && item.config.id);
    } catch (err) {
        console.error('[Supabase] Fetch all landing configs with meta error:', err);
        return [];
    }
};

/**
 * Get visit counts grouped by landing_id
 */
export const getVisitCountsByLandingId = async (): Promise<Map<string, number>> => {
    if (!isSupabaseConfigured()) {
        return new Map();
    }

    try {
        const { data, error } = await supabase
            .from('visits')
            .select('landing_id');

        if (error) {
            console.error('[Supabase] Fetch visit counts error:', error);
            return new Map();
        }

        const countMap = new Map<string, number>();
        (data || []).forEach((row) => {
            const id = row.landing_id || 'unknown';
            countMap.set(id, (countMap.get(id) || 0) + 1);
        });

        return countMap;
    } catch (err) {
        console.error('[Supabase] Get visit counts error:', err);
        return new Map();
    }
};

/**
 * Delete landing config by ID
 */
export const deleteLandingConfig = async (id: string): Promise<boolean> => {
    if (!isSupabaseConfigured()) {
        return true;
    }

    try {
        const { error } = await supabase
            .from('configs')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('[Supabase] Delete config error:', error);
            return false;
        }

        return true;
    } catch (err) {
        console.error('[Supabase] Delete landing config error:', err);
        return false;
    }
};

// =============================================
// VISITS (방문 로그)
// =============================================

/**
 * Log a visit
 */
export const logVisit = async (data: VisitData): Promise<boolean> => {
    if (!isSupabaseConfigured()) {
        return true;
    }

    try {
        const { error } = await supabase.from('visits').insert({
            landing_id: data['Landing ID'] || data.landing_id,
            ip: data.IP || data.ip,
            referrer: data.Referrer || data.referrer,
            user_agent: data.user_agent,
            meta: data, // Store all data as JSON
        });

        if (error) {
            console.error('[Supabase] Visit log error:', error);
            return false;
        }

        return true;
    } catch (err) {
        console.error('[Supabase] Log visit error:', err);
        return false;
    }
};

/**
 * Fetch visits (Admin)
 */
export const fetchVisits = async (): Promise<VisitData[]> => {
    if (!isSupabaseConfigured()) {
        return [];
    }

    try {
        const { data, error } = await supabase
            .from('visits')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1000);

        if (error) {
            console.error('[Supabase] Visits fetch error:', error);
            return [];
        }

        return (data || []).map((row) => ({
            timestamp: row.created_at,
            landing_id: row.landing_id,
            ip: row.ip,
            referrer: row.referrer,
            ...(row.meta || {}),
        }));
    } catch (err) {
        console.error('[Supabase] Fetch visits error:', err);
        return [];
    }
};

// =============================================
// AUTHENTICATION (Supabase Auth)
// =============================================

/**
 * Sign in with email/password
 */
export const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured()) {
        return { success: true }; // Mock mode
    }

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: !!data.session };
    } catch (err: any) {
        return { success: false, error: err.message || 'Unknown error' };
    }
};

/**
 * Sign out
 */
export const signOut = async (): Promise<void> => {
    await supabase.auth.signOut();
};

/**
 * Get current session
 */
export const getSession = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session;
};

/**
 * Subscribe to auth state changes
 */
export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
};

// =============================================
// REHAB DIAGNOSIS (AI 변제금 진단 결과)
// =============================================

export interface RehabDiagnosisData {
    name: string;
    phone: string;
    address: string;
    monthlyIncome: number;
    familySize: number;
    totalDebt: number;
    assets: number;
    spouseAssets?: number;
    monthlyPayment: number;
    debtReductionRate: number;
    courtName: string;
    status: 'POSSIBLE' | 'DIFFICULT' | 'IMPOSSIBLE';
    landing_id?: string;
    timestamp?: string;
}

/**
 * Submit rehab diagnosis result to Supabase
 */
export const submitRehabDiagnosis = async (data: RehabDiagnosisData): Promise<boolean> => {
    if (!isSupabaseConfigured()) {
        console.log('[Mock] Rehab diagnosis submit:', data);
        return true;
    }

    try {
        const { error } = await supabase.from('leads').insert({
            landing_id: data.landing_id || 'ai_diagnosis',
            name: data.name,
            phone: data.phone,
            page_title: 'AI 변제금 진단',
            form_data: {
                type: 'rehab_diagnosis',
                address: data.address,
                monthlyIncome: data.monthlyIncome,
                familySize: data.familySize,
                totalDebt: data.totalDebt,
                assets: data.assets,
                spouseAssets: data.spouseAssets,
                monthlyPayment: data.monthlyPayment,
                debtReductionRate: data.debtReductionRate,
                courtName: data.courtName,
                status: data.status,
            },
            privacy_consent: true,
        });

        if (error) {
            console.error('[Supabase] Rehab diagnosis insert error:', error);
            return false;
        }

        return true;
    } catch (err) {
        console.error('[Supabase] Submit rehab diagnosis error:', err);
        return false;
    }
};

// =============================================
// DRAFTS (임시저장)
// =============================================

/**
 * Save draft to Supabase
 */
export const saveDraft = async (id: string, config: LandingConfig): Promise<boolean> => {
    if (!isSupabaseConfigured()) {
        return true;
    }

    try {
        const { error } = await supabase
            .from('configs')
            .upsert({
                id: `draft_${id}`,
                config_data: config,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'id' });

        if (error) {
            console.error('[Supabase] Draft save error:', error);
            return false;
        }

        return true;
    } catch (err) {
        console.error('[Supabase] Save draft error:', err);
        return false;
    }
};

/**
 * Fetch draft from Supabase
 */
export const fetchDraft = async (id: string): Promise<LandingConfig | null> => {
    if (!isSupabaseConfigured()) {
        return null;
    }

    try {
        const { data, error } = await supabase
            .from('configs')
            .select('config_data')
            .eq('id', `draft_${id}`)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            console.error('[Supabase] Draft fetch error:', error);
            return null;
        }

        return data?.config_data as LandingConfig || null;
    } catch (err) {
        console.error('[Supabase] Fetch draft error:', err);
        return null;
    }
};

/**
 * Delete draft from Supabase
 */
export const deleteDraft = async (id: string): Promise<boolean> => {
    if (!isSupabaseConfigured()) {
        return true;
    }

    try {
        const { error } = await supabase
            .from('configs')
            .delete()
            .eq('id', `draft_${id}`);

        if (error) {
            console.error('[Supabase] Draft delete error:', error);
            return false;
        }

        return true;
    } catch (err) {
        console.error('[Supabase] Delete draft error:', err);
        return false;
    }
};

