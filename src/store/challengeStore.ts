import { create } from 'zustand';
import type { Challenge, ChallengeParticipant, ChallengeEvent } from '@types';
import { challengesService } from '@api/services';
import { useToastStore } from './toastStore';

interface ChallengeState {
  challenges: Challenge[];
  pendingInvitations: ChallengeParticipant[];
  currentChallenge: Challenge | null;
  isLoading: boolean;
  lastEventTimestamp: string | null;
  pollingInterval: number | null;

  // Actions
  fetchChallenges: () => Promise<void>;
  fetchChallengeById: (id: string) => Promise<void>;
  fetchPendingInvitations: () => Promise<void>;
  createChallenge: (
    challenge: Parameters<typeof challengesService.create>[0]
  ) => Promise<Challenge | null>;
  updateChallenge: (
    id: string,
    data: Parameters<typeof challengesService.update>[1]
  ) => Promise<void>;
  deleteChallenge: (id: string) => Promise<void>;
  startChallenge: (id: string) => Promise<void>;
  cancelChallenge: (id: string) => Promise<void>;
  acceptInvitation: (id: string) => Promise<void>;
  declineInvitation: (id: string) => Promise<void>;
  leaveChallenge: (id: string) => Promise<void>;
  inviteFriends: (challengeId: string, userIds: number[]) => Promise<void>;

  // Event polling
  startPolling: () => void;
  stopPolling: () => void;
  pollEvents: () => Promise<void>;

  // Cleanup
  reset: () => void;
}

