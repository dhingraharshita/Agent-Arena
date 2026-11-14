import type { BenchmarkTask, AgentTaskResult } from '../types/index.ts';

export interface EvaluationResult {
  score: number; // 0 to 100
  status: 'pass' | 'fail' | 'partial';
  verdict: 'EXCELLENT' | 'SATISFACTORY' | 'SUBOPTIMAL' | 'FAILED';
  feedback: string;
  matchedCriteria: string[];
  unmatchedCriteria: string[];
}

/**
 * Normalizes text for lenient matching: lowercases, collapses whitespace, trims punctuation.
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s\.\$\%\/\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extracts JSON substring from text (handles markdown fences or embedded JSON).
 */
function extractJsonFromText(text: string): any | null {
  // Try markdown code fence
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch && fenceMatch[1]) {
    try {
      return JSON.parse(fenceMatch[1].trim());
    } catch {
      // Continue to bracket search
    }
  }

  // Try finding outermost { ... } or [ ... ]
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      const jsonStr = text.substring(firstBrace, lastBrace + 1);
      return JSON.parse(jsonStr);
    } catch {
      // ignore
    }
  }

  return null;
}

/**
 * Deterministic evaluator for structured extraction tasks (e.g. medical trial notes).
 */
function evaluateExtractionTask(output: string, task: BenchmarkTask): EvaluationResult {
  const normOutput = normalizeText(output);
  const json = extractJsonFromText(output);
  const matched: string[] = [];
  const unmatched: string[] = [];
  let score = 0;

  if (task.id === 'task-extract-1') {
    // 1. JSON Validity (20 pts)
    if (json) {
      score += 20;
      matched.push('Strict valid JSON object structure parsed');
    } else {
      unmatched.push('Failed to output valid parseable JSON');
    }

    // 2. Patient demographics & Arm (20 pts)
    const hasPatientId = json?.patientId === 'CX-9021' || normOutput.includes('cx-9021');
    const hasAge = json?.age === 58 || normOutput.includes('58');
    const hasArm = (json?.cohortArm && json.cohortArm.toLowerCase().includes('arm b')) || normOutput.includes('arm b');
    
    if (hasPatientId && hasAge && hasArm) {
      score += 20;
      matched.push('Extracted patient demographics (CX-9021, 58yo, Arm B)');
    } else if (hasPatientId || hasArm) {
      score += 10;
      matched.push('Partially extracted patient demographics');
    } else {
      unmatched.push('Missing patient ID or cohort arm');
    }

    // 3. Adverse Event 1: Grade 2 pruritus (30 pts)
    const hasPruritus = normOutput.includes('pruritus');
    const hasGrade2 = normOutput.includes('grade 2') || (json?.adverseEvents && JSON.stringify(json.adverseEvents).includes('2'));
    const hasDiphen = normOutput.includes('diphenhydramine') || normOutput.includes('resolved');

    if (hasPruritus && hasGrade2 && hasDiphen) {
      score += 30;
      matched.push('Identified Grade 2 pruritus with diphenhydramine resolution');
    } else if (hasPruritus) {
      score += 15;
      matched.push('Identified pruritus without complete grading/action');
    } else {
      unmatched.push('Missed Grade 2 pruritus adverse event');
    }

    // 4. Adverse Event 2: Grade 3 elevated ALT/AST (30 pts)
    const hasAlt = normOutput.includes('alt') || normOutput.includes('ast');
    const hasGrade3 = normOutput.includes('grade 3') || (json?.adverseEvents && JSON.stringify(json.adverseEvents).includes('3'));
    const hasCausality = normOutput.includes('probable') || normOutput.includes('infusion held');

    if (hasAlt && hasGrade3 && hasCausality) {
      score += 30;
      matched.push('Identified Grade 3 elevated ALT/AST with causality & held infusion');
    } else if (hasAlt) {
      score += 15;
      matched.push('Identified ALT/AST elevation with incomplete causality');
    } else {
      unmatched.push('Missed Grade 3 ALT/AST adverse event');
    }
  } else {
    // Generic extraction
    if (json) {
      score += 30;
      matched.push('Valid JSON output detected');
    }
    task.evaluationCriteria.forEach(crit => {
      const keywords = crit.toLowerCase().split(' ').filter(w => w.length > 4);
      const matches = keywords.filter(k => normOutput.includes(k)).length;
      if (matches >= Math.max(1, Math.floor(keywords.length * 0.4))) {
        score += Math.round(70 / task.evaluationCriteria.length);
        matched.push(crit);
      } else {
        unmatched.push(crit);
      }
    });
  }

  score = Math.min(100, Math.max(0, score));
  return formatEvaluationVerdict(score, matched, unmatched);
}

