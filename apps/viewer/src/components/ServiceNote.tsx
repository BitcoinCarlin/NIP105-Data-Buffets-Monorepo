import { Event as NostrEvent } from "nostr-tools";
import { ServiceFieldChatGPT } from "./ServiceFieldChatGPT";
import {
  OfferingContent,
  ServiceType,
  getOffering,
  getServiceType,
} from "nip105";
import { ServiceFieldStableDiffusion } from "./ServiceFieldStableDiffusion";

export interface ServiceNoteProps {
  note: NostrEvent<31402>;
}

export function ServiceNote(props: ServiceNoteProps) {
  const { note } = props;

  const offering = getOffering(note);
  if (!offering) {
    return null;
  }

  const renderInput = (offering: OfferingContent) => {
    switch (getServiceType(offering)) {
      case ServiceType.chatGPT:
        return <ServiceFieldChatGPT offering={offering} />;
      case ServiceType.stableDiffusion:
        return <ServiceFieldStableDiffusion offering={offering} />;

      default:
        return null;
    }
  };

  return (
    <div key={note.id} className="flex flex-col mb-6 p-5 border rounded shadow">
      {/* This container ensures content wrapping */}
      <div className="flex-grow overflow-hidden">
        <p className="text-xs mb-3">ID: {note.id}</p>
        <p className="text-xs mb-3">Author: {note.pubkey}</p>
        <p className="text-xs mb-3">Endpoint: {offering.endpoint}</p>
        <p className="text-xs mb-3">Fixed Cost: {offering.fixedCost}</p>
        <p className="text-xs mb-3">Variable Cost: {offering.variableCost}</p>
        <p className="text-xs mb-3">Cost Units: {offering.costUnits}</p>
        <p className="text-xs mb-5">
          Last Updated: {new Date(note.created_at * 1000).toISOString()}
        </p>
        <h3 className="break-words">{note.content}</h3>
        {renderInput(offering)}
      </div>
    </div>
  );
}
