package grupo2.fod.fogofdrones.service;

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

// administra las conecciones al web socket
@Service
public class GameHandler extends TextWebSocketHandler {
	
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
	
	@Override
	protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
		// enviar a los receptores el mensaje que haya enviado un usuario
		// al recibir un mensaje lo distribuye a todas las sesiones activas
		for (WebSocketSession webSocketSession : sessions) {
			try {
				webSocketSession.sendMessage(message);
			} catch (IOException e) {
				LOGGER.error(e.getMessage(),e);
			}
		}
	}
}
