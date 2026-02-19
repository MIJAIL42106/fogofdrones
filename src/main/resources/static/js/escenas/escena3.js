gameState = {
    colorVerde: 0xaaffaa,                       //
    colorRojo: 0xffaaaa,                        //
    ancho: 64,                                  // cantidad de celdas horizontales
    alto: 36                                    // cantidad de celdas verticales
}; 

class Celda {                                   // calse celda para grilla
    constructor (grid, x, y) {                  // grid = escena donde se crean, indices para posiciones x e y
        this.res = 22.45;                       // escala de posiciones
                                                // añade imagen en posicion correspondiente a indices con escalas aplciadas
        this.tile = grid.add.image((y*this.res),(x*this.res),"tileT").setScale(1.45);  // tambien escala la imagen
        this.tile.setAlpha(0.5);                // ajuste de opacidad para celdas de grilla
        this.tile.setInteractive();             // se setea interactivo para poder darle interaccion con mouse despues
                                                // 
        this.tile.on('pointerdown', () => {     // asigna interaccion al clikear
                this.tile.setTint(0x44ff44);                // cambia tint de celda
                grid.enviarMensage((y+(x*gameState.ancho)).toString()); // se envia el mensaje con indice de celda pintada como string
        });
        grid.tablero.add(this.tile);            // agrega la imagen creada a el tablero
    }
}   

class escena3 extends Phaser.Scene {

    constructor() {
        super({key: "partida"});                // nombre de escena
    }
                                                // carga de assets
    preload() {                                 // fondo, escenario, tile, dronN, dronA, portaN, portaA, explosiones // ver cohete despues
        this.load.image("tileT",".//assets/tilesets/tileT.png");
        this.load.image("Fondo",".//assets/fondos/FondoNaval.png");
        this.load.image("Mover",".//assets/fondos/mover.png");
        this.load.image("Atacar",".//assets/fondos/atacar.png");
        this.load.image("Recargar",".//assets/fondos/recargar.png");
        this.load.image("Pasar",".//assets/fondos/pasar_turno.png");
    }

    create() {  
        this.crearFondo();
        //var fondo = this.add.image(960,540,"Fondo");   // creacion de fondo en posicion    // podria calcularse centro despues
        //fondo.setScale(1);                              // seteo de escala de fondo, hecho a medida, escala 1

        let indice = 0;                                 // indice para pruebas de posiciones de modifciaciones de celdas
                                                        // crecion de textos de control de variables y eventos
        let indiceprueba = this.add.text(1700 , 800,"i: ", { fill: "#222222", font: "40px Times New Roman"});
        let pruebasi = this.add.text(1500 , 800,"ii: " + gameState.prueba, { fill: "#222222", font: "40px Times New Roman"});
        //let posx = this.add.text(1500 , 900,"X: ", { fill: "#222222", font: "40px Times New Roman"});//let posy = this.add.text(1500 , 1000,"Y: ", { fill: "#222222", font: "40px Times New Roman"});
        let indx = this.add.text(1700 , 900,"iX: ", { fill: "#222222", font: "40px Times New Roman"});
        let indy = this.add.text(1700 , 1000,"iY: ", { fill: "#222222", font: "40px Times New Roman"});
                                                        // creacion de conexion a websocket
        this.socket = new WebSocket('http://26.169.248.78:8080/game'); // http://26.169.248.78:8080/game  ws://localhost:8080/game

        //this.size = gameState.ancho * gameState.alto;   // usado para asignar intreraccion a celdas en un for // puede remplazarse

        this.tablero = this.add.container (45, 55);     // creaccion de elemento container que almacenara las celdas 

        for (var i = 0; i < gameState.alto; i++) {      // creacion de celdas en for anidado
            for (var j = 0; j< gameState.ancho; j++) {  // indeces i y j siven para calcular posicion correspondiente x e y
                new Celda(this,i,j);                    // al crearse la celda se agrega sola a container tablero
            }
        } 
        
        this.socket.onmessage = (event) => {            // arrow function conserva this de objeto padre o donde se invoca
            indice = parseInt(event.data);              // event.data contiene string mensaje de logica, lo parseamos a int para indice
            indiceprueba.setText("i: " + indice);       // texto de variable de prueba i indice antes de pintar
                                                        // una forma mas corta que funciona pero pintarcelda puede ser util
            this.tablero.getAt(event.data).setTint(0xff44ff);
            //this.pintarCelda(event.data);               // llama a pintar celda donde se cambia el tint de la celda con ese indice
            //posx.setText("X: "+ Phaser.Math.RoundTo(celda.x, 0) );//posy.setText("Y: "+ Phaser.Math.RoundTo(celda.y, 0) );  
            indx.setText("iX: "+ Phaser.Math.ToXY(indice, gameState.ancho, gameState.alto).x);
            indy.setText("iY: "+ Phaser.Math.ToXY(indice, gameState.ancho, gameState.alto).y);
            pruebasi.setText("T1: " + indice);          // texto de variable de prueba i indice luego de pintar
        }                                        
        //let celda = this.tablero.getAt(indice);          // obtenemos la celda del tablero con indice l
    }
    /*
    pintarCelda(indice1){                               // pinta celda 
        let celda1 = this.tablero.getAt(indice1);       // puede hacerse en una linea y sin aux, no probado
        celda1.setTint(0xff44ff);
    }*/

    crearFondo() {
        var fondo = this.add.image(960,540,"Fondo");   // creacion de fondo en posicion    // podria calcularse centro despues
        fondo.setScale(1);                              // seteo de escala de fondo, hecho a medida, escala 1
        const tamBtn = 333 ;
        const sep = 35 ;
        var pos = 200 ;
        var moverBtn = this.add.image(pos,960,"Mover").setInteractive();
        pos += tamBtn + sep;
        var atacarBtn = this.add.image(pos,960,"Atacar").setInteractive();
        pos += tamBtn + sep;
        var recargarBtn = this.add.image(pos,960,"Recargar").setInteractive();
        pos += tamBtn + sep;
        var pasarBtn = this.add.image(pos,960,"Pasar").setInteractive();

        moverBtn.on('pointerover', function() {     // asigna interaccion al clikear 
            moverBtn.setTint(0x44ff44);               
        });
        moverBtn.on('pointerout', function() {     // asigna interaccion al clikear
            moverBtn.clearTint();               
        });

        atacarBtn.on('pointerover', function() {     // asigna interaccion al clikear
            atacarBtn.preFX.addGlow();
            //atacarBtn.setTint(0x44ff44);               
        });
        atacarBtn.on('pointerout', function() {     // asigna interaccion al clikear
            atacarBtn.preFX.removeGlow();
            //atacarBtn.clearTint();               
        });

        recargarBtn.on('pointerover', function() {     // asigna interaccion al clikear
            recargarBtn.setTint(0x44ff44);               
        });
        recargarBtn.on('pointerout', function() {     // asigna interaccion al clikear
            recargarBtn.clearTint();               
        });

        pasarBtn.on('pointerover', function() {     // asigna interaccion al clikear
            pasarBtn.setTint(0x44ff44);               
        });
        pasarBtn.on('pointerout', function() {     // asigna interaccion al clikear
            pasarBtn.clearTint();               
        });
    }

    enviarMensage(indice) {                             // envia mensaje del indice por websocket
        this.socket.send(indice);
    }

    apagar() {                                        // no usado pero util al acabar partida y volver a menu
        // Cerrar WebSocket
        if (this.socket) {
            this.socket.close();
        }
    }
    
    update() {
    }
}

