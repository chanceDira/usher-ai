import { useCallback, useEffect, useRef, useState } from "react";


import robotImage from "./assets/robot.png";


import pdfToText from "react-pdftotext";

import OpenAIClient from "openai";
import Markdown from "react-markdown";
import { Toaster } from "react-hot-toast";
import Notify from "./utils/Notify";
import type { FormProps } from 'antd';
import { Button, Form, Input } from 'antd';

type FieldType = {
  username?: string;
  password?: string;
  remember?: string;
};




const onFinishFailed: FormProps<FieldType>['onFinishFailed'] = (errorInfo) => {
  console.log('Failed:', errorInfo);
};




function App() {
  const [pdfFile, setPdfFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showAIForm, setShowAIForm] = useState(false)

  const [recordedAudioUrl, setRecordedAudioUrl] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [question, setQuestion] = useState('')
  const [useText, setUseText] = useState(false)
  const [textResponse, setTextResponse] = useState('')
  const [textViewOption, setTextViewOption] = useState(false)
  const [tableResponse, setTableResponse] = useState<null | any>(null)

  const onFinish: FormProps<FieldType>['onFinish'] = (values) => {
    console.log('Success:', values);
    if(values.username == '@asher' && values.password =="Run@123") {
      Notify('Welcome Back Asher !!', 'success')
      setShowAIForm(true)
    } else {
      Notify('Invalid Credentials', 'error')
    }
  };

  const handleFileChange = (files: any) => {
    if (files && files.length > 0) {
      setPdfFile(files[0]);
    } else {
      setPdfFile(null);
    }
  };

  

  const client = new OpenAIClient({
    apiKey: `${import.meta.env.VITE_REACT_OPENAI_API_KEY}`,
    dangerouslyAllowBrowser: true,
  });


  // const handleSummarize = async (e: any) => {
  //   e.preventDefault();
  //   setAudioUrl("");
  //   setIsLoading(true);

  
 
  //   if (pdfFile) {
  //     const pdfData = await pdfToText(pdfFile);
   
  //     const text = pdfData;
 
  //     const model = new OpenAI({
  //       temperature: 0,
  //       openAIApiKey: `${import.meta.env.VITE_REACT_OPENAI_API_KEY}`,
  //     });
  //     const textSplitter = new RecursiveCharacterTextSplitter({
  //       chunkSize: 1000,
  //     });
  //     const docs = await textSplitter.createDocuments([text]);

  //     const chain = loadSummarizationChain(model, { type: "map_reduce" });
  //     const res = await chain.call({
  //       input_documents: docs,
  //     });

  //     console.log(res.text);

  //     const response = await client.audio.speech.create({
  //       model: "tts-1",
  //       voice: "nova",
  //       input: res.text,
  //     });

  //     // console.log("response: ", response);

  //     if (!response.ok) {
  //       throw new Error("Failed to generate audio");
  //     setIsLoading(false);

  //     }


  //     const audioData = await response.blob();
  //     console.log("audioData: ", audioData);

  //     const audioUrl = URL.createObjectURL(audioData);
  //     console.log("audioUrl: ", audioUrl);

  //     setAudioUrl(audioUrl);
  //     setIsLoading(false);
  //   } else {
  //     console.log("No PDF file selected.");
  //     setIsLoading(false);
  //   }
  // };

  const handleSummarize = async (e: any) => {
    e.preventDefault();
    setAudioUrl("");
    setIsLoading(true);
    setTableResponse('')
    setTextResponse('')

    if (pdfFile) {
      // PDF file is selected, proceed with summarization
      try {
        const pdfData = await pdfToText(pdfFile);
        const text = pdfData;

const userRequestTable = question.toLowerCase().includes('table') || question.toLowerCase().includes('tabular');


        
        const completion = await client.chat.completions.create({
          messages: [
            {
              role: "system",
              content: "You are a PDF assistant AI helpful in Summarizing text.",
            },
            { role: "user", content: `

            ${text}

            Based on the above text, answer the following question and make it elaborative.
            N.B: Please use paragraphs and bullets where needed.
            
            ${question}
           
            ` },
          ],
          model: "gpt-3.5-turbo",
          // response_format: { type: "json_object" },
        });

        console.log('summarized: ', completion.choices[0].message.content);
         const questionResponse = completion.choices[0].message.content || '';
        setTextResponse(completion.choices[0].message.content || '')

   
          if (userRequestTable) {
    // Parse response to table structure if requested
    const tableData = parseResponseToTable(questionResponse); // You can define this function to handle parsing logic
    setTableResponse(tableData);
    setIsLoading(false)
    setTextViewOption(true)
    return
  } else {
    setTextResponse(questionResponse);
  }
        const content = completion?.choices[0]?.message?.content || ""; 

             const response = await client.audio.speech.create({
        model: "tts-1",
        voice: "nova",
        input: content
      });

      // console.log("response: ", response);

      if (!response.ok) {
        throw new Error("Failed to generate audio");
      setIsLoading(false);

      }


      const audioData = await response.blob();
      console.log("audioData: ", audioData);

      const audioUrl = URL.createObjectURL(audioData);
      console.log("audioUrl: ", audioUrl);

      setAudioUrl(audioUrl);
      setIsLoading(false);
      // setPdfFile(null);
      setRecordedAudioUrl("");




        // // Ask questions based on the embeddings
        // const questions = ["What is the main idea of the document?", "Can you summarize the document?", "What are the key points in the document?"];
        // const answers = await embeddingsAI.embedQuery(questions, embeddings);

        // // Log the answers
        // console.log("Answers:", answers);

        // // Generate audio from the answers (if needed)...
        // // Set the audio URL (if needed)...

        // setIsLoading(false);
      } catch (error) {
        console.error("Error processing PDF:", error);
        setIsLoading(false);
      }
    } else {
      // PDF file is not selected, prompt user to select a PDF file
      console.log("No PDF file selected.");
      setIsLoading(false);
      // Display a message or UI element to prompt the user to select a PDF file
    }
  };

//   const parseResponseToTable = (response: string) => {
//   // Assuming the response includes something like Markdown or CSV structure, you can parse it here
//   const tableRows = response.split('\n').map(row => row.split('|')); // Example for Markdown table parsing
//   return tableRows;
// };

const parseResponseToTable = (response: string) => {
  const tableRegex = /\|.*\|/g; // Matches table rows starting and ending with "|"
  const tableRows = response.match(tableRegex);

  // If no table found, return null
  if (!tableRows) {
    return null;
  }

  // Extract headers and rows from the matched table content
  const headers = tableRows[0].split('|').filter((header) => header.trim() !== '');
  const rows = tableRows.slice(1).map((row) =>
    row.split('|').filter((cell) => cell.trim() !== '')
  );

  return [headers, ...rows];
};

// Function to remove the table part from the response and return only text (intro and conclusion)
const removeTableFromResponse = (response: string) => {
  const tableRegex = /\|.*\|/g;
  return response.replace(tableRegex, '').trim();
};

  const startRecording = () => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        const recorder = new MediaRecorder(stream);
        setMediaRecorder(recorder);
        recorder.ondataavailable = handleDataAvailable;
        recorder.start();
        setIsRecording(true);
        setQuestion('')
        // Clear the previous audio URL when starting a new recording session
        setRecordedAudioUrl("");
        // Clear the previous audio chunks when starting a new recording session
        setAudioChunks([]);
      })
      .catch((err) => {
        console.error("Error accessing microphone:", err);
      });
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);

    }

    // handlePlayback()
  };

  const handleDataAvailable = (event: BlobEvent) => {
    if (event.data.size > 0) {
      setAudioChunks((prevChunks) => [...prevChunks, event.data]);
    }
  };

  const handlePlayback = async () => {
    if (audioChunks.length > 0) {
      const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
      const audioUrl = URL.createObjectURL(audioBlob);
      setIsRecording(false)
      setRecordedAudioUrl(audioUrl);

      // const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
      const audioFile = new File([audioBlob], "recording.wav");

      try {
        const transcription = await client.audio.transcriptions.create({
          file: audioFile,
          model: "whisper-1",
        });

        console.log("Transcription:", transcription.text);
        setQuestion(transcription.text)
        // Do whatever you want with the transcription, such as displaying it
      } catch (error) {
        console.error("Error transcribing audio:", error);
      }
    }
  };

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSummarize(event);
    }
  }, [handleSummarize]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

 

  return (
    <>
      <Toaster position="top-right" reverseOrder={true} />
    <div className="card flex flex-row  min-h-screen w-full">
      <div className="  fixed hidden md:block w-1/2">
        <img src={robotImage} alt="" className="  min-h-screen" />
      </div>

      <div className={` ${showAIForm && 'hidden'} absolute  pt-16 min-h-screen  right-0 overflow-x-auto w-full gap-8 md:w-1/2 flex flex-col  justify-center items-center`}>
      <div className=" text-6xl text-[#111137] font-bold">Mutijima-AI</div>
      <Form
    name="basic"
    labelCol={{ span: 8 }}
    wrapperCol={{ span: 16 }}
    style={{ maxWidth: 600 }}
    initialValues={{ remember: true }}
    onFinish={onFinish}
    onFinishFailed={onFinishFailed}
    autoComplete="off"
  >
    <Form.Item<FieldType>
      label="Username"
      name="username"
      rules={[{ required: true, message: 'Please input your username!' }]}
    >
      <Input />
    </Form.Item>

    <Form.Item<FieldType>
      label="Password"
      name="password"
      rules={[{ required: true, message: 'Please input your password!' }]}
    >
      <Input.Password />
    </Form.Item>

    {/* <Form.Item<FieldType>
      name="remember"
      valuePropName="checked"
      wrapperCol={{ offset: 8, span: 16 }}
    >
      <Checkbox>Remember me</Checkbox>
    </Form.Item> */}

    <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
      <Button type="primary" htmlType="submit">
        Submit
      </Button>
    </Form.Item>
  </Form>
      </div>
      <div className={` ${!showAIForm && 'hidden'} absolute  pt-16 min-h-screen  right-0 overflow-x-auto w-full gap-8 md:w-1/2 flex flex-col  justify-center items-center`}>
       
        <div className=" fixed bg-white w-1/2 flex  justify-center items-center py-1 shadow-md border-t bottom-0 mt-20 text-gray-500 text-sm italic">
          Designed by <a href="https://www.codiblegroup.com" target="_blank" className=" ml-1">Codible Group </a>
        </div>
        <div className=" text-6xl text-[#111137] font-bold">Mutijima-AI</div>
        <p className=" italic font-light">
          Select a PDF file and get a summary with audio
        </p>

        <div>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => handleFileChange(e.target.files)}
          />
        </div>

        {/* Recorded audio to be added here */}

        <div className=" w-11/12 md:w-3/5 border-2 border-[#111137] h-56 rounded-lg p-0.5">
          <div className=" w-full flex flex-row justify-center">
            <div onClick={() => setUseText(false)} className={`${useText ? '  bg-white text-[#111137]' : ' bg-[#111137] text-white'} rounded-tl-md w-1/2 cursor-pointer flex justify-center items-center py-2`}>
              Audio
            </div>
            <div onClick={() => setUseText(true)} className={` ${useText ? ' bg-[#111137] text-white' : ' bg-white text-[#111137]'} rounded-tr-md w-1/2 cursor-pointer flex justify-center items-center py-2`}>
              Text
            </div>
          </div>

          <div className={`${useText ? 'hidden' : ' '} container flex flex-col justify-center items-center `}>
      <div className="buttons flex flex-row  justify-between items-center w-4/5 mt-6 ">
        <button className={` ${isRecording ? ' bg-red-500' : "bg-green-500"}  px-4 py-2 text-white font-semibold rounded-full text-xs`} onClick={isRecording ? stopRecording : startRecording}>
          {isRecording ? "Stop Recording" : "Start Recording"}
        </button>
        <div className={` ${isRecording ? '' : ' hidden'} bg-red-300 p-1 rounded-full animate-pulse`}>
          <div className=" w-4 h-4 bg-red-500 rounded-full">

          </div>
        </div>
        <button className="bg-green-500 px-4 py-2 text-white font-semibold rounded-full text-xs" onClick={handlePlayback} disabled={audioChunks.length === 0}>
          Confirm Recording
        </button>
      </div>
      <audio ref={audioRef} controls src={recordedAudioUrl} className="mt-4" />
    </div>

    <div className={`${useText ? '' : 'hidden '} flex justify-center items-center`}>
      <textarea name="" id="" value={question} onChange={(e) => setQuestion(e.target.value)}  className=" w-11/12 h-36 mt-5 border p-2 text-sm" placeholder="Type your question...."></textarea>
    </div>



        </div>
  


        <button
          disabled={isLoading}
          onClick={handleSummarize}
          className=" disabled:bg-gray-400 bg-[#111137] cursor-pointer disabled:cursor-not-allowed text-white px-6 py-2 rounded-md"
        >
          {isLoading ? 'Loading' : 'Ask'}
        </button>



        <div className="" onClick={() => setTextViewOption(!textViewOption)}>
          {audioUrl && textResponse ? <div className=" cursor-pointer underline">{textViewOption ? 'Play Audio' : 'View Text'}</div> : <></>}
        </div>

        <div className={`${textViewOption ? 'hidden' : ''}`}>

        {audioUrl && (
          <audio controls>
            <source src={audioUrl} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
        )}
        </div>

        {/* <div className={`${textViewOption ? '' : 'hidden'} w-4/5 text-sm font-light mb-10`}>
         <span className=" font-bold mr-1">Mutijima-AI: </span> <Markdown>{textResponse}</Markdown>
        </div> */}

