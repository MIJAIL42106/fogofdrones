package grupo2.fod.fogofdrones.service;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

import org.springframework.stereotype.Component;

/**
 * Registro simple: asocia sesión STOMP con nombre de jugador.
 * Se usa para detectar desconexiones (recarga/cierre) y finalizar por abandono.
 */
@Component
public class SesionJugadores {

    private final ConcurrentMap<String, String> jugadorPorSession = new ConcurrentHashMap<>();

    public void registrar(String sessionId, String nombreJugador) {
        if (sessionId == null || sessionId.isBlank() || nombreJugador == null || nombreJugador.isBlank()) {
            return;
        }
        jugadorPorSession.put(sessionId, nombreJugador);
    }

    public String obtenerJugador(String sessionId) {
        if (sessionId == null) {
            return null;
        }
        return jugadorPorSession.get(sessionId);
    }

    public void eliminarPorSession(String sessionId) {
        if (sessionId == null) {
            return;
        }
        jugadorPorSession.remove(sessionId);
    }
}
