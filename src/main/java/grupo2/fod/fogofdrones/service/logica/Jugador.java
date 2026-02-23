package grupo2.fod.fogofdrones.service.logica;

import java.io.Serializable;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "jugadores")
public class Jugador implements Serializable{
    private static final long serialVersionUID = 1L;

    @Id
    private String nombre;
    @Column(name = "victorias")
    private int victorias;
    @Column(name = "puntos")
    private int puntos;
    @Column(name = "jugando")
    private boolean jugando;

    public Jugador(){}

    public Jugador(String nombreParam, int victoriasParam, int puntosParam, boolean jugandoParam) {
        nombre = nombreParam;
        victorias = victoriasParam;
        puntos = puntosParam;
        jugando = jugandoParam;
    }

    public String getNombre() {
        return nombre;
    }

    public int getVictorias() {
        return victorias;
    }

    public int getPuntos() {
        return puntos;
    }

    public boolean getJugando() {
        return jugando;
    }

    public void sumarVictoria() {
        victorias++;
    }

    public void sumarPuntos(int puntosParam) {
        puntos += puntosParam;
    }

    public void setJugando(boolean jugandoParam) {
        jugando = jugandoParam;
    }

}