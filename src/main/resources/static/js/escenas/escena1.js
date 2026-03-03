gameState = {       // va a almacenar el estado del juego
                        // o variables/informacion que necesitamos pasar entre funciones, mejor opcion que globales
    colorVerde: 0xaaffaa,
    colorRojo: 0xffaaaa,
    equipo: ""
};  

const mensajeLogin = {
    nombre: ""
};

class escena1 extends Phaser.Scene {

    constructor() {
        super({key: "menu"});  // nombre
    }
    preload() {
        this.load.image("FondoMenu",".//assets/fondos/fondo_lobby.png");
    }  

    create() { 
        const { width, height } = this.cameras.main;
        
        //this.cameras.main.setBackgroundColor('#FF0000'); // Rojo
        //this.cameras.main.setBackgroundColor('rgba(0, 0, 0, 0.5)'); // Transparente
        document.body.style.backgroundColor = '#000000';  // este cubre todo el fondo, incluso el canvas
        
        this.fondo = this.add.image(width / 2, height / 2, "FondoMenu");
        this.awaitingLoginResponse = false;
        this.startedPartida = false;
        this.buscandoPartida = false;
        
        this.crearNombreInput();

        // Botones grandes y centrados con estilo militar
        const botonStyle = {
            fontSize: '48px',
            fontFamily: 'Cambria, "Times New Roman", serif',
            color: '#f0f7e0',
            padding: { x: 40, y: 20 },
            stroke: '#000000',
            strokeThickness: 4
        };

        this.jugarBtn = this.add.text(width / 2, height * 0.65, 'BUSCAR PARTIDA', botonStyle)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
        // verde claro por defecto
        this.jugarBtn.setBackgroundColor('#66bb6a');

        this.cargarBtn = this.add.text(width / 2, height * 0.80, 'CARGAR PARTIDA', botonStyle)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
        // azul por defecto
        this.cargarBtn.setBackgroundColor('#4b7ae5');

        this.estadoTexto = this.add.text(width / 2, height * 0.9, '', {
            fontSize: '26px',
            fontFamily: 'Cambria, "Times New Roman", serif',
            color: '#f0f7e0'
        }).setOrigin(0.5);

        // Crear y cargar ranking antes de suscribirse, así no perdemos el primer mensaje
        this.crearUIRanking();
        this.conectarSTOMP();

        this.jugarBtn.on('pointerdown', () => {
            if (this.buscandoPartida) {
                this.cancelarBusqueda();
                return;
            }
            // Si estaba intentando cargar partida, cancelar ese flujo
            if (this.cargandoPartida) {
                this.cancelarCarga();
            }
            mensajeLogin.nombre = this.nombreInput.value.trim();
            if (!mensajeLogin.nombre) {
                this.mostrarMensajeError('Falta Nombre');
                return;
            }
            this.buscandoPartida = true;
            this.nombreInput.disabled = true;
            this.jugarBtn.setText('CANCELAR');
            this.jugarBtn.setBackgroundColor('#c62828'); // rojo al cancelar
            this.estadoTexto.setText('Esperando contrincante...');
            this.awaitingLoginResponse = true;
            window.conexionWS.enviar('/app/login', { nombre: mensajeLogin.nombre });
        });

        this.cargarBtn.on('pointerdown', () => {
            if (this.cargandoPartida) {
                this.cancelarCarga();
                return;
            }
            // Si estaba buscando partida, cancelar ese flujo
            if (this.buscandoPartida) {
                this.cancelarBusqueda();
            }
            mensajeLogin.nombre = this.nombreInput.value.trim();
            if (!mensajeLogin.nombre) {
                this.mostrarMensajeError("Falta Nombre");
                //alert('falta nombre');
                return;
            }
            this.cargandoPartida = true;
            this.nombreInput.disabled = true;
            this.cargarBtn.setText('CANCELAR');
            this.cargarBtn.setBackgroundColor('#c62828'); // rojo al cancelar
            this.estadoTexto.setText('Esperando al rival...');
            window.conexionWS.enviar('/app/cargar', { nombre: mensajeLogin.nombre });
        });
    }

