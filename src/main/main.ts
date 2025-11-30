import { app, BrowserWindow } from "electron/main";
import path from "path";
import {initializeDatabase} from "../database";
import type {Result} from '../shared/types';
import {Ok, Err, unwrap} from "../shared/types";
import type {Database} from "../database";

let mainWindow: BrowserWindow | null = null;
let db: Database | null = null;

function createWindow () {
   mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    })

    if (process.env.NODE_ENV === "development") {
        mainWindow.loadURL("http://localhost:5173")
    }
    mainWindow.loadFile(path.join('./../../dist/index.html'))
}

app.whenReady().then(() => {
    createWindow();
    db = unwrap(initializeDatabase());

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
