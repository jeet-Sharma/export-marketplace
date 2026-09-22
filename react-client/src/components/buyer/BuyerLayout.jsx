import { CartProvider } from '@/lib/useCart';
import MobileNav from './MobileNav';
import Sidebar from './Sidebar';

/**
 * Buyer portal shell. Rendered by the root layout so the sidebar and the cart
 * store are mounted once and survive navigation.
 *
 * @param {object} props
 * @param {import('react').ReactNode} props.children
 * @returns {import('react').ReactElement}
 */
export default function BuyerLayout({ children }) {
  return (
    <CartProvider>
      <div className="flex min-h-screen bg-paper">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <MobileNav />
          <main className="flex-1 px-4 py-5 lg:px-6 lg:py-6">
            <div className="mx-auto w-full max-w-7xl space-y-5">{children}</div>
          </main>
        </div>
      </div>
    </CartProvider>
  );
}
