import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UsersTab } from './tabs/users-tab';
import { ToolsTab } from './tabs/tools-tab';
import { SubscriptionsTab } from './tabs/subscriptions-tab';
import { StatsTab } from './tabs/stats-tab';
import { motion } from 'framer-motion';

export default function AdminPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Admin Panel</h1>
          <p className="text-muted-foreground">Manage users, tools, and subscriptions</p>
        </div>

        <Tabs defaultValue="stats" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="stats" data-testid="tab-stats">
              Stats
            </TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users">
              Users
            </TabsTrigger>
            <TabsTrigger value="tools" data-testid="tab-tools">
              Tools
            </TabsTrigger>
            <TabsTrigger value="subscriptions" data-testid="tab-subscriptions">
              Subscriptions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stats">
            <StatsTab />
          </TabsContent>

          <TabsContent value="users">
            <UsersTab />
          </TabsContent>

          <TabsContent value="tools">
            <ToolsTab />
          </TabsContent>

          <TabsContent value="subscriptions">
            <SubscriptionsTab />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
