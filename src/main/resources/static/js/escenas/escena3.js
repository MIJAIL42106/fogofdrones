gameState = {
    colorVerde: 0xaaffaa,                           //
    colorRojo: 0xffaaaa,                            //
    colorSelec: 0x7cff89,                           //
    niebla: 0x334455,
    bordes: 0xffffff,
    ancho: 64,                                      // cantidad de celdas horizontales
    alto: 36,                                       // cantidad de celdas verticales
    tableroX: 50, 
    tableroY: 120,
    turno: "",                   
    vidaPortaN: 3,
    vidaPortaA: 6,
    cantDronesN: 0,
    cantDronesA: 0,
    turnosMS: 0,
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
    escala: 26,
    solicitandoGuardado: false,
    escalaBtn: 2 
}; 

const mensaje = {
    nombre: "",
    accion: "",
    xi: 30,         // poner negativos, podria dar problema al cargar partida
    yi: 15,
    xf: 30,
    yf: 15
};

const tipoMensaje = Object.freeze({ // una forma de hacer tipo enumerado en js
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
        this.load.image("Fondo",".//assets/fondos/FondoPartida.png");
        this.load.image("FondoMS",".//assets/fondos/FondoMuerteSubita.png");
        this.load.image("Escenario",".//assets/escenarios/escenario1.png");
        this.load.image("EscenarioMuerteSubita",".//assets/escenarios/escenario2.png");
        this.load.image("LogoA",".//assets/fondos/logo_Aereo.png");
        this.load.image("LogoN",".//assets/fondos/logo_Naval.png");
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
        this.load.audio("MusicaPartida",".//assets/musica/Musica_Partida.mp3");
        this.load.audio("MusicaMuerteSubita",".//assets/musica/Musica_Muerte_Subita.mp3");
    }

    create() {
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
        this.crearTablero();
        this.conectarSTOMP();
    }

    crearTablero() {
        gameState.infoCelda = new Map();

        for (let j = 0; j < gameState.alto; j++) {
            for (let i = 0; i < gameState.ancho; i++) {
                const clave = i + ',' + j ;
                const xAbs = gameState.tableroX + i * gameState.escala;
                const yAbs = gameState.tableroY + j * gameState.escala;

                // ver si hacerlo this o fijarse si existe antes de crearlo
                const vision = this.add.rectangle(
                    xAbs ,
                    yAbs ,
                    gameState.escala , 
                    gameState.escala , 
                    gameState.niebla 
                ).setAlpha(0.3).setDepth(1);

                gameState.infoCelda.set(clave, {
                    vision,             // rectángulo de niebla, controlás su alpha
                    dronA: null,        // imagen del dron, null si no hay
                    dronN: null,
                    ammo: 0,    //en vez de tener ambas municiones podemos tener solo una porque no vamos a ver la del dron enemigo
                    i,  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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

        zone.on('pointerdown', (pointer) => {
            const columna = Math.floor((pointer.x - gameState.tableroX + gameState.escala / 2) / gameState.escala);
            const fila = Math.floor((pointer.y - gameState.tableroY + gameState.escala / 2) / gameState.escala);
            console.log(fila + ' / ' + columna);
            if (columna < 0 || columna >= gameState.ancho || fila < 0 || fila >= gameState.alto) return;
            
            this.limpiarBordes();

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

            gameState.infoCelda.get(mensaje.xi +','+ mensaje.yi).vision.setStrokeStyle(3, gameState.colorSelec);
            const data = gameState.infoCelda.get(columna +','+ fila);
            data.vision.setStrokeStyle(3, gameState.colorSelec);
            if ( (gameState.equipo == "NAVAL" && data.dronN) || (gameState.equipo == "AEREO" && data.dronA) ) {
                this.mostrarMensajeMunicion(data.ammo, pointer.x, pointer.y);
                this.marcarRango(columna, fila);
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

    limpiarBordes() {
        gameState.infoCelda.get(mensaje.xi +','+ mensaje.yi).vision.setStrokeStyle(0, gameState.colorSelec);
        gameState.infoCelda.get(mensaje.xf +','+ mensaje.yf).vision.setStrokeStyle(0, gameState.colorSelec);
        for (let i = mensaje.xf-6; i <= mensaje.xf+6; i++) {
            for (let j = mensaje.yf-6; j <= mensaje.yf+6; j++) {
                if( ( (Math.abs(mensaje.xf-i) + Math.abs(mensaje.yf-j)) <= 6 ) && i>=0 && i<gameState.ancho && j>=0 && j<gameState.alto ) {
                    let rect = gameState.infoCelda.get(i +','+ j).vision;
                    if ( rect.fillColor == (gameState.niebla + 0xfffb86) || rect.fillColor == (0xffffff + 0xfffb86))
                        rect.setFillStyle(rect.fillColor - 0xfffb86);
                }
            }
        }
    }

    marcarRango(x, y) {
        for (let i = x-6; i <= x+6; i++) {
            for (let j = y-6; j <= y+6; j++) {
                if( ( (Math.abs(x-i) + Math.abs(y-j)) <= 6 ) && i>=0 && i<gameState.ancho && j>=0 && j<gameState.alto ) {
                    let rect = gameState.infoCelda.get(i +','+ j).vision;
                    if ( rect.fillColor == gameState.niebla || rect.fillColor == 0xffffff)
                        rect.setFillStyle(rect.fillColor + 0xfffb86);
                }
            }
        }
    }

    conectarSTOMP() {
        window.conexionWS.conectar(() => {
            // suscribir al canal de la partida
            if (gameState.canalPartida) {
                window.conexionWS.suscribir(gameState.canalPartida, (message) => {
                    this.procesarMensaje(message);
                });
                
                // Una vez suscrito, pedirle al servidor el estado actual
                mensaje.accion = "ACTUALIZAR";
                this.enviarMensage(mensaje);
            } 
        }, (error) => {
            // Manejo de error de conexión
        });
    }

    procesarMensaje(msg) {
        console.log("procesarMensaje - recibido:", msg.tipoMensaje, "canal:", gameState.canalPartida, "miNombre:", mensaje.nombre);
        switch (msg.tipoMensaje) {
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
                    if (gameState.fase == "MUERTE_SUBITA") {
                        if ( !this.muerteSubitaActiva ) {
                            // intentar dejar creacion en crearinterfaz
                            this.escenarioMS = this.add.image(this.escenario.x, this.escenario.y, "EscenarioMuerteSubita" ).setOrigin(0, 0).setDepth(0);
                            this.escenarioMS.setScale(1.163);
                            this.fondoMS = this.add.image(this.fondo.x, this.fondo.y, "FondoMS").setDepth(-1);   // creacion de fondo en posicion    // podria calcularse centro despues
                            this.fondoMS.setScale(1); 
                            if (this.escenario && this.escenario.destroy) {
                                this.escenario.destroy();
                                this.escenario = null;
                            }
                            if (this.fondo && this.fondo.destroy) {
                                this.fondo.destroy();
                                this.fondo = null;
                            }
                            this.musica.stop();
                            this.musicaMS.play({volume: 0.2});
                            this.textoTurnosMS.setVisible(true);
                            this.muerteSubitaActiva = true;
                        }
                        
                    }
                }

                gameState.vidaPortaN = msg.vidaPortaN;
                gameState.vidaPortaA = msg.vidaPortaA;
                gameState.cantDronesN = msg.cantDronesN;
                gameState.cantDronesA = msg.cantDronesA;
                gameState.turnosMS = msg.turnosMuerteSubita;
                gameState.turno = msg.equipo;
                this.actualizarHUD();

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
                            this.solicitarGuardado('SOLICITUD');
                        }break;
                        case "CONFIRMAR_REEMPLAZO":{
                            this.solicitarGuardado('REEMPLAZO');
                        }break;
                        case "CONFIRMAR_REEMPLAZO_EMPATE":{
                            this.solicitarGuardado('REEMPLAZO_EMPATE');
                        }break;
                        case "RECHAZADA":{
                            this.mostrarMensajeEvento("Solicitud de guardado rechazada");
                            gameState.solicitandoGuardado = false;
                            if (this.oscurecer && this.oscurecer.destroy) {
                                this.oscurecer.destroy();
                                this.oscurecer = null;
                            }
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
                    if (gameState.solicitandoGuardado) {
                        gameState.solicitandoGuardado = false;
                        if (this.oscurecer && this.oscurecer.destroy) {
                            this.oscurecer.destroy();
                            this.oscurecer = null;
                        }
                    }
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
        this.portadronN.setScale(1.25); // 1.1 //2,8

        posX = (gameState.portaAX - (gameState.anchoPorta / 2))* gameState.escala + (gameState.escala* 0.5) + gameState.tableroX;
        posY = (gameState.portaAY + (gameState.altoPorta / 2))* gameState.escala - (gameState.escala * 0.5) + gameState.tableroY;
        this.portadronA = this.add.image(posX, posY, "PortaA").setDepth(2).setOrigin(0.5, 0.5);
        this.portadronA.setScale(1.25); 

        this.forma = this.add.graphics().setDepth(3);
        this.forma.clear();
        this.forma.fillStyle(0xffffff);
        this.mask = this.forma.createGeometryMask();

        this.portadronN.setMask(this.mask);
        this.portadronA.setMask(this.mask); 
    }

    actualizarHUD() {
        this.textoTurno.setText(gameState.turno);
        if (gameState.turno == "NAVAL") {
            this.textoTurno.setTint(gameState.colorVerde);
        } else {
            this.textoTurno.setTint(gameState.colorRojo);
        }
        this.textoCantDA.setText(gameState.cantDronesA + "x");
        this.textoCantDN.setText("x" + gameState.cantDronesN);
        this.textoVidaA.setText(gameState.vidaPortaA + "/6");
        this.textoVidaN.setText(gameState.vidaPortaN + "/3");
        this.barraVidaA.setScale(gameState.vidaPortaA / 6, 1);
        this.barraVidaN.setScale(gameState.vidaPortaN / 3, 1);
        if (this.muerteSubitaActiva) {
            this.textoTurnosMS.setText( gameState.turnosMS + " Turnos \nRestantes");
        }
    }

    botonPasar(boton) {
        const p = boton;
        p.destroy();
        var pasarBtn = this.add.image(boton.x, boton.y, "Pasar").setScale(gameState.escalaBtn).setDepth(2).setInteractive({ useHandCursor: true });
        
        pasarBtn.on('pointerover', () => {     
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
        pasarBtn.on('pointerout', () => {     
            if ( ! gameState.solicitandoGuardado) {
                this.textoAyudas.setVisible(false); 
                pasarBtn.setScale(gameState.escalaBtn);    
            }           
        });

        pasarBtn.on('pointerdown', () => {     
            if ( ! gameState.solicitandoGuardado) {
                gameState.clicks = 0;
                this.limpiarBordes();
                mensaje.accion = "PASAR";               
                this.enviarMensage(mensaje); 
            }
        });
    }

    crearInterfaz() {
        // 960 y 540 podrian obtenerse de camara main
        this.fondo = this.add.image(960,540,"Fondo").setDepth(-1);   // creacion de fondo en posicion    // podria calcularse centro despues
        this.fondo.setScale(1);                              // seteo de escala de fondo, hecho a medida, escala 1
        //
        this.escenario = this.add.image(gameState.tableroX - gameState.escala/2, gameState.tableroY - gameState.escala/2,"Escenario").setOrigin(0, 0).setDepth(0);
        this.escenario.setScale(1.163);
        // escenario muerte subita
        this.fondoMS = null;
        this.escenarioMS = null;
        

        const nombreJugadores = gameState.canalPartida.substring(7).split("-",2)

        const anchoBarra = 420 ;
        const altoBarra = 50 ;
        var barraY = (gameState.tableroY- gameState.escala / 2) / 2;
        var barraX = gameState.tableroX - gameState.escala / 2;
        const logoNaval = this.add.image(barraX, barraY,"LogoN").setOrigin(0, 0.5).setDepth(0).setScale(0.75);
        const anchoLogo = logoNaval.width * logoNaval.scale;
        this.textoNombreN = this.add.text(barraX + anchoLogo, barraY, nombreJugadores[0], { fontFamily: 'Courier, monospace', fontSize: 40, fontStyle: 'bold', color: '#ffffff' }).setStroke('#000000', 4).setOrigin(0, 0.5).setDepth(2);
        this.textoVidaN = this.add.text(barraX + anchoLogo + anchoBarra, barraY, "3/3", { fontFamily: 'Courier, monospace', fontSize: 40, fontStyle: 'bold', color: '#ffffff' }).setStroke('#000000', 4).setOrigin(1, 0.5).setDepth(2);
        const iconDronN = this.add.sprite(barraX + anchoLogo + anchoBarra, barraY ,"DronN").setScale(1.5).setOrigin(0.5, 0.5).setDepth(2);
        iconDronN.x += iconDronN.width / 2 + 10;
        this.textoCantDN = this.add.text(barraX + anchoLogo + anchoBarra + iconDronN.width + 10, barraY, "x6", { fontFamily: 'Courier, monospace', fontSize: 40, fontStyle: 'bold', color: '#ffffff' }).setStroke('#000000', 4).setOrigin(0, 0.5).setDepth(2);
        this.barraVidaN = this.add.rectangle(barraX + anchoLogo, barraY, anchoBarra, altoBarra, gameState.colorVerde).setOrigin(0,0.5).setDepth(1);
        this.sombraBarraVidaN = this.add.rectangle(barraX + anchoLogo - 5, barraY, anchoBarra + 10, altoBarra + 10, gameState.niebla).setOrigin(0,0.5).setDepth(0);
        
        barraX += gameState.escala * gameState.ancho;
        const logoAereo = this.add.image(barraX , barraY,"LogoA").setOrigin(1, 0.5).setDepth(0).setScale(0.75);
        this.textoNombreA = this.add.text(barraX - anchoLogo, barraY , nombreJugadores[1], { fontFamily: 'Courier, monospace', fontSize: 40, fontStyle: 'bold', color: '#ffffff' }).setStroke('#000000', 4).setOrigin(1, 0.5).setDepth(2);
        this.textoVidaA = this.add.text(barraX - anchoLogo - anchoBarra, barraY , "6/6", { fontFamily: 'Courier, monospace', fontSize: 40, fontStyle: 'bold', color: '#ffffff' }).setStroke('#000000', 4).setOrigin(0, 0.5).setDepth(2);
        const iconDronA = this.add.sprite(barraX - anchoLogo - anchoBarra, barraY ,"DronA").setScale(1.5).setOrigin(0.5, 0.5).setDepth(2);
        iconDronA.x -= iconDronN.width / 2 + 10;
        this.textoCantDA = this.add.text(barraX - anchoLogo - anchoBarra - iconDronN.width - 10, barraY, "12x", { fontFamily: 'Courier, monospace', fontSize: 40, fontStyle: 'bold', color: '#ffffff' }).setStroke('#000000', 4).setOrigin(1, 0.5).setDepth(2);
        this.barraVidaA = this.add.rectangle(barraX - anchoLogo, barraY, anchoBarra, altoBarra, gameState.colorRojo).setOrigin(1,0.5).setDepth(1); 
        this.sombraBarraVidaA = this.add.rectangle(barraX - anchoLogo + 5, barraY, anchoBarra + 10, altoBarra + 10, gameState.niebla).setOrigin(1,0.5).setDepth(0);

        barraX += gameState.tableroX - gameState.escala / 2;
        this.textoTurnosMS = this.add.text(barraX - gameState.tableroX / 2, barraY, "0 Turnos \nRestantes", { fontFamily: 'Courier, monospace', fontSize: 35, fontStyle: 'bold', color: '#ffffff' }).setStroke('#000000', 4).setOrigin(0, 0.5).setDepth(2);
        this.textoTurnosMS.setVisible(false);

        barraX /= 2;
        this.textoTurno = this.add.text(barraX , barraY , "Naval", { fontFamily: 'Courier, monospace', fontSize: 60, fontStyle: 'bold', color: '#ffffff' }).setStroke('#000000', 4).setOrigin(0.5, 0.5).setDepth(2);
        this.fondoTurno = this.add.rectangle(barraX , 0, anchoBarra / 2, barraY * 2, gameState.niebla).setOrigin(0.5, 0).setDepth(1);
        this.fondoTurnoRojo = this.add.rectangle(barraX + gameState.escala / 2, 0, anchoBarra / 2, barraY * 2, gameState.colorRojo).setOrigin(0.5, 0).setDepth(0);
        this.fondoTurnoVerde = this.add.rectangle(barraX - gameState.escala / 2, 0, anchoBarra / 2, barraY * 2, gameState.colorVerde).setOrigin(0.5, 0).setDepth(0);

        this.zonaDesp;
        const anchoZona = 15 * gameState.escala; // ancho de zona despligue 15 casillas   
        const altoZona = gameState.alto * gameState.escala;
        if (gameState.equipo === "NAVAL") {
            this.zonaDesp = this.add.rectangle(gameState.tableroX-gameState.escala / 2, gameState.tableroY-gameState.escala / 2, anchoZona, altoZona, gameState.colorVerde).setOrigin(0,0);
        } else {
            this.zonaDesp = this.add.rectangle(63*gameState.escala+gameState.tableroX+gameState.escala / 2, gameState.tableroY-gameState.escala / 2, anchoZona, altoZona, gameState.colorRojo).setOrigin(1,0);
        }
        this.zonaDesp.setStrokeStyle(1, gameState.bordes).setAlpha(0.2).setDepth(1); 

        this.textoAlertas = this.add.text(this.textoTurno.x, -30, " ", { fontFamily: 'Courier, monospace', fontSize: 40, color: '#ffffff' }).setStroke('#000000', 2).setOrigin(0.5, 0.5).setDepth(3);
        this.textoAlertas.setAlpha(0);

        this.textoMunicion = this.add.text(0, 0, "", { fontFamily: 'Courier, monospace', fontSize: 25, color: '#000000' }).setOrigin(0.5, 0.5).setDepth(3);
        this.textoMunicion.setAlpha(0);
        ///////////////////////////////////////////// probar font y quitar px
        this.textoAyudas = this.add.text(0, 0, " ", {fontSize: '25px', fill: '#fff', backgroundColor: '#000' }).setVisible(false).setOrigin(0.5, 0.5).setDepth(3);

        const posXBtn = 1810 ;
        const tamBtn = 64 * gameState.escalaBtn ;
        const sep = 67 ;
        var posY =  gameState.tableroY * 1.5 ;
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
        this.muerteSubitaActiva = false;

        this.musica = this.sound.add("MusicaPartida",{ loop: true });
        this.musica.play({volume: 0.2});
        this.musicaMS = this.sound.add("MusicaMuerteSubita",{ loop: true });

        ///////////////////////////////////////////////////////////////// mover despues
        this.pantallaImpactos = this.add.sprite(this.textoTurno.x , 540 ,"Impactos").setScale(1.5).setDepth(2);
        this.pantallaImpactos.setVisible(false);

        moverBtn.on('pointerover', () => {      
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
        moverBtn.on('pointerout', () => {     
            if ( ! gameState.solicitandoGuardado) {
                this.textoAyudas.setVisible(false); 
                moverBtn.setScale(gameState.escalaBtn);  
            }           
        });
        moverBtn.on('pointerdown', () => {     
            if((gameState.fase === "JUGANDO" || gameState.fase === "MUERTE_SUBITA")  && ! gameState.solicitandoGuardado) {
                this.limpiarBordes();
                gameState.clicks = 0;
                mensaje.accion = "MOVER";               
                this.enviarMensage(mensaje);  
            }
        });

        atacarBtn.on('pointerover', () => {     
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
        atacarBtn.on('pointerout', () => {     
            if ( ! gameState.solicitandoGuardado) {
                this.textoAyudas.setVisible(false); 
                atacarBtn.setScale(gameState.escalaBtn);    
            }           
        });
        atacarBtn.on('pointerdown', () => {     
            if((gameState.fase === "JUGANDO" || gameState.fase === "MUERTE_SUBITA")   && !gameState.solicitandoGuardado ) {
                this.limpiarBordes();
                gameState.clicks = 0;
                mensaje.accion = "ATACAR";               
                this.enviarMensage(mensaje); 
            }
        });

        recargarBtn.on('pointerover', () => {     
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
        recargarBtn.on('pointerout', () => {     
            if ( !gameState.solicitandoGuardado) {
                this.textoAyudas.setVisible(false); 
                recargarBtn.setScale(gameState.escalaBtn);     
            }           
        });
        recargarBtn.on('pointerdown', () => {     
            if((gameState.fase === "JUGANDO" || gameState.fase === "MUERTE_SUBITA")   && ! gameState.solicitandoGuardado) {
                this.limpiarBordes();
                gameState.clicks = 0;
                mensaje.accion = "RECARGAR";               
                this.enviarMensage(mensaje); 
            }
        });

        this.desplegarBtn.on('pointerover', () => {     
            this.desplegarBtn.setScale(gameState.escalaBtn + 0.2);   
            this.textoAyudas.setText("Desplegar");
            this.textoAyudas.setVisible(true);              
        });
        this.desplegarBtn.on('pointermove', (pointer) => {
            this.textoAyudas.setPosition(pointer.x, pointer.y -20);
        });
        this.desplegarBtn.on('pointerout', () => {     
            this.textoAyudas.setVisible(false); 
            this.desplegarBtn.setScale(gameState.escalaBtn);                
        });

        //sera remplazado por boton pasar turno luego de desplegar
        this.desplegarBtn.on('pointerdown', () => {     
            this.limpiarBordes();
            gameState.clicks = 0;
            mensaje.accion = "DESPLEGAR";
            this.enviarMensage(mensaje);              
        });
    
        guardarBtn.on('pointerover', () => {     
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
        guardarBtn.on('pointerout', () => {     
            if ( ! gameState.solicitandoGuardado) {
                this.textoAyudas.setVisible(false); 
                guardarBtn.setScale(gameState.escalaBtn);      
            }           
        });
        guardarBtn.on('pointerdown', () => {     
            if((gameState.fase === "JUGANDO" || gameState.fase === "MUERTE_SUBITA")   && ! gameState.solicitandoGuardado) {
                gameState.clicks = 0;
                this.limpiarBordes(); //, clicks = 0 aca
                mensaje.accion = "GUARDAR";               
                this.enviarMensage(mensaje); 
                gameState.solicitandoGuardado = true;
                this.oscurecer = this.add.rectangle(950, 540, 1920, 1080, gameState.niebla).setDepth(3).setAlpha(0.4);
            }
        });
    }

    solicitarGuardado(tipoSolicitud){
        gameState.solicitandoGuardado = true;
        if (this.oscurecer && this.oscurecer.destroy) {
            this.oscurecer.destroy();
            this.oscurecer = null;
        }
        const requiereReemplazo = tipoSolicitud === 'REEMPLAZO' || tipoSolicitud === 'REEMPLAZO_EMPATE';
        const reemplazoConEmpate = tipoSolicitud === 'REEMPLAZO_EMPATE';
        var oscurecer = this.add.rectangle(950, 540, 1920, 1080, gameState.niebla).setDepth(3).setAlpha(0.4);
        this.oscurecer = oscurecer;
        var alerta = this.add.rectangle(950, 540, 1920*0.6, 1080*0.3, gameState.niebla).setDepth(3);
        var rechazarBtn = this.add.image(950 - 333, alerta.y + alerta.height / 6,"Rechazar").setInteractive({ useHandCursor: true }).setDepth(4);
        var aceptarBtn = this.add.image(950 + 333, alerta.y + alerta.height / 6,"Aceptar").setInteractive({ useHandCursor: true }).setDepth(4);
        let texto = "Se ha recibido una solicitud de guardado\nDesea guardar la partida y volver al menu?";
        if (reemplazoConEmpate) {
            texto = "Ya existe una partida guardada previa entre ambos jugadores.\nDesea borrarla para guardar la nueva?\nLa partida anterior finalizara en empate.";
        } else if (requiereReemplazo) {
            texto = "Ya existe una partida guardada previa.\nDesea borrarla para guardar la nueva?\nLa partida anterior se eliminara y ganara el rival.";
        }
        var textoSolicitud = this.add.text(950, alerta.y - alerta.height / 4, texto, { fontFamily: 'Courier, monospace', fontSize: 40, fontStyle: 'bold', color: '#ffffff' }).setStroke('#000000', 4).setOrigin(0.5, 0.5).setDepth(4);

        rechazarBtn.on('pointerover', function() {     
            rechazarBtn.setTint(0xff3030);
            rechazarBtn.setScale(1.1);               
        });
        rechazarBtn.on('pointerout', function() {     
            rechazarBtn.clearTint();
            rechazarBtn.setScale(1);               
        });
        rechazarBtn.on('pointerdown', () => {     
            mensaje.accion = "RECHAZAR";               
            this.enviarMensage(mensaje); 
            gameState.solicitandoGuardado = false;
            oscurecer.destroy();
            if (this.oscurecer === oscurecer) {
                this.oscurecer = null;
            }
            textoSolicitud.destroy();
            alerta.destroy();
            rechazarBtn.destroy();
            aceptarBtn.destroy();
        });

        aceptarBtn.on('pointerover', function() {     
            aceptarBtn.setTint(gameState.colorSelec);
            aceptarBtn.setScale(1.1);               
        });
        aceptarBtn.on('pointerout', function() {     
            aceptarBtn.clearTint();
            aceptarBtn.setScale(1);               
        });
        aceptarBtn.on('pointerdown', () => {     
            mensaje.accion = "ACEPTAR";               
            this.enviarMensage(mensaje); 

            gameState.solicitandoGuardado = true;
            oscurecer.destroy();
            if (requiereReemplazo) {
                this.oscurecer = this.add.rectangle(950, 540, 1920, 1080, gameState.niebla).setDepth(3).setAlpha(0.4);
            } else if (this.oscurecer === oscurecer) {
                this.oscurecer = null;
            }
            textoSolicitud.destroy();
			alerta.destroy();
			rechazarBtn.destroy();
			aceptarBtn.destroy();
        });
    }

    mostrarMensajeError(texto) {
        this.textoAlertas.setText("  "+texto+"  ");
        this.textoAlertas.setBackgroundColor('#ff0000d7');
        const duracion = texto.length * 55;

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
                    delay: duracion
                }
            ]
        });
    }

    mostrarMensajeEvento(texto) {
        this.textoAlertas.setText("  "+texto+"  ");
        this.textoAlertas.setBackgroundColor('#000dffd6');
        const duracion = texto.length * 55;

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
                    delay: duracion
                }
            ]
        });
    }

    mostrarMensajeMunicion(municion, x, y) {
        this.textoMunicion.setText(" Municion: "+municion+" ");
        this.textoMunicion.setBackgroundColor('#fbff0090');
        this.textoMunicion.setPosition(x, y);

        this.cadena3 = this.tweens.chain({
            targets: this.textoMunicion,
            tweens: [
                {
                    y: this.textoMunicion.y - 30 ,
                    alpha: 1,
                    ease: 'Power3' ,
                    duration: 300
                },{
                    y: this.textoMunicion.y - 20 ,
                    alpha: 0,
                    ease: 'Power2' ,
                    duration: 500 ,
                    delay: 700
                }
            ]
        });
    }

    enviarMensage(data) {
        window.conexionWS.enviar('/app/accion', data);
    }

    shutdown() {
        if (this.musica) {
            this.musica.stop();
            this.musica.destroy();
        }
        if (this.musicaMS) {
            this.musicaMS.stop();
            this.musicaMS.destroy();
        }
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
        gameState.turno = "" ;                   // no se usa
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
        gameState.solicitandoGuardado = false ;
        mensaje.nombre = "" ;
        mensaje.accion = "" ;
        mensaje.xi = 30 ;
        mensaje.yi = 15 ;
        mensaje.xf = 30 ;
        mensaje.yf = 15 ;
        window.conexionWS.desuscribir('/topic/accion');
        this.scene.stop('partida');
    }
    
    update() {
    }
}

