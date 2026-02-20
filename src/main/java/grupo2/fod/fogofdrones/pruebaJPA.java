package grupo2.fod.fogofdrones;

import org.springframework.boot.SpringApplication;
import org.springframework.context.ApplicationContext;

import grupo2.fod.fogofdrones.service.logica.Partida;
import grupo2.fod.fogofdrones.service.logica.Posicion;
import grupo2.fod.fogofdrones.service.logica.Servicios;

public class pruebaJPA {

    public static void main(String[] args) {
        // Iniciar Spring Boot para obtener el contexto
        ApplicationContext context = SpringApplication.run(FogofdronesApplication.class, args);
        
        // Obtener el bean Servicios desde el contexto
        Servicios service = context.getBean(Servicios.class);

        String nombreJug1 = "Jorge";
        String nombreJug2 = "Juan";

        service.crearPartida(nombreJug1, nombreJug2);

        Posicion pos = new Posicion(0, 0);
        /*
        Partida p = service.getPartida(nombreJug1, nombreJug2);
        p.desplegarDron(pos);

        pos = new Posicion(5, 5);
        p.desplegarDron(pos);

        pos = new Posicion(10, 10);
        p.desplegarDron(pos);

        pos = new Posicion(5, 15);
        p.desplegarDron(pos);

        pos = new Posicion(10, 20);
        p.desplegarDron(pos);
        // fuera de rango
        pos = new Posicion(30, 30);
        p.desplegarDron(pos);
        // ya hay dron
        pos = new Posicion(10, 10);
        p.desplegarDron(pos);

        System.out.println("antes " + p.getTurno());
        service.guardarPartida(nombreJug1, nombreJug2);
        //
        */

        //*
        service.cargarPartida(nombreJug1);
        Partida p = service.getPartida(nombreJug1, nombreJug2);

        pos = new Posicion(5, 25);
        p.desplegarDron(pos);
        System.out.println("despues " + p.getTurno());
        //*/



    }
}

