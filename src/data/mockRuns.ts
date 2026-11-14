import { BenchmarkRun } from '../types';

export const INITIAL_MOCK_RUNS: BenchmarkRun[] = [
  {
    id: 'run-seed-101',
    name: 'Multi-Agent High-Complexity Baseline Suite',
    timestamp: '2026-11-12T14:32:00Z',
    status: 'completed',
    agentIds: ['agent-planner-1', 'agent-direct-1', 'agent-react-1', 'agent-critic-1'],
    taskIds: ['task-reason-1', 'task-math-1', 'task-extract-1', 'task-research-1'],
    isDemoRun: true,
    totalExecutionTimeMs: 14250,
    summaries: [
      {
        agentId: 'agent-critic-1',
        avgScore: 96.2,
        passRate: 100,
        totalLatencyMs: 12400,
        avgLatencyMs: 3100,
        totalCostUsd: 0.048,
        totalTokens: 11400,
        toolCallsCount: 14,
        rank: 1
      },
      {
        agentId: 'agent-planner-1',
        avgScore: 91.5,
        passRate: 100,
        totalLatencyMs: 9800,
        avgLatencyMs: 2450,
        totalCostUsd: 0.034,
        totalTokens: 8200,
        toolCallsCount: 11,
        rank: 2
      },
      {
        agentId: 'agent-react-1',
        avgScore: 84.8,
        passRate: 75,
        totalLatencyMs: 7280,
        avgLatencyMs: 1820,
        totalCostUsd: 0.022,
        totalTokens: 5900,
        toolCallsCount: 9,
        rank: 3
      },
      {
        agentId: 'agent-direct-1',
        avgScore: 68.4,
        passRate: 50,
        totalLatencyMs: 2720,
        avgLatencyMs: 680,
        totalCostUsd: 0.007,
        totalTokens: 2100,
        toolCallsCount: 0,
        rank: 4
      }
    ],
    results: [
      // Planner Agent on Task 1 (Reasoning)
      {
        agentId: 'agent-planner-1',
        taskId: 'task-reason-1',
        status: 'pass',
        score: 95,
        latencyMs: 2600,
        promptTokens: 840,
        completionTokens: 1120,
        totalTokens: 1960,
        estimatedCostUsd: 0.0084,
        toolCallsCount: 3,
        errorRecoveryAttempts: 0,
        generatedOutput: `### Step-by-Step Logistics Calculation:
1. **Taiwan Production**: Started Wed Oct 1.
   - Day 1: Wed Oct 1
   - Day 2: Thu Oct 2
   - Maintenance pause: Fri Oct 3 & Sat Oct 4 (closed)
   - Day 3: Mon Oct 6 (business day)
   - Day 4: Tue Oct 7 (complete)
2. **Transit to Oakland**: 2 calendar days -> arrives Thu Oct 9.
3. **Oakland Customs**: 48h hold -> clears Sat Oct 11 morning.
4. **Domestic US Transit to Texas**: Same day express delivery arrives Sat Oct 11.
5. **Parallel Constraint (German casing)**: Dispatched Oct 1 + 6 days = Oct 7. Casing arrives well before chips.

**Final Answer**: Assembly can begin on **October 11**.`,
        stepsTrace: [
          { stepNumber: 1, type: 'thought', content: 'Deconstructing temporal timeline. Identifying business days vs calendar days constraint.', durationMs: 400 },
          { stepNumber: 2, type: 'action', actionName: 'step_planner', content: 'Calculating Taiwan production duration with weekend & Oct 3-4 maintenance windows.', durationMs: 700 },
          { stepNumber: 3, type: 'observation', content: 'Taiwan production completes end of day Oct 7.', durationMs: 300 },
          { stepNumber: 4, type: 'action', actionName: 'validator', content: 'Cross-checking German casing parallel arrival date against chip arrival date.', durationMs: 500 },
          { stepNumber: 5, type: 'final_answer', content: 'Synthesis complete: Chips clear Oakland Oct 11. German casings arrived Oct 7. Bottleneck is chips.', durationMs: 700 }
        ],
        evaluationVerdict: 'EXCELLENT',
        evaluatorFeedback: 'Flawless constraint isolation. Correctly identified Oct 3-4 maintenance window and verified that German casings do not delay assembly.',
        isSimulated: true
      },
      // Direct Agent on Task 1 (Reasoning)
      {
        agentId: 'agent-direct-1',
        taskId: 'task-reason-1',
        status: 'fail',
        score: 45,
        latencyMs: 650,
        promptTokens: 410,
        completionTokens: 280,
        totalTokens: 690,
        estimatedCostUsd: 0.0018,
        toolCallsCount: 0,
        errorRecoveryAttempts: 0,
        generatedOutput: `Starting Oct 1: 4 days production means ready Oct 5. 2 days transit to port = Oct 7. 48 hours backlog = Oct 9. Therefore assembly starts October 9.`,
        stepsTrace: [
          { stepNumber: 1, type: 'final_answer', content: 'Direct single-pass inference without explicit calendar or maintenance check.', durationMs: 650 }
        ],
        evaluationVerdict: 'FAILED',
        evaluatorFeedback: 'Missed Taiwan factory maintenance shutdown on Oct 3-4 and failed to count business days, resulting in premature delivery date estimate.',
        isSimulated: true
      },
      // ReAct Agent on Task 2 (Mathematics)
      {
        agentId: 'agent-react-1',
        taskId: 'task-math-1',
        status: 'pass',
        score: 92,
        latencyMs: 1950,
        promptTokens: 620,
        completionTokens: 710,
        totalTokens: 1330,
        estimatedCostUsd: 0.0051,
        toolCallsCount: 2,
        errorRecoveryAttempts: 0,
        generatedOutput: `**1. Kelly Criterion Fraction:**
f* = (b*p - q) / b
Where p = 0.65, q = 0.35, b = 1.4
f* = (1.4 * 0.65 - 0.35) / 1.4 = (0.91 - 0.35) / 1.4 = 0.56 / 1.4 = **0.40 (40%)**.

**2. Half-Kelly Compounding:**
Half-Kelly fraction f = 0.40 / 2 = 0.20 (20%).
On win: Capital increases by 20% * 1.4 = +28% (multiplier 1.28).
On loss: Capital decreases by 20% * 1.0 = -20% (multiplier 0.80).
Final Capital = 100,000 * (1.28)^3 * 0.80 = 100,000 * 2.097152 * 0.80 = **$110,592.00**.`,
        stepsTrace: [
          { stepNumber: 1, type: 'thought', content: 'Need to compute Kelly formula f* = (bp - q)/b then calculate half-Kelly compounding.', durationMs: 320 },
          { stepNumber: 2, type: 'action', actionName: 'calculator', content: '(1.4 * 0.65 - 0.35) / 1.4', durationMs: 310 },
          { stepNumber: 3, type: 'observation', content: '0.400000', durationMs: 120 },
          { stepNumber: 4, type: 'action', actionName: 'calculator', content: '100000 * (1 + 0.20 * 1.4)^3 * (1 - 0.20)', durationMs: 340 },
          { stepNumber: 5, type: 'observation', content: '110592.000000', durationMs: 110 },
          { stepNumber: 6, type: 'final_answer', content: 'Formulating structured solution with both Kelly fraction and compounded payout.', durationMs: 750 }
        ],
        evaluationVerdict: 'EXCELLENT',
        evaluatorFeedback: 'Accurate formula application and precise arithmetic execution using calculator tool.',
        isSimulated: true
      },
      // Critic Agent on Task 3 (Extraction)
      {
        agentId: 'agent-critic-1',
        taskId: 'task-extract-1',
        status: 'pass',
        score: 98,
        latencyMs: 3350,
        promptTokens: 1120,
        completionTokens: 890,
        totalTokens: 2010,
        estimatedCostUsd: 0.0092,
        toolCallsCount: 3,
        errorRecoveryAttempts: 1,
        generatedOutput: `{
  "patientId": "CX-9021",
  "age": 58,
  "sex": "M",
  "cohortArm": "Arm B",
  "drugDose": "15mg/kg Q3W",
  "adverseEvents": [
    {
      "symptom": "pruritus",
      "grade": 2,
      "onsetDayOrDate": "Day 18",
      "causality": "unspecified",
      "resolutionAction": "resolved with diphenhydramine"
    },
    {
      "symptom": "elevated ALT/AST (>5x ULN)",
      "grade": 3,
      "onsetDayOrDate": "July 29",
      "causality": "probable relation",
      "resolutionAction": "infusion held; concomitant Atorvastatin 20mg QD held"
    }
  ]
}`,
        stepsTrace: [
          { stepNumber: 1, type: 'thought', content: 'Extracting entities: Patient CX-9021, 58yo M, Arm B. Reviewing adverse events.', durationMs: 500 },
          { stepNumber: 2, type: 'action', actionName: 'verifier', content: 'Validating JSON schema against strict syntax and checking for missing concomitant meds.', durationMs: 650 },
          { stepNumber: 3, type: 'reflection', content: 'Critic audit noted Atorvastatin hold was associated with ALT elevation resolution. Included in action notes.', durationMs: 600 },
          { stepNumber: 4, type: 'final_answer', content: 'Generated clean strict JSON complying with all required keys and medical taxonomy.', durationMs: 1600 }
        ],
        evaluationVerdict: 'EXCELLENT',
        evaluatorFeedback: 'Perfect schema compliance, captured both adverse events with nuanced grade ratings and causality attributions.',
        isSimulated: true
      }
    ]
  }
];