    // Centraliza la conexión y suscripción a los tópicos usando ConexionWS
    conectarSTOMP() {
        window.conexionWS.conectar(() => {
            window.conexionWS.suscribir('/topic/login', (msg) => {
                const nombreLocal = this.normalizarNombre(mensajeLogin.nombre);
                const nombreRemoto = this.normalizarNombre(msg.nombre);
                const mismoJugador = nombreLocal.length > 0 && nombreLocal === nombreRemoto;
                // Manejo de error de login y de carga
                if (msg && msg.tipoMensaje === 3 && mismoJugador) {
                    // Si el error es por cargar partida guardada
                    if (msg.evento && msg.evento.includes('No tienes partida guardada')) {
                        this.mostrarMensajeError(msg.evento);
                        //alert('No tienes partida guardada');
                        this.cancelarCarga();
                        return;//////////////////////////////////////////// reeturn peruano
                    }
                    // Error de login/búsqueda de partida
                    this.cancelarCarga();
                    this.cancelarBusqueda();/*
                    this.buscandoPartida = false;
                    this.awaitingLoginResponse = false;
                    this.nombreInput.disabled = false;
                    this.jugarBtn.setText('BUSCAR PARTIDA');
                    this.jugarBtn.setBackgroundColor('#66bb6a'); // verde claro por defecto
                    this.estadoTexto.setText('');*/
                    this.mostrarMensajeError(msg.evento);
                    //alert(msg.error || 'No se pudo iniciar sesión');
                    return;
                }
            });
            window.conexionWS.suscribir('/topic/partida-lista', (msg) => {
                const nombreLocal = this.normalizarNombre(mensajeLogin.nombre);
                const nombreRemoto = this.normalizarNombre(msg.nombre);
                const mismoJugador = nombreLocal.length > 0 && nombreRemoto && nombreLocal === nombreRemoto;
                if (mismoJugador && this.buscandoPartida) {
                    // guardar canal (servidor lo envía)
                    this.canalPartida = msg.canal;
                    this.iniciarPartida(mensajeLogin.nombre, msg.equipo, this.canalPartida);
                }
            });
            // Suscripción para cargar partida
            window.conexionWS.suscribir('/topic/cargar-lista', (msg) => {
                const nombreLocal = this.normalizarNombre(mensajeLogin.nombre);
                const nombreRemoto = this.normalizarNombre(msg.nombre);
                const mismoJugador = nombreLocal.length > 0 && nombreRemoto && nombreLocal === nombreRemoto;
                if (mismoJugador && this.cargandoPartida) {
                    this.canalPartida = msg.canal;
                    this.iniciarPartida(mensajeLogin.nombre, msg.equipo, this.canalPartida);
                }
            });
            // Suscripción para ranking
            window.conexionWS.suscribir('/topic/ranking', (msg) => {
                if (!Array.isArray(msg) || msg.length === 0) {
                    if (this.rankingText) {
                        this.rankingText.setText('Sin datos de jugadores');
                    }
                    return;
                }

                // Cabecera y filas con columnas alineadas, pero más compactas
                const headerIndex = '#'.padEnd(3, ' ');       // columna índice (incluye ".")
                const headerNombre = 'Nombre'.padEnd(12, ' ');
                const headerPts = 'Pts'.padStart(4, ' ');
                const headerVic = 'Vic'.padStart(4, ' ');

                let lineas = [headerIndex + headerNombre + headerPts + headerVic];

                msg.forEach((jug, idx) => {
                    const pos = (idx + 1).toString();
                    const colIndex = (pos + '.').padEnd(3, ' ');
                    const nombre = (jug.nombre || '').toString().substring(0, 10).padEnd(12, ' ');
                    const puntos = String(jug.puntos ?? 0).padStart(4, ' ');
                    const vict = String(jug.victorias ?? 0).padStart(4, ' ');
                    lineas.push(colIndex + nombre + puntos + vict);
                });

                if (this.rankingText) {
                    // encabezado + filas
                    //const header = '#  Nombre       Pts  Vi';
                    this.rankingText.setText(lineas);
                    //this.rankingText.setText([header].concat(lineas).join('\n'));
                }
            });
            window.conexionWS.enviar('/app/ranking', { });
        }, (error) => {
            this.estadoTexto.setText('Error de conexión');
        });
    }
/*
    resizeRanking(gameSize) {
        // gameSize es el objeto {width,height} que envía scale.on('resize')
        const size = gameSize || this.scale.gameSize || this.cameras.main;
        const width = size.width;
        const height = size.height;
        const panelX = width - 360;
        const panelY = 60;

        // reposicionamos el panel y los elementos
        if (this._rankingPanel) {
            this._rankingPanel.setPosition(panelX + 160, panelY + 160);
        }
        if (this.rankingTitulo) {
            this.rankingTitulo.setPosition(panelX + 16, panelY - 10);
        }
        if (this.rankingText) {
            this.rankingText.setPosition(panelX + 16, panelY + 32);
            // ajustar word wrap width si cambia el ancho disponible
            const newWidth = Math.min(300, Math.max(120, width - panelX - 40));
            this.rankingText.setWordWrapWidth(newWidth);
        }
    }
*/
    crearUIRanking() {
        const { width, height } = this.cameras.main;
        const panelX = width - 360;
        const panelY = 60;
        
        // Panel de fondo tipo consola militar
        this._rankingPanel = this.add.rectangle(panelX + 160, panelY + 160, 320, 260, 0x0b1a0b, 0.85)
            .setStrokeStyle(3, 0x5a7f3a, 1);

        this.rankingTitulo = this.add.text(panelX + 16, panelY - 10, 'RANKING DE JUGADORES', {
            fontSize: '24px',
            fontFamily: 'Cambria, "Times New Roman", serif',
            color: '#d7ffb2',
            fontStyle: 'bold'
        }).setOrigin(0, 0);

        // crear un texto simple para el ranking (monoespaciado)
        const textStyle = {
            fontFamily: 'Courier, monospace',
            fontSize: '20px',
            color: '#f0f7e0',
            align: 'left',
            wordWrap: { width: 320 }
        };
        this.rankingText = this.add.text(panelX + 16, panelY + 32, 'Cargando ranking...', textStyle)
            .setOrigin(0, 0);

        // registrar resize y aplicar posición inicial
        //this.scale.on('resize', this.resizeRanking, this);
        //this.resizeRanking(this.scale.gameSize);
    }