<div className={`${textViewOption ? '' : 'hidden'} response-container mb-10`}>
  {tableResponse && tableResponse.length > 0 ? (
    <div>
      {/* Regular text (intro and conclusion) */}
      <div className={`w-4/5 text-sm font-light mb-4`}>
        <span className="font-bold mr-1">Mutijima-AI: </span>
        <Markdown>{removeTableFromResponse(textResponse)}</Markdown>
      </div>

      {/* Table structure */}
      <div className="overflow-x-auto mb-4">
        <table className="min-w-full table-auto border-collapse border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              {tableResponse[0].map((header: any, idx: any) => (
                <th key={idx} className="px-4 py-2 border border-gray-200 text-left text-sm font-medium text-gray-700">
                  <Markdown>{header}</Markdown>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableResponse.slice(1).map((row: any, rowIndex: any) => (
              <tr key={rowIndex} className="even:bg-gray-50">
                {row.map((cell: any, cellIndex: any) => (
                  <td key={cellIndex} className="px-4 py-2 border border-gray-200 text-sm text-gray-600">
                    <Markdown>{cell}</Markdown>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  ) : (
    <div className={`${isLoading && 'hidden'} w-4/5 text-sm font-light mb-10`}>
      <span className="font-bold mr-1">Mutijima-AI: </span>
      <Markdown>{textResponse}</Markdown>
    </div>
  )}
</div>

      </div>
    </div>
    </>
  );
}

export default App;
