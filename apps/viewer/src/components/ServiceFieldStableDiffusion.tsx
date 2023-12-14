import { OfferingContent } from "nip105";
import React, { useState } from "react";
import { Invoice } from "utils";
import { requestProvider } from "webln";

export interface ServiceFieldStableDiffusionProps {
  offering: OfferingContent;
}

const MODELS = [
  'anything-v3',
  'sdxlceshi',
  'sdxl'
];

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function ServiceFieldStableDiffusion(props: ServiceFieldStableDiffusionProps) {
  const { offering } = props;
  const [input, setInput] = useState("");
  const [modelID, setModelID] = useState('anything-v3');
  const [responses, setResponses] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (event: any) => {
    setInput(event.target.value);
  };

  const handleModelChange = (event: any) => {
    setModelID(event.target.value);
  };

  const handleSubmit = async (event: any) => {
    event.preventDefault();

    if(loading) return;
    setLoading(true);

    setInput("");
    setResponses((oldResponses) => {
      return [...oldResponses, input];
    });

    try {
      const requestBody = {
        // enhance_prompt: 'no',
        prompt: input,
        model_id: modelID,
      };
  
      const request = await fetch(offering.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const invoice = await request.json() as Invoice;
      const webln = await requestProvider();

      if(!webln){ 
        alert("Please download Alby or ZBD to use this app.");
        return;
      }

      const paymentRequest = await webln.sendPayment(invoice.paymentRequest.pr);
      let checkCount = 50;
      while(checkCount--) {
      
        console.log("Checking for result");
          const result = await fetch(`${offering.endpoint}/${invoice.paymentHash}/get_result`, {
              method: 'GET',
              headers: {
                  'Content-Type': 'application/json',
              },
          });
      
          if(result.status === 500) {
            throw new Error("Server error");
          } else if(result.status === 200) {
              const resultResponse = await result.json();
              const answer = (resultResponse as any).output[0];

              setResponses((oldResponses) => {
                return [...oldResponses, answer];
              });
              break;
          } else {
            await sleep(2000)
          }
      }

    } catch (e){
      console.error(e);
      alert(`Error using service ${e}`)
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border rounded p-4 mt-5">
      <p className=" font-bold">Stable Diffusion</p>
      <div className="mb-4 mt-10">

        {responses.map((response, index) => (
          <div key={index} className="mb-2">
            {(index + 1) % 2 ? 
              <p>{response}</p> :
              <img src={response}/>
            }
          </div>
        ))}
      </div>
      <div className="flex items-center">
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          className="flex-grow border rounded p-2 mr-2 bg-black text-white"
          placeholder="Type your prompt"
        />
        <select
          value={modelID}
          onChange={handleModelChange}
          className="border rounded p-2 mr-2 bg-black text-white"
        >
          {
            MODELS.map((model) => (
              <option value={model}>{model}</option>
            ))
          }
        </select>
        <button
          onClick={handleSubmit}
          className="text-white hover:text-stone-300 font-bold py-2 px-4 rounded"
        >
          { loading ? "Loading..." : "Submit"}
        </button>
      </div>
    </div>
  );
}
