import { OfferingContent } from "nip105";
import React, { useState } from "react";
import { Invoice } from "utils";
import { requestProvider } from "webln";

export interface ServiceFieldChatGPTProps {
  offering: OfferingContent;
}

export function ServiceFieldChatGPT(props: ServiceFieldChatGPTProps) {
  const { offering } = props;
  const [input, setInput] = useState("");
  const [responses, setResponses] = useState<String[]>([]);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (event: any) => {
    setInput(event.target.value);
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
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: input,
          },
        ],
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
      let checkCount = 5;
      while(checkCount--) {
      
        console.log("Checking for result");
          const result = await fetch(`${offering.endpoint}/${invoice.paymentHash}/get_result`, {
              method: 'GET',
              headers: {
                  'Content-Type': 'application/json',
              },
          });
      
          if(result.status === 200) {
              const resultResponse = await result.json();
              const answer = (resultResponse as any).choices[0].message.content;

              setResponses((oldResponses) => {
                return [...oldResponses, answer];
              });

              break;
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
      <p className=" font-bold">ChatGPT</p>
      <div className="mb-4 mt-10">
        {/* Display ChatGPT questions and responses */}
        {responses.map((response, index) => (
          <div key={index} className="mb-2">
            <p>
              {(index + 1) % 2 ? "Q: " : "A: "} {response}
            </p>
          </div>
        ))}
      </div>
      <div className="flex items-center">
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          className="flex-grow border rounded p-2 mr-2 bg-black text-white"
          placeholder="Type your question"
        />
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
