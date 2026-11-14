import type { BenchmarkTask } from '../types/index.ts';

export const BENCHMARK_TASKS: BenchmarkTask[] = [
  {
    id: 'task-reason-1',
    title: 'Multi-Leg Supply Chain Dependency Resolution',
    category: 'reasoning',
    difficulty: 'hard',
    description: 'Determine the earliest delivery date for an assembled microchip given factory shutdown schedules, transit port strikes, and strict customs hold buffers.',
    inputPrompt: `A factory in Taiwan manufactures semiconductor chips (takes 4 business days).
Factory is closed for maintenance on Oct 3 and Oct 4.
Shipment takes 2 calendar days to port.
Port customs in Oakland experiences a 48-hour backlog starting Monday Oct 6.
Assembly in Texas requires raw chips plus ceramic casing shipped from Germany (dispatched Oct 1, 6 calendar days transit).
Starting production Oct 1 (Wednesday): What is the exact calendar date assembly can commence in Texas? Show reasoning step-by-step.`,
    groundTruth: 'Assembly can commence on October 11. (Taiwan production finishes Oct 7 after weekend/maintenance; Oakland clearance by Oct 10; Texas delivery Oct 11. German casings arrive Oct 7 so are not the bottleneck).',
    evaluationCriteria: [
      'Account for business days vs calendar days accurately',
      'Correctly incorporate Taiwanese factory maintenance pause',
      'Evaluate parallel German casing shipment constraint',
      'Arrive at exact date October 11'
    ],
    timeoutSeconds: 30,
    tags: ['logistics', 'temporal-logic', 'constraint-satisfaction']
  },
  {
    id: 'task-math-1',
    title: 'Compound Portfolio Drawdown & Kelly Criterion',
    category: 'mathematics',
    difficulty: 'hard',
    description: 'Calculate the optimal fraction to wager given an asymmetric probability distribution and compute the expected portfolio drawdown after 50 iterations.',
    inputPrompt: `An algorithmic arbitrage strategy has a 65% win probability with a payout ratio of b = 1.4 (net profit to wager ratio). On loss, 100% of the wager is lost.
1. Compute the exact Kelly Criterion fraction f*.
2. If half-Kelly (f*/2) is used on an initial capital of $100,000, what is the exact expected capital after 3 consecutive wins followed by 1 loss?`,
    groundTruth: 'f* = 0.40 (40.0%). Half-Kelly f*/2 = 0.20 (20.0%). Expected capital = $110,592.00.',
    evaluationCriteria: [
      'Accurate formula f* = (bp - q) / b = (1.4*0.65 - 0.35) / 1.4 = 0.40',
      'Proper derivation of half-Kelly fraction = 0.20',
      'Correct compounding: 100000 * (1.28)^3 * (0.80) = $110,592'
    ],
    timeoutSeconds: 25,
    tags: ['quantitative-finance', 'probability', 'precise-arithmetic']
  },
  {
    id: 'task-extract-1',
    title: 'Complex Medical Trial Adverse Event Structuring',
    category: 'extraction',
    difficulty: 'medium',
    description: 'Extract structured JSON entities from messy doctor notes, isolating patient demographics, dosage regimens, adverse events, and causality ratings.',
    inputPrompt: `Parse the following clinical note into a valid strict JSON object:
"Pt 58yo M (ID: CX-9021) on blinded Arm B receiving investigational mAB 15mg/kg Q3W since June 14. Reported Grade 2 pruritus on Day 18 resolved with diphenhydramine. On July 29 presented with persistent Grade 3 elevated ALT/AST (>5x ULN). Infusion held. Attending deemed ALT elevation 'probable relation' to study drug. Concomitant meds: Atorvastatin 20mg QD (held)."

Required keys: patientId, age, sex, cohortArm, drugDose, adverseEvents: [{ symptom, grade, onsetDayOrDate, causality, resolutionAction }]`,
    groundTruth: `JSON containing patientId "CX-9021", age 58, sex "M", cohortArm "Arm B", adverseEvents array containing two entries (Grade 2 pruritus with diphenhydramine, Grade 3 elevated ALT/AST with probable relation & infusion held).`,
    evaluationCriteria: [
      'Strict valid JSON output without markdown markdown fences if raw requested',
      'Accurate extraction of both adverse events with correct grading (Grade 2 and Grade 3)',
      'Accurate capture of causality ("probable relation") and action ("infusion held")'
    ],
    timeoutSeconds: 20,
    tags: ['schema-adherence', 'medical-nlp', 'json-validation']
  },
  {
    id: 'task-research-1',
    title: 'Cross-Jurisdiction AI Regulatory Compliance Synthesis',
    category: 'research',
    difficulty: 'expert',
    description: 'Synthesize contradictory regulatory requirements between EU AI Act High-Risk systems and US NIST AI RMF guidelines for healthcare diagnostic agents.',
    inputPrompt: `Compare the compliance audit requirements for an autonomous diagnostic imaging agent under:
1. EU AI Act (Annex III High-Risk Medical Devices)
2. US NIST AI Risk Management Framework 1.0 (GOVERN and MEASURE functions)

Synthesize three specific operational tensions an ML engineering team faces when trying to maintain a unified CI/CD deployment pipeline for both regions. Recommend concrete mitigations.`,
    groundTruth: 'Identifies tensions: (1) Ex-ante conformity assessment vs continuous voluntary telemetry; (2) Strict training data provenance / copyright disclosure vs NIST flexible bias evaluation; (3) Mandated human-in-the-loop override interfaces vs US post-market surveillance metrics.',
    evaluationCriteria: [
      'Demonstrates nuanced understanding of EU AI Act CE marking obligations',
      'Synthesizes NIST RMF Core functions accurately',
      'Identifies actionable software engineering and MLOps tensions',
      'Provides realistic mitigation architectures (e.g. regional configuration forks, automated artifact logging)'
    ],
    timeoutSeconds: 45,
    tags: ['ai-governance', 'synthesis', 'legal-tech', 'policy']
  },
  {
    id: 'task-plan-1',
    title: 'Disaster Recovery Cloud Database Migration Plan',
    category: 'planning',
    difficulty: 'expert',
    description: 'Draft a zero-downtime cutover plan for migrating a 4TB PostgreSQL database with 15,000 writes/sec from AWS Aurora to GCP Cloud SQL.',
    inputPrompt: `Design a zero-downtime, sub-second latency cutover plan to migrate a 4TB active-active PostgreSQL cluster (15k write TPS) from AWS us-east-1 to GCP us-central1.
Constraints:
- Maximum tolerable data loss (RPO) = 0 seconds
- Maximum downtime window (RTO) = < 30 seconds
- Network pipe: 10 Gbps dedicated interconnect
Include pre-migration, sync phase, cutover choreography (minute-by-minute), and rollback contingency.`,
    groundTruth: 'Comprehensive migration plan using Change Data Capture (CDC / Debezium / logical replication), reverse replication during cutover for instant rollback, and DNS/Proxy weight shifting.',
    evaluationCriteria: [
      'Logical replication / CDC setup to handle 15k TPS without replication lag divergence',
      'Reverse replication path established to satisfy RPO=0 on immediate rollback',
      'Cutover choreography under 30s RTO (read-only flip, sequence sync, connection drainage)',
      'Concrete fallback triggers specified'
    ],
    timeoutSeconds: 40,
    tags: ['distributed-systems', 'devops', 'zero-downtime', 'cloud-architecture']
  },
  {
    id: 'task-code-1',
    title: 'Lock-Free Concurrent Ring Buffer Implementation',
    category: 'code',
    difficulty: 'hard',
    description: 'Implement a thread-safe, lock-free Single Producer Single Consumer (SPSC) ring buffer in Python/TypeScript with memory barrier semantics.',
    inputPrompt: `Implement a lock-free Single Producer Single Consumer (SPSC) circular ring buffer of fixed capacity N in TypeScript.
Must support:
- offer(item: T): boolean (returns false if full)
- poll(): T | null (returns null if empty)
- size(): number
Ensure proper head and tail pointer masking (power of 2 sizing) and avoid false sharing pitfalls.`,
    groundTruth: 'Clean ring buffer implementation with power-of-two capacity constraint, bitwise modulo masking `(head & mask)`, non-blocking state checks, and thorough boundary edge tests.',
    evaluationCriteria: [
      'Correct circular index calculation using bitwise AND mask',
      'Safe concurrent head/tail boundary updates without race conditions',
      'Exact handling of full buffer (head - tail == capacity) and empty buffer',
      'TypeScript generics support and correct return signatures'
    ],
    timeoutSeconds: 30,
    tags: ['concurrency', 'algorithms', 'data-structures', 'systems-programming']
  },
  {
    id: 'task-math-2',
    title: 'Matrix Eigenvalue & Markov Steady-State Analysis',
    category: 'mathematics',
    difficulty: 'medium',
    description: 'Compute the stationary distribution of an ergodic 3-state consumer brand loyalty transition matrix.',
    inputPrompt: `Given a Markov transition matrix P for customers switching between brands A, B, and C:
P = [
  [0.70, 0.20, 0.10],
  [0.15, 0.75, 0.10],
  [0.10, 0.30, 0.60]
]
Find the exact stationary vector pi = [pi_A, pi_B, pi_C] such that pi * P = pi and sum(pi) = 1.
Express the final fractions in both simplified rational form and decimals rounded to 4 places.`,
    groundTruth: 'pi_A = 27/83 ≈ 0.3253, pi_B = 40/83 ≈ 0.4819, pi_C = 16/83 ≈ 0.1928.',
    evaluationCriteria: [
      'Formulates linear system (P^T - I) * pi = 0 with constraint sum(pi) = 1',
      'Correct row operations or Cramer rule solving',
      'Exact common denominator 83 (27/83, 40/83, 16/83)'
    ],
    timeoutSeconds: 25,
    tags: ['linear-algebra', 'markov-chains', 'stationary-distribution']
  },
  {
    id: 'task-reason-2',
    title: 'Counterfactual Causality & Simpson Paradox Audit',
    category: 'reasoning',
    difficulty: 'expert',
    description: 'Detect whether an apparent hospital survival disparity is caused by Simpson’s Paradox due to unobserved confounding severity variables.',
    inputPrompt: `Hospital A treated 1,000 patients and had 800 survivals (80% survival rate).
Hospital B treated 1,000 patients and had 850 survivals (85% survival rate).
Media claims Hospital B is statistically superior.
Subgroup analysis shows:
- Critical patients: Hospital A (900 treated, 700 survived = 77.8%), Hospital B (200 treated, 140 survived = 70.0%).
- Mild patients: Hospital A (100 treated, 100 survived = 100%), Hospital B (800 treated, 710 survived = 88.8%).

Analyze:
1. Does Hospital A outperform Hospital B in both subgroups?
2. Explain the causal mechanism behind this inversion (Simpson's Paradox).
3. If a patient is triaged with critical illness, which hospital should they be routed to according to do-calculus?`,
    groundTruth: '1. Yes, Hospital A outperforms B in both critical (77.8% > 70%) and mild (100% > 88.8%). 2. Simpson Paradox is driven by patient allocation confounding: Hospital A takes 90% severe cases vs 20% for B. 3. Patient must be routed to Hospital A.',
    evaluationCriteria: [
      'Identifies and calculates subgroup survival rates verifying Hospital A superiority in both strata',
      'Accurately names and explains confounding / Simpson’s Paradox mechanics',
      'Applies correct causal interventional reasoning (do(Treatment = Hospital A) gives higher expected survival)'
    ],
    timeoutSeconds: 30,
    tags: ['causal-inference', 'statistics', 'simpson-paradox', 'decision-theory']
  }
];
