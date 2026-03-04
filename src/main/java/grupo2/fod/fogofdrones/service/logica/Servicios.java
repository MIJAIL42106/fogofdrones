package grupo2.fod.fogofdrones.service.logica;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import grupo2.fod.fogofdrones.service.persistencia.JugadoresRepositorio;
import grupo2.fod.fogofdrones.service.persistencia.Persistencia;
import grupo2.fod.fogofdrones.service.persistencia.PersistenciaRepositorio;

@Service
public class Servicios{

    @Autowired
    private JugadoresRepositorio repo;
    @Autowired
    private PersistenciaRepositorio repoPartidas;
    // objeto jugador/cliente con referencia a conexion, no la guardo separada la accedo desde ese objeto
    // -separacion en capas pero permite acceso desde el
    // otro objeto con web socket y jugador, jugador conoce coexion y web socket conoce jugador
    // guardar id de sesion en mapa no necesario todo objeto
    // en handler mandar a esta conexion tal mensaje
    private Map<String,Partida> partidas = new ConcurrentHashMap<>();

    public void crearPartida(String jugador1, String jugador2) {
        
        String clave = generarClave(jugador1, jugador2);
        if (partidas.containsKey(clave)) {        // ya existe una partidad con esos jugadores
            System.out.println("Error: ya existe una partida con esos jugadores");
        } else {
            Jugador naval = repo.findById(jugador1).orElse(new Jugador(jugador1, 0, 0));
            Jugador aereo = repo.findById(jugador2).orElse(new Jugador(jugador2, 0, 0));

            repo.save(naval);
            repo.save(aereo);

            Partida partida = new Partida(naval, aereo);  // asigna el 1 al naval  y el 2 al aereo
            partidas.put(clave, partida);
            partida.actualizarVision();
        }
    }

    public String generarClave(String nombre1, String nombre2) {
        return (nombre1 + '-' + nombre2);
    }

    public Partida getPartida(String nombreJug1, String nombreJug2) {
        String clave = generarClave(nombreJug1, nombreJug2);
        return partidas.get(clave);
    }

    public Partida getPartidaPorClave(String clave) {
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
        if (partida == null) {
            return;
        }
        Equipo ganador = partida.getEquipoGanador();
        switch (ganador) {
            case NAVAL: {
                partida.getJugadorNaval().sumarVictoria();
                partida.getJugadorNaval().sumarPuntos(10);
                if(partida.getJugadorAereo().getPuntos() > 0) {
                    partida.getJugadorAereo().sumarPuntos(-5);
                }
            } break;
            case AEREO: {
                partida.getJugadorAereo().sumarVictoria();
                partida.getJugadorAereo().sumarPuntos(10);
                if(partida.getJugadorNaval().getPuntos() > 0) {
                    partida.getJugadorNaval().sumarPuntos(-5);
                }
            } break;
            default:
                // Empate, no se suman victorias ni puntos
                break;
        }
        repo.save(partida.getJugadorNaval());
        repo.save(partida.getJugadorAereo());
        eliminarPartida(nombre1, nombre2);
    }

    public boolean guardarPartida(String nombre1, String nombre2) {
        String clave = generarClave(nombre1, nombre2);
        Partida partida = partidas.get(clave);
        if (partida != null) {
            // Regla: cada jugador solo puede tener UNA partida guardada.
            // Si cualquiera de los dos ya tiene una guardada, no sobrescribir ni crear otra.
            if (existePartidaGuardada(nombre1) || existePartidaGuardada(nombre2)) {
                System.out.println("[GUARDAR] RECHAZADA: alguno de los jugadores ya tiene partida guardada");
                return false;
            }
            ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            System.out.println("[GUARDAR] Guardando partida: " + clave);
            System.out.println("[GUARDAR] Fase actual: " + (partida.getFasePartida() != null ? partida.getFasePartida() : "NULL"));
            
            Persistencia persistencia = new Persistencia(partida, nombre2, nombre1);
            repoPartidas.save(persistencia);
            
            System.out.println("[GUARDAR] Partida guardada exitosamente");
            eliminarPartida(nombre1, nombre2);
            return true;
        } else {
            System.out.println("[GUARDAR] ERROR: No se encontró la partida " + clave);
            return false;
        }
    }
    /* 
    public void cargarPartida(String nombre1) {
        Persistencia persistencia = repoPartidas.findByJugador(nombre1).orElse(null);
        if (persistencia != null) {
            Partida partida = persistencia.getPartida();
            partida.actualizarTablero();
            String jugadorA = partida.getJugadorAereo().getNombre();
            String jugadorN = partida.getJugadorNaval().getNombre();
            String clave = generarClave(jugadorN, jugadorA);
            partidas.put(clave, partida);
            repoPartidas.delete(persistencia);
        } else {
            System.out.println("Error: no se encontró una partida con ese nombre");
        }
    }
    */

    // Verifica si existe una partida guardada para el jugador
    public boolean existePartidaGuardada(String nombreJugador) {
        return repoPartidas.findByJugador(nombreJugador).isPresent();
    }

    /**
     * Devuelve la pareja (jugadorNaval, jugadorAereo) asociada a la partida guardada
     * donde participa {@code nombreJugador}. Si no existe, retorna null.
     */
    public String[] obtenerParejaPartidaGuardada(String nombreJugador) {
        Persistencia persistencia = repoPartidas.findByJugador(nombreJugador).orElse(null);
        if (persistencia == null) {
            return null;
        }
        return new String[] { persistencia.getJugadorNaval(), persistencia.getJugadorAereo() };
    }

    // Carga la partida guardada entre dos jugadores y la pone en memoria
    public Partida cargarPartida(String nombre1, String nombre2) {
        Persistencia persistencia = repoPartidas.findByJugador(nombre1).orElse(null);
        if (persistencia == null) {
            persistencia = repoPartidas.findByJugador(nombre2).orElse(null);
        }
        if (persistencia != null) {
            Partida partida = persistencia.getPartida();
            
            // DEBUG: Verificar qué se cargó
            System.out.println("[CARGAR] Partida cargada: " + partida);
            System.out.println("[CARGAR] Fase cargada: " + (partida.getFasePartida() != null ? partida.getFasePartida() : "NULL"));
            
            // VALIDACIÓN: Si la fase es null, establecer a DESPLIEGUE (valor por defecto)
            if (partida.getFasePartida() == null) {
                System.out.println("[CARGAR] ADVERTENCIA: Fase es null. Estableciendo a DESPLIEGUE por defecto");
                partida.setFasePartida(FasePartida.DESPLIEGUE);
            }
            
            /*
            if (persistencia.getPartida() != null && persistencia.getPartida().getFasePartida() != null) {
                partida.setFasePartida(persistencia.getPartida().getFasePartida());
            } */
            
            String jugadorA = partida.getJugadorAereo().getNombre();
            String jugadorN = partida.getJugadorNaval().getNombre();
            String clave = generarClave(jugadorN, jugadorA);
            partidas.put(clave, partida);
            repoPartidas.delete(persistencia);
            
            // borrar
            //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            getPartidaPorClave(clave).actualizarTablero();
            getPartidaPorClave(clave).actualizarVision();
            getPartida(jugadorN, jugadorA).actualizarTablero();
            getPartida(jugadorN, jugadorA).actualizarVision();

            System.out.println("[CARGAR] Partida restaurada en memoria: " + clave);
            return partida;
        } else {
            System.out.println("Error: no se encontró una partida con esos jugadores");
            return null;
        }
    }

    public List<Jugador> getRanking() {
        return repo.findFirst12ByOrderByPuntosDescVictoriasDesc();
    }
}