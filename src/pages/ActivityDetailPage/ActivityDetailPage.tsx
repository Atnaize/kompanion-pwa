import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Layout } from '@components/layout';
import { Button, GlassCard, Skeleton, Tab, TabList, TabPanel, Tabs } from '@components/ui';
import { ActivityMap, ActivityLaps, ActivityPhotos } from '@components/activity';
import { formatPaceFromSpeed } from '@utils/format';
import { isFootActivity } from '@utils/sport';
import { ActivityHero } from './ActivityHero';
import { OverviewTab } from './OverviewTab';
import { ChartsTab } from './ChartsTab';
import { SegmentsTab } from './SegmentsTab';
import { useActivityQueries } from './useActivityQueries';

type TabKey = 'overview' | 'map' | 'charts' | 'laps' | 'segments' | 'photos';

export const ActivityDetailPage = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>('overview');

  const numericId = id ? parseInt(id, 10) : NaN;
  const validId = !Number.isNaN(numericId);

  const {
    activity,
    isLoading,
    error,
    streams,
    laps,
    kudoers,
    comments,
    photos,
    prSegments,
    availability: { hasMap, hasStreams, hasLaps, hasSegments, hasPhotos },
    loadingKudoers,
    loadingComments,
  } = useActivityQueries(numericId, validId);

  useEffect(() => {
    if (error) {
      navigate('/dashboard');
    }
  }, [error, navigate]);

  if (isLoading || !activity) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </Layout>
    );
  }

  const isFoot = isFootActivity(activity.type);
  const formatSpeedValue = (mps: number): string =>
    isFoot ? formatPaceFromSpeed(mps) : `${(mps * 3.6).toFixed(1)} km/h`;
  const maxSpeedText = formatSpeedValue(activity.max_speed);

  return (
    <Layout>
      <div className="space-y-5">
        <Button variant="secondary" size="sm" onClick={() => navigate(-1)}>
          {t('common.back')}
        </Button>

        <ActivityHero activity={activity} isFoot={isFoot} formatSpeedValue={formatSpeedValue} />

        <Tabs value={tab} onChange={(v) => setTab(v as TabKey)}>
          <TabList wrap>
            <Tab value="overview" label={t('activityDetail.tabs.overview')} icon="📋" compact />
            {hasMap && <Tab value="map" label={t('activityDetail.tabs.map')} icon="🗺️" compact />}
            {hasStreams && (
              <Tab value="charts" label={t('activityDetail.tabs.charts')} icon="📊" compact />
            )}
            {hasLaps && (
              <Tab
                value="laps"
                label={t('activityDetail.tabs.laps')}
                count={laps?.length}
                icon="⏱️"
                compact
              />
            )}
            {hasSegments && (
              <Tab
                value="segments"
                label={t('activityDetail.tabs.prs')}
                count={prSegments.length}
                icon="🏆"
                compact
              />
            )}
            {hasPhotos && (
              <Tab
                value="photos"
                label={t('activityDetail.tabs.photos')}
                count={photos?.length}
                icon="📸"
                compact
              />
            )}
          </TabList>

          <TabPanel value="overview" className="mt-4">
            <OverviewTab
              activity={activity}
              isFoot={isFoot}
              hasMap={hasMap}
              hasPhotos={hasPhotos}
              photos={photos}
              kudoers={kudoers}
              comments={comments}
              loadingKudoers={loadingKudoers}
              loadingComments={loadingComments}
              maxSpeedText={maxSpeedText}
              onShowAllPhotos={() => setTab('photos')}
            />
          </TabPanel>

          {hasMap && (
            <TabPanel value="map" className="mt-4">
              <GlassCard className="overflow-hidden p-0">
                <ActivityMap
                  encodedPolyline={activity.map?.polyline || activity.map?.summary_polyline}
                  streamCoords={streams?.latlng?.data as [number, number][] | undefined}
                  className="h-[60vh] min-h-[360px]"
                />
              </GlassCard>
            </TabPanel>
          )}

          {hasStreams && streams && (
            <TabPanel value="charts" className="mt-4">
              <ChartsTab streams={streams} isFoot={isFoot} />
            </TabPanel>
          )}

          {hasLaps && (
            <TabPanel value="laps" className="mt-4">
              <GlassCard className="p-3">
                <ActivityLaps laps={laps!} showPace={isFoot} />
              </GlassCard>
            </TabPanel>
          )}

          {hasPhotos && photos && (
            <TabPanel value="photos" className="mt-4">
              <GlassCard className="p-4">
                <ActivityPhotos photos={photos} />
              </GlassCard>
            </TabPanel>
          )}

          {hasSegments && (
            <TabPanel value="segments" className="mt-4">
              <SegmentsTab prSegments={prSegments} />
            </TabPanel>
          )}
        </Tabs>
      </div>
    </Layout>
  );
};
