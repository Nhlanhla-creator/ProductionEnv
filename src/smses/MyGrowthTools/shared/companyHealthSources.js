import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { completeMonths } from './companyHealthEngine';

/** Read-only, using the same selected business UID as the host dashboard. */
export async function loadCompanyHealthSources(db, businessId, from, to) {
  if (!businessId || /\//.test(businessId)) throw new Error('Select a business before reviewing diagnostics.');
  const months = completeMonths(from, to);
  if (months.length > 120) throw new Error('Choose a reporting range of ten years or less.');
  const output = {
    financial: {},
    operational: [],
    marketing: {},
    marketingMeta: {},
    production: [],
    errors: []
  };
  const jobs = [];
  const read = (label, path, apply) => jobs.push({
    label,
    run: async () => {
      const snap = await getDoc(doc(db, ...path));
      if (snap.exists()) apply(snap.data());
    }
  });
  for (const year of [...new Set(months.map(m => m.year))]) read(`Financial ${year}`, ['users', businessId, 'financialData', `_pnlManual_${year}`], data => {
    output.financial[`_pnlManual_${year}`] = data;
  });
  read('Operations', ['operationalKpis', businessId], data => {
    output.operational = Array.isArray(data.structure) ? data.structure : [];
  });
  read('Marketing pipeline', ['marketingData', `${businessId}_pipelineData`], data => {
    output.marketing.pipeline = data;
  });
  read('Marketing dates', ['marketingData', `${businessId}_marketingSalesKpiMeta`], data => {
    output.marketingMeta = data;
  });
  const localDate = s => {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  };
  const start = localDate(from),
    end = localDate(to);
  end.setDate(end.getDate() + 1);
  if (!Number.isFinite(+start) || !Number.isFinite(+end) || start >= end) throw new Error('Choose valid reporting dates.');
  jobs.push({
    label: 'Production measurements',
    run: async () => {
      // Date-bound, uncapped query: never silently treat a page-size limit as a company total.
      const snap = await getDocs(query(collection(db, 'digitalTwinTenants', businessId, 'measurements'), where('state', '==', 'approved'), where('startTimestamp', '>=', start.toISOString()), where('startTimestamp', '<', end.toISOString())));
      output.production = snap.docs.map(d => ({
        ...d.data(),
        id: d.id
      }));
    }
  });
  const results = await Promise.allSettled(jobs.map(j => j.run()));
  results.forEach((r, i) => {
    if (r.status === 'rejected') output.errors.push(`${jobs[i].label} unavailable (${r.reason?.code || 'read failed'}). Missing access/indexes must be resolved before using this source.`);
  });
  return output;
}
