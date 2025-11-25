import { useEffect, useRef } from 'react';
import { DatabaseService } from '@/lib/database';

export const useUserTracking = (phoneNumber: string, currentStep: number) => {
  const sessionId = useRef<string>('');
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!phoneNumber) return;
    if (isInitialized.current) return;

    sessionId.current = `${phoneNumber}_${Date.now()}`;
    console.log('Creating session for:', phoneNumber);
    
    const createSession = async () => {
      try {
        await DatabaseService.createUserSession(sessionId.current, phoneNumber);
        console.log('User session created:', sessionId.current);
        isInitialized.current = true;
      } catch (error) {
        console.error('Failed to create user session:', error);
      }
    };
    
    createSession();

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Only mark as left if user is actually navigating away
      if (e.target && (e.target as Document).URL !== window.location.href) {
        navigator.sendBeacon('/api/user-left', JSON.stringify({ sessionId: sessionId.current }));
        DatabaseService.updateUserSession(sessionId.current, { status: 'left' });
      }
    };

    const handleVisibilityChange = () => {
      // Only track visibility changes, don't mark as left
      // Tab switching shouldn't mark as left
    };

    const handleUnload = () => {
      // Only mark as left on actual page unload (tab close)
      DatabaseService.updateUserSession(sessionId.current, { status: 'left' });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);
    window.addEventListener('pagehide', handleUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [phoneNumber]);

  useEffect(() => {
    if (sessionId.current && currentStep && isInitialized.current) {
      console.log('Updating step to:', currentStep);
      const updateStep = async () => {
        try {
          await DatabaseService.updateUserSession(sessionId.current, { current_step: currentStep });
          console.log('Step updated to:', currentStep);
        } catch (error) {
          console.error('Failed to update step:', error);
        }
      };
      updateStep();
    }
  }, [currentStep]);

  const trackFieldChange = (fieldName: string) => {
    console.log('Tracking field change:', fieldName, 'Session:', sessionId.current, 'Initialized:', isInitialized.current);
    if (sessionId.current && isInitialized.current) {
      const updateField = async () => {
        try {
          await DatabaseService.updateUserSession(sessionId.current, { current_field: fieldName });
          console.log('Field updated:', fieldName);
        } catch (error) {
          console.error('Failed to track field change:', error);
        }
      };
      updateField();
    }
  };

  const markAsSubmitted = () => {
    if (sessionId.current) {
      DatabaseService.updateUserSession(sessionId.current, { status: 'submitted' });
    }
  };

  return { trackFieldChange, markAsSubmitted };
};