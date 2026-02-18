package grupo2.fod.fogofdrones.controlador;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class GameController {
	
	@GetMapping("/")
	public String showChatPage() {
		return "pagina.html";
	}
	
	@GetMapping("/test-game")
	public String index() {
		return "index.html";
	}
	

	// @GetMapping("/lobby")
	// public String showLobby() {
	//     return "lobby";
	// }
	
	// @GetMapping("/game")
	// public String showGame() {
	//     return "game";
	// }
}