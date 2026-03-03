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
    canalPartida: "",
    drones: [],
    portaNX: 0,
    portaNY: 35,
    portaAX: 63,
    portaAY: 0,
    anchoPorta: 4,
    altoPorta: 6,
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
    MUNICION: 0,  // no se usa 
    ESTADOPARTIDA: 1,
    GUARDADO: 2,
    ERROR: 3,
    NOTIFICACION: 4,
    FINALIZACION: 5,
});

// podria eliminarse clase celda completamente y usar un metodo?
class Celda {                                   // calse celda para grilla
    constructor (grid, y, x) {                  // grid = escena donde se crean, indices para posiciones x e y
        gameState.escala = 22.36;                       // escala de posiciones //////////////////////////////////////////////////////////////////////// borrar

        let municion = "-/-";
                                                // añade rectangulo en posicion correspondiente a indices
        this.tile = grid.add.rectangle(x*gameState.escala, y*gameState.escala, gameState.tamCelda, gameState.tamCelda, gameState.niebla).setStrokeStyle(0.0, gameState.bordes).setDepth(1);
        this.tile.setAlpha(0.3);                // ajuste de opacidad para celdas de grilla
        this.tile.setInteractive();             // se setea interactivo para poder darle interaccion con mouse despues
                                                // 
        this.tile.on('pointerdown', () => {     // asigna interaccion al clikear
            //grid.textoMunicion.setText("-/-");
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
        gameState.canalPartida = data.canal;
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
        this.load.image("PortaN",".//assets/sprites/PortaVerde-42x64x1.png");
        this.load.image("PortaA",".//assets/sprites/PortaRojo-42x64x1.png");
        this.load.spritesheet("DronN",".//assets/sprites/DronVerde-64x64x2.png",{frameWidth: 64, frameHeight: 64});
        this.load.spritesheet("DronA",".//assets/sprites/DronRojo-64x64x2.png",{frameWidth: 64, frameHeight: 64});
        this.load.spritesheet("Impactos",".//assets/sprites/Impactos-399x399x11x6.png",{frameWidth: 399, frameHeight: 399});
    }

    create() {
        //alert(gameState.equipo + " - " + mensaje.nombre);
        this.crearInterfaz();
        this.crearAnimaciones();
        //this.pantallaImpactos.play('impactoPortaA');
        this.crearPortadrones();
        this.crearTablero();
        this.conectarSTOMP();
    }

    conectarSTOMP() {
        window.conexionWS.conectar(() => {
            // suscribir al canal específico de la partida (y mantener /topic/game como respaldo)
            if (gameState.canalPartida) {
                window.conexionWS.suscribir(gameState.canalPartida, (message) => {
                    this.procesarMensaje(message);
                });
                
                // Una vez suscrito, pedirle al servidor el estado actual
                // Esto sincroniza a los jugadores que se conecten después
                mensaje.accion = "ACTUALIZAR";
                this.enviarMensage(mensaje);
            }
            //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            // antiguo canal genérico queda vigente para compatibilidad
            window.conexionWS.suscribir('/topic/game', (message) => {
                this.procesarMensaje(message);
            });
            
        }, (error) => {
            // Manejo de error de conexión
        });
        //this.enviarMensage(mensaje); ///////////////ultimo comentado aca
    }

    procesarMensaje(msg) {
        console.log("procesarMensaje - recibido:", msg.tipoMensaje, "canal:", gameState.canalPartida, "miNombre:", mensaje.nombre);
        switch (msg.tipoMensaje) {
            case tipoMensaje.MUNICION: { 
                if (mensaje.nombre === msg.nombre) {
                    this.textoMunicion.setText(msg.evento);
                } 
                /*
                if (mensaje.nombre === msg.nombre) {
                    gameState.equipo = msg.equipo.toString();
                }*/
            } break;
            case tipoMensaje.ESTADOPARTIDA: {
                console.log("ESTADOPARTIDA - fase:", msg.fasePartida, "grillaLen:", msg.grilla ? msg.grilla.length : 0);
                // actualizado de fase de partida
                gameState.fase = msg.fasePartida.toString();
                if (msg.fasePartida.toString() === "JUGANDO") {
                        this.zonaDesp.destroy();
                        this.botonPasar(this.desplegarBtn);
                } /*
                if (gameState.fase !== msg.fasePartida.toString()) {
                    // si pasa a jugando se eliminan los elementos de despliegue iniciales
                    // se podria mostrar mensaje o algo
                    if (msg.fasePartida.toString() === "JUGANDO") {
                        this.zonaDesp.destroy();
                        this.botonPasar(this.desplegarBtn);
                    } 
                    // al pasar a muerte subita se podria hacer algo tambien
                    gameState.fase = msg.fasePartida.toString();
                    alert(msg.fasePartida.toString());
                }*/
                // limpiado de mascara y drones
                this.forma.clear(); 
                this.forma.fillStyle(0xff0000, 0);
                this.eliminarDrones();
                // actualizado de tablero celda a celda, junto a drones y mascara
                /*  portaNX: 0,     portaNY: 35,    
                    portaAX: 63,    portaAY: 0,*/
                var i = 0;
                msg.grilla.forEach((cel) => {
                    let celda = this.tablero.getAt(i);
                    if ( (gameState.equipo === "NAVAL" && cel.visionNaval) || (gameState.equipo === "AEREO" && cel.visionAereo)) {
                        celda.setFillStyle(0xffffff);
                        if (cel.naval)
                            this.dibujarDronNaval(celda.x, celda.y);
                        if (cel.aereo)
                            this.dibujarDronAereo(celda.x, celda.y);
                        if( (celda.x <= (gameState.portaNX+gameState.anchoPorta-1)*gameState.tamCelda && celda.y >= (gameState.portaNY-gameState.altoPorta)*gameState.tamCelda) || (celda.x >= (gameState.portaAX-gameState.anchoPorta-1)*gameState.tamCelda && celda.y <= (gameState.portaAY+gameState.altoPorta-1)*gameState.tamCelda) )  {
                                this.forma.fillRect(celda.x + gameState.tableroX -gameState.tamCelda / 2, celda.y + gameState.tableroY -gameState.tamCelda / 2, gameState.tamCelda, gameState.tamCelda);
                        }  
                    } else {
                        celda.setFillStyle(gameState.niebla);
                    }
                    i++;
                });
            } break;
            case tipoMensaje.GUARDADO: {
                console.log("GUARDADO - evento:", msg.evento, "destino:", msg.nombre);
                switch (msg.evento) {
                    case "SOLICITUD": {
                        // Solo el jugador destinatario ve el popup de aceptar/rechazar
                        if (mensaje.nombre === msg.nombre) {
                            this.solicitarGuardado();
                        }
                    } break;
                    case "RECHAZADA": {
                        // Solo el solicitante ve el mensaje de rechazo
                        if (mensaje.nombre === msg.nombre) {
                            this.mostrarMensajeEvento("Solicitud de guardado rechazada");
                            gameState.solicitandoGuardado = false;
                            if (this.oscurecer && this.oscurecer.destroy) {
                                this.oscurecer.destroy();
                                this.oscurecer = null;
                            }
                        }
                    } break;
                    case "ACEPTADA": {
                        // Cuando la partida se guarda, sacamos al jugador al menú
                        // independientemente de inconsistencias menores en el nombre.
                        this.mostrarMensajeEvento("Solicitud de guardado aceptada");
                        gameState.solicitandoGuardado = false;
                        if (this.oscurecer && this.oscurecer.destroy) {
                            this.oscurecer.destroy();
                            this.oscurecer = null;
                        }
                        // Esperamos un momento para que se vea el mensaje.
                        // Usamos setTimeout para no depender del reloj interno de Phaser.
                        setTimeout(() => {
                            console.log('Delay GUARDADO/ACEPTADA cumplido, cerrando escena partida');
                            try {
                                this.shutdown();
                            } catch (e) {
                                console.error('Error en shutdown() tras GUARDADO/ACEPTADA:', e);
                            } finally {
                                this.scene.start('menu');
                            }
                        }, 2500);
                    } break;
                }
            }break;
            case tipoMensaje.ERROR: { 
                console.log("ERROR - evento:", msg.evento, "destino:", msg.nombre);
                if (mensaje.nombre === msg.nombre) { // alerta error a jugador
                    this.mostrarMensajeError(msg.evento);
                    //alert("err:"+msg.evento);
                }
            }break;
            case tipoMensaje.NOTIFICACION: { 
                console.log("NOTIFICACION - evento:", msg.evento, "destino:", msg.nombre);
                switch (msg.evento) {
                    case "PORTADERRIBADOAEREO":{
                        this.pantallaImpactos.play('impactoPortaA');
                        this.portadronA.destroy();
                    }break;
                    case "PORTAIMPACTADOAEREO":{
                        this.pantallaImpactos.play('impactoPortaA');
                    }break;
                    case "PORTADERRIBADONAVAL":{
                        this.pantallaImpactos.play('impactoPortaN');
                        this.portadronN.destroy();
                    }break; 
                    case "PORTAIMPACTADONAVAL":{
                        this.pantallaImpactos.play('impactoPortaN');
                    }break;
                    case "DRONDERRIBADOAEREO":{
                        this.pantallaImpactos.play('impactoDronA');
                    }break;  
                    case "DRONDERRIBADONAVAL":{
                        this.pantallaImpactos.play('impactoDronN');
                    }break;  
                    case "TIROALAGUAAEREO":{
                        this.pantallaImpactos.play('tiroAguaA');
                    }break;
                    case "TIROALAGUANAVAL":{
                        this.pantallaImpactos.play('tiroAguaN');
                    }break;
                    default:{
                        if (mensaje.nombre === msg.nombre) { // notifica a jugador
                            this.mostrarMensajeEvento(msg.evento);
                            //alert("noti:"+msg.evento);
                        }
                    }break;
                }
                
            }break;//*/
            case tipoMensaje.FINALIZACION: { // FINALIZACION
                // Mostrar cartel de finalización y ganador
                let ganador = msg.nombre;
                let mensajeFin = msg.evento + "\nGanador: " + ganador;
                this.mostrarMensajeEvento(mensajeFin);
                
                //alert(mensajeFin);
                // Esperar un momento antes de volver al menú para que se vea el mensaje.
                // Usamos setTimeout para no depender del reloj interno de Phaser.
                setTimeout(() => {
                    console.log('Delay FINALIZACION cumplido, cerrando escena partida');
                    try {
                        this.shutdown();
                    } catch (e) {
                        console.error('Error en shutdown() tras FINALIZACION:', e);
                    } finally {
                        this.scene.start('menu');
                    }
                }, 2500);
                // Desconectar websocket si es necesario
                /*
                if (window.conexionWS) {
                    window.conexionWS.desconectar();
                }*/
            } break;
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

        this.anims.create({
            key: 'impactoPortaA',
            frames: this.anims.generateFrameNumbers('Impactos', { start: 0, end: 10 }),
            frameRate: 10,
            delay: 200,
            showOnStart: true,
            hideOnComplete: true,
        });
        
        this.anims.create({
            key: 'impactoPortaN',
            frames: this.anims.generateFrameNumbers('Impactos', { start: 11, end: 21 }),
            frameRate: 10,
            delay: 200,
            showOnStart: true,
            hideOnComplete: true,
        });
        
        this.anims.create({
            key: 'impactoDronA',
            frames: this.anims.generateFrameNumbers('Impactos', { start: 22, end: 32 }),
            frameRate: 10,
            delay: 200,
            showOnStart: true,
            hideOnComplete: true,
        });
        
        this.anims.create({
            key: 'impactoDronN',
            frames: this.anims.generateFrameNumbers('Impactos', { start: 33, end: 43 }),
            frameRate: 10,
            delay: 200,
            showOnStart: true,
            hideOnComplete: true,
        });

        this.anims.create({
            key: 'tiroAguaA',
            frames: this.anims.generateFrameNumbers('Impactos', { start: 44, end: 54 }),
            frameRate: 10,
            delay: 200,
            showOnStart: true,
            hideOnComplete: true,
        });
        
        this.anims.create({
            key: 'tiroAguaN',
            frames: this.anims.generateFrameNumbers('Impactos', { start: 55, end: 65 }),
            frameRate: 10,
            delay: 200,
            showOnStart: true,
            hideOnComplete: true,
        });
        
        //animaciones pantalla secundaria
    }

    crearPortadrones() {
        var posX = (gameState.portaNX + (gameState.anchoPorta / 2))* gameState.escala - (gameState.escala* 0.5) + gameState.tableroX;
        var posY = (gameState.portaNY - (gameState.altoPorta / 2))* gameState.escala + (gameState.escala * 0.5) + gameState.tableroY;
        this.portadronN = this.add.image(posX, posY, "PortaN").setDepth(2).setOrigin(0.5, 0.5);
        this.portadronN.setScale(2.8);  // 1.5 

        posX = (gameState.portaAX - (gameState.anchoPorta / 2))* gameState.escala + (gameState.escala* 0.5) + gameState.tableroX;
        posY = (gameState.portaAY + (gameState.altoPorta / 2))* gameState.escala - (gameState.escala * 0.5) + gameState.tableroY;
        this.portadronA = this.add.image(posX, posY, "PortaA").setDepth(2).setOrigin(0.5, 0.5);
        this.portadronA.setScale(2.8);  //  1.5

        this.forma = this.add.graphics().setDepth(3);
        this.forma.clear();
        this.forma.fillStyle(0xffffff);
        this.mask = this.forma.createGeometryMask();

        this.portadronN.setMask(this.mask);
        this.portadronA.setMask(this.mask); 
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
        
        //mensaje.accion = "ACTUALIZAR"; 
        //this.enviarMensage(mensaje);

        this.zonaDesp;
        const anchoZona = 15 * gameState.tamCelda-gameState.tamCelda / 2; // ancho de zona despligue 15 casillas   // hacer metodo que se borran cuando pasa a jugando
        const altoZona = (gameState.alto-1) * gameState.tamCelda;   // -1 
        if (gameState.equipo === "NAVAL") {
            this.zonaDesp = this.add.rectangle(gameState.tableroX-gameState.tamCelda / 2, gameState.tableroY-gameState.tamCelda / 2, anchoZona, altoZona, gameState.colorVerde).setOrigin(0,0);
        } else {
            this.zonaDesp = this.add.rectangle(63*gameState.escala+gameState.tableroX+gameState.tamCelda / 2, gameState.tableroY-gameState.tamCelda / 2, anchoZona, altoZona, gameState.colorRojo).setOrigin(1,0);
        }
        this.zonaDesp.setStrokeStyle(1, gameState.bordes).setAlpha(0.2).setDepth(1); 

        this.textoAlertas = this.add.text(960, -30, " ", { fontFamily: 'Courier, monospace', fontSize: 40, color: '#ffffff' }).setOrigin(0.5, 0.5).setDepth(3);
        this.textoAlertas.setAlpha(0);

        this.textoMunicion = this.add.text(1800, 450, "-/-", { fontFamily: 'Courier, monospace', fontSize: 40, color: '#ffffff' }).setOrigin(0.5, 0.5).setDepth(1);
        
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
        /*
        var actualizarBtn = this.add.image(960,540,"Guardar").setDepth(2).setInteractive();

        actualizarBtn.on('pointerdown', () => {     // asigna interaccion al clikear
            gameState.clicks = 0;
            mensaje.accion = "ACTUALIZAR";               
            this.enviarMensage(mensaje);  
        });*/

        ///////////////////////////////////////////////////////////////// mover despues
        this.pantallaImpactos = this.add.sprite(pos , 850 ,"Impactos").setScale(1).setDepth(2);
        this.pantallaImpactos.setVisible(false);

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
            if((gameState.fase === "JUGANDO" || gameState.fase === "MUERTE_SUBITA")  && ! gameState.solicitandoGuardado) {
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
            if((gameState.fase === "JUGANDO" || gameState.fase === "MUERTE_SUBITA")   && !gameState.solicitandoGuardado ) {
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
            if((gameState.fase === "JUGANDO" || gameState.fase === "MUERTE_SUBITA")   && ! gameState.solicitandoGuardado) {
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
            mensaje.accion = "DESPLEGAR";
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
            if((gameState.fase === "JUGANDO" || gameState.fase === "MUERTE_SUBITA")   && ! gameState.solicitandoGuardado) {
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
			// El cierre de la partida y vuelta al menú
			// se hará cuando llegue el mensaje GUARDADO/ACEPTADA
			gameState.solicitandoGuardado = true;
			oscurecer.destroy();
			alerta.destroy();
			rechazarBtn.destroy();
			aceptarBtn.destroy();
        });
    }

    mostrarMensajeError(texto) {
        this.textoAlertas.setText("  "+texto+"  ");
        //this.textoAlertas = this.add.text(960, -30, "  "+texto+"  ", { fontFamily: 'Courier, monospace', fontSize: 40, color: '#ffffff' }).setOrigin(0.5, 0.5);
        //this.textoAlertas.setAlpha(0);
        this.textoAlertas.setBackgroundColor('#ff00007f');

        this.cadena1 = this.tweens.chain({
            targets: this.textoAlertas,
            tweens: [
                {
                    y: 50 ,
                    alpha: 1,
                    ease: 'Power3' ,
                    duration: 500
                },{
                    y: -50 ,
                    alpha: 0,
                    ease: 'Power2' ,
                    duration: 500 ,
                    delay: 1000
                }
            ]
        });
    }

    mostrarMensajeEvento(texto) {
        this.textoAlertas.setText("  "+texto+"  ");
        //this.textoAlertas = this.add.text(960, -30, "  "+texto+"  ", { fontFamily: 'Courier, monospace', fontSize: 40, color: '#ffffff' }).setOrigin(0.5, 0.5);
        //this.textoAlertas.setAlpha(0);
        this.textoAlertas.setBackgroundColor('#000dff7f');

        this.cadena2 = this.tweens.chain({
            targets: this.textoAlertas,
            tweens: [
                {
                    y: 50 ,
                    alpha: 1,
                    ease: 'Power3' ,
                    duration: 500
                },{
                    y: -50 ,
                    alpha: 0,
                    ease: 'Power2' ,
                    duration: 500 ,
                    delay: 1000
                }
            ]
        });
    }

    dibujarDronNaval (x, y) {
        var xAbs = x + gameState.tableroX;
        var yAbs = y + gameState.tableroY;
        let dron = this.add.sprite(xAbs - 1, yAbs ,"DronN").setScale(1.5).setDepth(2);
        dron.angle = -90;
        
        dron.setInteractive(); 
        dron.on('pointerdown', () => {
            if(gameState.equipo === "NAVAL") {
                mensaje.accion = "MUNICION";               
                this.enviarMensage(mensaje); 
            }
        });
        
        dron.play('idleN');
        
        gameState.drones.push(dron);
    }

    dibujarDronAereo (x, y) {
        var xAbs = x + gameState.tableroX;
        var yAbs = y + gameState.tableroY;
        let dron = this.add.sprite(xAbs + 1, yAbs ,"DronA").setScale(1.5).setDepth(2);
        dron.angle = 90;

        dron.setInteractive(); 
        dron.on('pointerdown', () => {
            if(gameState.equipo === "AEREO") {
                mensaje.accion = "MUNICION";               
                this.enviarMensage(mensaje); 
            }
        });

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
        this.eliminarDrones();
        if (this.tablero)
            this.tablero.destroy();
        if (this.forma)
            this.forma.destroy();
        if (this.mask)
            this.mask.destroy();
        if (this.pantallaImpactos)
            this.pantallaImpactos.destroy();
        if (this.fondo)
            this.fondo.destroy();
        if (this.escenario)
            this.escenario.destroy();
        if (this.desplegarBtn)
            this.desplegarBtn.destroy();
        if (this.portadronA)
            this.portadronA.destroy();
       if (this.portadronN)
            this.portadronN.destroy();
        this.anims.remove('idleN');
        this.anims.remove('idleA');
        this.anims.remove('impactoPortaA');
        this.anims.remove('impactoPortaN');
        this.anims.remove('impactoDronA');
        this.anims.remove('impactoDronN');
        this.anims.remove('tiroAguaA');
        this.anims.remove('tiroAguaN');
        //this.tweens.removeAll();
        //this.tweens.killAll();
        if (this.cadena1 && this.cadena1.destroy) {
            this.cadena1.destroy();
            this.cadena1 = null;
        }
        if (this.cadena2 && this.cadena2.destroy) {
            this.cadena2.destroy();
            this.cadena2 = null;
        }
        gameState.colorVerde = 0xaaffaa ;                       //
        gameState.colorRojo = 0xffaaaa ;                        //
        gameState.colorSelec = 0x7cff89 ;                        //
        gameState.niebla = 0x334455 ;
        gameState.bordes = 0xffffff ;
        gameState.ancho = 64 ;                                  // cantidad de celdas horizontales
        gameState.alto = 36 ;                                    // cantidad de celdas verticales
        gameState.tableroX = 50 ; 
        gameState.tableroY = 60 ;
        gameState.miTurno = false ;                   // no se usa
        gameState.clicks = 0 ;
        gameState.fase = "" ;
        gameState.equipo = "" ;
        gameState.canalPartida = "" ;
        gameState.drones = [] ;
        gameState.portaNX = 0 ;
        gameState.portaNY = 35 ;
        gameState.portaAX = 63 ;
        gameState.portaAY = 0 ;
        gameState.escala = 22.36 ;
        gameState.tamCelda = 23 ;
        gameState.solicitandoGuardado = false ;
        mensaje.nombre = "" ;
        mensaje.accion = "" ;
        mensaje.xi = 30 ;
        mensaje.yi = 15 ;
        mensaje.xf = 30 ;
        mensaje.yf = 15 ;
        //this.scene.remove('partida');
        window.conexionWS.desuscribir('/topic/accion');
        if (gameState.canalPartida) {
            window.conexionWS.desuscribir(gameState.canalPartida);
        }
        // No detenemos ni cambiamos la escena aquí; eso se hace
        // explícitamente en los manejadores de mensajes (FINALIZACION/GUARDADO)
    }
    
    update() {
    }
}

