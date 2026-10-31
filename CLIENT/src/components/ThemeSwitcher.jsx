import { FiSun, FiMoon } from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';

const ThemeSwitcher = () => {
  const { toggleTheme, isDark } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className="p-2 rounded-xl text-gray-400 hover:text-white dark:hover:text-white hover:bg-white/10 dark:hover:bg-white/10 transition-all duration-200 cursor-pointer focus:outline-none border border-white/10 dark:border-white/10 bg-white/5 dark:bg-white/5 flex items-center justify-center shadow-sm"
      title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
      aria-label={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
    >
      {isDark ? (
        <FiSun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform duration-300" />
      ) : (
        <FiMoon className="w-4 h-4 text-indigo-500 hover:-rotate-12 transition-transform duration-300" />
      )}
    </button>
  );
};

export default ThemeSwitcher;
