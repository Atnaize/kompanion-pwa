import { useState } from 'react';
import { Layout } from '@components/layout';
import { Tabs, TabList, Tab, TabPanel } from '@components/ui';
import { TokensTab } from './TokensTab';
import { NotificationsTab } from './NotificationsTab';
import { ApiTestsTab } from './ApiTestsTab';
import { StorageTab } from './StorageTab';
import { WebhooksTab } from './WebhooksTab';
import { QuotaTab } from './QuotaTab';

export const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('tokens');

  return (
    <Layout>
      <div className="space-y-4">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Admin / Debug Page</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Debug token and API issues</p>
        </div>

        <Tabs value={activeTab} onChange={setActiveTab}>
          <TabList className="mb-6">
            <Tab value="tokens" label="Tokens" />
            <Tab value="notifications" label="Notifications" />
            <Tab value="webhooks" label="Webhooks" />
            <Tab value="quota" label="Quota" />
            <Tab value="api" label="API Tests" />
            <Tab value="storage" label="Storage" />
          </TabList>

          <TabPanel value="tokens">
            <TokensTab />
          </TabPanel>
          <TabPanel value="notifications">
            <NotificationsTab />
          </TabPanel>
          <TabPanel value="webhooks">
            <WebhooksTab />
          </TabPanel>
          <TabPanel value="quota">
            <QuotaTab />
          </TabPanel>
          <TabPanel value="api">
            <ApiTestsTab />
          </TabPanel>
          <TabPanel value="storage">
            <StorageTab />
          </TabPanel>
        </Tabs>
      </div>
    </Layout>
  );
};
