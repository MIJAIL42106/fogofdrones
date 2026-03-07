package grupo2.fod.fogofdrones.service;

import java.util.Map;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.Header;
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

// controlador que administra conexiones STOMP a el juego
@Controller
public class GameHandler {
	
	@Autowired
	private SimpMessagingTemplate messagingTemplate;
	
	@Autowired
	private Servicios servicios;
	@Autowired
	private SesionJugadores sesionJugadores;
	private String jugador1 = null;
	private String jugador2 = null;
	private final Map<String, String> solicitanteGuardadoPendientePorClave = new ConcurrentHashMap<>();
	private final Map<String, Boolean> aprobacionRivalPendientePorClave = new ConcurrentHashMap<>();
	private final Map<String, Boolean> reemplazoGuardadoPendientePorClave = new ConcurrentHashMap<>();
	private final Map<String, Set<String>> confirmacionReemplazoPendientePorClave = new ConcurrentHashMap<>();
	private final Map<String, Boolean> reemplazoEmpatePendientePorClave = new ConcurrentHashMap<>();

	public synchronized void limpiarColasPorDesconexion(String nombre) {
		if (nombre == null || nombre.trim().isEmpty()) {
			return;
		}
		if (nombre.equals(jugador1)) {
			jugador1 = null;
		}
		if (nombre.equals(jugador2)) {
			jugador2 = null;
		}

		// Limpieza de cola de carga por pareja.
		String clave = clavePendientePorJugador.remove(nombre);
		if (clave != null) {
			cargaPendientePorClave.remove(clave, nombre);
		}
		// Defensivo: si el índice inverso se desincronizó, removerlo igual.
		cargaPendientePorClave.entrySet().removeIf(e -> nombre.equals(e.getValue()));
	}
	
	private ObjectMapper mapper = new ObjectMapper();
	
