
```md
#  Protocol Design

## 1. Identity System

- Users create:
  - Alias
  - Password
  - Seed phrase

- No email or phone required  
- Real identity is never stored  

---

## 2. Document Processing

- User uploads medical documents
- System uses OCR to:
  - Detect name and address
  - Automatically redact them
- Only medical data is retained
- Data is linked to user alias

---

## 3. Premium System

### Tier Selection
- Basic
- Standard
- Premium

### Fund Distribution
- 80% → Active Claims Pool
- 20% → Insolvency Reserve

---

## 4. Premium Adjustment Logic

- If pool health < 20%:
  - Trigger "Solidarity Call"
  - All users contribute +5%

---

## 5. Payment System

### Options:
- Manual monthly payment  
  - If missed > 2 months → user removed
- Autopay  
  - User enters card details

---

## 6. Incentive System

- Complete 5 jury cases  
→ Get 10% discount on next premium

---

## 7. Claim Creation Flow

User submits:

- What happened (description)
- When it happened
- Status (ongoing / completed)
- Type:
  - Emergency
  - Planned
  - Ongoing condition
- Doctor consulted (Yes/No)
- Recommended treatment
- Cost:
  - Estimated / actual
  - Hospital name
- Upload reports/bills
- Financial situation (range)

---

## 8. Smart Contract Logic (Pre-check)

System evaluates:

- Is treatment common?
- Is it urgent?
- Is cost within expected range?
- Is there sufficient evidence?

### Outcome:
- Pass → Path A (fast track)
- Fail → Path B (jury evaluation)

---

## 9. Jury System

### Eligibility:
- Medical professionals only

### Onboarding:
1. Submit qualification documents
2. Verified via public registry
3. Pass a test
4. Solve practice cases

---

## 10. Juror Selection

- Randomly select 8–10 jurors
- Criteria:
  - Verified professionals
  - No conflict of interest
  - Different institutions

---

## 11. Anonymization Layer

Before jury review:
- Remove:
  - Name
  - Location
  - Gender (optional)

---

## 12. Case Evaluation Flow

### Stage-Based Reveal:

1. Symptoms  
2. Diagnosis  
3. Evidence  
4. Treatment options  
5. Cost  

After each stage:
- Juror completes survey
- Provides reasoning
- Adds confidence level

---

## 13. Final Decision

- Jurors submit verdict
- System aggregates responses
- Final claim decision is made

---

## 14. Re-evaluation Conditions

- Pool funds are low
- Juror confidence is low
- User disputes outcome

---

## 15. Dashboard

User can:
- View pool status
- Submit claims
- Track claim progress
- Become jurorlocal