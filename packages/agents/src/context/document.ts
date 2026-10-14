import type { Document } from "@anvia/core";
import { companyPolicyDocuments } from "./company-policies";
import { indonesiaLaborRuleDocuments } from "./indonesia-labor-rules";

// Static context attached to every agent run.
export const staticContext: readonly Document[] = [
  ...companyPolicyDocuments,
  ...indonesiaLaborRuleDocuments,
];