/**
 * Deterministic evaluator for mathematics tasks (e.g. Kelly Criterion, Markov chains).
 */
function evaluateMathematicsTask(output: string, task: BenchmarkTask): EvaluationResult {
  const normOutput = normalizeText(output);
  const matched: string[] = [];
  const unmatched: string[] = [];
  let score = 0;

  if (task.id === 'task-math-1') {
    // Kelly Criterion task:
    // f* = 0.40 or 40% (35 pts)
    const hasKelly = normOutput.includes('0.40') || normOutput.includes('0.4') || normOutput.includes('40%');
    if (hasKelly) {
      score += 35;
      matched.push('Derived exact Kelly Criterion fraction f* = 0.40 (40%)');
    } else {
      unmatched.push('Failed to derive Kelly fraction f* = 0.40');
    }

    // Half-Kelly = 0.20 or 20% (25 pts)
    const hasHalfKelly = normOutput.includes('0.20') || normOutput.includes('0.2') || normOutput.includes('20%');
    if (hasHalfKelly) {
      score += 25;
      matched.push('Derived half-Kelly fraction f*/2 = 0.20 (20%)');
    } else {
      unmatched.push('Failed to derive half-Kelly fraction f*/2 = 0.20');
    }

    // Expected capital = 110592 (40 pts)
    const hasFinalCapital = 
      normOutput.includes('110592') || 
      normOutput.includes('110,592') || 
      normOutput.includes('110 592');
    if (hasFinalCapital) {
      score += 40;
      matched.push('Calculated compounded portfolio balance = $110,592.00');
    } else {
      unmatched.push('Failed to compute exact compounded portfolio balance ($110,592)');
    }
  } else if (task.id === 'task-math-2') {
    // Markov stationary distribution:
    // pi_A = 27/83 or 0.3253 (35 pts)
    const hasPiA = normOutput.includes('27/83') || normOutput.includes('0.3253') || normOutput.includes('32.53%');
    if (hasPiA) {
      score += 35;
      matched.push('Computed stationary probability pi_A = 27/83 ≈ 0.3253');
    } else {
      unmatched.push('Missed stationary probability for State A (27/83)');
    }

    // pi_B = 40/83 or 0.4819 (35 pts)
    const hasPiB = normOutput.includes('40/83') || normOutput.includes('0.4819') || normOutput.includes('48.19%');
    if (hasPiB) {
      score += 35;
      matched.push('Computed stationary probability pi_B = 40/83 ≈ 0.4819');
    } else {
      unmatched.push('Missed stationary probability for State B (40/83)');
    }

    // pi_C = 16/83 or 0.1928 (30 pts)
    const hasPiC = normOutput.includes('16/83') || normOutput.includes('0.1928') || normOutput.includes('19.28%');
    if (hasPiC) {
      score += 30;
      matched.push('Computed stationary probability pi_C = 16/83 ≈ 0.1928');
    } else {
      unmatched.push('Missed stationary probability for State C (16/83)');
    }
  } else {
    // Generic math task: look for numbers in ground truth
    const groundNumbers = task.groundTruth.match(/\b\d+(?:\.\d+)?\b/g) || [];
    let matchedCount = 0;
    groundNumbers.forEach(n => {
      if (normOutput.includes(n)) {
        matchedCount++;
        matched.push(`Matched expected numerical factor: ${n}`);
      } else {
        unmatched.push(`Missing numerical factor: ${n}`);
      }
    });
    score = groundNumbers.length > 0 ? Math.round((matchedCount / groundNumbers.length) * 100) : 70;
  }

  score = Math.min(100, Math.max(0, score));
  return formatEvaluationVerdict(score, matched, unmatched);
}

/**
 * Deterministic evaluator for reasoning and constraint logic tasks.
 */
