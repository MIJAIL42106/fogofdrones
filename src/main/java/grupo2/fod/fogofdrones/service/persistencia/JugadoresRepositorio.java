package grupo2.fod.fogofdrones.service.persistencia;

import org.springframework.data.repository.CrudRepository;

import grupo2.fod.fogofdrones.service.logica.Jugador;

public interface JugadoresRepositorio extends CrudRepository<Jugador, String > {
}

