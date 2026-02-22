package grupo2.fod.fogofdrones.service;

import grupo2.fod.fogofdrones.service.logica.Partida;
import grupo2.fod.fogofdrones.service.logica.Jugador;
import grupo2.fod.fogofdrones.service.logica.Posicion;
import grupo2.fod.fogofdrones.service.logica.FasePartida;
import grupo2.fod.fogofdrones.service.logica.Equipo;
import grupo2.fod.fogofdrones.service.valueObject.VoMensaje;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.annotation.SubscribeMapping;
import org.springframework.stereotype.Controller;

// Controlador que administra las conexiones STOMP para el juego
@Controller
public class GameHandler {
	
	private static final Logger LOGGER = LoggerFactory.getLogger(GameHandler.class);
	
	@Autowired
	private SimpMessagingTemplate messagingTemplate;
	
	private ObjectMapper mapper = new ObjectMapper();
	
	// Mapa de partidas activas (para manejar múltiples juegos simultáneos)
	// En esta versión simple, usamos una sola partida global
	private Partida p = null;
	private Jugador jugador1 = null;
	private Jugador jugador2 = null;
	
	// Map para trackear sesiones de jugadores (opcional, para futuras mejoras)
	private final ConcurrentHashMap<String, String> jugadorSessions = new ConcurrentHashMap<>();
	
	/**
	 * Endpoint principal que maneja todas las acciones del juego
	 * Los clientes envían mensajes a /app/accion
	 * Las respuestas se envían a /topic/game para que todos los suscritos las reciban
	 */
	@MessageMapping("/accion")
	public void handleAction(@Payload Map<String, Object> data) {
		try {
			LOGGER.info("========== MENSAJE RECIBIDO ==========");
			LOGGER.info("Datos completos: {}", data);
			
			String nombre = (String) data.get("nombre");
			
			LOGGER.info("Acción recibida de: {}", nombre);
			LOGGER.info("Estado actual - jugador1: {}, jugador2: {}, partida existe: {}", 
				jugador1 != null ? jugador1.getNombre() : "null", 
				jugador2 != null ? jugador2.getNombre() : "null",
				p != null);
			
			// Si no hay partida, intentar crear jugadores
			if (p == null) {
				LOGGER.info("No hay partida creada, intentando crear jugador...");
				handleCrearJugador(nombre);
			} else if (p.esMiTurno(nombre)) {
				// Si es el turno del jugador, procesar la acción
				String accion = (String) data.get("accion");
				LOGGER.info("{} - {}", nombre, accion);
				
				if (p.getFasePartida() == FasePartida.DESPLIEGUE) {
					handleDesplegar(data);
				} else {
					switch (accion) {
						case "MOVER":
							handleMover(data);
							break;
						case "ATACAR":
							handleAtacar(data);
							break;
						case "RECARGAR":
							handleRecargar(data);
							break;
						default:
							LOGGER.warn("Acción desconocida: {}", accion);
							break;
					}
				}
				
				// Enviar estado actualizado a todos los clientes
				LOGGER.info("Enviando estado actualizado después de acción...");
				String respuesta = mensajeRetorno();
				messagingTemplate.convertAndSend("/topic/game", respuesta);
				LOGGER.info("Estado actualizado enviado a todos los clientes");
				
			} else {
				LOGGER.info("No es tu turno: {}", nombre);
				// Enviar mensaje de error al jugador
				VoMensaje mensajeError = new VoMensaje(nombre, "No es tu turno");
				String respuesta = mapper.writeValueAsString(mensajeError);
				messagingTemplate.convertAndSend("/topic/game", respuesta);
			}
			
		} catch (Exception e) {
			LOGGER.error("Error procesando acción: {}", e.getMessage(), e);
		}
	}
	
