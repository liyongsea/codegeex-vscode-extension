import { codelensProvider } from "../provider/codelensProvider";
import { updateStatusBarItem } from "./updateStatusBarItem";
import { StatusBarItem } from "vscode";
import { localeTag } from "../param/constparams";

export const getGPTCode = (
    candidateList: Array<string>,
    commandid: string,
    myStatusBarItem: StatusBarItem,
    g_isLoading: boolean
) => {
    codelensProvider.clearEls();
    let content = `/* ${localeTag.candidateList} */\n`;
    if (candidateList.length === 0) {
        updateStatusBarItem(
            myStatusBarItem,
            g_isLoading,
            false,
            " No Suggestion"
        );
        return content;
    }
    for (let i = 0; i < candidateList.length; i++) {
        const lineNum = content.split("\n").length;
        if (i === 0) {
            codelensProvider.addEl(lineNum, candidateList[i], commandid);
        } else {
            codelensProvider.addEl(lineNum, candidateList[i], commandid);
        }
        if (candidateList[i][0] === "\n") {
            content += candidateList[i];
        } else {
            content += "\n" + candidateList[i];
        }

        if (
            i <
            candidateList.length - 1 /*&& candidateList[i].slice(-1) != '\n'*/
        )
            content += "\n";
    }
    updateStatusBarItem(myStatusBarItem, g_isLoading, false, " Done");
    return content;
};
