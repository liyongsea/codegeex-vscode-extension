import axios from "axios";
import * as https from "https";
import * as vscode from "vscode";
import { temp, topp, topk, generationPreference } from "../param/configures";
import { getEndData, getStartData } from "./statisticFunc";

export type GetCodeCompletions = {
    completions: Array<string>;
    commandid: string;
};

export function getCodeCompletions(
    prompt: string,
    num: Number,
    lang: string,
    apiKey: string,
    apiSecret: string,
    mode: string
): Promise<GetCodeCompletions> {
    let API_URL = "";
    if (mode === "prompt") {
        API_URL = `https://tianqi.aminer.cn/api/v2/multilingual_code_generate_block`;
    } else if (mode === "interactive") {
        API_URL = `https://tianqi.aminer.cn/api/v2/multilingual_code_generate_adapt`;
    } else {
        if (generationPreference === "line by line") {
            API_URL = `https://tianqi.aminer.cn/api/v2/multilingual_code_generate`;
        } else {
            API_URL = `https://tianqi.aminer.cn/api/v2/multilingual_code_generate_adapt`;
        }
    }
    return new Promise(async (resolve, reject) => {
        let n = 0;
        if (prompt.length <= 300) {
            n = 3;
        } else if (prompt.length > 600 && prompt.length <= 900) {
            n = 2;
        } else if (prompt.length > 900 && prompt.length <= 1200) {
            n = 1;
        } else if (prompt.length > 1200) {
            prompt = prompt.slice(prompt.length - 1200);
            n = 1;
        }
        let payload = {};
        if (lang.length == 0) {
            payload = {
                prompt: prompt,
                n: num,
                apikey: apiKey,
                apisecret: apiSecret,
                temperature: temp,
                top_p: topp,
                top_k: topk,
            };
        } else {
            payload = {
                lang: lang,
                prompt: prompt,
                n: num,
                apikey: apiKey,
                apisecret: apiSecret,
                temperature: temp,
                top_p: topp,
                top_k: topk,
            };
        }
        const agent = new https.Agent({
            rejectUnauthorized: false,
        });
        let editor = vscode.window.activeTextEditor;
        let document = editor?.document;
        let lastLine = document?.lineAt(document.lineCount - 1);
        let endPosition = lastLine?.range.end;
        let inputText;
        if (endPosition) {
            let input =
                new vscode.Selection(
                    0,
                    0,
                    endPosition.line,
                    endPosition.character
                ) || new vscode.Selection(0, 0, 0, 0);
            inputText = document?.getText(input) || "";
        } else {
            inputText = prompt;
        }
        console.log(inputText);
        let commandid: string;
        try {
            commandid = await getStartData(inputText, prompt, lang, mode);
        } catch (err) {
            console.log(err);
            commandid = "";
        }
        try {
            axios
                .post(API_URL, payload, { httpsAgent: agent, timeout: 120000 })
                .then(async (res) => {
                    console.log(res);
                    if (res?.data.status === 0) {
                        let codeArray = res?.data.result.output.code;
                        const completions = Array<string>();
                        for (let i = 0; i < codeArray.length; i++) {
                            const completion = codeArray[i];
                            let tmpstr = completion;
                            if (tmpstr.trim() === "") continue;

                            completions.push(completion);
                        }
                        resolve({ completions, commandid });
                    } else {
                        console.log(res);
                        try{
                            
                            await getEndData(commandid, res.data.message, "No");
                        }catch(err){
                            console.log(err);
                        }
                            
                        reject(res.data.message);
                    }
                })
                .catch((err) => {
                    reject(err);
                });
        } catch (e) {
            reject(e);
        }
    });
}
