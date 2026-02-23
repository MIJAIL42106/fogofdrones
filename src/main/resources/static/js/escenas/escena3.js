gameState = {
    colorVerde: 0xaaffaa,                       //
    colorRojo: 0xffaaaa,                        //
    colorSelec: 0x7cff89,                        //
    niebla: 0x334455,
    bordes: 0x9398c36e,
    ancho: 64,                                  // cantidad de celdas horizontales
    alto: 36,                                    // cantidad de celdas verticales
    tableroX: 50, 
    tableroY: 60,
    miTurno: false,
    celdas: 0,
    fase: "",
    equipo: "",
    drones: [],
    portaNX: 0,
    portaNY: 35,
    portaAX: 63,
    portaAY: 0,
    escala: 22.36
}; 

const mensaje = {
    nombre: "",
    accion: "",
    xi: 30,
    yi: 15,
    xf: 30,
    yf: 15
};

class Celda {                                   // calse celda para grilla
    constructor (grid, y, x) {                  // grid = escena donde se crean, indices para posiciones x e y
        gameState.escala = 22.36;                       // escala de posiciones
                                                // añade rectangulo en posicion correspondiente a indices
        this.tile = grid.add.rectangle(x*gameState.escala, y*gameState.escala, 23, 23, gameState.niebla).setStrokeStyle(1, gameState.bordes);
        this.tile.setAlpha(0.6);                // ajuste de opacidad para celdas de grilla
        this.tile.setInteractive();             // se setea interactivo para poder darle interaccion con mouse despues
                                                // 
        this.tile.on('pointerdown', () => {     // asigna interaccion al clikear
            if (gameState.fase === "DESPLIEGUE") {
                grid.tablero.getAt((mensaje.xi+(mensaje.yi*gameState.ancho)).toString()).setStrokeStyle(1, gameState.bordes);
                mensaje.xi = x;
                mensaje.yi = y;
                this.tile.setStrokeStyle(3, gameState.colorSelec);    // hacer funcion borrar tinte seleccion para borrar al apretar boton
            } else {
                if (gameState.celdas % 2 === 0){
                    grid.tablero.getAt((mensaje.xi+(mensaje.yi*gameState.ancho)).toString()).setStrokeStyle(1, gameState.bordes);
                    gameState.celdas ++;
                    mensaje.xi = x;
                    mensaje.yi = y;
                    this.tile.setStrokeStyle(3, gameState.colorSelec);
                } else if (gameState.celdas % 2 === 1) {
                    grid.tablero.getAt((mensaje.xf+(mensaje.yf*gameState.ancho)).toString()).setStrokeStyle(1, gameState.bordes);
                    mensaje.xf = x;
                    mensaje.yf = y;
                    gameState.celdas = 0;
                    this.tile.setStrokeStyle(3, gameState.colorSelec);
                }
            }
        });
        
        this.tile.on('pointerover', () => {
            //this.tile.setStrokeStyle(3, 0x00ff3cc1);
            grid.indx.setText("X: "+x);
            grid.indy.setText("Y: "+y);
        });
        
        //this.tile.on('pointerout', () => {
        //    this.tile.setStrokeStyle(1, 0x9398c36e);
        //});

        grid.tablero.add(this.tile);            // agrega el rectangulo creado a el tablero
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
        this.load.image("Fondo",".//assets/fondos/FondoNaval.png");
        this.load.image("Escenario",".//assets/escenarios/escenario1.png");
        this.load.image("Mover",".//assets/fondos/mover.png");
        this.load.image("Atacar",".//assets/fondos/atacar.png");
        this.load.image("Recargar",".//assets/fondos/recargar.png");
        this.load.image("Guardar",".//assets/fondos/guardar.png");
        this.load.image("Pasar",".//assets/fondos/pasar_turno.png");
        this.load.image("Desplegar",".//assets/fondos/desplegar.png");
        this.load.image("PortaN",".//assets/sprites/PortaVerde-64x64x1.png");
        this.load.image("PortaA",".//assets/sprites/PortaRojo-64x64x1.png");
        this.load.spritesheet("DronN",".//assets/sprites/DronVerde-64x64x2.png",{frameWidth: 64, frameHeight: 64});
        this.load.spritesheet("DronA",".//assets/sprites/DronRojo-64x64x2.png",{frameWidth: 64, frameHeight: 64});
    }

