// import { button } from "./solidBackground"
import {ref, onMounted, reactive} from 'vue';

export function useStore()
{
    const buttonInfo:any = reactive([]);

    buttonInfo.push({
        x: 0,
        y: 0,
        width: 100,
        height: 30,
        text:'button1',
    });

    buttonInfo.push({
        x: 0,
        y: 100,
        width: 100,
        height: 30,
        text:'button2',
    });

    buttonInfo.push({
        x: 200,
        y: 200,
        width: 100,
        height: 30,
        text:'button3',
    });

    return buttonInfo;
}