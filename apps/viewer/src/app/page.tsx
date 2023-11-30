
'use client';
import { useEffect, useState } from 'react';
import { SimplePool, Event as NostrEvent } from 'nostr-tools';
import { WebLNProvider, requestProvider } from 'webln';
import { ServiceNote } from '@/components/ServiceNote';

const RELAYS = [
  'wss://dev.nostrplayground.com'
];

export default function Home() {
  // ------------------- STATES -------------------------
  const [pool, setPool] = useState<SimplePool | null>();
  const [nostr, setNostr] = useState<any | null>(null);
  const [webln, setWebln] = useState<null | WebLNProvider>(null);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [rawNotes, setRawNotes] = useState<NostrEvent<31402>[]>([]);

  // ------------------- EFFECTS -------------------------

  useEffect(() => {
    requestProvider()
      .then(setWebln)
      .catch((e) => {
        alert("Please download Alby or ZBD to use this app.");
      });
  }, []);

  useEffect(() => {
    if ((window as any).nostr) {
      setNostr((window as any).nostr);
      (window as any).nostr.getPublicKey().then(setPublicKey);
    } else {
      alert("Nostr not found");
    }
  }, []);

  useEffect(() => {
    const pool = new SimplePool();
    setPool(pool);

    const sub = pool.sub(RELAYS, [
      {
        kinds: [31402]
      }
    ]);

    sub.on('event', (note) => {
      setRawNotes((notes) => [...notes, note]);
    });

    return () => {
      sub.unsub();
      pool.close(RELAYS);
    }
  }, [])

  const renderNotes = () => {

    if(!rawNotes.length) {
      return <p>No Notes</p>
    }

    return <div className="w-full mt-4">
      {rawNotes.map((note)=> <ServiceNote note={note}/>)}
    </div>

  }


  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      {renderNotes()}
    </main>
  )
}