    create() {
        this.graphics = this.add.graphics();
        this.crearFondo();

        const portadron = this.add.image(gameState.portaNX*gameState.escala + gameState.tableroX + 11, gameState.portaNY*gameState.escala + gameState.tableroY-27,"PortaN").setDepth(2).setOrigin(0.5, 0.5);
        portadron.setScale(1.5);

        this.forma = this.add.graphics();
        //this.forma.fillStyle(0xa4cbcb52);
        this.forma.clear();
        this.mask = this.forma.createGeometryMask();
        //forma.beginPath();    
        //forma.fillRect(0,0, 50, 50)
        //this.add.rectangle(10, 10, 50, 50, gameState.niebla);

        
        

        portadron.setMask(this.mask);

        //this.input.on('pointermove', function (pointer) {
        //    forma.x = pointer.x - 25;
        //    forma.y = pointer.y - 25;
//
        //});
        

        //forma.clear()
        //portadron.setAlpha(0);
        //portadron.clearMask();

        
        //this.pasarBtn.destroy();

        let indice = 0;                                 // indice para pruebas de posiciones de modifciaciones de celdas
                                                        // crecion de textos de control de variables y eventos
        

        let prueba = this.add.text(1500 , 900,"ii: "+ mensaje.nombre, { fill: "#222222", font: "40px Times New Roman"});

        this.indiceprueba = this.add.text(1700 , 800,"msg: ", { fill: "#222222", font: "40px Times New Roman"});
        this.pruebasi = this.add.text(1500 , 800,"faselocal: " + gameState.fase, { fill: "#222222", font: "40px Times New Roman"});
        this.indx = this.add.text(1700 , 900,"iX: ", { fill: "#222222", font: "40px Times New Roman"});
        this.indy = this.add.text(1700 , 1000,"iY: ", { fill: "#222222", font: "40px Times New Roman"});    
        this.eq = this.add.text(1500 , 1000,"equipo: ", { fill: "#222222", font: "40px Times New Roman"});

        this.drs = this.add.text(1500 , 700,"drs: " , { fill: "#222222", font: "40px Times New Roman"});
                                                        
        // Conexión STOMP con SockJS
        this.conectarSTOMP();

        this.tablero = this.add.container (gameState.tableroX, gameState.tableroY);     // creaccion de elemento container que almacenara las celdas 

        for (var i = 0; i < gameState.alto; i++) {      // creacion de celdas en for anidado
            for (var j = 0; j< gameState.ancho; j++) {  // indeces i y j siven para calcular posicion correspondiente x e y
                new Celda(this,i,j);                    // al crearse la celda se agrega sola a container tablero
            }
        } 
    }

