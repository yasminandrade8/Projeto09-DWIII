# 🏛️ Projeto 09 - Sistema de Reserva de Salas (CRUD + API REST + BrasilAPI)
> **Disciplina:** Desenvolvimento Web III
> **Linguagem:** HTML5, JSON, CSS3 e JavaScript (Node.js) 

Aplicação web completa desenvolvida para o gerenciamento de reservas de salas de estudo e laboratórios em uma instituição de ensino. O sistema permite consultar ambientes disponíveis, realizar agendamentos acadêmicos e valida automaticamente regras rigorosas de conflito de horários e capacidade.

O projeto foi construído utilizando **Node.js nativo (sem frameworks)** no back-end, complementado por uma interface web moderna, responsiva e assíncrona com HTML5, CSS3 e JavaScript puro no front-end.

## 🚀 Funcionalidades e Regras de Negócio

* **Gestão de Salas (CRUD):** Cadastro e manutenção de salas e laboratórios, incluindo recursos e status (Disponível/Inativa).
* **Gestão de Reservas (CRUD):** Criação de agendamentos acadêmicos vinculados às salas.
* **Motor de Validação Restrita (Regras de Negócio):**
  * **Conflito de Horários:** Bloqueia automaticamente a tentativa de reservar uma mesma sala no mesmo dia com horários sobrepostos.
  * **Limite de Capacidade:** Impede reservas onde a quantidade de participantes excede a capacidade máxima cadastrada para a sala.
  * **Disponibilidade:** Salas marcadas como "Inativas" não aceitam novas reservas.
  * **Lógica Temporal:** O horário final da reserva deve obrigatoriamente ser posterior ao inicial.
  * **Integridade Relacional:** Proíbe a exclusão de salas que já possuam reservas vinculadas.
* **Integração Externa (BrasilAPI):** Consulta em tempo real de feriados nacionais. Caso a data escolhida para a reserva seja um feriado, o sistema exibe um alerta preventivo na interface (sem bloquear a operação).
* **Persistência Local:** Armazenamento em arquivos JSON, mantendo o estado da aplicação salvo.

## 🛠️ Tecnologias Utilizadas

* **Back-end:** Node.js (Módulos nativos: `http`, `fs`, `path`)
* **Front-end:** HTML5, CSS3, JavaScript (Fetch API, Manipulação de DOM)
* **Base de Dados:** Ficheiros JSON (`data/salas.json` e `data/reservas.json`)
* **API Externa:** [BrasilAPI (Módulo Feriados Nacionais)](https://brasilapi.com.br/docs#tag/Feriados-Nacionais)

## 📂 Estrutura do Projeto

```text
reserva-salas/
│
├── data/
│   ├── salas.json          # Persistência de dados das salas
│   └── reservas.json       # Persistência de dados das reservas
├── public/
│   ├── index.html          # Interface web com abas dinâmicas
│   ├── style.css           # Estilização e responsividade
│   └── script.js           # Lógica do client-side e consumo da API
├── server.js               # Servidor HTTP Node.js e rotas da API REST
├── package.json            # Metadados do projeto Node
└── README.md               # Documentação oficial
```

## ⚙️ Como Executar o Projeto

Certifique-se de ter o **Node.js** instalado na sua máquina.

1. Abra a pasta do projeto no seu terminal.
2. Inicie o servidor executando o comando:
   ```bash
   node server.js
   ```
3. Abra o seu navegador e acesse a aplicação em:
   ```text
   http://localhost:3000
   ```

## 🔌 Documentação da API REST

### Endpoints de Salas

| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/salas` | Lista todas as salas e laboratórios |
| `GET` | `/api/salas/:id` | Consulta os dados de uma sala específica |
| `POST` | `/api/salas` | Cadastra uma nova sala |
| `PUT` | `/api/salas/:id` | Atualiza os dados de uma sala |
| `DELETE` | `/api/salas/:id` | Exclui uma sala (bloqueado se houver reservas) |

### Endpoints de Reservas

| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/reservas` | Lista todas as reservas efetuadas |
| `GET` | `/api/reservas/:id` | Consulta uma reserva específica |
| `POST` | `/api/reservas` | Cria um novo agendamento (valida conflitos e lotação) |
| `PUT` | `/api/reservas/:id` | Atualiza uma reserva existente |
| `DELETE` | `/api/reservas/:id` | Cancela/exclui uma reserva |

---
## 👩‍💻 Autora
Feito com 💜 por Yasmin Andrade