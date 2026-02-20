package grupo2.fod.fogofdrones.service.logica;

import java.io.Serializable;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class Dron extends Unidad implements Serializable {
    private static final long serialVersionUID = 1L;

    private int municion;
    private int rangoAtaque;
    private int rangoMovimiento;

    public Dron() {}

    public Dron(int idParam, int vidaParam, int visionParam, Equipo equipoParam, Posicion posParam, int muniParam, int ataqueParam, int movParam) {
        super(idParam, vidaParam, visionParam, equipoParam, posParam);
        municion = muniParam;
        rangoAtaque = ataqueParam;
        rangoMovimiento = movParam;
    }
    
    public int getMunicion() {
        return municion;
    }

    public int getRangoAtaque() {
        return rangoAtaque;
    }

    public int getRangoMovimiento() {
        return rangoMovimiento;
    }

    public void consumirMunicion() {
        municion--;
    }

    public void recargarMunicion() {
        if(getEquipo() == Equipo.NAVAL)
            municion = 2;
        else
            municion = 1;
    }

    public boolean puedeDisparar() {
        boolean puede = false;
        if(municion > 0)
            puede = true;
        return puede;
    }

}