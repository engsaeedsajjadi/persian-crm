import { createTheme } from '@mui/material/styles';
import { faIR } from '@mui/material/locale';
import type { ThemeOptions } from '@mui/material/styles';
import { DEFAULT_PRIMARY_COLOR, isDefaultPrimaryColor, resolvePrimaryColor } from './primaryColor';

export { DEFAULT_PRIMARY_COLOR, resolvePrimaryColor } from './primaryColor';

const themeOptions: ThemeOptions = {
  direction: 'rtl',
  palette: {
    mode: 'light',
    primary: { main: '#2563eb', light: '#60a5fa', dark: '#1d4ed8' },
    secondary: { main: '#84cc16', light: '#a3e635', dark: '#65a30d' },
    background: { default: '#f3f5f9', paper: '#ffffff' },
    text: { primary: '#172033', secondary: '#68758b' },
    success: { main: '#16a36a' },
    warning: { main: '#e9a23b' },
    error: { main: '#e05252' },
    divider: '#e8ecf3',
  },
  typography: {
    fontFamily: ['Vazirmatn', 'Tahoma', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Arial', 'sans-serif'].join(','),
    h1: { fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.035em' },
    h2: { fontSize: '1.9rem', fontWeight: 800, letterSpacing: '-0.03em' },
    h3: { fontSize: '1.65rem', fontWeight: 750, letterSpacing: '-0.025em' },
    h4: { fontSize: '1.45rem', fontWeight: 750, letterSpacing: '-0.02em' },
    h5: { fontSize: '1.2rem', fontWeight: 700 },
    h6: { fontSize: '1rem', fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 650 },
  },
  shape: { borderRadius: 14 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        'html, body, #root': { minHeight: '100%', backgroundColor: '#f3f5f9' },
        body: { margin: 0, color: '#172033', direction: 'rtl', textRendering: 'optimizeLegibility' },
        '*': { boxSizing: 'border-box' },
        '::selection': { background: 'rgba(37,99,235,0.16)' },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 650, borderRadius: 10, boxShadow: 'none', minHeight: 38 },
        contained: { '&:hover': { boxShadow: '0 6px 16px rgba(37,99,235,0.16)' } },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { borderBottom: '1px solid #e8ecf3' } },
    },
    MuiDrawer: {
      styleOverrides: { paper: { borderColor: '#e8ecf3' } },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { border: '1px solid #e8ecf3', borderRadius: 16, boxShadow: '0 4px 18px rgba(20,35,65,0.035)', backgroundImage: 'none' } },
    },
    MuiPaper: {
      styleOverrides: { rounded: { borderRadius: 16 }, root: { backgroundImage: 'none' } },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: '#edf0f5', paddingTop: 12, paddingBottom: 12 },
        head: { fontWeight: 700, color: '#68758b', backgroundColor: '#f7f9fc', whiteSpace: 'nowrap' },
      },
    },
    MuiTableRow: { styleOverrides: { root: { '&:last-child td, &:last-child th': { borderBottom: 0 } } } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: 10, backgroundColor: '#fff', '& fieldset': { borderColor: '#e3e8f0' }, '&:hover fieldset': { borderColor: '#b8c5d8' } },
      },
    },
    MuiInputLabel: { styleOverrides: { root: { color: '#68758b' } } },
    MuiChip: { styleOverrides: { root: { borderRadius: 8, fontWeight: 600 } } },
    MuiTabs: { styleOverrides: { indicator: { height: 3, borderRadius: 3 } } },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 18 } } },
    MuiTooltip: { styleOverrides: { tooltip: { borderRadius: 8, fontSize: '0.75rem' } } },
  },
};

export const createAppTheme = (colour: string = DEFAULT_PRIMARY_COLOR) => {
  const main = resolvePrimaryColor(colour);
  const primary = isDefaultPrimaryColor(main)
    ? { main: DEFAULT_PRIMARY_COLOR, light: '#60a5fa', dark: '#1d4ed8' }
    : { main };
  return createTheme({ ...themeOptions, palette: { ...themeOptions.palette, primary } }, faIR);
};

export const theme = createAppTheme();

export const darkTheme = createTheme({
  ...themeOptions,
  palette: {
    ...themeOptions.palette,
    mode: 'dark',
    background: { default: '#121826', paper: '#1b2433' },
    text: { primary: '#f4f7fb', secondary: '#aab6c8' },
    primary: { main: '#90b4ff', light: '#b4ccff', dark: '#5d8df0' },
  },
}, faIR);
