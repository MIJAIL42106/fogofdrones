package grupo2.fod.fogofdrones.service.logica;

import java.io.Serializable;
import java.util.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class Partida implements Serializable {
    private static final long serialVersionUID = 1L;

    private Mapa tablero;
    private Jugador jugadorAereo, jugadorNaval;
    private List<Dron> dronesAereos, dronesNavales;
    private PortaDrones portaDronesNaval, portaDronesAereo;
    private Equipo turno;
    private FasePartida fase;
    private int turnosMuerteSubita;
    private boolean seMovio, disparo, recargo;

    public Partida() {}

    public Partida(Jugador jugador1, Jugador jugador2){
        tablero = new Mapa();
        jugadorNaval = jugador1;
        jugadorAereo = jugador2;
        dronesAereos = new LinkedList<Dron>();
        dronesNavales = new LinkedList<Dron>();
        Posicion pos = new Posicion(0,35);
        portaDronesNaval = new PortaDrones(0,3,2,Equipo.NAVAL,pos);
        pos = new Posicion(63,0);
        portaDronesAereo = new PortaDrones(0,6,2,Equipo.AEREO,pos);
        fase = FasePartida.DESPLIEGUE;
        turno = Equipo.NAVAL;
        turnosMuerteSubita = 1; // 1 para que no asigne fase terminado durante partida
        seMovio = false;
        disparo = false;
        recargo = false;
    }

    public boolean despliegueValido(Equipo equipoParam, Posicion posParam) {
        boolean valido = false;
        if (equipoParam == Equipo.NAVAL) {
            if(posParam.getX() < 15) {
                valido = true;
            } else {
                System.out.println("Error: posicion de despliegue no valida para equipo naval");
            }
        } else {
            if(posParam.getX() > 48){
                valido = true;
            } else {
                System.out.println("Error: posicion de despliegue no valida para equipo aereo");
            }
        }
        if(valido) {
            Celda celdaOrigen = tablero.getCelda(posParam);
            Dron dron = celdaOrigen.getDronEquipo(equipoParam);
            if (dron != null) {
                valido = false;
                System.out.println("Error: ya hay un dron de tu equipo en esa casilla");
            }
        }
        return valido;
   	}

    public int cantDrones() {
        return dronesAereos.size() + dronesNavales.size();
    }

    public int cantDronesEquipo(Equipo equipoParam) {
        int cant;
        if(equipoParam == Equipo.NAVAL)
            cant = dronesNavales.size();
        else
            cant = dronesAereos.size();
        return cant;
    }

    public void desplegarDron(Posicion posParam) {  // por arreglar los turnos
        if(despliegueValido(turno, posParam)) {
            int id = cantDrones() + 1, vision = 0, municion = 0, rangoAtaque = 0, vida = 1, rangoMovimiento = 6;
            if(turno == Equipo.NAVAL) {
                vision = 3;
                municion = 2;
                rangoAtaque = 6;
            }
            else {
                vision = 6;
                municion = 1;
            }
        	Dron dron = new Dron(id, vida, vision, turno, posParam, municion, rangoAtaque, rangoMovimiento);
            tablero.agregarDron(dron, turno);
            if(turno == Equipo.NAVAL) {
                dronesNavales.add(dron);
            }
            else {
                dronesAereos.add(dron);
            }
            actualizarVision();
            System.out.println("Dron desplegado exisotamente");
        } else {
            System.out.println("Error: despliegue no valido");
        }
    
        if(despliegueTerminadoEquipo(turno)) {
            turno = turno.siguienteEquipo();
        }
        
        if(despliegueTerminadoEquipo(Equipo.NAVAL) && despliegueTerminadoEquipo(Equipo.AEREO)){
            iniciarJuego();
        }
    }

    public boolean puedeMover(Posicion origenParam, Posicion destinoParam) {
        boolean puede = true;

        if (seMovio) {      // verifica si el jugador ya se movio
            puede = false;
            System.out.println("Error: el jugador ya realizo un movimiento en su turno");
        } else {
            if(origenParam.mismaPosicion(destinoParam)) {   // verifica que no se mueva a su misma posicion
                puede = false;
                System.out.println("Error: no puede mover el dron a la misma posicion de origen");
            } else {
                Celda celdaOrigen = tablero.getCelda(origenParam);
                Dron dron = celdaOrigen.getDronEquipo(turno);

                if (dron == null) { // verifica que en la posicion de origen hay un dron que mover
                    puede = false;
                    System.out.println("Error: no hay un dron para mover en la posicion seleccionada");
                } else {
                    int distancia = origenParam.distanciaManhattan(destinoParam);   // verifica que la distancia entra el origen y el destino es valida
                    if (distancia > dron.getRangoMovimiento()) {
                        puede = false;
                        System.out.println("Error: el lugar a donde quiere mover esta fuera de alcance");
                    } else {
                        Celda celdaDestino = tablero.getCelda(destinoParam);    // verifica si en el destino hay un dron aliado
                        if (celdaDestino.tieneDronEquipo(turno)) {
                            puede = false;
                            System.out.println("Error: en esa celda ya hay un dron aliado");
                        }
                    }
                } 
        }
        }
        return puede;
    }

    public void mover(Posicion origenParam, Posicion destinoParam) {
        if(puedeMover(origenParam, destinoParam)) {
            Celda celdaOrigen = tablero.getCelda(origenParam);
            Dron dron = celdaOrigen.getDronEquipo(turno);

            tablero.eliminarDron(dron, turno);
            dron.setPosicion(destinoParam);
            tablero.agregarDron(dron,turno);

            seMovio = true;

            actualizarVision();
            System.out.println("Movimiento realizado correctamente");
        } else {
            System.out.println("Error: movimiento no valido");
        }
    }

    public boolean puedeAtacar(Posicion origenParam, Posicion destinoParam) {
        boolean puede = true;
        if(disparo) {
            puede = false;
            System.out.println("Error: ya realizo un ataque en su turno");
        } else {
            Celda celdaOrigen = tablero.getCelda(origenParam);
            Dron dron = celdaOrigen.getDronEquipo(turno);
            if(dron == null) {
                puede = false;
                System.out.println("Error: no hay un dron para disparar en la posicion seleccionada");
            } else {
                if (!dron.puedeDisparar()) {
                    puede = false;
                    System.out.println("Error: el dron no cuenta con municion");
                } else {
                    int distancia = origenParam.distanciaManhattan(destinoParam);
                    if(distancia > dron.getRangoAtaque()) {
                        puede = false;
                        System.out.println("Error: el lugar al que quiere disparar esta fuera de alcance");
                    } else {
                        Celda celdaDestino = tablero.getCelda(destinoParam);
                        if(celdaDestino.getDronEquipo(turno) != null && !origenParam.mismaPosicion(destinoParam)) {
                            puede = false;
                            System.out.println("Error: no puedes disparar a una unidad aliada");
                        }
                    }
                }
            }
        }
        return puede;
    }

    public boolean esZonaPortaDrones(Posicion posParam, Equipo enemigoParam) {
        boolean es = false;
        PortaDrones aux = getPortaDronesEquipo(enemigoParam.siguienteEquipo());
        Posicion posPorta = aux.getPosicion();
        int x = posParam.getX();
        int y = posParam.getY();
        
        if (turno == Equipo.NAVAL) {
            if(x >= 62 && x <= 63 && y >= 0 && y <= 2)    // Portaaviones aéreo está en zona derecha específica, columnas 62-63, filas 0-2
                es = true;
        } else {
            if(x >= 0 && x <= 1 && y >= 33 && y <= 35)      // Portaaviones naval está en zona izquierda específica, columnas 0-1, filas 33-35
                es = true;
        }

        return es;
    }

    public void atacar(Posicion origenParam, Posicion destinoParam) {
        if(puedeAtacar(origenParam, destinoParam)) {
            Equipo enemigo = turno.siguienteEquipo();
            Celda celdaOrigen = tablero.getCelda(origenParam);
            Dron dron = celdaOrigen.getDronEquipo(turno);
            Celda celdaDestino = tablero.getCelda(destinoParam);

            System.out.println("Municion antes: " + dron.getMunicion());
            dron.consumirMunicion();
            System.out.println("Municion despues: " + dron.getMunicion());

            if(celdaDestino.tieneDronEquipo(enemigo)) {
                Dron dronEnemigo = celdaDestino.getDronEquipo(enemigo);
                dronEnemigo.recibirDanio();
                tablero.eliminarDron(dronEnemigo, enemigo);
                if(enemigo == Equipo.NAVAL){
                    dronesNavales.removeIf(d ->d.getId() == dronEnemigo.getId()); //dronesNavales.remove(dronEnemigo.getId());
                }else
                    dronesAereos.removeIf(d ->d.getId() == dronEnemigo.getId());
                System.out.println("Drone enemigo derribado");
            } else if(esZonaPortaDrones(destinoParam, enemigo)) {
                PortaDrones aux = getPortaDronesEquipo(enemigo);
                aux.recibirDanio();
                System.out.println("PortaDrones enemigo impactado. Vida restante: " + aux.getVida());
                if(aux.estaMuerto()){
                    activarMuerteSubita(enemigo);
                    System.out.println("PortaDrones enemigo derribado");
                }
            } else {
                System.out.println("Disparo al agua: no acerto a ningun enemigo");
            }

            disparo = true;
            actualizarVision();
            System.out.println("Ataque realizado exitosamente");

            if (esFinPartida()) {
                finalizarPartida();
            }
        } else {
            System.out.println("Error: ataque no valido");
        }

    }

    public void terminarTurno() {
        if(disparo | seMovio | recargo) {
            turno = turno.siguienteEquipo();
            seMovio = false;
            disparo = false;
            recargo = false;
            
            if (fase == FasePartida.MUERTE_SUBITA){
                turnosMuerteSubita--;
                System.out.println("Turnos restantes: " + turnosMuerteSubita);
            }

            if(turnosMuerteSubita <= 0)
                fase = FasePartida.TERMINADO;

            if(esFinPartida()) 
                finalizarPartida();
        } else {
            System.out.println("Error: el jugador debe realizar una accion para pasar de turno");
        }
    }

    public boolean puedeRecargar(Posicion posParam) {
        boolean puede = true;
        if(seMovio | disparo) {
            puede = false;
            System.out.println("Error: no puedes recargar la unidad una vez realizada una accion");
        } else {
            Celda celdaOrigen = tablero.getCelda(posParam);
            Dron dron = celdaOrigen.getDronEquipo(turno);
            if(dron == null) {
                puede = false;
                System.out.println("Error: no hay un dron en la celda seleccionada");
            } else {
                if(turno == Equipo.NAVAL) {
                    if(dron.getMunicion() == 2){
                        puede = false;
                        System.out.println("Error: no puedes recargar la unidad porque tiene toda su municion");
                    }
                } else {
                    if(dron.getMunicion() == 1){
                        puede = false;
                        System.out.println("Error: no puedes recargar la unidad porque tiene toda su municion");
                    }
                }
            }
        }
        return puede;
    }

    public void recargarMunicion(Posicion posParam) {
        Celda celdaOrigen = tablero.getCelda(posParam);
        Dron dron = celdaOrigen.getDronEquipo(turno);
        if(puedeRecargar(posParam)) {
            dron.recargarMunicion();
            recargo = true;
            System.out.println("Recargo exitoso");
            terminarTurno();
        } else {
            System.out.println("Error: regarga no vilida");
        }
    }
    
    public boolean despliegueTerminadoEquipo(Equipo equipoParam) {     // verifica si ya se desplegaron todos los drones del equipo
        boolean termino = false;
        int cant = cantDronesEquipo(equipoParam);
        if(equipoParam == Equipo.NAVAL && cant == 6)
            termino = true;
        else if (equipoParam == Equipo.AEREO && cant == 12)
            termino = true;
        return termino;
    }

    public void iniciarJuego() {    // una vez terminado el despliegue, setea que se inicio el juego
        fase = FasePartida.JUGANDO;
    }

    public void activarMuerteSubita(Equipo equipoDerrotadoParam) {      // se usa en ataque, al momento que el porta drones no tiene mas vida
        turnosMuerteSubita = cantDronesEquipo(equipoDerrotadoParam) * 2;
        fase = FasePartida.MUERTE_SUBITA;
    }

    public boolean esFinPartida() {
        boolean fin = false;
       
        if (cantDronesEquipo(Equipo.NAVAL) == 0) {
            fin = true;
        } else {
            if (cantDronesEquipo(Equipo.AEREO) == 0) {
                fin = true;
            } else {
                if (fase == FasePartida.MUERTE_SUBITA && turnosMuerteSubita <= 0) {
                    fin = true;
                } else {
                    if (portaDronesNaval.getVida() == 0 && portaDronesAereo.getVida() == 0) {
                        fin = true;
                    }
                }
            }
        }
        return fin;
    }

    public void finalizarPartida() {
        fase = FasePartida.TERMINADO;
    }

    public Equipo getEquipoGanador() {
        Equipo ganador = Equipo.NINGUNO;
        if (cantDronesEquipo(Equipo.NAVAL) == 0) {
            ganador = Equipo.AEREO;
        } else {
            if (cantDronesEquipo(Equipo.AEREO) == 0) {
                ganador = Equipo.NAVAL;
            } else {
                if (fase == FasePartida.TERMINADO) {
                    if (portaDronesNaval.getVida() > 0) {
                        ganador = Equipo.NAVAL;
                    } else {
                        if (portaDronesAereo.getVida() > 0) {
                            ganador = Equipo.AEREO;
                        }
                    }
                }
            }
        }
        return ganador;
    }

    public FasePartida getFasePartida() {
        return fase;
    }

    public Equipo getTurno() {
        return turno;
    }

    public boolean getSeMovio() {
        return seMovio;
    }

    public boolean getDisparo() {
        return disparo;
    }

    public Jugador getJugadorNaval() {
        return jugadorNaval;
    }

    public Jugador getJugadorAereo() {
        return jugadorAereo;
    }

    public PortaDrones getPortaDronesEquipo(Equipo equipoParam) {
        PortaDrones aux;
        if(equipoParam == Equipo.NAVAL)
            aux = portaDronesNaval;
        else
            aux = portaDronesAereo;
        return aux;
    }

    public void actualizarVision() {
        tablero.resetearVision();
    
        for (Dron dron : dronesNavales) {
            tablero.marcarVision(dron.getPosicion(), dron.getVision(), Equipo.NAVAL);
        }
        
        for (Dron dron : dronesAereos) {
            tablero.marcarVision(dron.getPosicion(), dron.getVision(), Equipo.AEREO);
        }
    }

    public Mapa getTablero() {
        return tablero;
    }

    public List<Dron> getDronesAereos() {
        return dronesAereos;
    }

    public List<Dron> getDronesNavales() {
        return dronesNavales;
    }

    public PortaDrones getPortaDronesNaval() {
        return portaDronesNaval;
    }

    public PortaDrones getPortaDronesAereo() {
        return portaDronesAereo;
    }

    public int getTurnosMuerteSubita() {
        return turnosMuerteSubita;
    }

    public boolean getRecargo() {
        return recargo;
    }

    public boolean esMiTurno(String nombreJugador) {
        boolean es = false;
        if (turno == Equipo.NAVAL && jugadorNaval.getNombre().equals(nombreJugador)) {
            es = true;
        } else if (turno == Equipo.AEREO && jugadorAereo.getNombre().equals(nombreJugador)) {
            es = true;
        }
        return es;
    }

}