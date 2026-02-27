gameState = {
    colorVerde: 0xaaffaa,                       //
    colorRojo: 0xffaaaa,                        //
    colorSelec: 0x7cff89,                        //
    niebla: 0x334455,
    bordes: 0xffffff,
    ancho: 64,                                  // cantidad de celdas horizontales
    alto: 36,                                    // cantidad de celdas verticales
    tableroX: 50, 
    tableroY: 60,
    miTurno: false,                   // no se usa
    clicks: 0,
    fase: "",
    equipo: "",
    drones: [],
    portaNX: 0,
    portaNY: 35,
    portaAX: 63,
    portaAY: 0,
    escala: 22.36,
    tamCelda: 23,
    solicitandoGuardado: false
}; 

const mensaje = {
    nombre: "",
    accion: "",
    xi: 30,
    yi: 15,
    xf: 30,
    yf: 15
};

const tipoMensaje = Object.freeze({ // una forma de hacer tipo enumerado en js
    LUNES: 0,
    ESTADOPARTIDA: 1,
    GUARDADO: 2,
    ERROR: 3,
    NOTIFICACION: 4,
});

// podria eliminarse clase celda completamente y usar un metodo?
class Celda {                                   // calse celda para grilla
    constructor (grid, y, x) {                  // grid = escena donde se crean, indices para posiciones x e y
        gameState.escala = 22.36;                       // escala de posiciones
                                                // añade rectangulo en posicion correspondiente a indices
        this.tile = grid.add.rectangle(x*gameState.escala, y*gameState.escala, gameState.tamCelda, gameState.tamCelda, gameState.niebla).setStrokeStyle(0.0, gameState.bordes).setDepth(1);
        this.tile.setAlpha(0.3);                // ajuste de opacidad para celdas de grilla
        this.tile.setInteractive();             // se setea interactivo para poder darle interaccion con mouse despues
                                                // 
        this.tile.on('pointerdown', () => {     // asigna interaccion al clikear
            if (gameState.fase === "DESPLIEGUE") {
                grid.tablero.getAt((mensaje.xi+(mensaje.yi*gameState.ancho)).toString()).setStrokeStyle(0.0, gameState.bordes);
                mensaje.xi = x;
                mensaje.yi = y;
                //mensaje.xf = x;
                //mensaje.yf = y;
                this.tile.setStrokeStyle(3, gameState.colorSelec);    // hacer funcion borrar tinte seleccion para borrar al apretar boton
            } else {
                if (gameState.clicks === 0){
                    gameState.clicks ++;
                    grid.tablero.getAt((mensaje.xi+(mensaje.yi*gameState.ancho)).toString()).setStrokeStyle(0.0, gameState.bordes);
                    mensaje.xi = x;
                    mensaje.yi = y;
                    mensaje.xf = x;
                    mensaje.yf = y;
                    this.tile.setStrokeStyle(3, gameState.colorSelec);
                } else if ( gameState.clicks === 1 ) {
                    gameState.clicks ++;
                    grid.tablero.getAt((mensaje.xf+(mensaje.yf*gameState.ancho)).toString()).setStrokeStyle(0.0, gameState.bordes);
                    mensaje.xf = x;
                    mensaje.yf = y;
                    this.tile.setStrokeStyle(3, gameState.colorSelec);
                } else {
                    gameState.clicks ++;
                    grid.tablero.getAt((mensaje.xi+(mensaje.yi*gameState.ancho)).toString()).setStrokeStyle(0.0, gameState.bordes);
                    mensaje.xi = mensaje.xf;
                    mensaje.yi = mensaje.yf;
                    grid.tablero.getAt((mensaje.xf+(mensaje.yf*gameState.ancho)).toString()).setStrokeStyle(3, gameState.bordes);
                    mensaje.xf = x;
                    mensaje.yf = y;
                    this.tile.setStrokeStyle(3, gameState.colorSelec);
                }
            }
        });
        
        grid.tablero.add(this.tile);            // agrega el rectangulo creado a el tablero
    }
}   

class escena3 extends Phaser.Scene {

    constructor() {
        super({key: "partida"});                // nombre de escena
    }

    init(data){
        mensaje.nombre = data.nombre;
        gameState.equipo = data.equipo;
        this.canalPartida = data.canal;
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
        this.load.image("Aceptar",".//assets/fondos/Aceptar.png");
        this.load.image("Rechazar",".//assets/fondos/Rechazar.png");
        this.load.image("PortaN",".//assets/sprites/PortaVerde-64x64x1.png");
        this.load.image("PortaA",".//assets/sprites/PortaRojo-64x64x1.png");
        this.load.spritesheet("DronN",".//assets/sprites/DronVerde-64x64x2.png",{frameWidth: 64, frameHeight: 64});
        this.load.spritesheet("DronA",".//assets/sprites/DronRojo-64x64x2.png",{frameWidth: 64, frameHeight: 64});
        this.load.spritesheet("Impactos",".//assets/sprites/Impactos-399x399x11x6.png",{frameWidth: 399, frameHeight: 399});
    }

