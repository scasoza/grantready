# Grant Data Accuracy Log

This file tracks when each grant's requirements, eligibility criteria, amounts, and deadlines were last verified against official sources.

**IMPORTANT**: Review this file monthly. Grants change deadlines, amounts, and requirements regularly. Inaccurate data directly harms users.

## Verification Status

| # | Grant Name | Last Verified | Source Checked | Status | Notes |
|---|-----------|--------------|----------------|--------|-------|
| 1 | CACFP Meal Reimbursement | NOT VERIFIED | squaremeals.org | NEEDS REVIEW | Verify current rates, forms, eligibility |
| 2 | Child Care Services (CCS) Provider Enrollment | NOT VERIFIED | twc.texas.gov | NEEDS REVIEW | Verify enrollment process |
| 3 | Texas Rising Star Certification | NOT VERIFIED | texasrisingstar.org | NEEDS REVIEW | Verify star levels, requirements |
| 4 | Pre-K Partnership Grants | NOT VERIFIED | twc.texas.gov | NEEDS REVIEW | Verify amount, TRS requirement |
| 5 | FCCN Start-Up Mini-Grants | NOT VERIFIED | twc.texas.gov | NEEDS REVIEW | Verify amount, eligibility |
| 6 | Head Start / Early Head Start | NOT VERIFIED | eclkc.ohs.acf.hhs.gov | NEEDS REVIEW | Verify NOFO cycle |
| 7 | USDA Rural Dev - Community Facilities | NOT VERIFIED | rd.usda.gov | NEEDS REVIEW | Verify rural eligibility |
| 8 | TWC Skills for Small Business | NOT VERIFIED | twc.texas.gov | NEEDS REVIEW | Verify per-employee amounts |
| 9 | T3C Readiness Grants | NOT VERIFIED | twc.texas.gov | NEEDS REVIEW | Verify scope, eligibility |
| 10 | T.E.A.C.H. Early Childhood TX | NOT VERIFIED | texasaeyc.org | NEEDS REVIEW | Verify scholarship details |
| 11 | CDA Scholarship Program | NOT VERIFIED | workforce solutions regional | NEEDS REVIEW | Verify availability |
| 12 | Preschool Development Grant (PDG B-5) | NOT VERIFIED | acf.hhs.gov | NEEDS REVIEW | Verify state allocation |
| 13 | The Meadows Foundation | NOT VERIFIED | mfi.org | NEEDS REVIEW | Verify childcare funding |
| 14 | PNC Foundation - Grow Up Great | NOT VERIFIED | pnc.com | NEEDS REVIEW | Verify TX availability |
| 15 | The Powell Foundation | NOT VERIFIED | powellfoundation.org | NEEDS REVIEW | Verify focus areas |
| 16 | Sid Richardson Foundation | NOT VERIFIED | sidrichardson.org | NEEDS REVIEW | Verify eligibility |

## Verification Process

1. Visit the official source URL
2. Confirm: name, amount, deadline/cycle, eligibility criteria, application format
3. Update `src/lib/grants.ts` if anything changed
4. Update this log with the date and any notes
5. Commit changes

## Schedule

- **Monthly**: Quick check on deadlines and open/closed status
- **Quarterly**: Full review of all 16 grants against official sources
- **Immediately**: When a user reports inaccurate info
