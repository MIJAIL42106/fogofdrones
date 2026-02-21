gameState = {
    colorVerde: 0xaaffaa,                       //
    colorRojo: 0xffaaaa,                        //
    ancho: 64,                                  // cantidad de celdas horizontales
    alto: 36,                                    // cantidad de celdas verticales
    miTurno: false,
    celdas: 0,
    fase: 0,
    equipo: ""
}; 

const mensaje = {
    nombre: "",
    accion: "DESPLEGAR",
    xi: 0,
    yi: 0,
    xf: 0,
    yf: 0
};

class Celda {                                   // calse celda para grilla
    constructor (grid, y, x) {                  // grid = escena donde se crean, indices para posiciones x e y
        this.res = 22.36;                       // escala de posiciones
                                                // añade imagen en posicion correspondiente a indices con escalas aplciadas // remplazar por rectangulos
        this.tile = grid.add.rectangle(x*this.res, y*this.res, 23, 23, 0x334455).setStrokeStyle(1, 0xffffff);;// grid.add.image((x*this.res),(y*this.res),"tileT").setScale(1.45);  // tambien escala la imagen
        this.tile.setAlpha(0.6);                // ajuste de opacidad para celdas de grilla
        this.tile.setInteractive();             // se setea interactivo para poder darle interaccion con mouse despues
                                                // 
        this.tile.on('pointerdown', () => {     // asigna interaccion al clikear
            if (gameState.fase === 0) {
                //if (grid.tablero.getAt((mensaje.xi+(mensaje.yi*gameState.ancho)).toString()).fx.hasBloom) {
                //    grid.tablero.getAt((mensaje.xi+(mensaje.yi*gameState.ancho)).toString()).removeBloom();
                //}
                mensaje.xi = x;
                mensaje.yi = y;
                //this.tile.postFX.addBloom(0xffffff, 1.5, 1.5, 2, 1.2);
            } else {
                if (gameState.celdas % 2 === 0){
                    gameState.celdas ++;
                    mensaje.xi = x;
                    mensaje.yi = y;
                   // this.tile.postFX.addBloom(0xffffff, 1.5, 1.5, 2, 1.2);
                } else if (gameState.celdas % 2 === 1) {
                    mensaje.xf = x;
                    mensaje.yf = y;
                   // this.tile.addBloom(0xffffff, 1.5, 1.5, 2, 1.2);
                    gameState.celdas = 0;
                } //else {
                    //grid.tablero.getAt((mensaje.xi+(mensaje.yi*gameState.ancho)).toString()).removeBloom();
                    //grid.tablero.getAt((mensaje.xf+(mensaje.yf*gameState.ancho)).toString()).removeBloom(); 
                //}
            }
            //this.tile.setTint(0x44ff44);                              // cambia tint de celda
            //grid.enviarMensage((y+(x*gameState.ancho)).toString());   // se envia el mensaje con indice de celda pintada como string
        });
        
        this.tile.on('pointerover', () => {
            grid.indx.setText("X: "+x);
            grid.indy.setText("Y: "+y);
            //grid.indice.setText("i: "+(x+y*gameState.ancho));
        });
        
        grid.tablero.add(this.tile);            // agrega la imagen creada a el tablero
    }
}   

class escena3 extends Phaser.Scene {

    constructor() {
        super({key: "partida"});                // nombre de escena
    }

    init(data){
        mensaje.nombre = data.nombre;
    }
                                                // carga de assets
    preload() {                                 // fondo, escenario, tile, dronN, dronA, portaN, portaA, explosiones // ver cohete despues
        //this.load.image("tileT",".//assets/tilesets/tileT.png");
        this.load.image("Fondo",".//assets/fondos/FondoNaval.png");
        this.load.image("Escenario",".//assets/escenarios/escenario1.png");
        this.load.image("Mover",".//assets/fondos/mover.png");
        this.load.image("Atacar",".//assets/fondos/atacar.png");
        this.load.image("Recargar",".//assets/fondos/recargar.png");
        this.load.image("Pasar",".//assets/fondos/pasar_turno.png");
        this.load.image("PortaN",".//assets/sprites/PortaVerde-64x64x1.png");
        this.load.image("PortaA",".//assets/sprites/PortaRojo-64x64x1.png");
        this.load.spritesheet("DronN",".//assets/sprites/DronVerde-64x64x2.png",{frameWidth: 64, frameHeight: 64});
        this.load.spritesheet("DronA",".//assets/sprites/DronRojo-64x64x2.png",{frameWidth: 64, frameHeight: 64});
    }

