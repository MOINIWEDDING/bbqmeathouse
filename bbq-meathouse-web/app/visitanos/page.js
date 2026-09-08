import EditablePhoto from '@/components/EditablePhoto';
import Reveal from '@/components/Reveal';

export const metadata = { title: 'Visítanos — BBQ Meathouse' };

export default function VisitanosPage() {
  return (
    <>
      <section className="visitanos" id="visitanos" style={{ paddingTop: 28 }}>
        <div className="wrap visit-grid">
          <Reveal>
            <EditablePhoto imgKey="map" label="Mapa / fachada" className="map-ph" />
          </Reveal>
          <Reveal delay={0.1}>
            <p className="eyebrow">Visítanos</p>
            <h2 style={{ fontSize: 26, marginTop: 10 }}>Te esperamos en la Ciudad Corazón.</h2>
            <div className="info-list">
              <div className="info-row">
                <div className="ic"><svg className="icon" viewBox="0 0 24 24"><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.3" /></svg></div>
                <div><b>Dirección</b><span>[Calle y número] · Santiago de los Caballeros</span></div>
              </div>
              <div className="info-row">
                <div className="ic"><svg className="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg></div>
                <div><b>Horario</b><span>Lun – Vie · 8:00 am – 9:00 pm<br />Sáb – Dom · 9:00 am – 11:00 pm</span></div>
              </div>
              <div className="info-row">
                <div className="ic"><svg className="icon" viewBox="0 0 24 24"><path d="M6 3h3l1.5 4-2 1.5a13 13 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4 6.2 2 2 0 0 1 6 3z" /></svg></div>
                <div><b>Reservas y eventos</b><span>[Tu número de teléfono]</span></div>
              </div>
            </div>
            <div className="social-row">
              <a href="#" aria-label="Instagram"><svg className="icon" viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="17" height="17" rx="4.5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r="1" /></svg></a>
              <a href="#" aria-label="Facebook"><svg className="icon" viewBox="0 0 24 24"><path d="M14 21v-7h2.4l.4-3H14V9c0-.9.3-1.5 1.7-1.5H17V4.8C16.6 4.7 15.6 4.6 14.4 4.6c-2.5 0-4.2 1.5-4.2 4.3V11H7.7v3H10.2v7z" /></svg></a>
            </div>
          </Reveal>
        </div>
      </section>

      <footer>
        <div className="wrap">
          <div className="footer-grid">
            <div>
              <div className="logo" style={{ color: 'var(--cream-on-dark)' }}><span className="dot" />BBQ Meathouse</div>
              <span style={{ marginTop: 10 }}>Carnes ahumadas y parrilla en Santiago de los Caballeros.</span>
            </div>
            <div>
              <h5>Contacto</h5>
              <span>[Calle y número], Santiago</span>
              <span>[Tu número de teléfono]</span>
            </div>
            <div>
              <h5>Horario</h5>
              <span>Lun – Vie · 8am – 9pm</span>
              <span>Sáb – Dom · 9am – 11pm</span>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} BBQ Meathouse.</span>
            <span>Santiago de los Caballeros, RD.</span>
          </div>
        </div>
      </footer>
    </>
  );
}
