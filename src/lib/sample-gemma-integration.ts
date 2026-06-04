import {
  AutoProcessor,
  Gemma4ForConditionalGeneration,
  load_image,
  read_audio,
  type Tensor,
  TextStreamer,
} from "@huggingface/transformers";

// Load processor and model
const model_id = "onnx-community/gemma-4-E2B-it-ONNX";
const processor = await AutoProcessor.from_pretrained(model_id);
const model = await Gemma4ForConditionalGeneration.from_pretrained(model_id, {
  dtype: "q4f16",
  device: "webgpu",
  progress_callback: (info) => {
    if (info.status === "progress_total") {
      // console.log(`Loading model: ${info.progress}%`);
    }
  },
});

// Prepare prompt
const messages = [
  {
    role: "user",
    content: [
      { type: "image" },
      { type: "audio" },
      {
        type: "text",
        text: "Describe this image in detail and transcribe this audio verbatim.",
      },
    ],
  },
];
const prompt = processor.apply_chat_template(messages, {
  enable_thinking: false,
  add_generation_prompt: true,
} as Parameters<typeof processor.apply_chat_template>[1]);

// Prepare inputs
const image = await load_image(
  "https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/artemis.jpeg",
);
const audio = await read_audio(
  "https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/jfk.wav",
  processor.feature_extractor?.config.sampling_rate ?? 16000,
);
const inputs = await processor(prompt, image, audio, {
  add_special_tokens: false,
});

// Generate output
const outputs = await model.generate({
  ...inputs,
  max_new_tokens: 512,
  do_sample: false,
  streamer: new TextStreamer(processor.tokenizer!, {
    skip_prompt: true,
    skip_special_tokens: false,
    // callback_function: (text) => { /* Do something with the streamed output */ },
  }),
});

// Decode output
const decoded = processor.batch_decode(
  (outputs as Tensor).slice(null, [inputs.input_ids.dims.at(-1), null]),
  { skip_special_tokens: true },
);
console.log(decoded[0]);
