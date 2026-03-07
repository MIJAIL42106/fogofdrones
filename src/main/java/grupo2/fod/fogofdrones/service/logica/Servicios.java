package grupo2.fod.fogofdrones.service.logica;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
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
    private final Map<String,Partida> partidas = new ConcurrentHashMap<>();
    private final Map<String, Long> finalizacionPendientePorClave = new ConcurrentHashMap<>();

    public void marcarFinalizacionPendiente(String jugadorNaval, String jugadorAereo) {
        String clave = generarClave(jugadorNaval, jugadorAereo);
        finalizacionPendientePorClave.put(clave, System.currentTimeMillis());
    }

    public boolean consumirFinalizacionPendiente(String jugadorNaval, String jugadorAereo, long maxAgeMs) {
        String clave = generarClave(jugadorNaval, jugadorAereo);
        Long ts = finalizacionPendientePorClave.get(clave);
        if (ts == null) {
            return false;
        }
        long age = System.currentTimeMillis() - ts;
        if (age > maxAgeMs) {
            finalizacionPendientePorClave.remove(clave, ts);
            return false;
        }
        return finalizacionPendientePorClave.remove(clave, ts);
    }

    public void crearPartida(String jugador1, String jugador2) {
        
        String clave = generarClave(jugador1, jugador2);
        finalizacionPendientePorClave.remove(clave);
        if (!partidas.containsKey(clave)) {        // ya existe una partidad con esos jugadores
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
        finalizacionPendientePorClave.remove(clave);
        Partida partida = partidas.remove(clave);
        if (partida == null) {
            return;
        }
        registrarResultado(partida, partida.getEquipoGanador());
    }

    private void registrarResultado(Partida partida, Equipo ganador) {
        Jugador jugadorNaval = repo.findById(partida.getJugadorNaval().getNombre())
            .orElse(partida.getJugadorNaval());
        Jugador jugadorAereo = repo.findById(partida.getJugadorAereo().getNombre())
            .orElse(partida.getJugadorAereo());

        switch (ganador) {
            case NAVAL: {
                jugadorNaval.sumarVictoria();
                jugadorNaval.sumarPuntos(10);
                if(jugadorAereo.getPuntos() > 0) {
                    jugadorAereo.sumarPuntos(-5);
                }
            } break;
            case AEREO: {
                jugadorAereo.sumarVictoria();
                jugadorAereo.sumarPuntos(10);
                if(jugadorNaval.getPuntos() > 0) {
                    jugadorNaval.sumarPuntos(-5);
                }
            } break;
            default:
                break;
        }
        repo.save(jugadorNaval);
        repo.save(jugadorAereo);
    }

    public boolean guardarPartida(String nombre1, String nombre2) {
        return guardarPartida(nombre1, nombre2, false);
    }

    public boolean guardarPartida(String nombre1, String nombre2, boolean reemplazarGuardadas) {
        String clave = generarClave(nombre1, nombre2);
        Partida partida = partidas.get(clave);
        if (partida != null) {
            boolean hayGuardadasPrevias = existePartidaGuardada(nombre1) || existePartidaGuardada(nombre2);
            if (hayGuardadasPrevias && !reemplazarGuardadas) {
                return false;
            }
            if (hayGuardadasPrevias) {
                eliminarPartidasGuardadasPrevias(nombre1, nombre2);
            }
            
            Persistencia persistencia = new Persistencia(partida, nombre2, nombre1);
            repoPartidas.save(persistencia);

            eliminarPartida(nombre1, nombre2);
            return true;
        } else {
            return false;
        }
    }

    private void eliminarPartidasGuardadasPrevias(String nombre1, String nombre2) {
        Set<String> clavesEliminadas = new HashSet<>();
        eliminarPartidaGuardadaDeJugador(nombre1, nombre1, nombre2, clavesEliminadas);
        eliminarPartidaGuardadaDeJugador(nombre2, nombre1, nombre2, clavesEliminadas);
    }

    private void eliminarPartidaGuardadaDeJugador(String nombreJugador, String jugadorActual1, String jugadorActual2, Set<String> clavesEliminadas) {
        Persistencia persistencia = repoPartidas.findByJugador(nombreJugador).orElse(null);
        if (persistencia == null) {
            return;
        }

        String clavePersistencia = generarClave(persistencia.getJugadorNaval(), persistencia.getJugadorAereo());
        if (!clavesEliminadas.add(clavePersistencia)) {
            return;
        }

        Partida partidaGuardada = persistencia.getPartida();
        if (partidaGuardada != null) {
            Equipo ganador = Equipo.NINGUNO;
            boolean esPartidaEntreMismosJugadores = sonMismosJugadores(
                persistencia.getJugadorNaval(),
                persistencia.getJugadorAereo(),
                jugadorActual1,
                jugadorActual2
            );
            if (!esPartidaEntreMismosJugadores) {
                if (nombreJugador.equals(persistencia.getJugadorNaval())) {
                    ganador = Equipo.AEREO;
                } else if (nombreJugador.equals(persistencia.getJugadorAereo())) {
                    ganador = Equipo.NAVAL;
                }
            }
            registrarResultado(partidaGuardada, ganador);
        }

        repoPartidas.delete(persistencia);
    }

    public boolean existePartidaGuardadaEntre(String nombre1, String nombre2) {
        Persistencia persistencia = repoPartidas.findByJugador(nombre1).orElse(null);
        if (persistencia == null) {
            return false;
        }
        return sonMismosJugadores(persistencia.getJugadorNaval(), persistencia.getJugadorAereo(), nombre1, nombre2);
    }

    private boolean sonMismosJugadores(String jugadorA1, String jugadorA2, String jugadorB1, String jugadorB2) {
        return (jugadorA1.equals(jugadorB1) && jugadorA2.equals(jugadorB2))
            || (jugadorA1.equals(jugadorB2) && jugadorA2.equals(jugadorB1));
    }

    public boolean existePartidaGuardada(String nombreJugador) {
        return repoPartidas.findByJugador(nombreJugador).isPresent();
    }

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

            // si fase null, DESPLIEGUE valor por defecto
            if (partida.getFasePartida() == null) {
                partida.setFasePartida(FasePartida.DESPLIEGUE);
            }

            String jugadorA = partida.getJugadorAereo().getNombre();
            String jugadorN = partida.getJugadorNaval().getNombre();
            String clave = generarClave(jugadorN, jugadorA);

            finalizacionPendientePorClave.remove(clave);
            partidas.put(clave, partida);
            repoPartidas.delete(persistencia);
            
            return partida;
        } else {
            return null;
        }
    }

    public List<Jugador> getRanking() {
        return repo.findFirst12ByOrderByPuntosDescVictoriasDesc();
    }
}