    create() {
        this.conectarSTOMP();
        this.crearInterfaz();
        this.crearAnimaciones();
        this.crearPortadrones();
        this.crearTablero();
    }

    conectarSTOMP() {
        window.conexionWS.conectar(() => {
            // suscribir al canal específico de la partida (y mantener /topic/game como respaldo)
            if (this.canalPartida) {
                window.conexionWS.suscribir(this.canalPartida, (message) => {
                    this.procesarMensaje(message);
                });
            }
            //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            // antiguo canal genérico queda vigente para compatibilidad
            window.conexionWS.suscribir('/topic/game', (message) => {
                this.procesarMensaje(message);
            });
            //this.enviarMensage(mensaje);
        }, (error) => {
            // Manejo de error de conexión
        });
    }

    procesarMensaje(msg) {
        switch (msg.tipoMensaje) {
            case tipoMensaje.LUNES: {   // evaluar si todavia lo necesitamos, equipo viene del menu, probablemente hay que cambiar gamehandler
                if (mensaje.nombre === msg.nombre) {
                    gameState.equipo = msg.equipo.toString();
                }
            } break;
            case tipoMensaje.ESTADOPARTIDA: {
                // actualizado de fase de partida
                if (gameState.fase !== msg.fasePartida.toString()) {
                    // si pasa a jugando se eliminan los elementos de despliegue iniciales
                    if (msg.fasePartida.toString() === "JUGANDO") {
                        this.zonaDesp.destroy();
                        this.botonPasar(this.desplegarBtn);
                    } 
                    gameState.fase = msg.fasePartida.toString();
                }
                // limpiado de mascara y drones
                this.forma.clear(); 
                this.forma.fillStyle(0xff0000, 0);
                this.eliminarDrones();
                // actualizado de tablero celda a celda, junto a drones y mascara
                var i = 0;
                msg.grilla.forEach((cel) => {
                    let celda = this.tablero.getAt(i);
                    if ( (gameState.equipo === "NAVAL" && cel.visionNaval) || (gameState.equipo === "AEREO" && cel.visionAereo)) {
                        celda.setFillStyle(0xffffff);
                        if (cel.naval)
                            this.dibujarDronNaval(celda.x, celda.y);
                        if (cel.aereo)
                            this.dibujarDronAereo(celda.x, celda.y);
                        if( (celda.x <= 1*gameState.tamCelda && celda.y >= 32*gameState.tamCelda) || (celda.x >= 60*gameState.tamCelda && celda.y <= 2*gameState.tamCelda) )  {
                                this.forma.fillRect(celda.x + gameState.tableroX -gameState.tamCelda / 2, celda.y + gameState.tableroY -gameState.tamCelda / 2, gameState.tamCelda, gameState.tamCelda);
                        }  
                    } else {
                        celda.setFillStyle(gameState.niebla);
                    }
                    i++;
                });
            } break;
            case tipoMensaje.GUARDADO: {
                if (mensaje.nombre === msg.nombre) { // alerta error al jugador afectado
                    switch (msg.evento) {
                        case "SOLICITUD":{
                            this.solicitarGuardado();
                        }break;
                        case "RECHAZADA":{
                            alert("Solicitud de guardado rechazada");
                            gameState.solicitandoGuardado = false;
                            this.oscurecer.destroy();
                        }break;
                        case "ACEPTADA":{
                            alert("Solicitud de guardado aceptada");
                            this.scene.stop('partida');
                            this.scene.start('menu');
                        }break;  
                    }
                }
            }break;
            case tipoMensaje.ERROR: { 
                if (mensaje.nombre === msg.nombre) { // alerta error a jugador
                    alert("err:"+msg.evento);
                }
            }break;
            case tipoMensaje.NOTIFICACION: { 
                if (mensaje.nombre === msg.nombre) { // notifica a jugador
                    alert("noti:"+msg.evento);
                }
            }break;
        } 
    }

    crearAnimaciones() {
        this.anims.create({
            key: 'idleN',
            frames: this.anims.generateFrameNumbers('DronN', { start: 0, end: 1 }),
            frameRate: 10,
            repeat: -1,
        });

        this.anims.create({
            key: 'idleA',
            frames: this.anims.generateFrameNumbers('DronA', { start: 0, end: 1 }),
            frameRate: 10,
            repeat: -1,
        });

        //animaciones pantalla secundaria
    }
    
