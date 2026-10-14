import type { Document } from "@anvia/core";

// MOCK DATA: simplified summary of common Indonesian labor rules.
// Based on UU 13/2003 (Ketenagakerjaan) as amended by UU 6/2023 (Cipta Kerja),
// and its implementing regulations (PP 35/2021, PP 36/2021).
// Rates, caps, and minimum wages change over time. Verify before relying on them.
export const indonesiaLaborRuleDocuments: readonly Document[] = [
  {
    id: "id-working-hours",
    text: `Statutory working hours: 7 hours per day and 40 hours per week for a six-day week, or 8 hours per day and 40 hours per week for a five-day week (UU 13/2003 Pasal 77). Overtime is limited to 4 hours per day and 18 hours per week (PP 35/2021). Overtime pay: the first hour at 1.5x the hourly wage, each further hour at 2x.`,
    additionalProps: { source: "indonesia-labor-rule", topic: "working-hours" },
  },
  {
    id: "id-annual-leave",
    text: `Annual leave: at least 12 working days after 12 months of continuous service (UU 13/2003 Pasal 79). Leave is paid.`,
    additionalProps: { source: "indonesia-labor-rule", topic: "leave" },
  },
  {
    id: "id-maternity-leave",
    text: `Maternity leave: 3 months in total, usually 1.5 months before and 1.5 months after the expected delivery date, with full wages paid (UU 13/2003 Pasal 82 and 84). Additional time may be granted based on a doctor's statement for complications.`,
    additionalProps: { source: "indonesia-labor-rule", topic: "leave" },
  },
  {
    id: "id-paternity-and-family-leave",
    text: `Paid leave for life events (UU 13/2003 Pasal 93): 2 days for the spouse's childbirth or miscarriage, 2 days for the baptism of the employee's child, 2 days for the circumcision of the employee's child, 2 days for the death of a spouse, parent, parent-in-law, child, or household member, and 3 days for the employee's own marriage.`,
    additionalProps: { source: "indonesia-labor-rule", topic: "leave" },
  },
  {
    id: "id-sick-leave",
    text: `Sick leave with pay: paid at 100% of wages for the first 4 months, 75% for the next 4 months, 50% for the next 4 months, and 25% afterwards, provided a doctor's certificate is given (UU 13/2003 Pasal 93).`,
    additionalProps: { source: "indonesia-labor-rule", topic: "leave" },
  },
  {
    id: "id-thr",
    text: `THR (religious holiday bonus): employees with at least 12 months of service receive one month's wage. Employees with 1 to 12 months of service receive a prorated amount: (months of service / 12) x monthly wage. Payment is due no later than 7 days before the employee's religious holiday (PP 36/2021).`,
    additionalProps: { source: "indonesia-labor-rule", topic: "payroll" },
  },
  {
    id: "id-minimum-wage",
    text: `Minimum wage: set each year by provincial and district governors (UMP and UMK). Employers must pay at least the minimum wage for the region. Mock example used in this prototype: Jakarta UMP IDR 5,396,761 per month. Verify the current year's figure.`,
    additionalProps: { source: "indonesia-labor-rule", topic: "payroll" },
  },
  {
    id: "id-bpjs-contributions",
    text: `BPJS contributions (approximate rates, verify current caps): JHT (old-age savings) employer 3.7%, employee 2%. JP (pension) employer 2%, employee 1%, with a salary cap. JKK (work accident) employer 0.24% to 1.74% depending on risk class. JKM (death benefit) employer 0.30%. BPJS Kesehatan (health) employer 4%, employee 1%, capped at a salary base of IDR 12,000,000.`,
    additionalProps: { source: "indonesia-labor-rule", topic: "benefits" },
  },
  {
    id: "id-probation",
    text: `Probation (masa percobaan): maximum 3 months, and the employee must be paid during probation at no less than the minimum wage (UU 13/2003 Pasal 60).`,
    additionalProps: { source: "indonesia-labor-rule", topic: "employment" },
  },
  {
    id: "id-fixed-term-contract",
    text: `Fixed-term contracts (PKWT): permitted only for specific work, seasonal work, or new products, and must be in writing (UU 13/2003 Pasal 59). Total duration including extensions is limited to 5 years (PP 35/2021). Employees on PKWT are entitled to compensation at the end of the contract.`,
    additionalProps: { source: "indonesia-labor-rule", topic: "employment" },
  },
  {
    id: "id-resignation-notice",
    text: `Resignation by the employee: notice of at least 30 days in writing (UU 13/2003 Pasal 162).`,
    additionalProps: { source: "indonesia-labor-rule", topic: "employment" },
  },
  {
    id: "id-severance",
    text: `Severance (uang pesangon) and service pay (uang penghargaan masa kerja) for termination are calculated under PP 35/2021, based on length of service and the last monthly wage. Termination must follow the legal process; this summary does not provide the formula.`,
    additionalProps: { source: "indonesia-labor-rule", topic: "employment" },
  },
  {
    id: "id-public-holidays",
    text: `Public holidays (libur nasional) are set by government decree each year. Employees who work on a public holiday must be paid overtime rates or receive a substitute day, as agreed with the employer.`,
    additionalProps: { source: "indonesia-labor-rule", topic: "leave" },
  },
];
