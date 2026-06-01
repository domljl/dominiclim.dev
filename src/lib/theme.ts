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

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'theme';

const themeListeners = new Set<(dark: boolean) => void>();

export function getThemeColors(dark: boolean) {
    return dark ? THEME.dark : THEME.light;
}

function getSystemTheme(): ThemeMode {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function getStoredTheme(): ThemeMode | null {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    return null;
}

export function getTheme(): ThemeMode {
    return getStoredTheme() ?? getSystemTheme();
}

export function applyTheme(theme: ThemeMode) {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    document.documentElement.style.colorScheme = theme;
}

function notifyThemeListeners(dark: boolean) {
    for (const listener of themeListeners) {
        listener(dark);
    }
}

export function setTheme(theme: ThemeMode) {
    localStorage.setItem(STORAGE_KEY, theme);
    applyTheme(theme);
    notifyThemeListeners(theme === 'dark');
}

export function toggleTheme(): boolean {
    const nextTheme: ThemeMode = getTheme() === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    return nextTheme === 'dark';
}

export function subscribeToColorScheme(onChange: (dark: boolean) => void): () => void {
    onChange(getTheme() === 'dark');
    themeListeners.add(onChange);

    return () => {
        themeListeners.delete(onChange);
    };
}
export function initThemeFromDocument() {
    applyTheme(getTheme());
}

