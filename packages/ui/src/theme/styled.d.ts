import "styled-components";
import type { TokenTheme } from "./tokens";

declare module "styled-components" {
  // Augment the DefaultTheme interface with our design tokens.
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface DefaultTheme extends TokenTheme { }
}
