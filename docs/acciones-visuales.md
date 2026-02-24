# Acciones de juego detectadas y eventos base

Este documento resume las acciones jugables existentes y los eventos semánticos preparados para UI.

## Acciones existentes en la lógica

- `DESPLIEGUE` (`Partida.desplegarDron`): despliegue inicial por equipo.
- `MOVER` (`Partida.mover`): mover dron dentro de rango.
- `ATACAR` (`Partida.atacar`): ataque a dron enemigo o portadrones enemigo.
- `RECARGAR` (`Partida.recargarMunicion`): recarga de munición.
- `PASAR` (`Partida.terminarTurno`): fin de turno manual.

## Condiciones de estado relevantes

- Cambio de turno (`turno` cambia de `NAVAL` a `AEREO` o viceversa).
- Cambio de fase (`DESPLIEGUE`, `JUGANDO`, `MUERTE_SUBITA`, `TERMINADO`).
- Destrucción de dron (disminuye cantidad de drones de un equipo).
- Daño a portadrones (disminuye vida del portadrones de un equipo).
- Fin de partida (`fase = TERMINADO`) y cálculo de ganador (`Partida.getEquipoGanador`).

## Eventos semánticos enviados en `VoMensaje.eventos`

- `DESPLIEGUE_DRON`
- `MOVER_DRON`
- `ATAQUE_DRON`
- `DESTRUCCION_DRON`
- `IMPACTO_PORTADRONES`
- `IMPACTO_SIN_BAJA`
- `RECARGA_DRON`
- `CAMBIO_TURNO`
- `CAMBIO_FASE`
- `VICTORIA`
- `DERROTA`
- `EMPATE`
- `ACCION_INVALIDA_O_SIN_CAMBIO`

## Consumo en frontend

La escena `partida` (`escena3.js`) ya publica:

- Evento batch: `window` -> `fog:visual-events`
- Evento individual: `window` -> `fog:visual-event`

Con esto, el equipo puede conectar paneles, popups, banners o animaciones sin tocar la lógica principal del juego.