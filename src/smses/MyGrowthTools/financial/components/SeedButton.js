"use client";
import { useState } from "react";
import { db } from "../../firebaseConfig";
import {
  collection,
  doc,
  setDoc,
  addDoc,
  getDocs,
  query,
  where,
  writeBatch,
} from "firebase/firestore";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

const lerp = (a, b, t, jitter = 0) =>
  a + (b - a) * t + (Math.random() - 0.5) * 2 * jitter;

const trend12 = (janVal, decVal, jitter = 0, transform = (v) => Math.round(v)) =>
  Array.from({ length: 12 }, (_, i) =>
    transform(clamp(lerp(janVal, decVal, i / 11, jitter), 0, Infinity))
  );

const seasonal = (base12, amplitude = 0.08) =>
  base12.map((v, i) => {
    const wave = 1 + amplitude * Math.sin((i / 11) * Math.PI * 2 - Math.PI / 2);
    return Math.round(v * wave);
  });

const arr = (v) => Array(12).fill(v);
const f2 = (a) => a.map((v) => parseFloat(v.toFixed(2)));
const G = (j, d, jit = 0) => trend12(j, d, jit);

const YEARS = [2023, 2024, 2025, 2026];

// Revenue grows ~18-22% YoY with margin expansion
const SALES_JAN = { 2023: 1_800_000, 2024: 2_200_000, 2025: 2_750_000, 2026: 3_300_000 };
const SALES_DEC = { 2023: 2_100_000, 2024: 2_650_000, 2025: 3_200_000, 2026: 3_900_000 };
const COGS_RATIO = { 2023: 0.54, 2024: 0.52, 2025: 0.50, 2026: 0.49 };
const OPEX_JAN  = { 2023: 600_000, 2024: 700_000, 2025: 820_000, 2026: 950_000 };
const OPEX_DEC  = { 2023: 650_000, 2024: 760_000, 2025: 890_000, 2026: 1_050_000 };

// ─── Builders ─────────────────────────────────────────────────────────────────

const buildPnl = (uid, year) => {
  const sales  = seasonal(G(SALES_JAN[year], SALES_DEC[year], 80_000));
  const cogs   = sales.map((s) => Math.round(s * (COGS_RATIO[year] + (Math.random() - 0.5) * 0.02)));
  const opex   = G(OPEX_JAN[year], OPEX_DEC[year], 30_000);
  const dep    = arr(Math.round(15_000 + year * 500));
  const amort  = arr(5_000);
  const intExp = G(25_000, 18_000, 2_000);
  const intInc = G(8_000, 12_000, 1_000);
  const tax    = sales.map((s, i) => {
    const ebit = s - cogs[i] - opex[i] - dep[i] - amort[i];
    return Math.max(0, Math.round((ebit - intExp[i] + intInc[i]) * 0.28));
  });
  const bgt = (a) => a.map((v) => Math.round(v * (1.05 + (Math.random() - 0.5) * 0.04)));

  return {
    userId: uid, year,
    sales, salesBudget: bgt(sales),
    cogs,  cogsBudget:  bgt(cogs),
    opex,  opexBudget:  bgt(opex),
    salaries:       G(OPEX_JAN[year] * 0.55, OPEX_DEC[year] * 0.55, 15_000),
    salariesBudget: G(OPEX_JAN[year] * 0.57, OPEX_DEC[year] * 0.57, 15_000),
    rent:           arr(Math.round(65_000 + year * 2_000)),
    rentBudget:     arr(Math.round(65_000 + year * 2_000)),
    utilities:      G(18_000, 22_000, 1_500), utilitiesBudget: G(19_000, 23_000, 1_000),
    marketing:      G(40_000, 65_000, 5_000), marketingBudget: G(45_000, 70_000, 4_000),
    admin:          G(25_000, 30_000, 2_000), adminBudget:     G(26_000, 31_000, 1_500),
    otherExpenses:  G(20_000, 28_000, 3_000), otherExpensesBudget: G(22_000, 30_000, 2_500),
    depreciation: dep, depreciationBudget: dep,
    amortization: amort, amortizationBudget: amort,
    interestExpense: intExp, interestExpenseBudget: intExp.map((v) => Math.round(v * 1.02)),
    interestIncome:  intInc, interestIncomeBudget:  intInc.map((v) => Math.round(v * 0.95)),
    tax, taxBudget: bgt(tax),
    notes: `FY ${year} P&L — seeded data`,
    lastUpdated: new Date().toISOString(),
  };
};