	/**
	 * Maneja la creación de jugadores y partida
	 */
	private void handleCrearJugador(String nombre) {
		try {
			if (jugador1 == null) {
				jugador1 = new Jugador(nombre, 0, 0);
				LOGGER.info("Jugador 1 creado: {}", jugador1.getNombre());
				
				// Notificar al jugador 1 que es NAVAL
				VoMensaje mensaje = new VoMensaje(nombre, Equipo.NAVAL);
				String respuesta = mapper.writeValueAsString(mensaje);
				LOGGER.info("Enviando asignación NAVAL al jugador 1: {}", respuesta);
				messagingTemplate.convertAndSend("/topic/game", respuesta);
				
			} else if (jugador2 == null && !jugador1.getNombre().equals(nombre)) {
				jugador2 = new Jugador(nombre, 0, 0);
				LOGGER.info("Jugador 2 creado: {}", jugador2.getNombre());
				p = new Partida(jugador1, jugador2);
				LOGGER.info("Partida creada con jugadores: {} y {}", jugador1.getNombre(), jugador2.getNombre());
				
				// Notificar al jugador 2 que es AEREO
				VoMensaje mensaje = new VoMensaje(nombre, Equipo.AEREO);
				String respuesta = mapper.writeValueAsString(mensaje);
				LOGGER.info("Enviando asignación AEREO al jugador 2: {}", respuesta);
				messagingTemplate.convertAndSend("/topic/game", respuesta);
				
				// Enviar estado inicial del juego a todos los jugadores
				String estadoInicial = mensajeRetorno();
				LOGGER.info("Enviando estado inicial de la partida (tamaño: {} chars)", estadoInicial != null ? estadoInicial.length() : 0);
				messagingTemplate.convertAndSend("/topic/game", estadoInicial);
				LOGGER.info("Estado inicial de la partida enviado a todos los jugadores");
			} else {
				LOGGER.warn("Intento de conexión duplicada del jugador: {}", nombre);
			}
		} catch (Exception e) {
			LOGGER.error("Error al crear jugador: {}", e.getMessage(), e);
		}
	}
		
	/**
	 * Maneja el despliegue de drones en la fase inicial
	 */
	public void handleDesplegar(Map<String, Object> data) {
		int x = (int) data.get("xi");
		int y = (int) data.get("yi");
		Posicion pos = new Posicion(x, y);

		p.desplegarDron(pos);

		LOGGER.info("Dron desplegado en: {}, {}", x, y);
		LOGGER.info("Turno: {}", p.getTurno());
	}

	/**
	 * Maneja el movimiento de drones
	 */
	public void handleMover(Map<String, Object> data) {
		int xi = (int) data.get("xi");
		int yi = (int) data.get("yi");
		Posicion posi = new Posicion(xi, yi);
		int xf = (int) data.get("xf");
		int yf = (int) data.get("yf");
		Posicion posf = new Posicion(xf, yf);
		
		p.mover(posi, posf);
		p.terminarTurno();

		LOGGER.info("Dron se movió desde: {}, {} hasta: {}, {}", xi, yi, xf, yf);
		LOGGER.info("Turno: {}", p.getTurno());
	}

	/**
	 * Maneja los ataques entre drones
	 */
	public void handleAtacar(Map<String, Object> data) {
		int xi = (int) data.get("xi");
		int yi = (int) data.get("yi");
		Posicion posi = new Posicion(xi, yi);
		int xf = (int) data.get("xf");
		int yf = (int) data.get("yf");
		Posicion posf = new Posicion(xf, yf);
		
		p.atacar(posi, posf);
		p.terminarTurno();

		LOGGER.info("Dron atacó desde: {}, {} hasta: {}, {}", xi, yi, xf, yf);
		LOGGER.info("Turno: {}", p.getTurno());
	}

	/**
	 * Maneja la recarga de munición
	 */
	public void handleRecargar(Map<String, Object> data) {
		int x = (int) data.get("xi");
		int y = (int) data.get("yi");
		Posicion pos = new Posicion(x, y);
		
		p.recargarMunicion(pos);

		LOGGER.info("Dron recargó munición en: {}, {}", x, y);
		LOGGER.info("Turno: {}", p.getTurno());
	}

	/**
	 * Genera el mensaje de retorno con el estado actual del juego
	 */
	public String mensajeRetorno() {
		String t = null;
		try {
			LOGGER.info("Generando mensaje de retorno...");
			// Crear VoMensaje con la fase y la grilla completa
			VoMensaje mensaje = new VoMensaje(p.getFasePartida(), p.getTablero());
			t = mapper.writeValueAsString(mensaje);
			LOGGER.info("Estado del juego serializado exitosamente - Tamaño: {} chars", t.length());
			LOGGER.debug("Contenido del mensaje (primeros 200 chars): {}", t.substring(0, Math.min(200, t.length())));
		} catch (Exception e) {
			LOGGER.error("Error al serializar el estado del juego", e);
			e.printStackTrace();
		}
		return t;
	}
	
	/**
	 * Método opcional para reiniciar la partida
	 */
	public void reiniciarPartida() {
		this.p = null;
		this.jugador1 = null;
		this.jugador2 = null;
		this.jugadorSessions.clear();
		LOGGER.info("Partida reiniciada");
	}

}
