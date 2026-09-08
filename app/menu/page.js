import MenuCarta from '@/components/MenuCarta';

export const metadata = { title: 'Menú — BBQ Meathouse' };

export default function MenuPage() {
  return (
    <>
      <section className="menu-page-body" style={{ paddingTop: 28 }}>
        <div className="wrap">
          <MenuCarta />
        </div>
      </section>

      <footer>
        <div className="wrap footer-bottom" style={{ border: 'none', paddingTop: 0 }}>
          <span>© {new Date().getFullYear()} BBQ Meathouse. Todos los derechos reservados.</span>
          <span><a href="/">Volver al inicio</a></span>
        </div>
      </footer>
    </>
  );
}
