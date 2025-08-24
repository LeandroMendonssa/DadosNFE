let linhas = [];
let fotosAcumuladas = [];
let notasPendentes = [];
let historicoNotas = [];
let fornecedoresSugeridos = [];
let pedidosRecursos = {};
let fotoAtualIndex = 0;

const itensPorPagina = 10;
let paginaAtualNotas = 1;
let paginaAtualHistorico = 1;

const dataEl = document.getElementById('data');
const nfEl = document.getElementById('nf');
const vencEl = document.getElementById('venc');
const valorEl = document.getElementById('valor');
const fornEl = document.getElementById('forn');
const obsEl = document.getElementById('obs');
const saidaEl = document.getElementById('saida');
const fotosEl = document.getElementById('fotos');
const fileLabelEl = document.querySelector('.file-input-label');
const fileCountHintEl = document.getElementById('fileCountHint');
const miniaturasContainer = document.getElementById('miniaturas-container');

const listaNotasPendentes = document.getElementById('lista-notas-pendentes');
const paginacaoNotasEl = document.getElementById('paginacao-notas');
const paginacaoHistoricoEl = document.getElementById('paginacao-historico');
const obsOptions = Array.from(obsEl.options).map(o => o.value);
const fornDatalist = document.getElementById('fornecedores-sugeridos');

const listaHistoricoEl = document.getElementById('lista-historico');
const listaPedidosEl = document.getElementById('lista-pedidos');
const listaFornManageEl = document.getElementById('lista-fornecedores-manage');
const fornManageInput = document.getElementById('forn-manage');
const pedidoNumInput = document.getElementById('pedido-num');
const pedidoRecursoSelect = document.getElementById('pedido-recurso');

const popups = document.querySelectorAll('.popup-modal');

function carregarEstado() {
    const savedForn = localStorage.getItem('fornecedores');
    if (savedForn) fornecedoresSugeridos = JSON.parse(savedForn);
    popularDatalist(fornDatalist);

    const savedHistorico = localStorage.getItem('historicoNotas');
    if (savedHistorico) historicoNotas = JSON.parse(savedHistorico);

    const savedPedidos = localStorage.getItem('pedidosRecursos');
    if (savedPedidos) pedidosRecursos = JSON.parse(savedPedidos);

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        document.getElementById('theme-toggle').innerHTML = '<i class="fas fa-sun"></i>';
    }

    const savedNotasPendentes = localStorage.getItem('notasPendentes');
    if (savedNotasPendentes) notasPendentes = JSON.parse(savedNotasPendentes);

    rebuildNotasPendentesList();
    rebuildSaida();
}

function salvarEstado() {
    localStorage.setItem('fornecedores', JSON.stringify(fornecedoresSugeridos));
    localStorage.setItem('historicoNotas', JSON.stringify(historicoNotas));
    localStorage.setItem('pedidosRecursos', JSON.stringify(pedidosRecursos));
    localStorage.setItem('notasPendentes', JSON.stringify(notasPendentes));
}

function toggleTheme() {
  document.body.classList.toggle('dark-mode');
  const isDarkMode = document.body.classList.contains('dark-mode');
  localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  document.getElementById('theme-toggle').innerHTML = isDarkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}

function adicionarFornecedor(forn) {
    const fornUpper = forn.trim().toUpperCase();
    if (fornUpper && !fornecedoresSugeridos.includes(fornUpper)) {
        fornecedoresSugeridos.push(fornUpper);
        salvarEstado();
        popularDatalist(fornDatalist);
    }
}

function popularDatalist(datalistEl) {
    datalistEl.innerHTML = '';
    fornecedoresSugeridos.forEach(forn => {
        const option = document.createElement('option');
        option.value = forn;
        datalistEl.appendChild(option);
    });
}