    cancelarBusqueda() {
        this.buscandoPartida = false;
        this.awaitingLoginResponse = false;
        this.nombreInput.disabled = false;
        this.jugarBtn.setText('BUSCAR PARTIDA');
        this.jugarBtn.setBackgroundColor('#66bb6a'); // verde claro por defecto
        this.estadoTexto.setText('');
        // Avisar al servidor que este jugador ya no está en cola de búsqueda
        if (mensajeLogin.nombre) {
            window.conexionWS.enviar('/app/cancelar-login', { nombre: mensajeLogin.nombre });
        }
    }

    cancelarCarga() {
        this.cargandoPartida = false;
        this.nombreInput.disabled = false;
        this.cargarBtn.setText('CARGAR PARTIDA');
        this.cargarBtn.setBackgroundColor('#4b7ae5'); // azul por defecto
        this.estadoTexto.setText('');
        // Avisar al servidor que este jugador ya no está esperando carga
        if (mensajeLogin.nombre) {
            window.conexionWS.enviar('/app/cancelar-cargar', { nombre: mensajeLogin.nombre });
        }
    }
    
    normalizarNombre(value) {
        return (value || '').toString().trim().toLowerCase();
    }

    iniciarPartida(nombre, equipo, canal) {
        if (this.startedPartida) {
            return;
        }

        this.startedPartida = true;
        this.awaitingLoginResponse = false;
        gameState.equipo = (equipo || '').toString();
        this.canalPartida = canal;

        if (this.domElements) {
            this.domElements.forEach(element => {
                if (element && element.parentNode) {
                    element.parentNode.removeChild(element);
                }
            });
        }

        //this.scene.stop('menu');
        this.shutdown();
        this.scene.start('partida', { nombre, equipo: gameState.equipo, canal: this.canalPartida });
    }

    // La conexión y suscripción ahora se maneja con ConexionWS en create()
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Enviar mensaje usando ConexionWS // no se usa
    enviarMensage(data) {
        window.conexionWS.enviar('/app/login', data);
    }

    // inputs HTML
    crearNombreInput() {
        const { width, height } = this.cameras.main;

        // input grande y centrado estilo militar
        this.nombreInput = document.createElement('input');
        this.nombreInput.type = 'text';
        this.nombreInput.id = 'nombre';
        this.nombreInput.placeholder = 'INGRESA TU NOMBRE';
        this.nombreInput.maxLength = 20;
        this.nombreInput.style.cssText = `
            position: absolute;
            left: 50%;
            top: 45%;
            width: 320px;
            height: 32px;
            transform: translate(-50%, -40px);
            padding: 6px 10px;
            font-size: 20px;
            font-family: 'Cambria', 'Times New Roman', serif;
            color: #f0f7e0;
            background-color: rgba(10, 30, 10, 0.85);
            border: 3px solid #5a7f3a;
            border-radius: 6px;
            text-align: center;
            text-transform: uppercase;
            outline: none;
            box-shadow: 0 0 12px rgba(0, 0, 0, 0.7);
        `;
        document.body.appendChild(this.nombreInput);

        this.domElements = [this.nombreInput];
    }

    mostrarMensajeError(texto) {
        this.text = this.add.text(960, -30, "  "+texto+"  ", { fontFamily: 'Courier, monospace', fontSize: 40, color: '#ffffff' }).setOrigin(0.5, 0.5);
        this.text.setAlpha(0);
        this.text.setBackgroundColor('#ff00007f');

        this.cadena = this.tweens.chain({
            targets: this.text,
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

    shutdown() {/*
        if (this._rankingPanel)
            this._rankingPanel.destroy();
        if (this.cargarBtn)
            this.cargarBtn.destroy();
        if (this.text)
            this.text.destroy();
        if (this.jugarBtn)
            this.jugarBtn.destroy();
        if (this.rankingText)
            this.rankingText.destroy();
        if (this.rankingTitulo)
            this.rankingTitulo.destroy();

        //this.tweens.removeAll();
        this.tweens.killAll();*/
        if (this.cadena && this.cadena.destroy) {
            this.cadena.destroy();
            this.cadena = null;
        }
        window.conexionWS.desuscribir('/topic/login');
        window.conexionWS.desuscribir('/topic/partida-lista');
        window.conexionWS.desuscribir('/topic/ranking');
        if (this.canalPartida) {
            window.conexionWS.desuscribir(this.canalPartida);
        }
        window.conexionWS.desconectar();
        
        if (this.domElements) {
            this.domElements.forEach(element => {
                if (element && element.parentNode) {
                    element.parentNode.removeChild(element);
                }
            });
        } 
        this.scene.stop('menu');  
    }
}
