import { Outfit, Urbanist } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { CartProvider } from '@/context/CartContext';
import { FavoritesProvider } from '@/context/FavoritesContext';
import { OrdersNotifyProvider } from '@/context/OrdersNotifyContext';
import { BranchProvider } from '@/context/BranchContext';
import { GuestInfoProvider } from '@/context/GuestInfoContext';
import BodyAdminSync from '@/components/BodyAdminSync';
import StaffBanner from '@/components/StaffBanner';
import Header from '@/components/Header';
import Tabbar from '@/components/Tabbar';
import AuthModal from '@/components/AuthModal';
import CartDrawer from '@/components/CartDrawer';
import FloatingCartButton from '@/components/FloatingCartButton';
import OrderNotifier from '@/components/OrderNotifier';
import GiftCardNotifier from '@/components/GiftCardNotifier';
import GiftReceivedNotifier from '@/components/GiftReceivedNotifier';
import OrderStatusNotifier from '@/components/OrderStatusNotifier';
import BranchGateWrapper from '@/components/BranchGateWrapper';

const outfit = Outfit({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--font-outfit', display: 'swap' });
const urbanist = Urbanist({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--font-urbanist', display: 'swap' });

export const metadata = {
  title: 'BBQ Meathouse — Ahumados y parrilla en Santiago',
  description: 'Carnes ahumadas low & slow, parrilla y buena mesa en Santiago de los Caballeros, República Dominicana.',
};

export const viewport = {
  themeColor: '#FBF8F2',
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${outfit.variable} ${urbanist.variable}`}>
      <body>
        <AuthProvider>
          <FavoritesProvider>
            <CartProvider>
              <ToastProvider>
                <OrdersNotifyProvider>
                  <BranchProvider>
                    <GuestInfoProvider>
                      <BodyAdminSync />
                      <StaffBanner />
                      <Header />
                      {children}
                      <Tabbar />
                      <FloatingCartButton />
                      <AuthModal />
                      <CartDrawer />
                      <OrderNotifier />
                      <GiftCardNotifier />
                      <GiftReceivedNotifier />
                      <OrderStatusNotifier />
                      <BranchGateWrapper />
                    </GuestInfoProvider>
                  </BranchProvider>
                </OrdersNotifyProvider>
              </ToastProvider>
            </CartProvider>
          </FavoritesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
