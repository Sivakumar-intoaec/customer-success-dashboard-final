import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  PortfolioAnalyticsBody,
  AccountSummary,
  DashboardFilter,
  PaymasterOrganization,
  ActivityLogItem,
} from './types';
import {
  fetchPaidOrganizations,
  fetchPortfolioAnalytics,
  fetchActivities,
} from './services/api';
import { Navbar } from './components/Navbar';
import { KpiSummary } from './components/KpiSummary';
import { PaymasterBanner } from './components/PaymasterBanner';
import { HealthDistributionChart } from './components/HealthDistributionChart';
import { AccountsTable } from './components/AccountsTable';
import { ModuleAdoptionCard } from './components/ModuleAdoptionCard';
import { AccountDetailModal } from './components/AccountDetailModal';
import { CsAiAssistantModal } from './components/CsAiAssistantModal';
import { SettingsModal } from './components/SettingsModal';
import { ActivityFeed } from './components/ActivityFeed';
import { AttentionQueue } from './components/AttentionQueue';
import { AlertTriangle, RefreshCw } from 'lucide-react';

const REFRESH_MS = 5 * 60 * 1000;

export default function App() {
  const [data, setData] = useState<PortfolioAnalyticsBody | null>(null);
  const [paidOrgs, setPaidOrgs] = useState<PaymasterOrganization[]>([]);
  const [activities, setActivities] = useState<ActivityLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<number | null>(null);
  const [loadSourceHint, setLoadSourceHint] = useState<string | null>(null);

  const [customApiKey, setCustomApiKey] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiInitialPrompt, setAiInitialPrompt] = useState('');
  const [aiContextData, setAiContextData] = useState<unknown>(null);
  const [selectedAccount, setSelectedAccount] = useState<AccountSummary | null>(null);

  const [filter, setFilter] = useState<DashboardFilter>({
    searchQuery: '',
    healthBucket: 'all',
    healthTrend: 'all',
    onlyPaidOrgs: true,
    moduleFilter: 'all',
    countryFilter: '',
  });

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setLoadSourceHint('Loading paid customers and health scores…');

    try {
      const paidList = await fetchPaidOrganizations();
      setPaidOrgs(paidList);
      if (paidList.length > 0) {
        setLoadSourceHint(
          `Found ${paidList.length} paid accounts — building portfolio (may take a minute)…`
        );
      }

      const analytics = await fetchPortfolioAnalytics(14, true, true, customApiKey || undefined);
      setData(analytics);
      setLastRefreshedAt(Date.now());

      if (!analytics || analytics.accounts.length === 0) {
        setError(
          paidList.length === 0
            ? 'No paid All-in-One organizations were found. Check Paymaster sync or try again.'
            : 'Paid organizations were found, but no health data came back yet. Try refresh in a few minutes.'
        );
      }

      const logs = await fetchActivities(undefined, 15, customApiKey || undefined);
      setActivities(logs);
      setLoadSourceHint(null);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(
        `Could not load the CS dashboard: ${err instanceof Error ? err.message : String(err)}`
      );
      setLoadSourceHint(null);
    } finally {
      setIsLoading(false);
    }
  }, [customApiKey]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    const id = window.setInterval(() => {
      loadDashboardData();
    }, REFRESH_MS);
    return () => window.clearInterval(id);
  }, [loadDashboardData]);

  const paidOrgsSet = useMemo(() => {
    const set = new Set<string>();
    paidOrgs.forEach((org) => {
      if (org.organizationId) set.add(org.organizationId);
    });
    return set;
  }, [paidOrgs]);

  const handleFilterChange = (updated: Partial<DashboardFilter>) => {
    setFilter((prev) => ({ ...prev, ...updated }));
  };

  const handleDraftEmailForAccount = (accountSummary: AccountSummary) => {
    const name = accountSummary.organizationName || 'Customer Organization';
    const prompt = `Draft an empathetic, friendly CS check-in email for "${name}" (Organization ID: ${accountSummary.organizationId}).
Health Score: ${accountSummary.healthScore}/100 (${accountSummary.healthBucket}).
Modules Used: ${accountSummary.modulesUsed.join(', ') || 'None'}.
Please keep the tone helpful, non-technical, and focused on offering a 15-minute product walkthrough or health review.`;

    setAiInitialPrompt(prompt);
    setAiContextData(accountSummary);
    setIsAiModalOpen(true);
  };

  const handleOpenAiWithAccountModal = (orgName: string, orgId: string, score: number) => {
    const prompt = `Draft a personalized CS outreach email for "${orgName}" (ID: ${orgId}) with a current health score of ${score}/100. Provide clear recommendations to boost feature adoption.`;
    setAiInitialPrompt(prompt);
    setAiContextData({ orgName, orgId, score });
    setIsAiModalOpen(true);
  };

  const accounts = data?.accounts || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-sky-500 selection:text-white">
      <Navbar
        searchQuery={filter.searchQuery}
        onSearchChange={(q) => handleFilterChange({ searchQuery: q })}
        onRefresh={loadDashboardData}
        isLoading={isLoading}
        paidOrgsCount={paidOrgs.length}
        totalOrgsCount={data?.summary?.totalAccounts || 0}
        lastRefreshedAt={lastRefreshedAt}
        onOpenAiAssistant={() => {
          setAiInitialPrompt('');
          setAiContextData(data?.summary);
          setIsAiModalOpen(true);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onlyPaidOrgs={filter.onlyPaidOrgs}
        onToggleOnlyPaidOrgs={() => handleFilterChange({ onlyPaidOrgs: !filter.onlyPaidOrgs })}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {error && (
          <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-100 text-xs flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
            <button
              onClick={loadDashboardData}
              className="px-2 py-1 rounded bg-rose-900 hover:bg-rose-800 text-white font-bold text-[11px] shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {isLoading && loadSourceHint && (
          <div className="p-3 rounded-xl bg-sky-950/50 border border-sky-800 text-sky-100 text-xs flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
            <span>{loadSourceHint}</span>
          </div>
        )}

        <PaymasterBanner
          paidOrgsCount={paidOrgs.length}
          totalOrgsCount={data?.summary?.totalAccounts || 0}
          onlyPaidOrgs={filter.onlyPaidOrgs}
          onToggleOnlyPaidOrgs={() => handleFilterChange({ onlyPaidOrgs: !filter.onlyPaidOrgs })}
          isLoading={isLoading}
        />

        <KpiSummary
          summary={data?.summary || null}
          filteredCount={accounts.length}
          totalPaidCount={paidOrgs.length || accounts.length}
          onlyPaidOrgs={filter.onlyPaidOrgs}
          onFilterClick={(bucket) => handleFilterChange({ healthBucket: bucket })}
        />

        {!isLoading && accounts.length > 0 && (
          <AttentionQueue
            accounts={accounts}
            onSelectAccount={setSelectedAccount}
            onShowAllAttention={() => handleFilterChange({ healthBucket: 'attention' })}
          />
        )}

        <HealthDistributionChart
          summary={data?.summary || null}
          dailyTrend={data?.dailyTrend || []}
          onSelectBucket={(bucket) => handleFilterChange({ healthBucket: bucket })}
        />

        <AccountsTable
          accounts={accounts}
          filter={filter}
          onFilterChange={handleFilterChange}
          onSelectAccount={setSelectedAccount}
          onDraftEmailForAccount={handleDraftEmailForAccount}
          paidOrgsSet={paidOrgsSet}
        />

        <ModuleAdoptionCard
          moduleUsageSummary={data?.moduleUsageSummary || []}
          totalAccountsCount={data?.summary?.totalAccounts || 0}
        />

        <ActivityFeed
          activities={activities}
          isLoading={isLoading}
          onRefresh={loadDashboardData}
        />
      </main>

      {selectedAccount && (
        <AccountDetailModal
          accountSummary={selectedAccount}
          onClose={() => setSelectedAccount(null)}
          onDraftEmail={handleOpenAiWithAccountModal}
          customApiKey={customApiKey || undefined}
          isPaidPlan={paidOrgsSet.has(selectedAccount.organizationId) || selectedAccount.isPaidPlan}
        />
      )}

      <CsAiAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        initialPrompt={aiInitialPrompt}
        contextData={aiContextData}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        customApiKey={customApiKey}
        onSaveApiKey={(newKey) => setCustomApiKey(newKey)}
      />
    </div>
  );
}
