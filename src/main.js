import "./style.css";
import "highlight.js/styles/atom-one-dark.min.css";
import Dropzone from "dropzone";
import { jsonrepair } from "jsonrepair";
import NestJsonToDto from "./nest-json-to-dto";

import hljs from "highlight.js/lib/core";
import typescript from "highlight.js/lib/languages/typescript";

hljs.registerLanguage("typescript", typescript);
hljs.highlightAll();

const editor = document.querySelector("#editor");
const output = document.querySelector("#output pre code");

function generateDto(rawInput) {
	try {
		const fixJson = jsonrepair(rawInput);
		const jsonBody = JSON.parse(fixJson);

		const nestDto = NestJsonToDto.setBody(jsonBody).generate();

		output.textContent = nestDto;

		output.removeAttribute("data-highlighted");
		hljs.highlightAll();
	} catch (error) {
		output.textContent = error;
	}
}

editor.addEventListener("input", () => {
	generateDto(editor.value);
});

document.addEventListener("DOMContentLoaded", () => {
	Dropzone.autoDiscover = false;
	const myDropzone = new Dropzone("div#dropzone", {
		url: "javascript:void(0)",
		createImageThumbnails: false,
		autoProcessQueue: false,
		acceptedFiles: "application/json,.json",
		disablePreviews: true,
	});
	myDropzone.on("addedfile", (file) => {
		if (file.type === "application/json") {
			const reader = new FileReader();
			reader.onload = () => {
				try {
					generateDto(reader.result);
					editor.textContent = reader.result;
				} catch (error) {
					output.textContent = error;
				}
			};
			reader.readAsText(file);
		} else {
			output.textContent = `File ${file.name} of type ${file.type} can not be processed`;
		}
	});
});

const codeBlocks = document.querySelectorAll("pre code");
codeBlocks.forEach((codeBlock) => {
	codeBlock.addEventListener("click", () => {
		selectText(codeBlock);
	});
});
function selectText(element) {
	const range = document.createRange();
	range.selectNodeContents(element);
	const selection = window.getSelection();
	selection.removeAllRanges();
	selection.addRange(range);
}