const buildBalanceSheet = (uid, year) => {
  const sc = 1 + (year - 2023) * 0.18;

  const bank = {
    callAccounts:   G(80_000*sc, 250_000*sc, 20_000*sc),
    currentAccount: G(35_000*sc,  70_000*sc,  8_000*sc),
    pettyCash:      arr(Math.round(5_000*sc)),
    moneyMarket:    G(100_000*sc,200_000*sc, 15_000*sc),
  };
  const currentAssets = {
    accountsReceivable: seasonal(G(280_000*sc, 430_000*sc, 20_000)),
    tradeReceivables:   seasonal(G(1_100_000*sc, 1_400_000*sc, 60_000)),
    otherReceivables:   G(40_000*sc,  60_000*sc,  5_000),
    inventory:          seasonal(G(350_000*sc, 500_000*sc, 25_000)),
    prepaidExpenses:    G(30_000*sc,  45_000*sc,  3_000),
    deposits:           G(180_000*sc, 290_000*sc, 10_000),
    cash:               G(45_000*sc,  130_000*sc,  8_000),
    callAccounts:       G(10_000*sc,   28_000*sc,  2_000),
    shortTermInvestments: G(50_000*sc, 120_000*sc, 10_000),
  };
  const fixedAssets = {
    land:                       arr(Math.round(500_000*sc)),
    buildings:                  arr(Math.round(1_200_000*sc)),
    lessDepreciationBuildings:  G(10_000, 30_000, 1_000),
    computerEquipment:          arr(Math.round(150_000*sc)),
    lessDepreciationComputer:   G(28_000, 55_000, 2_000),
    vehicles:                   arr(Math.round(200_000*sc)),
    lessDepreciationVehicles:   G(38_000, 65_000, 2_000),
    furniture:                  arr(Math.round(80_000*sc)),
    lessDepreciationFurniture:  G(5_000,  18_000,   500),
    machinery:                  arr(Math.round(300_000*sc)),
    lessDepreciationMachinery:  G(15_000, 45_000, 1_500),
    otherPropertyPlantEquipment: arr(Math.round(50_000*sc)),
    lessDepreciationOther:      G(8_000,  22_000,   800),
    assetsUnderConstruction:    G(0, 80_000*sc, 5_000),
    totalFixedAssets:           arr(0),
  };
  const intangibleAssets = {
    goodwill:         arr(Math.round(150_000*sc)),
    trademarks:       arr(Math.round(80_000*sc)),
    patents:          arr(Math.round(60_000*sc)),
    software:         G(100_000*sc, 180_000*sc, 8_000),
    customerLists:    arr(Math.round(40_000*sc)),
    lessAmortization: G(10_000, 60_000, 2_000),
  };
  const nonCurrentAssets = {
    loans:             G(90_000*sc,  170_000*sc, 8_000),
    loanAccount:       G(48_000*sc,   75_000*sc, 3_000),
    investments:       G(200_000*sc, 350_000*sc,15_000),
    deferredTaxAssets: G(20_000*sc,   45_000*sc, 2_000),
  };
  const additionalMetrics = {
    trainingSpend:      G(15_000, 35_000, 2_000),
    hdiSpent:           G(10_000, 25_000, 1_500),
    labourCost:         G(350_000*sc, 550_000*sc, 20_000),
    revenuePerEmployee: G(180_000*sc, 240_000*sc,  8_000),
    numberOfEmployees:  trend12(12 + year - 2023, 15 + year - 2023, 1),
    marketingSpend:     G(40_000, 70_000, 4_000),
    rAndDSpend:         G(20_000, 55_000, 5_000),
  };
  const currentLiabilities = {
    accountsPayable:            seasonal(G(220_000*sc, 360_000*sc, 18_000)),
    tradePayables:              seasonal(G(400_000*sc, 650_000*sc, 30_000)),
    accruedExpenses:            G(80_000*sc,  130_000*sc,  8_000),
    shortTermDebt:              G(150_000*sc, 100_000*sc,  10_000),
    currentPortionLongTermDebt: arr(Math.round(60_000*sc)),
    incomeReceivedInAdvance:    G(30_000*sc,   55_000*sc,   3_000),
    provisionIntercompany:      arr(0),
    provisionForLeavePay:       G(25_000*sc,   40_000*sc,   2_000),
    provisionForBonuses:        G(20_000*sc,   80_000*sc,   5_000),
    salaryControlMedicalFund:   arr(Math.round(12_000*sc)),
    salaryControlPAYE:          arr(Math.round(45_000*sc)),
    salaryControlPensionFund:   arr(Math.round(18_000*sc)),
    salaryControlSalaries:      arr(Math.round(320_000*sc)),
    vatLiability:               G(40_000*sc,  70_000*sc,  5_000),
    otherTaxesPayable:          G(15_000*sc,  30_000*sc,  2_000),
  };
  const nonCurrentLiabilities = {
    longTermDebt:           G(800_000*sc, 650_000*sc, 20_000),
    thirdPartyLoans:        G(200_000*sc, 150_000*sc, 10_000),
    intercompanyLoans:      arr(0),
    directorsLoans:         G(100_000*sc,  80_000*sc,  8_000),
    deferredTaxLiabilities: G(35_000*sc,   60_000*sc,  3_000),
    leaseLiabilities:       G(120_000*sc,  90_000*sc,  8_000),
    provisions:             G(40_000*sc,   65_000*sc,  4_000),
    totalNonCurrentLiabilities: arr(0),
  };
  const equity = {
    shareCapital:            arr(Math.round(500_000*sc)),
    capital:                 arr(Math.round(200_000*sc)),
    additionalPaidInCapital: arr(Math.round(300_000*sc)),
    retainedEarnings:        G(400_000*sc, 700_000*sc, 30_000),
    currentYearEarnings:     G( 50_000*sc, 250_000*sc, 20_000),
    reserves:                G( 80_000*sc, 150_000*sc, 10_000),
    treasuryShares:          arr(0),
    ownerAContribution:      arr(Math.round(250_000*sc)),
    ownerAShare:             arr(Math.round(125_000*sc)),
    ownerBContribution:      arr(Math.round(150_000*sc)),
    ownerBShare:             arr(Math.round( 75_000*sc)),
    otherEquity:             G(20_000*sc, 50_000*sc, 5_000),
  };

  return {
    userId: uid, year,
    balanceSheetData: {
      assets: { bank, currentAssets, fixedAssets, intangibleAssets, nonCurrentAssets, additionalMetrics, customCategories: [] },
      liabilities: { currentLiabilities, nonCurrentLiabilities },
      equity,
      customLiabilitiesCategories: [],
      customEquityCategories: [],
    },
    lastUpdated: new Date().toISOString(),
  };
};

