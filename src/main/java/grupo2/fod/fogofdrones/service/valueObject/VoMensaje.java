package grupo2.fod.fogofdrones.service.valueObject;

import grupo2.fod.fogofdrones.service.logica.Celda;
import grupo2.fod.fogofdrones.service.logica.Equipo;
import grupo2.fod.fogofdrones.service.logica.FasePartida;
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
    private int vidaPortaN;
    private int vidaPortaA;
    private int cantDronesN;
    private int cantDronesA;
    private Celda[] grilla;
    private String nombre;
    private Equipo equipo;
    private String evento;
    private String canal;
    private int turnosMuerteSubita;
}
