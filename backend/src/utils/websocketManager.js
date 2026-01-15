/**
 * WebSocket Service - ASAA Platform
 * Gère les connexions temps réel et mises à jour instantanées
 */

const WebSocket = require('ws');

class WebSocketManager {
  constructor() {
    this.clients = new Map();
    this.rooms = new Map();
  }

  /**
   * Initialiser le serveur WebSocket
   */
  initialize(server) {
    this.wss = new WebSocket.Server({ server });

    this.wss.on('connection', (ws, req) => {
      const clientId = this.generateClientId();
      
      console.log(`✅ Client connecté: ${clientId}`);

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleMessage(ws, clientId, data);
        } catch (error) {
          console.error(`❌ Erreur parsing WebSocket: ${error.message}`);
        }
      });

      ws.on('close', () => {
        console.log(`❌ Client déconnecté: ${clientId}`);
        this.clients.delete(clientId);
        this.removeClientFromRooms(clientId);
      });

      ws.on('error', (error) => {
        console.error(`❌ Erreur WebSocket: ${error.message}`);
      });

      this.clients.set(clientId, ws);
    });

    console.log('🟢 Serveur WebSocket actif');
  }

  /**
   * Gérer les messages WebSocket
   */
  handleMessage(ws, clientId, data) {
    const { type, room, payload } = data;

    switch (type) {
      case 'JOIN_ROOM':
        this.joinRoom(clientId, room, ws);
        break;
      case 'LEAVE_ROOM':
        this.leaveRoom(clientId, room);
        break;
      case 'QUIZ_UPDATE':
        this.broadcastToRoom(room, 'QUIZ_UPDATE', payload);
        break;
      case 'LEADERBOARD_UPDATE':
        this.broadcastToRoom(room, 'LEADERBOARD_UPDATE', payload);
        break;
      case 'EVENT_CREATED':
        this.broadcastToAll('EVENT_CREATED', payload);
        break;
      case 'USER_JOINED':
        this.broadcastToAll('USER_JOINED', payload);
        break;
      default:
        console.log(`Message inconnu: ${type}`);
    }
  }

  /**
   * Joindre une room
   */
  joinRoom(clientId, room, ws) {
    if (!this.rooms.has(room)) {
      this.rooms.set(room, new Set());
    }
    this.rooms.get(room).add(clientId);

    // Envoyer confirmation
    ws.send(JSON.stringify({
      type: 'ROOM_JOINED',
      room: room,
      message: `Connecté à la room ${room}`
    }));

    console.log(`👥 ${clientId} a rejoint la room ${room}`);
  }

  /**
   * Quitter une room
   */
  leaveRoom(clientId, room) {
    if (this.rooms.has(room)) {
      this.rooms.get(room).delete(clientId);
      if (this.rooms.get(room).size === 0) {
        this.rooms.delete(room);
      }
    }
    console.log(`👤 ${clientId} a quitté la room ${room}`);
  }

  /**
   * Diffuser à une room spécifique
   */
  broadcastToRoom(room, type, payload) {
    if (!this.rooms.has(room)) return;

    const message = JSON.stringify({ type, payload, timestamp: new Date() });
    
    this.rooms.get(room).forEach(clientId => {
      const client = this.clients.get(clientId);
      if (client && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });

    console.log(`📢 Broadcast à room ${room}: ${type}`);
  }

  /**
   * Diffuser à tous les clients
   */
  broadcastToAll(type, payload) {
    const message = JSON.stringify({ type, payload, timestamp: new Date() });
    
    this.clients.forEach((client, clientId) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });

    console.log(`📢 Broadcast global: ${type}`);
  }

  /**
   * Envoyer un message à un client spécifique
   */
  sendToClient(clientId, type, payload) {
    const client = this.clients.get(clientId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type, payload, timestamp: new Date() }));
    }
  }

  /**
   * Retirer un client de toutes les rooms
   */
  removeClientFromRooms(clientId) {
    this.rooms.forEach((clients, room) => {
      if (clients.has(clientId)) {
        clients.delete(clientId);
      }
    });
  }

  /**
   * Générer un ID client unique
   */
  generateClientId() {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Obtenir les statistiques
   */
  getStats() {
    return {
      totalClients: this.clients.size,
      totalRooms: this.rooms.size,
      roomDetails: Array.from(this.rooms.entries()).map(([room, clients]) => ({
        room,
        clientCount: clients.size
      }))
    };
  }
}

module.exports = new WebSocketManager();