const buildCostAgility = (uid, year) => {
  const sc = 1 + (year - 2023) * 0.15;
  return {
    userId: uid, year,
    fixedCosts:          G(380_000*sc, 430_000*sc, 15_000),
    variableCosts:       G(180_000*sc, 240_000*sc, 12_000),
    semiVariableCosts:   G( 90_000*sc, 120_000*sc,  8_000),
    discretionaryCosts:  G( 60_000*sc,  95_000*sc,  6_000),
    lockInDuration:      G(18 - (year-2023), 14 - (year-2023), 1).map(v => Math.max(6, v)),
    notes: `FY ${year} cost structure — seeded`,
    lastUpdated: new Date().toISOString(),
  };
};

const buildLiquidity = (uid, year) => {
  const sc = 1 + (year - 2023) * 0.18;
  const burnRate    = G(350_000*sc, 420_000*sc, 20_000);
  const cashBalance = G(600_000*sc, 950_000*sc, 40_000);
  return {
    userId: uid, year,
    currentRatio:      f2(trend12(1.45 + (year-2023)*0.08, 1.75 + (year-2023)*0.08, 0.05)),
    quickRatio:        f2(trend12(1.05 + (year-2023)*0.06, 1.30 + (year-2023)*0.06, 0.04)),
    cashRatio:         f2(trend12(0.55 + (year-2023)*0.04, 0.75 + (year-2023)*0.04, 0.03)),
    burnRate,
    cashCover:         cashBalance.map((c, i) => parseFloat((c / burnRate[i]).toFixed(1))),
    cashflow:          G(120_000*sc, 280_000*sc, 15_000),
    operatingCashflow: G(200_000*sc, 380_000*sc, 20_000),
    investingCashflow: G( 80_000*sc,  40_000*sc,  8_000).map(v => -v),
    financingCashflow: G( 50_000*sc,  30_000*sc,  5_000).map(v => -v),
    loanRepayments:    G( 60_000*sc,  55_000*sc,  3_000),
    cashBalance,
    workingCapital:    G(400_000*sc, 700_000*sc, 30_000),
    notes: `FY ${year} liquidity — seeded`,
    lastUpdated: new Date().toISOString(),
  };
};

