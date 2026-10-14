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
    id: "wt-01-office-hours",
    input: "Jam kerja kantor itu jam berapa sampai jam berapa?",
    expected: "Monday to Friday, 08:30 to 17:30, with a one-hour break from 12:00 to 13:00.",
    metadata: { pattern: "08[.:]30" },
  },
  {
    id: "wt-02-wfh-days",
    input: "How many days per week can I work from home?",
    expected: "Up to two days per week with manager approval.",
    metadata: { pattern: "\\b(2|two|dua)\\b" },
  },
  {
    id: "wt-03-overtime-limit",
    input: "Berapa jam lembur maksimal per hari menurut aturan?",
    expected: "Overtime is limited to 4 hours per day and 18 hours per week.",
    metadata: { pattern: "\\b4 (jam|hours?)\\b" },
  },
  {
    id: "wt-04-overtime-pay",
    input: "How much is overtime pay for the first hour of overtime?",
    expected: "The first hour of overtime is paid at 1.5x the hourly wage; each further hour at 2x.",
    metadata: { pattern: "1[.,]5" },
  },
  {
    id: "wt-05-statutory-week",
    input: "What is the statutory maximum number of working hours per week in Indonesia?",
    expected: "40 hours per week, either 7 hours a day over six days or 8 hours a day over five days.",
    metadata: { pattern: "\\b40\\b" },
  },
];

runEvalCli({
  name: "working-time",
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