    create() {
        this.graphics = this.add.graphics();    // creo que no usado por ahora pero para dar brillo a botones y celdas puede ser util
        this.crearFondo();
        //var fondo = this.add.image(960,540,"Fondo");   // creacion de fondo en posicion    // podria calcularse centro despues
        //fondo.setScale(1);                              // seteo de escala de fondo, hecho a medida, escala 1

        let indice = 0;                                 // indice para pruebas de posiciones de modifciaciones de celdas
                                                        // crecion de textos de control de variables y eventos
        

        let prueba = this.add.text(1500 , 900,"ii: "+ mensaje.nombre, { fill: "#222222", font: "40px Times New Roman"});

        let indiceprueba = this.add.text(1700 , 800,"msg: ", { fill: "#222222", font: "40px Times New Roman"});
        let pruebasi = this.add.text(1500 , 800,"faselocal: " + gameState.fase, { fill: "#222222", font: "40px Times New Roman"});
        //let posx = this.add.text(1500 , 900,"X: ", { fill: "#222222", font: "40px Times New Roman"});//let posy = this.add.text(1500 , 1000,"Y: ", { fill: "#222222", font: "40px Times New Roman"});
        this.indx = this.add.text(1700 , 900,"iX: ", { fill: "#222222", font: "40px Times New Roman"});
        this.indy = this.add.text(1700 , 1000,"iY: ", { fill: "#222222", font: "40px Times New Roman"});    
        let eq = this.add.text(1500 , 1000,"equipo: ", { fill: "#222222", font: "40px Times New Roman"});
                                                        // creacion de conexion a websocket
        // agregar otra capa intermedia para la conexion
        this.socket = new WebSocket('ws://26.169.248.78:8080/game'); // http://26.169.248.78:8080/game  ws://localhost:8080/game

        //this.size = gameState.ancho * gameState.alto;   // usado para asignar intreraccion a celdas en un for // puede remplazarse

        // enviar nombre para crear partida
        //jackson.setText(JSON.stringify(mensaje));
        


        this.tablero = this.add.container (50, 60);     // creaccion de elemento container que almacenara las celdas 

        for (var i = 0; i < gameState.alto; i++) {      // creacion de celdas en for anidado
            for (var j = 0; j< gameState.ancho; j++) {  // indeces i y j siven para calcular posicion correspondiente x e y
                new Celda(this,i,j);                    // al crearse la celda se agrega sola a container tablero
            }
        } 
        
        this.socket.onopen = () => {
            this.enviarMensage(JSON.stringify(mensaje));
        };

        this.socket.onmessage = (event) => {            // arrow function conserva this de objeto padre o donde se invoca
            var msg = JSON.parse(event.data);
            indiceprueba.setText("msg: " + msg.tipoMensaje);
            switch (msg.tipoMensaje) {
                case 0 : {
                    if (mensaje.nombre === msg.nombre) {
                        gameState.equipo = msg.equipo.toString();
                    }
                    eq.setText("equipo: " + gameState.equipo)
                } break;
                case 1 :{
                    switch (msg.fasePartida){
                        case "DESPLIEGUE" :
                            gameState.fase = 0;
                            break;
                        case "JUGANDO" :
                            gameState.fase = 1;
                            break;
                        case "MUERTE_SUBITA" :
                            gameState.fase = 2;
                            break;
                        case "TERMINADO" :
                            gameState.fase = 3;
                            break;
                    }
                    pruebasi.setText("faselocal: " + gameState.fase);
                    var i = 0;
                    msg.grilla.forEach((cel) => {
                        if (!cel.visionNaval && gameState.equipo === "NAVAL" ) {
                            this.tablero.getAt(i).setFillStyle(0x000000);
                        } else if (!cel.visionAereo && gameState.equipo === "AEREO" ) {
                            this.tablero.getAt(i).setFillStyle(0x000000);
                        } else if (cel.aereo !== null ) {
                            if (gameState.equipo === "AEREO" || cel.visionNaval) 
                                this.tablero.getAt(i).setFillStyle(gameState.colorRojo);
                        } else if (cel.naval !== null) {
                            if (gameState.equipo === "NAVAL" || cel.visionAereo)
                                this.tablero.getAt(i).setFillStyle(gameState.colorVerde);
                        } else {
                            this.tablero.getAt(i).setFillStyle();//clearTint();
                        }
                        i++;
                    });
                } break;
                case 2 :{
                    if (gameState.nombre === msg.nombre) {
                        alert(msg.error);
                    }
                } break;
                default :

                break;
            }
            
            
            
            
            
            
            
            
            //indice = parseInt(event.data);              // event.data contiene string mensaje de logica, lo parseamos a int para indice
            //indiceprueba.setText("i: " + indice);       // texto de variable de prueba i indice antes de pintar
                                                        // una forma mas corta que funciona pero pintarcelda puede ser util
            //this.tablero.getAt(event.data).setTint(0xff44ff);
            
            
            ////this.pintarCelda(event.data);               // llama a pintar celda donde se cambia el tint de la celda con ese indice
            ////posx.setText("X: "+ Phaser.Math.RoundTo(celda.x, 0) );//posy.setText("Y: "+ Phaser.Math.RoundTo(celda.y, 0) );  
            //indx.setText("iX: "+ Phaser.Math.ToXY(indice, gameState.ancho, gameState.alto).x);
            //indy.setText("iY: "+ Phaser.Math.ToXY(indice, gameState.ancho, gameState.alto).y);
            //pruebasi.setText("ii: " + indice);          // texto de variable de prueba i indice luego de pintar
        }                                     
        //let celda = this.tablero.getAt(indice);          // obtenemos la celda del tablero con indice l
    }
    /*
    pintarCelda(indice1){                               // pinta celda 
        let celda1 = this.tablero.getAt(indice1);       // puede hacerse en una linea y sin aux, no probado
        celda1.setTint(0xff44ff);
    }*/

