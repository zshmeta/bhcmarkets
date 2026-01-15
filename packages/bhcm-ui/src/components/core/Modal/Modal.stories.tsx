import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Modal, ModalProps } from './Modal';
import styled from 'styled-components';

/* ═══════════════════════════════════════════════════════════
 * MODAL STORYBOOK STORIES
 * ═══════════════════════════════════════════════════════════
 */

const meta: Meta<typeof Modal> = {
    title: 'Primitives/Modal',
    component: Modal,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Reusable modal/drawer primitive with overlay, escape key handling, and scroll lock.',
            },
        },
    },
    argTypes: {
        variant: {
            control: 'radio',
            options: ['modal', 'drawer'],
        },
        isOpen: { control: 'boolean' },
        showCloseButton: { control: 'boolean' },
        closeOnOverlayClick: { control: 'boolean' },
        closeOnEscape: { control: 'boolean' },
    },
};

export default meta;
type Story = StoryObj<typeof Modal>;

/* ─── Trigger Button (for demo) ─── */
const TriggerButton = styled.button`
  padding: 12px 24px;
  background: var(--color-accent, #58A6FF);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  &:hover { opacity: 0.9; }
`;

const FooterButton = styled.button<{ $primary?: boolean }>`
  padding: 8px 16px;
  background: ${p => p.$primary ? 'var(--color-accent, #58A6FF)' : 'transparent'};
  color: ${p => p.$primary ? 'white' : 'var(--text-secondary, #9AA5B1)'};
  border: 1px solid ${p => p.$primary ? 'transparent' : 'var(--border, #30363D)'};
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  &:hover { opacity: 0.9; }
`;

const DemoContent = styled.div`
  color: var(--text-secondary, #9AA5B1);
  font-size: 14px;
  line-height: 1.6;
  p { margin-bottom: 12px; }
`;

/* ─── Interactive Wrapper ─── */
const ModalDemo = (props: Partial<ModalProps> & { triggerLabel?: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <>
            <TriggerButton onClick={() => setIsOpen(true)}>
                {props.triggerLabel || 'Open Modal'}
            </TriggerButton>
            <Modal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                title="Modal Title"
                {...props}
            >
                <DemoContent>
                    <p>This is modal content. It can contain any React components.</p>
                    <p>Click the overlay, press Escape, or click the close button to dismiss.</p>
                </DemoContent>
            </Modal>
        </>
    );
};

/* ─── Stories ─── */

export const Default: Story = {
    render: () => <ModalDemo />,
};

export const DrawerVariant: Story = {
    render: () => (
        <ModalDemo
            variant="drawer"
            title="Drawer Panel"
            triggerLabel="Open Drawer"
        />
    ),
};

export const WithFooter: Story = {
    render: () => {
        const [isOpen, setIsOpen] = useState(false);
        return (
            <>
                <TriggerButton onClick={() => setIsOpen(true)}>
                    Open with Footer
                </TriggerButton>
                <Modal
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                    title="Confirm Action"
                    footer={
                        <>
                            <FooterButton onClick={() => setIsOpen(false)}>Cancel</FooterButton>
                            <FooterButton $primary onClick={() => setIsOpen(false)}>Confirm</FooterButton>
                        </>
                    }
                >
                    <DemoContent>
                        <p>Are you sure you want to proceed with this action?</p>
                    </DemoContent>
                </Modal>
            </>
        );
    },
};

export const NoCloseButton: Story = {
    render: () => (
        <ModalDemo
            showCloseButton={false}
            title="No Close Button"
            triggerLabel="Open (no X button)"
        />
    ),
};

export const DisableOverlayClose: Story = {
    render: () => (
        <ModalDemo
            closeOnOverlayClick={false}
            title="Overlay Click Disabled"
            triggerLabel="Open (overlay click disabled)"
        />
    ),
};

export const LongContent: Story = {
    render: () => {
        const [isOpen, setIsOpen] = useState(false);
        return (
            <>
                <TriggerButton onClick={() => setIsOpen(true)}>
                    Open with Long Content
                </TriggerButton>
                <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Scrollable Content">
                    <DemoContent>
                        {Array.from({ length: 20 }, (_, i) => (
                            <p key={i}>
                                Paragraph {i + 1}: Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                                Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                            </p>
                        ))}
                    </DemoContent>
                </Modal>
            </>
        );
    },
};

export const CustomTitle: Story = {
    render: () => (
        <ModalDemo
            title={<><span>🔧</span> Settings</>}
            triggerLabel="Open with Custom Title"
        />
    ),
};
