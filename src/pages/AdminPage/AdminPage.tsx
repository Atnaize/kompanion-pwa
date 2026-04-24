import { useState } from 'react';
import { Layout } from '@components/layout';
import { Tabs, TabList, Tab, TabPanel } from '@components/ui';
import { TokensTab } from './TokensTab';
import { TestingTab } from './TestingTab';
import { NotificationsTab } from './NotificationsTab';
import { ApiTestsTab } from './ApiTestsTab';
import { StorageTab } from './StorageTab';

export const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('tokens');

  return (
    <Layout>
      <div className="space-y-4">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Admin / Debug Page</h1>
          <p className="text-sm text-gray-600">Debug token and API issues</p>
        </div>

        <Tabs value={activeTab} onChange={setActiveTab}>
          <TabList className="mb-6">
            <Tab value="tokens" label="Tokens" />
            <Tab value="testing" label="Testing" />
            <Tab value="notifications" label="Notifications" />
            <Tab value="api" label="API Tests" />
            <Tab value="storage" label="Storage" />
          </TabList>

          <TabPanel value="tokens">
            <TokensTab />
          </TabPanel>
          <TabPanel value="testing">
            <TestingTab />
          </TabPanel>
          <TabPanel value="notifications">
            <NotificationsTab />
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