    /**
     * Establece la conexión STOMP usando SockJS
     */
    conectarSTOMP() {
        // Crear socket con SockJS
        const socket = new SockJS('http://26.169.248.78:8080/game'); // Para producción: window.location.origin + '/game'
        this.stompClient = Stomp.over(socket);
        
        this.stompClient.debug = null;// Deshabilitar logs de debug
        
        // Conectar al servidor STOMP
        this.stompClient.connect({}, (frame) => {
            // Suscribirse al topic /topic/game para recibir actualizaciones
            this.stompClient.subscribe('/topic/game', (message) => {
                var msg = JSON.parse(message.body);
                
                // Actualizar UI con el estado recibido
                //if (this.indiceprueba) {
                this.indiceprueba.setText("msg: " + msg.tipoMensaje);
                //}
                
                // Procesar mensaje según su tipo
                switch (msg.tipoMensaje) {
                    case 0: {
                        if (mensaje.nombre === msg.nombre) {
                            gameState.equipo = msg.equipo.toString();
                        }
                        this.eq.setText("equipo: " + gameState.equipo);
                    } break;
                    case 1: {
                        if (gameState.fase !== msg.fasePartida.toString()) {
                            if (msg.fasePartida.toString() === "JUGANDO") {
                                this.botonPasar(this.pasarBtn);
                            } 
                            gameState.fase = msg.fasePartida.toString();
                        }
                        this.pruebasi.setText("faselocal: " + gameState.fase);
                        //portadron.clearMask();
                        //forma.closePath();  //  //
                        this.forma.clear();      //  //
                        //forma.beginPath();  //  //
                        this.eliminarDrones();
                        var i = 0;
                        msg.grilla.forEach((cel) => {
                            let celda = this.tablero.getAt(i);
                            if (!cel.visionNaval && gameState.equipo === "NAVAL") {
                                celda.setFillStyle(0x334455);
                            } else if (!cel.visionAereo && gameState.equipo === "AEREO") {
                                celda.setFillStyle(0x334455);
                            } else if (cel.aereo !== null) {
                                if (gameState.equipo === "AEREO" || cel.visionNaval) {
                                    celda.setFillStyle(gameState.colorRojo);
                                    this.dibujarDronAereo(celda.x, celda.y);
                                }
                            } else if (cel.naval !== null) {
                                if (gameState.equipo === "NAVAL" || cel.visionAereo) {
                                    celda.setFillStyle(gameState.colorVerde);
                                    this.dibujarDronNaval(celda.x, celda.y);
                                }
                            } else {
                                celda.setFillStyle(0xffffff);

                                if( (gameState.equipo === "AEREO" && cel.visionNaval) || (gameState.equipo === "NAVAL" && cel.visionAereo) ){
                                    forma.fillRect(celda.x+gameState.tableroX-11,celda.y+gameState.tableroY-11, 23, 23);
                                }
                                
                                //if (gameState.equipo === "AEREO" && celda.x >= gameState.portaNX && celda.x <= gameState.portaNX+1 && celda.y >= gameState.portaNY-2 && y <= gameState.portaNY) {
                                //    forma.fillRect(celda.x+gameState.tableroX,celda.y+gameState.tableroY, 23, 23);
                                //}
                                //else if () {  (x >= xPorta-1 && x <= xPorta && y >= yPorta && y <= yPorta+2)    // Portaaviones aéreo
                                //}
                                
                            }
                            i++;
                        });
                        //portadron.setMask(mask);
                    } break;
                    case 2: {
                        if (mensaje.nombre === msg.nombre) { // alerta error
                            alert(msg.error);
                        }
                    } break;
                }
            });
            
            this.enviarMensage(JSON.stringify(mensaje));
            
        });/*, (error) => {
            // Intentar reconectar después de 5 segundos
            setTimeout(() => this.conectarSTOMP(), 5000);
        });*/
    }
    /*
    pintarCelda(indice1){                               // pinta celda 
        let celda1 = this.tablero.getAt(indice1);       // puede hacerse en una linea y sin aux, no probado
        celda1.setTint(0xff44ff);
    }*/

    botonPasar(boton) {
        const p = boton;
        var pos = boton.x;
        p.destroy();
        var botonDesplegar = this.add.image(pos,960,"Pasar").setDepth(2).setInteractive();
        
        botonDesplegar.on('pointerover', function() {     // asigna interaccion al clikear
            botonDesplegar.setTint(gameState.colorSelec);
            botonDesplegar.setScale(1.1);               
        });
        botonDesplegar.on('pointerout', function() {     // asigna interaccion al clikear
            botonDesplegar.clearTint();
            botonDesplegar.setScale(1);               
        });

        //boton pasar turno con skin alternativa para desplegar al inicio
        botonDesplegar.on('pointerdown', () => {     // asigna interaccion al clikear
            this.tablero.getAt((mensaje.xi+(mensaje.yi*gameState.ancho)).toString()).setStrokeStyle(1, gameState.bordes);
            this.tablero.getAt((mensaje.xf+(mensaje.yf*gameState.ancho)).toString()).setStrokeStyle(1, gameState.bordes);
            gameState.celdas = 0;
            mensaje.accion = "PASAR";               
            this.enviarMensage(JSON.stringify(mensaje)); 
        });
    }

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
        this.pasarBtn = this.add.image(pos,960,"Desplegar").setDepth(2).setInteractive();

        moverBtn.on('pointerover', function() {     // asigna interaccion al clikear 
            moverBtn.setTint(gameState.colorSelec);
            moverBtn.setScale(1.1);               
        });
        moverBtn.on('pointerout', function() {     // asigna interaccion al clikear
            moverBtn.clearTint();
            moverBtn.setScale(1);               
        });
        moverBtn.on('pointerdown', () => {     // asigna interaccion al clikear
            if(gameState.fase !== "DESPLIEGUE") {
                this.tablero.getAt((mensaje.xi+(mensaje.yi*gameState.ancho)).toString()).setStrokeStyle(1, gameState.bordes);
                this.tablero.getAt((mensaje.xf+(mensaje.yf*gameState.ancho)).toString()).setStrokeStyle(1, gameState.bordes);
                gameState.celdas = 0;
                mensaje.accion = "MOVER";               
                this.enviarMensage(JSON.stringify(mensaje));  
            }
        });

