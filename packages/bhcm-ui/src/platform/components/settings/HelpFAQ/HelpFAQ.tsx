import {useHelpFAQ} from './useHelpFAQ';
import {HelpFAQView} from './HelpFAQ.view';

import type { UseHelpFAQOptions } from './useHelpFAQ';

export type HelpFAQProps = UseHelpFAQOptions;

const HelpFAQ = (props: HelpFAQProps) => {
  const hookData = useHelpFAQ(props);
  const { items, shortcuts, ...viewProps } = hookData;
  // Pass both to keep view backward-compatible.
  return <HelpFAQView {...viewProps} items={items} shortcuts={shortcuts} />;
}

export { HelpFAQ };
