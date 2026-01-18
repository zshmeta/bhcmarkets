import { useEffect } from 'react';
import { Icons, IconsName } from '../../platform/components/layout/Icons';
import { Overlay, Sheet, Content, Header, Title, Message, Actions, ActionBtn, CancelBtn } from './MobileActionSheet.styles';

/**
 * MOBILE ACTION SHEET - iOS-style bottom action menu
 */

interface ActionSheetAction {
  id: string;
  label: string;
  Icons?: IconsName;
  destructive?: boolean;
  disabled?: boolean;
}

interface MobileActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  actions: ActionSheetAction[];
  onAction: (actionId: string) => void;
  showCancel?: boolean;
  cancelLabel?: string;
}

const MobileActionSheet = ({
  isOpen, onClose, title, message, actions, onAction, showCancel = true, cancelLabel = 'Cancel',
}: MobileActionSheetProps) => {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAction = (actionId: string) => { onAction(actionId); onClose(); };

  return (
    <>
      <Overlay onClick={onClose} />
      <Sheet>
        <Content>
          {(title || message) && (
            <Header>
              {title && <Title>{title}</Title>}
              {message && <Message>{message}</Message>}
            </Header>
          )}
          <Actions>
            {actions.map((action) => (
              <ActionBtn key={action.id} $destructive={action.destructive} onClick={() => handleAction(action.id)} disabled={action.disabled}>
                {action.Icons && <Icons name={action.Icons} size="md" />}
                <span>{action.label}</span>
              </ActionBtn>
            ))}
          </Actions>
        </Content>
        {showCancel && <CancelBtn onClick={onClose}>{cancelLabel}</CancelBtn>}
      </Sheet>
    </>
  );
}

export { MobileActionSheet };
