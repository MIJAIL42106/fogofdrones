package grupo2.fod.fogofdrones.service;

// ver como adaptar a servicios usando varias partidas
import java.util.Map;
import java.util.List;
import java.util.ArrayList;
import java.util.LinkedHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import com.fasterxml.jackson.databind.ObjectMapper;

import grupo2.fod.fogofdrones.service.logica.Equipo;
import grupo2.fod.fogofdrones.service.logica.FasePartida;
import grupo2.fod.fogofdrones.service.logica.Partida;
import grupo2.fod.fogofdrones.service.logica.Posicion;
import grupo2.fod.fogofdrones.service.logica.Servicios;
import grupo2.fod.fogofdrones.service.logica.Dron;
import grupo2.fod.fogofdrones.service.valueObject.VoMensaje;

// Controlador que administra las conexiones STOMP para el juego
@Controller
public class GameHandler {

	private static final Logger LOGGER = LoggerFactory.getLogger(GameHandler.class);
	
	@Autowired
	private SimpMessagingTemplate messagingTemplate;
	
	@Autowired
	private Servicios servicios;
	private String jugador1 = null;
	private String jugador2 = null;
	
	private ObjectMapper mapper = new ObjectMapper();
	
	@MessageMapping("/login")
	public void handleActionMenu(@Payload Map<String, Object> data) {
		try {
			String nombre = (String) data.get("nombre");
			LOGGER.info("Login solicitado por '{}'", nombre);

			if (nombre == null || nombre.trim().isEmpty()) {
				enviarErrorLogin("", "Nombre inválido");
				LOGGER.warn("Login rechazado: nombre vacío o nulo");
				return;
			}

			if (servicios.existePartida(nombre)) {
				enviarErrorLogin(nombre, "El jugador ya está en una partida activa");
				LOGGER.warn("Login rechazado para '{}': ya tiene partida activa", nombre);
			} else {
				handleCrearJugador(nombre);
			}
		} catch (Exception e) {
			LOGGER.error("Error procesando login", e);
		}
	}
	/**
	 * Endpoint principal que maneja todas las acciones del juego
	 * Los clientes envían mensajes a /app/accion
	 * Las respuestas se envían a /topic/game para que todos los suscritos las reciban
	 */
	@MessageMapping("/accion")
	public void handleAction(@Payload Map<String, Object> data) {
		List<Map<String, Object>> eventosVisuales = new ArrayList<>();
		try {
			//LOGGER.info("========== MENSAJE RECIBIDO ==========");
			//LOGGER.info("Datos completos: {}", data);
			
			String nombre = (String) data.get("nombre");
			
			//LOGGER.info("Acción recibida de: {}", nombre);
			
			// Obtener la partida asociada a este jugador
			Partida p = servicios.getPartidaJugador(nombre);
			PartidaSnapshot before = snapshot(p);
			
			if (p.esMiTurno(nombre)) {
				// Si es el turno del jugador, procesar la acción
				String accion = (String) data.get("accion");
				//LOGGER.info("{} - {}", nombre, accion);
				
				if (p.getFasePartida() == FasePartida.DESPLIEGUE) {
					handleDesplegar(data, p);
				} else {
					switch (accion) {
						case "MOVER":
							handleMover(data, p);
							break;
						case "ATACAR":
							handleAtacar(data, p);
							break;
						case "RECARGAR":
							handleRecargar(data, p);
							break;
						case "PASAR":
							p.terminarTurno();
							break;
						default:
							//LOGGER.warn("Acción desconocida: {}", accion);
							break;
					}
				}

				eventosVisuales = construirEventosVisuales(data, nombre, before, p);
				
				// Enviar estado actualizado a todos los clientes
				//LOGGER.info("Enviando estado actualizado después de acción...");
				String respuesta = mensajeRetorno(p, eventosVisuales);
				messagingTemplate.convertAndSend("/topic/game", respuesta);
				//LOGGER.info("Estado actualizado enviado a todos los clientes");
				
			} else {
				//LOGGER.info("No es tu turno: {}", nombre);
				// Enviar mensaje de error al jugador
				VoMensaje mensajeError = new VoMensaje(nombre, "No es tu turno");
				List<Map<String, Object>> eventos = new ArrayList<>();
				eventos.add(crearEvento("NO_ES_TU_TURNO", Map.of("jugador", nombre)));
				mensajeError.setEventos(eventos);
				String respuesta = mapper.writeValueAsString(mensajeError);
				messagingTemplate.convertAndSend("/topic/game", respuesta);
			}
			
		} catch (Exception e) {
			//LOGGER.error("Error procesando acción: {}", e.getMessage(), e);
		}
	}
	
