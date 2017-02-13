/// <reference path="../node_modules/@types/node/index.d.ts" />
/**
 * Created by gjrwcs on 2/7/2017.
 */

import {ClientMessage, Message, MessageStatus} from './messages';
import * as fs from 'fs';
import * as Http from 'http';
import {Server} from 'net';
import Socket = SocketIO.Socket;
import * as socketio from 'socket.io';

const port: number = parseInt(process.env.PORT || process.env.NODE_PORT || 3000, 10);

// read the client file into memory
const index: Buffer = fs.readFileSync(`${__dirname}/../client/client.html`);
const messages: Buffer = fs.readFileSync(`${__dirname}/../src/messages.js`);

const onRequest = (request: Http.IncomingMessage, response: Http.ServerResponse): void => {
    switch (request.url) {
        case '/':
        case '/client.html':
            response.writeHead(200, {'Content-Type': 'text/html'});
            response.write(index);
            return response.end();
        case '/messages.js':
            response.writeHead(200, {'Content-Type': 'text/javascript'});
            response.write(messages);
            return response.end();
        default:
            response.writeHead(404);
            return response.end('File not found');
    }
};

const app: Server = Http.createServer(onRequest).listen(port);
const io = socketio(app);

class ChatServer {
    private connections: User[];
    private messages: Message[];
    private roomName: string = 'room1';

    constructor() {
        this.connections = [];
        this.messages = [];
    }

    public registerConnection(socket) {
        this.connections.push(new User(socket, this));
    }

    public getMessage(id: number): Message {
        let msg: Message = null;
        // console.log(JSON.stringify(this.messages, null, 2));
        for (let i: number = this.messages.length - 1; i >= 0; i--) {
            if (this.messages[i].getId() === id) {
                msg = this.messages[i];
                break;
            }
        }

        return msg;
    }

    public getRoom(): string {
        return this.roomName;
    }

    public getUserCount(): number {
        return this.connections.length;
    }

    public getHistory(): Message[] {
        return this.messages;
    }

    public sendMessage(message: Message) {
        this.messages.push(message);
        io.sockets.in(this.roomName).emit('msg', message);
    };

    /**
     * Removes a user from the room and indicates if there were successfully removed
     * @param targetUser
     * @returns {boolean}
     */
    public removeUser(targetUser: User): boolean {
        return this.connections.some((user: User, i: number) => {
            if (targetUser === user) {
                this.connections.splice(i, 1);
                return true;
            }

            return false;
        });
    }
}

class User {

    private socket: Socket;
    private name: string;
    private room: string;
    private server: ChatServer;

    constructor(socket: Socket, server: ChatServer) {
        this.server = server;
        this.socket = socket;

        socket.on('join', this.onJoin.bind(this));
        socket.on('msg', this.onMsg.bind(this));
        socket.on('disconnect', this.onDisconnect.bind(this));
        socket.on('delivered', this.onDelivered.bind(this));
    }

    private onJoin(data) {
        const joinMsg = new Message(`There are ${this.server.getUserCount()} users online`);
        const room = this.server.getRoom();

        this.name = data.name;
        this.socket.emit('msg', joinMsg);
        this.socket.join(room);

        // announcement to all users
        const response = new Message(`${this.name} has joined the room.`);

        this.socket.broadcast.to(room).emit('msg', response);

        console.log(`${this.name} joined`);
        this.socket.emit('msg', new Message(`You joined ${room}`));
        this.socket.emit('history', this.server.getHistory());

    }

    private onDelivered(data): void {
        console.log(`message ${data.id} was delivered`);
        if (data.name === 'server') {
            return;
        }

        server.getMessage(data.id).setStatus(MessageStatus.Delivered);
        this.socket.broadcast.to(this.server.getRoom()).emit('delivered', data);
    }

    private onMsg(data) {
        console.log(`received message from ${this.name}`);
        const message =  new ClientMessage({msg: data.msg, clientId: data.clientId, name: this.name});
        server.sendMessage(message);
        // this.socket.broadcast.to(this.server.getRoom()).emit('msg', message);
        // this.socket.emit('msg', message);
    }

    private onDisconnect(data) {
        this.server.removeUser(this);
        this.socket.broadcast.to(this.server.getRoom()).emit('msg', new Message(`${this.name} has left the room`));
    }
}

const server = new ChatServer();
io.sockets.on('connection', (e) => server.registerConnection(e));
console.log('Websocket server init');
