package grupo2.fod.fogofdrones.service.valueObject;

import grupo2.fod.fogofdrones.service.logica.Celda;
import grupo2.fod.fogofdrones.service.logica.Equipo;
import grupo2.fod.fogofdrones.service.logica.FasePartida;
import grupo2.fod.fogofdrones.service.logica.Mapa;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
@AllArgsConstructor
public class VoMensaje {
    private int tipoMensaje;
    private FasePartida fasePartida;
    private Celda[] grilla;
    private String nombre;
    private Equipo equipo;
    private int codError;
    //cargar partida, interfaz grafica, animacion, codigo
    public VoMensaje() {
        this.tipoMensaje = 0;
        this.nombre = null;
        this.equipo = null;
        this.fasePartida = null;    
        this.grilla = null;
        this.codError = 0;
    }

    public VoMensaje(String nombre, Equipo equipo) {
        this.tipoMensaje = 0;
        this.nombre = nombre;
        this.equipo = equipo;
        this.fasePartida = null;    
        this.grilla = null;
        this.codError = 0;
    }
    
    public VoMensaje(FasePartida fasePartida, Mapa tablero) {
        this.tipoMensaje = 1;
        this.fasePartida = fasePartida;
        this.grilla = tablero.getGrillaLineal();
        this.nombre = null;
        this.equipo = null;
        this.codError = 0;
    }

    public VoMensaje(String nombre, int codError) {
        this.tipoMensaje = 2;
        this.nombre = nombre;
        this.codError = codError;
        this.fasePartida = null;
        this.grilla = null;
        this.equipo = null;
    }

}
