import crypto from 'crypto';

export default {
    generateNewId(): number {
        var id: number;
        id = crypto.randomBytes(4).readInt32BE();
        return id;
    },

    idToBase64(val: number): string {
        let buf = Buffer.allocUnsafe(4);
        buf.writeInt32BE(val);
        return buf.toString('hex');
    },

    base64ToId(val: string): number {
        let buf = Buffer.from(val, 'hex');
        return buf.readInt32BE();
    }
}