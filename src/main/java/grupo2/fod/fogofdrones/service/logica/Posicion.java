package grupo2.fod.fogofdrones.service.logica;

import java.io.Serializable;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class Posicion implements Serializable {
    private static final long serialVersionUID = 1L;

    private int x;
    private int y;

    public Posicion(){}

    public Posicion(int xParam, int yParam){
        x = xParam;
        y = yParam;
    }

    public int getX() {
        return x;
    }

    public int getY() {
        return y;
    }

    public int distanciaManhattan(Posicion posParam) {
        return Math.abs(x - posParam.x) + Math.abs(y - posParam.y);
    }

    public boolean mismaPosicion(Posicion posParam) {
        boolean iguales = false;
        if(posParam != null)
            if(getX() == posParam.getX() && getY() == posParam.getY())
                iguales = true;
        return iguales;
    }

}