export const useChallengeStore = create<ChallengeState>((set, get) => ({
  challenges: [],
  pendingInvitations: [],
  currentChallenge: null,
  isLoading: false,
  lastEventTimestamp: null,
  pollingInterval: null,

  fetchChallenges: async () => {
    try {
      set({ isLoading: true });
      const response = await challengesService.list();

      if (response.success && response.data) {
        set({ challenges: response.data, isLoading: false });
      } else {
        set({ isLoading: false });
        useToastStore.getState().addToast('Failed to load challenges', 'error');
      }
    } catch (error) {
      console.error('Error fetching challenges:', error);
      set({ isLoading: false });
      useToastStore.getState().addToast('Failed to load challenges', 'error');
    }
  },

  fetchChallengeById: async (id: string) => {
    try {
      set({ isLoading: true });
      const response = await challengesService.getById(id);

      if (response.success && response.data) {
        set({ currentChallenge: response.data, isLoading: false });
      } else {
        set({ isLoading: false });
        useToastStore.getState().addToast('Failed to load challenge', 'error');
      }
    } catch (error) {
      console.error('Error fetching challenge:', error);
      set({ isLoading: false });
      useToastStore.getState().addToast('Failed to load challenge', 'error');
    }
  },

  fetchPendingInvitations: async () => {
    try {
      const response = await challengesService.getPendingInvitations();

      if (response.success && response.data) {
        set({ pendingInvitations: response.data });
      }
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  },

  createChallenge: async (challenge) => {
    try {
      const response = await challengesService.create(challenge);

      if (response.success && response.data) {
        await get().fetchChallenges();
        useToastStore.getState().addToast('Challenge created successfully!', 'success');
        return response.data;
      } else {
        useToastStore.getState().addToast(response.error || 'Failed to create challenge', 'error');
        return null;
      }
    } catch (error) {
      console.error('Error creating challenge:', error);
      useToastStore.getState().addToast('Failed to create challenge', 'error');
      return null;
    }
  },

  updateChallenge: async (id, data) => {
    try {
      const response = await challengesService.update(id, data);

      if (response.success) {
        await get().fetchChallengeById(id);
        useToastStore.getState().addToast('Challenge updated successfully!', 'success');
      } else {
        useToastStore.getState().addToast('Failed to update challenge', 'error');
      }
    } catch (error) {
      console.error('Error updating challenge:', error);
      useToastStore.getState().addToast('Failed to update challenge', 'error');
    }
  },

  deleteChallenge: async (id) => {
    try {
      const response = await challengesService.delete(id);

      if (response.success) {
        await get().fetchChallenges();
        useToastStore.getState().addToast('Challenge deleted', 'success');
      } else {
        useToastStore.getState().addToast('Failed to delete challenge', 'error');
      }
    } catch (error) {
      console.error('Error deleting challenge:', error);
      useToastStore.getState().addToast('Failed to delete challenge', 'error');
    }
  },

  startChallenge: async (id) => {
    try {
      const response = await challengesService.start(id);

      if (response.success) {
        await get().fetchChallengeById(id);
        useToastStore.getState().addToast('Challenge started!', 'success');
      } else {
        useToastStore.getState().addToast(response.error || 'Failed to start challenge', 'error');
      }
    } catch (error) {
      console.error('Error starting challenge:', error);
      // Extract error message from the error object
      const errorMessage = error instanceof Error ? error.message : 'Failed to start challenge';
      useToastStore.getState().addToast(errorMessage, 'error');
    }
  },

  cancelChallenge: async (id) => {
    try {
      const response = await challengesService.cancel(id);

      if (response.success) {
        await get().fetchChallengeById(id);
        useToastStore.getState().addToast('Challenge cancelled', 'success');
      } else {
        useToastStore.getState().addToast('Failed to cancel challenge', 'error');
      }
    } catch (error) {
      console.error('Error cancelling challenge:', error);
      useToastStore.getState().addToast('Failed to cancel challenge', 'error');
    }
  },

  acceptInvitation: async (id) => {
    try {
      const response = await challengesService.accept(id);

      if (response.success) {
        await Promise.all([get().fetchChallenges(), get().fetchPendingInvitations()]);
        useToastStore.getState().addToast('Invitation accepted!', 'success');
      } else {
        useToastStore.getState().addToast('Failed to accept invitation', 'error');
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      useToastStore.getState().addToast('Failed to accept invitation', 'error');
    }
  },

  declineInvitation: async (id) => {
    try {
      const response = await challengesService.decline(id);

      if (response.success) {
        await get().fetchPendingInvitations();
        useToastStore.getState().addToast('Invitation declined', 'success');
      } else {
        useToastStore.getState().addToast('Failed to decline invitation', 'error');
      }
    } catch (error) {
      console.error('Error declining invitation:', error);
      useToastStore.getState().addToast('Failed to decline invitation', 'error');
    }
  },

  leaveChallenge: async (id) => {
    try {
      const response = await challengesService.leave(id);

      if (response.success) {
        await get().fetchChallenges();
        useToastStore.getState().addToast('Left challenge', 'success');
      } else {
        useToastStore.getState().addToast('Failed to leave challenge', 'error');
      }
    } catch (error) {
      console.error('Error leaving challenge:', error);
      useToastStore.getState().addToast('Failed to leave challenge', 'error');
    }
  },

  inviteFriends: async (challengeId, userIds) => {
    try {
      const response = await challengesService.invite(challengeId, userIds);

      if (response.success) {
        await get().fetchChallengeById(challengeId);
        useToastStore.getState().addToast(`Invited ${userIds.length} friend(s)!`, 'success');
      } else {
        useToastStore.getState().addToast('Failed to send invitations', 'error');
      }
    } catch (error) {
      console.error('Error inviting friends:', error);
      useToastStore.getState().addToast('Failed to send invitations', 'error');
    }
  },

  pollEvents: async () => {
    try {
      const { lastEventTimestamp } = get();
      const response = await challengesService.getEvents(lastEventTimestamp || undefined);

      if (response.success && response.data) {
        const { events, latestTimestamp } = response.data;

        if (events.length > 0) {
          // Update timestamp
          if (latestTimestamp) {
            set({ lastEventTimestamp: latestTimestamp });
          }

          // Refresh challenges if there are new events
          await get().fetchChallenges();

          // Show notifications for important events
          events.forEach((event: ChallengeEvent) => {
            if (event.type === 'activity_added') {
              // Don't show toast for every activity
            } else if (event.type === 'completed') {
              useToastStore.getState().addToast('Challenge completed! 🎉', 'success');
            } else if (event.type === 'milestone_reached') {
              useToastStore.getState().addToast('Milestone reached! 🔥', 'success');
            }
          });
        }
      }
    } catch (error) {
      // Silent fail for polling errors
      console.error('Error polling events:', error);
    }
  },

  startPolling: () => {
    const { pollingInterval, stopPolling } = get();

    // Clear existing interval
    if (pollingInterval) {
      stopPolling();
    }

    // Start polling every 30 seconds
    const interval = setInterval(() => {
      void get().pollEvents();
    }, 30000);

    set({ pollingInterval: interval });

    // Poll immediately
    void get().pollEvents();
  },

  stopPolling: () => {
    const { pollingInterval } = get();
    if (pollingInterval) {
      clearInterval(pollingInterval);
      set({ pollingInterval: null });
    }
  },

  reset: () => {
    get().stopPolling();
    set({
      challenges: [],
      pendingInvitations: [],
      currentChallenge: null,
      isLoading: false,
      lastEventTimestamp: null,
      pollingInterval: null,
    });
  },
}));
