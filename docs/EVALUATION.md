# Evaluation contract

The synthetic Atlas suite freezes outcomes before compiler changes.

| Property | Expected |
| --- | --- |
| Primary decision retrieval | exact target present |
| Failed predecessor | incident and supersession chain present |
| Primary vs generated summary | primary records win |
| Unsupported query | zero selected memories |
| Cross-scope request | denied before retrieval |
| Same state + same query | identical packet fingerprint |
| Snapshot restore | identical packet after compaction |
| Cross-scope edge | rejected |

Production evaluation should add:

- exact-receipt questions with frozen source IDs;
- broad chronology questions with date ranges;
- exact needles inside long history;
- contradiction and supersession cases;
- latency percentiles, not only averages;
- cold and warm embedding measurements;
- corrupt ciphertext and stale-vector tests;
- archive reconciliation below the admission cursor.