const DIVIDENDS = [
  { date: "2023-06-30", amount: 150_000, type: "Interim", declaredBy: "Board Resolution #2023-01" },
  { date: "2023-12-15", amount: 220_000, type: "Final",   declaredBy: "Board Resolution #2023-02" },
  { date: "2024-06-28", amount: 185_000, type: "Interim", declaredBy: "Board Resolution #2024-01" },
  { date: "2024-12-12", amount: 270_000, type: "Final",   declaredBy: "Board Resolution #2024-02" },
  { date: "2025-03-31", amount: 100_000, type: "Special", declaredBy: "Board Resolution #2025-01" },
  { date: "2025-06-27", amount: 220_000, type: "Interim", declaredBy: "Board Resolution #2025-02" },
];

const LOANS = [
  { name: "ABSA Growth Facility",      amount: 800_000, interestRate: 11.5, startDate: "2023-01-01", term: 60, monthlyPayment: 17_400, status: "active" },
  { name: "Nedbank Equipment Finance", amount: 300_000, interestRate:  9.8, startDate: "2023-07-01", term: 36, monthlyPayment:  9_700, status: "active" },
  { name: "FNB Business Loan",         amount: 500_000, interestRate: 12.0, startDate: "2024-03-01", term: 48, monthlyPayment: 13_100, status: "active" },
];

// ─── Main seeder fn ───────────────────────────────────────────────────────────

