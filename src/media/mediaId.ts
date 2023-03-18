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
    },

    normalizeName(name: string): string {
        name = name.replace(/\.([^.]+)$/, "").replace(/[^a-zA-Z0-9\s_\\.\-\(\):]+/g, "").substring(0, 40);
        if (!name) name = "Unnamed file";
        return name;
    }
}