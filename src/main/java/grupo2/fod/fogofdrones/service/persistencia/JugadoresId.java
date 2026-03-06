package grupo2.fod.fogofdrones.service.persistencia;

import java.io.Serializable;
import java.util.Objects;

import jakarta.persistence.Embeddable;

@Embeddable
public class JugadoresId implements Serializable{
    private static final long serialVersionUID = 1L;

    private String jugadorAereo;
    private String jugadorNaval;

    public JugadoresId(){

    }

    public JugadoresId(String jugadoraereo, String jugadornaval){
        this.jugadorAereo = jugadoraereo;
        this.jugadorNaval = jugadornaval;
    }

    public String getJugadorAereo() {
        return jugadorAereo;
    }

    public String getJugadorNaval() {
        return jugadorNaval;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof JugadoresId)) return false;
        JugadoresId that = (JugadoresId) o;
        return Objects.equals(jugadorAereo, that.jugadorAereo) &&
               Objects.equals(jugadorNaval, that.jugadorNaval);
    }

    @Override
    public int hashCode() {
        return Objects.hash(jugadorAereo, jugadorNaval);
    }

}
