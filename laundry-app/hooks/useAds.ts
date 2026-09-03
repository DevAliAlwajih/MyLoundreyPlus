import { useQuery } from '@tanstack/react-query';
import api from '../lib/axios';

export interface Ad {
  id: string;
  title: string;
  mediaUrls: string[];
  bodyText?: string | null;
  linkUrl?: string | null;
}

export function useAds() {
  return useQuery({
    queryKey: ['ads'],
    queryFn: async () => {
      const response = await api.get('/ads');
      return response.data?.data as Ad[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
