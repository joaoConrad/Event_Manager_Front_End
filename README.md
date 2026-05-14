# Event Manager — Frontend

Sistema web para gerenciamento de eventos. Usuários encontram, participam e acompanham eventos; administradores criam e controlam tudo com visibilidade em tempo real.

> Projeto acadêmico — Disciplina de Programação Web · URI

---

## Stack

![Angular](https://img.shields.io/badge/Angular-19-dd0031?style=flat-square&logo=angular)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript)
![Chart.js](https://img.shields.io/badge/Chart.js-4-ff6384?style=flat-square&logo=chartdotjs)

**Frontend:** Angular 19 · TypeScript · Chart.js · ng2-charts · QRCode  
**Backend:** Node.js · Express · Sequelize · JWT  
**Repositório backend:** [event-management-api](https://github.com/limarobs/event-management-api)

---

## Funcionalidades

### Usuário
- Cadastro, login e logout com refresh token automático
- Listagem de eventos com filtros por título, data, status e **inscrição**
- Inscrição e cancelamento em eventos
- QR code pessoal gerado a partir do token de inscrição
- Atualização automática do status de check-in sem recarregar a página

### Administrador
- Criação, edição e exclusão de eventos com upload de imagem de capa
- Check-in de participantes via token — bloqueio automático de duplicatas
- Histórico de alterações por evento
- Dashboard com métricas, gráficos de inscritos e status, e tabela paginada

---

## Regras de Negócio

- Usuário não pode se inscrever duas vezes no mesmo evento
- Eventos têm limite de participantes — vagas liberadas ao cancelar inscrição
- Não é possível criar eventos com data/horário no passado
- Após check-in confirmado, cancelamento de inscrição é bloqueado
- Eventos encerrados e esgotados não permitem novas inscrições
- Check-in só pode ser realizado uma vez por participante

---

## Estrutura do Projeto

```
src/app/
├── core/
│   ├── guards/          # auth e admin
│   ├── interceptors/    # JWT + refresh automático
│   └── services/        # auth, event, participant, history, theme
├── features/
│   ├── auth/            # login, registro, perfil
│   ├── events/          # listagem, detalhe, criação/edição, qr-checkin
│   ├── admin/           # dashboard
│   └── home/            # carrossel de destaques
├── models/              # EventModel, ParticipantModel, HistoryModel
└── components/
    └── footer/
```

---

## Como Rodar

**Pré-requisito:** ter o backend rodando em `http://localhost:3000`

```bash
git clone https://github.com/joaoConrad/Event_Manager_Front_End.git
cd Event_Manager_Front_End
npm install
ng serve
```

Acesse em `http://localhost:4200`

### Gerar QR code (opcional)

```bash
npm install qrcode @types/qrcode
```

Sem a lib, o token de acesso é exibido em texto — a funcionalidade funciona normalmente.

---

## Autores

| Nome | GitHub |
|---|---|
| Bruno H. | [@brunoHemann](https://github.com/brunohermann) |
| Pedro C. | [@pedroCopette](https://github.com/PedroCopette) |
| Murilo C. | [@muriloConterato](https://github.com/Murilocon25) |
| João C. | [@joaoConrad](https://github.com/joaoConrad) |