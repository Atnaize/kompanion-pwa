import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import { Layout } from '@components/layout';
import { EmptyState, ListSkeleton } from '@components/ui';
import { Tabs, TabList, Tab, TabPanel } from '@components/ui';
import { friendsService } from '@api/services';
import { FriendActionButton, FriendSearch, UserRow } from '@features/friends';
import { MessageButton } from '@features/chat';

type FriendsTab = 'friends' | 'incoming' | 'outgoing';

export const FriendsPage = () => {
  const { t } = useTranslation();
  const [tab, setTab] = useState<FriendsTab>('friends');

  const { data: friends = [], isLoading: friendsLoading } = useQuery({
    queryKey: ['friends'],
    queryFn: async () => (await friendsService.list()).data ?? [],
  });

  const { data: incoming = [], isLoading: incomingLoading } = useQuery({
    queryKey: ['friend-requests-incoming'],
    queryFn: async () => (await friendsService.listIncoming()).data ?? [],
  });

  const { data: outgoing = [], isLoading: outgoingLoading } = useQuery({
    queryKey: ['friend-requests-outgoing'],
    queryFn: async () => (await friendsService.listOutgoing()).data ?? [],
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
            {t('friends.title')}
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('friends.subtitle')}</p>
        </div>

        <section>
          <h3 className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
            {t('friends.findPeople')}
          </h3>
          <FriendSearch />
        </section>

        <section>
          <Tabs value={tab} onChange={(v) => setTab(v as FriendsTab)}>
            <TabList className="mb-4">
              <Tab value="friends" label={t('friends.tabs.friends')} count={friends.length} />
              <Tab value="incoming" label={t('friends.tabs.incoming')} count={incoming.length} />
              <Tab value="outgoing" label={t('friends.tabs.outgoing')} count={outgoing.length} />
            </TabList>

            <TabPanel value="friends">
              {friendsLoading ? (
                <ListSkeleton count={5} />
              ) : friends.length === 0 ? (
                <EmptyState
                  icon={<Users size={32} strokeWidth={1.5} aria-hidden="true" />}
                  title={t('friends.empty.friendsTitle')}
                  description={t('friends.empty.friendsDescription')}
                />
              ) : (
                <div className="space-y-2">
                  {friends.map((friend) => (
                    <UserRow
                      key={friend.id}
                      user={friend}
                      action={
                        <div className="flex items-center gap-1.5">
                          <MessageButton userId={friend.id} compact />
                          <FriendActionButton
                            userId={friend.id}
                            state="friends"
                            compact
                            allowUnfriend
                          />
                        </div>
                      }
                    />
                  ))}
                </div>
              )}
            </TabPanel>

            <TabPanel value="incoming">
              {incomingLoading ? (
                <ListSkeleton count={3} />
              ) : incoming.length === 0 ? (
                <EmptyState
                  icon={<Users size={32} strokeWidth={1.5} aria-hidden="true" />}
                  title={t('friends.empty.incomingTitle')}
                  description={t('friends.empty.incomingDescription')}
                />
              ) : (
                <div className="space-y-2">
                  {incoming.map((req) => (
                    <UserRow
                      key={req.id}
                      user={req.requester}
                      action={
                        <FriendActionButton
                          userId={req.requester.id}
                          state="pending_incoming"
                          compact
                        />
                      }
                    />
                  ))}
                </div>
              )}
            </TabPanel>

            <TabPanel value="outgoing">
              {outgoingLoading ? (
                <ListSkeleton count={3} />
              ) : outgoing.length === 0 ? (
                <EmptyState
                  icon={<Users size={32} strokeWidth={1.5} aria-hidden="true" />}
                  title={t('friends.empty.outgoingTitle')}
                  description={t('friends.empty.outgoingDescription')}
                />
              ) : (
                <div className="space-y-2">
                  {outgoing.map((req) => (
                    <UserRow
                      key={req.id}
                      user={req.addressee}
                      action={
                        <FriendActionButton
                          userId={req.addressee.id}
                          state="pending_outgoing"
                          compact
                        />
                      }
                    />
                  ))}
                </div>
              )}
            </TabPanel>
          </Tabs>
        </section>
      </div>
    </Layout>
  );
};