function evaluateReasoningTask(output: string, task: BenchmarkTask): EvaluationResult {
  const normOutput = normalizeText(output);
  const matched: string[] = [];
  const unmatched: string[] = [];
  let score = 0;

  if (task.id === 'task-reason-1') {
    // Supply chain dependency:
    // Target date: October 11 (50 pts)
    const hasTargetDate = 
      normOutput.includes('october 11') || 
      normOutput.includes('oct 11') || 
      normOutput.includes('11th of october');
    if (hasTargetDate) {
      score += 50;
      matched.push('Arrived at exact commencement date: October 11');
    } else {
      unmatched.push('Did not derive exact commencement date October 11');
    }

    // Maintenance pause: Oct 3-4 (25 pts)
    const hasMaintenance = 
      normOutput.includes('maintenance') || 
      normOutput.includes('oct 3') || 
      normOutput.includes('october 3') || 
      normOutput.includes('closed');
    if (hasMaintenance) {
      score += 25;
      matched.push('Correctly incorporated factory maintenance pause');
    } else {
      unmatched.push('Failed to account for factory maintenance window (Oct 3-4)');
    }

    // German casing parallel dependency check (25 pts)
    const hasGerman = 
      normOutput.includes('german') || 
      normOutput.includes('casing') || 
      normOutput.includes('oct 7') || 
      normOutput.includes('bottleneck');
    if (hasGerman) {
      score += 25;
      matched.push('Verified parallel German casing shipment constraint');
    } else {
      unmatched.push('Did not verify German casing parallel constraint');
    }
  } else if (task.id === 'task-reason-2') {
    // Simpson's paradox:
    // 1. Hospital A outperforms B in both subgroups (35 pts)
    const hasOutperform = 
      (normOutput.includes('hospital a') && (normOutput.includes('both') || normOutput.includes('superior') || normOutput.includes('higher'))) ||
      (normOutput.includes('77.8%') || normOutput.includes('77.7%'));
    if (hasOutperform) {
      score += 35;
      matched.push('Recognized that Hospital A has higher survival in both subgroups');
    } else {
      unmatched.push('Missed that Hospital A is superior within both individual strata');
    }

    // 2. Simpson's paradox named / causal confounding (35 pts)
    const hasSimpson = 
      normOutput.includes('simpson') || 
      normOutput.includes('confound') || 
      normOutput.includes('allocation');
    if (hasSimpson) {
      score += 35;
      matched.push("Correctly identified Simpson's Paradox / confounding allocation");
    } else {
      unmatched.push("Failed to identify Simpson's Paradox causal mechanism");
    }

    // 3. Routing decision: route critical patient to Hospital A (30 pts)
    const hasRouteA = 
      normOutput.includes('hospital a') && (normOutput.includes('route') || normOutput.includes('routed') || normOutput.includes('send') || normOutput.includes('choose'));
    if (hasRouteA) {
      score += 30;
      matched.push('Correctly routed critical patient to Hospital A');
    } else {
      unmatched.push('Did not conclude patient should be routed to Hospital A');
    }
  } else {
    // Generic reasoning: evaluate against criteria checkpoints
    task.evaluationCriteria.forEach(crit => {
      const keywords = crit.toLowerCase().split(' ').filter(w => w.length > 3);
      const matchedKw = keywords.filter(k => normOutput.includes(k)).length;
      if (matchedKw >= Math.max(1, Math.floor(keywords.length * 0.4))) {
        score += Math.round(100 / task.evaluationCriteria.length);
        matched.push(crit);
      } else {
        unmatched.push(crit);
      }
    });
  }

  score = Math.min(100, Math.max(0, score));
  return formatEvaluationVerdict(score, matched, unmatched);
}

/**
 * Deterministic evaluator for planning and architecture tasks.
 */
