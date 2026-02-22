gameState = {
    colorVerde: 0xaaffaa,                       //
    colorRojo: 0xffaaaa,                        //
    ancho: 64,                                  // cantidad de celdas horizontales
    alto: 36,                                    // cantidad de celdas verticales
    miTurno: false,
    celdas: 0,
    fase: 0
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
        this.res = 22.45;                       // escala de posiciones
                                                // añade imagen en posicion correspondiente a indices con escalas aplciadas // remplazar por rectangulos
        this.tile = grid.add.image((x*this.res),(y*this.res),"tileT").setScale(1.45);  // tambien escala la imagen
        this.tile.setAlpha(0.5);                // ajuste de opacidad para celdas de grilla
        this.tile.setInteractive();             // se setea interactivo para poder darle interaccion con mouse despues
                                                // 
        this.tile.on('pointerdown', () => {     // asigna interaccion al clikear
            if (gameState.fase === 0) {
                if (gameState.celdas % 2 === 0){
                    gameState.celdas ++;
                    mensaje.xi = x;
                    mensaje.yi = y;
                    this.tile.setTint(0x44ff44); 
                } else {
                    grid.tablero.getAt((mensaje.xi+(mensaje.yi*gameState.ancho)).toString()).clearTint();
                    
                    mensaje.xi = 0;
                    mensaje.yi = 0;

                    gameState.celdas = 0;
                }

            } else {
                if (gameState.celdas % 3 === 0){
                    gameState.celdas ++;
                    mensaje.xi = x;
                    mensaje.yi = y;
                    this.tile.setTint(0x44ff44); 
                } else if (gameState.celdas % 3 === 1) {
                    mensaje.xf = x;
                    mensaje.yf = y;
                    gameState.celdas ++;
                    this.tile.setTint(0xff44ff); 
                } else {
                    grid.tablero.getAt((mensaje.xi+(mensaje.yi*gameState.ancho)).toString()).clearTint();
                    grid.tablero.getAt((mensaje.xf+(mensaje.yf*gameState.ancho)).toString()).clearTint();
                    
                    mensaje.xi = 0;
                    mensaje.yi = 0;
                    mensaje.xf = 0;
                    mensaje.yf = 0;

                    gameState.celdas = 0;
                }
            }
            //this.tile.setTint(0x44ff44);                              // cambia tint de celda
            //grid.enviarMensage((y+(x*gameState.ancho)).toString());   // se envia el mensaje con indice de celda pintada como string
        });
        
        this.tile.on('pointerover', () => {
            grid.indx.setText("X: "+x);
            grid.indy.setText("Y: "+y);
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
        

        let prueba = this.add.text(1500 , 900,"ii: "+ mensaje.nombre, { fill: "#222222", font: "40px Times New Roman"});

        let indiceprueba = this.add.text(1700 , 800,"msg: ", { fill: "#222222", font: "40px Times New Roman"});
        let pruebasi = this.add.text(1500 , 800,"faselocal: " + gameState.fase, { fill: "#222222", font: "40px Times New Roman"});
        //let posx = this.add.text(1500 , 900,"X: ", { fill: "#222222", font: "40px Times New Roman"});//let posy = this.add.text(1500 , 1000,"Y: ", { fill: "#222222", font: "40px Times New Roman"});
        this.indx = this.add.text(1700 , 900,"iX: ", { fill: "#222222", font: "40px Times New Roman"});
        this.indy = this.add.text(1700 , 1000,"iY: ", { fill: "#222222", font: "40px Times New Roman"});
                                                        
        // Conexión STOMP con SockJS
        this.conectarSTOMP();

        //this.size = gameState.ancho * gameState.alto;   // usado para asignar intreraccion a celdas en un for // puede remplazarse

        // enviar nombre para crear partida
        //jackson.setText(JSON.stringify(mensaje));
        


        this.tablero = this.add.container (45, 55);     // creaccion de elemento container que almacenara las celdas 

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
        
        // Deshabilitar logs de debug (opcional)
        this.stompClient.debug = null;
        
        // Conectar al servidor STOMP
        this.stompClient.connect({}, (frame) => {
            console.log('Conectado a STOMP: ' + frame);
            
            // Suscribirse al topic /topic/game para recibir actualizaciones
            this.stompClient.subscribe('/topic/game', (message) => {
                var fas = JSON.parse(message.body);
                
                // Actualizar UI con el estado recibido
                if (this.indiceprueba) {
                    this.indiceprueba.setText("msg: " + fas);
                }
                
                // Actualizar fase del juego
                switch (fas) {
                    case "DESPLIEGUE":
                        gameState.fase = 0;
                        break;
                    case "JUGANDO":
                        gameState.fase = 1;
                        break;
                    case "MUERTE_SUBITA":
                        gameState.fase = 2;
                        break;
                    case "TERMINADO":
                        gameState.fase = 3;
                        break;
                }
                
                if (this.pruebasi) {
                    this.pruebasi.setText("faselocal: " + gameState.fase);
                }
            });
            
            // Enviar mensaje inicial para unirse a la partida
            this.enviarMensage(JSON.stringify(mensaje));
            
        }, (error) => {
            console.error('Error de conexión STOMP: ' + error);
            // Intentar reconectar después de 5 segundos
            setTimeout(() => this.conectarSTOMP(), 5000);
        });
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

    /**
     * Envía un mensaje al servidor mediante STOMP
     * @param {string} data - Datos en formato JSON string a enviar
     */
    enviarMensage(data) {
        if (this.stompClient && this.stompClient.connected) {
            // Enviar mensaje a /app/accion (el servidor lo recibe en @MessageMapping("/accion"))
            this.stompClient.send("/app/accion", {}, data);
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

