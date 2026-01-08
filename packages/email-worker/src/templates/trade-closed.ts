/**
 * Trade Closed Email Template
 */

import type { TradeClosedPayload, TemplateContext, RenderedEmail } from '../types';
import { wrapInBaseTemplate, createPlainTextWrapper, BaseTemplateConfig } from './base';

export function renderTradeClosed(
  context: TemplateContext,
  config: BaseTemplateConfig
): RenderedEmail {
  const payload = context.payload as TradeClosedPayload;
  const firstName = payload.firstName || 'Trader';
  const { symbol, side, quantity, openPrice, closePrice, orderId, closedAt, pnl, pnlPercentage } = payload;

  const sideClass = side === 'BUY' ? 'buy' : 'sell';
  const isProfitable = !pnl.startsWith('-');
  const pnlClass = isProfitable ? 'pnl-positive' : 'pnl-negative';
  const pnlEmoji = isProfitable ? '🎉' : '📊';
  const resultText = isProfitable ? 'Profit' : 'Loss';

  const subject = `Trade Closed: ${symbol} ${isProfitable ? '+' : ''}${pnl} (${pnlPercentage}) ${pnlEmoji}`;

  const htmlContent = `
    <h1>Trade Closed ${pnlEmoji}</h1>

    <p>Hi ${firstName},</p>

    <p>Your ${symbol} position has been closed.</p>

    <div style="text-align: center; margin: 20px 0;">
      <span class="trade-badge ${sideClass}">${side}</span>
      <span style="font-size: 24px; font-weight: 700; color: #18181b; margin-left: 12px;">${symbol}</span>
    </div>

    <div class="${isProfitable ? 'success-box' : 'warning-box'}" style="text-align: center;">
      <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">${resultText}</p>
      <p style="font-size: 28px; font-weight: 700; margin: 0;" class="${pnlClass}">${isProfitable ? '+' : ''}${pnl}</p>
      <p style="font-size: 16px; margin-top: 4px;" class="${pnlClass}">(${pnlPercentage})</p>
    </div>

    <table class="details-table">
      <tr>
        <td>Order ID</td>
        <td style="font-family: monospace; font-size: 12px;">${orderId}</td>
      </tr>
      <tr>
        <td>Symbol</td>
        <td><strong>${symbol}</strong></td>
      </tr>
      <tr>
        <td>Side</td>
        <td><span class="trade-badge ${sideClass}">${side}</span></td>
      </tr>
      <tr>
        <td>Quantity</td>
        <td>${quantity}</td>
      </tr>
      <tr>
        <td>Entry Price</td>
        <td>${openPrice}</td>
      </tr>
      <tr>
        <td>Exit Price</td>
        <td>${closePrice}</td>
      </tr>
      <tr>
        <td>Realized P&L</td>
        <td class="${pnlClass}"><strong>${isProfitable ? '+' : ''}${pnl}</strong> (${pnlPercentage})</td>
      </tr>
      <tr>
        <td>Closed At</td>
        <td>${closedAt}</td>
      </tr>
    </table>

    <p style="text-align: center;">
      <a href="${config.platformUrl}/history" class="btn">View Trade History</a>
    </p>
  `;

  const textContent = `Trade Closed ${pnlEmoji}

Hi ${firstName},

Your ${symbol} position has been closed.

${resultText.toUpperCase()}: ${isProfitable ? '+' : ''}${pnl} (${pnlPercentage})

TRADE DETAILS
-------------
Order ID: ${orderId}
Symbol: ${symbol}
Side: ${side}
Quantity: ${quantity}
Entry Price: ${openPrice}
Exit Price: ${closePrice}
Realized P&L: ${isProfitable ? '+' : ''}${pnl} (${pnlPercentage})
Closed At: ${closedAt}

View your trade history: ${config.platformUrl}/history`;

  return {
    subject,
    html: wrapInBaseTemplate(htmlContent, config),
    text: createPlainTextWrapper(textContent, config),
  };
}
