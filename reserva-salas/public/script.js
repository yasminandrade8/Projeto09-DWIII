const URL_SALAS = '/api/salas';
const URL_RESERVAS = '/api/reservas';

let salasCache = [];
let reservasCache = [];
let feriadosCache = {};

document.addEventListener('DOMContentLoaded', () => {
    carregarDados();
    document.getElementById('formSala').addEventListener('submit', salvarSala);
    document.getElementById('formReserva').addEventListener('submit', salvarReserva);
});

function mudarAba(aba) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(`aba-${aba}`).classList.remove('hidden');
    
    const botoes = document.querySelectorAll('.tab-btn');
    if (aba === 'reservas') botoes[0].classList.add('active');
    if (aba === 'salas') botoes[1].classList.add('active');
}

function msg(texto, tipo = 'sucesso') {
    const el = document.getElementById('mensagem');
    el.textContent = texto; el.className = `mensagem ${tipo}`;
    setTimeout(() => el.classList.add('hidden'), 4000);
}

async function carregarDados() {
    try {
        const [resSalas, resReservas] = await Promise.all([ fetch(URL_SALAS), fetch(URL_RESERVAS) ]);
        salasCache = await resSalas.json();
        reservasCache = await resReservas.json();
        
        renderizarSalas();
        atualizarSelectSalas();
        renderizarReservas();
    } catch (e) {
        msg('Erro de conexão ao servidor.', 'erro');
    }
}

async function verificarFeriadoBrasilAPI() {
    const dataInput = document.getElementById('resData').value;
    const aviso = document.getElementById('avisoFeriado');
    aviso.classList.add('hidden');
    if (!dataInput) return;

    const ano = dataInput.split('-')[0];

    if (!feriadosCache[ano]) {
        try {
            const res = await fetch(`https://brasilapi.com.br/api/feriados/v1/${ano}`);
            if (res.ok) feriadosCache[ano] = await res.json();
            else feriadosCache[ano] = [];
        } catch (e) {
            console.error('BrasilAPI indisponível no momento.');
            return;
        }
    }

    const eFeriado = feriadosCache[ano].find(f => f.date === dataInput);
    if (eFeriado) {
        aviso.textContent = `⚠️ Atenção: A data selecionada é Feriado Nacional (${eFeriado.name})!`;
        aviso.classList.remove('hidden');
    }
}

function renderizarSalas() {
    const tbody = document.querySelector('#tabelaSalas tbody');
    tbody.innerHTML = salasCache.map(s => `
        <tr>
            <td>#${s.id}</td>
            <td><strong>${s.nome}</strong><br><small>${s.recursos}</small></td>
            <td>${s.localizacao}</td>
            <td>${s.capacidade} pax</td>
            <td><span class="badge ${s.status === 'Disponível' ? 'disponivel' : 'inativa'}">${s.status}</span></td>
            <td>
                <button class="btn-warning" onclick="editSala(${s.id})">Editar</button>
                <button class="btn-danger" onclick="delSala(${s.id})">Excluir</button>
            </td>
        </tr>`).join('') || '<tr><td colspan="6">Nenhuma sala cadastrada.</td></tr>';
}

function atualizarSelectSalas() {
    const select = document.getElementById('resSala');
    select.innerHTML = '<option value="">Selecione uma sala...</option>' + 
        salasCache.map(s => `<option value="${s.id}">${s.nome} (Cap: ${s.capacidade}) - ${s.status}</option>`).join('');
}

async function salvarSala(e) {
    e.preventDefault();
    const id = document.getElementById('salaId').value;
    const dados = {
        nome: document.getElementById('salaNome').value,
        localizacao: document.getElementById('salaLocal').value,
        capacidade: document.getElementById('salaCap').value,
        recursos: document.getElementById('salaRecursos').value,
        status: document.getElementById('salaStatus').value
    };

    const res = await fetch(id ? `${URL_SALAS}/${id}` : URL_SALAS, {
        method: id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
    });

    if (res.ok) {
        msg('Sala salva com sucesso!');
        cancelarEdicaoSala();
        carregarDados();
    } else {
        const json = await res.json();
        msg(json.erro, 'erro');
    }
}

window.editSala = function(id) {
    const s = salasCache.find(x => x.id === id);
    if (!s) return;
    document.getElementById('salaId').value = s.id;
    document.getElementById('salaNome').value = s.nome;
    document.getElementById('salaLocal').value = s.localizacao;
    document.getElementById('salaCap').value = s.capacidade;
    document.getElementById('salaRecursos').value = s.recursos;
    document.getElementById('salaStatus').value = s.status;
    document.getElementById('formSalaTitulo').innerText = 'Editar Sala';
    document.getElementById('btnCancSala').classList.remove('hidden');
    mudarAba('salas');
};

