package grupo2.fod.fogofdrones.service.logica;

import java.io.Serializable;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class Celda implements Serializable {
    private static final long serialVersionUID = 1L;

    private Dron aereo, naval;
    private boolean visionAereo, visionNaval;

    public Celda(){
        aereo = null;
        naval = null;
        visionAereo = false;
        visionNaval = false;
    }

    public Dron getAereo() {
        return aereo;
    }

    public Dron getNaval() {
        return naval;
    }

    public Dron getDronEquipo(Equipo equipoParam) {
        Dron aux;
        if(equipoParam == Equipo.NAVAL)
            aux = naval;
        else
            aux = aereo;
        return aux;
    }

    public boolean tieneDronEquipo(Equipo equipoParam) {
        boolean hay = true;
        if(getDronEquipo(equipoParam) == null)
            hay = false;
        return hay;
    }

    public boolean getVisionAereo() {
        return visionAereo;
    }

    public boolean getVisionNaval() {
        return visionNaval;
    }

    public void setDronAereo(Dron aereoParam) {
        aereo = aereoParam;
    }

    public void setDronNaval(Dron navalParam){
        naval = navalParam;
    }

    public void setVisionAereo(Boolean visionAereoParam) {
        visionAereo = visionAereoParam;
    }

    public void setVisionNaval(Boolean visionNavalParam) {
        visionNaval = visionNavalParam;
    }

}