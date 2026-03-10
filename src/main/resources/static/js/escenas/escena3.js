estadoJuego = {
    colorVerde: 0xaaffaa,                           // area despliegue naval, vida naval, texto de turno
    colorRojo: 0xffaaaa,                            // area despliegue aereo, vida aereo, texto de turno
    colorSelec: 0x7cff89,                           // seleccion de celdas
    niebla: 0x334455,                               // 
    bordes: 0xffffff,                               // 
    ancho: 64,                                      // cantidad de celdas horizontales
    alto: 36,                                       // cantidad de celdas verticales
    tableroX: 50,                                   // posicion esq superior izquierda del tablero
    tableroY: 120,                                  //
    turno: "",                                      //
    vidaPortaN: 3,                                  //
    vidaPortaA: 6,                                  //
    cantDronesN: 0,                                 //
    cantDronesA: 0,                                 //      
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
    xi: 30,         // posicion invalida precargada
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

    init(data){                                 // carga de datos recibidos al crear en escena1
        mensaje.nombre = data.nombre;
        estadoJuego.equipo = data.equipo;
        estadoJuego.canalPartida = data.canal;
    }
                                                
    preload() {                                 // carga de assets
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

    create() {                                  // creado de elementos del juego
        // controlar desconexion/recarga de pagina
        this.beforeUnloadHandler = (e) => {
            if (mensaje.nombre && estadoJuego.canalPartida && estadoJuego.fase !== "TERMINADO") {
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
        estadoJuego.infoCelda = new Map();

        for (let j = 0; j < estadoJuego.alto; j++) {
            for (let i = 0; i < estadoJuego.ancho; i++) {
                const clave = i + ',' + j ;
                const xAbs = estadoJuego.tableroX + i * estadoJuego.escala;
                const yAbs = estadoJuego.tableroY + j * estadoJuego.escala;

                const vision = this.add.rectangle(
                    xAbs ,
                    yAbs ,
                    estadoJuego.escala , 
                    estadoJuego.escala , 
                    estadoJuego.niebla 
                ).setAlpha(0.3).setDepth(1);

                estadoJuego.infoCelda.set(clave, {
                    vision,             // rectángulo de niebla, controlás su alpha
                    dronA: null,        // imagen del dron, null si no hay
                    dronN: null,
                    municion: 0         //en vez de tener ambas municiones podemos tener solo una porque no vamos a ver la del dron enemigo
                });
            }
        }

        // zona interactiva para todo el tablero
        const anchoTotal = estadoJuego.ancho * estadoJuego.escala;
        const altoTotal = estadoJuego.alto * estadoJuego.escala;
        
        const zone = this.add.zone(
            estadoJuego.tableroX + anchoTotal / 2 - estadoJuego.escala / 2,
            estadoJuego.tableroY + altoTotal / 2 - estadoJuego.escala / 2,
            anchoTotal,
            altoTotal
        ).setInteractive();

        zone.on('pointerdown', (pointer) => {
            const columna = Math.floor((pointer.x - estadoJuego.tableroX + estadoJuego.escala / 2) / estadoJuego.escala);
            const fila = Math.floor((pointer.y - estadoJuego.tableroY + estadoJuego.escala / 2) / estadoJuego.escala);
            if (columna < 0 || columna >= estadoJuego.ancho || fila < 0 || fila >= estadoJuego.alto) return;
            
            this.limpiarBordes();

            // control de selecciond e celdas
            if (estadoJuego.fase === "DESPLIEGUE") {
                mensaje.xi = columna;
                mensaje.yi = fila;
                mensaje.xf = columna;
                mensaje.yf = fila;
            } else {
                if ( estadoJuego.clicks === 1 ) {
                    estadoJuego.clicks ++;
                    mensaje.xf = columna;
                    mensaje.yf = fila;
                } else if ( estadoJuego.clicks === 0 ) {
                    estadoJuego.clicks ++;
                    mensaje.xi = columna;
                    mensaje.yi = fila;
                    mensaje.xf = columna;
                    mensaje.yf = fila;
                } else {
                    mensaje.xi = mensaje.xf;
                    mensaje.yi = mensaje.yf;
                    mensaje.xf = columna;
                    mensaje.yf = fila;
                }
            }

            estadoJuego.infoCelda.get(mensaje.xi +','+ mensaje.yi).vision.setStrokeStyle(3, estadoJuego.colorSelec);
            const data = estadoJuego.infoCelda.get(columna +','+ fila);
            data.vision.setStrokeStyle(3, estadoJuego.colorSelec);
            if ( (estadoJuego.equipo == "NAVAL" && data.dronN) || (estadoJuego.equipo == "AEREO" && data.dronA) ) {
                this.mostrarMensajeMunicion(data.municion, pointer.x, pointer.y);
                this.marcarRango(columna, fila);
            }
        });
    }

    setVision (x, y, vision) {
        const data = estadoJuego.infoCelda.get(x +','+ y);
        if (!data) return;
        
        if (vision)
            data.vision.setFillStyle(0xffffff);          
        else 
            data.vision.setFillStyle(estadoJuego.niebla);  
    }

    dibujarDron (dron) {
        if (dron) {
            let x = dron.posicion.x;
            let y = dron.posicion.y;
            const data = estadoJuego.infoCelda.get(x + ',' + y);
            if (!data) return;

            var xAbs = x*estadoJuego.escala + estadoJuego.tableroX;
            var yAbs = y*estadoJuego.escala + estadoJuego.tableroY; 
        
            if ( dron.equipo == "NAVAL" ) {
                data.dronN = this.add.sprite(xAbs - 1, yAbs ,"DronN").setScale(1.5).setDepth(2);
                data.dronN.angle = -90;
                data.dronN.play('idleN');
                estadoJuego.drones.push(x + ',' + y);
            } else {
                data.dronA = this.add.sprite(xAbs + 1, yAbs ,"DronA").setScale(1.5).setDepth(2);
                data.dronA.angle = 90;
                data.dronA.play('idleA');
                estadoJuego.drones.push(x + ',' + y);
            }  
            if ( dron.equipo == estadoJuego.equipo ) {
                data.municion = dron.municion;
            }
        }
    }

    eliminardrones(){
        for (let i = 0; i < estadoJuego.drones.length; i++) {
            let clave = estadoJuego.drones[i];
            let celda = estadoJuego.infoCelda.get(clave);
            if (celda.dronN) {
                celda.dronN.destroy();
                celda.dronN = null;
            }
            if (celda.dronA) {
                celda.dronA.destroy();
                celda.dronA = null;
            }           
            celda.municion = 0;
        }
        estadoJuego.drones.length = 0;
    }

    limpiarBordes() {
        estadoJuego.infoCelda.get(mensaje.xi +','+ mensaje.yi).vision.setStrokeStyle(0, estadoJuego.colorSelec);
        estadoJuego.infoCelda.get(mensaje.xf +','+ mensaje.yf).vision.setStrokeStyle(0, estadoJuego.colorSelec);
        for (let i = mensaje.xf-6; i <= mensaje.xf+6; i++) {
            for (let j = mensaje.yf-6; j <= mensaje.yf+6; j++) {
                if( ( (Math.abs(mensaje.xf-i) + Math.abs(mensaje.yf-j)) <= 6 ) && i>=0 && i<estadoJuego.ancho && j>=0 && j<estadoJuego.alto ) {
                    let rect = estadoJuego.infoCelda.get(i +','+ j).vision;
                    if ( rect.fillColor == (estadoJuego.niebla + 0xfffb86) || rect.fillColor == (0xffffff + 0xfffb86))
                        rect.setFillStyle(rect.fillColor - 0xfffb86);
                }
            }
        }
    }

    marcarRango(x, y) {
        for (let i = x-6; i <= x+6; i++) {
            for (let j = y-6; j <= y+6; j++) {
                if( ( (Math.abs(x-i) + Math.abs(y-j)) <= 6 ) && i>=0 && i<estadoJuego.ancho && j>=0 && j<estadoJuego.alto ) {
                    let rect = estadoJuego.infoCelda.get(i +','+ j).vision;
                    if ( rect.fillColor == estadoJuego.niebla || rect.fillColor == 0xffffff)
                        rect.setFillStyle(rect.fillColor + 0xfffb86);
                }
            }
        }
    }

    conectarSTOMP() {
        window.conexionWS.conectar(() => {
            // suscribir al canal de la partida
            if (estadoJuego.canalPartida) {
                window.conexionWS.suscribir(estadoJuego.canalPartida, (msg) => {
                    this.procesarMensaje(msg);
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
        switch (msg.tipoMensaje) {
            case tipoMensaje.ESTADOPARTIDA: {
                // actualizado de fase de partida
                estadoJuego.fase = msg.fasePartida.toString();
                if (estadoJuego.fase !== "DESPLIEGUE") {
                    if ( !this.botonPasarActivo ) {
                        if (this.zonaDesp && this.zonaDesp.destroy) {
                            this.zonaDesp.destroy();
                            this.zonaDesp = null;
                        }
                        this.botonPasar(this.desplegarBtn);
                        this.botonPasarActivo = true;
                    }
                    if (estadoJuego.fase == "MUERTE_SUBITA") {
                        if ( !this.muerteSubitaActiva ) {
                            // se hacen visibles fondo y escenario de muerte subita y se eliminan los anteriores
                            // tambien se cambia la musica y se muestran los turnos restantes de muerte subita
                            this.escenarioMS.setVisible(true);
                            this.fondoMS.setVisible(true);
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
                // actualizacion de valores para HUD
                estadoJuego.vidaPortaN = msg.vidaPortaN;
                estadoJuego.vidaPortaA = msg.vidaPortaA;
                estadoJuego.cantDronesN = msg.cantDronesN;
                estadoJuego.cantDronesA = msg.cantDronesA;
                estadoJuego.turnosMS = msg.turnosMuerteSubita;
                estadoJuego.turno = msg.equipo;
                this.actualizarHUD();

                // limpiado de mascara y drones
                this.forma.clear(); 
                this.forma.fillStyle(0xff0000, 0);
                this.eliminardrones();
                // actualizado de tablero celda a celda, junto a drones y mascara
                // portaNX: 0,     portaNY: 35,    portaAX: 63,    portaAY: 0
                var i = 0;
                msg.grilla.forEach((cel) => {
                    let pos = Phaser.Math.ToXY(i, estadoJuego.ancho, estadoJuego.alto);

                    if ( (estadoJuego.equipo === "NAVAL" && cel.visionNaval) || (estadoJuego.equipo === "AEREO" && cel.visionAereo)) {
                        this.setVision(pos.x, pos.y, true);
                        if (cel.naval)
                            this.dibujarDron(cel.naval);
                        if (cel.aereo)
                            this.dibujarDron(cel.aereo);
                        if( (pos.x <= (estadoJuego.portaNX+estadoJuego.anchoPorta-1) && pos.y >= (estadoJuego.portaNY-estadoJuego.altoPorta+1)) || (pos.x >= (estadoJuego.portaAX-estadoJuego.anchoPorta+1) && pos.y <= (estadoJuego.portaAY+estadoJuego.altoPorta-1)) )  {
                                this.forma.fillRect(pos.x*estadoJuego.escala + estadoJuego.tableroX -estadoJuego.escala / 2, pos.y*estadoJuego.escala + estadoJuego.tableroY -estadoJuego.escala / 2, estadoJuego.escala, estadoJuego.escala);
                        }    
                    } else {
                        this.setVision(pos.x, pos.y, false);
                    }
                    i++;
                });
            } break;
            case tipoMensaje.GUARDADO: {
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
                            estadoJuego.solicitandoGuardado = false;
                            if (this.oscurecer && this.oscurecer.destroy) {
                                this.oscurecer.destroy();
                                this.oscurecer = null;
                            }
                        }break;
                        case "ACEPTADA":{
                            this.mostrarMensajeEvento("Solicitud de guardado aceptada");
                            estadoJuego.solicitandoGuardado = false;
                            if (this.oscurecer && this.oscurecer.destroy) {
                                this.oscurecer.destroy();
                                this.oscurecer = null;
                            }
                            setTimeout(() => {
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
                if (mensaje.nombre === msg.nombre) { // alerta error a jugador
                    this.mostrarMensajeError(msg.evento);
                    if (estadoJuego.solicitandoGuardado) {
                        estadoJuego.solicitandoGuardado = false;
                        if (this.oscurecer && this.oscurecer.destroy) {
                            this.oscurecer.destroy();
                            this.oscurecer = null;
                        }
                    }
                }
            }break;
            case tipoMensaje.NOTIFICACION: { 
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
            case tipoMensaje.FINALIZACION: {
                // Mostrar cartel de finalización y ganador
                let ganador = msg.nombre;
                let mensajeFin = msg.evento + "\nGanador: " + ganador;
                this.mostrarMensajeEvento(mensajeFin);
                
                // Al aceptar, salir de la partida y volver al menú
                setTimeout(() => {
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
        // animaciones de drones
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
        // animaciones de pantalla lateral de impactos
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
    }

    crearPortadrones() {
        // creacion de portadrones naval
        var posX = (estadoJuego.portaNX + (estadoJuego.anchoPorta / 2))* estadoJuego.escala - (estadoJuego.escala* 0.5) + estadoJuego.tableroX;
        var posY = (estadoJuego.portaNY - (estadoJuego.altoPorta / 2))* estadoJuego.escala + (estadoJuego.escala * 0.5) + estadoJuego.tableroY;
        this.portadronN = this.add.image(posX, posY, "PortaN").setDepth(2).setOrigin(0.5, 0.5);
        this.portadronN.setScale(1.25);
        // creacion de portadrones aereo
        posX = (estadoJuego.portaAX - (estadoJuego.anchoPorta / 2))* estadoJuego.escala + (estadoJuego.escala* 0.5) + estadoJuego.tableroX;
        posY = (estadoJuego.portaAY + (estadoJuego.altoPorta / 2))* estadoJuego.escala - (estadoJuego.escala * 0.5) + estadoJuego.tableroY;
        this.portadronA = this.add.image(posX, posY, "PortaA").setDepth(2).setOrigin(0.5, 0.5);
        this.portadronA.setScale(1.25); 
        // mascara que permite mostrar solo las partes visibles de los portadrones
        this.forma = this.add.graphics().setDepth(3);
        this.forma.clear();
        this.forma.fillStyle(0xffffff);
        this.mascara = this.forma.createGeometryMask();

        this.portadronN.setMask(this.mascara);
        this.portadronA.setMask(this.mascara); 
    }

    actualizarHUD() {
        // se actualizan los indicadores y datos de la interfaz/HUD
        this.textoTurno.setText(estadoJuego.turno);
        if (estadoJuego.turno == "NAVAL") {
            this.textoTurno.setTint(estadoJuego.colorVerde);
        } else {
            this.textoTurno.setTint(estadoJuego.colorRojo);
        }
        this.textoCantDA.setText(estadoJuego.cantDronesA + "x");
        this.textoCantDN.setText("x" + estadoJuego.cantDronesN);
        this.textoVidaA.setText(estadoJuego.vidaPortaA + "/6");
        this.textoVidaN.setText(estadoJuego.vidaPortaN + "/3");
        this.barraVidaA.setScale(estadoJuego.vidaPortaA / 6, 1);
        this.barraVidaN.setScale(estadoJuego.vidaPortaN / 3, 1);
        if (this.muerteSubitaActiva) {
            this.textoTurnosMS.setText( estadoJuego.turnosMS + " Turnos \nRestantes");
        }
    }

    botonPasar(boton) {
        // se remplaza el boton de desplegar por el de pasar turno
        const p = boton;
        p.destroy();
        var pasarBtn = this.add.image(boton.x, boton.y, "Pasar").setScale(estadoJuego.escalaBtn).setDepth(2).setInteractive({ useHandCursor: true });
        // interacciones del boton pasar
        pasarBtn.on('pointerover', () => {     
            if ( ! estadoJuego.solicitandoGuardado) {
                pasarBtn.setScale(estadoJuego.escalaBtn + 0.2);  
                this.textoAyudas.setText("Pasar");
                this.textoAyudas.setVisible(true);               
            }
        });
        pasarBtn.on('pointermove', (pointer) => {
            if ( ! estadoJuego.solicitandoGuardado) {
                this.textoAyudas.setPosition(pointer.x, pointer.y -20);
            } 
        });
        pasarBtn.on('pointerout', () => {     
            if ( ! estadoJuego.solicitandoGuardado) {
                this.textoAyudas.setVisible(false); 
                pasarBtn.setScale(estadoJuego.escalaBtn);    
            }           
        });
        pasarBtn.on('pointerdown', () => {     
            if ( ! estadoJuego.solicitandoGuardado) {
                estadoJuego.clicks = 0;
                this.limpiarBordes();
                mensaje.accion = "PASAR";               
                this.enviarMensage(mensaje); 
            }
        });
    }

    crearInterfaz() {
        // ancho y alto de pantalla
        const { anchoPantalla, altoPantalla } = this.cameras.main;
        // fondo centrado en pantalla, hecho a medida, escala 1
        this.fondo = this.add.image(anchoPantalla / 2, altoPantalla / 2, "Fondo").setDepth(-1);
        this.fondo.setScale(1);
        // escenario centrado en tablero
        this.escenario = this.add.image(estadoJuego.tableroX - estadoJuego.escala/2, estadoJuego.tableroY - estadoJuego.escala/2,"Escenario").setOrigin(0, 0).setDepth(0);
        // inicialmente escla 1 pero al agrandarse las celdas se calculo la nueva escala en proporcion
        this.escenario.setScale(1.163);
        // fondo y escenario para muerte subita (MS)
        // ocultos hasta ingresar en fase muerte subita
        this.fondoMS = this.add.image(this.fondo.x, this.fondo.y, "FondoMS").setDepth(-1);
        this.fondoMS.setScale(1); 
        this.fondoMS.setVisible(false);
        this.escenarioMS = this.add.image(this.escenario.x, this.escenario.y, "EscenarioMuerteSubita" ).setOrigin(0, 0).setDepth(0);
        this.escenarioMS.setScale(1.163);
        this.escenarioMS.setVisible(false);

        // nombres de ambos jugadores extraidos del canal de partida
        // formato "/topic/Naval-Aereo", clave de partida empieza en posicion 7
        // se divide la clave en 2 subestrings separados por "-"
        // nombreJugadores[0] = Naval, nombreJugadores[1] = Aereo
        const nombreJugadores = estadoJuego.canalPartida.substring(7).split("-",2)

        // ancho y alto de las barras de vida
        const anchoBarra = 420 ;
        const altoBarra = 50 ;
        // posiciones de las barras de vida
        var barraY = (estadoJuego.tableroY- estadoJuego.escala / 2) / 2;
        var barraX = estadoJuego.tableroX - estadoJuego.escala / 2;
        // indicadores para Naval
        // logo
        const logoNaval = this.add.image(barraX, barraY,"LogoN").setOrigin(0, 0.5).setDepth(0).setScale(0.75);
        const anchoLogo = logoNaval.width * logoNaval.scale;
        // nombre
        this.textoNombreN = this.add.text(barraX + anchoLogo, barraY, nombreJugadores[0], { fontFamily: 'Courier, monospace', fontSize: 40, fontStyle: 'bold', color: '#ffffff' }).setStroke('#000000', 4).setOrigin(0, 0.5).setDepth(2);
        // vida
        this.textoVidaN = this.add.text(barraX + anchoLogo + anchoBarra, barraY, "3/3", { fontFamily: 'Courier, monospace', fontSize: 40, fontStyle: 'bold', color: '#ffffff' }).setStroke('#000000', 4).setOrigin(1, 0.5).setDepth(2);
        // icono dron
        const iconDronN = this.add.sprite(barraX + anchoLogo + anchoBarra, barraY ,"DronN").setScale(1.5).setOrigin(0.5, 0.5).setDepth(2);
        iconDronN.x += iconDronN.width / 2 + 10;
        // cantidad de drones
        this.textoCantDN = this.add.text(barraX + anchoLogo + anchoBarra + iconDronN.width + 10, barraY, "x6", { fontFamily: 'Courier, monospace', fontSize: 40, fontStyle: 'bold', color: '#ffffff' }).setStroke('#000000', 4).setOrigin(0, 0.5).setDepth(2);
        // barra de vida
        this.barraVidaN = this.add.rectangle(barraX + anchoLogo, barraY, anchoBarra, altoBarra, estadoJuego.colorVerde).setOrigin(0,0.5).setDepth(1);
        // fondo de barra de vida
        this.sombraBarraVidaN = this.add.rectangle(barraX + anchoLogo - 5, barraY, anchoBarra + 10, altoBarra + 10, estadoJuego.niebla).setOrigin(0,0.5).setDepth(0);
        
        // recalculado barraX para lado Aereo
        barraX += estadoJuego.escala * estadoJuego.ancho;
        // logo
        const logoAereo = this.add.image(barraX , barraY,"LogoA").setOrigin(1, 0.5).setDepth(0).setScale(0.75);
        // nombre
        this.textoNombreA = this.add.text(barraX - anchoLogo, barraY , nombreJugadores[1], { fontFamily: 'Courier, monospace', fontSize: 40, fontStyle: 'bold', color: '#ffffff' }).setStroke('#000000', 4).setOrigin(1, 0.5).setDepth(2);
        // vida
        this.textoVidaA = this.add.text(barraX - anchoLogo - anchoBarra, barraY , "6/6", { fontFamily: 'Courier, monospace', fontSize: 40, fontStyle: 'bold', color: '#ffffff' }).setStroke('#000000', 4).setOrigin(0, 0.5).setDepth(2);
        // icono dron
        const iconDronA = this.add.sprite(barraX - anchoLogo - anchoBarra, barraY ,"DronA").setScale(1.5).setOrigin(0.5, 0.5).setDepth(2);
        iconDronA.x -= iconDronN.width / 2 + 10;
        // cantidad de drones
        this.textoCantDA = this.add.text(barraX - anchoLogo - anchoBarra - iconDronN.width - 10, barraY, "12x", { fontFamily: 'Courier, monospace', fontSize: 40, fontStyle: 'bold', color: '#ffffff' }).setStroke('#000000', 4).setOrigin(1, 0.5).setDepth(2);
        // barra de vida
        this.barraVidaA = this.add.rectangle(barraX - anchoLogo, barraY, anchoBarra, altoBarra, estadoJuego.colorRojo).setOrigin(1,0.5).setDepth(1); 
        // fondo de barra de vida
        this.sombraBarraVidaA = this.add.rectangle(barraX - anchoLogo + 5, barraY, anchoBarra + 10, altoBarra + 10, estadoJuego.niebla).setOrigin(1,0.5).setDepth(0);

        // recalculado barraX para quedando en posicion simetrica a centro de tablero
        barraX += estadoJuego.tableroX - estadoJuego.escala / 2;
        // turnos muerte subita
        // oculto hasta ingresar en fase muerte subita
        this.textoTurnosMS = this.add.text(barraX - estadoJuego.tableroX / 2, barraY, "0 Turnos \nRestantes", { fontFamily: 'Courier, monospace', fontSize: 35, fontStyle: 'bold', color: '#ffffff' }).setStroke('#000000', 4).setOrigin(0, 0.5).setDepth(2);
        this.textoTurnosMS.setVisible(false);

        // recalculado barraX quedando centrado al tablero
        barraX /= 2;
        // indicador de turno
        this.textoTurno = this.add.text(barraX , barraY , "Naval", { fontFamily: 'Courier, monospace', fontSize: 60, fontStyle: 'bold', color: '#ffffff' }).setStroke('#000000', 4).setOrigin(0.5, 0.5).setDepth(2);
        // fondo del indicador de turno
        this.fondoTurno = this.add.rectangle(barraX , 0, anchoBarra / 2, barraY * 2, estadoJuego.niebla).setOrigin(0.5, 0).setDepth(1);
        this.fondoTurnoRojo = this.add.rectangle(barraX + estadoJuego.escala / 2, 0, anchoBarra / 2, barraY * 2, estadoJuego.colorRojo).setOrigin(0.5, 0).setDepth(0);
        this.fondoTurnoVerde = this.add.rectangle(barraX - estadoJuego.escala / 2, 0, anchoBarra / 2, barraY * 2, estadoJuego.colorVerde).setOrigin(0.5, 0).setDepth(0);

        // zona/area de despliegue
        this.zonaDesp;
        // ancho de zona despligue 15 casillas   
        const anchoZona = 15 * estadoJuego.escala; 
        const altoZona = estadoJuego.alto * estadoJuego.escala;
        // dependiendo de equipo
        // si es naval, zona despliegue a la izquierda del tablero y en color verde
        // si es aereo, zona despliegue a la derecha del tablero y en color rojo
        if (estadoJuego.equipo === "NAVAL") {
            this.zonaDesp = this.add.rectangle(estadoJuego.tableroX-estadoJuego.escala / 2, estadoJuego.tableroY-estadoJuego.escala / 2, anchoZona, altoZona, estadoJuego.colorVerde).setOrigin(0,0);
        } else {
            this.zonaDesp = this.add.rectangle(63*estadoJuego.escala+estadoJuego.tableroX+estadoJuego.escala / 2, estadoJuego.tableroY-estadoJuego.escala / 2, anchoZona, altoZona, estadoJuego.colorRojo).setOrigin(1,0);
        }
        this.zonaDesp.setStrokeStyle(1, estadoJuego.bordes).setAlpha(0.2).setDepth(1); 

        // texto de alertas/notificaciones
        this.textoAlertas = this.add.text(this.textoTurno.x, -30, " ", { fontFamily: 'Courier, monospace', fontSize: 40, color: '#ffffff' }).setStroke('#000000', 2).setOrigin(0.5, 0.5).setDepth(3);
        this.textoAlertas.setAlpha(0);

        // texto de municion
        this.textoMunicion = this.add.text(0, 0, "", { fontFamily: 'Courier, monospace', fontSize: 25, color: '#000000' }).setOrigin(0.5, 0.5).setDepth(3);
        this.textoMunicion.setAlpha(0);
        ///////////////////////////////////////////// probar font y quitar px
        // texto de ayudas para botones
        this.textoAyudas = this.add.text(0, 0, " ", {fontSize: '25px', fill: '#fff', backgroundColor: '#000' }).setVisible(false).setOrigin(0.5, 0.5).setDepth(3);

        // creacion de botones de acciones
        const posXBtn = anchoPantalla - 110 ;
        const tamBtn = 64 * estadoJuego.escalaBtn ;
        const sep = 67 ;
        var posY =  estadoJuego.tableroY * 1.5 ;
        this.desplegarBtn = this.add.image(posXBtn,posY,"Desplegar").setScale(estadoJuego.escalaBtn).setDepth(0).setInteractive({ useHandCursor: true });
        posY += tamBtn + sep;
        var moverBtn = this.add.image(posXBtn,posY,"Mover").setScale(estadoJuego.escalaBtn).setDepth(0).setInteractive({ useHandCursor: true });
        posY += tamBtn + sep;
        var atacarBtn = this.add.image(posXBtn,posY,"Atacar").setScale(estadoJuego.escalaBtn).setDepth(0).setInteractive({ useHandCursor: true });
        posY += tamBtn + sep;
        var recargarBtn = this.add.image(posXBtn,posY,"Recargar").setScale(estadoJuego.escalaBtn).setDepth(0).setInteractive({ useHandCursor: true });
        posY += tamBtn + sep;
        var guardarBtn = this.add.image(posXBtn,posY,"Guardar").setScale(estadoJuego.escalaBtn).setDepth(0).setInteractive({ useHandCursor: true });
        
        // flags para indicar si se activo el boton pasar turno y si se ingreso a fase muerte subita
        this.botonPasarActivo = false;
        this.muerteSubitaActiva = false;

        // creacion de musica de partida y musica de muerte subita
        this.musica = this.sound.add("MusicaPartida",{ loop: true });
        this.musica.play({volume: 0.2});
        this.musicaMS = this.sound.add("MusicaMuerteSubita",{ loop: true });

        // pantalla lateral de impactos, se muestra centrado al tablero dando feedback de los ataques
        this.pantallaImpactos = this.add.sprite(this.textoTurno.x , altoPantalla / 2 ,"Impactos").setScale(1.5).setDepth(2);
        this.pantallaImpactos.setVisible(false);

        // interacciones para boton mover
        moverBtn.on('pointerover', () => {      
            if ( ! estadoJuego.solicitandoGuardado) {
                moverBtn.setScale(estadoJuego.escalaBtn + 0.2);   
                this.textoAyudas.setText("Mover");
                this.textoAyudas.setVisible(true);         
            }   
        });
        moverBtn.on('pointermove', (pointer) => {
            if ( ! estadoJuego.solicitandoGuardado) {
                this.textoAyudas.setPosition(pointer.x, pointer.y -20);
            } 
        });
        moverBtn.on('pointerout', () => {     
            if ( ! estadoJuego.solicitandoGuardado) {
                this.textoAyudas.setVisible(false); 
                moverBtn.setScale(estadoJuego.escalaBtn);  
            }           
        });
        moverBtn.on('pointerdown', () => {     
            if((estadoJuego.fase === "JUGANDO" || estadoJuego.fase === "MUERTE_SUBITA")  && ! estadoJuego.solicitandoGuardado) {
                this.limpiarBordes();
                estadoJuego.clicks = 0;
                mensaje.accion = "MOVER";               
                this.enviarMensage(mensaje);  
            }
        });
        // interacciones para boton atacar
        atacarBtn.on('pointerover', () => {     
            if ( ! estadoJuego.solicitandoGuardado) {
                atacarBtn.setScale(estadoJuego.escalaBtn + 0.2);  
                this.textoAyudas.setText("Atacar");
                this.textoAyudas.setVisible(true);            
            }
        });
        atacarBtn.on('pointermove', (pointer) => {
            if ( ! estadoJuego.solicitandoGuardado) {
                this.textoAyudas.setPosition(pointer.x, pointer.y -20);
            } 
        });
        atacarBtn.on('pointerout', () => {     
            if ( ! estadoJuego.solicitandoGuardado) {
                this.textoAyudas.setVisible(false); 
                atacarBtn.setScale(estadoJuego.escalaBtn);    
            }           
        });
        atacarBtn.on('pointerdown', () => {     
            if((estadoJuego.fase === "JUGANDO" || estadoJuego.fase === "MUERTE_SUBITA")   && !estadoJuego.solicitandoGuardado ) {
                this.limpiarBordes();
                estadoJuego.clicks = 0;
                mensaje.accion = "ATACAR";               
                this.enviarMensage(mensaje); 
            }
        });
        // interacciones para boton recargar
        recargarBtn.on('pointerover', () => {     
            if ( ! estadoJuego.solicitandoGuardado) {
                recargarBtn.setScale(estadoJuego.escalaBtn + 0.2); 
                this.textoAyudas.setText("Recargar");
                this.textoAyudas.setVisible(true);  
            }             
        });
        recargarBtn.on('pointermove', (pointer) => {
            if ( ! estadoJuego.solicitandoGuardado) {
                this.textoAyudas.setPosition(pointer.x, pointer.y -20);
            } 
        });
        recargarBtn.on('pointerout', () => {     
            if ( !estadoJuego.solicitandoGuardado) {
                this.textoAyudas.setVisible(false); 
                recargarBtn.setScale(estadoJuego.escalaBtn);     
            }           
        });
        recargarBtn.on('pointerdown', () => {     
            if((estadoJuego.fase === "JUGANDO" || estadoJuego.fase === "MUERTE_SUBITA")   && ! estadoJuego.solicitandoGuardado) {
                this.limpiarBordes();
                estadoJuego.clicks = 0;
                mensaje.accion = "RECARGAR";               
                this.enviarMensage(mensaje); 
            }
        });
        // interacciones para boton desplegar, sera remplazado por boton pasar turno luego de desplegar
        this.desplegarBtn.on('pointerover', () => {     
            this.desplegarBtn.setScale(estadoJuego.escalaBtn + 0.2);   
            this.textoAyudas.setText("Desplegar");
            this.textoAyudas.setVisible(true);              
        });
        this.desplegarBtn.on('pointermove', (pointer) => {
            this.textoAyudas.setPosition(pointer.x, pointer.y -20);
        });
        this.desplegarBtn.on('pointerout', () => {     
            this.textoAyudas.setVisible(false); 
            this.desplegarBtn.setScale(estadoJuego.escalaBtn);                
        });
        this.desplegarBtn.on('pointerdown', () => {     
            this.limpiarBordes();
            estadoJuego.clicks = 0;
            mensaje.accion = "DESPLEGAR";
            this.enviarMensage(mensaje);              
        });
        // interacciones para boton guardar
        guardarBtn.on('pointerover', () => {     
            if ( ! estadoJuego.solicitandoGuardado) {
                guardarBtn.setScale(estadoJuego.escalaBtn + 0.2);   
                this.textoAyudas.setText("Guardar");
                this.textoAyudas.setVisible(true);              
            }
        });
        guardarBtn.on('pointermove', (pointer) => {
            if ( ! estadoJuego.solicitandoGuardado) {
                this.textoAyudas.setPosition(pointer.x, pointer.y -20);
            } 
        });
        guardarBtn.on('pointerout', () => {     
            if ( ! estadoJuego.solicitandoGuardado) {
                this.textoAyudas.setVisible(false); 
                guardarBtn.setScale(estadoJuego.escalaBtn);      
            }           
        });
        guardarBtn.on('pointerdown', () => {     
            if((estadoJuego.fase === "JUGANDO" || estadoJuego.fase === "MUERTE_SUBITA")   && ! estadoJuego.solicitandoGuardado) {
                estadoJuego.clicks = 0;
                this.limpiarBordes(); 
                mensaje.accion = "GUARDAR";               
                this.enviarMensage(mensaje); 
                estadoJuego.solicitandoGuardado = true;
                this.oscurecer = this.add.rectangle(anchoPantalla / 2, altoPantalla / 2, anchoPantalla, altoPantalla, estadoJuego.niebla).setDepth(3).setAlpha(0.4);
            }
        });
    }

    solicitarGuardado(tipoSolicitud){
        // ancho y alto de pantalla
        const { anchoPantalla, altoPantalla } = this.cameras.main;

        estadoJuego.solicitandoGuardado = true;
        if (this.oscurecer && this.oscurecer.destroy) {
            this.oscurecer.destroy();
            this.oscurecer = null;
        }
        const requiereReemplazo = tipoSolicitud === 'REEMPLAZO' || tipoSolicitud === 'REEMPLAZO_EMPATE';
        var oscurecer = this.add.rectangle(anchoPantalla / 2, altoPantalla / 2, anchoPantalla, altoPantalla, estadoJuego.niebla).setDepth(3).setAlpha(0.4);
        this.oscurecer = oscurecer;
        var alerta = this.add.rectangle(anchoPantalla / 2, altoPantalla / 2, anchoPantalla * 0.7, altoPantalla * 0.3, estadoJuego.niebla).setDepth(3);
        var rechazarBtn = this.add.image(anchoPantalla / 2 - 333, alerta.y + alerta.height / 6,"Rechazar").setInteractive({ useHandCursor: true }).setDepth(4);
        var aceptarBtn = this.add.image(anchoPantalla / 2 + 333, alerta.y + alerta.height / 6,"Aceptar").setInteractive({ useHandCursor: true }).setDepth(4);
        let texto = "Se ha recibido una solicitud de guardado de partida.\nDesea guardar la partida y volver al menu?";
        if (requiereReemplazo) {
            if(tipoSolicitud === 'REEMPLAZO_EMPATE'){
                texto = "Ya existe una partida guardada entre ambos jugadores.\nDesea borrarla para guardar la nueva?\nLa partida anterior finalizara en empate.";
            } else {
                texto = "Ya existe una partida guardada previa.\nDesea borrarla para guardar la nueva?\nLa partida anterior se eliminara y ganara el rival.";
            }
        }

        var textoSolicitud = this.add.text(anchoPantalla / 2, alerta.y - alerta.height / 4, texto, { fontFamily: 'Courier, monospace', fontSize: 40, fontStyle: 'bold', color: '#ffffff' }).setStroke('#000000', 4).setOrigin(0.5, 0.5).setDepth(4);

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
            estadoJuego.solicitandoGuardado = false;
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
            aceptarBtn.setTint(estadoJuego.colorSelec);
            aceptarBtn.setScale(1.1);               
        });
        aceptarBtn.on('pointerout', function() {     
            aceptarBtn.clearTint();
            aceptarBtn.setScale(1);               
        });
        aceptarBtn.on('pointerdown', () => {     
            mensaje.accion = "ACEPTAR";               
            this.enviarMensage(mensaje); 

            estadoJuego.solicitandoGuardado = true;
            oscurecer.destroy();
            if (requiereReemplazo) {
                this.oscurecer = this.add.rectangle(anchoPantalla / 2, altoPantalla / 2, anchoPantalla, altoPantalla, estadoJuego.niebla).setDepth(3).setAlpha(0.4);
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
        if (estadoJuego.canalPartida) {
            window.conexionWS.desuscribir(estadoJuego.canalPartida);
        }
        if (this.beforeUnloadHandler) {
            window.removeEventListener('beforeunload', this.beforeUnloadHandler);
            this.beforeUnloadHandler = null;
        }
        this.eliminardrones();
        // borrar tablero nuevo
        if (this.forma)
            this.forma.destroy();
        if (estadoJuego.infoCelda)
            estadoJuego.infoCelda.destroy();
        if (zone)
            zone.destroy();
        if (this.mascara)
            this.mascara.destroy();
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
        estadoJuego.colorVerde = 0xaaffaa ;                       //
        estadoJuego.colorRojo = 0xffaaaa ;                        //
        estadoJuego.colorSelec = 0x7cff89 ;                        //
        estadoJuego.niebla = 0x334455 ;
        estadoJuego.bordes = 0xffffff ;
        estadoJuego.ancho = 64 ;                                  // cantidad de celdas horizontales
        estadoJuego.alto = 36 ;                                    // cantidad de celdas verticales
        estadoJuego.tableroX = 50 ; 
        estadoJuego.tableroY = 60 ;
        estadoJuego.turno = "" ;                   // no se usa
        estadoJuego.clicks = 0 ;
        estadoJuego.fase = "" ;
        estadoJuego.equipo = "" ;
        estadoJuego.canalPartida = "" ;
        estadoJuego.drones = [] ;
        estadoJuego.portaNX = 0 ;
        estadoJuego.portaNY = 35 ;
        estadoJuego.portaAX = 63 ;
        estadoJuego.portaAY = 0 ;
        estadoJuego.escala = 22.36 ;
        estadoJuego.solicitandoGuardado = false ;
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