function popularListaHistorico(pagina = 1) {
  listaHistoricoEl.innerHTML = '';
  paginaAtualHistorico = pagina;

  const inicio = (pagina - 1) * itensPorPagina;
  const fim = inicio + itensPorPagina;
  const notasPagina = historicoNotas.slice(inicio, fim);

  if (notasPagina.length === 0 && pagina === 1) {
    listaHistoricoEl.innerHTML = '<li class="nota-item">Nenhuma nota no histórico.</li>';
  } else {
    notasPagina.forEach(nota => {
      const li = document.createElement('li');
      const dataFormatada = nota.data ? nota.data.slice(0, 5) : 's/data';
      li.textContent = `${nota.fornecedor} - ${nota.nf} (${dataFormatada})`;
      li.classList.add('nota-item');
      listaHistoricoEl.appendChild(li);
    });
  }

  criarPaginacao(paginacaoHistoricoEl, historicoNotas.length, pagina, 'historico');
}

function popularListaPedidos() {
  listaPedidosEl.innerHTML = '';
  const sortedPedidos = Object.keys(pedidosRecursos).sort((a, b) => a - b);
  sortedPedidos.forEach(pedido => {
    const li = document.createElement('li');
    li.innerHTML = `${pedido} - ${pedidosRecursos[pedido]} <button onclick="deletarPedido('${pedido}')"><i class="fas fa-times-circle"></i></button>`;
    listaPedidosEl.appendChild(li);
  });
}

function popularListaFornecedores() {
  listaFornManageEl.innerHTML = '';
  fornecedoresSugeridos.sort().forEach(forn => {
    const li = document.createElement('li');
    li.innerHTML = `${forn} <button onclick="deletarFornecedor('${forn}')"><i class="fas fa-times-circle"></i></button>`;
    listaFornManageEl.appendChild(li);
  });
}

function criarPaginacao(container, totalItens, paginaAtual, tipo) {
  container.innerHTML = '';
  const totalPaginas = Math.ceil(totalItens / itensPorPagina);

  if (totalPaginas <= 1) return;

  if (paginaAtual > 1) {
    const btnAnterior = document.createElement('button');
    btnAnterior.innerHTML = '&laquo;';
    btnAnterior.addEventListener('click', () => {
      if (tipo === 'notas') {
        rebuildNotasPendentesList(paginaAtual - 1);
      } else {
        popularListaHistorico(paginaAtual - 1);
      }
    });
    container.appendChild(btnAnterior);
  }

  for (let i = 1; i <= totalPaginas; i++) {
    const btnPagina = document.createElement('button');
    btnPagina.textContent = i;
    if (i === paginaAtual) {
      btnPagina.classList.add('ativo');
    }
    btnPagina.addEventListener('click', () => {
      if (tipo === 'notas') {
        rebuildNotasPendentesList(i);
      } else {
        popularListaHistorico(i);
      }
    });
    container.appendChild(btnPagina);
  }

  if (paginaAtual < totalPaginas) {
    const btnProximo = document.createElement('button');
    btnProximo.innerHTML = '&raquo;';
    btnProximo.addEventListener('click', () => {
      if (tipo === 'notas') {
        rebuildNotasPendentesList(paginaAtual + 1);
      } else {
        popularListaHistorico(paginaAtual + 1);
      }
    });
    container.appendChild(btnProximo);
  }
}

function animateButton(btn, newText, newIconClass, originalText) {
  const originalHTML = btn.innerHTML;
  btn.innerHTML = `<i class="${newIconClass}"></i> ${newText}`;
  setTimeout(() => {
    btn.innerHTML = originalHTML;
  }, 1500);
}
function fmtData(iso) {
  if (!iso) return '';
  return iso;
}
function getLinha(nota) {
  return [
    fmtData(nota.data), nota.nf, fmtData(nota.vencimento), nota.valor, "", nota.fornecedor, "", "", nota.obs
  ].join("\t");
}
function rebuildSaida() {
    linhas.length = 0;
    notasPendentes.forEach(nota => {
        linhas.push(getLinha(nota));
    });
    saidaEl.value = linhas.join("\n");
}
function toast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.display = 'block';
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(()=> t.style.display='none', 2200);
}

