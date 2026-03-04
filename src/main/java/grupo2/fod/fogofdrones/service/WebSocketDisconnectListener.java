package grupo2.fod.fogofdrones.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private static final Logger LOGGER = LoggerFactory.getLogger(WebSocketDisconnectListener.class);

    private final SesionJugadores sesionJugadores;
    private final Servicios servicios;
    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper mapper = new ObjectMapper();

    public WebSocketDisconnectListener(
            SesionJugadores sesionJugadores,
            Servicios servicios,
            SimpMessagingTemplate messagingTemplate) {
        this.sesionJugadores = sesionJugadores;
        this.servicios = servicios;
        this.messagingTemplate = messagingTemplate;
    }

    @EventListener
    public void onDisconnect(SessionDisconnectEvent event) {
        StompHeaderAccessor sha = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = sha.getSessionId();

        String nombre = sesionJugadores.obtenerJugador(sessionId);
        sesionJugadores.eliminarPorSession(sessionId);

        if (nombre == null || nombre.isBlank()) {
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

        String canal = "/topic/" + nombreNaval + "-" + nombreAereo;

        try {
            VoMensaje finMsg = VoMensaje.builder()
                    .tipoMensaje(5)
                    .evento("La partida ha terminado por abandono")
                    .nombre(ganador.toString())
                    .fasePartida(FasePartida.TERMINADO)
                    .build();
            messagingTemplate.convertAndSend(canal, mapper.writeValueAsString(finMsg));
        } catch (Exception ex) {
            LOGGER.error("Error enviando finalización por abandono (canal={})", canal, ex);
        }

        try {
            servicios.finalizarPartida(nombreNaval, nombreAereo);
        } catch (Exception ex) {
            LOGGER.error("Error finalizando partida por abandono {} vs {}", nombreNaval, nombreAereo, ex);
        }

        LOGGER.info("Partida finalizada por abandono. Desconectado='{}', ganador={}", nombre, ganador);
    }
}
