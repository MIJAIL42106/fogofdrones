package grupo2.fod.fogofdrones.service.logica;

import java.io.Serializable;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public abstract class Unidad implements Serializable {
    private static final long serialVersionUID = 1L;

    private int id;
    private int vida;
    private int rangoVision;
    private Equipo equipo;
    private Posicion pos;

    public Unidad() {}

    public Unidad(int idParam, int vidaParam, int visionParam, Equipo equipoParam, Posicion posParam) {
        id = idParam;
        vida = vidaParam;
        rangoVision = visionParam;
        equipo = equipoParam;
        pos = posParam;
    }

    public int getId() {
        return id;
    }

    public int getVida() {
        return vida;
    }
    
    public int getVision() {
        return rangoVision;
    }
    
    public Equipo getEquipo() {
        return equipo;
    }

    public Posicion getPosicion() {
        return pos;
    }

    public void recibirDanio() {
        vida--;
    }

    public boolean estaMuerto() {
        boolean esta = false;
        if(vida == 0)
            esta = true;
        return esta;
    }

    public void setPosicion(Posicion posParam) {
        pos = posParam;
    }

}