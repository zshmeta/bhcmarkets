/**
 * Template Renderer
 * Central template rendering service
 */

import type {
  EmailType,
  TemplateContext,
  RenderedEmail,
  ITemplateRenderer,
  EmailWorkerEnv,
} from '../types';
import { BaseTemplateConfig } from './base';

// Import all template renderers
import { renderWelcome } from './welcome';
import { render2FA } from './2fa';
import { renderRegistrationConfirmation } from './registration-confirmation';
import { renderResetPassword } from './reset-password';
import { renderEmailChange } from './email-change';
import { renderWithdrawalProcessed } from './withdrawal-processed';
import { renderDepositConfirmation } from './deposit-confirmation';
import { renderTradeOpened } from './trade-opened';
import { renderTradeClosed } from './trade-closed';
import { renderNotification } from './notification';

/**
 * Template renderer factory
 */
export function createTemplateRenderer(env: EmailWorkerEnv): ITemplateRenderer {
  const config: BaseTemplateConfig = {
    platformName: env.PLATFORM_NAME || 'Trading Platform',
    platformUrl: env.PLATFORM_URL || 'https://platform.example.com',
    supportEmail: env.SUPPORT_EMAIL || 'support@example.com',
  };

  const renderers: Record<EmailType, (ctx: TemplateContext, cfg: BaseTemplateConfig) => RenderedEmail> = {
    welcome: renderWelcome,
    '2fa': render2FA,
    registration_confirmation: renderRegistrationConfirmation,
    reset_password: renderResetPassword,
    email_change: renderEmailChange,
    withdrawal_processed: renderWithdrawalProcessed,
    deposit_confirmation: renderDepositConfirmation,
    trade_opened: renderTradeOpened,
    trade_closed: renderTradeClosed,
    notification: renderNotification,
  };

  return {
    render(type: EmailType, context: TemplateContext): RenderedEmail {
      const renderer = renderers[type];
      if (!renderer) {
        throw new Error(`Unknown email type: ${type}`);
      }
      return renderer(context, config);
    },
  };
}

export type { BaseTemplateConfig };
