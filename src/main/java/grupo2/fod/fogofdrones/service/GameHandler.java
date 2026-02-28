package grupo2.fod.fogofdrones.service;

// ver como adaptar a servicios usando varias partidas
import java.util.Map;

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
				enviarErrorLogin("", "Nombre inválido"); // "Nombre inválido"
				LOGGER.warn("Login rechazado: nombre vacío o nulo");
				return;
			}

			if (servicios.existePartida(nombre)) {
				enviarErrorLogin(nombre, "El jugador ya está en una partida activa"); //"El jugador ya está en una partida activa"
				LOGGER.warn("Login rechazado para '{}': ya tiene partida activa", nombre);
			} else {
				handleCrearJugador(nombre);
			}
		} catch (Exception e) {
			LOGGER.error("Error procesando login", e);
		}
	}
	
	//Endpoint principal que maneja todas las acciones del juego
	//Los clientes envían mensajes a /app/accion
	//Las respuestas se envían a /topic/game para que todos los suscritos las reciban
	@MessageMapping("/accion")
	public void handleAction(@Payload Map<String, Object> data) {
		try {
			String nombre = (String) data.get("nombre");

			// Obtener la partida asociada a este jugador
			Partida p = servicios.getPartidaJugador(nombre);
			// accion fuera de turno para procesar solicitud de guardado
			String accion = (String) data.get("accion");
			System.out.println("accion: "+ accion);

			switch (accion) {
				case "GUARDAR": {
					System.out.println("case GUARDAR");
					if (p != null) {
						handleGuardar(nombre, p);
					}
					} break;
				case "RECHAZAR": {
					System.out.println("case RECHAZAR");
					if (p != null) {
						handleRechazar(nombre, p);
					}
				 	} break;
				case "ACEPTAR":{
					System.out.println("case ACEPTAR");
					if (p != null) {
						handleAceptar(nombre, p);
					}
					} break;
				case "ACTUALIZAR": {
					System.out.println("case ACTUALIZAR");
					if (p != null) {
						String respuesta = mensajeRetorno(p);
						String canal = getCanalPartida(p);
						messagingTemplate.convertAndSend(canal, respuesta);
						LOGGER.info("Estado actualizado enviado para jugador '{}'", nombre);
					} else {
						LOGGER.warn("ACTUALIZAR: No se encontró partida para jugador '{}'", nombre);
					}
					} break;
				default: 
					if (p != null && p.esMiTurno(nombre)) {
						// Si es el turno del jugador, procesar la acción
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
							}
						}
						
						// Enviar estado actualizado a todos los clientes
						String respuesta = mensajeRetorno(p);
						String canal = getCanalPartida(p);
						messagingTemplate.convertAndSend(canal, respuesta);
						
					} else {
						// Enviar mensaje de error al jugador
						VoMensaje mensajeError = VoMensaje.builder()
							.tipoMensaje(3)
							.nombre(nombre)
							.evento("No es tu turno")
							.build();//new VoMensaje(nombre, 3); // "No es tu turno"
						String respuesta = mapper.writeValueAsString(mensajeError);
						String canal = getCanalPartida(p);
						messagingTemplate.convertAndSend(canal, respuesta);
					}
				break;	
			}
			

			/* 
			if (p.esMiTurno(nombre)) {
				// Si es el turno del jugador, procesar la acción
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
					}
				}
				
				// Enviar estado actualizado a todos los clientes
				String respuesta = mensajeRetorno(p);
				messagingTemplate.convertAndSend("/topic/game", respuesta);
				
			}
			switch (accion) {
				case "GUARDAR":
					System.out.println("case GUARDAR");
					handleGuardar(nombre, p);
					break;
				case "RECHAZAR":
					System.out.println("case RECHAZAR");
					handleRechazar(nombre, p);
					break;
				case "ACEPTAR":
					System.out.println("case ACEPTAR");
					handleAceptar(nombre, p);
					break;
				default:
					// Enviar mensaje de error al jugador
					VoMensaje mensajeError = new VoMensaje(nombre, 3); // "No es tu turno"
					String respuesta = mapper.writeValueAsString(mensajeError);
					messagingTemplate.convertAndSend("/topic/game", respuesta);
				break;	
			}*/
			
		} catch (Exception e) {
			//Error procesando acción: 
		}
	}
	
	
	//Maneja la creación de jugadores y partida
	 
	private void handleCrearJugador(String nombre) {
		try {
			if (jugador1 == null) {
				jugador1 = nombre;
				LOGGER.info("Jugador '{}' asignado como jugador1 (NAVAL)", nombre);
				
				// Notificar al jugador 1 que es NAVAL
				VoMensaje mensaje = VoMensaje.builder()	// ver escena 1
					.nombre(nombre)
					.equipo(Equipo.NAVAL)
					.build();//new VoMensaje(nombre, Equipo.NAVAL);
				String respuesta = mapper.writeValueAsString(mensaje);
				messagingTemplate.convertAndSend("/topic/login", respuesta);
				
			} else if (jugador2 == null && !jugador1.equals(nombre)) {
				jugador2 = nombre;
				LOGGER.info("Jugador '{}' asignado como jugador2 (AEREO)", nombre);
				servicios.crearPartida(jugador1, jugador2);
				String clave = servicios.generarClave(jugador1, jugador2);
				LOGGER.info("Partida creada con clave '{}'", clave);

				// Notificar al jugador 2 que es AEREO
				VoMensaje mensaje = VoMensaje.builder()	// ver escena 1
					.nombre(nombre)
					.equipo(Equipo.AEREO)
					.build();//new VoMensaje(nombre, Equipo.AEREO);
				String respuesta = mapper.writeValueAsString(mensaje);
				messagingTemplate.convertAndSend("/topic/login", respuesta);
				
				// Notificar a ambos jugadores que la partida está lista
				String canalPartida = getCanalPartida(servicios.getPartidaJugador(jugador2));
				VoMensaje mensajeJugador1 = VoMensaje.builder() // ver escena 1
					.nombre(jugador1)
					.equipo(Equipo.NAVAL)
					.canal(canalPartida)
					.build();//new VoMensaje(jugador1, Equipo.NAVAL);
				//mensajeJugador1.setCanal(canalPartida);
				String respuestaJugador1 = mapper.writeValueAsString(mensajeJugador1);
				messagingTemplate.convertAndSend("/topic/partida-lista", respuestaJugador1);
				
				VoMensaje mensajeJugador2 = VoMensaje.builder()	// ver escena 1
					.nombre(nombre)
					.equipo(Equipo.AEREO)
					.canal(canalPartida)
					.build();//new VoMensaje(nombre, Equipo.AEREO);
				//mensajeJugador2.setCanal(canalPartida);
				String respuestaJugador2 = mapper.writeValueAsString(mensajeJugador2);
				messagingTemplate.convertAndSend("/topic/partida-lista", respuestaJugador2);
				
				String temp1 = jugador1;
				String temp2 = jugador2;
				jugador1 = null;
				jugador2 = null;
				
				// Enviar estado inicial del juego a todos los jugadores
				// Registrar listener para mensajes de partida -> enviar por STOMP en canal específico
				Partida p = servicios.getPartidaJugador(temp2);
				if (p != null) {
					String canalInicio = getCanalPartida(p);
					p.setMensajeListener((vo) -> {
						try {
							String mensajeVo = mapper.writeValueAsString(vo);
							messagingTemplate.convertAndSend(canalInicio, mensajeVo);
						} catch (Exception ex) {
							LOGGER.error("Error enviando VoMensaje de partida", ex);
						}
					});
					String estadoInicial = mensajeRetorno(p);
					messagingTemplate.convertAndSend(canalInicio, estadoInicial);
				}
			} else {
				enviarErrorLogin(nombre, "No se pudo asignar jugador. Intenta nuevamente"); // "No se pudo asignar jugador. Intenta nuevamente"
				LOGGER.warn("Login no asignado para '{}'. Estado actual jugador1='{}', jugador2='{}'", nombre, jugador1, jugador2);
			}
		} catch (Exception e) {
			LOGGER.error("Error al crear jugador '{}'", nombre, e);
			enviarErrorLogin(nombre, "Error interno al crear jugador"); // "Error interno al crear jugador"
		}
	}

	private void enviarErrorLogin(String nombre, String error) {
		try {
			VoMensaje mensajeError = VoMensaje.builder()	// ver escena1
				.nombre(nombre)
				.evento(error)
				.build();	///new VoMensaje(nombre, error);
			String respuesta = mapper.writeValueAsString(mensajeError);
			messagingTemplate.convertAndSend("/topic/login", respuesta);
		} catch (Exception ex) {
			LOGGER.error("Error enviando mensaje de error de login para '{}'", nombre, ex);
		}
	}
		
	//Maneja el despliegue de drones en la fase inicial
	 
	public void handleDesplegar(Map<String, Object> data, Partida p) {
		int x = (int) data.get("xi");
		int y = (int) data.get("yi");
		Posicion pos = new Posicion(x, y);

		p.desplegarDron(pos);
	}

	//Maneja el movimiento de drones
	
	public void handleMover(Map<String, Object> data, Partida p) {
		int xi = (int) data.get("xi");
		int yi = (int) data.get("yi");
		Posicion posi = new Posicion(xi, yi);
		int xf = (int) data.get("xf");
		int yf = (int) data.get("yf");
		Posicion posf = new Posicion(xf, yf);
		
		p.mover(posi, posf);
	}

	
	//aneja los ataques entre drones
	
	public void handleAtacar(Map<String, Object> data, Partida p) {
		int xi = (int) data.get("xi");
		int yi = (int) data.get("yi");
		Posicion posi = new Posicion(xi, yi);
		int xf = (int) data.get("xf");
		int yf = (int) data.get("yf");
		Posicion posf = new Posicion(xf, yf);
		
		p.atacar(posi, posf);
	}

	
	//Maneja la recarga de munición
	
	public void handleRecargar(Map<String, Object> data, Partida p) {
		int x = (int) data.get("xi");
		int y = (int) data.get("yi");
		Posicion pos = new Posicion(x, y);
		
		p.recargarMunicion(pos);
	}

	public void handleGuardar(String solicitante, Partida p) {
		String nombre = null;
		if ( solicitante.equals(p.getJugadorAereo().getNombre()) ) {
			nombre = p.getJugadorNaval().getNombre();
		} else {
			nombre = p.getJugadorAereo().getNombre();
		}
		try {
			//VoMensaje mensajeError = new VoMensaje(nombre, 6); // "solicitud de guardado"
			VoMensaje mensajeGuardado = VoMensaje.builder()
				.tipoMensaje(2)
				.nombre(nombre)
				.evento("SOLICITUD")	// "solicitud de guardado"
				.build(); // "solicitud de guardado"
			String respuesta = mapper.writeValueAsString(mensajeGuardado);
			String canal = getCanalPartida(p);
			messagingTemplate.convertAndSend(canal, respuesta);
		} catch (Exception e) {

		}
	}

	public void handleRechazar(String nombre, Partida p) {
		System.out.println("rechazar guardado");
		String solicitante = null;
		if ( nombre.equals(p.getJugadorAereo().getNombre()) ) {
			solicitante = p.getJugadorNaval().getNombre();
		} else {
			solicitante = p.getJugadorAereo().getNombre();
		}
		try {
			VoMensaje mensajeGuardado = VoMensaje.builder()
				.tipoMensaje(2)
				.nombre(solicitante)
				.evento("RECHAZADA")	//"solicitud de guardado rechazada"
				.build();//new VoMensaje(solicitante, 7); // "solicitud de guardado rechazada"
			String respuesta = mapper.writeValueAsString(mensajeGuardado);
			String canal = getCanalPartida(p);
			messagingTemplate.convertAndSend(canal, respuesta);	// antes "/topic/game"
		} catch (Exception e) {

		}
	}

	public void handleAceptar(String nombre, Partida p) {
		System.out.println("aceptar guardado");
		String solicitante = null;
		if ( nombre.equals(p.getJugadorAereo().getNombre()) ) {
			solicitante = p.getJugadorNaval().getNombre();
		} else {
			solicitante = p.getJugadorAereo().getNombre();
		}
		try {
			servicios.guardarPartida(p.getJugadorNaval().getNombre(), p.getJugadorAereo().getNombre());

			VoMensaje mensajeGuardado = VoMensaje.builder()
				.tipoMensaje(2)
				.nombre(solicitante)
				.evento("ACEPTADA")	// "solicitud de guardado aceptada"
				.build(); //new VoMensaje(solicitante, 8); // "solicitud de guardado aceptada"
			String respuesta = mapper.writeValueAsString(mensajeGuardado);
			String canal = getCanalPartida(p);
			messagingTemplate.convertAndSend(canal, respuesta);
		} catch (Exception e) {

		}
	}

	
	//Genera el mensaje de retorno con el estado actual del juego
	
	public String mensajeRetorno(Partida p) {
		String t = null;
		try {
			// Crear VoMensaje con la fase y la grilla completa
			VoMensaje mensaje = VoMensaje.builder()
				.tipoMensaje(1)
				.fasePartida(p.getFasePartida())
				.grilla(p.getTablero().getGrillaLineal())
				.build(); //new VoMensaje(p.getFasePartida(), p.getTablero());
			t = mapper.writeValueAsString(mensaje);
			
			// DEBUG: Verificar qué se está enviando
			LOGGER.info("[DEBUG MSG] Enviando estado - Fase: {}, Grilla tamaño:", 
				p.getFasePartida()
				);//p.getTablero().getGrillaLineal().size()
		} catch (Exception e) {
			LOGGER.error("[DEBUG MSG] Error generando mensaje de retorno", e);
			e.printStackTrace();
		}
		return t;
	}

	
	/**
	 * Construye el canal de STOMP asociado a una partida concreta.
	 * Formato: /topic/{jugadorNaval}-{jugadorAereo}
	 */
	private String getCanalPartida(Partida p) {
		if (p == null || p.getJugadorNaval() == null || p.getJugadorAereo() == null) {
			return "/topic/game"; // fallback
		}
		String nav = p.getJugadorNaval().getNombre();
		String aer = p.getJugadorAereo().getNombre();
		return "/topic/" + nav + "-" + aer;
	}

	
	// Estado para carga de partida
	private String jugadorCarga1 = null;
	private String jugadorCarga2 = null;

	@MessageMapping("/cargar")
	public void handleCargar(@Payload Map<String, Object> data) {
		try {
			String nombre = (String) data.get("nombre");
			LOGGER.info("Cargar solicitado por '{}'", nombre);

			// Verifica si el jugador tiene partida guardada
			if (!servicios.existePartidaGuardada(nombre)) {
				// Enviar mensaje de error especial para carga
				try {
					VoMensaje mensajeError = VoMensaje.builder()
						.tipoMensaje(2)
						.nombre(nombre)
						.evento("No tienes partida guardada")
						.build();
					String respuesta = mapper.writeValueAsString(mensajeError);
					messagingTemplate.convertAndSend("/topic/login", respuesta);
				} catch (Exception ex) {
					LOGGER.error("Error enviando mensaje de error de carga para '{}': {}", nombre, ex.getMessage());
				}
				return;
			}

			if (jugadorCarga1 == null) {
				jugadorCarga1 = nombre;
				LOGGER.info("Jugador '{}' esperando para cargar partida", nombre);
				// Espera al segundo jugador
			} else if (jugadorCarga2 == null && !jugadorCarga1.equals(nombre)) {
				jugadorCarga2 = nombre;
				LOGGER.info("Jugador '{}' también listo para cargar partida", nombre);

				// Recupera la partida guardada
				Partida partidaCargada = servicios.cargarPartida(jugadorCarga1, jugadorCarga2);
				

				if (partidaCargada == null) {
					LOGGER.error("ERROR: No se pudo cargar la partida para {} y {}", jugadorCarga1, jugadorCarga2);
					enviarErrorLogin(nombre, "Error al cargar la partida");
					jugadorCarga1 = null;
					jugadorCarga2 = null;
					return;
				}

				partidaCargada.actualizarTablero();
				partidaCargada.actualizarVision();
				
				String canalPartida = getCanalPartida(partidaCargada);

				// DEBUG: Verificar el estado de la partida cargada
				LOGGER.info("[DEBUG CARGA] Partida cargada - Fase: {}, Drones N: {}, Drones A: {}", 
					partidaCargada.getFasePartida(),
					partidaCargada.cantDronesEquipo(Equipo.NAVAL),
					partidaCargada.cantDronesEquipo(Equipo.AEREO));

				// Notifica a ambos jugadores que la partida está lista para cargar
				VoMensaje mensajeJugador1 = VoMensaje.builder()
					.nombre(partidaCargada.getJugadorNaval().getNombre())
					.equipo(Equipo.NAVAL)
					.canal(canalPartida)
					.build();
				String respuestaJugador1 = mapper.writeValueAsString(mensajeJugador1);
				messagingTemplate.convertAndSend("/topic/cargar-lista", respuestaJugador1);

				VoMensaje mensajeJugador2 = VoMensaje.builder()
					.nombre(partidaCargada.getJugadorAereo().getNombre())
					.equipo(Equipo.AEREO)
					.canal(canalPartida)
					.build();
				String respuestaJugador2 = mapper.writeValueAsString(mensajeJugador2);
				messagingTemplate.convertAndSend("/topic/cargar-lista", respuestaJugador2);

				// Limpia estado de espera
				jugadorCarga1 = null;
				jugadorCarga2 = null;

				System.out.println(partidaCargada.getJugadorNaval().getNombre() + " - " + partidaCargada.getJugadorAereo().getNombre());

				// Nota: El estado inicial será enviado cuando los clientes se suscriban 
				// y envíen un mensaje ACTUALIZAR. Esto sincroniza correctamente a ambos jugadores.
				LOGGER.info("Partida cargada: {} vs {}. Esperando ACTUALIZAR de los clientes.", 
					partidaCargada.getJugadorNaval().getNombre(), 
					partidaCargada.getJugadorAereo().getNombre());
			} else {
				enviarErrorLogin(nombre, "No se pudo cargar la partida. Intenta nuevamente.");
				LOGGER.warn("Carga no asignada para '{}'. Estado actual jugadorCarga1='{}', jugadorCarga2='{}'", nombre, jugadorCarga1, jugadorCarga2);
			}
		} catch (Exception e) {
			LOGGER.error("Error al cargar partida '{}'", data.get("nombre"), e);
			enviarErrorLogin((String) data.get("nombre"), "Error interno al cargar partida");
		}
	}
}
