export const THEME = {
    light: {
        bgCss: '#fdf7c3',
        textCss: '#f0485f',
        bg: 0xfdf7c3,
        text: 0xf0485f
    },
    dark: {
        bgCss: '#02182b',
        textCss: '#d7263d',
        bg: 0x02182b,
        text: 0xd7263d
    }
} as const;

export function getThemeColors(dark: boolean) {
    return dark ? THEME.dark : THEME.light;
}

export function subscribeToColorScheme(onChange: (dark: boolean) => void): () => void {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    onChange(query.matches);

    const handler = (event: MediaQueryListEvent) => onChange(event.matches);
    query.addEventListener('change', handler);
    return () => query.removeEventListener('change', handler);
}
