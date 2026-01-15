import { useLanguageToggle } from './useLanguageToggle';
import { LanguageToggleView } from './LanguageToggle.view';

const LanguageToggle = () => {
    const props = useLanguageToggle();
    return <LanguageToggleView {...props} />;
}

export default LanguageToggle;
