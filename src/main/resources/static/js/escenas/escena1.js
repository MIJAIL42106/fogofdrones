gameState = {       // va a almacenar el estado del juego
                        // o variables/informacion que necesitamos pasar entre funciones, mejor opcion que globales
        colorVerde: 0xaaffaa,
        colorRojo: 0xffaaaa
    };  

class escena1 extends Phaser.Scene {

    constructor() {
        super({key: "chat"});  // nombre
    }
    preload() {
    }

    create() { 
        const { width, height } = this.cameras.main;
        this.cameras.main.setBackgroundColor('#1a1a2e');

        this.add.text(width / 2, 50, 'CHAT', {
            fontSize: '48px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.messageY = 150; // Posición Y mensajes
        this.messages = []; // Array mensajes

        this.createChatInputs();
        this.connectWebSocket();
    
        const backButton = this.add.text(50, height - 50, '← Volver al Juego', {
            fontSize: '24px',
            color: '#ffffff',
            backgroundColor: '#667eea',
            padding: { x: 20, y: 10 }
        })
        .setInteractive({ useHandCursor: true });

        backButton.on('pointerdown', () => {
            if (this.domElements) {
                this.domElements.forEach(element => {
                    if (element && element.parentNode) {
                        element.parentNode.removeChild(element);
                    }
                });
            }
            this.scene.stop('chat');
            this.scene.start('tablero'); // Cambiar a tu escena principal
        });
    }

    // inputs HTML
    createChatInputs() {
        const { width } = this.cameras.main;

        // input
        this.usernameInput = document.createElement('input');
        this.usernameInput.type = 'text';
        this.usernameInput.id = 'chat-username';
        this.usernameInput.placeholder = 'Tu nombre';
        this.usernameInput.maxLength = 20;
        this.usernameInput.style.cssText = `
            position: absolute;
            left: 50px;
            bottom: 120px;
            width: 200px;
            padding: 10px;
            font-size: 16px;
            border: 2px solid #667eea;
            border-radius: 5px;
        `;
        document.body.appendChild(this.usernameInput);

        // input
        this.messageInput = document.createElement('input');
        this.messageInput.type = 'text';
        this.messageInput.id = 'chat-message';
        this.messageInput.placeholder = 'Escribe tu mensaje...';
        this.messageInput.maxLength = 100;
        this.messageInput.style.cssText = `
            position: absolute;
            left: 50px;
            bottom: 60px;
            width: 500px;
            padding: 10px;
            font-size: 16px;
            border: 2px solid #667eea;
            border-radius: 5px;
        `;
        document.body.appendChild(this.messageInput);

        // boton
        this.sendButton = document.createElement('button');
        this.sendButton.textContent = 'Enviar';
        this.sendButton.style.cssText = `
            position: absolute;
            left: 570px;
            bottom: 60px;
            padding: 10px 30px;
            font-size: 16px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        `;
        document.body.appendChild(this.sendButton);

        // boton
        this.sendButton.addEventListener('click', () => {
            this.sendMessage();
        });
        // enter
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        this.domElements = [this.usernameInput, this.messageInput, this.sendButton];
    }

    connectWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        
         this.socket = new WebSocket('ws://localhost:8080/game'); // http://26.169.248.78:8080/game

        // al recivir
        this.socket.onmessage = (event) => {
            this.addMessage(event.data);
        };
    }

    sendMessage() {
        const username = this.usernameInput.value.trim();
        const message = this.messageInput.value.trim();

        if (!username) {
            alert('falta nombre');
            return;
        }

        if (!message) {
            alert('falta mensaje');
            return;
        }

       if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            const fullMessage = `${username}: ${message}`;
            this.socket.send(fullMessage);
            this.messageInput.value = '';
        } else {
            alert('No servidor');
        }
    }

    addMessage(text) {
        const messageText = this.add.text(100, this.messageY, text, {
            fontSize: '18px',
            color: '#ffffff',
            backgroundColor: '#333333',
            padding: { x: 10, y: 5 },
            wordWrap: { width: 1200 }
        });
        this.messages.push(messageText);
        this.messageY += 35;

        if (this.messages.length > 20) {
            const oldMessage = this.messages.shift();
            oldMessage.destroy();

            this.messages.forEach(msg => {
                msg.y -= 35;
            });

            this.messageY -= 35;
        }
    }

    shutdown() {
        // Cerrar WebSocket
        if (this.socket) {
            this.socket.close();
        }
        if (this.domElements) {
            this.domElements.forEach(element => {
                if (element && element.parentNode) {
                    element.parentNode.removeChild(element);
                }
            });
        }
    }
}
