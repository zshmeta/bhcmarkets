import { Icons } from '../Icons';
import { ToggleButton, LanguageText } from './LanguageToggle.styles';

export interface LanguageToggleViewProps {
    targetLanguage: string;
    label: string;
    onToggle: () => void;
}

const LanguageToggleView = ({ targetLanguage, label, onToggle }: LanguageToggleViewProps) => {
    return (
        <ToggleButton onClick={onToggle} title={label} aria-label={label}>
            <Icons name="globe" size="sm" />
            <LanguageText>{targetLanguage}</LanguageText>
        </ToggleButton>
    );
}

export { LanguageToggleView };
