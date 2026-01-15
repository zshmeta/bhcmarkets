import { useHelpFAQ } from './useHelpFAQ';
import { HelpFAQView } from './HelpFAQ.view';

const HelpFAQ = () => {
  const props = useHelpFAQ();
  return <HelpFAQView {...props} />;
}

export default HelpFAQ;
