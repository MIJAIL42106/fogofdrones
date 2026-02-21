package grupo2.fod.fogofdrones.service;

import grupo2.fod.fogofdrones.service.logica.Partida;	///////////////////////////////////////////////////////////////////////////////////////
import grupo2.fod.fogofdrones.service.logica.Jugador;
import grupo2.fod.fogofdrones.service.logica.Posicion;
import grupo2.fod.fogofdrones.service.logica.Equipo;
import grupo2.fod.fogofdrones.service.valueObject.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import grupo2.fod.fogofdrones.service.logica.FasePartida;

// tipo de lista optimizada para concurrencia
// no util si hay constante modificacion
// probablemente necesitemos otro tipo de lista
import java.io.IOException;
import java.util.concurrent.CopyOnWriteArrayList;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.stereotype.Service;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import com.fasterxml.jackson.databind.ObjectMapper;

// administra las conecciones al web socket
@Service
public class GameHandler extends TextWebSocketHandler {
	
	private Partida p = null;	///////////////////////////////////////////////////////////////////////////////////////////////////////////////
	private ObjectMapper mapper = new ObjectMapper();
	private Jugador jugador1 = null;
	private Jugador jugador2 = null;

	private static final Logger LOGGER = LoggerFactory.getLogger(GameHandler.class);
	// mapa de partidas y sesiones de partidas 
	private final CopyOnWriteArrayList<WebSocketSession> sessions = new CopyOnWriteArrayList<WebSocketSession>();

	@Override
	public void afterConnectionEstablished(WebSocketSession session) throws Exception {
		// que hago cuando se establece una coneccion al socket
		// agregarlo a lista de sessions
		sessions.add(session);
	}
	
	@Override
	public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
		// que hago despues de que se cierra una coneccion
		// remuevo la sesion pasada por parametro de sessions
		sessions.remove(session);
	}
	
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/* 
	public void handleCrear(Map<String, Object> data) {
		String nombre = (String) data.get("nombre");
		if (jugador1 == null){	
			jugador1 = new Jugador(nombre, 0, 0);
		} else if (jugador2 == null) {
			jugador2 = new Jugador(nombre, 0, 0);
			p = new Partida(jugador1,jugador2);
			System.out.println("Partida creada con jugadores: " + jugador1.getNombre() + " y " + jugador2.getNombre());
		}
	}*/
	
	public void handleDesplegar(Map<String, Object> data) {
		int x = (int) data.get("xi");
		int y = (int) data.get("yi");
		Posicion pos = new Posicion( x, y);

		p.desplegarDron(pos);

		System.out.println("Dron desplegado en: " + x + ", " + y);
		System.out.println("turno: " + p.getTurno());
	}

	public void handleMover(Map<String, Object> data) {
		int xi = (int) data.get("xi");
		int yi = (int) data.get("yi");
		Posicion posi = new Posicion( xi, yi);
		int xf = (int) data.get("xf");
		int yf = (int) data.get("yf");
		Posicion posf = new Posicion( xf, yf);
		
		p.mover(posi, posf);
		p.terminarTurno();

		System.out.println("Dron se movio desde: " + xi + ", " + yi + " hasta: " + xf + ", " + yf);
		System.out.println("turno: " + p.getTurno());
	}

	public void handleAtacar(Map<String, Object> data) {
		int xi = (int) data.get("xi");
		int yi = (int) data.get("yi");
		Posicion posi = new Posicion( xi, yi);
		int xf = (int) data.get("xf");
		int yf = (int) data.get("yf");
		Posicion posf = new Posicion( xf, yf);
		
		p.atacar(posi, posf);
		p.terminarTurno();

		System.out.println("Dron ataco desde: " + xi + ", " + yi + " hasta: " + xf + ", " + yf);
		System.out.println("turno: " + p.getTurno());
	}

	public void handleRecargar(Map<String, Object> data) {
		int x = (int) data.get("xi");
		int y = (int) data.get("yi");
		Posicion pos = new Posicion( x, y);
		
		p.recargarMunicion(pos);

		System.out.println("Dron recargo municion en: " + x + ", " + y);
		System.out.println("turno: " + p.getTurno());
	}
	/*
	public void handleTerminarTurno(Map<String, Object> data) {
		
	}*/

	public String mensajeRetorno() {
		String t = null;
		try { // Convert the Java object to a JSON string
			VoMensaje mensaje = new VoMensaje(p.getFasePartida(), p.getTablero());
    		t = mapper.writeValueAsString(mensaje);
			//t = mapper.writeValueAsString(p.getFasePartida());
    		//System.out.println("STRING JSON DE SERVIDOR A CLIENTE DEL MAPA:" + t);
		} catch (Exception e) {
    		e.printStackTrace();
		}
		return t;
	}

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	@Override
	protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
		// enviar a los receptores el mensaje que haya enviado un usuario
		// al recibir un mensaje lo distribuye a todas las sesiones activas
		
		// mensaje mapeado para poder extraer componentes
		String payload = message.getPayload();
		Map<String, Object> data = mapper.readValue(payload, Map.class);

		//
		String nombre = (String) data.get("nombre");
		TextMessage respuesta = null;

		if(p == null){
			if (jugador1 == null){	
				jugador1 = new Jugador(nombre, 0, 0);
				System.out.println("Jugador 1 creado: " + jugador1.getNombre());
				
				VoMensaje mensaje = new VoMensaje(nombre, Equipo.NAVAL);
				String t = mapper.writeValueAsString(mensaje);
				respuesta = new TextMessage(t);

			} else if (jugador2 == null && jugador1.getNombre().equals(nombre)) {
				jugador2 = new Jugador(nombre, 0, 0); 
				System.out.println("Jugador 2 creado: " + jugador2.getNombre());
				p = new Partida(jugador1,jugador2);
				System.out.println("Partida creada con jugadores: " + jugador1.getNombre() + " y " + jugador2.getNombre());

				VoMensaje mensaje = new VoMensaje(nombre, Equipo.AEREO);
				String t = mapper.writeValueAsString(mensaje);
				respuesta = new TextMessage(t);
			}
		} else if (p.esMiTurno(nombre)) {
			// string accion determina la accion que el cliente quiere realizar}
			String accion = (String) data.get("accion");
			System.out.println(nombre + " - " + accion);////////////////////////
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
					//enviarError(session, "Accion desconocida: " + accion);
					break;
				}
				
			}
			respuesta = new TextMessage(mensajeRetorno());
		} else {
			VoMensaje mensaje = new VoMensaje(nombre, "No es tu turno");
			String t = mapper.writeValueAsString(mensaje);
			respuesta = new TextMessage(t);
			//System.out.println("No es tu turno: " + nombre);
		}

		for (WebSocketSession webSocketSession : sessions) {
			try {
				//System.out.println("STRING JSON DE SERVIDOR A CLIENTE DEL MAPA:" + respuesta.getPayload());
				webSocketSession.sendMessage(respuesta);
			} catch (IOException e) {
				LOGGER.error(e.getMessage(),e);
			}
		}
		/* 
		for (WebSocketSession webSocketSession : sessions) {
				try {
					webSocketSession.sendMessage(message);
				} catch (IOException e) {
					LOGGER.error(e.getMessage(),e);
				}
			}*/
		//  mensajes
		// tipo: nombres iniciales, despliegue una posicion por mensaje , nombre posiciones accion


		
	}

}