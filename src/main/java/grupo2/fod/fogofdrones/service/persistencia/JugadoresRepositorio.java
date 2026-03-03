package grupo2.fod.fogofdrones.service.persistencia;

import java.util.List;

import org.springframework.data.repository.CrudRepository;

import grupo2.fod.fogofdrones.service.logica.Jugador;

public interface JugadoresRepositorio extends CrudRepository<Jugador, String > {

    
	List<Jugador> findFirst12ByOrderByPuntosDescVictoriasDesc();
	//List<Jugador> findAllByOrderByPuntosDescVictoriasDesc();
}

