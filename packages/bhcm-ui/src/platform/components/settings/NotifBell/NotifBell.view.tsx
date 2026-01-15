import { Icons } from '../Icons';
import { ToggleButton, IconsWrapper } from './NotifBell.styles';

export interface NotifBellViewProps {
    enabled: boolean;
    title: string;
    ariaLabel: string;
    onToggle: () => void;
}

const NotifBellView = ({ enabled, title, ariaLabel, onToggle }: NotifBellViewProps) => {
    return (
        <ToggleButton $isActive={enabled} onClick={onToggle} title={title} aria-label={ariaLabel}>
            <IconsWrapper><Icons name="bell" size="md" /></IconsWrapper>
        </ToggleButton>
    );
}

export default NotifBellView;
