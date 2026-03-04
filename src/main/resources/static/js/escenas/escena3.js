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
    drones: [], // [{}] ?
    portaNX: 0,
    portaNY: 35,
    portaAX: 63,
    portaAY: 0,
    anchoPorta: 4,
    altoPorta: 6,
    escala: 22.36,
    tamCelda: 23,               // ver que tan necesario es teniendo escala
    solicitandoGuardado: false,
    escalaBtn: 1.5 
    //infoCelda
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
    //MUNICION: 0,  // no se usa 
    ESTADOPARTIDA: 1,
    GUARDADO: 2,
    ERROR: 3,
    NOTIFICACION: 4,
    FINALIZACION: 5,
});

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
        this.beforeUnloadHandler = (e) => {
            if (mensaje.nombre && gameState.canalPartida && gameState.fase !== "TERMINADO") {
                e.preventDefault();
                e.returnValue = '';
                return '';
            }
        };
        window.addEventListener('beforeunload', this.beforeUnloadHandler);

        this.crearInterfaz();
        this.crearAnimaciones();
        this.crearPortadrones();
        this.crearTablero2();
        this.conectarSTOMP();
    }

    crearTablero2() {
        gameState.infoCelda = new Map();
        //this.rectGraphics = this.add.graphics();

        for (let j = 0; j < gameState.alto; j++) {
            for (let i = 0; i < gameState.ancho; i++) {
                const clave = i + ',' + j ; //`${i},${j}`;
                const xAbs = gameState.tableroX + i * gameState.escala;
                const yAbs = gameState.tableroY + j * gameState.escala;

                // Rectángulo base del tablero (siempre visible)
                //this.rectGraphics.fillStyle(0x1a3a5c);
                //this.rectGraphics.fillRect(xAbs, yAbs, gameState.escala - 1, gameState.escala - 1);

                // Rectángulo de niebla de guerra, por encima del fondo
                // setAlpha(0) = sin niebla, setAlpha(0.7) = con niebla
                // ver si hacerlo this o fijarse si existe antes de crearlo
                const vision = this.add.rectangle(
                    xAbs ,//+ gameState.escala / 2,
                    yAbs ,//+ gameState.escala / 2,
                    gameState.escala , // - 1
                    gameState.escala , // - 1
                    gameState.niebla //0x000022    // cmabiar por nuestra niebla 
                ).setAlpha(0.3);

                //grid.add.rectangle(x*gameState.escala, y*gameState.escala, gameState.tamCelda, gameState.tamCelda, gameState.niebla).setStrokeStyle(0.0, gameState.bordes).setDepth(1);

                gameState.infoCelda.set(clave, {
                    vision,           // rectángulo de niebla, controlás su alpha
                    dronA: null,   // imagen del dron, null si no hay
                    dronN: null,
                    ammo: 0,
                    //en vez de tener ambas municiones podemos tener solo una porque no vamos a ver la del dron enemigo
                    //ammoA: 0,
                    //ammoN: 0,
                    //dronId: null,
                    i,
                    j
                });
            }
        }

        // UNA sola zona interactiva para TODO el tablero
        const anchoTotal = gameState.ancho * gameState.escala;
        const altoTotal = gameState.alto * gameState.escala;
        
        const zone = this.add.zone(
            gameState.tableroX + anchoTotal / 2 - gameState.escala / 2,
            gameState.tableroY + altoTotal / 2 - gameState.escala / 2,
            anchoTotal,
            altoTotal
        ).setInteractive();

        // ver si esto funciona con el this y los botones sino separarlo
        //this.input.on('pointerdown', (pointer) => {
        zone.on('pointerdown', (pointer) => {
            const columna = Math.floor((pointer.x - gameState.tableroX + gameState.escala / 2) / gameState.escala); // ((pointer.x - gameState.tableroX) / gameState.escala)
            const fila = Math.floor((pointer.y - gameState.tableroY + gameState.escala / 2) / gameState.escala);   // ((pointer.y - gameState.tableroY) / gameState.escala)
            console.log(fila + ' / ' + columna);
            if (columna < 0 || columna >= gameState.ancho || fila < 0 || fila >= gameState.alto) return;
            
            if (gameState.fase === "DESPLIEGUE") {
                mensaje.xi = columna;
                mensaje.yi = fila;
                mensaje.xf = columna;
                mensaje.yf = fila;
            } else {
                if ( gameState.clicks === 1 ) {
                    gameState.clicks ++;
                    console.log("1 -> " + gameState.clicks);
                    mensaje.xf = columna;
                    mensaje.yf = fila;
                } else if ( gameState.clicks === 0 ) {
                    gameState.clicks ++;
                    console.log("0 -> " + gameState.clicks);
                    mensaje.xi = columna;
                    mensaje.yi = fila;
                    mensaje.xf = columna;
                    mensaje.yf = fila;
                } else {
                    console.log("+1 = " + gameState.clicks);
                    mensaje.xi = mensaje.xf;
                    mensaje.yi = mensaje.yf;
                    mensaje.xf = columna;
                    mensaje.yf = fila;
                }
            }

            const data = gameState.infoCelda.get(columna +','+ fila);//(`${columna},${fila}`);
            if ( (gameState.equipo == "NAVAL" && data.dronN) || (gameState.equipo == "AEREO" && data.dronA) ) {
                // muestro municion
                // funciona este this aca?
                this.textoMunicion.setText(data.ammo);
            }
        });
    }

    setVision (x, y, vision) {
        const data = gameState.infoCelda.get(x +','+ y);
        if (!data) return;
        
        if (vision)
            data.vision.setFillStyle(0xffffff);          
        else 
            data.vision.setFillStyle(gameState.niebla);  
    }

    dibujarDron (dron) {
        if (dron) {
            let x = dron.posicion.x;
            let y = dron.posicion.y;
            const data = gameState.infoCelda.get(x + ',' + y);
            if (!data) return;

            var xAbs = x*gameState.escala + gameState.tableroX;
            var yAbs = y*gameState.escala + gameState.tableroY; 
        
            if ( dron.equipo == "NAVAL" ) {
                data.dronN = this.add.sprite(xAbs - 1, yAbs ,"DronN").setScale(1.5).setDepth(2);
                data.dronN.angle = -90;
                data.dronN.play('idleN');
                gameState.drones.push(x + ',' + y);
            } else {
                data.dronA = this.add.sprite(xAbs + 1, yAbs ,"DronA").setScale(1.5).setDepth(2);
                data.dronA.angle = 90;
                data.dronA.play('idleA');
                gameState.drones.push(x + ',' + y);
            }  
            if ( dron.equipo == gameState.equipo ) {
                data.ammo = dron.municion;
            }
        }
    }

    eliminardrones(){
        for (let i = 0; i < gameState.drones.length; i++) {
            let clave = gameState.drones[i];
            let celda = gameState.infoCelda.get(clave);
            if (celda.dronN) {
                celda.dronN.destroy();
                celda.dronN = null;
            }
            if (celda.dronA) {
                celda.dronA.destroy();
                celda.dronA = null;
            }           
            celda.ammo = 0;
        }
        gameState.drones.length = 0;
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
            //window.conexionWS.suscribir('/topic/game', (message) => {
            //    this.procesarMensaje(message);
            //});
            
        }, (error) => {
            // Manejo de error de conexión
        });
        //this.enviarMensage(mensaje); ///////////////ultimo comentado aca
    }

    procesarMensaje(msg) {
        console.log("procesarMensaje - recibido:", msg.tipoMensaje, "canal:", gameState.canalPartida, "miNombre:", mensaje.nombre);
        switch (msg.tipoMensaje) {
            // no necesario
            /*
            case tipoMensaje.MUNICION: { 
                if (mensaje.nombre === msg.nombre) {
                    this.textoMunicion.setText(msg.evento);
                } 
                /*
                if (mensaje.nombre === msg.nombre) {
                    gameState.equipo = msg.equipo.toString();
                }
            } break;*/
            case tipoMensaje.ESTADOPARTIDA: {
                console.log("ESTADOPARTIDA - fase:", msg.fasePartida, "grillaLen:", msg.grilla ? msg.grilla.length : 0);
                // actualizado de fase de partida
                gameState.fase = msg.fasePartida.toString();
                if (gameState.fase !== "DESPLIEGUE") {
                    if ( !this.botonPasarActivo ) {
                        if (this.zonaDesp && this.zonaDesp.destroy) {
                            this.zonaDesp.destroy();
                            this.zonaDesp = null;
                        }
                        this.botonPasar(this.desplegarBtn);
                        this.botonPasarActivo = true;
                    }
                }
                // limpiado de mascara y drones
                this.forma.clear(); 
                this.forma.fillStyle(0xff0000, 0);
                this.eliminardrones();
                // actualizado de tablero celda a celda, junto a drones y mascara
                /*  portaNX: 0,     portaNY: 35,    
                    portaAX: 63,    portaAY: 0,*/
                var i = 0;
                msg.grilla.forEach((cel) => {
                    let pos = Phaser.Math.ToXY(i, gameState.ancho, gameState.alto);

                    if ( (gameState.equipo === "NAVAL" && cel.visionNaval) || (gameState.equipo === "AEREO" && cel.visionAereo)) {
                        this.setVision(pos.x, pos.y, true);
                        if (cel.naval)
                            this.dibujarDron(cel.naval);
                        if (cel.aereo)
                            this.dibujarDron(cel.aereo);
                        if( (pos.x <= (gameState.portaNX+gameState.anchoPorta-1) && pos.y >= (gameState.portaNY-gameState.altoPorta+1)) || (pos.x >= (gameState.portaAX-gameState.anchoPorta+1) && pos.y <= (gameState.portaAY+gameState.altoPorta-1)) )  {
                                this.forma.fillRect(pos.x*gameState.escala + gameState.tableroX -gameState.escala / 2, pos.y*gameState.escala + gameState.tableroY -gameState.escala / 2, gameState.escala, gameState.escala);
                        }    
                    } else {
                        this.setVision(pos.x, pos.y, false);
                    }
                    i++;
                });
            } break;
            case tipoMensaje.GUARDADO: {
                console.log("GUARDADO - evento:", msg.evento, "destino:", msg.nombre);
                if (mensaje.nombre === msg.nombre) { // alerta error al jugador afectado
                    switch (msg.evento) {
                        case "SOLICITUD":{
                            this.solicitarGuardado();
                        }break;
                        case "RECHAZADA":{
                            this.mostrarMensajeEvento("Solicitud de guardado rechazada");
                            //alert("Solicitud de guardado rechazada");
                            gameState.solicitandoGuardado = false;
                            if (this.oscurecer && this.oscurecer.destroy) {
                                this.oscurecer.destroy();
                                this.oscurecer = null;
                            }
                            //this.oscurecer.destroy();
                        }break;
                        case "ACEPTADA":{
                            this.mostrarMensajeEvento("Solicitud de guardado aceptada");
                            gameState.solicitandoGuardado = false;
                            if (this.oscurecer && this.oscurecer.destroy) {
                                this.oscurecer.destroy();
                                this.oscurecer = null;
                            }
                            setTimeout(() => {
                                console.log('Delay GUARDADO/ACEPTADA cumplido, cerrando escena partida');
                                try {
                                    this.shutdown();
                                } catch (e) {
                                    console.error('Error en shutdown() tras GUARDADO/ACEPTADA:', e);
                                } finally {
                                    this.scene.start('menu');
                                }
                            }, 3000);
                        }break;  
                    }
                }
            }break;
            case tipoMensaje.ERROR: { 
                console.log("ERROR - evento:", msg.evento, "destino:", msg.nombre);
                if (mensaje.nombre === msg.nombre) { // alerta error a jugador
                    this.mostrarMensajeError(msg.evento);
                    //alert("err:"+msg.evento);

                    /////////////////////////////////////////////////////////////////////////
                    // agregar eliminacion de ventana de guardado si da error
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
                        }
                    }break;
                }
                
            }break;
            case tipoMensaje.FINALIZACION: { // FINALIZACION
                // Mostrar cartel de finalización y ganador
                let ganador = msg.nombre;
                let mensajeFin = msg.evento + "\nGanador: " + ganador;
                this.mostrarMensajeEvento(mensajeFin);
                
                // Al aceptar, salir de la partida y volver al menú
                setTimeout(() => {
                    console.log('Delay FINALIZACION cumplido, cerrando escena partida');
                    try {
                        this.shutdown();
                    } catch (e) {
                        console.error('Error en shutdown() tras FINALIZACION:', e);
                    } finally {
                        this.scene.start('menu');
                    }
                }, 4000);
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
        this.portadronN.setScale(1.1); //2,8

        posX = (gameState.portaAX - (gameState.anchoPorta / 2))* gameState.escala + (gameState.escala* 0.5) + gameState.tableroX;
        posY = (gameState.portaAY + (gameState.altoPorta / 2))* gameState.escala - (gameState.escala * 0.5) + gameState.tableroY;
        this.portadronA = this.add.image(posX, posY, "PortaA").setDepth(2).setOrigin(0.5, 0.5);
        this.portadronA.setScale(1.1); 

        this.forma = this.add.graphics().setDepth(3);
        this.forma.clear();
        this.forma.fillStyle(0xffffff);
        this.mask = this.forma.createGeometryMask();

        this.portadronN.setMask(this.mask);
        this.portadronA.setMask(this.mask); 
    }
    
    // podria no pasarse el boton
    botonPasar(boton) {
        const p = boton;
        var pos = boton.x;
        p.destroy();
        var pasarBtn = this.add.image(pos,960,"Pasar").setDepth(2).setInteractive();
        
        pasarBtn.on('pointerover', function() {     // asigna interaccion al clikear
            if ( ! gameState.solicitandoGuardado) {
                pasarBtn.setScale(gameState.escalaBtn + 0.2);  
                this.textoAyudas.setText("Pasar");
                this.textoAyudas.setVisible(true);               
            }
        });
        pasarBtn.on('pointermove', (pointer) => {
            if ( ! gameState.solicitandoGuardado) {
                this.textoAyudas.setPosition(pointer.x, pointer.y -20);
            } 
        });
        pasarBtn.on('pointerout', () => {     // asigna interaccion al clikear
            if ( ! gameState.solicitandoGuardado) {
                this.textoAyudas.setVisible(false); 
                pasarBtn.setScale(gameState.escalaBtn);    
            }           
        });

        pasarBtn.on('pointerdown', () => {     // asigna interaccion al clikear
            if ( ! gameState.solicitandoGuardado) {
                gameState.clicks = 0;
                // limpiar bordes
                mensaje.accion = "PASAR";               
                this.enviarMensage(mensaje); 
            }
        });
    }

    crearInterfaz() {
        // 960 y 540 podrian obtenerse de camara main
        var fondo = this.add.image(960,540,"Fondo").setDepth(-1);   // creacion de fondo en posicion    // podria calcularse centro despues
        fondo.setScale(1);                              // seteo de escala de fondo, hecho a medida, escala 1
        // ver si se puede usar tableroX y tableroY para posicion de escenario
        var escenario = this.add.image(38, 48,"Escenario").setOrigin(0, 0).setDepth(0);
        escenario.setScale(1);

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

        this.textoAyudas = this.add.text(0, 0, " ", {fontSize: '25px', fill: '#fff', backgroundColor: '#000' }).setVisible(false).setOrigin(0.5, 0.5).setDepth(3);;
        
        const posXBtn = 1850 ;
        this.textoMunicion = this.add.text(posXBtn, 350, "-", { fontFamily: 'Courier, monospace', fontSize: 40, color: '#ffffff' }).setOrigin(0.5, 0.5).setDepth(1);
        
        const tamBtn = 64 * gameState.escalaBtn ;
        const sep = 35 ;
        var posY = 450 ;
        this.desplegarBtn = this.add.image(posXBtn,posY,"Desplegar").setScale(gameState.escalaBtn).setDepth(0).setInteractive({ useHandCursor: true });
        posY += tamBtn + sep;
        var moverBtn = this.add.image(posXBtn,posY,"Mover").setScale(gameState.escalaBtn).setDepth(0).setInteractive({ useHandCursor: true });
        posY += tamBtn + sep;
        var atacarBtn = this.add.image(posXBtn,posY,"Atacar").setScale(gameState.escalaBtn).setDepth(0).setInteractive({ useHandCursor: true });
        posY += tamBtn + sep;
        var recargarBtn = this.add.image(posXBtn,posY,"Recargar").setScale(gameState.escalaBtn).setDepth(0).setInteractive({ useHandCursor: true });
        posY += tamBtn + sep;
        var guardarBtn = this.add.image(posXBtn,posY,"Guardar").setScale(gameState.escalaBtn).setDepth(0).setInteractive({ useHandCursor: true });
        this.botonPasarActivo = false;

        ///////////////////////////////////////////////////////////////// mover despues
        this.pantallaImpactos = this.add.sprite(posY , 850 ,"Impactos").setScale(1).setDepth(2);
        this.pantallaImpactos.setVisible(false);

        moverBtn.on('pointerover', () => {     // asigna interaccion al clikear 
            if ( ! gameState.solicitandoGuardado) {
                moverBtn.setScale(gameState.escalaBtn + 0.2);   
                this.textoAyudas.setText("Mover");
                this.textoAyudas.setVisible(true);         
            }   
        });
        moverBtn.on('pointermove', (pointer) => {
            if ( ! gameState.solicitandoGuardado) {
                this.textoAyudas.setPosition(pointer.x, pointer.y -20);
            } 
        });
        moverBtn.on('pointerout', () => {     // asigna interaccion al clikear
            if ( ! gameState.solicitandoGuardado) {
                this.textoAyudas.setVisible(false); 
                moverBtn.setScale(gameState.escalaBtn);  
            }           
        });
        moverBtn.on('pointerdown', () => {     // asigna interaccion al clikear
            if((gameState.fase === "JUGANDO" || gameState.fase === "MUERTE_SUBITA")  && ! gameState.solicitandoGuardado) {
                // limpiar bordes
                gameState.clicks = 0;
                mensaje.accion = "MOVER";               
                this.enviarMensage(mensaje);  
            }
        });

        atacarBtn.on('pointerover', () => {     // asigna interaccion al clikear
            if ( ! gameState.solicitandoGuardado) {
                atacarBtn.setScale(gameState.escalaBtn + 0.2);  
                this.textoAyudas.setText("Atacar");
                this.textoAyudas.setVisible(true);            
            }
        });
        atacarBtn.on('pointermove', (pointer) => {
            if ( ! gameState.solicitandoGuardado) {
                this.textoAyudas.setPosition(pointer.x, pointer.y -20);
            } 
        });
        atacarBtn.on('pointerout', () => {     // asigna interaccion al clikear
            if ( ! gameState.solicitandoGuardado) {
                this.textoAyudas.setVisible(false); 
                atacarBtn.setScale(gameState.escalaBtn);    
            }           
        });
        atacarBtn.on('pointerdown', () => {     // asigna interaccion al clikear
            if((gameState.fase === "JUGANDO" || gameState.fase === "MUERTE_SUBITA")   && !gameState.solicitandoGuardado ) {
                // limpiar bordes
                gameState.clicks = 0;
                mensaje.accion = "ATACAR";               
                this.enviarMensage(mensaje); 
            }
        });

        recargarBtn.on('pointerover', () => {     // asigna interaccion al clikear
            if ( ! gameState.solicitandoGuardado) {
                recargarBtn.setScale(gameState.escalaBtn + 0.2); 
                this.textoAyudas.setText("Recargar");
                this.textoAyudas.setVisible(true);  
            }             
        });
        recargarBtn.on('pointermove', (pointer) => {
            if ( ! gameState.solicitandoGuardado) {
                this.textoAyudas.setPosition(pointer.x, pointer.y -20);
            } 
        });
        recargarBtn.on('pointerout', () => {     // asigna interaccion al clikear
            if ( !gameState.solicitandoGuardado) {
                this.textoAyudas.setVisible(false); 
                recargarBtn.setScale(gameState.escalaBtn);     
            }           
        });
        recargarBtn.on('pointerdown', () => {     // asigna interaccion al clikear
            if((gameState.fase === "JUGANDO" || gameState.fase === "MUERTE_SUBITA")   && ! gameState.solicitandoGuardado) {
                // limpiar bordes
                gameState.clicks = 0;
                mensaje.accion = "RECARGAR";               
                this.enviarMensage(mensaje); 
            }
        });

        this.desplegarBtn.on('pointerover', () => {     // asigna interaccion al clikear
            this.desplegarBtn.setScale(gameState.escalaBtn + 0.2);   
            this.textoAyudas.setText("Desplegar");
            this.textoAyudas.setVisible(true);              
        });
        this.desplegarBtn.on('pointermove', (pointer) => {
            this.textoAyudas.setPosition(pointer.x, pointer.y -20);
        });
        this.desplegarBtn.on('pointerout', () => {     // asigna interaccion al clikear
            this.textoAyudas.setVisible(false); 
            this.desplegarBtn.setScale(gameState.escalaBtn);                
        });

        //boton pasar turno con skin alternativa para desplegar al inicio
        this.desplegarBtn.on('pointerdown', () => {     // asigna interaccion al clikear
            // limpiar bordes
            gameState.clicks = 0;
            mensaje.accion = "DESPLEGAR";
            this.enviarMensage(mensaje);              
        });
    
        guardarBtn.on('pointerover', () => {     // asigna interaccion al clikear
            if ( ! gameState.solicitandoGuardado) {
                guardarBtn.setScale(gameState.escalaBtn + 0.2);   
                this.textoAyudas.setText("Guardar");
                this.textoAyudas.setVisible(true);              
            }
        });
        guardarBtn.on('pointermove', (pointer) => {
            if ( ! gameState.solicitandoGuardado) {
                this.textoAyudas.setPosition(pointer.x, pointer.y -20);
            } 
        });
        guardarBtn.on('pointerout', () => {     // asigna interaccion al clikear
            if ( ! gameState.solicitandoGuardado) {
                this.textoAyudas.setVisible(false); 
                guardarBtn.setScale(gameState.escalaBtn);      
            }           
        });
        guardarBtn.on('pointerdown', () => {     // asigna interaccion al clikear
            if((gameState.fase === "JUGANDO" || gameState.fase === "MUERTE_SUBITA")   && ! gameState.solicitandoGuardado) {
                gameState.clicks = 0;
                // limpiar bordes, clicks = 0 aca
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
        var rechazarBtn = this.add.image(950 - 333, 800,"Rechazar").setInteractive({ useHandCursor: true }).setDepth(4);
        var aceptarBtn = this.add.image(950 + 333, 800,"Aceptar").setInteractive({ useHandCursor: true }).setDepth(4);

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

            gameState.solicitandoGuardado = true;
			oscurecer.destroy();
			alerta.destroy();
			rechazarBtn.destroy();
			aceptarBtn.destroy();
        });
    }

    mostrarMensajeError(texto) {
        this.textoAlertas.setText("  "+texto+"  ");
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

    enviarMensage(data) {
        window.conexionWS.enviar('/app/accion', data);
    }

    shutdown() {
        // Guardar el canal antes de limpiar el gameState; si no, no podremos desuscribir.
        //const canalAnterior = gameState.canalPartida;
        if (gameState.canalPartida) {
            window.conexionWS.desuscribir(gameState.canalPartida);
        }

        if (this.beforeUnloadHandler) {
            window.removeEventListener('beforeunload', this.beforeUnloadHandler);
            this.beforeUnloadHandler = null;
        }

        this.eliminardrones();
        // borrar tablero nuevo
        if (this.forma)
            this.forma.destroy();
        if (gameState.infoCelda)
            gameState.infoCelda.destroy();
        if (zone)
            zone.destroy();
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
        // Limpieza de suscripciones: evitar que queden callbacks viejos activos al volver al menú.
        window.conexionWS.desuscribir('/topic/accion');

        /*
        window.conexionWS.desuscribir('/topic/game');
        if (canalAnterior) {
            window.conexionWS.desuscribir(canalAnterior);
        }*/
        // pq no seria necesario hacer stop?
        this.scene.stop('partida');
    }
    
    update() {
    }
}

