/* Lógica compartida entre index.html y menu.html:
   - sesión / perfil (rol cliente vs. comensal·dueño)
   - encabezado (login, chip de usuario, banner de modo staff)
   - modal de inicio de sesión / registro
   - edición de imágenes de sitio (site_images) para las fotos placeholder
   - animación de aparición al hacer scroll
*/
(function(){
  const $ = (s,el=document)=>el.querySelector(s);
  const $$ = (s,el=document)=>Array.from(el.querySelectorAll(s));

  window.Barro = window.Barro || {};
  let profile = null; // {id, name, role}

  // Fotos de stock (Unsplash, licencia libre) usadas como relleno visual mientras
  // el dueño no conecta Supabase o no sube fotos reales del local.
  const DEFAULT_IMAGES = {
    'hero':       'https://images.unsplash.com/photo-1758900450186-e829f72d25fb?q=80&w=1000&auto=format&fit=crop',
    'founder':    'https://images.unsplash.com/photo-1758593386033-cb1f842d550c?q=80&w=1000&auto=format&fit=crop',
    'azotea':     'https://images.unsplash.com/photo-1747269843293-6a2e25b068e3?q=80&w=1200&auto=format&fit=crop',
    'gallery-0':  'https://images.unsplash.com/photo-1681112035110-105b148f0a9a?q=80&w=900&auto=format&fit=crop',
    'gallery-1':  'https://images.unsplash.com/photo-1758945185175-3d54780cd8d0?q=80&w=900&auto=format&fit=crop',
    'gallery-2':  'https://images.unsplash.com/photo-1712265964629-6cb2c90f9e48?q=80&w=900&auto=format&fit=crop',
  };
  window.Barro.DEFAULT_IMAGES = DEFAULT_IMAGES;

  function isStaff(){ return !!profile && profile.role === 'staff'; }
  window.Barro.isStaff = isStaff;
  window.Barro.getProfile = ()=> profile;

  if(!window.BARRO_CONFIGURED){
    console.warn('BBQ Meathouse: falta configurar Supabase en js/supabase-client.js (SUPABASE_URL / SUPABASE_ANON_KEY). Mostrando fotos de muestra.');
  }

  /* ---------------- session ---------------- */
  async function refreshProfile(){
    if(!window.BARRO_CONFIGURED) return;
    const { data:{ session } } = await sb.auth.getSession();
    if(!session){ profile = null; onAuthChange(); return; }
    const { data, error } = await sb.from('profiles').select('*').eq('id', session.user.id).single();
    if(error || !data){
      profile = { id: session.user.id, name: session.user.email, role: 'cliente' };
    } else {
      profile = data;
    }
    onAuthChange();
  }

  function onAuthChange(){
    document.body.classList.toggle('admin-on', isStaff());
    renderNavAuth();
    document.dispatchEvent(new CustomEvent('barro:auth-changed'));
  }

  function initials(name){
    return (name||'?').trim().split(/\s+/).slice(0,2).map(w=>w[0].toUpperCase()).join('');
  }

  function renderNavAuth(){
    const el = $('#navAuthArea');
    if(!el) return;
    if(!profile){
      el.innerHTML = `<button class="btn btn-amber btn-sm" id="openLogin"><svg class="icon"><use href="#ic-user"/></svg>Iniciar sesión</button>`;
      $('#openLogin').addEventListener('click', ()=>openAuth('login','cliente'));
      return;
    }
    const roleLabel = profile.role === 'staff' ? 'Comensal · Dueño' : 'Cliente';
    el.innerHTML = `
      <div class="user-chip">
        <div class="av">${initials(profile.name)}</div>
        <div>${profile.name}</div>
        <span class="role-tag">${roleLabel}</span>
      </div>
      <button class="btn btn-ghost btn-sm" id="logoutBtn">Salir</button>`;
    $('#logoutBtn').addEventListener('click', async ()=>{
      await sb.auth.signOut();
      profile = null; onAuthChange();
    });
  }

  /* ---------------- auth modal ---------------- */
  let authMode = 'login', authRole = 'cliente';

  function openAuth(mode, role){
    authMode = mode; authRole = role;
    const ov = $('#authOverlay'); if(!ov) return;
    ov.classList.add('show');
    updateAuthUI();
  }
  window.Barro.openAuth = openAuth;

  function closeAuth(){
    const ov = $('#authOverlay'); if(!ov) return;
    ov.classList.remove('show');
    $('#authMsg').classList.remove('show');
    $('#authForm').reset();
  }

  function updateAuthUI(){
    const ov = $('#authOverlay'); if(!ov) return;
    $$('.role-switch [data-role]', ov).forEach(b=>b.classList.toggle('active', b.dataset.role===authRole));
    const login = authMode==='login';
    $('#authTitle').textContent = login ? 'Inicia sesión' : 'Crea tu cuenta';
    $('#authSub').textContent = authRole==='staff'
      ? 'Acceso para el personal y dueños de la cafetería. Podrás editar el menú y las fotos del sitio.'
      : 'Entra como cliente para guardar tus preferencias y pedidos.';
    $('#authSubmit').textContent = login ? 'Iniciar sesión' : 'Crear cuenta';
    $('#switchText').textContent = login ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?';
    $('#switchBtn').textContent = login ? 'Crear una' : 'Iniciar sesión';
    $('#fieldName').style.display = login ? 'none' : 'block';
    $('#authName').required = !login;
  }

  function wireAuthModal(){
    const ov = $('#authOverlay'); if(!ov) return;
    $$('.role-switch [data-role]', ov).forEach(b=>b.addEventListener('click', ()=>{ authRole=b.dataset.role; updateAuthUI(); }));
    $('#switchBtn').addEventListener('click', ()=>{ authMode = authMode==='login' ? 'signup' : 'login'; updateAuthUI(); });

    $('#authForm').addEventListener('submit', async (e)=>{
      e.preventDefault();
      const msg = $('#authMsg'); msg.className='form-msg';
      if(!window.BARRO_CONFIGURED){
        msg.textContent = 'Falta conectar Supabase: edita js/supabase-client.js con la URL y la anon key de tu proyecto.';
        msg.classList.add('show','error'); return;
      }
      const email = $('#authEmail').value.trim().toLowerCase();
      const pass = $('#authPass').value;
      const name = $('#authName').value.trim();

      $('#authSubmit').disabled = true;
      try{
        if(authMode==='login'){
          const { error } = await sb.auth.signInWithPassword({ email, password: pass });
          if(error){ msg.textContent = 'Correo o contraseña incorrectos.'; msg.classList.add('show','error'); return; }
        } else {
          if(!name){ msg.textContent = 'Escribe tu nombre.'; msg.classList.add('show','error'); return; }
          const { data, error } = await sb.auth.signUp({
            email, password: pass,
            options:{ data: { name, role: authRole } }
          });
          if(error){ msg.textContent = error.message; msg.classList.add('show','error'); return; }
          if(data.session === null){
            msg.textContent = 'Cuenta creada. Revisa tu correo para confirmar antes de iniciar sesión.';
            msg.classList.add('show','ok');
            setTimeout(closeAuth, 2200);
            return;
          }
        }
        await refreshProfile();
        closeAuth();
      } finally {
        $('#authSubmit').disabled = false;
      }
    });
  }

  /* ---------------- site image placeholders (site_images table) ---------------- */
  let editingImgKey = null;

  function applyImage(ph, url){
    const existing = ph.querySelector('img.real');
    if(url){
      if(!existing){ const img=document.createElement('img'); img.className='real'; img.src=url; img.alt=''; ph.prepend(img); }
      else existing.src = url;
      ph.querySelectorAll('.ph-icon,.ph-label').forEach(n=>n.style.display='none');
    } else if(existing){
      existing.remove();
      ph.querySelectorAll('.ph-icon,.ph-label').forEach(n=>n.style.display='');
    }
  }

  async function loadSiteImages(){
    const nodes = $$('.ph[data-img-key]');
    if(!nodes.length) return;

    if(!window.BARRO_CONFIGURED){
      nodes.forEach(ph=> applyImage(ph, DEFAULT_IMAGES[ph.dataset.imgKey] || ''));
      return;
    }
    const { data, error } = await sb.from('site_images').select('*');
    const map = {};
    if(!error && data) data.forEach(r=>map[r.key]=r.url);
    nodes.forEach(ph=>{
      const key = ph.dataset.imgKey;
      const url = map[key] || DEFAULT_IMAGES[key] || '';
      applyImage(ph, url);
    });
  }

  function openImageModal(key){
    editingImgKey = key;
    const ov = $('#imageOverlay'); if(!ov) return;
    if(siteUploader) siteUploader.reset();
    ov.classList.add('show');
  }

  let siteUploader = null;
  function wireImageModal(){
    const ov = $('#imageOverlay'); if(!ov) return;
    const upRoot = ov.querySelector('.uploader');
    if(upRoot) siteUploader = wireUploader(upRoot);

    $('#imageForm').addEventListener('submit', async (e)=>{
      e.preventDefault();
      const msg = $('#imageMsg');
      const url = siteUploader ? siteUploader.getUrl() : '';
      if(!url){
        if(msg){ msg.textContent = 'Elige una foto primero.'; msg.className='form-msg show error'; }
        return;
      }
      if(editingImgKey && window.BARRO_CONFIGURED){
        const { error } = await sb.from('site_images').update({ url, updated_at: new Date().toISOString() }).eq('key', editingImgKey);
        if(error){
          if(msg){ msg.textContent = error.message; msg.className='form-msg show error'; }
          return;
        }
        await loadSiteImages();
      }
      if(msg) msg.className='form-msg';
      ov.classList.remove('show'); editingImgKey=null;
    });
  }

  document.body.addEventListener('click', (e)=>{
    const editBtn = e.target.closest('.ph-edit');
    if(editBtn) openImageModal(editBtn.dataset.edit);
  });

  /* ---------------- subida de fotos a Supabase Storage ---------------- */
  // Sube un archivo al bucket 'fotos' y devuelve su URL pública.
  // onProgress recibe un número de 0 a 100 (aproximado).
  async function uploadPhoto(file, onProgress){
    if(!window.BARRO_CONFIGURED) throw new Error('Conecta Supabase para poder subir fotos.');
    if(!file) throw new Error('No se seleccionó ninguna foto.');
    if(!file.type.startsWith('image/')) throw new Error('El archivo debe ser una imagen.');
    if(file.size > 5 * 1024 * 1024) throw new Error('La foto pesa más de 5 MB. Usa una más liviana.');

    if(onProgress) onProgress(15);
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;

    const { error } = await sb.storage.from('fotos').upload(path, file, {
      cacheControl: '3600', upsert: false, contentType: file.type
    });
    if(error) throw new Error('No se pudo subir la foto: ' + error.message);

    if(onProgress) onProgress(85);
    const { data } = sb.storage.from('fotos').getPublicUrl(path);
    if(onProgress) onProgress(100);
    return data.publicUrl;
  }
  window.Barro.uploadPhoto = uploadPhoto;

  // Conecta un bloque .uploader del DOM: preview, botón de quitar y barra de progreso.
  // Devuelve un objeto con getUrl() / setUrl() / reset().
  function wireUploader(root){
    const input   = root.querySelector('input[type=file]');
    const preview = root.querySelector('.up-preview');
    const img     = preview ? preview.querySelector('img') : null;
    const removeB = preview ? preview.querySelector('.up-remove') : null;
    const bar     = root.querySelector('.up-bar');
    const fill    = bar ? bar.querySelector('i') : null;
    const btn     = root.querySelector('.up-btn');
    const errBox  = root.querySelector('.up-error');
    let url = '';

    function setProgress(p){
      if(!bar || !fill) return;
      bar.classList.toggle('show', p > 0 && p < 100);
      fill.style.width = p + '%';
    }
    function showPreview(u){
      url = u || '';
      if(preview && img){
        preview.classList.toggle('show', !!url);
        if(url) img.src = url;
      }
      if(btn) btn.textContent = url ? 'Cambiar foto' : 'Elegir foto';
    }
    function showError(msg){
      if(!errBox) return;
      errBox.textContent = msg || '';
      errBox.style.display = msg ? 'block' : 'none';
    }

    if(btn) btn.addEventListener('click', ()=> input && input.click());
    if(removeB) removeB.addEventListener('click', ()=>{ showPreview(''); if(input) input.value=''; });

    if(input) input.addEventListener('change', async ()=>{
      const file = input.files && input.files[0];
      if(!file) return;
      showError('');
      // vista previa inmediata mientras sube
      const localUrl = URL.createObjectURL(file);
      if(preview && img){ preview.classList.add('show'); img.src = localUrl; }
      setProgress(10);
      try{
        const publicUrl = await uploadPhoto(file, setProgress);
        showPreview(publicUrl);
      }catch(err){
        showError(err.message);
        showPreview('');
        if(input) input.value='';
      }finally{
        setTimeout(()=> setProgress(0), 400);
      }
    });

    return {
      getUrl: ()=> url,
      setUrl: (u)=>{ showPreview(u); showError(''); if(input) input.value=''; },
      reset:  ()=>{ showPreview(''); showError(''); if(input) input.value=''; setProgress(0); }
    };
  }
  window.Barro.wireUploader = wireUploader;

  /* ---------------- generic modal close ---------------- */
  function wireGenericModals(){
    $$('[data-close]').forEach(b=>b.addEventListener('click', (e)=>{ e.target.closest('.overlay').classList.remove('show'); }));
    $$('.overlay').forEach(ov=>ov.addEventListener('click', (e)=>{ if(e.target===ov) ov.classList.remove('show'); }));
    document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') $$('.overlay.show').forEach(o=>o.classList.remove('show')); });
  }

  /* ---------------- header scroll state ---------------- */
  function wireHeaderScroll(){
    const header = $('#siteHeader'); if(!header) return;
    window.addEventListener('scroll', ()=>{ header.classList.toggle('solid', window.scrollY > 40); }, {passive:true});
  }

  /* ---------------- scroll reveal ---------------- */
  function wireReveal(){
    const targets = $$('.reveal');
    if(!targets.length) return;
    if(!('IntersectionObserver' in window)){ targets.forEach(t=>t.classList.add('in')); return; }
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){ entry.target.classList.add('in'); io.unobserve(entry.target); }
      });
    }, { threshold:0.15, rootMargin:'0px 0px -60px 0px' });
    targets.forEach(t=>io.observe(t));
  }
  window.Barro.refreshReveal = wireReveal;

  document.addEventListener('DOMContentLoaded', ()=>{
    wireAuthModal();
    wireImageModal();
    wireGenericModals();
    wireHeaderScroll();
    wireReveal();
    renderNavAuth();
    loadSiteImages();
    if(window.BARRO_CONFIGURED){
      refreshProfile();
      sb.auth.onAuthStateChange(()=>{ refreshProfile(); });
    }
    const y = $('#year'); if(y) y.textContent = new Date().getFullYear();
  });
})();
