import type { Meta, StoryObj } from '@storybook/react';
import CategorizedSymbolSelector from './CategorizedSymbolSelector';
import type { Category } from './CategorizedSymbolSelector.types';

const mockCategories: Category[] = [
    {
        id: 'popular',
        label: 'Popular markets',
        items: [
            { id: '1', symbol: 'EURUSD', description: 'Euro vs US Dollar' },
            { id: '2', symbol: 'GBPUSD', description: 'Great Britain Pound vs US Dollar' },
            { id: '3', symbol: 'XAUUSD', description: 'Gold vs US Dollar' },
            { id: '4', symbol: 'US500', description: 'US SPX 500 Index' },
        ]
    },
    {
        id: 'metals',
        label: 'Metals',
        items: [
            { id: '5', symbol: 'XAUUSD', description: 'Gold' },
            { id: '6', symbol: 'XAGUSD', description: 'Silver' },
        ]
    },
    {
        id: 'energies',
        label: 'Energies',
        items: [
            { id: '7', symbol: 'XTIUSD', description: 'US Oil' },
            { id: '8', symbol: 'XBRUSD', description: 'UK Oil' },
            { id: '9', symbol: 'NAT.GAS', description: 'Natural Gas' },
        ]
    },
    {
        id: 'forex',
        label: 'Forex',
        items: [
            { id: '10', symbol: 'USDJPY', description: 'US Dollar vs Japenese Yen' },
            { id: '11', symbol: 'AUDUSD', description: 'Australian Dollar vs US Dollar' },
        ]
    },
    {
        id: 'indices',
        label: 'Indices',
        items: [
            { id: '12', symbol: 'US30', description: 'Wall Street 30' },
            { id: '13', symbol: 'GER40', description: 'Germany 40' },
        ]
    }
];

const meta: Meta<typeof CategorizedSymbolSelector> = {
    title: 'Trading/CategorizedSymbolSelector',
    component: CategorizedSymbolSelector,
    tags: ['autodocs'],
    parameters: {
        layout: 'centered',
    },
};

export default meta;
type Story = StoryObj<typeof CategorizedSymbolSelector>;

export const Default: Story = {
    args: {
        categories: mockCategories,
        selectedSymbol: 'EURUSD',
        onSelect: (symbol) => console.log('Selected:', symbol),
    },
    decorators: [(Story) => <div style={{ height: '400px', padding: '20px' }}><Story /></div>],
};
