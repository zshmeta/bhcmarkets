export type OnboardingStage = 'not_created' | 'no_payment_method' | 'no_funds' | 'ready';

export type ChainType = 'TRC20' | 'ERC20' | 'BEP20';

export type LedgerType =
  | 'DEPOSIT'
  | 'WITHDRAW_FREEZE'
  | 'WITHDRAW_COMPLETE'
  | 'WITHDRAW_REFUND'
  | 'ORDER_FREEZE'
  | 'ORDER_UNFREEZE'
  | 'FILL'
  | 'FEE';

export type LedgerFilter = 'all' | 'deposit' | 'withdraw' | 'trade' | 'fee';
