package grupo2.fod.fogofdrones;

import grupo2.fod.fogofdrones.service.logica.Jugador;
import grupo2.fod.fogofdrones.service.logica.Partida;
import grupo2.fod.fogofdrones.service.logica.Posicion;

// mejorar prueba con comentarios

public class prueba {
    public static void main(String[] args) {
        Jugador j1 = new Jugador("Juan1",0,0);
        Jugador j2 = new Jugador("Pepe2",0,0);
        Partida p = new Partida(j1, j2 );
        
        Posicion pos = new Posicion(0, 0);
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

        pos = new Posicion(5, 25);
        p.desplegarDron(pos);
        //

        System.out.println("despues " + p.getTurno());
    
        //
        pos = new Posicion(50, 5);
        p.desplegarDron(pos);

        pos = new Posicion(55, 5);
        p.desplegarDron(pos);

        pos = new Posicion(60, 5);
        p.desplegarDron(pos);

        pos = new Posicion(50, 10);
        p.desplegarDron(pos);

        pos = new Posicion(55, 10);
        p.desplegarDron(pos);

        pos = new Posicion(60, 10);
        p.desplegarDron(pos);

        pos = new Posicion(50, 15);
        p.desplegarDron(pos);

        pos = new Posicion(55, 15);
        p.desplegarDron(pos);

        pos = new Posicion(60, 15);
        p.desplegarDron(pos);

        pos = new Posicion(50, 20);
        p.desplegarDron(pos);

        pos = new Posicion(55, 20);
        p.desplegarDron(pos);
        // fuera de rango
        pos = new Posicion(30, 20);
        p.desplegarDron(pos);
        // ya hay dron
        pos = new Posicion(55, 20);
        p.desplegarDron(pos);

        System.out.println("turno " + p.getTurno());
        System.out.println("turno " + p.getFasePartida());

        pos = new Posicion(60, 20);
        p.desplegarDron(pos);

        System.out.println("turno " + p.getTurno());
        System.out.println("turno " + p.getFasePartida());
        System.out.println("- ");
        System.out.println("- ");
        
        // error fuera de rango
        pos = new Posicion(10, 10);
        Posicion pos2 = new Posicion(17, 10);
        p.mover(pos, pos2);
        // error destino igual a origen 
        pos2 = new Posicion(10, 10);
        p.mover(pos, pos2);

        pos2 = new Posicion(16, 10);
        p.mover(pos, pos2);
        // error ya movio
        p.mover(pos2, pos);

        p.terminarTurno();

        System.out.println("turno " + p.getTurno());

        // error no hay
        pos2 = new Posicion(55, 10);
        p.mover(pos, pos2);
        // error ya hay dron aliado
        pos = new Posicion(50, 10);
        p.mover(pos, pos2);
        // error fuera de rango
        pos2 = new Posicion(40, 10);
        p.mover(pos, pos2);
        // error destino igual a origen 
        p.mover(pos2, pos2);

        pos2 = new Posicion(44, 10);
        p.mover(pos, pos2);

        p.terminarTurno();

        System.out.println("turno " + p.getTurno());
        
        System.out.println("- ");
        System.out.println("- ");

        pos = new Posicion(16, 10);
        pos2 = new Posicion(22, 10);
        p.mover(pos, pos2);
        p.terminarTurno();
        System.out.println("turno " + p.getTurno());

        pos = new Posicion(44, 10);
        pos2 = new Posicion(38, 10);
        p.mover(pos, pos2);
        p.terminarTurno();
        System.out.println("turno " + p.getTurno());

        pos = new Posicion(22, 10);
        pos2 = new Posicion(28, 10);
        p.mover(pos, pos2);
        p.terminarTurno();
        System.out.println("turno " + p.getTurno());

        pos = new Posicion(38, 10);
        pos2 = new Posicion(32, 10);
        p.mover(pos, pos2);
        p.terminarTurno();
        System.out.println("turno " + p.getTurno());
        
        System.out.println("- ");
        System.out.println("- ");

        pos = new Posicion(28, 10);
        pos2 = new Posicion(32, 10);
        p.atacar(pos, pos2);
        // error ya ataco
        p.atacar(pos, pos2);

        p.terminarTurno();
        System.out.println("turno " + p.getTurno());

        pos = new Posicion(50, 15);
        pos2 = new Posicion(51, 15);
        p.atacar(pos, pos2);

        p.atacar(pos, pos);

        p.terminarTurno();
        System.out.println("turno " + p.getTurno());
        p.terminarTurno();
        System.out.println("turno " + p.getTurno());

        pos = new Posicion(0, 0);
        pos2 = new Posicion(3, 3);
        p.mover(pos, pos2);

        pos = new Posicion(5, 5);
        p.atacar(pos2, pos);

        p.terminarTurno();
        System.out.println("turno " + p.getTurno());
        
        System.out.println("- ");
        System.out.println("- ");


        // recargar
        // error municion completa
        pos = new Posicion(50, 20);
        p.recargarMunicion(pos);
        System.out.println("turno " + p.getTurno());

        pos = new Posicion(50, 15);
        p.recargarMunicion(pos);
        System.out.println("turno " + p.getTurno());
        // error recargar ya paso turno
        p.terminarTurno();
        System.out.println("turno " + p.getTurno());
        // error se movio o disparo antes de recargar
        pos = new Posicion(3, 3);
        pos2 = new Posicion(9, 3);
        p.mover(pos, pos2);
        p.recargarMunicion(pos2);
        p.terminarTurno();
        System.out.println("turno " + p.getTurno());

        pos = new Posicion(50, 15);
        p.atacar(pos,pos);
        p.terminarTurno();
        System.out.println("turno " + p.getTurno());

        System.out.println("- ");
        System.out.println("- ");

        pos = new Posicion(28, 10);
        pos2 = new Posicion(34, 10);
        p.mover(pos, pos2);
        p.terminarTurno();
        System.out.println("1 turno " + p.getTurno());

        pos = new Posicion(50, 20);
        pos2 = new Posicion(44, 20);
        p.mover(pos, pos2);
        p.terminarTurno();
        System.out.println("2 turno " + p.getTurno());

        pos = new Posicion(34, 10);
        pos2 = new Posicion(40, 10);
        p.mover(pos, pos2);
        p.terminarTurno();
        System.out.println("3 turno " + p.getTurno());

        pos = new Posicion(44, 20);
        pos2 = new Posicion(38, 20);
        p.mover(pos, pos2);
        p.terminarTurno();
        System.out.println("4 turno " + p.getTurno());

        pos = new Posicion(40, 10);
        pos2 = new Posicion(46, 10);
        p.mover(pos, pos2);
        p.terminarTurno();
        System.out.println("5 turno " + p.getTurno());

        pos = new Posicion(38, 20);
        pos2 = new Posicion(32, 20);
        p.mover(pos, pos2);
        p.terminarTurno();
        System.out.println("6 turno " + p.getTurno());

        pos = new Posicion(46, 10);
        pos2 = new Posicion(46, 4);
        p.mover(pos, pos2);
        p.terminarTurno();
        System.out.println("7 turno " + p.getTurno());

        pos = new Posicion(32, 20);
        pos2 = new Posicion(26, 20);
        p.mover(pos, pos2);
        p.terminarTurno();
        System.out.println("8 turno " + p.getTurno());

        pos = new Posicion(46, 4);
        pos2 = new Posicion(52, 4);
        p.mover(pos, pos2);
        p.terminarTurno();
        System.out.println("9 turno " + p.getTurno());

        pos = new Posicion(26, 20);
        pos2 = new Posicion(20, 20);
        p.mover(pos, pos2);
        p.terminarTurno();
        System.out.println("10 turno " + p.getTurno());

        pos = new Posicion(52, 4);
        pos2 = new Posicion(58, 4);
        p.mover(pos, pos2);

        pos = new Posicion(62, 2);
        p.atacar(pos2, pos);

        p.terminarTurno();

        System.out.println("11 turno " + p.getTurno());

        pos = new Posicion(20, 20);
        pos2 = new Posicion(14, 20);
        p.mover(pos, pos2);
        p.terminarTurno();
        
        System.out.println("11.1 turno " + p.getTurno());

  
        pos2 = new Posicion(58, 4);
        p.recargarMunicion(pos2);
        System.out.println("11.2 turno " + p.getTurno());

        pos2 = new Posicion(60, 20);
        p.atacar(pos2,pos2);
        p.terminarTurno();
        
        System.out.println("12 turno " + p.getTurno());

        pos2 = new Posicion(58, 4);
        pos = new Posicion(62, 2);
        p.atacar(pos2, pos);

        p.terminarTurno();
        System.out.println("13 turno " + p.getTurno());

        pos = new Posicion(14, 20);
        pos2 = new Posicion(14, 26);
        p.mover(pos, pos2);
        p.terminarTurno();
        System.out.println("14 turno " + p.getTurno());

        pos2 = new Posicion(58, 4);
        p.recargarMunicion(pos2);

        System.out.println("15 turno " + p.getTurno());

        pos = new Posicion(14, 26);
        pos2 = new Posicion(14, 32);
        p.mover(pos, pos2);
        p.terminarTurno();
        System.out.println("16 turno " + p.getTurno());

        pos2 = new Posicion(58, 4);
        pos = new Posicion(62, 2);
        p.atacar(pos2, pos);

        p.terminarTurno();
        System.out.println("17 turno " + p.getTurno());

        pos = new Posicion(14, 32);
        pos2 = new Posicion(8, 32);
        p.mover(pos, pos2);
        p.terminarTurno();
        System.out.println("18 turno " + p.getTurno());

        pos2 = new Posicion(58, 4);
        pos = new Posicion(62, 2);
        p.atacar(pos2, pos);

        p.terminarTurno();
        System.out.println("19 turno " + p.getTurno());

        pos = new Posicion(8, 32);
        pos2 = new Posicion(2, 32);
        p.mover(pos, pos2);
        p.terminarTurno();
        System.out.println("20 turno " + p.getTurno());

        pos2 = new Posicion(58, 4);
        p.recargarMunicion(pos2);

        System.out.println("21 turno " + p.getTurno());

        pos = new Posicion(2, 32);
        pos2 = new Posicion(1, 33);
        p.mover(pos, pos2);

        p.atacar(pos2,pos2);
        p.terminarTurno();
        System.out.println("22 turno " + p.getTurno());

        pos = new Posicion(58, 4);
        pos2 = new Posicion(62, 2);
        p.atacar(pos, pos2);
        p.terminarTurno();
        System.out.println("23 turno " + p.getTurno());

        pos2 = new Posicion(1, 33);
        p.recargarMunicion(pos2);

        System.out.println("24 turno " + p.getTurno());

        pos = new Posicion(58, 4);
        p.recargarMunicion(pos);
        System.out.println("25 turno " + p.getTurno());
        
        pos2 = new Posicion(1, 33);
        p.atacar(pos2,pos2);
        p.terminarTurno();
        System.out.println("26 turno " + p.getTurno());

        pos = new Posicion(5, 15);
        pos2 = new Posicion(4, 15);
        p.atacar(pos, pos2);
        p.terminarTurno();
        System.out.println("27 turno " + p.getTurno());
        
        pos2 = new Posicion(1, 33);
        p.recargarMunicion(pos2);

        System.out.println("28 turno " + p.getTurno());

        System.out.println("- ");   // aereo 1 de vida, dron 1 bala
        System.out.println("- ");   // naval 1 de vida, dron 1 bala
        System.out.println("fase " + p.getFasePartida());

        // empate
        /*
        {
            pos = new Posicion(58, 4);
            pos2 = new Posicion(62, 2);
            p.atacar(pos, pos2);
            p.terminarTurno();
            System.out.println("E1 turno " + p.getTurno());
            System.out.println("fase " + p.getFasePartida());

            pos = new Posicion(1, 33);
            p.atacar(pos, pos);
            p.terminarTurno();
            System.out.println("E2 turno " + p.getTurno());
            System.out.println("fase " + p.getFasePartida());

        }
        
        *///
        //* 
        {
            pos = new Posicion(58, 4);
            pos2 = new Posicion(55, 5);
            p.atacar(pos, pos2);
            p.mover(pos, pos2);
            p.terminarTurno();
            System.out.println("X1 turno " + p.getTurno());

            pos = new Posicion(1, 33);
            pos2 = new Posicion(1, 27);
            p.mover(pos, pos2);
            p.terminarTurno();
            System.out.println("X2 turno " + p.getTurno());

            pos = new Posicion(55, 5);
            pos2 = new Posicion(50, 5);
            p.atacar(pos, pos2);
            p.terminarTurno();
            System.out.println("X3 turno " + p.getTurno());

            pos = new Posicion(1, 27);
            pos2 = new Posicion(5, 25);
            p.mover(pos, pos2);
            p.atacar(pos2, pos2);                           
            p.terminarTurno();
            System.out.println("X4 turno " + p.getTurno()); 

            pos = new Posicion(55, 5);
            p.recargarMunicion(pos);
            System.out.println("X5 turno " + p.getTurno());

            pos = new Posicion(5, 25);
            p.recargarMunicion(pos);
            System.out.println("X6 turno " + p.getTurno());

            pos = new Posicion(55, 5);
            pos2 = new Posicion(60, 5);
            p.atacar(pos, pos2);
            p.terminarTurno();
            System.out.println("X7 turno " + p.getTurno());

            pos = new Posicion(5, 25);
            pos2 = new Posicion(5, 20);
            p.mover(pos, pos2);
            p.terminarTurno();
            System.out.println("X8 turno " + p.getTurno());

            pos = new Posicion(55, 5);
            pos2 = new Posicion(55, 10);
            p.atacar(pos, pos2);
            p.mover(pos, pos2);
            p.terminarTurno();
            System.out.println("X9 turno " + p.getTurno());

            pos = new Posicion(5,20);
            pos2 = new Posicion(10, 20);
            p.mover(pos, pos2);
            p.atacar(pos2, pos2);
            p.terminarTurno();
            System.out.println("X10 turno " + p.getTurno());

            pos = new Posicion(55, 10);
            p.recargarMunicion(pos);
            System.out.println("X11 turno " + p.getTurno());

            pos = new Posicion(10, 20);
            p.recargarMunicion(pos);
            System.out.println("X12 turno " + p.getTurno());

            pos = new Posicion(55, 10);
            pos2 = new Posicion(60, 10);
            p.atacar(pos, pos2);
            p.terminarTurno();
            System.out.println("X13 turno " + p.getTurno());

            pos = new Posicion(10, 20);
            pos2 = new Posicion(10, 15);
            p.mover(pos, pos2);
            p.terminarTurno();
            System.out.println("X14 turno " + p.getTurno());

            pos = new Posicion(55, 10);
            pos2 = new Posicion(55, 15);
            p.atacar(pos, pos2);
            p.mover(pos, pos2);
            p.terminarTurno();
            System.out.println("X15 turno " + p.getTurno());

            pos = new Posicion(10, 15);
            pos2 = new Posicion(5, 15);
            p.mover(pos, pos2);
            p.atacar(pos2, pos2);
            p.terminarTurno();
            System.out.println("X16 turno " + p.getTurno());

            pos = new Posicion(55, 15);
            p.recargarMunicion(pos);
            System.out.println("X17 turno " + p.getTurno());

            pos = new Posicion(5, 15);
            p.recargarMunicion(pos);
            System.out.println("X18 turno " + p.getTurno());

            pos = new Posicion(55, 15);
            pos2 = new Posicion(50, 15);
            p.atacar(pos, pos2);
            p.terminarTurno();
            System.out.println("X19 turno " + p.getTurno());

            pos = new Posicion(5, 15);
            pos2 = new Posicion(5, 10);
            p.mover(pos, pos2);
            p.terminarTurno();
            System.out.println("X20 turno " + p.getTurno());

            pos = new Posicion(55, 15);
            pos2 = new Posicion(60, 15);
            p.atacar(pos, pos2);
            p.terminarTurno();
            System.out.println("X21 turno " + p.getTurno());

            pos = new Posicion(5, 10);
            pos2 = new Posicion(5, 5);
            p.mover(pos, pos2);
            p.atacar(pos2, pos2);
            p.terminarTurno();
            System.out.println("X22 turno " + p.getTurno());

            pos = new Posicion(55, 15);
            p.recargarMunicion(pos);
            System.out.println("X23 turno " + p.getTurno());

            pos = new Posicion(5, 5);
            p.recargarMunicion(pos);
            System.out.println("X24 turno " + p.getTurno());

            pos = new Posicion(55, 15);
            pos2 = new Posicion(55, 20);
            p.atacar(pos, pos2);
            p.mover(pos, pos2);
            p.terminarTurno();
            System.out.println("X25 turno " + p.getTurno());

            pos = new Posicion(5, 5);
            pos2 = new Posicion(5, 3);
            p.mover(pos, pos2);
            p.terminarTurno();
            System.out.println("X26 turno " + p.getTurno());

            System.out.println("- ");   // aereo 5,3 y 60,20
            System.out.println("- ");   // naval 9,3 y 55,20
        
            // victoria naval
            /*  
            {
                pos = new Posicion(9, 3);
                pos2 = new Posicion(5, 3);
                p.atacar(pos, pos2);
                p.terminarTurno();
                System.out.println("N1 turno " + p.getTurno());

                pos = new Posicion(60, 20);
                pos2 = new Posicion(59, 20);
                p.mover(pos, pos2);
                p.terminarTurno();
                System.out.println("N2 turno " + p.getTurno());

                pos = new Posicion(55, 20);
                pos2 = new Posicion(59, 20);
                p.atacar(pos, pos2);
                p.terminarTurno();
                System.out.println("N1 turno " + p.getTurno());

                System.out.println("fase " + p.getFasePartida());

            }*/
            
            // victoria aereo
            /*
            {
                pos = new Posicion(9, 3);
                pos2 = new Posicion(5, 3);
                p.mover(pos, pos2);
                p.terminarTurno();
                System.out.println("A1 turno " + p.getTurno());

                p.atacar(pos2, pos2);
                p.terminarTurno();
                System.out.println("A2 turno " + p.getTurno());

                pos = new Posicion(55, 20);
                pos2 = new Posicion(60, 20);
                p.mover(pos, pos2);
                p.terminarTurno();
                System.out.println("A3 turno " + p.getTurno());
                
                p.recargarMunicion(pos2);
                System.out.println("A4 turno " + p.getTurno());

                pos = new Posicion(60, 20);
                pos2 = new Posicion(61, 20);
                p.mover(pos, pos2);
                p.terminarTurno();
                System.out.println("A5 turno " + p.getTurno());

                p.mover(pos, pos2);
                p.atacar(pos2, pos2);
                p.terminarTurno();
                System.out.println("A6 turno " + p.getTurno());

                System.out.println("fase " + p.getFasePartida());

            }*/

            // 
            pos = new Posicion(55, 20);
            pos2 = new Posicion(55, 14);
            p.mover(pos, pos2);
            p.terminarTurno();
            System.out.println("Z1 turno " + p.getTurno());

            pos = new Posicion(5, 3);
            pos2 = new Posicion(5, 9);
            p.mover(pos, pos2);
            p.terminarTurno();
            System.out.println("Z2 turno " + p.getTurno());

            pos = new Posicion(55, 14);
            pos2 = new Posicion(55, 8);
            p.mover(pos, pos2);
            p.terminarTurno();
            System.out.println("Z3 turno " + p.getTurno());

            pos = new Posicion(5, 9);
            pos2 = new Posicion(5, 15);
            p.mover(pos, pos2);
            p.terminarTurno();
            System.out.println("Z4 turno " + p.getTurno());

            pos = new Posicion(55, 8);
            pos2 = new Posicion(55, 2);
            p.mover(pos, pos2);
            p.terminarTurno();
            System.out.println("Z5 turno " + p.getTurno());

            pos = new Posicion(5, 15);
            pos2 = new Posicion(5, 21);
            p.mover(pos, pos2);
            p.terminarTurno();
            System.out.println("Z6 turno " + p.getTurno());

            pos = new Posicion(55, 2);
            pos2 = new Posicion(60, 2);
            p.mover(pos, pos2);
            p.terminarTurno();
            System.out.println("Z7 turno " + p.getTurno());

            pos = new Posicion(5, 21);
            pos2 = new Posicion(5, 27);
            p.mover(pos, pos2);
            p.terminarTurno();
            System.out.println("Z8 turno " + p.getTurno());

            pos = new Posicion(60, 2);
            pos2 = new Posicion(60, 0);
            p.mover(pos, pos2);
            p.terminarTurno();
            System.out.println("Z9 turno " + p.getTurno());

            pos = new Posicion(5, 27);
            pos2 = new Posicion(5, 33);
            p.mover(pos, pos2);
            p.terminarTurno();
            System.out.println("Z10 turno " + p.getTurno());

            pos = new Posicion(60, 2);
            pos2 = new Posicion(60, 0);
            p.mover(pos2, pos);
            p.terminarTurno();
            System.out.println("Z11 turno " + p.getTurno());

            pos = new Posicion(5, 33);
            pos2 = new Posicion(1, 33);
            p.mover(pos, pos2);
            p.terminarTurno();
            System.out.println("Z12 turno " + p.getTurno());

            System.out.println("- ");   
            System.out.println("- ");
            System.out.println("fase " + p.getFasePartida());

            // victoria naval muerte subita
            /*{
                pos = new Posicion(60, 2);
                pos2 = new Posicion(62, 2);
                p.atacar(pos, pos2);
                p.terminarTurno();
                System.out.println("MN1 turno " + p.getTurno());
                System.out.println("fase " + p.getFasePartida());

                pos = new Posicion(60, 20);
                p.recargarMunicion(pos);
                System.out.println("MN2 turno " + p.getTurno());    // turno 1

                pos = new Posicion(9, 3);
                pos2 = new Posicion(10, 3);
                p.mover(pos, pos2);
                p.terminarTurno();
                System.out.println("MN3 turno " + p.getTurno());

                pos = new Posicion(60, 20);
                p.atacar(pos, pos);
                p.terminarTurno();
                System.out.println("MN4 turno " + p.getTurno());       // turno 2

                System.out.println("fase " + p.getFasePartida());
            }*/

            // victoria aereo muerte subita
            {
                pos = new Posicion(60, 2);
                pos2 = new Posicion(60, 0);
                p.mover(pos, pos2);
                p.terminarTurno();
                System.out.println("MA1 turno " + p.getTurno());

                pos = new Posicion(1, 33);
                p.atacar(pos, pos);
                p.terminarTurno();
                System.out.println("MA2 turno " + p.getTurno());
                System.out.println("fase " + p.getFasePartida());

                pos = new Posicion(9, 3);
                pos2 = new Posicion(10, 3);
                p.mover(pos, pos2);
                p.terminarTurno();
                System.out.println("MA3 turno " + p.getTurno());    // turno 1

                pos = new Posicion(60, 20);
                p.recargarMunicion(pos);
                System.out.println("MA4 turno " + p.getTurno());

                pos = new Posicion(9, 3);
                pos2 = new Posicion(10, 3);
                p.mover(pos2, pos);
                p.terminarTurno();
                System.out.println("MA5 turno " + p.getTurno());    // turno 2

                System.out.println("fase " + p.getFasePartida());
            }
        }

        switch (p.getEquipoGanador()) {
            case NAVAL:
                    System.out.println("Victoria Naval");
                break;
            case AEREO:
                    System.out.println("Victoria Aereo");
                break;
            case NINGUNO:
                    System.out.println("Empate");
                break;
            default:
                break;   
        }
    }
}