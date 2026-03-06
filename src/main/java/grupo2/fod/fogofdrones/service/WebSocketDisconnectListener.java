package grupo2.fod.fogofdrones.service;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import com.fasterxml.jackson.databind.ObjectMapper;

import grupo2.fod.fogofdrones.service.logica.Equipo;
import grupo2.fod.fogofdrones.service.logica.FasePartida;
import grupo2.fod.fogofdrones.service.logica.Partida;
import grupo2.fod.fogofdrones.service.logica.Servicios;
import grupo2.fod.fogofdrones.service.valueObject.VoMensaje;

@Component
public class WebSocketDisconnectListener {

    private final SesionJugadores sesionJugadores;
    private final Servicios servicios;
    private final GameHandler gameHandler;
    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper mapper = new ObjectMapper();

    // Limpieza diferida para evitar partidas colgadas si ambos clientes cierran.
    // También da un margen para que el rival termine de suscribirse y reciba FINALIZACION.
    private static final ScheduledExecutorService CLEANUP_EXECUTOR = Executors.newSingleThreadScheduledExecutor(r -> {
        Thread t = new Thread(r, "fogofdrones-disconnect-cleanup");
        t.setDaemon(true);
        return t;
    });

    // Pendientes de abandono por jugador (para dar tiempo a reconectar en refresh)
    private final ConcurrentMap<String, ScheduledFuture<?>> abandonoPendientePorJugador = new ConcurrentHashMap<>();

    public WebSocketDisconnectListener(
            SesionJugadores sesionJugadores,
            Servicios servicios,
            GameHandler gameHandler,
            SimpMessagingTemplate messagingTemplate) {
        this.sesionJugadores = sesionJugadores;
        this.servicios = servicios;
        this.gameHandler = gameHandler;
        this.messagingTemplate = messagingTemplate;
    }

    @EventListener
    public void onDisconnect(SessionDisconnectEvent event) {
        StompHeaderAccessor sha = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = sha.getSessionId();

        String nombre = sesionJugadores.eliminarPorSession(sessionId);

        if (nombre == null || nombre.isBlank()) {
            return;
        }

        // Si no estaba en partida, puede estar esperando en lobby/carga.
        // Limpiar inmediatamente para que nadie se empareje con un "fantasma".
        Partida partidaActual = servicios.getPartidaJugador(nombre);
        if (partidaActual == null) {
            try {
                gameHandler.limpiarColasPorDesconexion(nombre);
            } catch (Exception e) {
                e.printStackTrace();
            }
            return;
        }

        // Gracia: si es un refresh, el jugador suele reconectar enseguida.
        // Programamos el abandono y lo cancelamos si el jugador vuelve a tener sesión activa.
        ScheduledFuture<?> anterior = abandonoPendientePorJugador.remove(nombre);
        if (anterior != null) {
            anterior.cancel(false);
        }

        ScheduledFuture<?> futuro = CLEANUP_EXECUTOR.schedule(() -> {
            abandonoPendientePorJugador.remove(nombre);

            // Si el jugador ya reconectó, no considerar abandono.
            if (sesionJugadores.tieneSesionActiva(nombre)) {
                return;
            }

            Partida p = servicios.getPartidaJugador(nombre);
            if (p == null) {
                return;
            }
            if (p.getFasePartida() == FasePartida.TERMINADO) {
                return;
            }

            String nombreNaval = p.getJugadorNaval().getNombre();
            String nombreAereo = p.getJugadorAereo().getNombre();

            Equipo ganador = nombre.equals(nombreNaval) ? Equipo.AEREO : Equipo.NAVAL;
            p.finalizarPorAbandono(ganador);

            // Marcar finalización por abandono para re-enviar FINALIZACION si un cliente llega tarde.
            servicios.marcarFinalizacionPendiente(nombreNaval, nombreAereo);

            String canal = "/topic/" + nombreNaval + "-" + nombreAereo;

            try {
                VoMensaje finMsg = VoMensaje.builder()
                        .tipoMensaje(5)
                        .evento("La partida ha terminado por abandono")
                        .nombre(ganador.toString())
                        .fasePartida(FasePartida.TERMINADO)
                        .build();
                messagingTemplate.convertAndSend(canal, mapper.writeValueAsString(finMsg));
            } catch (Exception e) {
                e.printStackTrace();
            }

            // No finalizar y eliminar inmediatamente: el rival puede aún no haberse suscrito.
            // Se deja la partida en estado TERMINADO y se limpia/puntúa luego (o antes si llega ACTUALIZAR).
            CLEANUP_EXECUTOR.schedule(() -> {
                try {
                    servicios.finalizarPartida(nombreNaval, nombreAereo);
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }, 15, TimeUnit.SECONDS);

        }, 10, TimeUnit.SECONDS);

        abandonoPendientePorJugador.put(nombre, futuro);
    }
}