function formatarData(input) {
  let value = input.value.replace(/\D/g, '');
  let formattedValue = '';

  if (value.length > 0) {
    formattedValue += value.substring(0, 2);
  }
  if (value.length > 2) {
    formattedValue += '/' + value.substring(2, 4);
  }
  if (value.length > 4) {
    formattedValue += '/' + value.substring(4, 8);
  }
  input.value = formattedValue;
}

function rebuildNotasPendentesList(pagina = 1) {
  listaNotasPendentes.innerHTML = '';
  paginaAtualNotas = pagina;

  const inicio = (pagina - 1) * itensPorPagina;
  const fim = inicio + itensPorPagina;
  const notasPagina = notasPendentes.slice(inicio, fim);

  if (notasPendentes.length === 0) {
      listaNotasPendentes.innerHTML = `<li class="nota-item">Nenhuma nota salva para gerenciar.</li>`;
      paginacaoNotasEl.innerHTML = '';
      return;
  }

  notasPagina.forEach((nota, index) => {
    const globalIndex = inicio + index;
    const li = document.createElement('li');
    li.classList.add('nota-item');
    if (nota.enviada) li.classList.add('nota-enviada');

    li.innerHTML = `
      <div class="nota-info">${nota.fornecedor} ${nota.nf}
        ${nota.enviada ? '<i class="fas fa-check-circle"></i>' : ''}
      </div>
      <div class="nota-detalhes">
        Venc: ${nota.vencimento || 'N/A'} | Valor: ${nota.valor || 'N/A'}
      </div>
      <div class="actions-row">
        <span></span>
        <div class="actions-item">
          ${nota.fotos.length > 0 ?
            `<button class="whatsapp-btn" onclick="compartilharNota(${globalIndex})" title="Compartilhar via WhatsApp">
              <i class="fab fa-whatsapp"></i>
            </button>` : `<span class="sem-fotos">SEM FOTOS</span>`}
          <button class="edit-btn" onclick="toggleEditPanel(this, ${globalIndex})" title="Editar nota">
            <i class="fas fa-pen"></i>
          </button>
          <button class="delete-btn" onclick="deletarNota(${globalIndex})" title="Excluir nota">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
      <div class="edit-panel">
        <div class="edit-fields-row">
          <div class="campo">
              <label for="fornEdit-${globalIndex}">Fornecedor</label>
              <input type="text" id="fornEdit-${globalIndex}" value="${nota.fornecedor}" oninput="this.value = this.value.toUpperCase()">
          </div>
          <div class="campo">
              <label for="nfEdit-${globalIndex}">NF</label>
              <input type="text" id="nfEdit-${globalIndex}" value="${nota.nf}">
          </div>
          <div class="campo">
              <label for="vencEdit-${globalIndex}">Vencimento</label>
              <input type="text" id="vencEdit-${globalIndex}" value="${nota.vencimento}">
          </div>
        </div>
        <div class="edit-fields-row">
          <div class="campo" style="flex:1;">
              <label for="valorEdit-${globalIndex}">Valor</label>
              <input type="text" id="valorEdit-${globalIndex}" value="${nota.valor}">
          </div>
          <div class="campo" style="flex:1;">
              <label for="obsEdit-${globalIndex}">Observações</label>
              <select id="obsEdit-${globalIndex}"></select>
          </div>
        </div>
        <div class="actions">
          <button style="background:var(--button-success);color:#fff; flex: 1;" onclick="salvarEdicao(${globalIndex})">
            <i class="fas fa-save"></i> Salvar
          </button>
        </div>
      </div>
    `;
    listaNotasPendentes.appendChild(li);
  });

  criarPaginacao(paginacaoNotasEl, notasPendentes.length, pagina, 'notas');
}

function openPopup(idPopup) {
  const popup = document.getElementById(idPopup);
  if (popup) {
    document.body.classList.add('popup-open');
    popups.forEach(p => p.style.display = 'none');
    popup.style.display = 'flex';

    if (idPopup === 'gerenciar-notas-popup') {
      rebuildNotasPendentesList(1);
    } else if (idPopup === 'historico-popup') {
      popularListaHistorico(1);
    } else if (idPopup === 'pedidos-popup') {
      popularListaPedidos();
    } else if (idPopup === 'fornecedores-popup') {
      popularListaFornecedores();
    }
  }
}

