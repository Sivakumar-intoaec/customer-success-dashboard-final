import 'dotenv/config';
import express from 'express';
import path from 'path';
import { generateCsInsights } from './src/services/gemini.js';

function toEpochMs(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

// ── Helper: safely parse possibly double-encoded JSON ──────────────────────────
function safeJsonParse(raw: string): unknown {
  try {
    const once = JSON.parse(raw);
    if (typeof once === 'string') return JSON.parse(once);
    return once;
  } catch {
    return raw;
  }
}

function getValidUrl(envValue: string | undefined, defaultUrl: string): string {
  if (!envValue) return defaultUrl;
  const trimmed = envValue.trim();
  if (!trimmed || trimmed === '/' || (!trimmed.startsWith('http://') && !trimmed.startsWith('https://'))) {
    return defaultUrl;
  }
  return trimmed.replace(/\/+$/, '');
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function enrichAccountWithCSMetrics(acc: any): any {
  const orgId = String(acc.organizationId || '');
  const seed = hashString(orgId);

  // Deterministic mock inputs
  const hasBOQ = seed % 2 === 0;
  const hasProcurement = seed % 3 !== 0;
  const hasSchedule = seed % 5 !== 3;
  const coreModules = [];
  if (hasBOQ) coreModules.push('BOQ');
  if (hasProcurement) coreModules.push('PROCUREMENT');
  if (hasSchedule) coreModules.push('SCHEDULE');

  const otherCount = seed % 6; // other tracked modules (max 5)
  const records30d = seed % 15;
  const hasWorkflow = seed % 3 !== 0;
  const executions30d = seed % 25;
  const failureRate = (seed % 100) / 100;
  const avgProjectRisk = 10 + (seed % 80);
  const ticketsCount = seed % 4;
  const csat = 3.2 + (seed % 18) / 10;
  const whatsappEngagement = (seed % 100) / 100;
  const bgJobFailure = (seed % 50) / 100;
  const alertResolutionDays = seed % 14;

  const licensedSeats = 5 + (seed % 95);
  const activeSeats = Math.min(licensedSeats, Math.round(licensedSeats * (0.3 + 0.65 * (seed % 10) / 10)));
  const seatUtilisation = Math.round((activeSeats / licensedSeats) * 100);

  const daysToRenewal = -30 + (seed % 400);
  const renewalDate = Date.now() + daysToRenewal * 86400000;

  const projectsCount = 1 + (seed % 5);
  const stalledProjectsCount = seed % (projectsCount + 1);
  const activeProjectsCount = projectsCount - stalledProjectsCount;

  const milestonesTotal = 4;
  const milestonesDone = 1 + (seed % 4);
  const ttfv = 5 + (seed % 25);

  const lastExecContact = Date.now() - (seed % 250) * 86400000;
  const lastQbr = Date.now() - (seed % 365) * 86400000;
  const execIdentified = (seed % 3) !== 0;

  // Factor Sub-Scores
  // HS-2 Active projects
  let hs2 = 0;
  if (projectsCount === 1) hs2 = 40;
  else if (projectsCount >= 2 && projectsCount <= 3) hs2 = 70;
  else if (projectsCount >= 4) hs2 = 90;
  if (activeProjectsCount >= 1) hs2 += 10;
  hs2 = Math.min(100, hs2);

  // HS-3 Modules
  let hs3 = coreModules.length * 15;
  hs3 += otherCount * 5;
  let depthBonus = 0;
  if (records30d >= 10) depthBonus = 30;
  else if (records30d >= 3) depthBonus = 15;
  hs3 += depthBonus;
  hs3 = Math.min(100, hs3);

  // HS-4 Engagement
  const wau = acc.wau ?? 2;
  const mau = acc.mau ?? 5;
  const stickiness = mau > 0 ? wau / mau : 0;
  const hs4 = Math.min(100, Math.max(0, Math.round(stickiness / 0.5 * 100)));

  // HS-5 Onboarding
  const hs5 = Math.round((milestonesDone / milestonesTotal) * 100);

  // HS-6 Automation
  let hs6 = 0;
  if (hasWorkflow) hs6 += 40;
  hs6 += executions30d * 2;
  let reliabilityBonus = 0;
  if (failureRate < 0.10) reliabilityBonus = 20;
  else if (failureRate < 0.30) reliabilityBonus = 10;
  hs6 += reliabilityBonus;
  hs6 = Math.min(100, hs6);

  // HS-7 Project risk
  const hs7 = 100 - avgProjectRisk;

  // HS-8 Critical alerts
  const openAlerts = acc.openAlertsCritical ?? acc.openAlerts?.critical ?? 0;
  let hs8 = 0;
  if (openAlerts === 0) hs8 = 100;
  else if (openAlerts <= 2) hs8 = 50;

  // HS-1 Weighted Health
  let weightedHealth = (hs2 * 0.25) + (hs3 * 0.20) + (hs4 * 0.15) + (hs5 * 0.10) + (hs6 * 0.10) + (hs7 * 0.10) + (hs8 * 0.10);

  // HS-9 Secondary adjustments
  if (alertResolutionDays > 7) weightedHealth -= 5;
  if (whatsappEngagement < 0.30) weightedHealth -= 3;
  else if (whatsappEngagement > 0.70) weightedHealth += 2;
  if (bgJobFailure > 0.30) weightedHealth -= 5;
  else if (bgJobFailure > 0.10) weightedHealth -= 2;

  const healthScore = Math.min(100, Math.max(0, Math.round(weightedHealth)));
  
  // Health bucket (HS-10)
  let healthBucket: 'healthy' | 'at-risk' | 'critical' = 'critical';
  if (healthScore >= 70) healthBucket = 'healthy';
  else if (healthScore >= 40) healthBucket = 'at-risk';

  // Inactive Risk (IR-1 to IR-5)
  const lastActivityEpoch = toEpochMs(acc.lastActivityAt);
  const daysSilent = lastActivityEpoch ? Math.floor((Date.now() - lastActivityEpoch) / 86400000) : (seed % 45);
  const lastActionDate = lastActivityEpoch || (Date.now() - daysSilent * 86400000);
  
  let inactiveRiskState: 'healthy' | 'watch' | 'action' = 'healthy';
  if (daysSilent >= 30) inactiveRiskState = 'action';
  else if (daysSilent >= 15) inactiveRiskState = 'watch';

  // Renewal Readiness (RR-2)
  let renewalState: 'healthy' | 'watch' | 'action' = 'healthy';
  const healthTrend = acc.healthTrend || 'stable';
  if (healthScore < 40 || openAlerts > 0 || (healthTrend === 'declining' && daysToRenewal <= 60)) {
    renewalState = 'action';
  } else if (((healthScore >= 40 && healthScore <= 69) || healthTrend === 'declining') && daysToRenewal <= 90) {
    renewalState = 'watch';
  }

  // Churn Risk signals (CR-1)
  const signalA = healthTrend === 'declining' && (seed % 2 === 0);
  const signalB = daysSilent >= 30;
  const signalC = ticketsCount >= 3 || csat < 3.5;
  const signalD = activeProjectsCount === 0;
  const signalE = seatUtilisation < 40;

  const churnRiskSignals = [];
  if (signalA) churnRiskSignals.push('health_drop');
  if (signalB) churnRiskSignals.push('inactive_30d');
  if (signalC) churnRiskSignals.push('support_tickets_or_csat');
  if (signalD) churnRiskSignals.push('no_active_projects');
  if (signalE) churnRiskSignals.push('low_seat_utilisation');

  let churnRiskLevel: 'healthy' | 'watch' | 'action' = 'healthy';
  if (churnRiskSignals.length >= 3) churnRiskLevel = 'action';
  else if (churnRiskSignals.length >= 1) churnRiskLevel = 'watch';

  // Executive Engagement (EE-2)
  const daysSinceExecContact = Math.floor((Date.now() - lastExecContact) / 86400000);
  const daysSinceQbr = Math.floor((Date.now() - lastQbr) / 86400000);
  let execEngagementState: 'healthy' | 'watch' | 'action' = 'healthy';
  if (!execIdentified || daysSinceExecContact > 180) execEngagementState = 'action';
  else if (daysSinceExecContact > 90 || daysSinceQbr > 180) execEngagementState = 'watch';

  // Onboarding Completion state (OB-3)
  const onboardingProgress = Math.round((milestonesDone / milestonesTotal) * 100);
  let onboardingState: 'healthy' | 'watch' | 'action' = 'healthy';
  if (onboardingProgress < 50 || ttfv > 30) onboardingState = 'action';

  // Features list
  const featuresUsed = [];
  if (seed % 2 === 0) featuresUsed.push('2D Takeoff');
  if (seed % 3 === 0) featuresUsed.push('Proposal Builder');
  if (seed % 5 === 0) featuresUsed.push('WhatsApp automation');
  if (seed % 7 === 0) featuresUsed.push('Estimation');

  const finalWau = acc.wau || Math.round(activeSeats * 1.5);
  const finalMau = acc.mau || Math.round(activeSeats * 2.5);
  const calculatedStickiness = finalMau > 0 ? finalWau / finalMau : 0;

  return {
    ...acc,
    healthScore,
    healthBucket,
    dau: acc.dau || activeSeats,
    wau: finalWau,
    mau: finalMau,
    userCount: acc.userCount || Math.round(licensedSeats * 1.2),
    stickinessRatio: acc.stickinessRatio || calculatedStickiness,
    activeProjectsCount,
    stalledProjectsCount,
    renewalDate,
    daysToRenewal,
    renewalState,
    churnRiskLevel,
    churnRiskSignals,
    licensedSeats,
    activeSeats,
    seatUtilisation,
    lastActionDate,
    daysSilent,
    inactiveRiskState,
    lastExecContact,
    lastQbr,
    execIdentified,
    execEngagementState,
    onboardingProgress,
    ttfv,
    onboardingState,
    ticketsCount14d: ticketsCount,
    csat,
    recordsCreated30d: records30d,
    featuresUsed,
    avgProjectRisk,
  };
}

function recalculateSummary(accounts: any[]) {
  const totalAccounts = accounts.length;
  const avgHealthScore = totalAccounts > 0
    ? Math.round((accounts.reduce((s, a) => s + (a.healthScore ?? 0), 0) / totalAccounts) * 10) / 10
    : 0;
  const avgStickiness = totalAccounts > 0
    ? Math.round((accounts.reduce((s, a) => s + (a.stickinessRatio ?? 0), 0) / totalAccounts) * 1000) / 1000
    : 0;
  const avgAutomationScore = totalAccounts > 0
    ? Math.round(accounts.reduce((s, a) => s + (a.automationAdoptionScore ?? 0), 0) / totalAccounts)
    : 0;
  const avgModuleBreadth = totalAccounts > 0
    ? Math.round((accounts.reduce((s, a) => s + (a.moduleBreadth ?? 0), 0) / totalAccounts) * 10) / 10
    : 0;
  const distribution = {
    healthy: accounts.filter((a) => a.healthBucket === 'healthy').length,
    atRisk: accounts.filter((a) => a.healthBucket === 'at-risk').length,
    critical: accounts.filter((a) => a.healthBucket === 'critical').length,
  };
  const trends = {
    improving: accounts.filter((a) => a.healthTrend === 'improving').length,
    stable: accounts.filter((a) => a.healthTrend === 'stable').length,
    declining: accounts.filter((a) => a.healthTrend === 'declining').length,
  };
  const accountsNeedingAttention = distribution.atRisk + distribution.critical;
  const totalCriticalAlerts = accounts.reduce((s, a) => s + (a.openAlertsCritical ?? 0), 0);
  const churnRiskOrgs = accounts.filter((a) => (a.daysSilent ?? 0) >= 30).length;

  return {
    totalAccounts,
    avgHealthScore,
    avgStickiness,
    avgAutomationScore,
    avgModuleBreadth,
    accountsNeedingAttention,
    churnRiskOrgs,
    totalCriticalAlerts,
    distribution,
    trends,
  };
}

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

const AECAUTOPILOT_ENDPOINT = getValidUrl(process.env.AECAUTOPILOT_ENDPOINT, 'https://aecautopilot.intoaec.ai');
const PAYMASTER_ENDPOINT = getValidUrl(process.env.PAYMASTER_ENDPOINT, 'https://paymaster.intoaec.ai');
const DEFAULT_API_KEY = (process.env.AECAUTOPILOT_APIKEY && process.env.AECAUTOPILOT_APIKEY.trim())
  ? process.env.AECAUTOPILOT_APIKEY.trim()
  : 'tR4hTjS954LxUWtRM720BN9yiUbcRUcSB5o9ZjWNVvXGiPFrLtDKRJvSoPDUIw6M';

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'aec-cs-dashboard-proxy' });
  });

  // Proxy to Paymaster subscriptions endpoint
  app.post('/api/paymaster', async (req, res) => {
    try {
      const paymasterUrl = `${PAYMASTER_ENDPOINT}/subscriptions`;
      const response = await fetch(paymasterUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req.body || { eventType: 'GET_ALL_IN_ONE_PLAN_ORGANIZATIONS' }),
      });

      const text = await response.text();
      res.status(response.status).send(text);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('Error proxying to Paymaster:', msg);
      res.status(500).json({ error: 'Failed to contact Paymaster API', details: msg });
    }
  });

  // Proxy to AECAutopilot Customer Success RPC endpoint
  app.post('/api/customer-success', async (req, res) => {
    try {
      const apiKey = (req.headers['x-custom-apikey'] as string) || DEFAULT_API_KEY;
      const csUrl = `${AECAUTOPILOT_ENDPOINT}/customer-success`;

      const response = await fetch(csUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: apiKey,
        },
        body: JSON.stringify(req.body),
      });

      const text = await response.text();
      res.status(response.status).send(text);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('Error proxying to Customer Success API:', msg);
      res.status(500).json({ error: 'Failed to contact AECAutopilot CS API', details: msg });
    }
  });

  // Proxy to AECAutopilot Activities
  app.post('/api/activities', async (req, res) => {
    try {
      const apiKey = (req.headers['x-custom-apikey'] as string) || DEFAULT_API_KEY;
      const activitiesUrl = `${AECAUTOPILOT_ENDPOINT}/activities`;

      const response = await fetch(activitiesUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: apiKey,
        },
        body: JSON.stringify(req.body),
      });

      const text = await response.text();
      res.status(response.status).send(text);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('Error proxying to Activities API:', msg);
      res.status(500).json({ error: 'Failed to contact Activities API', details: msg });
    }
  });

  // Proxy to AECAutopilot Autopilot Alerts
  app.post('/api/autopilot', async (req, res) => {
    try {
      const apiKey = (req.headers['x-custom-apikey'] as string) || DEFAULT_API_KEY;
      const autopilotUrl = `${AECAUTOPILOT_ENDPOINT}/autopilot`;

      const response = await fetch(autopilotUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: apiKey,
        },
        body: JSON.stringify(req.body),
      });

      const text = await response.text();
      res.status(response.status).send(text);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('Error proxying to Autopilot API:', msg);
      res.status(500).json({ error: 'Failed to contact Autopilot API', details: msg });
    }
  });

  // ── Portfolio Batch Route ─────────────────────────────────────────────────
  // When GET_PORTFOLIO_ANALYTICS returns 0 accounts (no internal snapshots),
  // this route builds the portfolio by:
  //   1. Fetching paid org IDs from Paymaster
  //   2. Calling GET_ACCOUNT_DETAIL in parallel for each org
  //   3. Synthesising PortfolioAnalyticsBody from the detail responses
  app.post('/api/portfolio-batch', async (req, res) => {
    try {
      const apiKey = (req.headers['x-custom-apikey'] as string) || DEFAULT_API_KEY;

      const trendDays = Math.min(90, Math.max(1, Number(req.body?.trendDays) || 14));

      // Step 1: Attempt GET_PORTFOLIO_ANALYTICS first
      const portfolioRes = await fetch(`${AECAUTOPILOT_ENDPOINT}/customer-success`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: apiKey },
        body: JSON.stringify({
          eventType: 'GET_PORTFOLIO_ANALYTICS',
          trendDays,
          useLatestPerOrg: true,
          enrichOrgDetails: true,
        }),
      });
      const portfolioRaw = await portfolioRes.text();
      const portfolioEnv = safeJsonParse(portfolioRaw) as { code?: string; body?: { accounts?: unknown[]; summary?: unknown; dailyTrend?: unknown[]; moduleUsageSummary?: unknown[] } };

      if (
        portfolioRes.ok &&
        portfolioEnv?.body &&
        Array.isArray(portfolioEnv.body.accounts) &&
        portfolioEnv.body.accounts.length > 0
      ) {
        // Normalize string epoch fields and mark as paid (CS portfolio is paid-only)
        const normalizedAccounts = (portfolioEnv.body.accounts as Array<Record<string, unknown>>).map((acc) => {
          const norm = {
            ...acc,
            lastActivityAt: toEpochMs(acc.lastActivityAt),
            snapshotDate: toEpochMs(acc.snapshotDate) ?? Date.now(),
            isPaidPlan: true,
          };
          return enrichAccountWithCSMetrics(norm);
        });
        const summary = recalculateSummary(normalizedAccounts);
        res.status(200).json({
          source: 'portfolio',
          data: { ...portfolioEnv.body, summary, accounts: normalizedAccounts },
        });
        return;
      }

      // Step 2: Portfolio is empty — fetch org list from Paymaster
      const paymasterRes = await fetch(`${PAYMASTER_ENDPOINT}/subscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType: 'GET_ALL_IN_ONE_PLAN_ORGANIZATIONS' }),
      });
      const paymasterRaw = await paymasterRes.text();
      const paymasterEnv = safeJsonParse(paymasterRaw) as {
        body?: { organizationIds?: string[] } | string[] | unknown[];
      };

      // Body shape: { organizationIds: string[] }  OR  string[]  (handle both)
      let orgIds: string[] = [];
      if (paymasterEnv?.body) {
        if (Array.isArray(paymasterEnv.body)) {
          // Direct array of org IDs or subscription objects
          orgIds = (paymasterEnv.body as Array<string | { organizationId?: string }>)
            .map((item) => (typeof item === 'string' ? item : item?.organizationId ?? ''))
            .filter(Boolean);
        } else if (typeof paymasterEnv.body === 'object' && 'organizationIds' in paymasterEnv.body) {
          // { organizationIds: string[] }
          const ids = (paymasterEnv.body as { organizationIds?: string[] }).organizationIds;
          if (Array.isArray(ids)) orgIds = ids.filter(Boolean);
        }
      }

      // Deduplicate
      orgIds = [...new Set(orgIds)];

      if (orgIds.length === 0) {
        // Nothing from Paymaster either
        res.status(200).json({ source: 'empty', data: null });
        return;
      }

      // Step 3: Fetch GET_ACCOUNT_DETAIL for each org in parallel (cap at 20 concurrent)
      const CONCURRENCY = 20;
      const results: Array<{ organizationId: string; detail: Record<string, unknown> | null }> = [];
      for (let i = 0; i < orgIds.length; i += CONCURRENCY) {
        const batch = orgIds.slice(i, i + CONCURRENCY);
        const batchResults = await Promise.all(
          batch.map(async (orgId) => {
            try {
              const r = await fetch(`${AECAUTOPILOT_ENDPOINT}/customer-success`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', apikey: apiKey },
                body: JSON.stringify({
                  eventType: 'GET_ACCOUNT_DETAIL',
                  organizationId: orgId,
                  days: 30,
                  historyDays: 14,
                  inactiveThresholdDays: 14,
                }),
              });
              const raw = await r.text();
              const env = safeJsonParse(raw) as { body?: Record<string, unknown> };
              return { organizationId: orgId, detail: env?.body ?? null };
            } catch {
              return { organizationId: orgId, detail: null };
            }
          })
        );
        results.push(...batchResults);
      }

      // Step 4: Synthesise portfolio from account details
      interface DetailShape {
        organizationId?: string;
        profile?: { organizationName?: string | null; accountNumber?: string | null; emailAddress?: string | null; organizationType?: string | null; countryCode?: string | null };
        health?: { healthScore?: number; healthTrend?: string; healthBucket?: string; stickinessRatio?: number; dau?: number; wau?: number; mau?: number; moduleBreadth?: number; automationAdoptionScore?: number; lastActivityAt?: number | null; openAlerts?: { critical?: number; warning?: number; escalated?: number }; riskScore?: number };
        adoption?: {
          modulesUsed?: string[];
          lastModuleUsed?: string | null;
          moduleBreakdown?: Array<{
            logSource: string;
            label: string;
            totalActivityCount: number;
            lastUsedAt: number | null;
            features: Array<{ logEvent: string; label: string; activityCount: number; lastUsedAt: number | null }>;
          }>;
        };
        automation?: { activeWorkflowCount?: number };
        healthHistory?: Array<{ date: number; healthScore: number; stickinessRatio: number; dau: number; mau: number }>;
        snapshotDate?: number | string | null;
      }

      const validAccounts = results
        .filter((r) => r.detail !== null)
        .map((r) => {
          const d = r.detail as DetailShape;
          const h = d.health ?? {};
          const p = d.profile ?? {};
          const a = d.adoption ?? {};
          const auto = d.automation ?? {};
          const lastModule = a.lastModuleUsed ?? a.modulesUsed?.[0] ?? null;
          const rawAcc = {
            organizationId: r.organizationId,
            healthScore: h.healthScore ?? 0,
            healthTrend: h.healthTrend ?? 'stable',
            healthBucket: h.healthBucket ?? 'critical',
            stickinessRatio: h.stickinessRatio ?? 0,
            dau: h.dau ?? 0,
            wau: h.wau ?? 0,
            mau: h.mau ?? 0,
            moduleBreadth: h.moduleBreadth ?? 0,
            automationAdoptionScore: h.automationAdoptionScore ?? 0,
            activeWorkflowCount: auto.activeWorkflowCount ?? 0,
            openAlertsCritical: h.openAlerts?.critical ?? 0,
            openAlertsWarning: h.openAlerts?.warning ?? 0,
            openAlertsEscalated: h.openAlerts?.escalated ?? 0,
            riskScore: h.riskScore ?? 0,
            lastActivityAt: toEpochMs(h.lastActivityAt),
            snapshotDate: toEpochMs(d.snapshotDate) ?? Date.now(),
            modulesUsed: a.modulesUsed ?? [],
            lastModuleUsed: lastModule,
            organizationName: p.organizationName ?? null,
            accountNumber: p.accountNumber ?? null,
            emailAddress: p.emailAddress ?? null,
            organizationType: p.organizationType ?? null,
            countryCode: p.countryCode ?? null,
            isPaidPlan: true,
          };
          return enrichAccountWithCSMetrics(rawAcc);
        })
        .sort((a, b) => a.healthScore - b.healthScore); // worst first

      const summary = recalculateSummary(validAccounts);

      // Build module usage summary from account details
      const moduleMap = new Map<string, { label: string; orgCount: number; featureMap: Map<string, { label: string; activityCount: number; orgCount: number }> }>();
      for (const r of results) {
        if (!r.detail) continue;
        const d = r.detail as DetailShape;
        for (const mod of d.adoption?.moduleBreakdown ?? []) {
          if (!moduleMap.has(mod.logSource)) {
            moduleMap.set(mod.logSource, { label: mod.label, orgCount: 0, featureMap: new Map() });
          }
          const entry = moduleMap.get(mod.logSource)!;
          entry.orgCount += 1;
          for (const feat of mod.features ?? []) {
            const fKey = feat.logEvent;
            if (!entry.featureMap.has(fKey)) {
              entry.featureMap.set(fKey, { label: feat.label, activityCount: 0, orgCount: 0 });
            }
            const fe = entry.featureMap.get(fKey)!;
            fe.activityCount += feat.activityCount;
            fe.orgCount += 1;
          }
        }
      }
      const moduleUsageSummary = Array.from(moduleMap.entries()).map(([logSource, entry]) => ({
        logSource,
        label: entry.label,
        orgCount: entry.orgCount,
        topFeatures: Array.from(entry.featureMap.entries())
          .map(([logEvent, f]) => ({ logEvent, label: f.label, activityCount: f.activityCount, orgCount: f.orgCount }))
          .sort((a, b) => b.activityCount - a.activityCount)
          .slice(0, 5),
      })).sort((a, b) => b.orgCount - a.orgCount);

      // Build dailyTrend by aggregating healthHistory across all accounts per date
      interface HealthHistoryEntry { date: number; healthScore: number; stickinessRatio: number; dau: number; mau: number }
      const trendMap = new Map<string, { totalHealth: number; totalStickiness: number; totalDau: number; totalMau: number; count: number; ts: number }>();
      for (const r of results) {
        if (!r.detail) continue;
        const d = r.detail as DetailShape;
        const history: HealthHistoryEntry[] = (d as unknown as { healthHistory?: HealthHistoryEntry[] }).healthHistory ?? [];
        for (const h of history) {
          const ts = toEpochMs(h.date as unknown as string | number);
          if (!ts) continue;
          const day = new Date(ts);
          const key = `${day.getUTCFullYear()}-${String(day.getUTCMonth() + 1).padStart(2, '0')}-${String(day.getUTCDate()).padStart(2, '0')}`;
          const existing = trendMap.get(key);
          if (existing) {
            existing.totalHealth += h.healthScore || 0;
            existing.totalStickiness += h.stickinessRatio || 0;
            existing.totalDau += h.dau || 0;
            existing.totalMau += h.mau || 0;
            existing.count += 1;
          } else {
            trendMap.set(key, {
              totalHealth: h.healthScore || 0,
              totalStickiness: h.stickinessRatio || 0,
              totalDau: h.dau || 0,
              totalMau: h.mau || 0,
              count: 1,
              ts,
            });
          }
        }
      }
      const dailyTrend = Array.from(trendMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-trendDays)
        .map(([, v]) => ({
          date: v.ts,
          avgHealthScore: Math.round((v.totalHealth / v.count) * 10) / 10,
          avgStickiness: Math.round((v.totalStickiness / v.count) * 1000) / 1000,
          avgAutomationScore: 0,
          orgCount: v.count,
        }));

      const synthesized = {
        summary,
        dailyTrend,
        moduleUsageSummary,
        accounts: validAccounts,
      };

      res.status(200).json({ source: 'batch', data: synthesized });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('Error in portfolio-batch:', msg);
      res.status(500).json({ error: 'Portfolio batch failed', details: msg });
    }
  });

  // AI CS Assistant Endpoint
  app.post('/api/ai-assistant', async (req, res) => {
    try {
      const { prompt, contextData } = req.body;
      if (!prompt) {
        res.status(400).json({ error: 'Prompt is required' });
        return;
      }
      const answer = await generateCsInsights(prompt, contextData || {});
      res.json({ answer });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: 'AI Assistant error', details: msg });
    }
  });

// Vite middleware in dev, static files in production
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  (async () => {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server listening on http://0.0.0.0:${PORT}`);
    });
  })();
} else if (!process.env.VERCEL) {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

export default app;
