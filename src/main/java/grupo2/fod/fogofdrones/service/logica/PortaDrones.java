package grupo2.fod.fogofdrones.service.logica;

import java.io.Serializable;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class PortaDrones extends Unidad implements Serializable {
    private static final long serialVersionUID = 1L;

    public PortaDrones() {}

    public PortaDrones(int idParam, int vidaParam, int visionParam, Equipo equipoParam, Posicion posParam) {
        super(idParam, vidaParam, visionParam, equipoParam, posParam);
    }

}