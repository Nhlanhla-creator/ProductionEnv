import React, { useState } from 'react';
import { db, auth } from '../../firebaseConfig';
import {
  collection, query, where, getDocs, deleteDoc, doc, setDoc, serverTimestamp
} from 'firebase/firestore';

// Every Firestore collection used across the app
const ALL_COLLECTIONS = [
  'admin_content',
  'growth_content',
  'ops_content',
  'partners_content',
  'pilots_content',
  'reports_content',
  'users_content',
  'tech_content',
  'qa_content',
  'product_content',
];

const CleanupFirestore = () => {
  const [log, setLog]         = useState([]);
  const [running, setRunning] = useState(false);
  const [done, setDone]       = useState(false);

  const addLog = (msg, type = 'info') => {
    setLog(prev => [...prev, { msg, type, ts: new Date().toLocaleTimeString() }]);
  };

  const runCleanup = async () => {
    const user = auth.currentUser;
    if (!user) { addLog('❌ Not authenticated', 'error'); return; }

    setRunning(true);
    setDone(false);
    setLog([]);

    let totalDeleted = 0;
    let totalFixed   = 0;

    addLog(`🔍 Scanning ${ALL_COLLECTIONS.length} collections for user ${user.uid.slice(0, 8)}...`);

    for (const collName of ALL_COLLECTIONS) {
      try {
        const q = query(
          collection(db, collName),
          where('userId', '==', user.uid)
        );
        const snap = await getDocs(q);

        if (snap.empty) {
          addLog(`  ${collName}: empty — skipped`);
          continue;
        }

        let deleted = 0;
        let fixed   = 0;

        for (const docSnap of snap.docs) {
          const data = docSnap.data();
          const files = data.files || [];

          // Case 1: doc has no files — delete entirely (stale empty doc)
          if (files.length === 0) {
            await deleteDoc(doc(db, collName, docSnap.id));
            deleted++;
            totalDeleted++;
            addLog(`  🗑  ${collName} / ${docSnap.id.slice(-24)} — deleted (empty doc)`, 'warn');
            continue;
          }

          // Case 2: doc uses old _ separator in its ID — rewrite under new | separator
          // Detect: if the doc ID doesn't contain | but path has multiple segments
          const path = data.path || [];
          if (path.length > 0) {
            const correctId = `${user.uid}_${path.map(s => s.toLowerCase().replace(/\s+/g, '_')).join('|')}`;
            if (docSnap.id !== correctId) {
              // Write to correct ID
              await setDoc(doc(db, collName, correctId), {
                ...data,
                updatedAt: serverTimestamp()
              });
              // Delete old bad-ID doc
              await deleteDoc(doc(db, collName, docSnap.id));
              fixed++;
              totalFixed++;
              addLog(`  🔄 ${collName} — migrated "${docSnap.id.slice(-20)}" → correct ID`, 'fix');
            }
          }
        }

        if (deleted === 0 && fixed === 0) {
          addLog(`  ✅ ${collName}: ${snap.size} doc(s) — all clean`);
        } else {
          addLog(`  ✅ ${collName}: deleted ${deleted}, migrated ${fixed}`);
        }
      } catch (err) {
        addLog(`  ❌ ${collName}: ${err.message}`, 'error');
      }
    }

    addLog('');
    addLog(`🏁 Done — ${totalDeleted} stale doc(s) deleted, ${totalFixed} doc(s) migrated to new ID format.`, 'done');
    setRunning(false);
    setDone(true);
  };

  const logColor = (type) => ({
    info:  '#4a352f',
    warn:  '#b45309',
    error: '#dc2626',
    fix:   '#2563eb',
    done:  '#15803d',
  }[type] || '#4a352f');

  return (
    <div style={{
      maxWidth: 680,
      margin: '40px auto',
      padding: 32,
      background: 'white',
      borderRadius: 10,
      border: '1px solid #e6d7c3',
      fontFamily: 'inherit'
    }}>
      <h2 style={{ margin: '0 0 8px', color: '#4a352f', fontSize: 20, fontWeight: 700 }}>
        🧹 Firestore Cleanup Utility
      </h2>
      <p style={{ margin: '0 0 24px', color: '#666', fontSize: 14 }}>
        Deletes stale empty documents and migrates any old-format doc IDs to the
        new <code style={{ background: '#f5f0e1', padding: '1px 5px', borderRadius: 3 }}>|</code>-separated
        format. Run once — safe to re-run at any time.
      </p>

      <button
        onClick={runCleanup}
        disabled={running}
        style={{
          padding: '10px 28px',
          background: running ? '#c8b6a6' : '#a67c52',
          color: 'white',
          border: 'none',
          borderRadius: 7,
          cursor: running ? 'not-allowed' : 'pointer',
          fontSize: 15,
          fontWeight: 600,
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}
      >
        {running && (
          <span style={{
            width: 14, height: 14,
            border: '2px solid rgba(255,255,255,0.4)',
            borderTopColor: 'white',
            borderRadius: '50%',
            display: 'inline-block',
            animation: 'spin 0.8s linear infinite'
          }} />
        )}
        {running ? 'Running...' : done ? 'Run Again' : 'Run Cleanup'}
      </button>

      {log.length > 0 && (
        <div style={{
          background: '#faf7f2',
          border: '1px solid #e6d7c3',
          borderRadius: 7,
          padding: '12px 16px',
          maxHeight: 340,
          overflowY: 'auto',
          fontFamily: 'monospace',
          fontSize: 13
        }}>
          {log.map((entry, i) => (
            <div key={i} style={{
              display: 'flex',
              gap: 10,
              padding: '2px 0',
              color: logColor(entry.type),
              fontWeight: entry.type === 'done' ? 700 : 400
            }}>
              <span style={{ color: '#bbb', flexShrink: 0 }}>{entry.ts}</span>
              <span>{entry.msg}</span>
            </div>
          ))}
        </div>
      )}

      {done && (
        <p style={{
          marginTop: 16, padding: '10px 16px',
          background: '#f0fdf4', border: '1px solid #86efac',
          borderRadius: 7, color: '#15803d', fontSize: 14
        }}>
          ✅ Cleanup complete. Refresh the page and re-test your uploads.
        </p>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default CleanupFirestore;