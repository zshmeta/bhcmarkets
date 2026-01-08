/**
 * Trade Opened Email Template
 */

import type { TradeOpenedPayload, TemplateContext, RenderedEmail } from '../types';
import { wrapInBaseTemplate, createPlainTextWrapper, BaseTemplateConfig } from './base';

export function renderTradeOpened(
  context: TemplateContext,
  config: BaseTemplateConfig
): RenderedEmail {
  const payload = context.payload as TradeOpenedPayload;
  const firstName = payload.firstName || 'Trader';
  const { symbol, side, quantity, price, orderId, openedAt, leverage, stopLoss, takeProfit } = payload;

  const sideClass = side === 'BUY' ? 'buy' : 'sell';
  const sideEmoji = side === 'BUY' ? '📈' : '📉';

  const subject = `Trade Opened: ${side} ${symbol} @ ${price} ${sideEmoji}`;

  const htmlContent = `
    <h1>Trade Opened ${sideEmoji}</h1>

    <p>Hi ${firstName},</p>

    <p>Your trade has been executed successfully.</p>

    <div style="text-align: center; margin: 20px 0;">
      <span class="trade-badge ${sideClass}">${side}</span>
      <span style="font-size: 24px; font-weight: 700; color: #18181b; margin-left: 12px;">${symbol}</span>
    </div>

    <table class="details-table">
      <tr>
        <td>Order ID</td>
        <td style="font-family: monospace; font-size: 12px;">${orderId}</td>
      </tr>
      <tr>
        <td>Side</td>
        <td><span class="trade-badge ${sideClass}">${side}</span></td>
      </tr>
      <tr>
        <td>Symbol</td>
        <td><strong>${symbol}</strong></td>
      </tr>
      <tr>
        <td>Quantity</td>
        <td>${quantity}</td>
      </tr>
      <tr>
        <td>Entry Price</td>
        <td><strong>${price}</strong></td>
      </tr>
      ${leverage ? `
      <tr>
        <td>Leverage</td>
        <td>${leverage}x</td>
      </tr>
      ` : ''}
      ${stopLoss ? `
      <tr>
        <td>Stop Loss</td>
        <td style="color: #dc2626;">${stopLoss}</td>
      </tr>
      ` : ''}
      ${takeProfit ? `
      <tr>
        <td>Take Profit</td>
        <td style="color: #15803d;">${takeProfit}</td>
      </tr>
      ` : ''}
      <tr>
        <td>Opened At</td>
        <td>${openedAt}</td>
      </tr>
    </table>

    <p style="text-align: center;">
      <a href="${config.platformUrl}/positions" class="btn">View Position</a>
    </p>

    <div class="info-box">
      <p><strong>Tip:</strong> Monitor your positions regularly and consider setting stop-loss orders to manage risk.</p>
    </div>
  `;

  const textContent = `Trade Opened ${sideEmoji}

Hi ${firstName},

Your trade has been executed successfully.

TRADE DETAILS
-------------
Order ID: ${orderId}
Side: ${side}
Symbol: ${symbol}
Quantity: ${quantity}
Entry Price: ${price}
${leverage ? `Leverage: ${leverage}x\n` : ''}${stopLoss ? `Stop Loss: ${stopLoss}\n` : ''}${takeProfit ? `Take Profit: ${takeProfit}\n` : ''}Opened At: ${openedAt}

View your position: ${config.platformUrl}/positions

Tip: Monitor your positions regularly and consider setting stop-loss orders to manage risk.`;

  return {
    subject,
    html: wrapInBaseTemplate(htmlContent, config),
    text: createPlainTextWrapper(textContent, config),
  };
}