function closePopup(idPopup) {
  const popup = document.getElementById(idPopup);
  if (popup) {
    popup.style.display = 'none';
    document.body.classList.remove('popup-open');
  }
}

function toggleEditPanel(btn, index) {
    const li = btn.closest('.nota-item');
    const panel = li.querySelector('.edit-panel');
    const allPanels = document.querySelectorAll('.edit-panel');

    allPanels.forEach(p => {
      if (p !== panel && p.classList.contains('show')) {
        p.classList.remove('show');
      }
    });
    panel.classList.toggle('show');
}

function salvarEdicao(index) {
    const li = document.querySelectorAll('.nota-item')[index % itensPorPagina];
    const nota = notasPendentes[index];

    nota.fornecedor = li.querySelector(`#fornEdit-${index}`).value.trim().toUpperCase();
    nota.nf = li.querySelector(`#nfEdit-${index}`).value.trim();

    const vencimentoEditado = li.querySelector(`#vencEdit-${index}`).value.trim();
    nota.vencimento = vencimentoEditado;

    nota.valor = li.querySelector(`#valorEdit-${index}`).value.trim();
    nota.obs = li.querySelector(`#obsEdit-${index}`).value.trim();

    adicionarFornecedor(nota.fornecedor);

    rebuildSaida();
    salvarEstado();
    toggleEditPanel(li.querySelector('.edit-btn'), index);
    li.querySelector('.nota-info').innerHTML = `${nota.fornecedor} ${nota.nf}`;
    toast('✅ Nota editada e salva!');
}

function deletarNota(index) {
  if (confirm("Tem certeza que deseja excluir esta nota?")) {
    notasPendentes.splice(index, 1);
    rebuildSaida();
    salvarEstado();
    rebuildNotasPendentesList(paginaAtualNotas);
    toast("🗑️ Nota excluída!");
  }
}

async function exportar() {
  if (!saidaEl.value) {
    toast("Nada para copiar.");
    return;
  }

  try {
    await navigator.clipboard.writeText(saidaEl.value);
    toast("✅ Linhas copiadas! Agora é só colar no Excel.");
    const exportBtn = document.getElementById('exportBtn');
    animateButton(exportBtn, 'Copiado', 'fas fa-check', '<i class="fas fa-clipboard"></i> Copiar Texto');
  } catch {
    saidaEl.select();
    document.execCommand("copy");
    toast("✅ Linhas copiadas! Agora é só colar no Excel.");
  }
}

function limpar() {
  if (notasPendentes.length > 0) {
    historicoNotas = historicoNotas.concat(notasPendentes);
    notasPendentes = [];
    salvarEstado();
  }
  linhas.length = 0;
  saidaEl.value = "";
  fotosAcumuladas.length = 0;

  const camposEntrada = [dataEl, nfEl, vencEl, valorEl, fornEl, obsEl, fotosEl];
  camposEntrada.forEach(el => el.value = "");

  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = today.getFullYear();
  dataEl.value = `${day}/${month}/${year}`;

  fileCountHintEl.textContent = 'Nenhuma imagem acumulada.';
  fileLabelEl.classList.remove('active');
  miniaturasContainer.innerHTML = '';
  rebuildNotasPendentesList(1);

  toast("Conteúdo limpo e histórico salvo.");
}

async function gerarImagemSeparadora(fornecedor, nf) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const width = 600;
    const height = 150;
    canvas.width = width;
    canvas.height = height;

    ctx.fillStyle = '#34495e';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#ecf0f1';
    ctx.font = 'bold 30px -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';

    const texto = `${fornecedor} ${nf}`;
    const marcador = `↓`;

    ctx.fillText(texto, width / 2, height / 2 - 10);

    ctx.font = '50px sans-serif';
    ctx.fillText(marcador, width / 2, height / 2 + 50);

    return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
}

