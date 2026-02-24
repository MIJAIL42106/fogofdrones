(function (global) {
    function getSocketCandidates(endpointPath) {
        const customBase = global.FOG_BACKEND_URL || localStorage.getItem('fogBackendUrl');
        const bases = [customBase, global.location.origin, 'http://26.169.248.78:8080']
            .filter(Boolean)
            .map(base => base.replace(/\/$/, ''));

        return [...new Set(bases)].map(base => base + endpointPath);
    }

    class FogWebSocketClient {
        constructor(options = {}) {
            this.endpointPath = options.endpointPath || '/game';
            this.stompClient = null;
            this.connecting = false;
        }

        isConnected() {
            return !!(this.stompClient && this.stompClient.connected);
        }

        connect(callbacks = {}) {
            if (this.isConnected()) {
                if (callbacks.onConnected) {
                    callbacks.onConnected(this.stompClient);
                }
                return;
            }

            if (this.connecting) {
                return;
            }

            const candidates = getSocketCandidates(this.endpointPath);
            this.connecting = true;

            const tryConnect = (index) => {
                if (index >= candidates.length) {
                    this.connecting = false;
                    if (callbacks.onError) {
                        callbacks.onError(new Error('No se pudo conectar al servidor'));
                    }
                    return;
                }

                const socket = new SockJS(candidates[index]);
                const stompClient = Stomp.over(socket);
                stompClient.debug = null;

                stompClient.connect({}, () => {
                    this.stompClient = stompClient;
                    this.connecting = false;
                    if (callbacks.onConnected) {
                        callbacks.onConnected(this.stompClient);
                    }
                }, () => {
                    tryConnect(index + 1);
                });
            };

            tryConnect(0);
        }

        subscribe(destination, handler) {
            if (!this.isConnected()) {
                return null;
            }

            return this.stompClient.subscribe(destination, handler);
        }

        send(destination, body, headers = {}) {
            if (!this.isConnected()) {
                return false;
            }

            this.stompClient.send(destination, headers, body);
            return true;
        }

        disconnect() {
            if (this.isConnected()) {
                this.stompClient.disconnect();
            }
            this.stompClient = null;
            this.connecting = false;
        }
    }

    global.createFogWebSocketClient = function (options) {
        return new FogWebSocketClient(options);
    };
})(window);