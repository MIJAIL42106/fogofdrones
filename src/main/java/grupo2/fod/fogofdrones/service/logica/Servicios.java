package grupo2.fod.fogofdrones.service.logica;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import grupo2.fod.fogofdrones.service.persistencia.JugadoresRepositorio;

@Service
public class Servicios{

    @Autowired
    private JugadoresRepositorio repo;

    private Map<String,Partida> partidas = new ConcurrentHashMap<>();

    public void crearPartida(String jugador1, String jugador2) {
        String clave = generarClave(jugador1, jugador2);
        
        if (partidas.containsKey(clave)) {        // ya existe una partidad con esos jugadores
            System.out.println("Error: ya existe una partida con esos jugadores");
        } else {
            Jugador Naval = repo.findById(jugador1).orElse(new Jugador(jugador1, 0, 0));
            Jugador Aereo = repo.findById(jugador2).orElse(new Jugador(jugador2, 0, 0));

            repo.save(Naval);
            repo.save(Aereo);

            Partida partida = new Partida(Naval, Aereo);  // asigna el 1 al naval  y el 2 al aereo
            partidas.put(clave, partida);
        }
    }

    public String generarClave(String nombre1, String nombre2) {
        return (nombre1 + '-' + nombre2);
    }

    public Partida getPartida(String nombreJug1, String nombreJug2) {
        String clave = generarClave(nombreJug1, nombreJug2);
        return partidas.get(clave);
    }

    public void eliminarPartida(String nombreJug1, String nombreJug2) {
        String clave = generarClave(nombreJug1, nombreJug2);
        partidas.remove(clave);
    }

    public boolean existePartida(String nombreJugador) {
        boolean existe = false;
        for (Partida partida : partidas.values()) {
            if (partida.getJugadorNaval().getNombre().equals(nombreJugador) || partida.getJugadorAereo().getNombre().equals(nombreJugador)) {
                existe = true;
            }
        }
        return existe; // No se encontró una partida para el jugador
    }

    public Partida getPartidaJugador(String nombreJugador) {
        Partida partida = null;
        for (Partida p : partidas.values()) {
            if (p.getJugadorNaval().getNombre().equals(nombreJugador) || p.getJugadorAereo().getNombre().equals(nombreJugador)) {
                partida = p;
            }
        }
        return partida; // No se encontró una partida para el jugador
    }

    public Map<String, Partida> getPartidas() {
        return partidas;
    }

    public void finalizarPartida(String nombre1, String nombre2) {
        String clave = generarClave(nombre1, nombre2);
        Partida partida = partidas.get(clave);
        Equipo ganador = partida.getEquipoGanador();
        switch (ganador) {
            case NAVAL:
                partida.getJugadorNaval().sumarVictoria();
                partida.getJugadorNaval().sumarPuntos(10); // Ejemplo de puntos por victoria
                break;
            case AEREO:
                partida.getJugadorAereo().sumarVictoria();
                partida.getJugadorAereo().sumarPuntos(10); // Ejemplo de puntos por victoria
                break;
            default:
                // Empate, no se suman victorias ni puntos
                break;
        }
        eliminarPartida(nombre1, nombre2);
    }

}