async function compartilharNota(index) {
  try {
    if (!navigator.share) {
      toast("O compartilhamento de arquivos não é suportado pelo seu navegador.");
      return;
    }

    const nota = notasPendentes[index];
    const imagemSeparadora = await gerarImagemSeparadora(nota.fornecedor, nota.nf);
    const arquivosParaCompartilhar = [];

    arquivosParaCompartilhar.push(new File([imagemSeparadora], 'separador.png', { type: 'image/png' }));

    for (const foto of nota.fotos) {
      arquivosParaCompartilhar.push(foto);
    }

    const textoCompartilhar = `${nota.fornecedor} ${nota.nf}`;

    if (navigator.canShare({ files: arquivosParaCompartilhar, text: textoCompartilhar })) {
      await navigator.share({
        files: arquivosParaCompartilhar,
        text: textoCompartilhar
      });

      notasPendentes[index].enviada = true;
      salvarEstado();
      rebuildNotasPendentesList(paginaAtualNotas);
      toast("✅ Conteúdo enviado para o WhatsApp!");

    } else {
      toast("O compartilhamento de múltiplas fotos não é suportado pelo seu navegador.");
    }
  } catch (error) {
    console.error('Erro ao compartilhar:', error);
    toast("Erro ao compartilhar. Tente novamente.");
  }
}

function limparHistorico() {
  if (confirm("Tem certeza que deseja limpar todo o Histórico de notas? Esta ação não pode ser desfeita.")) {
    historicoNotas = [];
    salvarEstado();
    popularListaHistorico(1);
    toast("Histórico limpo com sucesso!");
  }
}

function adicionarPedido() {
  const pedidoNum = pedidoNumInput.value.trim();
  const recurso = pedidoRecursoSelect.value;
  if (pedidoNum && recurso) {
      pedidosRecursos[pedidoNum] = recurso;
      salvarEstado();
      popularListaPedidos();
      pedidoNumInput.value = '';
      pedidoRecursoSelect.value = '';
      toast(`Pedido ${pedidoNum} associado a ${recurso}!`);
  } else {
      toast('Preencha o número do pedido e selecione um recurso.');
  }
}

function deletarPedido(pedido) {
  if (confirm(`Tem certeza que deseja excluir o pedido ${pedido}?`)) {
    delete pedidosRecursos[pedido];
    salvarEstado();
    popularListaPedidos();
    toast(`Pedido ${pedido} excluído.`);
  }
}

function adicionarFornecedorManage() {
  const fornecedor = fornManageInput.value.trim();
  if (fornecedor) {
    adicionarFornecedor(fornecedor);
    popularListaFornecedores();
    fornManageInput.value = '';
    toast(`Fornecedor ${fornecedor.toUpperCase()} adicionado!`);
  } else {
    toast('Digite o nome do fornecedor.');
  }
}

function deletarFornecedor(forn) {
  if (confirm(`Tem certeza que deseja excluir o fornecedor ${forn}?`)) {
    fornecedoresSugeridos = fornecedoresSugeridos.filter(f => f !== forn);
    salvarEstado();
    popularDatalist(fornDatalist);
    popularListaFornecedores();
    toast(`Fornecedor ${forn} excluído.`);
  }
}

function removerFoto(index) {
  if (confirm("Remover esta imagem?")) {
    fotosAcumuladas.splice(index, 1);
    fileCountHintEl.textContent = `${fotosAcumuladas.length} imagem(ns) acumulada(s).`;

    reconstruirMiniaturas();

    if (fotosAcumuladas.length === 0) {
      fileLabelEl.classList.remove('active');
    }
  }
}

