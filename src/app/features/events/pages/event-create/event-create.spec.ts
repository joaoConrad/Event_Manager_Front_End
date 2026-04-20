import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventCreate } from './event-create';

describe('EventCreate', () => {
  let component: EventCreate;
  let fixture: ComponentFixture<EventCreate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventCreate],
    }).compileComponents();

    fixture = TestBed.createComponent(EventCreate);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });


type Evento = {
    id: number;
    nome: string;
    maxParticipantes: number;
    participantes: number[];
};

class EventManager {
    private eventos: Evento[] = [];

    criarEvento(evento: Evento): void {
        this.eventos.push(evento);
    }

    buscarEvento(eventoId: number): Evento | undefined {
        return this.eventos.find(e => e.id === eventoId);
    }

    inscreverUsuario(eventoId: number, usuarioId: number): string {
        const evento = this.buscarEvento(eventoId);

        if (!evento) {
            return "Evento não encontrado";
        }

        if (evento.participantes.length >= evento.maxParticipantes) {
            return "Evento lotado";
        }

        if (evento.participantes.includes(usuarioId)) {
            return "Usuário já inscrito";
        }

        evento.participantes.push(usuarioId);

        return "Inscrição confirmada";
    }
}
  
});
