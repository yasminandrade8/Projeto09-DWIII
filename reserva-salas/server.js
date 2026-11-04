const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const DATA_DIR = path.join(__dirname, 'data');
const SALAS_FILE = path.join(DATA_DIR, 'salas.json');
const RESERVAS_FILE = path.join(DATA_DIR, 'reservas.json');

function garantirArquivos() {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(SALAS_FILE)) fs.writeFileSync(SALAS_FILE, JSON.stringify([]));
    if (!fs.existsSync(RESERVAS_FILE)) fs.writeFileSync(RESERVAS_FILE, JSON.stringify([]));
}

function ler(file) {
    garantirArquivos();
    try { return JSON.parse(fs.readFileSync(file, 'utf8')); } 
    catch (e) { return []; }
}

function salvar(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

function servirEstatico(req, res) {
    let urlCaminho = req.url === '/' ? '/index.html' : req.url;
    let filePath = path.join(__dirname, 'public', urlCaminho);
    const extname = path.extname(filePath);
    let contentType = 'text/html';

    switch (extname) {
        case '.css': contentType = 'text/css'; break;
        case '.js': contentType = 'text/javascript'; break;
        case '.json': contentType = 'application/json'; break;
    }

    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ erro: 'Recurso não encontrado.' }));
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
}

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    const urlParts = req.url.split('?')[0].split('/');

    if (urlParts[1] === 'api') {
        const recurso = urlParts[2];
        const id = urlParts[3] ? parseInt(urlParts[3]) : null;

        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });

        req.on('end', () => {
            let dados = body ? JSON.parse(body) : null;

            if (recurso === 'salas') {
                let salas = ler(SALAS_FILE);

                if (req.method === 'GET' && !id) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify(salas));
                }
                if (req.method === 'GET' && id) {
                    const sala = salas.find(s => s.id === id);
                    if (!sala) return errorRes(res, 404, 'Sala não encontrada.');
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify(sala));
                }
                if (req.method === 'POST' && !id) {
                    if (!dados.nome || !dados.localizacao || !dados.capacidade || !dados.status) {
                        return errorRes(res, 400, 'Preencha todos os campos obrigatórios.');
                    }
                    const novaSala = {
                        id: salas.length ? Math.max(...salas.map(s => s.id)) + 1 : 1,
                        nome: dados.nome,
                        localizacao: dados.localizacao,
                        capacidade: Number(dados.capacidade),
                        recursos: dados.recursos || '',
                        status: dados.status
                    };
                    salas.push(novaSala);
                    salvar(SALAS_FILE, salas);
                    res.writeHead(201, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify(novaSala));
                }
                if (req.method === 'PUT' && id) {
                    const index = salas.findIndex(s => s.id === id);
                    if (index === -1) return errorRes(res, 404, 'Sala não encontrada.');
                    
                    salas[index] = { ...salas[index], ...dados, capacidade: Number(dados.capacidade) };
                    salvar(SALAS_FILE, salas);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify(salas[index]));
                }
                if (req.method === 'DELETE' && id) {
                    const reservas = ler(RESERVAS_FILE);
                    if (reservas.some(r => r.salaId === id)) {
                        return errorRes(res, 400, 'Não é possível excluir salas que possuam reservas vinculadas.');
                    }
                    salas = salas.filter(s => s.id !== id);
                    salvar(SALAS_FILE, salas);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ mensagem: 'Sala excluída com sucesso.' }));
                }
            }

            else if (recurso === 'reservas') {
                let reservas = ler(RESERVAS_FILE);
                let salas = ler(SALAS_FILE);

                if (req.method === 'GET' && !id) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify(reservas));
                }
                if ((req.method === 'POST' && !id) || (req.method === 'PUT' && id)) {
                    if (!dados.nomeAluno || !dados.salaId || !dados.data || !dados.horarioInicial || !dados.horarioFinal || !dados.participantes) {
                        return errorRes(res, 400, 'Preencha todos os campos obrigatórios da reserva.');
                    }
                    if (dados.horarioFinal <= dados.horarioInicial) {
                        return errorRes(res, 400, 'O horário final deve ser posterior ao inicial.');
                    }

                    const sala = salas.find(s => s.id === Number(dados.salaId));
                    if (!sala) return errorRes(res, 404, 'Sala inexistente.');
                    if (sala.status !== 'Disponível' && req.method === 'POST') {
                        return errorRes(res, 400, 'Esta sala está inativa e não pode receber reservas.');
                    }
                    if (Number(dados.participantes) > sala.capacidade) {
                        return errorRes(res, 400, `Capacidade excedida. A sala suporta no máximo ${sala.capacidade} pessoas.`);
                    }

                    const conflito = reservas.some(r => 
                        r.salaId === Number(dados.salaId) && 
                        r.data === dados.data && 
                        r.status === 'Ativa' &&
                        r.id !== id && 
                        (dados.horarioInicial < r.horarioFinal && dados.horarioFinal > r.horarioInicial)
                    );

                    if (conflito) return errorRes(res, 409, 'Conflito de horários! A sala já possui uma reserva ativa neste período.');

                    if (req.method === 'POST') {
                        const novaReserva = {
                            id: reservas.length ? Math.max(...reservas.map(r => r.id)) + 1 : 1,
                            nomeAluno: dados.nomeAluno,
                            email: dados.email || '',
                            salaId: Number(dados.salaId),
                            data: dados.data,
                            horarioInicial: dados.horarioInicial,
                            horarioFinal: dados.horarioFinal,
                            participantes: Number(dados.participantes),
                            finalidade: dados.finalidade || '',
                            status: dados.status || 'Ativa'
                        };
                        reservas.push(novaReserva);
                        salvar(RESERVAS_FILE, reservas);
                        res.writeHead(201, { 'Content-Type': 'application/json' });
                        return res.end(JSON.stringify(novaReserva));
                    } else {
                        const index = reservas.findIndex(r => r.id === id);
                        if (index === -1) return errorRes(res, 404, 'Reserva não encontrada.');
                        reservas[index] = { ...reservas[index], ...dados, salaId: Number(dados.salaId), participantes: Number(dados.participantes) };
                        salvar(RESERVAS_FILE, reservas);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        return res.end(JSON.stringify(reservas[index]));
                    }
                }
                if (req.method === 'DELETE' && id) {
                    reservas = reservas.filter(r => r.id !== id);
                    salvar(RESERVAS_FILE, reservas);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ mensagem: 'Reserva excluída.' }));
                }
            } else {
                return errorRes(res, 404, 'Rota inexistente.');
            }
        });
    } else {
        servirEstatico(req, res);
    }
});

function errorRes(res, status, msg) {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ erro: msg }));
}

server.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));