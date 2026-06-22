import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

// Query community feed
export const useFeed = () => {
  return useQuery({
    queryKey: ['feed'],
    queryFn: async () => {
      const response = await api.get('/posts');
      return response.data.posts;
    },
  });
};

// Create post mutation
export const useCreatePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (postData) => {
      const response = await api.post('/posts', postData);
      return response.data.post;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
};

// Like post mutation
export const useLikePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (postId) => {
      const response = await api.post(`/posts/${postId}/like`);
      return response.data.likes;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
};

// Query coaches list
export const useCoaches = (search = '', discipline = '') => {
  return useQuery({
    queryKey: ['coaches', { search, discipline }],
    queryFn: async () => {
      const response = await api.get('/users', {
        params: { role: 'coach', search, discipline },
      });
      return response.data.users;
    },
  });
};

// Query gyms list
export const useGyms = (search = '', discipline = '', location = '') => {
  return useQuery({
    queryKey: ['gyms', { search, discipline, location }],
    queryFn: async () => {
      const response = await api.get('/gyms', {
        params: { search, discipline, location },
      });
      return response.data.gyms;
    },
  });
};

// Query session bookings
export const useBookings = () => {
  return useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      const response = await api.get('/bookings');
      return response.data.bookings;
    },
  });
};

// Query tournament events
export const useTournaments = () => {
  return useQuery({
    queryKey: ['tournaments'],
    queryFn: async () => {
      const response = await api.get('/tournaments');
      return response.data.tournaments;
    },
  });
};