	@MessageMapping("/login")
	public void handleActionMenu(@Payload Map<String, Object> data, @Header("simpSessionId") String sessionId) {
		try {
			String nombre = (String) data.get("nombre");
			sesionJugadores.registrar(sessionId, nombre);

			if (nombre == null || nombre.trim().isEmpty()) {
				enviarErrorLogin("", "Nombre inválido"); // "Nombre inválido"
				return;
			}

			if (servicios.existePartida(nombre)) {
				enviarErrorLogin(nombre, "El jugador ya está en una partida activa"); //"El jugador ya está en una partida activa"
			} else {
				handleCrearJugador(nombre);
			}
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	@MessageMapping("/cancelar-login")
	public synchronized void handleCancelarLogin(@Payload Map<String, Object> data) {
		try {
			String nombre = (String) data.get("nombre");
			if (nombre == null || nombre.trim().isEmpty()) {
				return;
			}
			if (nombre.equals(jugador1)) {
				jugador1 = null;
			} else if (nombre.equals(jugador2) && !servicios.existePartida(nombre)) {
				// Caso defensivo: si por algún motivo quedó como jugador2 sin partida creada
				jugador2 = null;
			}
		} catch (Exception e) {
			e.printStackTrace();
		}
	}
	
	@MessageMapping("/accion")
	public void handleAction(@Payload Map<String, Object> data, @Header("simpSessionId") String sessionId) {
		try {
			String nombre = (String) data.get("nombre");
			sesionJugadores.registrar(sessionId, nombre);

			// Obtener la partida asociada a este jugador
			Partida p = servicios.getPartidaJugador(nombre);
			// accion fuera de turno para procesar solicitud de guardado
			String accion = (String) data.get("accion");

			switch (accion) {
				case "ABANDONAR": {
					if (p != null) {
						String nombreNaval = p.getJugadorNaval().getNombre();
						String nombreAereo = p.getJugadorAereo().getNombre();
						Equipo ganador = nombre.equals(nombreNaval) ? Equipo.AEREO : Equipo.NAVAL;
						p.finalizarPorAbandono(ganador);
						String canal = getCanalPartida(p);
						VoMensaje finMsg = VoMensaje.builder()
								.tipoMensaje(5)
								.evento("La partida ha terminado por abandono")
								.nombre(ganador.toString())
								.fasePartida(FasePartida.TERMINADO)
								.build();
						String finRespuesta = mapper.writeValueAsString(finMsg);
						messagingTemplate.convertAndSend(canal, finRespuesta);
						servicios.finalizarPartida(nombreNaval, nombreAereo);
					}
				} break;
				case "GUARDAR": {
					if (p != null) {
						handleGuardar(nombre, p);
					}
				} break;
				case "RECHAZAR": {
					if (p != null) {
						handleRechazar(nombre, p);
					}
				} break;
				case "ACEPTAR":{
					if (p != null) {
						handleAceptar(nombre, p);
					}
				} break;
				case "ACTUALIZAR": {
					if (p != null) {
						String respuesta = mensajeRetorno(p);
						String canal = getCanalPartida(p);
						messagingTemplate.convertAndSend(canal, respuesta);

						if (p.getFasePartida() == FasePartida.TERMINADO) {
							try {
								String nombreNaval = p.getJugadorNaval().getNombre();
								String nombreAereo = p.getJugadorAereo().getNombre();

								boolean reenviar = servicios.consumirFinalizacionPendiente(nombreNaval, nombreAereo, 15_000);
								if (reenviar) {
									Equipo ganador = p.getEquipoGanador();
									VoMensaje finMsg = VoMensaje.builder()
										.tipoMensaje(5)
										.evento("La partida ha terminado por abandono")
										.nombre(ganador != Equipo.NINGUNO ? ganador.toString() : "Empate")
										.fasePartida(FasePartida.TERMINADO)
										.build();
									String finRespuesta = mapper.writeValueAsString(finMsg);
									messagingTemplate.convertAndSend(canal, finRespuesta);
									servicios.finalizarPartida(nombreNaval, nombreAereo);
								}
							} catch (Exception ex) {
							}
						}
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
						if (p.getFasePartida() == FasePartida.TERMINADO) {
							String nombreNaval = p.getJugadorNaval().getNombre();
                            String nombreAereo = p.getJugadorAereo().getNombre();
                            servicios.finalizarPartida(nombreNaval, nombreAereo);
                            Equipo ganador = p.getEquipoGanador();
                            VoMensaje finMsg = VoMensaje.builder()
                                .tipoMensaje(5) // finalización
                                .evento("La partida ha terminado")
                                .nombre(ganador != Equipo.NINGUNO ? ganador.toString() : "Empate")
                                .fasePartida(FasePartida.TERMINADO)
                                .build();
                            String finRespuesta = mapper.writeValueAsString(finMsg);
                            messagingTemplate.convertAndSend(canal, finRespuesta);
                        }
					} else {
						// Enviar mensaje de error al jugador
						VoMensaje mensajeError = VoMensaje.builder()
							.tipoMensaje(3)
							.nombre(nombre)
							.evento("No es tu turno")
							.build();
						String respuesta = mapper.writeValueAsString(mensajeError);
						String canal = getCanalPartida(p);
						messagingTemplate.convertAndSend(canal, respuesta);
					}
				break;	
			}
		} catch (Exception e) {
			e.printStackTrace();
		}
	}
	
	//Maneja la creación de jugadores y partida
	private synchronized void handleCrearJugador(String nombre) {
		try {
			if (jugador1 == null) {
				jugador1 = nombre;

				// Notificar al jugador 1 que es NAVAL
				VoMensaje mensaje = VoMensaje.builder()	// ver escena 1
					.nombre(nombre)
					.equipo(Equipo.NAVAL)
					.build();
				String respuesta = mapper.writeValueAsString(mensaje);
				messagingTemplate.convertAndSend("/topic/login", respuesta);
				
			} else if (jugador2 == null && !jugador1.equals(nombre)) {
				jugador2 = nombre;
				servicios.crearPartida(jugador1, jugador2);
				String clave = servicios.generarClave(jugador1, jugador2);

				// Notificar al jugador 2 que es AEREO
				VoMensaje mensaje = VoMensaje.builder()	// ver escena 1
					.nombre(nombre)
					.equipo(Equipo.AEREO)
					.build();
				String respuesta = mapper.writeValueAsString(mensaje);
				messagingTemplate.convertAndSend("/topic/login", respuesta);
				
				// Notificar a ambos jugadores que la partida está lista
				String canalPartida = getCanalPartida(servicios.getPartidaJugador(jugador2));
				VoMensaje mensajeJugador1 = VoMensaje.builder() // ver escena 1
					.nombre(jugador1)
					.equipo(Equipo.NAVAL)
					.canal(canalPartida)
					.build();
				String respuestaJugador1 = mapper.writeValueAsString(mensajeJugador1);
				messagingTemplate.convertAndSend("/topic/partida-lista", respuestaJugador1);
				
				VoMensaje mensajeJugador2 = VoMensaje.builder()	// ver escena 1
					.nombre(nombre)
					.equipo(Equipo.AEREO)
					.canal(canalPartida)
					.build();
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
						}
					});
					String estadoInicial = mensajeRetorno(p);
					messagingTemplate.convertAndSend(canalInicio, estadoInicial);
				}
			} else {
				jugador1 = null;
				jugador2 = null;
				enviarErrorLogin(nombre, "No se pudo asignar jugador. Intenta nuevamente"); // "No se pudo asignar jugador. Intenta nuevamente"
			}
		} catch (Exception e) {
			e.printStackTrace();
			enviarErrorLogin(nombre, "Error interno al crear jugador"); // "Error interno al crear jugador"
		}
	}

	private void enviarErrorLogin(String nombre, String error) {
		try {
			VoMensaje mensajeError = VoMensaje.builder()	// ver escena1
				.tipoMensaje(3)
				.nombre(nombre)
				.evento(error)
				.build();
			String respuesta = mapper.writeValueAsString(mensajeError);
			messagingTemplate.convertAndSend("/topic/login", respuesta);
		} catch (Exception ex) {
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

	
	//maneja los ataques entre drones
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
		int x = (int) data.get("xf");
		int y = (int) data.get("yf");
		Posicion pos = new Posicion(x, y);
		
		p.recargarMunicion(pos);
	}

	public void handleGuardar(String solicitante, Partida p) {
		String nombre = solicitante.equals(p.getJugadorAereo().getNombre())
			? p.getJugadorNaval().getNombre()
			: p.getJugadorAereo().getNombre();
		try {
			String clave = servicios.generarClave(p.getJugadorNaval().getNombre(), p.getJugadorAereo().getNombre());
			solicitanteGuardadoPendientePorClave.put(clave, solicitante);
			aprobacionRivalPendientePorClave.put(clave, true);

			boolean reemplazoConEmpate = servicios.existePartidaGuardadaEntre(solicitante, nombre);
			reemplazoEmpatePendientePorClave.put(clave, reemplazoConEmpate);

			Set<String> jugadoresConGuardado = obtenerJugadoresConPartidaGuardada(solicitante, nombre);
			if (!jugadoresConGuardado.isEmpty()) {
				reemplazoGuardadoPendientePorClave.put(clave, true);
				confirmacionReemplazoPendientePorClave.put(clave, new HashSet<>(jugadoresConGuardado));
				if (jugadoresConGuardado.contains(solicitante)) {
					enviarMensajeGuardado(p, solicitante, obtenerEventoConfirmacionReemplazo(clave));
					return;
				}
			} else {
				reemplazoGuardadoPendientePorClave.remove(clave);
				confirmacionReemplazoPendientePorClave.remove(clave);
				reemplazoEmpatePendientePorClave.remove(clave);
			}

			enviarMensajeGuardado(p, nombre, "SOLICITUD");
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	public void handleRechazar(String nombre, Partida p) {
		try {
			String clave = servicios.generarClave(p.getJugadorNaval().getNombre(), p.getJugadorAereo().getNombre());
			String solicitante = solicitanteGuardadoPendientePorClave.get(clave);
			if (solicitante == null) {
				return;
			}

			if (Boolean.TRUE.equals(aprobacionRivalPendientePorClave.get(clave))) {
				limpiarEstadoGuardadoPendiente(clave);
				enviarMensajeGuardado(p, solicitante, "RECHAZADA");
				return;
			}

			Set<String> pendientesReemplazo = confirmacionReemplazoPendientePorClave.get(clave);
			if (pendientesReemplazo != null && pendientesReemplazo.contains(nombre)) {
				Set<String> jugadoresANotificar = new HashSet<>(pendientesReemplazo);
				jugadoresANotificar.remove(nombre);
				if (!nombre.equals(solicitante)) {
					jugadoresANotificar.add(solicitante);
				}
				limpiarEstadoGuardadoPendiente(clave);
				enviarMensajesGuardado(p, jugadoresANotificar, "RECHAZADA");
				return;
			}

			limpiarEstadoGuardadoPendiente(clave);
			enviarMensajeGuardado(p, solicitante, "RECHAZADA");
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	public void handleAceptar(String nombre, Partida p) {
		String clave = servicios.generarClave(p.getJugadorNaval().getNombre(), p.getJugadorAereo().getNombre());
		try {
			String solicitante = solicitanteGuardadoPendientePorClave.get(clave);
			if (solicitante == null) {
				return;
			}

			String otroJugador = solicitante.equals(p.getJugadorAereo().getNombre())
				? p.getJugadorNaval().getNombre()
				: p.getJugadorAereo().getNombre();

			if (Boolean.TRUE.equals(aprobacionRivalPendientePorClave.get(clave))) {
				Set<String> pendientesReemplazoIniciales = confirmacionReemplazoPendientePorClave.get(clave);
				if (nombre.equals(solicitante)
					&& pendientesReemplazoIniciales != null
					&& pendientesReemplazoIniciales.remove(solicitante)) {
					enviarMensajeGuardado(p, otroJugador, "SOLICITUD");
					return;
				}

				aprobacionRivalPendientePorClave.remove(clave);
				Set<String> pendientesReemplazoRestantes = confirmacionReemplazoPendientePorClave.get(clave);
				if (pendientesReemplazoRestantes != null && !pendientesReemplazoRestantes.isEmpty()) {
					enviarMensajesGuardado(p, new HashSet<>(pendientesReemplazoRestantes), obtenerEventoConfirmacionReemplazo(clave));
					return;
				}
			}

			Set<String> pendientesReemplazo = confirmacionReemplazoPendientePorClave.get(clave);
			if (pendientesReemplazo != null && pendientesReemplazo.remove(nombre)) {
				if (!pendientesReemplazo.isEmpty()) {
					return;
				}
				confirmacionReemplazoPendientePorClave.remove(clave);
			} else if (pendientesReemplazo != null && !pendientesReemplazo.isEmpty()) {
				enviarMensajesGuardado(p, new HashSet<>(pendientesReemplazo), obtenerEventoConfirmacionReemplazo(clave));
				return;
			}

			solicitanteGuardadoPendientePorClave.remove(clave);
			boolean reemplazarGuardadas = Boolean.TRUE.equals(reemplazoGuardadoPendientePorClave.remove(clave));
			confirmacionReemplazoPendientePorClave.remove(clave);
			aprobacionRivalPendientePorClave.remove(clave);
			reemplazoEmpatePendientePorClave.remove(clave);

			if (!servicios.guardarPartida(p.getJugadorNaval().getNombre(), p.getJugadorAereo().getNombre(), reemplazarGuardadas)) {
				String evento = reemplazarGuardadas
					? "No se pudo reemplazar la partida guardada anterior."
					: "No se pudo guardar: alguno de los jugadores ya tiene una partida guardada.";
				VoMensaje errorSolicitante = VoMensaje.builder()
					.tipoMensaje(3)
					.nombre(solicitante)
					.evento(evento)
					.build();
				VoMensaje errorAceptador = VoMensaje.builder()
					.tipoMensaje(3)
					.nombre(otroJugador)
					.evento(evento)
					.build();
				String respSol = mapper.writeValueAsString(errorSolicitante);
				String respAcp = mapper.writeValueAsString(errorAceptador);
				String canal = getCanalPartida(p);
				messagingTemplate.convertAndSend(canal, respSol);
				messagingTemplate.convertAndSend(canal, respAcp);
				return;
			}

			enviarMensajeGuardado(p, solicitante, "ACEPTADA");
			enviarMensajeGuardado(p, otroJugador, "ACEPTADA");
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	private void enviarMensajeGuardado(Partida p, String destino, String evento) throws Exception {
		VoMensaje mensajeGuardado = VoMensaje.builder()
			.tipoMensaje(2)
			.nombre(destino)
			.evento(evento)
			.build();
		String respuesta = mapper.writeValueAsString(mensajeGuardado);
		String canal = getCanalPartida(p);
		messagingTemplate.convertAndSend(canal, respuesta);
	}

	private void enviarMensajesGuardado(Partida p, Set<String> destinos, String evento) throws Exception {
		for (String destino : destinos) {
			enviarMensajeGuardado(p, destino, evento);
		}
	}

	private Set<String> obtenerJugadoresConPartidaGuardada(String jugadorA, String jugadorB) {
		Set<String> jugadoresConGuardado = new HashSet<>();
		if (servicios.existePartidaGuardada(jugadorA)) {
			jugadoresConGuardado.add(jugadorA);
		}
		if (servicios.existePartidaGuardada(jugadorB)) {
			jugadoresConGuardado.add(jugadorB);
		}
		return jugadoresConGuardado;
	}

	private void limpiarEstadoGuardadoPendiente(String clave) {
		solicitanteGuardadoPendientePorClave.remove(clave);
		aprobacionRivalPendientePorClave.remove(clave);
		reemplazoGuardadoPendientePorClave.remove(clave);
		confirmacionReemplazoPendientePorClave.remove(clave);
		reemplazoEmpatePendientePorClave.remove(clave);
	}

	private String obtenerEventoConfirmacionReemplazo(String clave) {
		return Boolean.TRUE.equals(reemplazoEmpatePendientePorClave.get(clave))
			? "CONFIRMAR_REEMPLAZO_EMPATE"
			: "CONFIRMAR_REEMPLAZO";
	}

	//Genera el mensaje de retorno con el estado actual del juego
	public String mensajeRetorno(Partida p) {
		String t = null;
		try {
			// Crear VoMensaje con la fase y la grilla completa
			VoMensaje mensaje = VoMensaje.builder()
				.tipoMensaje(1) //
				.fasePartida(p.getFasePartida())
				.vidaPortaN(p.getPortaDronesNaval().getVida())
				.vidaPortaA(p.getPortaDronesAereo().getVida())
				.cantDronesN(p.cantDronesEquipo(Equipo.NAVAL))
				.cantDronesA(p.cantDronesEquipo(Equipo.AEREO))
				.turnosMuerteSubita(p.getTurnosMuerteSubita())
				.equipo(p.getTurno())
				.grilla(p.getTablero().getGrillaLineal())
				.build(); 
			t = mapper.writeValueAsString(mensaje);
		} catch (Exception e) {
			e.printStackTrace();
		}
		return t;
	}

	//canal STOMP asociado a una partida /topic/{jugadorNaval}-{jugadorAereo}
	private String getCanalPartida(Partida p) {
		if (p == null || p.getJugadorNaval() == null || p.getJugadorAereo() == null) {
			return "/topic/game"; // fallback
		}
		String nav = p.getJugadorNaval().getNombre();
		String aer = p.getJugadorAereo().getNombre();
		return "/topic/" + nav + "-" + aer;
	}
	// Estado para carga de partida guardada (cola por pareja)
	// clave = "{naval}-{aereo}", valor = jugador que está esperando
	private final Map<String, String> cargaPendientePorClave = new ConcurrentHashMap<>();
	// índice inverso para cancelar rápido
	private final Map<String, String> clavePendientePorJugador = new ConcurrentHashMap<>();

	@MessageMapping("/cancelar-cargar")
	public void handleCancelarCargar(@Payload Map<String, Object> data) {
		try {
			String nombre = (String) data.get("nombre");
			if (nombre == null || nombre.trim().isEmpty()) {
				return;
			}
			String clave = clavePendientePorJugador.remove(nombre);
			if (clave != null) {
				cargaPendientePorClave.remove(clave, nombre);
			}
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	@MessageMapping("/cargar")
	public void handleCargar(@Payload Map<String, Object> data, @Header("simpSessionId") String sessionId) {
		try {
			String nombre = (String) data.get("nombre");
			sesionJugadores.registrar(sessionId, nombre);

			if (nombre == null || nombre.trim().isEmpty()) {
				enviarErrorLogin("", "Nombre inválido");
				return;
			}

			if (servicios.existePartida(nombre)) {
				enviarErrorLogin(nombre, "El jugador ya está en una partida activa");
				return;
			}

			// Verifica si el jugador tiene partida guardada
			if (!servicios.existePartidaGuardada(nombre)) {
				// Enviar mensaje de error especial para carga
				try {
					VoMensaje mensajeError = VoMensaje.builder()
						.tipoMensaje(3)
						.nombre(nombre)
						.evento("No tienes partida guardada")
						.build();
					String respuesta = mapper.writeValueAsString(mensajeError);
					messagingTemplate.convertAndSend("/topic/login", respuesta);
				} catch (Exception e) {
					e.printStackTrace();
				}
				return;
			}

			// Determinar la pareja correcta asociada a la partida guardada de este jugador.
			String[] pareja = servicios.obtenerParejaPartidaGuardada(nombre);
			if (pareja == null || pareja.length != 2) {
				enviarErrorLogin(nombre, "No se pudo determinar la pareja de la partida guardada");
				return;
			}
			String jugadorNaval = pareja[0];
			String jugadorAereo = pareja[1];
			String clave = servicios.generarClave(jugadorNaval, jugadorAereo);

			// Cola por clave: el primer jugador espera; el segundo (de la misma pareja) dispara la carga.
			String esperando = cargaPendientePorClave.putIfAbsent(clave, nombre);
			if (esperando == null) {
				clavePendientePorJugador.put(nombre, clave);
				return;
			}
			if (esperando.equals(nombre)) {
				// ya estaba esperando
				return;
			}

			// Segundo jugador llegó para esta clave -> limpiar cola y cargar.
			cargaPendientePorClave.remove(clave);
			clavePendientePorJugador.remove(esperando);
			clavePendientePorJugador.remove(nombre);

			Partida partidaCargada = servicios.cargarPartida(jugadorNaval, jugadorAereo);
			if (partidaCargada == null) {
				enviarErrorLogin(esperando, "Error al cargar la partida");
				enviarErrorLogin(nombre, "Error al cargar la partida");
				return;
			}
				partidaCargada.actualizarTablero();
				partidaCargada.actualizarVision();
				
				String canalPartida = getCanalPartida(partidaCargada);

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

				String canalInicio = getCanalPartida(partidaCargada);
				partidaCargada.setMensajeListener((vo) -> {
					try {
						String mensajeVo = mapper.writeValueAsString(vo);
						messagingTemplate.convertAndSend(canalInicio, mensajeVo);
					} catch (Exception ex) {
					}
				});
				String estadoInicial = mensajeRetorno(partidaCargada);
				messagingTemplate.convertAndSend(canalInicio, estadoInicial);
		} catch (Exception e) {
			e.printStackTrace();
			enviarErrorLogin((String) data.get("nombre"), "Error interno al cargar partida");
		}
	}

	@MessageMapping("/ranking")
	public void handleRanking(@Payload Map<String, Object> data) {
		String t = null;
		try {
			t = mapper.writeValueAsString(servicios.getRanking());
			messagingTemplate.convertAndSend("/topic/ranking", t );
		} catch (Exception e) {
			e.printStackTrace();
		}
	}	
}