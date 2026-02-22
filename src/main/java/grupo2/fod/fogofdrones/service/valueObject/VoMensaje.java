package grupo2.fod.fogofdrones.service.valueObject;

import grupo2.fod.fogofdrones.service.logica.Celda;
import grupo2.fod.fogofdrones.service.logica.Equipo;
import grupo2.fod.fogofdrones.service.logica.FasePartida;
import grupo2.fod.fogofdrones.service.logica.Mapa;

public class VoMensaje {
    private int tipoMensaje;
    private FasePartida fasePartida;
    private Celda[] grilla;
    private String nombre;
    private Equipo equipo;
    private String error;
    
    public VoMensaje() {
        this.tipoMensaje = 0;
        this.nombre = null;
        this.equipo = null;
        this.fasePartida = null;    
        this.grilla = null;
        this.error = null;
    }

    public VoMensaje(String nombre, Equipo equipo) {
        this.tipoMensaje = 0;
        this.nombre = nombre;
        this.equipo = equipo;
        this.fasePartida = null;    
        this.grilla = null;
        this.error = null;
    }
    
    public VoMensaje(FasePartida fasePartida, Mapa tablero) {
        this.tipoMensaje = 1;
        this.fasePartida = fasePartida;
        this.grilla = tablero.getGrillaLineal();
        this.nombre = null;
        this.equipo = null;
        this.error = null;
    }

    public VoMensaje(String nombre, String error) {
        this.tipoMensaje = 2;
        this.nombre = nombre;
        this.error = error;
        this.fasePartida = null;
        this.grilla = null;
        this.equipo = null;
    }

    public int getTipoMensaje() {
        return tipoMensaje;
    }

    public FasePartida getFasePartida() {
        return fasePartida;
    }

    public Celda[] getGrilla() {
        return grilla;
    }

    public String getNombre() {
        return nombre;
    }

    public Equipo getEquipo() {
        return equipo;
    }

    public String getError() {
        return error;
    }

    public void setTipoMensaje(int tipoMensaje) {
        this.tipoMensaje = tipoMensaje;
    }

    public void setFasePartida(FasePartida fasePartida) {
        this.fasePartida = fasePartida;
    }

    public void setGrilla(Celda[] grilla) {
        this.grilla = grilla;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public void setEquipo(Equipo equipo) {
        this.equipo = equipo;
    }

    public void setError(String error) {
        this.error = error;
    }

}
