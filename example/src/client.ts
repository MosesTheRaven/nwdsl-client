import { listen, MessageConnection } from 'vscode-ws-jsonrpc';
import {
    MonacoLanguageClient, CloseAction, ErrorAction,
    MonacoServices, createConnection
} from 'monaco-languageclient';
import normalizeUrl = require('normalize-url');
const ReconnectingWebSocket = require('reconnecting-websocket');


// register Monaco languages
monaco.languages.register({
    id: 'nwdsl',
    extensions: ['.nwdsl'],
    aliases: ['Network DSL', 'NwDSL']
})

// create Monaco editor
const value = `{//empty so far}`;
const editor = monaco.editor.create(document.getElementById("container")!, {
    model: monaco.editor.createModel(value, 'nwdsl', monaco.Uri.parse('file:///C:/work/vs-code_ls/workspace/n1')),
    glyphMargin: true,
    theme: "vs-dark",
    lightbulb: {
        enabled: true
    }
});

// install Monaco language client services
MonacoServices.install(editor,{rootUri: "file:///C:/work/vs-code_ls/workspace/n1"});

// create the web socket
const url = createUrl('wss://127.0.0.1:5008/nwdsl')
const webSocket = createWebSocket(url);
// listen when the web socket is opened
listen({
    webSocket,
    onConnection: connection => {
        // create and start the language client
        const languageClient = createLanguageClient(connection);
        const disposable = languageClient.start();
        connection.onClose(() => disposable.dispose());
    }
});

function createLanguageClient(connection: MessageConnection): MonacoLanguageClient {
    return new MonacoLanguageClient({
        name: "Sample NetworkDSL  Client",
        clientOptions: {
            // use a language id as a document selector
            documentSelector: ['nwdsl'],
            // disable the default error handler
            errorHandler: {
                error: () => ErrorAction.Continue,
                closed: () => CloseAction.DoNotRestart
            }
        },
        // create a language client connection from the JSON RPC connection on demand
        connectionProvider: {
            get: (errorHandler, closeHandler) => {
                return Promise.resolve(createConnection(connection, errorHandler, closeHandler))
            }
        }
    });
}

function createUrl(path: string): string {
    return normalizeUrl(path);
}

function createWebSocket(url: string): WebSocket {
    const socketOptions = {
        maxReconnectionDelay: 10000,
        minReconnectionDelay: 1000,
        reconnectionDelayGrowFactor: 1.3,
        connectionTimeout: 10000,
        maxRetries: Infinity,
        debug: false
    };
    return new ReconnectingWebSocket(url, [], socketOptions);
}