function evaluatePlanningTask(output: string, task: BenchmarkTask): EvaluationResult {
  const normOutput = normalizeText(output);
  const matched: string[] = [];
  const unmatched: string[] = [];
  let score = 0;

  if (task.id === 'task-plan-1') {
    // Database cutover plan:
    // CDC / Logical Replication (25 pts)
    const hasCdc = normOutput.includes('cdc') || normOutput.includes('change data capture') || normOutput.includes('logical replication') || normOutput.includes('debezium');
    if (hasCdc) {
      score += 25;
      matched.push('Recommended Change Data Capture (CDC) / logical replication');
    } else {
      unmatched.push('Missing CDC / continuous replication mechanism for 15k TPS');
    }

    // RPO = 0 / Reverse replication (25 pts)
    const hasReverse = normOutput.includes('reverse replication') || normOutput.includes('rpo') || normOutput.includes('zero data loss') || normOutput.includes('rollback');
    if (hasReverse) {
      score += 25;
      matched.push('Established reverse replication path to guarantee RPO=0 on rollback');
    } else {
      unmatched.push('Missing reverse replication / zero data loss rollback guarantee');
    }

    // RTO < 30s cutover choreography (25 pts)
    const hasRto = normOutput.includes('rto') || normOutput.includes('30 second') || normOutput.includes('downtime') || normOutput.includes('dns') || normOutput.includes('proxy');
    if (hasRto) {
      score += 25;
      matched.push('Formulated cutover choreography meeting <30s RTO window');
    } else {
      unmatched.push('Missing minute-by-minute cutover window meeting 30s RTO');
    }

    // Validation / Sequence check (25 pts)
    const hasValidation = normOutput.includes('sequence') || normOutput.includes('checksum') || normOutput.includes('drain') || normOutput.includes('read-only');
    if (hasValidation) {
      score += 25;
      matched.push('Included sequence synchronization, connection drainage, and health checks');
    } else {
      unmatched.push('Missing connection drainage or sequence synchronization');
    }
  } else {
    task.evaluationCriteria.forEach(crit => {
      const keywords = crit.toLowerCase().split(' ').filter(w => w.length > 4);
      const matchedKw = keywords.filter(k => normOutput.includes(k)).length;
      if (matchedKw >= Math.max(1, Math.floor(keywords.length * 0.4))) {
        score += Math.round(100 / task.evaluationCriteria.length);
        matched.push(crit);
      } else {
        unmatched.push(crit);
      }
    });
  }

  score = Math.min(100, Math.max(0, score));
  return formatEvaluationVerdict(score, matched, unmatched);
}

/**
 * Deterministic evaluator for code generation tasks.
 */
function evaluateCodeTask(output: string, task: BenchmarkTask): EvaluationResult {
  const normOutput = normalizeText(output);
  const matched: string[] = [];
  const unmatched: string[] = [];
  let score = 0;

  if (task.id === 'task-code-1') {
    // SPSC Ring Buffer:
    // Core methods: offer, poll, size (35 pts)
    const hasOffer = normOutput.includes('offer');
    const hasPoll = normOutput.includes('poll');
    const hasSize = normOutput.includes('size');
    if (hasOffer && hasPoll && hasSize) {
      score += 35;
      matched.push('Implemented required interface methods: offer(), poll(), size()');
    } else {
      unmatched.push('Missing one or more required methods (offer, poll, size)');
    }

    // Power-of-2 / Bitwise mask (35 pts)
    const hasBitwise = normOutput.includes('&') || normOutput.includes('mask') || normOutput.includes('power of 2') || normOutput.includes('capacity - 1');
    if (hasBitwise) {
      score += 35;
      matched.push('Used bitwise masking & power-of-two capacity for index wrap');
    } else {
      unmatched.push('Did not implement power-of-two bitwise masking');
    }

    // Concurrency / Memory boundary safety (30 pts)
    const hasSafety = normOutput.includes('head') && normOutput.includes('tail') && (normOutput.includes('full') || normOutput.includes('empty'));
    if (hasSafety) {
      score += 30;
      matched.push('Provided non-blocking head/tail pointer update semantics');
    } else {
      unmatched.push('Missing complete empty/full boundary logic');
    }
  } else {
    task.evaluationCriteria.forEach(crit => {
      const keywords = crit.toLowerCase().split(' ').filter(w => w.length > 4);
      const matchedKw = keywords.filter(k => normOutput.includes(k)).length;
      if (matchedKw >= Math.max(1, Math.floor(keywords.length * 0.4))) {
        score += Math.round(100 / task.evaluationCriteria.length);
        matched.push(crit);
      } else {
        unmatched.push(crit);
      }
    });
  }

  score = Math.min(100, Math.max(0, score));
  return formatEvaluationVerdict(score, matched, unmatched);
}

/**
 * Generic rubric evaluator for research & synthesis tasks or custom user tasks.
 */

/**
 * Generic rubric evaluator for research, synthesis and custom tasks.
 * Uses exact word matching and proportional criterion scoring.
 */