    crearPortadrones() {
        const portadronN = this.add.image(gameState.portaNX*gameState.escala + gameState.tableroX + gameState.tamCelda / 2, gameState.portaNY*gameState.escala + gameState.tableroY-27,"PortaN").setDepth(2).setOrigin(0.5, 0.5);
        portadronN.setScale(1.5);
        const portadronA = this.add.image(gameState.portaAX*gameState.escala + gameState.tableroX - gameState.tamCelda / 2, gameState.portaAY*gameState.escala + gameState.tableroY+27,"PortaA").setDepth(2).setOrigin(0.5, 0.5);
        portadronA.setScale(1.5);
        portadronA.angle = 180;

        this.forma = this.add.graphics().setDepth(3);
        this.forma.clear();
        this.forma.fillStyle(0xffffff);
        this.mask = this.forma.createGeometryMask();

        portadronN.setMask(this.mask);
        portadronA.setMask(this.mask); 
    }

    crearTablero() {
        this.tablero = this.add.container (gameState.tableroX, gameState.tableroY);     // creaccion de elemento container que almacenara las celdas 
        for (var i = 0; i < gameState.alto; i++) {      // creacion de celdas en for anidado
            for (var j = 0; j< gameState.ancho; j++) {  // indeces i y j siven para calcular posicion correspondiente x e y
                new Celda(this,i,j);                    // al crearse la celda se agrega sola a container tablero
            }
        } 
    }
    
    // podria no pasarse el boton
    botonPasar(boton) {
        const p = boton;
        var pos = boton.x;
        p.destroy();
        var pasarBtn = this.add.image(pos,960,"Pasar").setDepth(2).setInteractive();
        
        pasarBtn.on('pointerover', function() {     // asigna interaccion al clikear
            if ( ! gameState.solicitandoGuardado) {
                pasarBtn.setTint(gameState.colorSelec);
                pasarBtn.setScale(1.1);               
            }
        });
        pasarBtn.on('pointerout', function() {     // asigna interaccion al clikear
            if ( ! gameState.solicitandoGuardado) {
                pasarBtn.clearTint();
                pasarBtn.setScale(1);    
            }           
        });

        //boton pasar turno con skin alternativa para desplegar al inicio
        pasarBtn.on('pointerdown', () => {     // asigna interaccion al clikear
            if ( ! gameState.solicitandoGuardado) {
                this.tablero.getAt((mensaje.xi+(mensaje.yi*gameState.ancho)).toString()).setStrokeStyle(0, gameState.bordes);
                this.tablero.getAt((mensaje.xf+(mensaje.yf*gameState.ancho)).toString()).setStrokeStyle(0, gameState.bordes);
                gameState.clicks = 0;
                mensaje.accion = "PASAR";               
                this.enviarMensage(mensaje); 
            }
        });
    }

