import type { Document } from "@anvia/core";

// MOCK DATA: fictional company policies for PT Maju Jaya Sakti.
export const companyPolicyDocuments: readonly Document[] = [
  {
    id: "company-profile",
    text: `PT Maju Jaya Sakti is a fictional company used for this prototype. Head office: Jakarta Selatan, Indonesia. Employees are on permanent (PKWTT) or fixed-term (PKWT) contracts.`,
    additionalProps: { source: "company-policy", topic: "profile" },
  },
  {
    id: "company-working-hours",
    text: `Working hours: Monday to Friday, 08:30 to 17:30, with a one-hour break from 12:00 to 13:00 (40 hours per week). Employees may work from home up to two days per week with manager approval. Overtime requires written approval from the manager and is paid according to the Indonesian labor rules.`,
    additionalProps: { source: "company-policy", topic: "working-hours" },
  },
  {
    id: "company-annual-leave",
    text: `Annual leave: 14 working days per calendar year, available after 12 months of continuous service. Unused leave can be carried over to the next year up to a maximum of 6 days and must be used by 31 March. Leave requests must be submitted in the HR system at least 3 working days in advance, except for emergencies.`,
    additionalProps: { source: "company-policy", topic: "leave" },
  },
  {
    id: "company-sick-leave",
    text: `Sick leave: employees must notify their manager before 09:00 on the first day. A doctor's certificate is required for sick leave longer than 2 consecutive working days. Sick leave is paid according to the Indonesian labor rules.`,
    additionalProps: { source: "company-policy", topic: "leave" },
  },
  {
    id: "company-payroll",
    text: `Payroll: salaries are paid monthly on the 25th. If the 25th falls on a weekend or public holiday, payment is made on the previous working day. Payslips are available in the HR system. THR (holiday bonus) is paid according to the Indonesian labor rules, no later than 7 days before the employee's religious holiday.`,
    additionalProps: { source: "company-policy", topic: "payroll" },
  },
  {
    id: "company-benefits",
    text: `Benefits: BPJS Kesehatan and BPJS Ketenagakerjaan are provided for all employees. Outpatient medical reimbursement up to IDR 2,000,000 per year (mock limit). Expense claims must be submitted within 30 days of the expense date with receipts.`,
    additionalProps: { source: "company-policy", topic: "benefits" },
  },
  {
    id: "company-probation",
    text: `Probation: 3 months for new permanent employees, with a performance review in week 8 and at the end of probation. Probation may be extended only once and never beyond the legal maximum.`,
    additionalProps: { source: "company-policy", topic: "employment" },
  },
  {
    id: "company-resignation",
    text: `Resignation: employees must give at least 30 days' written notice to their manager and HR. Exit interview and handover checklist are required before the last working day.`,
    additionalProps: { source: "company-policy", topic: "employment" },
  },
  {
    id: "company-contact",
    text: `HR contact: hr@majujayasakti.example. HR office hours: Monday to Friday, 09:00 to 17:00. For urgent payroll issues, contact the HR lead on Slack #hr-help.`,
    additionalProps: { source: "company-policy", topic: "contact" },
  },
];
