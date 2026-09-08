(function(){
  const $ = (s,el=document)=>el.querySelector(s);
  const $$ = (s,el=document)=>Array.from(el.querySelectorAll(s));

  const GROUPS = ['Buenos días','Salados','Para la tarde','Experiencias'];
  const SLUGS = {'Buenos días':'buenos-dias','Salados':'salados','Para la tarde':'para-la-tarde','Experiencias':'experiencias'};
  const TINT = {'Buenos días':'manana','Salados':'salado','Para la tarde':'tarde','Experiencias':'experiencia'};

  let items = [];
  let editingId = null;
  let hashHandled = false;
  let productUploader = null;

  // Vista de muestra usada solo si Supabase todavía no está conectado.
  function demoMenu(){
    return [
      {id:'d1', name:'V60 grano dominicano', category:'Buenos días', price:250, featured:true, tags:'Dominicano,Filtrado,Frutal', image_url:'https://images.unsplash.com/photo-1753837787691-84a06d715d24?q=80&w=800&auto=format&fit=crop'},
      {id:'d2', name:'Chemex para dos', category:'Buenos días', price:420, featured:false, tags:'Para compartir,Filtrado', image_url:'https://images.unsplash.com/photo-1758593386033-cb1f842d550c?q=80&w=800&auto=format&fit=crop'},
      {id:'d3', name:'Espresso doble origen', category:'Buenos días', price:150, featured:false, tags:'Doble shot,Intenso', image_url:'https://images.unsplash.com/photo-1498241804937-a517467c0db6?q=80&w=800&auto=format&fit=crop'},
      {id:'d4', name:'Tostada de aguacate', category:'Salados', price:320, featured:false, tags:'Vegetariano,Masa madre', image_url:'https://images.unsplash.com/photo-1752095809157-9dd2e2dfae8b?q=80&w=800&auto=format&fit=crop'},
      {id:'d5', name:'Sandwich de la barra', category:'Salados', price:380, featured:false, tags:'Jamón serrano,Manchego', image_url:'https://images.unsplash.com/photo-1696721497656-682d1376c3c8?q=80&w=800&auto=format&fit=crop'},
      {id:'d6', name:'Flat white de autor', category:'Para la tarde', price:210, featured:true, tags:'Cremoso,Espresso', image_url:'https://images.unsplash.com/photo-1758900450186-e829f72d25fb?q=80&w=800&auto=format&fit=crop'},
      {id:'d7', name:'Cold brew 24h', category:'Para la tarde', price:220, featured:false, tags:'Frío,24 horas', image_url:'https://images.unsplash.com/photo-1759259639356-6eee63241869?q=80&w=800&auto=format&fit=crop'},
      {id:'d8', name:'Cata guiada', category:'Experiencias', price:650, featured:false, tags:'Grupal,Tres orígenes', image_url:'https://images.unsplash.com/photo-1758945185175-3d54780cd8d0?q=80&w=800&auto=format&fit=crop'},
    ];
  }

  function money(n){ return Number(n).toLocaleString('es-DO') + '$'; }

  function showToast(msg){
    const t = $('#toast'); if(!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(()=> t.classList.remove('show'), 2600);
  }

  async function loadItems(){
    if(!window.BARRO_CONFIGURED){
      items = demoMenu();
      renderSections();
      return;
    }
    const { data, error } = await sb.from('menu_items').select('*').order('created_at', { ascending:true });
    if(error){ $('#menuSections').innerHTML = `<p class="empty-note">No se pudo cargar el menú: ${error.message}</p>`; return; }
    items = (data && data.length) ? data : demoMenu();
    renderSections();
  }

  function tagsOf(item){
    return (item.tags||'').split(',').map(t=>t.trim()).filter(Boolean);
  }

  function renderSections(){
    const wrap = $('#menuSections');
    const groupsWithItems = GROUPS.filter(g => items.some(i=>i.category===g));

    if(!groupsWithItems.length){
      wrap.innerHTML = `<p class="empty-note">Todavía no hay productos en el menú.</p>`;
      return;
    }

    wrap.innerHTML = groupsWithItems.map((group, gi)=>{
      const list = items.filter(i=>i.category===group);
      const cards = list.map((item,i)=>cardHtml(item, group, i)).join('');
      return `
        <div class="carousel-section reveal" id="${SLUGS[group]||''}" style="transition-delay:${Math.min(gi*0.08,0.24)}s; scroll-margin-top:76px;">
          <div class="carousel-head">
            <h3>${group}</h3>
          </div>
          <div class="carousel-wrap">
            <button class="carousel-arrow left" data-dir="left" aria-label="Anterior"><svg class="icon"><use href="#ic-chev-l"/></svg></button>
            <div class="carousel-track">${cards}</div>
            <button class="carousel-arrow right" data-dir="right" aria-label="Siguiente"><svg class="icon"><use href="#ic-chev-r"/></svg></button>
          </div>
        </div>`;
    }).join('');

    wireCarousels();
    wireCardActions();
    if(window.Barro && window.Barro.refreshReveal) window.Barro.refreshReveal();

    if(!hashHandled && location.hash){
      const target = document.querySelector(location.hash);
      if(target){ setTimeout(()=> target.scrollIntoView({ behavior:'smooth', block:'start' }), 120); }
      hashHandled = true;
    }
  }

  function cardHtml(item, group, index){
    const tint = TINT[group] || 'manana';
    const delay = Math.min(index * 0.07, 0.42);
    const tags = tagsOf(item);
    const photo = item.image_url
      ? `<img src="${item.image_url}" alt="${item.name}">`
      : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;"><svg class="ph-icon" style="width:30px;height:30px;stroke:#fff;opacity:.6;"><use href="#ic-camera"/></svg></div>`;
    return `
      <article class="p-card reveal" data-id="${item.id}" style="transition-delay:${delay}s">
        <div class="p-photo" style="--tint:var(--tint-${tint}); --tint-deep:var(--tint-${tint}-deep);">
          ${photo}
          <div class="p-photo-tint"></div>
          <div class="p-photo-fade"></div>
          ${item.featured ? `<span class="p-tagline">Favorito de la casa</span>` : ''}
          <div class="p-admin" data-bar="${item.id}">
            <button class="icon-btn" data-edit-item="${item.id}" aria-label="Editar"><svg class="icon" style="width:13px;height:13px;"><use href="#ic-pencil"/></svg></button>
            <button class="icon-btn danger" data-del-item="${item.id}" aria-label="Eliminar"><svg class="icon" style="width:13px;height:13px;"><use href="#ic-trash"/></svg></button>
          </div>
        </div>
        <div class="p-info" style="--tint-deep:var(--tint-${tint}-deep);">
          <div class="p-info-top">
            <h4>${item.name}</h4>
            <span class="p-price">${money(item.price)}</span>
          </div>
          ${tags.length ? `<div class="p-tags">${tags.map(t=>`<span>${t}</span>`).join('')}</div>` : ''}
          <div class="p-divider"></div>
          <button class="p-order" data-add="${item.id}">Pedir <svg><use href="#ic-arrow-ur"/></svg></button>
        </div>
      </article>`;
  }

  function wireCarousels(){
    $$('.carousel-section').forEach(section=>{
      const track = $('.carousel-track', section);
      const left = $('.carousel-arrow.left', section);
      const right = $('.carousel-arrow.right', section);

      function update(){
        const max = track.scrollWidth - track.clientWidth;
        left.disabled = track.scrollLeft <= 4;
        right.disabled = track.scrollLeft >= max - 4;
        if(max <= 4){ left.disabled = true; right.disabled = true; }
      }
      left.addEventListener('click', ()=> track.scrollBy({ left: -track.clientWidth*0.8, behavior:'smooth' }));
      right.addEventListener('click', ()=> track.scrollBy({ left: track.clientWidth*0.8, behavior:'smooth' }));
      track.addEventListener('scroll', update, { passive:true });
      window.addEventListener('resize', update);
      update();
    });
  }

  function wireCardActions(){
    $$('[data-add]').forEach(b=>b.addEventListener('click', ()=>{
      const item = items.find(i=>i.id===b.dataset.add);
      showToast(`${item ? item.name : 'Producto'} — pídelo en la barra. El pedido en línea llega pronto ☕`);
    }));
    $$('[data-edit-item]').forEach(b=>b.addEventListener('click', (e)=>{ e.stopPropagation(); openProduct(items.find(i=>i.id===b.dataset.editItem)); }));
    $$('[data-del-item]').forEach(b=>b.addEventListener('click', (e)=>{ e.stopPropagation(); confirmDelete(b); }));
  }

  function confirmDelete(btn){
    const card = btn.closest('.p-card');
    const id = btn.dataset.delItem;
    const box = document.createElement('div');
    box.className = 'confirm-del-sm';
    box.innerHTML = `<span>¿Eliminar este producto?</span>
      <div style="display:flex; gap:8px;">
        <button data-yes class="btn-amber" style="border:none;">Sí, eliminar</button>
        <button data-no class="btn-ghost" style="border:1px solid rgba(255,255,255,0.4); background:transparent; color:#fff;">Cancelar</button>
      </div>`;
    card.appendChild(box);
    box.querySelector('[data-yes]').addEventListener('click', async ()=>{
      if(window.BARRO_CONFIGURED){
        const { error } = await sb.from('menu_items').delete().eq('id', id);
        if(error){ alert('No se pudo eliminar: ' + error.message); box.remove(); return; }
      }
      await loadItems();
    });
    box.querySelector('[data-no]').addEventListener('click', ()=> box.remove());
  }

  function openProduct(item){
    editingId = item ? item.id : null;
    $('#productTitle').textContent = item ? 'Editar producto' : 'Agregar producto';
    $('#productSubmit').textContent = item ? 'Guardar cambios' : 'Guardar producto';
    $('#pName').value = item ? item.name : '';
    $('#pPrice').value = item ? item.price : '';
    $('#pCat').value = item ? item.category : 'Buenos días';
    if(productUploader) productUploader.setUrl(item ? (item.image_url||'') : '');
    $('#pTags').value = item ? (item.tags||'') : '';
    $('#pDesc').value = item ? (item.description||'') : '';
    $('#pFeatured').checked = item ? !!item.featured : false;
    $('#productMsg').className='form-msg';
    $('#productOverlay').classList.add('show');
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    const upRoot = document.querySelector('#productOverlay .uploader');
    if(upRoot && window.Barro && window.Barro.wireUploader) productUploader = window.Barro.wireUploader(upRoot);

    const addBtn = $('#addProductBtn');
    if(addBtn) addBtn.addEventListener('click', ()=>openProduct(null));

    const form = $('#productForm');
    form.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const msg = $('#productMsg');
      const payload = {
        name: $('#pName').value.trim(),
        price: parseFloat($('#pPrice').value),
        category: $('#pCat').value,
        image_url: productUploader ? productUploader.getUrl() : '',
        tags: $('#pTags').value.trim(),
        description: $('#pDesc').value.trim(),
        featured: $('#pFeatured').checked,
      };
      if(!payload.name || isNaN(payload.price)){
        msg.textContent='Completa el nombre y el precio.'; msg.className='form-msg show error'; return;
      }
      if(!window.BARRO_CONFIGURED){
        msg.textContent='Conecta Supabase en js/supabase-client.js para guardar cambios de verdad.'; msg.className='form-msg show error'; return;
      }
      let error;
      if(editingId){
        payload.updated_at = new Date().toISOString();
        ({ error } = await sb.from('menu_items').update(payload).eq('id', editingId));
      } else {
        ({ error } = await sb.from('menu_items').insert(payload));
      }
      if(error){ msg.textContent = error.message; msg.className='form-msg show error'; return; }
      $('#productOverlay').classList.remove('show');
      form.reset(); if(productUploader) productUploader.reset(); editingId=null;
      await loadItems();
    });

    document.addEventListener('barro:auth-changed', ()=>{
      const isStaff = window.Barro && window.Barro.isStaff && window.Barro.isStaff();
      if(addBtn) addBtn.style.display = isStaff ? 'inline-flex' : 'none';
      renderSections();
    });

    loadItems();
  });
})();
