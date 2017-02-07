/**
 * Created by gjrwcs on 2/7/2017.
 */

export class Message {
    protected static autoIncrementId: number = 0;

    public name: string;
    public msg: string;

    private id: number;

    constructor(msg: string, name: string = 'server') {
        this.name = name;
        this.msg = msg;
        this.id = Message.autoIncrementId++;
    }
}

export class ClientMessage extends Message {

    public clientId: number;

    constructor(params: {
        name: string,
        msg: string,
        clientId: number
    }) {
        super(params.msg, params.name);

        if (params) {
            Object.assign(this, params);
        }
    }
}