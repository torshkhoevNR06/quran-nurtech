# Mobile overlay audit

Base: http://127.0.0.1:4331
Viewport: 390x664 iPhone-like
Checks: 6
Failures: 0

- PASS drawer uses internal scroll and locks body
- PASS settings has internal scroll and no overflow
- PASS image editor is mobile sheet and locks body
- PASS image editor restores scroll lock on close
- PASS mushaf ayah sheet locks body and fits viewport
- PASS player visible without horizontal overflow
