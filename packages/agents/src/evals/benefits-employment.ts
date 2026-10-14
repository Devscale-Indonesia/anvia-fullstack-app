import { answerRelevancy, contains, gEval, runEvalCli } from "@anvia/core/evals";
import { runAgent } from "../agent";
import { getLens } from "../lens";
import { getModel } from "../models";

// The judge model, used by the two LLM metrics (correctness and answer_relevancy).
const model = getModel();

// Each case has:
// - input: the question
// - expected: the correct answer (the judge compares against this)
// - metadata.pattern: a regex, as text, that the answer must match
const cases = [
  {
    id: "be-01-bpjs-kesehatan",
    input: "Berapa persen iuran BPJS Kesehatan yang ditanggung perusahaan?",
    expected: "The employer pays 4% and the employee pays 1%, capped at a salary base of IDR 12,000,000.",
    metadata: { pattern: "\\b4\\s?%" },
  },
  {
    id: "be-02-jht-rate",
    input: "What is the employer's JHT contribution rate?",
    expected: "The employer contributes 3.7% to JHT, and the employee contributes 2%.",
    metadata: { pattern: "3[.,]7\\s?%" },
  },
  {
    id: "be-03-medical-limit",
    input: "What is the outpatient medical reimbursement limit per year?",
    expected: "IDR 2,000,000 per year (mock limit).",
    metadata: { pattern: "2[.,]000[.,]000" },
  },
  {
    id: "be-04-probation",
    input: "How long is the probation period for new permanent employees?",
    expected: "3 months, with a performance review in week 8 and at the end of probation.",
    metadata: { pattern: "\\b3 (months?|bulan)\\b" },
  },
  {
    id: "be-05-resignation-notice",
    input: "How much notice do I have to give if I want to resign?",
    expected: "At least 30 days' written notice to the manager and HR.",
    metadata: { pattern: "\\b30\\b" },
  },
];

runEvalCli({
  name: "benefits-employment",
  cases,
  // Target: the thing we test. Sends the question to our agent and returns its answer.
  target: (input: string) => runAgent({ messages: [{ role: "user", content: input }] }).text,
  // Lens reporter: sends each eval result to Lens, linked to the agent trace.
  reporters: [getLens().evalReporter({ includePayloads: true })],
  metrics: [
    // correctness: the judge compares the answer with `expected`, using the rubric.
    // Score 0-10 is normalized to 0-1. Passes at 0.7.
    gEval({
      name: "correctness",
      model,
      evaluationParams: ["input", "actualOutput", "expectedOutput"],
      criteria:
        "Judge whether the actual output gives the same key facts and numbers as the expected output. Ignore wording and language differences (Indonesian or English). A wrong or missing number is a failure.",
      rubric: [
        { scoreRange: [0, 3], expectedOutcome: "Wrong, or the key number or fact is missing." },
        { scoreRange: [4, 6], expectedOutcome: "Right topic, but the key number is incomplete or unclear." },
        { scoreRange: [7, 10], expectedOutcome: "Gives the same key number and fact as the expected output." },
      ],
      threshold: 0.7,
    }),

    // answer_relevancy: the judge checks whether the answer addresses the question.
    answerRelevancy({
      name: "answer_relevancy",
      model,
      threshold: 0.7,
    }),

    // contains_numbers: plain regex check, no LLM. Builds a RegExp from metadata.pattern.
    contains({
      name: "contains_numbers",
      expected: (args) => new RegExp(String(args.case.metadata?.pattern), "i"),
    }),
  ],
});
