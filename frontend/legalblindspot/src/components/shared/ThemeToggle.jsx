import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className="sidebar-theme-toggle"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span className="nav-item-icon">
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </span>
      <span className="nav-item-label">{isDark ? 'Light mode' : 'Dark mode'}</span>
    </button>
  );
}
