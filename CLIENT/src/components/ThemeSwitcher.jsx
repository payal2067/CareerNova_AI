import React from 'react';
import { useTheme } from '../context/ThemeContext';

const themes = [
  { id: 'dark', label: 'Dark' },

];

const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-2">
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value)}
        className="appearance-none bg-white/5 border border-white/10 hover:border-indigo-500/50 text-gray-200 text-xs font-semibold rounded-xl px-3 py-1.5 outline-none transition-colors cursor-pointer"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
          backgroundPosition: 'right 0.5rem center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '1.5em 1.5em',
          paddingRight: '2rem'
        }}
      >
        {themes.map((t) => (
          <option key={t.id} value={t.id} className="bg-gray-900 text-gray-200">
            {t.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ThemeSwitcher;
