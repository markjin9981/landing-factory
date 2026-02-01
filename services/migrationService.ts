/**
 * Data Migration Script: Google Sheets → Supabase
 * 
 * This script migrates existing data from Google Sheets to Supabase.
 * Run this once to transfer all existing configs.
 */
import { supabase, isSupabaseConfigured } from '../utils/supabaseClient';

// GAS URL for fetching existing data
const GAS_URL = import.meta.env.VITE_GAS_URL || '';

/**
 * Migrate all configs from Google Sheets to Supabase
 */
export const migrateConfigsToSupabase = async (): Promise<{
    success: boolean;
    migrated: number;
    errors: string[];
}> => {
    const errors: string[] = [];
    let migrated = 0;

    if (!isSupabaseConfigured()) {
        return { success: false, migrated: 0, errors: ['Supabase not configured'] };
    }

    if (!GAS_URL) {
        return { success: false, migrated: 0, errors: ['GAS URL not configured'] };
    }

    try {
        // 1. Fetch all landing configs from GAS
        console.log('[Migration] Fetching configs from GAS...');
        const listRes = await fetch(`${GAS_URL}?type=list`);
        const listData = await listRes.json();

        if (!listData.configs || !Array.isArray(listData.configs)) {
            errors.push('Failed to fetch config list from GAS');
            return { success: false, migrated, errors };
        }

        // 2. For each config, fetch full data and save to Supabase
        for (const item of listData.configs) {
            const configId = item.id;
            if (!configId) continue;

            try {
                console.log(`[Migration] Migrating config: ${configId}`);

                // Fetch full config from GAS
                const configRes = await fetch(`${GAS_URL}?type=config&id=${configId}`);
                const configData = await configRes.json();

                if (configData.error) {
                    errors.push(`Failed to fetch config ${configId}: ${configData.error}`);
                    continue;
                }

                // Upsert to Supabase
                const { error: insertError } = await supabase
                    .from('configs')
                    .upsert({
                        id: configId,
                        config_data: configData,
                        updated_at: new Date().toISOString(),
                    }, { onConflict: 'id' });

                if (insertError) {
                    errors.push(`Failed to insert config ${configId}: ${insertError.message}`);
                } else {
                    migrated++;
                    console.log(`[Migration] ✓ Migrated: ${configId}`);
                }
            } catch (e: any) {
                errors.push(`Error migrating ${configId}: ${e.message}`);
            }
        }

        // 3. Also migrate global settings
        try {
            console.log('[Migration] Migrating global settings...');
            const globalRes = await fetch(`${GAS_URL}?type=config&id=system_global_v1`);
            const globalData = await globalRes.json();

            if (!globalData.error) {
                const { error: globalError } = await supabase
                    .from('configs')
                    .upsert({
                        id: 'system_global_v1',
                        config_data: globalData,
                        updated_at: new Date().toISOString(),
                    }, { onConflict: 'id' });

                if (globalError) {
                    errors.push(`Failed to migrate global settings: ${globalError.message}`);
                } else {
                    migrated++;
                    console.log('[Migration] ✓ Migrated: system_global_v1');
                }
            }
        } catch (e: any) {
            errors.push(`Error migrating global settings: ${e.message}`);
        }

        return {
            success: errors.length === 0,
            migrated,
            errors,
        };
    } catch (e: any) {
        errors.push(`Migration failed: ${e.message}`);
        return { success: false, migrated, errors };
    }
};

/**
 * Check migration status - compare counts between GAS and Supabase
 */
export const checkMigrationStatus = async (): Promise<{
    gasCount: number;
    supabaseCount: number;
    isSynced: boolean;
}> => {
    let gasCount = 0;
    let supabaseCount = 0;

    try {
        // Count in GAS
        if (GAS_URL) {
            const listRes = await fetch(`${GAS_URL}?type=list`);
            const listData = await listRes.json();
            gasCount = listData.configs?.length || 0;
        }

        // Count in Supabase
        if (isSupabaseConfigured()) {
            const { count } = await supabase
                .from('configs')
                .select('*', { count: 'exact', head: true });
            supabaseCount = count || 0;
        }
    } catch (e) {
        console.error('[Migration] Status check failed:', e);
    }

    return {
        gasCount,
        supabaseCount,
        isSynced: gasCount > 0 && supabaseCount >= gasCount,
    };
};
