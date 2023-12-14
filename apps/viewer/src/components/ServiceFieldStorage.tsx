import { OfferingContent } from "nip105";
import React, { useState } from "react";
import { Invoice } from "utils";
import { requestProvider } from "webln";

export interface ServiceFieldStorageProps {
  offering: OfferingContent;
}

export function ServiceFieldStorage(props: ServiceFieldStorageProps) {
  const { offering } = props;
  const [input, setInput] = useState<File | null>();
  const [responses, setResponses] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (event: any) => {
    const file = event.target.files && event.target.files[0];
    if(file){
      const maxSize = file.size / (5*1024); // convert size to MB
      if (maxSize > 1) {
        alert("File size must be under 5 kB");
      } else {
        setInput(file);
      }
    }
  };

  const handleSubmit = async (event: any) => {
    event.preventDefault();


    if(!input) return;
    if(loading) return;
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", input);

      const request = await fetch(offering.endpoint, {
        method: "POST",
        body: formData,
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
              const answer = (resultResponse as any).files[0].fileUrl;

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
      setInput(null);
      setLoading(false);
    }
  };

  return (
    <div className="border rounded p-4 mt-5">
      <p className=" font-bold">File Storage</p>
      <div className="mb-4 mt-10">
        {/* Display ChatGPT questions and responses */}
        {responses.map((response, index) => (
          <div key={index} className="mb-2">
            <a href={response}>
              {response}
            </a>
          </div>
        ))}
      </div>
      <div className="flex items-center">
        <input
          name="file"
          type="file"
          onChange={handleInputChange}
          className="flex-grow border rounded p-2 mr-2 bg-black text-white"
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
