import { SimplePool, Event as NostrEvent, generatePrivateKey } from "nostr-tools";



export async function getPrivateKey(privateKeyPath: string): Promise<string>{
    const privateKeyFile = Bun.file(privateKeyPath); 
    if(await privateKeyFile.exists() && await privateKeyFile.text()){
        return await privateKeyFile.text();
    }

    const privateKey = generatePrivateKey();
    await Bun.write(privateKeyPath, privateKey);

    return privateKey;
}

export async function postServices(pool: SimplePool, relays: string[], events: NostrEvent[]): Promise<void> {
    // console.log(events);
}