        atacarBtn.on('pointerover', function() {     // asigna interaccion al clikear
            atacarBtn.setTint(gameState.colorSelec);
            atacarBtn.setScale(1.1);               
        });
        atacarBtn.on('pointerout', function() {     // asigna interaccion al clikear
            atacarBtn.clearTint();
            atacarBtn.setScale(1);               
        });
        atacarBtn.on('pointerdown', () => {     // asigna interaccion al clikear
            if(gameState.fase !== "DESPLIEGUE") {
                this.tablero.getAt((mensaje.xi+(mensaje.yi*gameState.ancho)).toString()).setStrokeStyle(1, gameState.bordes);
                this.tablero.getAt((mensaje.xf+(mensaje.yf*gameState.ancho)).toString()).setStrokeStyle(1, gameState.bordes);
                gameState.celdas = 0;
                mensaje.accion = "ATACAR";               
                this.enviarMensage(JSON.stringify(mensaje)); 
            }
        });

        recargarBtn.on('pointerover', function() {     // asigna interaccion al clikear
            recargarBtn.setTint(gameState.colorSelec);
            recargarBtn.setScale(1.1);               
        });
        recargarBtn.on('pointerout', function() {     // asigna interaccion al clikear
            recargarBtn.clearTint();
            recargarBtn.setScale(1);               
        });
        recargarBtn.on('pointerdown', () => {     // asigna interaccion al clikear
            if(gameState.fase !== "DESPLIEGUE") {
                this.tablero.getAt((mensaje.xi+(mensaje.yi*gameState.ancho)).toString()).setStrokeStyle(1, gameState.bordes);
                this.tablero.getAt((mensaje.xf+(mensaje.yf*gameState.ancho)).toString()).setStrokeStyle(1, gameState.bordes);
                gameState.celdas = 0;
                mensaje.accion = "RECARGAR";               
                this.enviarMensage(JSON.stringify(mensaje)); 
            }
        });

        this.pasarBtn.on('pointerover', function() {     // asigna interaccion al clikear
            pasarBtn.setTint(gameState.colorSelec);
            pasarBtn.setScale(1.1);               
        });
        this.pasarBtn.on('pointerout', function() {     // asigna interaccion al clikear
            pasarBtn.clearTint();
            pasarBtn.setScale(1);               
        });

        //boton pasar turno con skin alternativa para desplegar al inicio
        this.pasarBtn.on('pointerdown', () => {     // asigna interaccion al clikear
            this.tablero.getAt((mensaje.xi+(mensaje.yi*gameState.ancho)).toString()).setStrokeStyle(1, gameState.bordes);
            this.tablero.getAt((mensaje.xf+(mensaje.yf*gameState.ancho)).toString()).setStrokeStyle(1, gameState.bordes);
            gameState.celdas = 0;
            this.enviarMensage(JSON.stringify(mensaje));              
        });
    }

    dibujarDronNaval (x, y) {
        var xAbs = x + gameState.tableroX;
        var yAbs = y + gameState.tableroY;
        let dron = this.add.sprite(xAbs , yAbs ,"DronN").setScale(1.5).setDepth(2);
        dron.angle = -90;
        gameState.drones.push(dron);
    }

    dibujarDronAereo (x, y) {
        var xAbs = x + gameState.tableroX;
        var yAbs = y + gameState.tableroY;
        let dron = this.add.sprite(xAbs, yAbs ,"DronA").setScale(1.5).setDepth(2);
        dron.angle = 90;
        gameState.drones.push(dron);
    }

    eliminarDrones(){
        for (let i = 0; i < gameState.drones.length; i++) {
            const d = gameState.drones[i];
            d.destroy();
        }
        gameState.drones.length = 0;
    }

    /**
     * Envía un mensaje al servidor mediante STOMP
     * @param {string} data - Datos en formato JSON string a enviar
     */
    enviarMensage(data) {
        if (this.stompClient && this.stompClient.connected) {
            // Enviar mensaje a /app/accion (el servidor lo recibe en @MessageMapping("/accion"))
            //console.log("ENVIANDO al servidor:", data);
            this.stompClient.send("/app/accion", {}, data);
            //console.log("Mensaje enviado exitosamente");
        } else {
            console.error('Cliente STOMP no está conectado');
        }
    }

    /**
     * Cierra la conexión STOMP al salir de la escena
     */
    apagar() {
        if (this.stompClient && this.stompClient.connected) {
            this.stompClient.disconnect(() => {
                console.log('Desconectado de STOMP');
            });
        }
    }
    
    update() {
    }
}

