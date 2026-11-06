import React, { useEffect, useMemo, useState } from 'react';
import { db } from '../../../firebaseConfig';
import { buildCompanyHealth, diagnosticPrompt } from './companyHealthEngine';
import { loadCompanyHealthSources } from './companyHealthSources';
const C = {
  ink: '#2d201c',
  muted: '#6b5b55',
  border: '#ded8d4',
  paper: '#fff',
  soft: '#faf8f7',
  accent: '#4a352f'
};
const button = {
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  padding: '8px 12px',
  background: C.paper,
  color: C.accent,
  font: 'inherit',
  fontSize: 12,
  cursor: 'pointer'
};
const display = (value, unit = '') => value === null || value === undefined ? '—' : `${unit === 'R' ? 'R ' : ''}${Number(value).toLocaleString('en-ZA', {
  maximumFractionDigits: 2
})}${unit && unit !== 'R' ? ' ' + unit : ''}`;

/** Compact by default. Does not replace existing KPI tables, charts or tabs. */
export default function CompanyHealthDiagnostics({
  businessId,
  from,
  to
}) {
  const [open, setOpen] = useState(false),
    [refresh, setRefresh] = useState(0),
    [state, setState] = useState({}),
    [copy, setCopy] = useState('');
  const requestKey = JSON.stringify([businessId, from, to, refresh]);
  useEffect(() => {
    if (!open || !businessId) return undefined;
    let cancelled = false;
    setState({
      key: requestKey,
      loading: true
    });
    setCopy('');
    loadCompanyHealthSources(db, businessId, from, to).then(sources => {
      if (!cancelled) setState({
        key: requestKey,
        report: buildCompanyHealth({
          ...sources,
          from,
          to
        })
      });
    }).catch(error => {
      if (!cancelled) setState({
        key: requestKey,
        error: error.message || 'Unable to load company evidence.'
      });
    });
    return () => {
      cancelled = true;
    };
  }, [open, businessId, from, to, requestKey]);
  const current = state.key === requestKey ? state : {
    loading: true
  };
  const report = current.report;
  const prompt = useMemo(() => report ? diagnosticPrompt(report) : '', [report]);
  const cards = report ? [['Revenue', report.accounting.revenue, 'R'], ['Direct costs', report.accounting.directCosts, 'R'], ['Gross profit', report.accounting.grossProfit, 'R'], ['Production output', report.operations.volume, report.operations.volume.units || 'units'], ['Availability', report.operations.availability, '%'], ['Utilisation', report.operations.utilisation, '%'], ['New leads', report.marketing.leads, ''], ['Conversion', report.marketing.conversion, '%']] : [];
  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopy('AI brief copied.');
    } catch {
      setCopy('Copy unavailable; select the brief below and copy it manually.');
    }
  };
  return <section style={{
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    background: C.paper,
    color: C.ink,
    margin: '12px 0 16px',
    overflow: 'hidden'
  }} aria-label="Company health diagnostics">
    <button type="button" aria-expanded={open} onClick={() => setOpen(v => !v)} style={{
      ...button,
      border: 0,
      borderRadius: 0,
      width: '100%',
      textAlign: 'left',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      padding: '14px 16px'
    }}>
      <span><strong style={{
          fontSize: 14
        }}>Company health · connected diagnostics</strong><span style={{
          display: 'block',
          fontSize: 12,
          color: C.muted,
          marginTop: 4
        }}>Gross profit → revenue & direct costs → price, sales volume & operational evidence</span></span><span aria-hidden="true">{open ? '−' : '+'}</span>
    </button>
    {open && <div style={{
      padding: '0 16px 16px'
    }}>
      <div style={{
        display: 'flex',
        gap: 12,
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginBottom: 12
      }}><span style={{
          fontSize: 12,
          color: C.muted
        }}>Selected dates: {from} – {to} · saved data from this business</span><button type="button" style={button} onClick={() => setRefresh(v => v + 1)}>Refresh saved data</button></div>
      {!businessId ? <p>Select a business to review its evidence.</p> : current.loading ? <p role="status">Loading connected evidence…</p> : current.error ? <p role="alert">{current.error}</p> : report && <>
        <p style={{
          fontWeight: 600,
          margin: '8px 0'
        }}>{report.assessment}</p>
        <p style={{
          color: C.muted,
          fontSize: 12,
          lineHeight: 1.6
        }}>Financial and dashboard comparisons use {report.months.length} complete months within these dates. Weekly/daily/quarterly sources include only fully contained periods. Production measurements use fully contained, closed intervals. Partial or unmatched coverage cannot establish a company-wide cause.</p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(175px,1fr))',
          gap: 8
        }}>{cards.map(([label, m, unit]) => <div key={label} style={{
            background: C.soft,
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            padding: 12
          }}>
          <div style={{
              fontSize: 12,
              color: C.muted
            }}>{label}</div><div style={{
              fontSize: 19,
              fontWeight: 650,
              margin: '6px 0'
            }}>{display(m.actual, unit)}</div><div style={{
              fontSize: 12
            }}>Budget/target: {display(m.budget, unit)}</div><div style={{
              fontSize: 11,
              color: C.muted,
              marginTop: 6
            }}>{m.source}</div>{m.reason && <div style={{
              fontSize: 11,
              color: C.muted,
              marginTop: 6
            }}>{m.reason}</div>}
        </div>)}</div>
        {report.accounting.complete && <div style={{
          background: '#f4efec',
          padding: 14,
          borderRadius: 8,
          marginTop: 14,
          fontSize: 13,
          lineHeight: 1.8
        }}><strong>Gross-profit variance: {display(report.accounting.grossProfit.variance, 'R')}</strong><div>Revenue contribution {display(report.accounting.revenueEffect, 'R')} + direct-cost contribution {display(report.accounting.directCostEffect, 'R')}</div><div style={{
            fontSize: 12,
            color: C.muted
          }}>Contribution = accounting explanation. Operational and marketing causes still need verification.</div></div>}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))',
          gap: 16,
          marginTop: 16
        }}><div><h4 style={{
              margin: '0 0 10px'
            }}>Drivers to investigate</h4>{report.findings.length ? report.findings.map((f, i) => <div key={i} style={{
              padding: '10px 0',
              borderBottom: `1px solid ${C.border}`
            }}><div style={{
                fontSize: 12,
                fontWeight: 650
              }}>{f.title} <span style={{
                  fontWeight: 400,
                  color: C.muted
                }}>· {f.kind === 'hypothesis' ? 'Possible contributor' : 'Measured'}</span></div><p style={{
                fontSize: 12,
                lineHeight: 1.6,
                margin: '5px 0'
              }}>{f.detail}</p></div>) : <p style={{
              fontSize: 12
            }}>More comparable evidence is needed before identifying performance drivers.</p>}</div>
        <div><h4 style={{
              margin: '0 0 10px'
            }}>Production evidence</h4><p style={{
              fontSize: 12,
              lineHeight: 1.6
            }}>{report.production.scope}</p><p style={{
              fontSize: 12
            }}>Available / scheduled hours: {display(report.production.availability, '%')}<br />Operating / available hours: {display(report.production.utilisation, '%')}<br />Matched intervals: {report.production.matchedIntervals}</p>{report.production.outputs.map((o, i) => <p style={{
              fontSize: 12
            }} key={i}>{o.product}: {display(o.value, o.unit)} accepted output ({o.records} records)</p>)}<details><summary style={{
                fontSize: 12,
                cursor: 'pointer'
              }}>Missing evidence & next checks ({report.gaps.length})</summary><ul style={{
                paddingLeft: 18,
                fontSize: 12,
                lineHeight: 1.7
              }}>{report.gaps.map((g, i) => <li key={i}>{g}</li>)}</ul></details></div></div>
        <details style={{
          borderTop: `1px solid ${C.border}`,
          marginTop: 16,
          paddingTop: 12
        }}><summary style={{
            fontSize: 12,
            cursor: 'pointer',
            fontWeight: 600
          }}>Evidence-based AI brief</summary><p style={{
            fontSize: 12,
            lineHeight: 1.6
          }}>Prepared from the same calculations and gaps. The brief requests verification steps and actions. Copying it does not send data to an AI service.</p><button type="button" style={button} onClick={copyPrompt}>Copy AI brief</button><span role="status" style={{
            fontSize: 12,
            marginLeft: 10
          }}>{copy}</span><textarea aria-label="Company diagnostic AI brief" readOnly value={prompt} rows={10} style={{
            boxSizing: 'border-box',
            width: '100%',
            marginTop: 10,
            padding: 10,
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            color: C.ink,
            background: C.paper,
            fontSize: 12
          }} /></details>
      </>}
    </div>}
  </section>;
}
