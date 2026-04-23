# Event Manager

Sistema web para gerenciamento de eventos — permite que usuários encontrem, participem e acompanhem eventos de forma simples e intuitiva.

---

## Visão Geral

Aplicação frontend desenvolvida em Angular, com foco em experiência do usuário, controle de acesso por perfis e regras de negócio reais.

---

## Funcionalidades

### Usuário
- Cadastro e login
- Listagem e visualização de eventos
- Inscrição e cancelamento de inscrição em eventos
- Visualização de eventos esgotados

### Administrador
- Criação, edição e exclusão de eventos
- Validação de datas (eventos no passado são bloqueados)

---

## Regras de Negócio

- Um usuário não pode se inscrever duas vezes no mesmo evento
- Eventos possuem limite de participantes
- Eventos esgotados não permitem novas inscrições
- Não é permitido criar eventos com data/horário no passado
- O cancelamento de inscrição libera a vaga automaticamente

---

## Tecnologias

Angular · TypeScript · HTML5 · CSS3

---

## Estrutura do Projeto

```
src/
└── app/
    ├── core/
    │   ├── services/
    │   └── guards/
    ├── features/
    │   ├── auth/
    │   ├── events/
    │   └── home/
    ├── components/
    │   └── footer/
    ├── models/
    ├── app.routes.ts
    └── app.config.ts
```

---

## Como Rodar

```bash
git clone https://github.com/joaoConrad/Event_Manager_Front_End.git
cd Event_Manager_Front_End
npm install
ng serve
```

Acesse em: `http://localhost:4200`

---

## Contexto Acadêmico

Projeto desenvolvido para a disciplina de Programação Web, com aplicação prática de Angular, consumo de API REST e regras de negócio reais.

---

## Autores

Bruno H. · Pedro C. · Murilo C. · João C.

---

## Repositório

[github.com/joaoConrad/Event_Manager_Front_End](https://github.com/joaoConrad/Event_Manager_Front_End)