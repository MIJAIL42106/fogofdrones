package grupo2.fod.fogofdrones.service;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

import org.springframework.stereotype.Component;

//Registro simple: asocia sesión STOMP con nombre de jugador.Se usa para detectar desconexiones (recarga/cierre) y finalizar por abandono.
@Component
public class SesionJugadores {

    private final ConcurrentMap<String, String> jugadorPorSession = new ConcurrentHashMap<>();
    private final ConcurrentMap<String, String> sessionPorJugador = new ConcurrentHashMap<>();

    public void registrar(String sessionId, String nombreJugador) {
        if (sessionId == null || sessionId.isBlank() || nombreJugador == null || nombreJugador.isBlank()) {
            return;
        }

        // Si el jugador ya tenía una sesión registrada, limpiar el índice viejo.
        String sessionAnterior = sessionPorJugador.put(nombreJugador, sessionId);
        if (sessionAnterior != null && !sessionAnterior.equals(sessionId)) {
            jugadorPorSession.remove(sessionAnterior, nombreJugador);
        }
        jugadorPorSession.put(sessionId, nombreJugador);
    }

    public String obtenerJugador(String sessionId) {
        if (sessionId == null) {
            return null;
        }
        return jugadorPorSession.get(sessionId);
    }

    //Elimina el vínculo de una sesión y devuelve el nombre asociado (si existía).
    public String eliminarPorSession(String sessionId) {
        if (sessionId == null) {
            return null;
        }
        String nombre = jugadorPorSession.remove(sessionId);
        if (nombre != null) {
            sessionPorJugador.remove(nombre, sessionId);
        }
        return nombre;
    }

    public boolean tieneSesionActiva(String nombreJugador) {
        if (nombreJugador == null || nombreJugador.isBlank()) {
            return false;
        }
        return sessionPorJugador.containsKey(nombreJugador);
    }
}
