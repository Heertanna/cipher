# 🧬 Decentralized Health Claims Protocol

A privacy-first, community-powered health insurance system where:
- Users remain anonymous (alias-based identity)
- Medical claims are evaluated by verified professionals (jury system)
- Funds are managed through pooled contributions
- Decisions are transparent, structured, and decentralized

---

## 🌐 Core Philosophy

- ❌ No real identity stored
- ✅ Alias-based participation
- ✅ Community-driven claim validation
- ✅ Transparent fund allocation
- ✅ Privacy-first medical data handling

---

## 🧱 Identity System

Each user is represented by:

```ts
type IdentityBlock = {
  alias: string
  passwordHash: string
  seedPhrase: string
}