	/**
	 * Maneja la creación de jugadores y partida
	 */
	private void handleCrearJugador(String nombre) {
		try {
			if (jugador1 == null) {
				jugador1 = nombre;
				LOGGER.info("Jugador '{}' asignado como jugador1 (NAVAL)", nombre);
				//LOGGER.info("Jugador 1 creado: {}", jugador1.getNombre());
				
				// Notificar al jugador 1 que es NAVAL
				VoMensaje mensaje = new VoMensaje(nombre, Equipo.NAVAL);
				String respuesta = mapper.writeValueAsString(mensaje);
				//LOGGER.info("Enviando asignación NAVAL al jugador 1: {}", respuesta);
				messagingTemplate.convertAndSend("/topic/login", respuesta);
				
			} else if (jugador2 == null && !jugador1.equals(nombre)) {
				jugador2 = nombre;
				LOGGER.info("Jugador '{}' asignado como jugador2 (AEREO)", nombre);
				//LOGGER.info("Jugador 2 creado: {}", jugador2.getNombre());
				servicios.crearPartida(jugador1, jugador2);
				String clave = servicios.generarClave(jugador1, jugador2);
				LOGGER.info("Partida creada con clave '{}'", clave);
				//LOGGER.info("Partida creada con jugadores: {} y {}", jugador1.getNombre(), jugador2.getNombre());
				jugador1 = null;
				jugador2 = null;
				// Notificar al jugador 2 que es AEREO
				VoMensaje mensaje = new VoMensaje(nombre, Equipo.AEREO);
				String respuesta = mapper.writeValueAsString(mensaje);
				//LOGGER.info("Enviando asignación AEREO al jugador 2: {}", respuesta);
				messagingTemplate.convertAndSend("/topic/login", respuesta);
				
				// Enviar estado inicial del juego a todos los jugadores
				// // // // // // // // estaria bueno recibir esto al conectarse a game no aca
				Partida p = servicios.getPartidaJugador(nombre);
				String estadoInicial = mensajeRetorno(p);
				//LOGGER.info("Enviando estado inicial de la partida (tamaño: {} chars)", estadoInicial != null ? estadoInicial.length() : 0);
				messagingTemplate.convertAndSend("/topic/game", estadoInicial);
				//LOGGER.info("Estado inicial de la partida enviado a todos los jugadores");
			} else {
				enviarErrorLogin(nombre, "No se pudo asignar jugador. Intenta nuevamente");
				LOGGER.warn("Login no asignado para '{}'. Estado actual jugador1='{}', jugador2='{}'", nombre, jugador1, jugador2);
			}
		} catch (Exception e) {
			LOGGER.error("Error al crear jugador '{}'", nombre, e);
			enviarErrorLogin(nombre, "Error interno al crear jugador");
		}
	}

	private void enviarErrorLogin(String nombre, String error) {
		try {
			VoMensaje mensajeError = new VoMensaje(nombre, error);
			String respuesta = mapper.writeValueAsString(mensajeError);
			messagingTemplate.convertAndSend("/topic/login", respuesta);
		} catch (Exception ex) {
			LOGGER.error("Error enviando mensaje de error de login para '{}'", nombre, ex);
		}
	}
		
	/**
	 * Maneja el despliegue de drones en la fase inicial
	 */
	public void handleDesplegar(Map<String, Object> data, Partida p) {
		int x = (int) data.get("xi");
		int y = (int) data.get("yi");
		Posicion pos = new Posicion(x, y);

		p.desplegarDron(pos);

		//LOGGER.info("Dron desplegado en: {}, {}", x, y);
		//LOGGER.info("Turno: {}", p.getTurno());
	}

	/**
	 * Maneja el movimiento de drones
	 */
	public void handleMover(Map<String, Object> data, Partida p) {
		int xi = (int) data.get("xi");
		int yi = (int) data.get("yi");
		Posicion posi = new Posicion(xi, yi);
		int xf = (int) data.get("xf");
		int yf = (int) data.get("yf");
		Posicion posf = new Posicion(xf, yf);
		
		p.mover(posi, posf);

		//LOGGER.info("Dron se movió desde: {}, {} hasta: {}, {}", xi, yi, xf, yf);
		//LOGGER.info("Turno: {}", p.getTurno());
	}