function evaluateGenericRubricTask(
  output: string,
  task: BenchmarkTask
): EvaluationResult {
  const outputTokens = new Set(
    normalizeText(output).match(/[a-z0-9]+/g) ?? []
  );

  const matched: string[] = [];
  const unmatched: string[] = [];
  let criteriaScore = 0;

  if (task.evaluationCriteria.length === 0) {
    return {
      score: 0,
      status: 'fail',
      verdict: 'FAILED',
      feedback: 'No evaluation criteria are defined. This task cannot be reliably scored.',
      matchedCriteria: [],
      unmatchedCriteria: ['No evaluation criteria defined']
    };
  }

  const stopWords = new Set([
    'the', 'and', 'for', 'with', 'from', 'that',
    'this', 'have', 'been', 'must', 'should',
    'into', 'their', 'there', 'then', 'than',
    'your', 'about', 'which', 'when', 'where',
    'will', 'would', 'could', 'does'
  ]);

  const pointsPerCriterion = 100 / task.evaluationCriteria.length;

  task.evaluationCriteria.forEach(criterion => {
    const criterionTokens = [
      ...new Set(criterion.toLowerCase().match(/[a-z0-9]+/g) ?? [])
    ].filter(token =>
      (token.length >= 3 || /^\d+$/.test(token)) &&
      !stopWords.has(token)
    );

    if (criterionTokens.length === 0) {
      unmatched.push(criterion);
      return;
    }

    const matchedCount = criterionTokens.filter(token =>
      outputTokens.has(token)
    ).length;

    const coverage = matchedCount / criterionTokens.length;

    // Award proportional points instead of full credit for a partial match.
    criteriaScore += pointsPerCriterion * coverage;

    if (coverage >= 0.6) {
      matched.push(criterion);
    } else {
      unmatched.push(criterion);
    }
  });

  const finalScore = Math.min(
    100,
    Math.max(0, Math.round(criteriaScore))
  );

  return formatEvaluationVerdict(finalScore, matched, unmatched);
}


/**
 * Formats score into structured verdict and descriptive feedback.
 */
function formatEvaluationVerdict(score: number, matched: string[], unmatched: string[]): EvaluationResult {
  let status: 'pass' | 'fail' | 'partial' = 'pass';
  let verdict: 'EXCELLENT' | 'SATISFACTORY' | 'SUBOPTIMAL' | 'FAILED' = 'SATISFACTORY';
  let feedback = '';

  if (score >= 90) {
    status = 'pass';
    verdict = 'EXCELLENT';
    feedback = `Exceptional adherence to rubric. Satisfied ${matched.length} key constraints: ${matched.slice(0, 2).join('; ')}.`;
  } else if (score >= 70) {
    status = 'pass';
    verdict = 'SATISFACTORY';
    feedback = `Passed primary criteria. Matched ${matched.length} checkpoints. Minor gaps on: ${unmatched[0] || 'subordinate details'}.`;
  } else if (score >= 45) {
    status = 'partial';
    verdict = 'SUBOPTIMAL';
    feedback = `Partial satisfaction (${score}%). Missed critical constraints: ${unmatched.slice(0, 2).join('; ')}.`;
  } else {
    status = 'fail';
    verdict = 'FAILED';
    feedback = `Failed evaluation criteria (${score}%). Missed essential benchmarks: ${unmatched.slice(0, 2).join('; ')}.`;
  }

  return {
    score,
    status,
    verdict,
    feedback,
    matchedCriteria: matched,
    unmatchedCriteria: unmatched
  };
}

/**
 * Main Evaluation Dispatcher: routes to task-category specific deterministic evaluator.
 * Fully modular so an AI judge can be appended or toggled.
 */
export function evaluateAgentOutput(
  output: string,
  task: BenchmarkTask
): EvaluationResult {
  if (!output || output.trim().length === 0) {
    return {
      score: 0,
      status: 'fail',
      verdict: 'FAILED',
      feedback: 'Agent produced an empty output response.',
      matchedCriteria: [],
      unmatchedCriteria: task.evaluationCriteria
    };
  }

  switch (task.category) {
    case 'extraction':
      return evaluateExtractionTask(output, task);
    case 'mathematics':
      return evaluateMathematicsTask(output, task);
    case 'reasoning':
      return evaluateReasoningTask(output, task);
    case 'planning':
      return evaluatePlanningTask(output, task);
    case 'code':
      return evaluateCodeTask(output, task);
    case 'research':
    default:
      return evaluateGenericRubricTask(output, task);
  }
}
