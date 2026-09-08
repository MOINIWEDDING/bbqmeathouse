(function(){
  const $ = (s,el=document)=>el.querySelector(s);
  let allItems = [];

  // Misma vista de muestra que menu.js, usada solo si Supabase no está conectado.
  function demoMenu(){
    return [
      {id:'d1', name:'V60 grano dominicano', category:'Buenos días', price:250, featured:true, image_url:'https://images.unsplash.com/photo-1753837787691-84a06d715d24?q=80&w=600&auto=format&fit=crop'},
      {id:'d2', name:'Chemex para dos', category:'Buenos días', price:420, featured:false, image_url:'https://images.unsplash.com/photo-1758593386033-cb1f842d550c?q=80&w=600&auto=format&fit=crop'},
      {id:'d3', name:'Espresso doble origen', category:'Buenos días', price:150, featured:false, image_url:'https://images.unsplash.com/photo-1498241804937-a517467c0db6?q=80&w=600&auto=format&fit=crop'},
      {id:'d4', name:'Tostada de aguacate', category:'Salados', price:320, featured:false, image_url:'https://images.unsplash.com/photo-1752095809157-9dd2e2dfae8b?q=80&w=600&auto=format&fit=crop'},
      {id:'d5', name:'Sandwich de la barra', category:'Salados', price:380, featured:false, image_url:'https://images.unsplash.com/photo-1696721497656-682d1376c3c8?q=80&w=600&auto=format&fit=crop'},
      {id:'d6', name:'Flat white de autor', category:'Para la tarde', price:210, featured:true, image_url:'https://images.unsplash.com/photo-1758900450186-e829f72d25fb?q=80&w=600&auto=format&fit=crop'},
      {id:'d7', name:'Cold brew 24h', category:'Para la tarde', price:220, featured:false, image_url:'https://images.unsplash.com/photo-1759259639356-6eee63241869?q=80&w=600&auto=format&fit=crop'},
      {id:'d8', name:'Cata guiada', category:'Experiencias', price:650, featured:false, image_url:'https://images.unsplash.com/photo-1758945185175-3d54780cd8d0?q=80&w=600&auto=format&fit=crop'},
    ];
  }

  function money(n){ return Number(n).toLocaleString('es-DO') + '$'; }

  function cardHtml(item){
    const photo = item.image_url
      ? `<img src="${item.image_url}" alt="${item.name}">`
      : '';
    return `
      <a class="home-card reveal in" href="menu.html">
        <div class="home-card-photo">${photo}</div>
        <div class="home-card-body">
          <span class="home-card-tag">${item.category}</span>
          <h4>${item.name}</h4>
          <div class="home-card-bottom"><span class="home-card-price">${money(item.price)}</span></div>
        </div>
      </a>`;
  }

  function renderGrid(list, emptyMsg){
    const grid = $('#popularGrid');
    if(!grid) return;
    if(!list.length){
      grid.innerHTML = `<p class="empty-note" style="grid-column:1/-1;">${emptyMsg || 'No se encontraron productos.'}</p>`;
      return;
    }
    grid.innerHTML = list.map(cardHtml).join('');
  }

  function showPopular(){
    const title = $('#popularTitle');
    if(title) title.textContent = 'Populares';
    const featured = allItems.filter(i=>i.featured);
    renderGrid((featured.length ? featured : allItems).slice(0,4));
  }

  async function loadItems(){
    if(!window.BARRO_CONFIGURED){
      allItems = demoMenu();
      showPopular();
      return;
    }
    const { data, error } = await sb.from('menu_items').select('*').order('created_at', { ascending:true });
    allItems = (!error && data && data.length) ? data : demoMenu();
    showPopular();
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    loadItems();
    const search = $('#homeSearch');
    const title = $('#popularTitle');
    if(search){
      search.addEventListener('input', ()=>{
        const q = search.value.trim().toLowerCase();
        if(!q){ showPopular(); return; }
        if(title) title.textContent = 'Resultados';
        renderGrid(allItems.filter(i=> i.name.toLowerCase().includes(q)), 'No encontramos nada con ese nombre.');
      });
    }
  });
})();
