package grupo2.fod.fogofdrones.service.logica;

import java.io.Serializable;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class Mapa implements Serializable {
    private static final long serialVersionUID = 1L;

    private final int largo = 64, ancho = 36;
    private Celda[][] grilla;

    public Mapa() {
        grilla = new Celda[largo][ancho];

        for(int i = 0; i < largo; i++) {
            for(int j = 0; j < ancho; j++) {
                grilla[i][j] = new Celda();
            }
        }
    }

    public int getLargo() {
        return largo;
    }

    public int getAncho() {
        return ancho;
    }

    public Celda[][] getGrilla() {
        return grilla;
    }

    public Celda[] getGrillaLineal() {
        Celda[] grillaLineal = new Celda[largo * ancho];
        int indice = 0;
        for(int j = 0; j < ancho; j++) {
            for(int i = 0; i < largo; i++) {
                grillaLineal[indice] = grilla[i][j];
                indice++;
            }
        }
        return grillaLineal;
    }

    public Celda getCelda(Posicion pos) {
        return grilla[pos.getX()][pos.getY()];
    }

    public void agregarDron(Dron dronParam, Equipo equipoParam) {
        Posicion pos = dronParam.getPosicion();
        if(equipoParam == Equipo.NAVAL) {
            grilla[pos.getX()][pos.getY()].setDronNaval(dronParam);
        }
        else {
            grilla[pos.getX()][pos.getY()].setDronAereo(dronParam);
        }
    }
    
    public void eliminarDron(Dron dronParam, Equipo equipoParam) {
        Posicion pos = dronParam.getPosicion();
        if(equipoParam == Equipo.NAVAL) {
            grilla[pos.getX()][pos.getY()].setDronNaval(null);
        }
        else {
            grilla[pos.getX()][pos.getY()].setDronAereo(null);
        }
    }

    public void resetearVision() {
        for(int i = 0; i < largo; i++) {
            for(int j = 0; j < ancho; j++) {
                grilla[i][j].setVisionAereo(false);
                grilla[i][j].setVisionNaval(false);
            }
        }
    }

    public void marcarVision(Posicion posParam, int rangoParam, Equipo equipoParam) {
        for(int i = 0; i < largo; i++) {
            for(int j = 0; j < ancho; j++) {
                Posicion celdaActual = new Posicion(i, j);

                int distancia = posParam.distanciaManhattan(celdaActual);

                if (distancia <= rangoParam) {
                    if (equipoParam == Equipo.NAVAL) {
                        grilla[i][j].setVisionNaval(true);
                    } else {
                        grilla[i][j].setVisionAereo(true);
                    }
                }
            }
        }
    }
}