function reconstruirMiniaturas() {
    miniaturasContainer.innerHTML = '';
    fotosAcumuladas.forEach((file, i) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'miniatura-wrapper';

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = document.createElement('img');
        img.src = event.target.result;
        img.onclick = () => abrirPreview(fotosAcumuladas, i);

        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-foto';
        removeBtn.innerHTML = '×';
        removeBtn.onclick = (e) => {
          e.stopPropagation();
          removerFoto(i);
        };

        wrapper.appendChild(img);
        wrapper.appendChild(removeBtn);
        miniaturasContainer.appendChild(wrapper);
      };
      reader.readAsDataURL(file);
    });
}

function abrirPreview(fotos, index) {
  const modal = document.getElementById('modalPreview');
  const imgPreview = document.getElementById('imgPreview');
  fotoAtualIndex = index;

  const reader = new FileReader();
  reader.onload = (event) => {
      imgPreview.src = event.target.result;
      modal.style.display = 'flex';
  };
  reader.readAsDataURL(fotos[index]);

  document.getElementById('prevBtn').style.display = index > 0 ? 'block' : 'none';
  document.getElementById('nextBtn').style.display = index < fotos.length - 1 ? 'block' : 'none';
}

function fecharPreview() {
  const modal = document.getElementById('modalPreview');
  modal.style.display = 'none';
}

function navegarFotos(direcao) {
    const fotosAtivas = fotosAcumuladas;
    let novoIndex = fotoAtualIndex + direcao;

    if (novoIndex >= 0 && novoIndex < fotosAtivas.length) {
        abrirPreview(fotosAtivas, novoIndex);
    }
}

function excluirFotoPreview() {
    if (confirm("Tem certeza que deseja excluir esta imagem?")) {
        fotosAcumuladas.splice(fotoAtualIndex, 1);

        if (fotosAcumuladas.length === 0) {
            fecharPreview();
            reconstruirMiniaturas();
            fileCountHintEl.textContent = 'Nenhuma imagem acumulada.';
            fileLabelEl.classList.remove('active');
        } else {
            let novoIndex = fotoAtualIndex;
            if (novoIndex >= fotosAcumuladas.length) {
                novoIndex = fotosAcumuladas.length - 1;
            }
            abrirPreview(fotosAcumuladas, novoIndex);
            reconstruirMiniaturas();
            fileCountHintEl.textContent = `${fotosAcumuladas.length} imagem(ns) acumulada(s).`;
        }
        toast("Imagem excluída.");
    }
}


document.addEventListener('DOMContentLoaded', () => {
    carregarEstado();
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    dataEl.value = `${day}/${month}/${year}`;

    document.getElementById('modalPreview').addEventListener('click', (e) => {
      if (e.target.id === 'modalPreview' || e.target.classList.contains('modal-preview-conteudo')) {
        fecharPreview();
      }
    });

    popups.forEach(popup => {
        popup.addEventListener('click', (e) => {
            if (e.target.classList.contains('popup-modal')) {
                closePopup(popup.id);
            }
        });
    });
});

dataEl.addEventListener('input', (e) => {
  formatarData(e.target);
});

vencEl.addEventListener('input', (e) => {
  formatarData(e.target);
});

fornEl.addEventListener('input', (e) => {
  e.target.value = e.target.value.toUpperCase();
});

fornManageInput.addEventListener('input', (e) => {
  e.target.value = e.target.value.toUpperCase();
});

fornManageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    adicionarFornecedorManage();
  }
});

fotosEl.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    const newFiles = Array.from(e.target.files);
    fotosAcumuladas = fotosAcumuladas.concat(newFiles);
    fileCountHintEl.textContent = `${fotosAcumuladas.length} imagem(ns) acumulada(s).`;
    fileLabelEl.classList.add('active');
    reconstruirMiniaturas();

    e.target.value = "";
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT')) {
    e.preventDefault();
    const ordem = [dataEl, nfEl, vencEl, valorEl, fornEl, obsEl];
    const idx = ordem.indexOf(e.target);
    if (idx > -1 && idx < ordem.length - 1) {
      if (e.target === dataEl) {
        const dataCopiada = dataEl.value;
        vencEl.value = dataCopiada;
      }
      ordem[idx + 1].focus();
    } else if (e.target === obsEl) {
      salvarNota();
    }
  }
});
