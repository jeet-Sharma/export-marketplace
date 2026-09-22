import { rootColorVariables } from './colors';

/**
 * Publishes the palette from `colors.js` as CSS custom properties.
 * Tailwind's colour utilities (registered in `globals.css`) point at these
 * variables, keeping every hex literal inside the theme module.
 * @returns {import('react').ReactElement}
 */
export default function ThemeStyles() {
  return <style dangerouslySetInnerHTML={{ __html: rootColorVariables }} />;
}
