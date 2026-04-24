import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { activitiesService } from '@api/services';

export const useActivityQueries = (numericId: number, validId: boolean) => {
  const activityQuery = useQuery({
    queryKey: ['activity', numericId],
    queryFn: async () => {
      const response = await activitiesService.getById(numericId);
      return response.data;
    },
    enabled: validId,
  });

  const activity = activityQuery.data;

  const { data: streams } = useQuery({
    queryKey: ['activity', numericId, 'streams'],
    queryFn: async () => {
      const response = await activitiesService.getStreams(numericId);
      return response.data;
    },
    enabled: validId && !!activity,
    staleTime: 5 * 60 * 1000,
  });

  const { data: laps } = useQuery({
    queryKey: ['activity', numericId, 'laps'],
    queryFn: async () => {
      const response = await activitiesService.getLaps(numericId);
      return response.data;
    },
    enabled: validId && !!activity,
    staleTime: 5 * 60 * 1000,
  });

  const { data: kudoers, isLoading: loadingKudoers } = useQuery({
    queryKey: ['activity', numericId, 'kudoers'],
    queryFn: async () => {
      const response = await activitiesService.getKudoers(numericId);
      return response.data;
    },
    enabled: validId && !!activity && (activity?.kudos_count ?? 0) > 0,
    staleTime: 60 * 1000,
  });

  const { data: comments, isLoading: loadingComments } = useQuery({
    queryKey: ['activity', numericId, 'comments'],
    queryFn: async () => {
      const response = await activitiesService.getComments(numericId);
      return response.data;
    },
    enabled: validId && !!activity && (activity?.comment_count ?? 0) > 0,
    staleTime: 60 * 1000,
  });

  const totalPhotoCount =
    (activity?.total_photo_count ?? 0) || (activity?.photo_count ?? 0);

  const { data: photos } = useQuery({
    queryKey: ['activity', numericId, 'photos'],
    queryFn: async () => {
      const response = await activitiesService.getPhotos(numericId);
      return response.data;
    },
    enabled: validId && !!activity && totalPhotoCount > 0,
    staleTime: 5 * 60 * 1000,
  });

  const prSegments = useMemo(
    () => activity?.segment_efforts?.filter((e) => e.pr_rank !== null) ?? [],
    [activity]
  );

  const availability = {
    hasMap: !!(activity?.map?.summary_polyline || activity?.map?.polyline),
    hasStreams: !!(streams && Object.keys(streams).length > 0),
    hasLaps: !!(laps && laps.length > 1),
    hasSegments: prSegments.length > 0,
    hasPhotos: !!(photos && photos.length > 0),
  };

  return {
    activity,
    isLoading: activityQuery.isLoading,
    error: activityQuery.error,
    streams,
    laps,
    kudoers,
    comments,
    photos,
    prSegments,
    availability,
    loadingKudoers,
    loadingComments,
  };
};
