import { Grid } from 'antd';

/**
 * Breakpoint: antd `md` (≥ 768px).
 * Below `md` is considered mobile.
 */
export function useMobile(): boolean {
  const screens = Grid.useBreakpoint();
  return !screens.md;
}