const runSeed = async (uid, onProgress) => {
  const log = (msg) => onProgress((prev) => [...prev, msg]);

  // 1. Delete existing docs
  log("🗑  Clearing existing financial data...");
  const existing = await getDocs(
    query(collection(db, "financialData"), where("userId", "==", uid))
  );
  // Firestore batch limit = 500 ops
  const chunks = [];
  for (let i = 0; i < existing.docs.length; i += 499) {
    chunks.push(existing.docs.slice(i, i + 499));
  }
  for (const chunk of chunks) {
    const batch = writeBatch(db);
    chunk.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
  log(`   Deleted ${existing.docs.length} docs.`);

  // 2. Seed per year
  for (const year of YEARS) {
    await setDoc(doc(db, "financialData", `${uid}_pnlManual_${year}`),         buildPnl(uid, year));
    await setDoc(doc(db, "financialData", `${uid}_capitalStructure_${year}`),  buildBalanceSheet(uid, year));
    await setDoc(doc(db, "financialData", `${uid}_costAgility_${year}`),       buildCostAgility(uid, year));
    await setDoc(doc(db, "financialData", `${uid}_liquiditySurvival_${year}`), buildLiquidity(uid, year));
    log(`   ✓ ${year} — P&L, Balance Sheet, Cost Agility, Liquidity`);
  }

  // 3. Dividends
  for (const div of DIVIDENDS) {
    await addDoc(
      collection(db, "financialData", `${uid}_dividends`, "dividendHistory"),
      { ...div, userId: uid, createdAt: new Date().toISOString() }
    );
  }
  log(`   ✓ ${DIVIDENDS.length} dividend records`);

  // 4. Loans
  for (const loan of LOANS) {
    const loanId = `loan_${loan.name.toLowerCase().replace(/\s+/g, "_")}`;
    await setDoc(doc(db, "financialData", `${uid}_${loanId}`), {
      ...loan, userId: uid, id: loanId,
      type: "loan", section: "liquidity-survival",
      createdDate: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    });
  }
  log(`   ✓ ${LOANS.length} loans`);
  log("✅  Seeding complete — reload the dashboard.");
};

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Drop-in seed button.
 * 
 * Usage (e.g. in FinancialPerformance.js, inside the investor banner area or
 * behind a dev-only flag):
 *
 *   import SeedDataButton from "./SeedDataButton";
 *   ...
 *   {process.env.NODE_ENV === "development" && user && (
 *     <SeedDataButton userId={user.uid} />
 *   )}
 */
const SeedDataButton = ({ userId }) => {
  const [status, setStatus] = useState("idle"); // idle | running | done | error
  const [log, setLog]       = useState([]);
  const [open, setOpen]     = useState(false);

  const handleSeed = async () => {
    if (!userId) return alert("No user — log in first.");
    const confirmed = window.confirm(
      "⚠️  This will DELETE all existing financial data for this user and replace it with seed data.\n\nProceed?"
    );
    if (!confirmed) return;

    setStatus("running");
    setLog([]);
    setOpen(true);

    try {
      await runSeed(userId, setLog);
      setStatus("done");
    } catch (err) {
      console.error(err);
      setLog((p) => [...p, `❌  Error: ${err.message}`]);
      setStatus("error");
    }
  };

  const btnColor = {
    idle:    "bg-amber-600 hover:bg-amber-700",
    running: "bg-amber-400 cursor-wait",
    done:    "bg-green-600 hover:bg-green-700",
    error:   "bg-red-600 hover:bg-red-700",
  }[status];

  const btnLabel = {
    idle:    "🌱 Seed Demo Data",
    running: "⏳ Seeding…",
    done:    "✅ Seeded",
    error:   "❌ Seed Failed",
  }[status];

  return (
    <div className="relative inline-block">
      <button
        onClick={status === "running" ? undefined : handleSeed}
        className={`px-4 py-2 text-white border-0 rounded-md cursor-pointer font-semibold text-xs transition-all ${btnColor}`}
      >
        {btnLabel}
      </button>

      {/* Log panel */}
      {open && log.length > 0 && (
        <div className="absolute top-10 right-0 z-[2000] bg-[#1a1a1a] text-green-400 font-mono text-xs p-4 rounded-lg shadow-2xl w-[420px] max-h-[320px] overflow-y-auto border border-green-700">
          <div className="flex justify-between items-center mb-2">
            <span className="text-green-300 font-semibold">Seed log</span>
            {status !== "running" && (
              <button
                onClick={() => setOpen(false)}
                className="bg-transparent border-0 text-green-400 cursor-pointer text-base leading-none"
              >
                ×
              </button>
            )}
          </div>
          {log.map((line, i) => (
            <div key={i} className="leading-relaxed whitespace-pre-wrap">{line}</div>
          ))}
          {status === "done" && (
            <button
              onClick={() => window.location.reload()}
              className="mt-3 px-3 py-1.5 bg-green-700 text-white border-0 rounded cursor-pointer text-xs font-semibold"
            >
              Reload Dashboard
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SeedDataButton;