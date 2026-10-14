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
    id: "lv-01-annual-leave",
    input: "How many annual leave days do I get per year?",
    expected: "14 working days per calendar year, available after 12 months of continuous service.",
    metadata: { pattern: "\\b14\\b" },
  },
  {
    id: "lv-02-carry-over",
    input: "Berapa hari cuti yang bisa saya bawa ke tahun depan?",
    expected: "Up to 6 days can be carried over, and they must be used by 31 March.",
    metadata: { pattern: "\\b6\\b" },
  },
  {
    id: "lv-03-leave-notice",
    input: "How many working days in advance must I submit a leave request?",
    expected: "At least 3 working days in advance, except for emergencies.",
    metadata: { pattern: "\\b3\\b" },
  },
  {
    id: "lv-04-maternity-leave",
    input: "Berapa lama cuti melahirkan menurut UU ketenagakerjaan?",
    expected: "3 months in total, usually 1.5 months before and 1.5 months after delivery, paid at full wages.",
    metadata: { pattern: "\\b3 (bulan|months?)\\b" },
  },
  {
    id: "lv-05-statutory-annual-leave",
    input: "What is the statutory minimum annual leave under Indonesian law?",
    expected: "At least 12 working days after 12 months of continuous service.",
    metadata: { pattern: "\\b12\\b" },
  },
];

runEvalCli({
  name: "leave",
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