	/**
	 * Maneja los ataques entre drones
	 */
	public void handleAtacar(Map<String, Object> data, Partida p) {
		int xi = (int) data.get("xi");
		int yi = (int) data.get("yi");
		Posicion posi = new Posicion(xi, yi);
		int xf = (int) data.get("xf");
		int yf = (int) data.get("yf");
		Posicion posf = new Posicion(xf, yf);
		
		p.atacar(posi, posf);

		//LOGGER.info("Dron atacó desde: {}, {} hasta: {}, {}", xi, yi, xf, yf);
		//LOGGER.info("Turno: {}", p.getTurno());
	}

	/**
	 * Maneja la recarga de munición
	 */
	public void handleRecargar(Map<String, Object> data, Partida p) {
		int x = (int) data.get("xi");
		int y = (int) data.get("yi");
		Posicion pos = new Posicion(x, y);
		
		p.recargarMunicion(pos);

		//LOGGER.info("Dron recargó munición en: {}, {}", x, y);
		//LOGGER.info("Turno: {}", p.getTurno());
	}

	/**
	 * Genera el mensaje de retorno con el estado actual del juego
	 */
	public String mensajeRetorno(Partida p) {
		return mensajeRetorno(p, List.of());
	}

	public String mensajeRetorno(Partida p, List<Map<String, Object>> eventosVisuales) {
		String t = null;
		try {
			//LOGGER.info("Generando mensaje de retorno...");
			// Crear VoMensaje con la fase y la grilla completa
			VoMensaje mensaje = new VoMensaje(p.getFasePartida(), p.getTablero(), p.getTurno(), p.getEquipoGanador(), eventosVisuales);
			t = mapper.writeValueAsString(mensaje);
			//LOGGER.info("Estado del juego serializado exitosamente - Tamaño: {} chars", t.length());
			//LOGGER.debug("Contenido del mensaje (primeros 200 chars): {}", t.substring(0, Math.min(200, t.length())));
		} catch (Exception e) {
			//LOGGER.error("Error al serializar el estado del juego", e);
			e.printStackTrace();
		}
		return t;
	}

	private PartidaSnapshot snapshot(Partida p) {
		return new PartidaSnapshot(
			p.getFasePartida(),
			p.getTurno(),
			p.getDronesNavales().size(),
			p.getDronesAereos().size(),
			p.getPortaDronesNaval().getVida(),
			p.getPortaDronesAereo().getVida(),
			p.getSeMovio(),
			p.getDisparo(),
			totalMunicion(p.getDronesNavales()),
			totalMunicion(p.getDronesAereos())
		);
	}

	private int totalMunicion(List<Dron> drones) {
		int total = 0;
		for (Dron d : drones) {
			total += d.getMunicion();
		}
		return total;
	}

