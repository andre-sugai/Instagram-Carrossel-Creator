import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';

interface CreditsContextType {
  credits: number | null;
  loading: boolean;
  refreshCredits: () => Promise<void>;
}

const CreditsContext = createContext<CreditsContextType>({
  credits: null,
  loading: true,
  refreshCredits: async () => {},
});

export const CreditsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchCredits = useCallback(async () => {
    if (!user) {
      setCredits(null);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('user_credits')
      .select('credits')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setCredits(data.credits);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchCredits();

    if (!user) return;

    // Real-time subscription
    const channel = supabase
      .channel(`credits-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_credits',
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          console.log('Credit update received via realtime:', payload);
          if (payload.new && typeof payload.new.credits === 'number') {
            setCredits(payload.new.credits);
          } else {
            fetchCredits();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchCredits]);

  return (
    <CreditsContext.Provider value={{ credits, loading, refreshCredits: fetchCredits }}>
      {children}
    </CreditsContext.Provider>
  );
};

export const useCreditsContext = () => {
  return useContext(CreditsContext);
};
