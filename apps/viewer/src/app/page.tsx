
'use client';
import { useEffect, useState } from 'react';
import { SimplePool, Event as NostrEvent } from 'nostr-tools';
import { WebLNProvider, requestProvider } from 'webln';
import { ServiceNote } from '@/components/ServiceNote';
import { getTagValue } from 'nip105';

const RELAYS = [
  'wss://dev.nostrplayground.com'
];

export default function Home() {
  // ------------------- STATES -------------------------
  const [pool, setPool] = useState<SimplePool | null>();
  const [nostr, setNostr] = useState<any | null>(null);
  const [webln, setWebln] = useState<null | WebLNProvider>(null);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [rawNotes, setRawNotes] = useState<{ [key: string]: NostrEvent<31402> }>({});

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

    const day = 60 * 60 * 24;
    const yesterday = Math.floor((Date.now() / 1000)) - day
    const tomorrow = yesterday + 2 * day;

    const sub = pool.sub(RELAYS, [
      {
        kinds: [31402],
        since: yesterday,
        until: tomorrow,
      }
    ]);

    sub.on('event', (note) => {
      
      const dTag = getTagValue(note, 'd');
      if(!dTag) return;

      setRawNotes((oldNotes)=>{
        return {
          ...oldNotes,
          [note.pubkey + dTag]: note
        }
      })
    });

    return () => {
      sub.unsub();
      pool.close(RELAYS);
    }
  }, [])

  const renderNotes = () => {
    // Convert the rawNotes object into an array of its values
    const notesArray = Object.values(rawNotes);
  
    // Check if the array is empty
    if (notesArray.length === 0) {
      return <p>No Notes</p>;
    }
  
    // Render the array of notes
    return (
      <div className="w-full mt-4">
        {notesArray.map((note) => <ServiceNote note={note} key={note.id} />)}
      </div>
    );
  }


  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      {renderNotes()}
    </main>
  )
}