window.delSala = async function(id) {
    if (!confirm('Deseja mesmo excluir esta sala?')) return;
    const res = await fetch(`${URL_SALAS}/${id}`, { method: 'DELETE' });
    if (res.ok) { msg('Sala excluída.'); carregarDados(); } 
    else { const json = await res.json(); msg(json.erro, 'erro'); }
};

function cancelarEdicaoSala() {
    document.getElementById('formSala').reset();
    document.getElementById('salaId').value = '';
    document.getElementById('formSalaTitulo').innerText = 'Cadastrar Sala';
    document.getElementById('btnCancSala').classList.add('hidden');
}

function renderizarReservas() {
    const tbody = document.querySelector('#tabelaReservas tbody');
    tbody.innerHTML = reservasCache.map(r => {
        const sala = salasCache.find(s => s.id === r.salaId);
        const nomeSala = sala ? sala.nome : 'Sala Excluída';
        const dataFormatada = r.data.split('-').reverse().join('/');
        
        return `
        <tr>
            <td><strong>${dataFormatada}</strong></td>
            <td>${r.horarioInicial} - ${r.horarioFinal}</td>
            <td>${nomeSala}</td>
            <td>${r.nomeAluno}</td>
            <td>${r.participantes}</td>
            <td><span class="badge ${r.status === 'Ativa' ? 'ativa' : 'cancelada'}">${r.status}</span></td>
            <td>
                <button class="btn-warning" onclick="editRes(${r.id})">Editar</button>
                <button class="btn-danger" onclick="delRes(${r.id})">Excluir</button>
            </td>
        </tr>`;
    }).join('') || '<tr><td colspan="7">Nenhuma reserva encontrada.</td></tr>';
}

async function salvarReserva(e) {
    e.preventDefault();
    const id = document.getElementById('resId').value;
    const dados = {
        nomeAluno: document.getElementById('resAluno').value,
        email: document.getElementById('resEmail').value,
        salaId: document.getElementById('resSala').value,
        data: document.getElementById('resData').value,
        horarioInicial: document.getElementById('resHoraIni').value,
        horarioFinal: document.getElementById('resHoraFim').value,
        participantes: document.getElementById('resParticipantes').value,
        finalidade: document.getElementById('resFinalidade').value,
        status: document.getElementById('resStatus').value
    };

    const res = await fetch(id ? `${URL_RESERVAS}/${id}` : URL_RESERVAS, {
        method: id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
    });

    if (res.ok) {
        msg('Reserva confirmada!');
        cancelarEdicaoReserva();
        carregarDados();
    } else {
        const json = await res.json();
        msg(json.erro, 'erro');
    }
}

window.editRes = function(id) {
    const r = reservasCache.find(x => x.id === id);
    if (!r) return;
    document.getElementById('resId').value = r.id;
    document.getElementById('resAluno').value = r.nomeAluno;
    document.getElementById('resEmail').value = r.email;
    document.getElementById('resSala').value = r.salaId;
    document.getElementById('resData').value = r.data;
    document.getElementById('resHoraIni').value = r.horarioInicial;
    document.getElementById('resHoraFim').value = r.horarioFinal;
    document.getElementById('resParticipantes').value = r.participantes;
    document.getElementById('resFinalidade').value = r.finalidade;
    document.getElementById('resStatus').value = r.status;
    document.getElementById('formReservaTitulo').innerText = 'Editar Reserva';
    document.getElementById('btnCancRes').classList.remove('hidden');
    verificarFeriadoBrasilAPI();
    window.scrollTo(0,0);
};

window.delRes = async function(id) {
    if (!confirm('Deseja excluir permanentemente esta reserva?')) return;
    const res = await fetch(`${URL_RESERVAS}/${id}`, { method: 'DELETE' });
    if (res.ok) { msg('Reserva apagada.'); carregarDados(); }
};

function cancelarEdicaoReserva() {
    document.getElementById('formReserva').reset();
    document.getElementById('resId').value = '';
    document.getElementById('formReservaTitulo').innerText = 'Nova Reserva';
    document.getElementById('btnCancRes').classList.add('hidden');
    document.getElementById('avisoFeriado').classList.add('hidden');
}