import { useEffect, useRef } from 'react';
import { DatabaseService } from '@/lib/database';

export const useUserTracking = (phoneNumber: string, currentStep: number) => {
  const sessionId = useRef<string>('');
  const isInitialized = useRef(false);
  const currentStatus = useRef<string>('active');

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

    const handleBeforeUnload = () => {
      if (currentStatus.current !== 'time_runout') {
        DatabaseService.updateUserSession(sessionId.current, { status: 'left' });
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && currentStatus.current !== 'time_runout') {
        DatabaseService.updateUserSession(sessionId.current, { status: 'left' });
      }
    };

    let currentUrl = window.location.href;
    
    const checkUrlChange = () => {
      if (window.location.href !== currentUrl && currentStatus.current !== 'time_runout') {
        DatabaseService.updateUserSession(sessionId.current, { status: 'left' });
        currentUrl = window.location.href;
      }
    };

    const urlCheckInterval = setInterval(checkUrlChange, 1000);
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(urlCheckInterval);
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
    if (sessionId.current && isInitialized.current && navigator.onLine) {
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

  const setStatus = (status: string) => {
    if (sessionId.current) {
      currentStatus.current = status;
      DatabaseService.updateUserSession(sessionId.current, { status });
    }
  };

  return { trackFieldChange, markAsSubmitted, setStatus };
};