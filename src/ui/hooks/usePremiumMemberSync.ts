import { useCallback } from 'react';
import DataAccessor from '@/lib/data/DataAccessor';
import { buildZaloAuth } from '@/lib/ipc';
import { useAccountStore } from '@/store/accountStore';
import { syncZaloGroups, SyncGroupsProgress } from '@/lib/zaloGroupUtils';

/**
 * Check if account has premium from localStorage (no backend call).
 */
export function isPremiumFromStorage(accountId: string): boolean {
  try {
    const raw = localStorage.getItem(`premium_${accountId}`);
    if (raw) {
      const data = JSON.parse(raw);
      return new Date(data.expiresAt) > new Date();
    }
  } catch {}
  return false;
}

interface UsePremiumMemberSyncOptions {
  accountId: string;
  groupId: string;
  onMembersSynced?: () => void;
}

interface UsePremiumMemberSyncResult {
  /** Check if current account has premium */
  isPremium: boolean;
  /** Sync members: uses scan API if premium, normal sync if not */
  syncMembers: (opts?: {
    onProgress?: (p: SyncGroupsProgress) => void;
    stopRef?: React.MutableRefObject<boolean>;
  }) => Promise<void>;
}

/**
 * Hook for syncing group members with premium fallback.
 * - Premium: uses scanGroupViaBackend for better sync
 * - Non-premium: uses normal syncZaloGroups
 */
export function usePremiumMemberSync({
  accountId,
  groupId,
  onMembersSynced,
}: UsePremiumMemberSyncOptions): UsePremiumMemberSyncResult {
  const isPremium = isPremiumFromStorage(accountId);

  const syncMembers = useCallback(async (opts?: {
    onProgress?: (p: SyncGroupsProgress) => void;
    stopRef?: React.MutableRefObject<boolean>;
  }) => {
    if (!accountId || !groupId) return;

    const acc = useAccountStore.getState().getActiveAccount();
    if (!acc) return;

    if (isPremium) {
      // Premium: use scan API for better sync
      const { scanGroupViaBackend } = await import('@/lib/backendService');
      const result = await scanGroupViaBackend({
        pageId: accountId,
        cookie: acc.cookies,
        imei: acc.imei,
        groupId,
      });

      if (result?.success && result.members?.length > 0) {
        await DataAccessor.saveGroupMembers({
          zaloId: accountId,
          groupId,
          members: result.members.map((m: any) => ({
            memberId: m.userId || m.id,
            displayName: m.displayName || m.zaloName || m.userId || m.id,
            avatar: m.avatar || '',
            role: 0,
          })),
        });
        onMembersSynced?.();
      }
    } else {
      // Non-premium: use normal syncZaloGroups
      const auth = buildZaloAuth(acc, accountId);
      await syncZaloGroups({
        activeAccountId: accountId,
        auth,
        groupId,
        onProgress: opts?.onProgress,
        onPhase1Done: async () => {},
        onGroupEnriched: async () => {
          onMembersSynced?.();
        },
        stopRef: opts?.stopRef,
      });
    }
  }, [accountId, groupId, isPremium, onMembersSynced]);

  return { isPremium, syncMembers };
}
