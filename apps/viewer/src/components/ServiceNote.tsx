import { getOffering } from "@/controllers/nip-105";
import { Event as NostrEvent } from "nostr-tools";

export interface ServiceNoteProps {
  note: NostrEvent<31402>;
}

export function ServiceNote(props: ServiceNoteProps) {
  const { note } = props;

  const offering = getOffering(note);
  if (!offering) {
    return null;
  }

  return (
    <div key={note.id} className="flex flex-col mb-6 p-5 border rounded shadow">
      {/* This container ensures content wrapping */}
      <div className="flex-grow overflow-hidden">
        <p className="text-xs mb-1">ID: {note.id}</p>
        <p className="text-xs mb-5">Author: {note.pubkey}</p>
        <p className="text-xs mb-5">Endpoint: {offering.endpoint}</p>
        <p className="text-xs mb-5">Fixed Cost: {offering.fixedCost}</p>
        <p className="text-xs mb-5">Variable Cost: {offering.variableCost}</p>
        <p className="text-xs mb-5">Cost Units: {offering.costUnits}</p>
        <h3 className="break-words">{note.content}</h3>
      </div>
    </div>
  );
}