    crearInterfaz() {
        // 960 y 540 podrian obtenerse de camara main
        var fondo = this.add.image(960,540,"Fondo").setDepth(-1);   // creacion de fondo en posicion    // podria calcularse centro despues
        fondo.setScale(1);                              // seteo de escala de fondo, hecho a medida, escala 1
        var escenario = this.add.image(38, 48,"Escenario").setOrigin(0, 0).setDepth(0);
        escenario.setScale(1);
        // this.pantallaImpactos = this.add.sprite(xAbs , yAbs ,"").setScale(1.5).setDepth(2);
        
        this.zonaDesp;
        const anchoZona = 15 * gameState.tamCelda-gameState.tamCelda / 2; // ancho de zona despligue 15 casillas   // hacer metodo que se borran cuando pasa a jugando
        const altoZona = (gameState.alto-1) * gameState.tamCelda;   // -1 
        if (gameState.equipo === "NAVAL") {
            this.zonaDesp = this.add.rectangle(gameState.tableroX-gameState.tamCelda / 2, gameState.tableroY-gameState.tamCelda / 2, anchoZona, altoZona, gameState.colorVerde).setOrigin(0,0);
        } else {
            this.zonaDesp = this.add.rectangle(63*gameState.escala+gameState.tableroX+gameState.tamCelda / 2, gameState.tableroY-gameState.tamCelda / 2, anchoZona, altoZona, gameState.colorRojo).setOrigin(1,0);
        }
        this.zonaDesp.setStrokeStyle(1, gameState.bordes).setAlpha(0.2).setDepth(1); 
        
        const tamBtn = 333 ;
        const sep = 35 ;
        var pos = 200 ;
        var moverBtn = this.add.image(pos,960,"Mover").setDepth(0).setInteractive();
        pos += tamBtn + sep;
        var atacarBtn = this.add.image(pos,960,"Atacar").setDepth(0).setInteractive();
        pos += tamBtn + sep;
        var recargarBtn = this.add.image(pos,960,"Recargar").setDepth(0).setInteractive();
        pos += tamBtn + sep;
        this.desplegarBtn = this.add.image(pos,960,"Desplegar").setDepth(0).setInteractive();
        pos += tamBtn + sep *1.5;
        var guardarBtn = this.add.image(pos,540,"Guardar").setDepth(0).setInteractive();

        moverBtn.on('pointerover', function() {     // asigna interaccion al clikear 
            if ( ! gameState.solicitandoGuardado) {
                moverBtn.setTint(gameState.colorSelec);
                moverBtn.setScale(1.1);            
            }   
        });
        moverBtn.on('pointerout', function() {     // asigna interaccion al clikear
            if ( ! gameState.solicitandoGuardado) {
                moverBtn.clearTint();
                moverBtn.setScale(1);    
            }           
        });
        moverBtn.on('pointerdown', () => {     // asigna interaccion al clikear
            if(gameState.fase === "JUGANDO" && ! gameState.solicitandoGuardado) {
                this.tablero.getAt((mensaje.xi+(mensaje.yi*gameState.ancho)).toString()).setStrokeStyle(0, gameState.bordes);
                this.tablero.getAt((mensaje.xf+(mensaje.yf*gameState.ancho)).toString()).setStrokeStyle(0, gameState.bordes);
                gameState.clicks = 0;
                mensaje.accion = "MOVER";               
                this.enviarMensage(mensaje);  
            }
        });

        atacarBtn.on('pointerover', function() {     // asigna interaccion al clikear
            if ( ! gameState.solicitandoGuardado) {
                atacarBtn.setTint(gameState.colorSelec);
                atacarBtn.setScale(1.1);               
            }
        });
        atacarBtn.on('pointerout', function() {     // asigna interaccion al clikear
            if ( ! gameState.solicitandoGuardado) {
                atacarBtn.clearTint();
                atacarBtn.setScale(1);    
            }           
        });
        atacarBtn.on('pointerdown', () => {     // asigna interaccion al clikear
            if(gameState.fase === "JUGANDO" && !gameState.solicitandoGuardado ) {
                this.tablero.getAt((mensaje.xi+(mensaje.yi*gameState.ancho)).toString()).setStrokeStyle(0, gameState.bordes);
                this.tablero.getAt((mensaje.xf+(mensaje.yf*gameState.ancho)).toString()).setStrokeStyle(0, gameState.bordes);
                gameState.clicks = 0;
                mensaje.accion = "ATACAR";               
                this.enviarMensage(mensaje); 
            }
        });

        recargarBtn.on('pointerover', function() {     // asigna interaccion al clikear
            if ( ! gameState.solicitandoGuardado) {
                recargarBtn.setTint(gameState.colorSelec);
                recargarBtn.setScale(1.1); 
            }             
        });
        recargarBtn.on('pointerout', function() {     // asigna interaccion al clikear
            if ( !gameState.solicitandoGuardado) {
                recargarBtn.clearTint();
                recargarBtn.setScale(1);    
            }           
        });
        recargarBtn.on('pointerdown', () => {     // asigna interaccion al clikear
            if(gameState.fase === "JUGANDO" && ! gameState.solicitandoGuardado) {
                this.tablero.getAt((mensaje.xi+(mensaje.yi*gameState.ancho)).toString()).setStrokeStyle(0, gameState.bordes);
                this.tablero.getAt((mensaje.xf+(mensaje.yf*gameState.ancho)).toString()).setStrokeStyle(0, gameState.bordes);
                gameState.clicks = 0;
                mensaje.accion = "RECARGAR";               
                this.enviarMensage(mensaje); 
            }
        });

        this.desplegarBtn.on('pointerover', () => {     // asigna interaccion al clikear
            this.desplegarBtn.setTint(gameState.colorSelec);
            this.desplegarBtn.setScale(1.1);               
        });
        this.desplegarBtn.on('pointerout', () => {     // asigna interaccion al clikear
            this.desplegarBtn.clearTint();
            this.desplegarBtn.setScale(1);               
        });

        //boton pasar turno con skin alternativa para desplegar al inicio
        this.desplegarBtn.on('pointerdown', () => {     // asigna interaccion al clikear
            this.tablero.getAt((mensaje.xi+(mensaje.yi*gameState.ancho)).toString()).setStrokeStyle(0, gameState.bordes);
            //this.tablero.getAt((mensaje.xf+(mensaje.yf*gameState.ancho)).toString()).setStrokeStyle(1, gameState.bordes);
            gameState.clicks = 0;
            this.enviarMensage(mensaje);              
        });
    
        guardarBtn.on('pointerover', function() {     // asigna interaccion al clikear
            if ( ! gameState.solicitandoGuardado) {
                guardarBtn.setTint(gameState.colorSelec);
                guardarBtn.setScale(1.1);               
            }
        });
        guardarBtn.on('pointerout', function() {     // asigna interaccion al clikear
            if ( ! gameState.solicitandoGuardado) {
                guardarBtn.clearTint();
                guardarBtn.setScale(1);    
            }           
        });
        guardarBtn.on('pointerdown', () => {     // asigna interaccion al clikear
            if(gameState.fase === "JUGANDO" && ! gameState.solicitandoGuardado) {
                gameState.clicks = 0;
                mensaje.accion = "GUARDAR";               
                this.enviarMensage(mensaje); 
                gameState.solicitandoGuardado = true;
                this.oscurecer = this.add.rectangle(950, 540, 1920, 1080, gameState.niebla).setDepth(2).setAlpha(0.4);
            }
        });
    }