	private List<Map<String, Object>> construirEventosVisuales(Map<String, Object> data, String jugador, PartidaSnapshot before, Partida p) {
		List<Map<String, Object>> eventos = new ArrayList<>();
		String accion = (String) data.get("accion");
		PartidaSnapshot after = snapshot(p);

		if (before.fase == FasePartida.DESPLIEGUE && after.fase == FasePartida.DESPLIEGUE && after.navales > before.navales) {
			eventos.add(crearEvento("DESPLIEGUE_DRON", Map.of("equipo", "NAVAL", "x", intOr(data, "xi"), "y", intOr(data, "yi"), "jugador", p.getJugadorNaval().getNombre())));
		}
		if (before.fase == FasePartida.DESPLIEGUE && after.fase == FasePartida.DESPLIEGUE && after.aereos > before.aereos) {
			eventos.add(crearEvento("DESPLIEGUE_DRON", Map.of("equipo", "AEREO", "x", intOr(data, "xi"), "y", intOr(data, "yi"), "jugador", p.getJugadorAereo().getNombre())));
		}

		if ("MOVER".equals(accion) && !before.seMovio && after.seMovio) {
			eventos.add(crearEvento("MOVER_DRON", Map.of(
				"equipo", before.turno.toString(),
				"origenX", intOr(data, "xi"),
				"origenY", intOr(data, "yi"),
				"destinoX", intOr(data, "xf"),
				"destinoY", intOr(data, "yf")
			)));
		}

		if ("ATACAR".equals(accion) && !before.disparo && after.disparo) {
			eventos.add(crearEvento("ATAQUE_DRON", Map.of(
				"equipoAtacante", before.turno.toString(),
				"origenX", intOr(data, "xi"),
				"origenY", intOr(data, "yi"),
				"destinoX", intOr(data, "xf"),
				"destinoY", intOr(data, "yf")
			)));

			if (after.navales < before.navales || after.aereos < before.aereos) {
				eventos.add(crearEvento("DESTRUCCION_DRON", Map.of("equipoDestruido", after.navales < before.navales ? "NAVAL" : "AEREO")));
			} else if (after.portaVidaNaval < before.portaVidaNaval || after.portaVidaAereo < before.portaVidaAereo) {
				eventos.add(crearEvento("IMPACTO_PORTADRONES", Map.of("equipoImpactado", after.portaVidaNaval < before.portaVidaNaval ? "NAVAL" : "AEREO")));
			} else {
				eventos.add(crearEvento("IMPACTO_SIN_BAJA", Map.of()));
			}
		}

		if ("RECARGAR".equals(accion)) {
			boolean recargoNaval = before.turno == Equipo.NAVAL && after.municionNaval > before.municionNaval;
			boolean recargoAereo = before.turno == Equipo.AEREO && after.municionAereo > before.municionAereo;
			if (recargoNaval || recargoAereo) {
				eventos.add(crearEvento("RECARGA_DRON", Map.of("equipo", before.turno.toString(), "x", intOr(data, "xi"), "y", intOr(data, "yi"))));
			}
		}

		if (before.turno != after.turno) {
			eventos.add(crearEvento("CAMBIO_TURNO", Map.of("de", before.turno.toString(), "a", after.turno.toString())));
		}

		if (before.fase != after.fase) {
			eventos.add(crearEvento("CAMBIO_FASE", Map.of("de", before.fase.toString(), "a", after.fase.toString())));
		}

		if (after.fase == FasePartida.TERMINADO) {
			Equipo ganador = p.getEquipoGanador();
			if (ganador != null && ganador != Equipo.NINGUNO) {
				String jugadorGanador = ganador == Equipo.NAVAL ? p.getJugadorNaval().getNombre() : p.getJugadorAereo().getNombre();
				eventos.add(crearEvento("VICTORIA", Map.of("equipo", ganador.toString(), "jugador", jugadorGanador)));
				eventos.add(crearEvento("DERROTA", Map.of("equipo", ganador.siguienteEquipo().toString())));
			} else {
				eventos.add(crearEvento("EMPATE", Map.of()));
			}
		}

		if (eventos.isEmpty() && accion != null) {
			eventos.add(crearEvento("ACCION_INVALIDA_O_SIN_CAMBIO", Map.of("accion", accion, "jugador", jugador)));
		}

		return eventos;
	}

	private int intOr(Map<String, Object> data, String key) {
		Object value = data.get(key);
		if (value instanceof Number number) {
			return number.intValue();
		}
		return -1;
	}

	private Map<String, Object> crearEvento(String tipo, Map<String, Object> payload) {
		Map<String, Object> evento = new LinkedHashMap<>();
		evento.put("tipo", tipo);
		evento.put("payload", payload);
		return evento;
	}

	private static class PartidaSnapshot {
		private final FasePartida fase;
		private final Equipo turno;
		private final int navales;
		private final int aereos;
		private final int portaVidaNaval;
		private final int portaVidaAereo;
		private final boolean seMovio;
		private final boolean disparo;
		private final int municionNaval;
		private final int municionAereo;

		private PartidaSnapshot(FasePartida fase, Equipo turno, int navales, int aereos, int portaVidaNaval, int portaVidaAereo, boolean seMovio, boolean disparo, int municionNaval, int municionAereo) {
			this.fase = fase;
			this.turno = turno;
			this.navales = navales;
			this.aereos = aereos;
			this.portaVidaNaval = portaVidaNaval;
			this.portaVidaAereo = portaVidaAereo;
			this.seMovio = seMovio;
			this.disparo = disparo;
			this.municionNaval = municionNaval;
			this.municionAereo = municionAereo;
		}
	}
	


}
