import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import { toast, errorToast, successToast } from '../components/toast/toast';
import { useLoading } from './loading';
import { userService, type UserProfile } from '../api/userService';
import { inviteService } from '../api/inviteService';
import { useNavigate } from 'react-router-dom';
import { syncTokensToCookies, clearAuthCookies } from '../api/cookieAuth';
type SetupData = {
  creative?: any;
  client?: any;
  advocate?: any;
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  openAuth: () => void;
  closeAuth: () => void;
  authOpen: boolean;
  roleSelectionOpen: boolean;
  closeRoleSelection: () => void;
  userProfile: UserProfile | null;
  isLoadingProfile: boolean;
  fetchUserProfile: (isFreshSignIn?: boolean) => Promise<void>;
  producerSetupOpen: boolean;
  openCreativeSetup: () => void;
  closeCreativeSetup: () => void;
  clientSetupOpen: boolean;
  openClientSetup: () => void;
  closeClientSetup: () => void;
  advocateSetupOpen: boolean;
  openAdvocateSetup: () => void;
  closeAdvocateSetup: () => void;
  backToRoleSelection: () => void;
  backToPreviousSetup: () => void;
  startSequentialSetup: (selectedRoles: string[], profile?: UserProfile | null) => void;
  pendingSetups: string[];
  completedSetups: string[];
  isFirstSetup: boolean;
  tempSetupData: SetupData;
  saveSetupData: (role: string, data: any) => void;
  originalSelectedRoles: string[];
  isSetupInProgress: boolean;
  setupCompletionLoading: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUserAuthLoading } = useLoading();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [roleSelectionOpen, setRoleSelectionOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [producerSetupOpen, setCreativeSetupOpen] = useState(false);
  const [clientSetupOpen, setClientSetupOpen] = useState(false);
  const [advocateSetupOpen, setAdvocateSetupOpen] = useState(false);
  const [pendingSetups, setPendingSetups] = useState<string[]>([]);
  const [completedSetups, setCompletedSetups] = useState<string[]>([]);
  const [tempSetupData, setTempSetupData] = useState<SetupData>({});
  const [originalSelectedRoles, setOriginalSelectedRoles] = useState<string[]>([]);
  const [isSetupInProgress, setIsSetupInProgress] = useState(false);
  const [setupCompletionLoading, setSetupCompletionLoading] = useState(false);
  
  // Track last synced tokens to prevent duplicate syncs
  const lastSyncedTokensRef = React.useRef<{ access: string; refresh: string } | null>(null);
  
  // Track if we've already processed the invite flow for this session to prevent loops
  const inviteFlowProcessedRef = React.useRef(false);

  useEffect(() => {
    // Initial read (just set session state, don't sync tokens yet)
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      
      // Don't sync tokens here - let onAuthStateChange handle it
      // to avoid duplicate calls on initial load
    });

    // Subscribe to changes
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      
      // Sync tokens to HttpOnly cookies for XSS protection
      // This handles: INITIAL_SESSION, SIGNED_IN, TOKEN_REFRESHED, etc.
      // Skip syncing on public pages like invite pages to avoid unnecessary API calls
      // Use window.location to ensure we always check the current path
      const currentPath = window.location.pathname;
      const isPublicPage = currentPath.startsWith('/invite/');
      
      if (newSession?.access_token && newSession?.refresh_token && !isPublicPage) {
        // Check if tokens have actually changed to avoid duplicate syncs
        const lastSynced = lastSyncedTokensRef.current;
        const tokensChanged = !lastSynced || 
          lastSynced.access !== newSession.access_token || 
          lastSynced.refresh !== newSession.refresh_token;
        
        if (tokensChanged) {
          // Update last synced tokens
          lastSyncedTokensRef.current = {
            access: newSession.access_token,
            refresh: newSession.refresh_token
          };
          
          // Sync tokens to backend HttpOnly cookies (non-blocking)
          syncTokensToCookies(newSession.access_token, newSession.refresh_token).catch(() => {
            // Non-critical; cookies may sync on next request
          });
        }
      } else if (isPublicPage && newSession) {
        // Skip cookie sync on public pages
      } else {
        // Clear last synced tokens when session is null
        lastSyncedTokensRef.current = null;
      }
      
      // Reset user profile when session becomes null (logout, token expiry, etc.)
      if (!newSession) {
        setUserProfile(null);
        setUserAuthLoading(false);
        // Reset invite flow processed flag on logout
        inviteFlowProcessedRef.current = false;
      }
      
      // Track login only on actual sign in (not token refresh)
      if (newSession && event === 'SIGNED_IN') {
        const justSignedIn = localStorage.getItem('justSignedIn') === 'true';
        if (justSignedIn) {
          // Run login tracking in background without blocking state updates
          supabase.rpc('track_user_login').then(({ error }) => {
            if (error) {
              errorToast('Login Tracking Failed', 'Unable to update login timestamp');
            }
          });
          
          // Fetch user profile to check first_login status
          fetchUserProfile(true); // true = fresh sign-in
          localStorage.removeItem('justSignedIn');
        }
      }
      
      // Close auth popover when user signs in
      if (newSession) {
        setAuthOpen(false);
      }
      
      // Show auth popover and toast when user signs out
      if (!newSession && event === 'SIGNED_OUT') {
        // Reset user profile when signing out
        setUserProfile(null);
        setUserAuthLoading(false);
        
        // Clear HttpOnly cookies via backend
        clearAuthCookies().catch(() => {
          // Non-critical; cookies cleared on next request
        });
        
        // Don't show auth popover on landing page - just show the toast
        const isOnLandingPage = window.location.pathname === '/';
        if (!isOnLandingPage) {
          setAuthOpen(true);
        }
        
        // Show sign out toast (sign out is always a real user action)
        toast({
          title: 'Signed out',
          description: 'You have been successfully signed out.',
          variant: 'info',
          duration: 4000
        });
      }
      
      // Note: TOKEN_REFRESHED events are already handled by the sync above
      // No need to sync again here
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  // Fetch user profile when session exists but profile is null
  useEffect(() => {
    if (session && !userProfile && !isLoadingProfile) {
      fetchUserProfile(false); // false = not a fresh sign-in, just loading profile on page reload
    }
  }, [session]);

  const fetchUserProfile = async (isFreshSignIn: boolean = false) => {
    // Prevent multiple simultaneous calls
    if (isLoadingProfile) {
      return;
    }
    
    // Don't fetch user profile if we're on the InvitePage
    // InvitePage is a public page and doesn't need user profile data
    if (window.location.pathname.startsWith('/invite/')) {
      return;
    }
    
    // Don't process invite logic if setup is already in progress
    // This prevents loops when profile is refreshed during setup
    if (isSetupInProgress) {
      setIsLoadingProfile(true);
      setUserAuthLoading(true);
      try {
        const profile = await userService.getUserProfile();
        setUserProfile(profile);
      } catch {
        // Profile fetch failed; keep existing state
      } finally {
        setIsLoadingProfile(false);
        setUserAuthLoading(false);
      }
      return;
    }
    
    setIsLoadingProfile(true);
    setUserAuthLoading(true);
    
    try {
      const profile = await userService.getUserProfile();
      setUserProfile(profile);

      // Check for pending invite flow
      const pendingInviteToken = localStorage.getItem('pendingInviteToken');
      const invitePreSelectClient = localStorage.getItem('invitePreSelectClient') === 'true';
      const inviteNeedsClientRole = localStorage.getItem('inviteNeedsClientRole') === 'true';
      
      // Check if this is first login
      if (profile?.first_login === true) {
        // Check if user came from invite link
        if (invitePreSelectClient && pendingInviteToken && !inviteFlowProcessedRef.current) {
          // Automatically create client role without showing RoleSelectionPopover
          setSetupCompletionLoading(true);
          
          inviteFlowProcessedRef.current = true;
          localStorage.removeItem('invitePreSelectClient');
          
          try {
            const response = await userService.updateUserRoles(['client']);
            if (response.success) {
              // Refresh profile to get updated roles
              const updatedProfile = await userService.getUserProfile();
              setUserProfile(updatedProfile);
              
              // Start client setup - pass the freshly fetched profile
              setOriginalSelectedRoles(['client']);
              startSequentialSetup(['client'], updatedProfile);
            } else {
              errorToast('Setup Failed', 'Failed to create client account. Please try again.');
              // Clear invite token and reset flag on error
              localStorage.removeItem('pendingInviteToken');
              inviteFlowProcessedRef.current = false;
            }
          } catch (err) {
            errorToast('Setup Failed', 'An error occurred while creating your account.');
            // Clear invite token and reset flag on error
            localStorage.removeItem('pendingInviteToken');
            inviteFlowProcessedRef.current = false;
          }
        } else if (!invitePreSelectClient || !pendingInviteToken) {
          // Show normal role selection only if not invite flow
          setRoleSelectionOpen(true);
        }
        // else: invite flow already processed, do nothing
      } else if (invitePreSelectClient && pendingInviteToken && !inviteFlowProcessedRef.current) {
        // User is authenticated and came from invite link - check if they have client role
        const currentRoles = profile.roles || [];
        if (currentRoles.includes('client')) {
          // User has client role - but don't automatically accept invite if setup is in progress
          if (!isSetupInProgress) {
            setSetupCompletionLoading(true);
            inviteFlowProcessedRef.current = true;
            handleInviteAfterSetup();
          }
        } else {
          setSetupCompletionLoading(true);
          inviteFlowProcessedRef.current = true;
          localStorage.removeItem('invitePreSelectClient');
          
          try {
            const newRoles = [...currentRoles, 'client'];
            const response = await userService.updateUserRoles(newRoles);
            if (response.success) {
              // Refresh profile to get updated roles
              const updatedProfile = await userService.getUserProfile();
              setUserProfile(updatedProfile);
              
              // Start client setup only (not all roles) - pass the freshly fetched profile
              setOriginalSelectedRoles(newRoles);
              startSequentialSetup(['client'], updatedProfile);
            } else {
              errorToast('Setup Failed', 'Failed to add client role. Please try again.');
              // Clear invite token and reset flag on error
              localStorage.removeItem('pendingInviteToken');
              inviteFlowProcessedRef.current = false;
            }
          } catch (err) {
            errorToast('Setup Failed', 'An error occurred while updating your account.');
            localStorage.removeItem('pendingInviteToken');
            inviteFlowProcessedRef.current = false;
          }
        }
      } else if (inviteNeedsClientRole && pendingInviteToken && !inviteFlowProcessedRef.current) {
        const currentRoles = profile.roles || [];
        if (!currentRoles.includes('client')) {
          setSetupCompletionLoading(true);
          inviteFlowProcessedRef.current = true;
          localStorage.removeItem('inviteNeedsClientRole');
          
          try {
            const newRoles = [...currentRoles, 'client'];
            const response = await userService.updateUserRoles(newRoles);
            if (response.success) {
              // Refresh profile to get updated roles
              const updatedProfile = await userService.getUserProfile();
              setUserProfile(updatedProfile);
              
              // Start client setup only - pass the freshly fetched profile
              setOriginalSelectedRoles(newRoles);
              startSequentialSetup(['client'], updatedProfile);
            } else {
              errorToast('Setup Failed', 'Failed to add client role. Please try again.');
              localStorage.removeItem('pendingInviteToken');
              inviteFlowProcessedRef.current = false;
            }
          } catch (err) {
            errorToast('Setup Failed', 'An error occurred while updating your account.');
            localStorage.removeItem('pendingInviteToken');
            inviteFlowProcessedRef.current = false;
          }
        }
      } else {
        if (!isSetupInProgress && !roleSelectionOpen) {
          try {
            const setupStatus = await userService.getIncompleteSetups();
            if (setupStatus.incomplete_setups.length > 0) {
              setOriginalSelectedRoles(profile.roles || []);
              startSequentialSetup(setupStatus.incomplete_setups);
            } else {
              if (isFreshSignIn) {
                toast({
                  title: 'Welcome back!',
                  description: 'You have successfully signed in.',
                  variant: 'success',
                  duration: 4000
                });
              }
            }
          } catch (setupErr) {
            // Only show fallback welcome toast for fresh sign-ins
            if (isFreshSignIn) {
              toast({
                title: 'Welcome back!',
                description: 'You have successfully signed in.',
                variant: 'success',
                duration: 4000
              });
            }
          }
        } else {
          // Setup is in progress or role selection is open, just show welcome toast for fresh sign-ins
          if (isFreshSignIn) {
            toast({
              title: 'Welcome back!',
              description: 'You have successfully signed in.',
              variant: 'success',
              duration: 4000
            });
          }
        }
      }

      // Note: Role-based redirection after login is now handled by AuthCallback component
      // This prevents race conditions and duplicate redirections
    } catch (err) {
      errorToast('Profile Error', 'Failed to load user profile');
    } finally {
      setIsLoadingProfile(false);
      setUserAuthLoading(false);
    }
  };

  const closeRoleSelection = () => {
    setRoleSelectionOpen(false);
    // No need to refresh user profile after role selection - the profile data hasn't changed
    // The roles are updated in the backend, but we don't need to refetch the entire profile
  };

  const signOut = async () => {
    try {
      // First, clear backend cookies (this always succeeds)
      // This ensures HttpOnly cookies are cleared even if Supabase signOut fails
      await clearAuthCookies().catch(() => {
        // Non-critical
      });

      // Try to sign out from Supabase, but don't fail if session is already gone
      // This can fail if the session_id in the JWT doesn't exist in Supabase anymore
      const { error } = await supabase.auth.signOut();
      if (error) {
        // Session may already be expired/deleted; clearing cookies already succeeded above
        // Force clear local session state even if Supabase signOut failed
        // This ensures the user is logged out on the frontend
        setSession(null);
        setUserProfile(null);
        setUserAuthLoading(false);
        
        // Show auth popover
        const isOnLandingPage = window.location.pathname === '/';
        if (!isOnLandingPage) {
          setAuthOpen(true);
        }
        
        // Show success toast - logout succeeded locally
        toast({
          title: 'Signed out',
          description: 'You have been successfully signed out.',
          variant: 'info',
          duration: 4000
        });
      }
    } catch (err) {
      // Force clear local session state
      setSession(null);
      setUserProfile(null);
      setUserAuthLoading(false);
      
      // Clear backend cookies as fallback
      await clearAuthCookies().catch(() => {
        // Ignore errors here - we're already handling a failure case
      });
      
      // Show auth popover
      const isOnLandingPage = window.location.pathname === '/';
      if (!isOnLandingPage) {
        setAuthOpen(true);
      }
      
      // Show success toast - user is logged out locally
      toast({
        title: 'Signed out',
        description: 'You have been successfully signed out.',
        variant: 'info',
        duration: 4000
      });
    }
  };

  const openAuth = () => {
    setAuthOpen(true);
    localStorage.setItem('justSignedIn', 'true'); // Set flag when user opens auth (persists across redirects)
  };

  const closeAuth = () => {
    setAuthOpen(false);
  };

  const startSequentialSetup = async (selectedRoles: string[], profile?: UserProfile | null) => {
    // Store original selection first
    setOriginalSelectedRoles(selectedRoles);
    
    // Use passed profile or fallback to state
    const profileToUse = profile || userProfile;
    
    if (selectedRoles.includes('client') && profileToUse) {
      try {
        const clientSetupData = {
          display_name: profileToUse.name || 'User',
          email: profileToUse.email || '',
        };
        await userService.setupClientProfile(clientSetupData);
      } catch (err: any) {
        const errorMsg = err.response?.data?.message || err.message || 'Unable to create client profile';
        errorToast('Setup Failed', errorMsg);
        setIsSetupInProgress(false);
        setOriginalSelectedRoles([]);
        return;
      }
    } else if (selectedRoles.includes('client') && !profileToUse) {
      errorToast('Setup Failed', 'Unable to create client profile - user data not available');
      setIsSetupInProgress(false);
      setOriginalSelectedRoles([]);
      return;
    }

    // Set up the sequence: creative -> advocate (client is now auto-created)
    const setupOrder = ['creative', 'advocate'];
    const orderedSetups = setupOrder.filter(role => selectedRoles.includes(role));
    setPendingSetups(orderedSetups);
    setCompletedSetups([]); // Reset completed setups
    setTempSetupData({}); // Reset temp setup data
    setIsSetupInProgress(true); // Mark setup as in progress

    // Start with the first setup
    if (orderedSetups.length > 0) {
      openNextSetup(orderedSetups);
    } else if (selectedRoles.includes('client') && selectedRoles.length === 1) {
      setIsSetupInProgress(false);
      setSetupCompletionLoading(true);
      
      const pendingInviteToken = localStorage.getItem('pendingInviteToken');
      
      if (pendingInviteToken) {
        await new Promise(resolve => setTimeout(resolve, 300));
        await handleInviteAfterSetup();
      } else {
        await fetchUserProfile();
        // Now redirect to client dashboard
        navigate('/client', { replace: true });
        successToast('Welcome!', 'Your client account has been created successfully.');
        // Clear loading overlay after navigation
        setTimeout(() => setSetupCompletionLoading(false), 100);
      }
    }
  };

  const redirectToAppropriateRole = () => {
    // Get the user's roles from the original selection or current profile
    const userRoles = originalSelectedRoles.length > 0 ? originalSelectedRoles : (userProfile?.roles || []);
    
    // Priority order for redirection: creative -> client -> advocate
    if (userRoles.includes('creative')) {
      navigate('/creative', { replace: true });
    } else if (userRoles.includes('client')) {
      navigate('/client', { replace: true });
    } else if (userRoles.includes('advocate')) {
      navigate('/advocate', { replace: true });
    } else {
      // Fallback to home if no roles found
      navigate('/', { replace: true });
    }
    
    // Clear loading overlay after navigation
    setTimeout(() => setSetupCompletionLoading(false), 100);
  };

  const handleInviteAfterSetup = async (retryCount = 0, maxRetries = 3) => {
    const pendingInviteToken = localStorage.getItem('pendingInviteToken');
    
    if (pendingInviteToken) {
      try {
        const response = await inviteService.acceptInviteAfterRoleSetup(pendingInviteToken);
        
        if (response.success) {
          localStorage.removeItem('pendingInviteToken');
          localStorage.removeItem('inviteCreativeUserId');
          localStorage.removeItem('invitePreSelectClient');
          localStorage.removeItem('inviteNeedsClientRole');
          inviteFlowProcessedRef.current = false;
          
          try {
            const freshProfile = await userService.getUserProfile();
            setUserProfile(freshProfile);
          } catch {
            // Profile refresh failed; navigation may still work
          }
          
          // Show success message
          if (response.relationship_exists) {
            successToast('Already Connected', response.message);
          } else {
            successToast('Success!', response.message);
          }
          
          // Check if there's a pending service booking to complete
          const pendingBookingData = localStorage.getItem('pendingServiceBooking');
          if (pendingBookingData) {
            try {
              const bookingData = JSON.parse(pendingBookingData);
              
              // Import bookingService dynamically to avoid circular dependencies
              const { bookingService } = await import('../api/bookingService');
              
              // Prepare booking request
              let startTime: string | undefined;
              let endTime: string | undefined;
              
              if (bookingData.isBookingRequired && bookingData.bookingDate && bookingData.startTime) {
                // Parse the time
                const timeMatch = bookingData.startTime.match(/^(\d{2}):(\d{2})/);
                if (timeMatch) {
                  const [, hours, minutes] = timeMatch;
                  startTime = `${hours}:${minutes}:00+00`;
                  
                  // Calculate end time
                  const durationMinutes = bookingData.sessionDuration || 60;
                  const totalEndMinutes = parseInt(hours) * 60 + parseInt(minutes) + durationMinutes;
                  const endHours = Math.floor(totalEndMinutes / 60);
                  const endMinutes = totalEndMinutes % 60;
                  endTime = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}:00+00`;
                }
              }
              
              const bookingResponse = await bookingService.createBooking({
                service_id: bookingData.serviceId,
                booking_date: bookingData.bookingDate,
                start_time: startTime,
                end_time: endTime,
                session_duration: bookingData.sessionDuration,
                notes: bookingData.additionalNotes
              });
              
              if (bookingResponse.success) {
                successToast(
                  'Service Booked!',
                  bookingData.isBookingRequired
                    ? 'Your booking request has been sent to the creative for approval.'
                    : 'Your order has been placed and is awaiting creative approval.'
                );
                
                // Clear pending booking data
                localStorage.removeItem('pendingServiceBooking');
                
                // Ensure profile (and loading state) are committed before navigation so
                // /client/orders RoleGuard sees updated userProfile and renders content
                setSetupCompletionLoading(false);
                try {
                  await fetchUserProfile(false);
                } catch {
                  // Profile refresh failed; navigate anyway
                }
                setTimeout(() => {
                  navigate('/client/orders', { replace: true });
                }, 0);
              } else {
                throw new Error(bookingResponse.message || 'Failed to create booking');
              }
            } catch (bookingErr) {
              // Clear the pending booking even on error to prevent repeated attempts
              localStorage.removeItem('pendingServiceBooking');
              errorToast('Booking Failed', 'Account created but booking failed. Please book again from the creative\'s profile.');
              
              // Navigate to client dashboard
              navigate('/client', { replace: true });
              setTimeout(() => {
                setSetupCompletionLoading(false);
              }, 100);
            }
          } else {
            navigate('/client', { replace: true });
            setTimeout(() => {
              setSetupCompletionLoading(false);
            }, 100);
          }
        } else {
          if (response.message?.includes('Client profile not found') && retryCount < maxRetries) {
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 500 * (retryCount + 1)));
            return handleInviteAfterSetup(retryCount + 1, maxRetries);
          }
          
          setSetupCompletionLoading(false);
          inviteFlowProcessedRef.current = false; // Reset on error
          errorToast('Connection Failed', response.message);
        }
      } catch (err) {
        setSetupCompletionLoading(false);
        inviteFlowProcessedRef.current = false;
        errorToast('Connection Failed', 'Unable to connect with creative. Please try again.');
      }
    } else {
      // No pending invite - refresh user profile to get updated data after setup completion
      // Also clear any invite flags that might still be present
      localStorage.removeItem('invitePreSelectClient');
      localStorage.removeItem('inviteNeedsClientRole');
      
      if (session?.user?.id) {
        try {
          await fetchUserProfile(false); // false = not a fresh sign-in, just refreshing after setup
          // After profile refresh, redirect to appropriate role page immediately
          redirectToAppropriateRole();
        } catch (err) {
          redirectToAppropriateRole();
        }
      } else {
        // No session, redirect to appropriate role page
        redirectToAppropriateRole();
      }
    }
  };

  const openNextSetup = (setups: string[]) => {
    if (setups.length === 0) return;
    
    const nextSetup = setups[0];
    if (nextSetup === 'creative') {
      setCreativeSetupOpen(true);
    } else if (nextSetup === 'advocate') {
      setAdvocateSetupOpen(true);
    }
    // Client setup is now auto-created, no dialog needed
  };

  const openCreativeSetup = () => {
    setCreativeSetupOpen(true);
  };

  const closeCreativeSetup = () => {
    // Mark creative as completed
    const currentSetup = pendingSetups[0];
    if (currentSetup === 'creative') {
      setCompletedSetups(prev => [...prev, 'creative']);
    }
    // Continue to next setup if there are pending ones
    const remainingSetups = pendingSetups.slice(1);
    setPendingSetups(remainingSetups);
    
    if (remainingSetups.length > 0) {
      setCreativeSetupOpen(false);
      openNextSetup(remainingSetups);
    } else {
      // All setups complete - show loading overlay BEFORE closing popover
      setIsSetupInProgress(false);
      setSetupCompletionLoading(true);
      setCreativeSetupOpen(false);
      // Refresh user profile to get updated first_login status
      fetchUserProfile();
      handleInviteAfterSetup();
    }
  };

  const openClientSetup = () => {
    setClientSetupOpen(true);
  };

  const closeClientSetup = () => {
    // Mark client as completed
    const currentSetup = pendingSetups[0];
    if (currentSetup === 'client') {
      setCompletedSetups(prev => [...prev, 'client']);
    }
    // Continue to next setup if there are pending ones
    const remainingSetups = pendingSetups.slice(1);
    setPendingSetups(remainingSetups);
    
    if (remainingSetups.length > 0) {
      setClientSetupOpen(false);
      openNextSetup(remainingSetups);
    } else {
      // All setups complete - show loading overlay BEFORE closing popover
      setIsSetupInProgress(false);
      setSetupCompletionLoading(true);
      setClientSetupOpen(false);
      // Refresh user profile to get updated first_login status
      fetchUserProfile();
      handleInviteAfterSetup();
    }
  };

  const openAdvocateSetup = () => {
    setAdvocateSetupOpen(true);
  };

  const closeAdvocateSetup = () => {
    // Mark advocate as completed
    const currentSetup = pendingSetups[0];
    if (currentSetup === 'advocate') {
      setCompletedSetups(prev => [...prev, 'advocate']);
    }
    // Continue to next setup if there are pending ones
    const remainingSetups = pendingSetups.slice(1);
    setPendingSetups(remainingSetups);
    
    if (remainingSetups.length > 0) {
      setAdvocateSetupOpen(false);
      openNextSetup(remainingSetups);
    } else {
      // All setups complete - show loading overlay BEFORE closing popover
      setIsSetupInProgress(false);
      setSetupCompletionLoading(true);
      setAdvocateSetupOpen(false);
      // Refresh user profile to get updated first_login status
      fetchUserProfile();
      handleInviteAfterSetup();
    }
  };

  const saveSetupData = (role: string, data: any) => {
    setTempSetupData(prev => ({ ...prev, [role]: data }));
  };

  const backToRoleSelection = () => {
    setCreativeSetupOpen(false);
    setClientSetupOpen(false);
    setAdvocateSetupOpen(false);
    setPendingSetups([]); // Clear pending setups when going back
    setCompletedSetups([]); // Clear completed setups when going back
    setTempSetupData({}); // Clear temp setup data when going back to roles
    setIsSetupInProgress(false); // Clear setup in progress flag
    setRoleSelectionOpen(true);
  };

  const backToPreviousSetup = () => {
    // Close current setup
    setCreativeSetupOpen(false);
    setClientSetupOpen(false);
    setAdvocateSetupOpen(false);
    
    // Get the previous setup from completed setups
    if (completedSetups.length > 0) {
      const previousSetup = completedSetups[completedSetups.length - 1];
      // Remove the last completed setup and add it back to pending
      setCompletedSetups(prev => prev.slice(0, -1));
      setPendingSetups(prev => [previousSetup, ...prev]);
      
      // Open the previous setup (skip client as it's auto-created)
      if (previousSetup === 'creative') {
        setCreativeSetupOpen(true);
      } else if (previousSetup === 'advocate') {
        setAdvocateSetupOpen(true);
      }
      // Client setup is auto-created, no dialog to reopen
    }
  };

  // Determine if this is the first setup (no completed setups yet)
  const isFirstSetup = completedSetups.length === 0;

  const value = useMemo<AuthContextValue>(() => ({
    session,
    user: session?.user ?? null,
    isAuthenticated: !!session,
    signOut,
    openAuth,
    closeAuth,
    authOpen,
    roleSelectionOpen,
    closeRoleSelection,
    userProfile,
    isLoadingProfile,
    fetchUserProfile,
    producerSetupOpen,
    openCreativeSetup,
    closeCreativeSetup,
    clientSetupOpen,
    openClientSetup,
    closeClientSetup,
    advocateSetupOpen,
    openAdvocateSetup,
    closeAdvocateSetup,
    backToRoleSelection,
    backToPreviousSetup,
    startSequentialSetup,
    pendingSetups,
    completedSetups,
    isFirstSetup,
    tempSetupData,
    saveSetupData,
    originalSelectedRoles,
    isSetupInProgress,
    setupCompletionLoading,
  }), [session, authOpen, roleSelectionOpen, userProfile, isLoadingProfile, producerSetupOpen, clientSetupOpen, advocateSetupOpen, pendingSetups, completedSetups, isFirstSetup, tempSetupData, originalSelectedRoles, isSetupInProgress, setupCompletionLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
