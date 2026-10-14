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
    id: "pr-01-pay-date",
    input: "Kapan tanggal gaji dibayarkan setiap bulan?",
    expected: "Salaries are paid monthly on the 25th; if it falls on a weekend or holiday, the previous working day.",
    metadata: { pattern: "\\b25(th)?\\b" },
  },
  {
    id: "pr-02-thr-prorated",
    input: "I have worked here for 6 months. What is my THR (holiday bonus)?",
    expected: "Employees with 1 to 12 months of service get a prorated THR: (6 / 12) x monthly wage, which is half a month's wage.",
    metadata: { pattern: "(1/2|0[.,]5|half|setengah)" },
  },
  {
    id: "pr-03-thr-deadline",
    input: "How many days before my religious holiday must THR be paid?",
    expected: "No later than 7 days before the employee's religious holiday.",
    metadata: { pattern: "\\b7\\b" },
  },
  {
    id: "pr-04-sick-pay",
    input: "Saya sakit lama. Berapa persen gaji yang dibayar untuk 4 bulan pertama?",
    expected: "100% of wages for the first 4 months of sick leave, with a doctor's certificate.",
    metadata: { pattern: "100\\s?%" },
  },
  {
    id: "pr-05-jakarta-ump",
    input: "Berapa UMP Jakarta yang tercantum sebagai contoh di sistem?",
    expected: "The mock Jakarta UMP used in this prototype is IDR 5,396,761 per month.",
    metadata: { pattern: "5[.,]396[.,]761" },
  },
];

runEvalCli({
  name: "payroll",
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
