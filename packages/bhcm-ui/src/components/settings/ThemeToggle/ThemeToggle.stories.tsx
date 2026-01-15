import type { Meta, StoryObj } from '@storybook/react';
import ThemeToggleView from './ThemeToggle.view';

const meta: Meta<typeof ThemeToggleView> = {
    title: 'Controls/ThemeToggle',
    component: ThemeToggleView,
    parameters: { layout: 'centered', backgrounds: { default: 'dark' } },
    tags: ['autodocs'],
    argTypes: { onToggle: { action: 'toggled' } },
};

export default meta;
type Story = StoryObj<typeof ThemeToggleView>;

export const Dark: Story = {
    args: { IconsName: 'sun', ariaLabel: 'Switch to light mode', },
};

export const Light: Story = {
    args: { IconsName: 'moon', ariaLabel: 'Switch to dark mode' },
};