    crearFondo() {
        var fondo = this.add.image(960,540,"Fondo").setDepth(1);   // creacion de fondo en posicion    // podria calcularse centro despues
        fondo.setScale(1);                              // seteo de escala de fondo, hecho a medida, escala 1
        var escenario = this.add.image(38, 48,"Escenario").setOrigin(0, 0).setDepth(0);
        escenario.setScale(1); 
        const tamBtn = 333 ;
        const sep = 35 ;
        var pos = 200 ;
        var moverBtn = this.add.image(pos,960,"Mover").setDepth(2).setInteractive();
        pos += tamBtn + sep;
        var atacarBtn = this.add.image(pos,960,"Atacar").setDepth(2).setInteractive();
        pos += tamBtn + sep;
        var recargarBtn = this.add.image(pos,960,"Recargar").setDepth(2).setInteractive();
        pos += tamBtn + sep;
        var pasarBtn = this.add.image(pos,960,"Pasar").setDepth(2).setInteractive();

        moverBtn.on('pointerover', function() {     // asigna interaccion al clikear 
            moverBtn.setTint(0x44ff44);               
        });
        moverBtn.on('pointerout', function() {     // asigna interaccion al clikear
            moverBtn.clearTint();               
        });
        moverBtn.on('pointerdown', function() {     // asigna interaccion al clikear
            mensaje.accion = "MOVER";               
        });

        atacarBtn.on('pointerover', function() {     // asigna interaccion al clikear
            atacarBtn.setTint(0x44ff44);               
        });
        atacarBtn.on('pointerout', function() {     // asigna interaccion al clikear
            atacarBtn.clearTint();               
        });
        atacarBtn.on('pointerdown', function() {     // asigna interaccion al clikear
            mensaje.accion = "ATACAR";               
        });

        recargarBtn.on('pointerover', function() {     // asigna interaccion al clikear
            recargarBtn.setTint(0x44ff44);               
        });
        recargarBtn.on('pointerout', function() {     // asigna interaccion al clikear
            recargarBtn.clearTint();               
        });
        recargarBtn.on('pointerdown', function() {     // asigna interaccion al clikear
            mensaje.accion = "RECARGAR";               
        });

        pasarBtn.on('pointerover', function() {     // asigna interaccion al clikear
            pasarBtn.setTint(0x44ff44);               
        });
        pasarBtn.on('pointerout', function() {     // asigna interaccion al clikear
            pasarBtn.clearTint();               
        });
        let jackson = this.add.text(200 , 500,"json: ", { fill: "#222222", font: "40px Times New Roman"});
        pasarBtn.on('pointerdown', () => {     // asigna interaccion al clikear
            jackson.setText(JSON.stringify(mensaje));
            this.enviarMensage(JSON.stringify(mensaje));               
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

