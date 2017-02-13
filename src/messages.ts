/**
 * Created by gjrwcs on 2/7/2017.
 */

export enum MessageStatus {
    Sent = 1,
    Delivered,
    Seen,
    Failed,
}

export class Message {
    protected static autoIncrementId: number = 0;

    public name: string;
    public msg: string;

    private id: number;
    private status: MessageStatus;

    constructor(msg: string, name: string = 'server') {
        this.name = name;
        this.msg = msg;
        this.id = Message.autoIncrementId++;
        this.status = MessageStatus.Sent;
    }

    public getId(): number {
        return this.id;
    }

    public setStatus(status: MessageStatus): void {
        this.status = status;
    }
}

export class ClientMessage extends Message {

    public clientId: number;

    constructor(params: {
        name: string,
        msg: string,
        clientId: number,
    }) {
        super(params.msg, params.name);

        if (params) {
            Object.assign(this, params);
        }
    }
}
