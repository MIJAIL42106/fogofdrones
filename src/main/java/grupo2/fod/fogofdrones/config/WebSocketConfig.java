package grupo2.fod.fogofdrones.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

// Configuración del servidor WebSocket con STOMP

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
	
	@Override
	public void configureMessageBroker(MessageBrokerRegistry config) {
		// Habilita un simple broker de mensajes en memoria con prefijo /topic para broadcast
		config.enableSimpleBroker("/topic", "/queue");
		// Prefijo para mensajes enviados desde el cliente
		config.setApplicationDestinationPrefixes("/app");
	}
	
	@Override
	public void registerStompEndpoints(StompEndpointRegistry registry) {
		// Registra el endpoint STOMP, permitiendo fallback a SockJS
		registry.addEndpoint("/game")
				.setAllowedOrigins("*")
				.withSockJS();
	}

}