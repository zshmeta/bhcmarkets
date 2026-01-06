┌─────────────────────────────────────────────────────────────────────────────┐
│                          ADMIN DOMAIN                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. USER MANAGEMENT                    2. RISK CONTROLS                     │
│     - List/search users                   - View house exposure             │
│     - View user details                   - Set symbol limits               │
│     - Suspend/unsuspend user              - Set user limits                 │
│     - Reset password                      - Activate circuit breaker        │
│     - Change user role                    - Kill switch (halt all trading)  │
│     - View user activity log              - View risk alerts                │
│                                                                             │
│  3. ACCOUNT OPERATIONS                 4. ORDER MANAGEMENT                  │
│     - View all accounts                   - View all orders                 │
│     - Manual deposit/credit               - Cancel any order                │
│     - Manual withdrawal/debit             - Force-close positions           │
│     - Freeze/unfreeze account             - View order book                 │
│     - View account history                                                  │
│                                                                             │
│  5. SYMBOL/MARKET MANAGEMENT           6. AUDIT & COMPLIANCE                │
│     - Enable/disable trading              - Admin action log                │
│     - Set trading hours                   - User activity reports           │
│     - Set fees/spreads                    - Financial reports               │
│     - Price feed status                   - Export data                     │
│                                                                             │
│  7. SYSTEM HEALTH                                                           │
│     - Service status                                                        │
│     - Database connections                                                  │
│     - Price feed latency                                                    │
│     - Matching engine stats                                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

Endpoint	Permission	Description
GET /admin/users	user:list	List users with stats
POST /admin/users/suspend	user:suspend	Suspend a user
POST /admin/users/unsuspend	user:unsuspend	Reactivate user
POST /admin/users/role	user:update_role	Change user role
GET /admin/accounts	account:list	List accounts
POST /admin/accounts/deposit	account:deposit	Admin deposit
POST /admin/accounts/withdraw	account:withdraw	Admin withdrawal
POST /admin/accounts/freeze	account:freeze	Freeze account
POST /admin/accounts/unfreeze	account:unfreeze	Unfreeze account
GET /admin/risk/dashboard	risk:read	Risk metrics
POST /admin/risk/circuit-breaker/activate	risk:circuit_breaker_activate	Halt trading
POST /admin/risk/circuit-breaker/deactivate	risk:circuit_breaker_deactivate	Resume trading
GET /admin/symbols	symbol:list	List trading pairs
POST /admin/symbols	symbol:create	Create/update symbol
POST /admin/symbols/enable	symbol:enable	Enable trading
POST /admin/symbols/disable	symbol:disable	Disable trading
GET /admin/audit	audit:read	View audit log
GET /admin/orders - List orders
GET /admin/orders/:id - Get order details
POST /admin/orders/cancel - Cancel single order
POST /admin/orders/cancel-all - Bulk cancel orders
GET /admin/positions - List positions
GET /admin/positions/:id - Get position details
POST /admin/positions/force-close - Force close position
GET /admin/reports/trading - Trading summary
GET /admin/reports/users - User activity
GET /admin/reports/pnl - Platform P&L
