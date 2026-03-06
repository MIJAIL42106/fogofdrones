package grupo2.fod.fogofdrones.controlador;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class GameController {
	
	@GetMapping("/")
	public String showChatPage() {
		return "index.html";
	}

}