    solicitarGuardado(){
        gameState.solicitandoGuardado = true;
        var oscurecer = this.add.rectangle(950, 540, 1920, 1080, gameState.niebla).setDepth(2).setAlpha(0.4);
        var alerta = this.add.rectangle(950, 540, 1920*0.6, 1080*0.8, gameState.niebla).setDepth(3);
        var rechazarBtn = this.add.image(950 - 333, 800,"Rechazar").setInteractive().setDepth(4);
        var aceptarBtn = this.add.image(950 + 333, 800,"Aceptar").setInteractive().setDepth(4);

        rechazarBtn.on('pointerover', function() {     // asigna interaccion al clikear
        rechazarBtn.setTint(gameState.colorSelec);
        rechazarBtn.setScale(1.1);               
        });
        rechazarBtn.on('pointerout', function() {     // asigna interaccion al clikear
            rechazarBtn.clearTint();
            rechazarBtn.setScale(1);               
        });
        rechazarBtn.on('pointerdown', () => {     // asigna interaccion al clikear
            gameState.clicks = 0;
            mensaje.accion = "RECHAZAR";               
            this.enviarMensage(mensaje); 
            gameState.solicitandoGuardado = false;
            oscurecer.destroy();
            alerta.destroy();
            rechazarBtn.destroy();
            aceptarBtn.destroy();
        });

        aceptarBtn.on('pointerover', function() {     // asigna interaccion al clikear
            aceptarBtn.setTint(gameState.colorSelec);
            aceptarBtn.setScale(1.1);               
        });
        aceptarBtn.on('pointerout', function() {     // asigna interaccion al clikear
            aceptarBtn.clearTint();
            aceptarBtn.setScale(1);               
        });
        aceptarBtn.on('pointerdown', () => {     // asigna interaccion al clikear
            gameState.clicks = 0;
            mensaje.accion = "ACEPTAR";               
            this.enviarMensage(mensaje); 
            this.scene.stop('partida');
            this.scene.start('menu');
        });
    }

    dibujarDronNaval (x, y) {
        var xAbs = x + gameState.tableroX;
        var yAbs = y + gameState.tableroY;
        let dron = this.add.sprite(xAbs - 1, yAbs ,"DronN").setScale(1.5).setDepth(2);
        dron.angle = -90;
        dron.play('idleN');
        gameState.drones.push(dron);
    }

    dibujarDronAereo (x, y) {
        var xAbs = x + gameState.tableroX;
        var yAbs = y + gameState.tableroY;
        let dron = this.add.sprite(xAbs + 1, yAbs ,"DronA").setScale(1.5).setDepth(2);
        dron.angle = 90;
        dron.play('idleA');
        gameState.drones.push(dron);
    }

    eliminarDrones(){
        for (let i = 0; i < gameState.drones.length; i++) {
            const d = gameState.drones[i];
            d.destroy();
        }
        gameState.drones.length = 0;
    }

    enviarMensage(data) {
        window.conexionWS.enviar('/app/accion', data);
    }

    shutdown() {
        window.conexionWS.desuscribir('/topic/accion');
        if (this.canalPartida) {
            window.conexionWS.desuscribir(this.canalPartida);
        }
    }
    
    update() {
    }
}

