import React, { useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../../context/AuthContext';

const Container = styled.div`
  padding: 16px;
  color: ${({ theme }: any) => theme.colors.text.primary};
`;

const Title = styled.h3`
  margin: 0 0 12px 0;
  font-size: 14px;
  color: ${({ theme }: any) => theme.colors.text.primary};
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
`;

const SideButton = styled.button<{ $side: 'buy' | 'sell'; $active: boolean }>`
  flex: 1;
  padding: 8px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  background: ${({ theme, $side, $active }: any) =>
    $active
      ? ($side === 'buy' ? theme.colors.success : theme.colors.danger)
      : theme.colors.background.surface
  };
  color: ${({ theme, $active }: any) => $active ? theme.colors.text.onAccent : theme.colors.text.primary};
  opacity: ${({ $active }) => $active ? 1 : 0.7};
`;

const InputGroup = styled.div`
  margin-bottom: 12px;
`;

const Label = styled.div`
  font-size: 12px;
  color: ${({ theme }: any) => theme.colors.text.secondary};
  margin-bottom: 4px;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px;
  background: ${({ theme }: any) => theme.colors.background.surface};
  border: 1px solid ${({ theme }: any) => theme.colors.border};
  color: ${({ theme }: any) => theme.colors.text.primary};
  border-radius: 4px;
`;

const ActionButton = styled.button<{ $side: 'buy' | 'sell' }>`
  width: 100%;
  padding: 12px;
  border-radius: 4px;
  border: none;
  font-weight: bold;
  cursor: pointer;
  background: ${({ theme, $side }: any) => $side === 'buy' ? theme.colors.success : theme.colors.danger};
  color: ${({ theme }: any) => theme.colors.text.onAccent};

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// const ErrorMsg = styled.div`
//   color: ${({ theme }: any) => theme.colors.text.error || theme.colors.danger};
//   margin-top: 8px;
//   font-size: 12px;
// `;

interface OrderEntryPanelProps {
  symbol: string;
}

export const OrderEntryPanel: React.FC<OrderEntryPanelProps> = ({ symbol }) => {
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [qty, setQty] = useState('1.0');
  const [price, setPrice] = useState(''); // Empty for market
  const { user } = useAuth();

  // Order Engine runs on port 4003
  const orderEngineUrl = import.meta.env.VITE_ORDER_ENGINE_URL || 'http://localhost:4003';

  const handleSubmit = async () => {
    const token = localStorage.getItem('bhc_access_token');
    if (!token) {
      alert('Please login to place orders');
      return;
    }

    if (!user?.id) {
      alert('Missing user context; please login again');
      return;
    }

    try {
      const res = await fetch(`${orderEngineUrl}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          accountId: user.id, // Order engine expects accountId
          symbol,
          side,
          quantity: parseFloat(qty),
          price: price ? parseFloat(price) : undefined,
          type: price ? 'limit' : 'market',
          timeInForce: 'GTC'
        })
      });

      if (res.ok) {
        alert('Order placed successfully');
        setQty('1.0');
        setPrice('');
      } else {
        const err = await res.json();
        alert(`Order failed: ${err.error || 'Unknown error'}`);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to place order');
    }
  };

  return (
    <Container>
      <Title>Order Entry: {symbol}</Title>

      <ButtonGroup>
        <SideButton $side="buy" $active={side === 'buy'} onClick={() => setSide('buy')}>Buy</SideButton>
        <SideButton $side="sell" $active={side === 'sell'} onClick={() => setSide('sell')}>Sell</SideButton>
      </ButtonGroup>

      <InputGroup>
        <Label>Quantity</Label>
        <Input type="number" value={qty} onChange={e => setQty(e.target.value)} />
      </InputGroup>

      <InputGroup>
        <Label>Price (Optional for Limit)</Label>
        <Input type="number" placeholder="Market" value={price} onChange={e => setPrice(e.target.value)} />
      </InputGroup>

      <ActionButton $side={side} onClick={handleSubmit}>
        {side} {symbol}
      </ActionButton>
    </Container>
  );
};
